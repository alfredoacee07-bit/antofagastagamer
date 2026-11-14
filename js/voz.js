/* =====================================================================
   voz.js — La Ingeniera Paz habla en voz alta
   ---------------------------------------------------------------------
   Usa la síntesis de voz del navegador (Web Speech API, speechSynthesis).
   No necesita internet en la mayoría de los equipos: usa las voces que
   ya trae el sistema. Prefiere español latino si el dispositivo lo tiene.
   Los textos SIEMPRE siguen apareciendo escritos en pantalla.
   ===================================================================== */

const Voz = (function () {

  const disponible = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  // Orden de preferencia: español latinoamericano primero, luego cualquier español
  const PREFERIDAS = ["es-419", "es-MX", "es-US", "es-CL", "es-AR", "es-CO", "es-PE"];
  let elegida = null;
  const prefs = { activa: true, velocidad: 1 };

  // La Ingeniera Paz es mujer: entre varias voces del mismo idioma prefiere
  // voces femeninas conocidas, y luego las locales (funcionan sin internet)
  const FEMENINAS = /sabina|paulina|helena|laura|dalia|elvira|elena|lupe|m[oó]nica|paloma|camila|valentina|catalina|luc[ií]a|ximena|marisol|google/i;
  function mejorDe(lista) {
    if (!lista.length) return null;
    return lista.find(function (v) { return FEMENINAS.test(v.name) && v.localService; }) ||
           lista.find(function (v) { return FEMENINAS.test(v.name); }) ||
           lista.find(function (v) { return v.localService; }) || lista[0];
  }

  function cargarVoces() {
    if (!disponible) return;
    const voces = speechSynthesis.getVoices();
    if (!voces.length) return;
    const norm = function (v) { return v.lang.replace("_", "-").toLowerCase(); };
    elegida = null;
    for (let i = 0; i < PREFERIDAS.length && !elegida; i++) {
      const lang = PREFERIDAS[i].toLowerCase();
      elegida = mejorDe(voces.filter(function (v) { return norm(v) === lang; }));
    }
    if (!elegida) elegida = mejorDe(voces.filter(function (v) { return norm(v).indexOf("es") === 0; }));
  }
  if (disponible) {
    cargarVoces();
    speechSynthesis.addEventListener("voiceschanged", cargarVoces);
  }

  // Ajusta el texto para que suene natural al leerlo en voz alta
  function paraLeer(texto) {
    return String(texto)
      .replace(/<[^>]+>/g, " ")
      .replace(/M USD/g, "millones de dólares")
      .replace(/km\/s/g, "kilómetros por segundo")
      .replace(/GB\/día/g, "gigabytes al día")
      .replace(/\bGB\b/g, "gigabytes")
      .replace(/\bWh\b/g, "watts hora")
      .replace(/(\d)\s?W\b/g, "$1 watts")
      .replace(/(\d)\s?kg\b/g, "$1 kilos")
      .replace(/(\d)\s?km\b/g, "$1 kilómetros")
      .replace(/Δv/g, "delta ve")
      .replace(/Isp/g, "impulso específico")
      .replace(/\s+/g, " ")
      .trim();
  }

  function decir(texto) {
    if (!disponible || !prefs.activa || !texto) return;
    speechSynthesis.cancel();                     // corta lo anterior para no amontonar frases
    const u = new SpeechSynthesisUtterance(paraLeer(texto));
    if (elegida) { u.voice = elegida; u.lang = elegida.lang; } else u.lang = "es-419";
    u.rate = prefs.velocidad;
    u.pitch = 1.05;
    speechSynthesis.speak(u);
  }

  function detener() { if (disponible) speechSynthesis.cancel(); }

  function configurar(nuevas) {
    Object.assign(prefs, nuevas);
    if (!prefs.activa) detener();
  }

  return {
    decir: decir, detener: detener, configurar: configurar,
    disponible: function () { return disponible; },
    nombreVoz: function () { return elegida ? elegida.name + " (" + elegida.lang + ")" : (disponible ? "voz en español del sistema" : "no disponible"); }
  };
})();
