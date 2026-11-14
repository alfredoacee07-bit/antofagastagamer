/* =====================================================================
   trayectorias.js — Planificador del viaje (fecha y tipo de trayectoria)
   ---------------------------------------------------------------------
   Usa las posiciones reales de js/datos/trayectorias.js (NASA JPL Horizons).
   Para cada mes de lanzamiento calcula:
     extra      → km/s EXTRA que debe dar el cohete (0 = la mejor fecha)
     diasViaje  → cuánto dura el viaje
     llegada    → mes en que la nave llega
   Modelo simple (para aprender, no para volar de verdad):
     Marte: el camino más barato sale cuando Marte va ~44° adelante de la Tierra.
            extra = penalización × (diferencia en grados)²
     Apofis: mientras más cerca está el asteroide, menos cuesta llegar.
   La selección del jugador se guarda en estado.trayectoria = { mes, tipo }.
   ===================================================================== */

const Trayectorias = (function () {

  const NOMBRES_MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  function config(escId) { return (DATOS.trayectorias || {})[escId] || null; }
  function usaFecha(escId) { const c = config(escId); return !!c && c.modo !== "tipos"; }

  // "2029-01" + 3 → "2029-04"
  function sumarMeses(mes, n) {
    const a = Number(mes.slice(0, 4)), m = Number(mes.slice(5, 7)) - 1 + n;
    const anio = a + Math.floor(m / 12), mm = ((m % 12) + 12) % 12 + 1;
    return anio + "-" + (mm < 10 ? "0" : "") + mm;
  }
  function textoMes(mes) { return NOMBRES_MES[Number(mes.slice(5, 7)) - 1] + " " + mes.slice(0, 4); }
  function mesesEntre(a, b) { return (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7)); }

  // Fila de efemérides de un mes (si se sale de la tabla, usa el extremo)
  function fila(mes) {
    const f = DATOS.efemerides.filas;
    let k = mesesEntre(DATOS.efemerides.inicio, mes);
    k = Math.max(0, Math.min(f.length - 1, k));
    const x = f[k];
    return { mes: x[0], tierra: { lon: x[1], r: x[2] }, marte: { lon: x[3], r: x[4], dist: x[5] }, apofis: { lon: x[6], r: x[7], dist: x[8] } };
  }

  // Lista de meses del planificador
  function meses(escId) {
    const c = config(escId), lista = [];
    if (!c || !c.desde) return lista;
    for (let m = c.desde; m <= c.hasta; m = sumarMeses(m, 1)) lista.push(m);
    return lista;
  }

  // Diferencia de ángulos en el rango −180..180
  function difAngulo(a, b) { let d = a - b; while (d > 180) d -= 360; while (d < -180) d += 360; return d; }

  /* ---------- Evaluar un mes y un tipo de viaje ---------- */
  function evaluar(escId, sel, esc) {
    const c = config(escId);
    if (!c) return null;
    const R = DATOS.reglasViaje;
    const tipo = DATOS.tiposViaje[(sel && sel.tipo) || "directa"] || DATOS.tiposViaje.directa;
    const idTipo = (sel && sel.tipo) || "directa";
    const out = { config: c, tipo: idTipo, tipoInfo: tipo, extra: 0, diasViaje: esc.diasViaje, factorLlegada: 1, bonoCiencia: 0, notas: [], elegido: !!sel };

    if (c.modo === "tipos") {
      if (tipo.diasViaje) out.diasViaje = tipo.diasViaje;
      if (tipo.factorLlegada) out.factorLlegada = tipo.factorLlegada;
    } else {
      const mes = (sel && sel.mes) || null;
      out.mes = mes;
      if (!mes) { out.sinFecha = true; return terminar(out, R); }
      // Con asistencia, la nave sale "de verdad" hacia el destino cuando vuelve a pasar por la Tierra
      const salida = sumarMeses(mes, tipo.mesesEspera || 0);
      const f = fila(salida);
      out.salida = salida; out.posiciones = f;
      if (c.modo === "ventana") {
        const fase = difAngulo(f[c.cuerpo].lon, f.tierra.lon);
        const dif = difAngulo(fase, c.faseIdeal);
        out.fase = fase; out.difFase = dif;
        out.extra = c.penalizacion * dif * dif;
        out.diasViaje = esc.diasViaje + Math.round(Math.max(0, Math.abs(dif) - 10) * R.diasPorGradoFuera);
      } else if (c.modo === "distancia") {
        out.distancia = f[c.cuerpo].dist;
        out.extra = c.penalizacion * Math.max(0, out.distancia - c.distanciaLibre);
      }
      out.extra += tipo.extraLanzamiento || 0;
      out.diasViaje += tipo.diasExtra || 0;
      out.llegada = sumarMeses(mes, Math.round(out.diasViaje / 30.44));
      out.posLlegada = fila(out.llegada);
      if (c.meta) {
        if (out.llegada <= c.meta.hasta) { out.bonoCiencia = c.meta.bonoCiencia; out.notas.push("¡Llegas antes del paso cercano! +" + Math.round(c.meta.bonoCiencia * 100) + "% de ciencia."); }
        else out.notas.push("Llegas después del paso cercano de abril de 2029: te lo pierdes.");
      }
    }
    return terminar(out, R);
  }

  function terminar(out, R) {
    out.imposible = out.extra > R.maximoExtra;
    out.factorCapacidad = Math.min(R.maximoCapacidad, Math.exp(-out.extra / R.efectoCapacidad));
    return out;
  }

  // Calidad de un mes, para pintar la línea de tiempo: "buena", "media", "mala" o "imposible"
  function calidad(ev) {
    if (ev.imposible) return "imposible";
    const sinAyuda = ev.extra - (ev.tipoInfo.extraLanzamiento || 0);
    if (sinAyuda < 0.15) return "buena";
    if (sinAyuda < 0.8) return "media";
    return "mala";
  }

  // El mejor mes para un tipo de viaje (para las pistas del modo Cadete)
  function mejorMes(escId, tipo, esc) {
    let mejor = null;
    meses(escId).forEach(function (m) {
      const ev = evaluar(escId, { mes: m, tipo: tipo }, esc);
      const valor = ev.extra - ev.bonoCiencia * 2;          // prefiere llegar a tiempo si hay meta
      if (!mejor || valor < mejor.valor) mejor = { mes: m, valor: valor };
    });
    return mejor ? mejor.mes : null;
  }

  return { config: config, usaFecha: usaFecha, meses: meses, evaluar: evaluar, calidad: calidad, mejorMes: mejorMes,
    fila: fila, sumarMeses: sumarMeses, textoMes: textoMes };
})();
