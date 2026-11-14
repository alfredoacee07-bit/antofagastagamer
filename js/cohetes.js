/* =====================================================================
   cohetes.js — Cohetes propios por etapas (y reutilizables)
   ---------------------------------------------------------------------
   Un diseño de cohete es una lista de etapas, de abajo hacia arriba:
     { etapas: [ { motor: "mediano", cantidad: 9, tanque: "gigante", reutilizable: true },
                 { motor: "mediano", cantidad: 1, tanque: "grande" } ] }
   Para cada etapa se calcula, con la ecuación del cohete:
     delta-v = Isp × 9,81 × ln(masa al encender / masa al apagar)
   La masa "de arriba" (carga + etapas superiores) se suma a cada etapa.
   Con eso se sabe cuánta carga puede llevar el cohete a cada destino.
   Los datos de motores y tanques están en js/datos/motores.js
   ===================================================================== */

const Cohetes = (function () {

  const G0 = 9.81;
  const CLAVE_FLOTA = "spaceSimulator.flota";     // etapas recuperadas guardadas en el dispositivo

  function motor(id) { return DATOS.motores.find(function (m) { return m.id === id; }); }
  function tanque(id) { return DATOS.tanques.find(function (t) { return t.id === id; }); }

  function disenoPorDefecto() {
    return { etapas: [
      { motor: "mediano", cantidad: 9, tanque: "gigante", reutilizable: true },
      { motor: "mediano", cantidad: 1, tanque: "grande", reutilizable: false }
    ] };
  }

  /* ---------- Flota: etapas que aterrizaron y se pueden reusar ---------- */
  function leerFlota() { try { return JSON.parse(localStorage.getItem(CLAVE_FLOTA)) || {}; } catch (e) { return {}; } }
  function guardarFlota(f) { try { localStorage.setItem(CLAVE_FLOTA, JSON.stringify(f)); } catch (e) { /* modo privado */ } }
  function claveEtapa(et) { return et.motor + "x" + et.cantidad + "-" + et.tanque; }
  function hayRecuperada(et) { return (leerFlota()[claveEtapa(et)] || 0) > 0; }
  function registrarRecuperacion(diseno) {
    const f = leerFlota(), k = claveEtapa(diseno.etapas[0]);
    f[k] = (f[k] || 0) + 1; guardarFlota(f);
  }
  function usarRecuperada(diseno) {
    const f = leerFlota(), k = claveEtapa(diseno.etapas[0]);
    if (!f[k]) return false;
    f[k]--; guardarFlota(f); return true;
  }

  /* ---------- Una etapa por sí sola (sin lo que lleva encima) ---------- */
  function datosEtapa(et, indice) {
    const R = DATOS.reglasCohete, m = motor(et.motor), t = tanque(et.tanque);
    const reutil = indice === 0 && et.reutilizable;
    const combustible = t.toneladas * 1000;                               // kg
    let seca = m.masa * et.cantidad + combustible * m.estructura;
    if (reutil) seca *= 1 + R.reutilizable.masaExtra;                    // patas y aletas
    const util = combustible * (reutil ? 1 - R.reutilizable.reservaAterrizaje : 1);   // reserva para aterrizar
    // La primera etapa trabaja en el aire (promedio mar/vacío); las de arriba, en el vacío
    // y con una tobera más grande hecha para el vacío (ispSuperior)
    const isp = indice === 0 ? (m.soloVacio ? m.ispMar : (m.ispMar + m.ispVacio) / 2) : (m.ispSuperior || m.ispVacio);
    const empuje = m.empujeKN * et.cantidad * 1000;                       // newtons
    let costo = m.costo * et.cantidad + t.toneladas * (R.costoTanquePorTonelada + R.costoCombustiblePorTonelada) +
      R.costoIntegracionBase + t.toneladas * R.costoIntegracionPorTonelada;
    if (reutil) costo *= R.reutilizable.sobrecosto;
    // usaRecuperada: se marcó al lanzar (la etapa ya salió de la flota, pero el precio queda rebajado)
    const recuperada = reutil && (et.usaRecuperada || hayRecuperada(et));
    if (recuperada) costo *= R.reutilizable.costoReuso;                  // solo se paga la revisión
    return {
      motor: m, tanque: t, cantidad: et.cantidad, reutilizable: reutil, recuperada: recuperada,
      seca: seca, combustible: combustible, combustibleUtil: util, isp: isp, empuje: empuje,
      tiempo: util * isp * G0 / empuje, costo: costo
    };
  }

  /* ---------- El cohete completo con una carga ---------- */
  function analizar(diseno, carga) {
    const R = DATOS.reglasCohete;
    const etapas = diseno.etapas.map(datosEtapa);
    let encima = carga;                                       // masa sobre la etapa actual
    for (let i = etapas.length - 1; i >= 0; i--) {
      const e = etapas[i];
      e.masaInicial = encima + e.seca + e.combustible;
      e.masaFinal = e.masaInicial - e.combustibleUtil;
      e.deltaV = e.isp * G0 * Math.log(e.masaInicial / e.masaFinal) / 1000;    // km/s
      e.empujePeso = e.empuje / (e.masaInicial * G0);
      encima = e.masaInicial;
    }
    const avisos = [];
    const primera = etapas[0];
    if (primera.motor.soloVacio) avisos.push("El " + primera.motor.nombre.toLowerCase() + " está hecho para el vacío: en la primera etapa rinde muy poco.");
    if (primera.empujePeso < R.empujePesoMinimo) avisos.push("La primera etapa no tiene empuje suficiente para despegar (empuje/peso " + primera.empujePeso.toFixed(2) + "; se necesita más de " + R.empujePesoMinimo + ").");
    etapas.slice(1).forEach(function (e, k) { if (e.empujePeso < 0.4) avisos.push("La etapa " + (k + 2) + " empuja muy poco para su peso: tardaría demasiado y caería antes de llegar."); });
    return {
      etapas: etapas, carga: carga,
      deltaV: etapas.reduce(function (t, e) { return t + e.deltaV; }, 0),
      costo: etapas.reduce(function (t, e) { return t + e.costo; }, 0),
      masaDespegue: primera.masaInicial,
      despega: primera.empujePeso >= R.empujePesoMinimo && etapas.slice(1).every(function (e) { return e.empujePeso >= 0.4; }),
      avisos: avisos
    };
  }

  // Carga máxima (kg) que el cohete deja en un destino (búsqueda por mitades)
  function cargaMaxima(diseno, destino) {
    const necesario = DATOS.deltaVDestino[destino];
    const sirve = function (c) { const a = analizar(diseno, c); return a.despega && a.deltaV >= necesario; };
    if (!sirve(0)) return 0;
    let bajo = 0, alto = 1000;
    while (sirve(alto) && alto < 300000) { bajo = alto; alto *= 2; }
    for (let i = 0; i < 30; i++) { const medio = (bajo + alto) / 2; if (sirve(medio)) bajo = medio; else alto = medio; }
    return Math.floor(bajo / 10) * 10;
  }

  // Copia limpia de un diseño (para editarlo sin tocar el original)
  function copiar(diseno) {
    return { etapas: diseno.etapas.map(function (e) { return { motor: e.motor, cantidad: e.cantidad, tanque: e.tanque, reutilizable: !!e.reutilizable }; }) };
  }

  // ¿Este cohete (real o propio) tiene una primera etapa que vuelve a aterrizar?
  function tieneAterrizaje(coh) { return !!(coh && coh.reutilizable); }

  // Convierte el diseño en un "cohete" igual a los reales (para el resto del juego)
  const cache = {};
  function objeto(diseno) {
    const clave = JSON.stringify(diseno) + "|" + JSON.stringify(leerFlota());
    if (cache[clave]) return cache[clave];
    const a = analizar(diseno, 0);
    const capacidad = {};
    Object.keys(DATOS.deltaVDestino).forEach(function (d) { capacidad[d] = cargaMaxima(diseno, d); });
    const n = diseno.etapas.length;
    const c = {
      id: "propio", propio: true, nombre: "Mi cohete (" + n + (n === 1 ? " etapa" : " etapas") + ")",
      empresa: "Diseño propio", pais: "Chile", imagen: "assets/imagenes/cohete-falconheavy.jpg",
      costo: Math.round(a.costo * 10) / 10, capacidad: capacidad,
      reutilizable: !!diseno.etapas[0].reutilizable, analisis: a,
      descripcion: "Un cohete armado por ti: " + diseno.etapas.map(function (e, i) { return "etapa " + (i + 1) + " con " + e.cantidad + " × " + motor(e.motor).nombre.toLowerCase(); }).join(", ") + ".",
      dato: a.etapas[0].recuperada ? "¡Usa una primera etapa recuperada! Solo pagas su revisión." : "Delta-v sin carga: " + a.deltaV.toFixed(1) + " km/s.",
      fuentes: ["tsiolkovsky", "deltav"]
    };
    cache[clave] = c;
    return c;
  }

  return {
    disenoPorDefecto: disenoPorDefecto, copiar: copiar, tieneAterrizaje: tieneAterrizaje, analizar: analizar, cargaMaxima: cargaMaxima, objeto: objeto,
    motor: motor, tanque: tanque, registrarRecuperacion: registrarRecuperacion, usarRecuperada: usarRecuperada,
    hayRecuperada: hayRecuperada, leerFlota: leerFlota
  };
})();
