/* =====================================================================
   modos.js — Lógica de los modos de juego (Misión rápida y Modo libre)
   ---------------------------------------------------------------------
   - Textos de cada objetivo de un contrato.
   - Evaluación del contrato al terminar la misión (qué se cumplió y puntos).
   - El reloj de la Misión rápida.
   Los datos (modos y contratos) están en js/datos/contratos.js
   ===================================================================== */

const Modos = (function () {

  function contrato(id) { return (DATOS.contratos || []).find(function (c) { return c.id === id; }) || null; }
  function modo(id) { return (DATOS.modos || []).find(function (m) { return m.id === id; }) || null; }

  function nombreOrbita(escenarioId, id) {
    const esc = DATOS.escenarios.find(function (e) { return e.id === escenarioId; });
    const o = esc && esc.orbitas.find(function (x) { return x.id === id; });
    return o ? o.nombre.toLowerCase() : id;
  }
  function nombreInstrumento(escenarioId, id) {
    const esc = DATOS.escenarios.find(function (e) { return e.id === escenarioId; });
    const i = esc && esc.instrumentos.find(function (x) { return x.id === id; });
    return i ? i.nombre : id;
  }

  // Texto de un objetivo, para mostrarlo al jugador
  function textoObjetivo(c, o) {
    switch (o.tipo) {
      case "ciencia": return "Lograr al menos " + o.valor + " puntos de ciencia";
      case "supervivencia": return o.valor >= 1 ? "Que la nave funcione toda la misión" : "Que la nave funcione al menos el " + Math.round(o.valor * 100) + "% de la misión";
      case "costoMax": return "Gastar como máximo " + o.valor + " millones de dólares";
      case "perdidosMax": return "Perder como máximo el " + Math.round(o.valor * 100) + "% de los datos";
      case "orbita": return Array.isArray(o.valor)
        ? "Usar una de estas órbitas: " + o.valor.map(function (v) { return nombreOrbita(c.escenario, v); }).join(" o ")
        : "Usar la " + nombreOrbita(c.escenario, o.valor);
      case "instrumento": return "Llevar a bordo: " + nombreInstrumento(c.escenario, o.valor);
      case "desafios": return "Promedio de al menos " + o.valor + "% en los desafíos";
      case "cohetePropio": return "Lanzar con un cohete diseñado por ti (por etapas)";
      case "ventana": return "Lanzar en un mes muy bueno de la ventana (verde en el planificador)";
      default: return o.tipo;
    }
  }

  // ¿Se cumplió el objetivo? r = recursos, inf = informe, s = simulación
  function cumple(o, r, inf, s) {
    switch (o.tipo) {
      case "ciencia": return inf.puntosCiencia >= o.valor;
      case "supervivencia": return inf.fraccionVida >= o.valor - 0.001;
      case "costoMax": return r.costoTotal <= o.valor;
      case "perdidosMax": return s.generadoGB > 0 && s.perdidoGB / s.generadoGB <= o.valor;
      case "orbita": return Array.isArray(o.valor) ? o.valor.indexOf(r.orbita.id) >= 0 : r.orbita.id === o.valor;
      case "instrumento": return r.instrumentos.some(function (i) { return i.id === o.valor; });
      case "desafios": {
        const d = s.decisiones.filter(function (x) { return x.minijuego; });
        if (!d.length) return true;      // si no hubo desafíos, no se exige
        return d.reduce(function (t, x) { return t + x.puntaje; }, 0) / d.length >= o.valor;
      }
      case "cohetePropio": return !!(r.cohete && r.cohete.propio);
      case "ventana": return !!(r.viaje && r.viaje.mes && typeof Trayectorias !== "undefined" && Trayectorias.calidad(r.viaje) === "buena");
      default: return false;
    }
  }

  // Evalúa el contrato al final. extra: { minutosSobrantes, aTiempo }
  function evaluar(c, r, inf, s, extra) {
    const lista = c.objetivos.map(function (o) {
      return { texto: textoObjetivo(c, o), cumplido: cumple(o, r, inf, s) };
    });
    lista.push({ texto: "Lanzar antes de que se acabe el reloj", cumplido: !!extra.aTiempo });
    const cumplidos = lista.filter(function (x) { return x.cumplido; }).length;
    const completo = cumplidos === lista.length;
    const puntosObjetivos = cumplidos * c.recompensa.porObjetivo;
    const puntosCompleto = completo ? c.recompensa.bonoCompleto : 0;
    const puntosTiempo = extra.aTiempo ? Math.round(extra.minutosSobrantes * DATOS.config.puntosPorMinutoSobrante) : 0;
    return {
      lista: lista, cumplidos: cumplidos, total: lista.length, completo: completo,
      puntosObjetivos: puntosObjetivos, puntosCompleto: puntosCompleto, puntosTiempo: puntosTiempo,
      bono: puntosObjetivos + puntosCompleto + puntosTiempo
    };
  }

  /* ---------- Reloj de la Misión rápida ---------- */
  let fin = 0, intervalo = null, alTerminar = null, avisado = false;

  function iniciarReloj(minutos, cuandoTermine) {
    detenerReloj();
    fin = Date.now() + minutos * 60000;
    alTerminar = cuandoTermine; avisado = false;
    intervalo = setInterval(tic, 500);
    tic();
  }
  function tic() {
    const el = document.getElementById("reloj-mision");
    const resta = restanteMs();
    if (el) {
      const m = Math.floor(resta / 60000), seg = Math.floor(resta / 1000) % 60;
      el.classList.remove("oculto");
      el.classList.toggle("urgente", resta < 120000);
      el.innerHTML = Iconos.svg("reloj") + " " + m + ":" + (seg < 10 ? "0" : "") + seg;
    }
    if (resta <= 0 && !avisado) { avisado = true; if (alTerminar) alTerminar(); }
  }
  function detenerReloj() {
    if (intervalo) clearInterval(intervalo);
    intervalo = null;
    const el = document.getElementById("reloj-mision");
    if (el) el.classList.add("oculto");
  }
  function restanteMs() { return Math.max(0, fin - Date.now()); }

  return {
    contrato: contrato, modo: modo, textoObjetivo: textoObjetivo, evaluar: evaluar,
    iniciarReloj: iniciarReloj, detenerReloj: detenerReloj, restanteMs: restanteMs,
    relojActivo: function () { return !!intervalo; }
  };
})();
