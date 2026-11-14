/* =====================================================================
   Escenario 3: Buscar hielo de agua en el polo sur de la Luna
   Espacio cislunar. La mejor opción real: órbita polar baja (como LRO).
   La nave necesita motor para frenar y quedar en órbita lunar.
   (Ver la guía de campos en chile.js)
   ===================================================================== */

DATOS.escenarios.push({
  id: "luna",
  nombre: "Buscar hielo de agua en el polo sur de la Luna",
  destino: "La Luna (384.400 km)",
  imagen: "assets/imagenes/escenario-luna.jpg",
  cuerpo: "luna",
  descripcion: "En 2009 la misión LCROSS confirmó hielo de agua en el cráter Cabeus, cerca del polo sur. Los astronautas del programa Artemis quieren usarlo para beber y fabricar combustible.",
  objetivo: "Hacer un mapa de dónde hay hielo en los cráteres que nunca reciben luz del Sol, para elegir dónde podrían trabajar los astronautas.",
  zona: "Polo sur de la Luna y sus cráteres en sombra permanente",
  presupuesto: 120,
  duracionDias: 365,
  diasViaje: 5,
  diasViajeElectrico: 390,
  costoFijo: 15,
  factorSolar: 1,
  propulsionObligatoria: true,
  orbitaInicial: "polarBaja",
  orbitaRecomendada: "polarBaja",
  instrumentosRecomendados: ["neutrones", "shadowcam"],
  eventos: ["tormenta", "antena", "mascons", "eclipseLunar", "estrellas", "cortocircuito", "rueda"],
  fuentes: ["moon_facts", "lro", "lcross", "lend", "capstone", "artemis", "smart1"],
  intro: { titulo: "Misión Hielo Lunar", texto: "En el fondo de algunos cráteres del polo sur hace −230 °C y nunca llega el Sol. ¡Ahí se esconde el hielo! Necesitarás instrumentos que 'vean' en la oscuridad." },
  preguntas: [
    "¿Cómo se puede encontrar hielo en un lugar donde nunca llega la luz? ¿Qué instrumentos lo lograron?",
    "Tu nave necesitó motor para quedarse en la Luna. ¿Qué pasa con la masa si eliges hidracina en vez de motor eléctrico?",
    "¿Por qué el agua de la Luna podría ser más valiosa que el oro para los astronautas?"
  ],

  orbitas: [
    {
      id: "polarBaja", nombre: "Órbita polar baja", imagen: "assets/imagenes/orbita-lro.jpg", subtitulo: "Como LRO de la NASA (50 km)",
      destinoCohete: "tli", altitudTexto: "50 km sobre la Luna", periodoTexto: "113 min",
      eclipseFraccion: 0.4, eclipseHoras: 0.8, minutosContactoDia: 480, factorDistancia: 0.1,
      vidaOrbitaAnios: 0.5, vidaConMotorAnios: 7, deltaVLlegada: 0.9, deltaVAnual: 0.15,
      causaVidaOrbita: "La gravedad desigual de la Luna (mascons) deforma las órbitas bajas: sin corregirlas con el motor, la nave chocaría en meses.",
      riesgoBasura: 0,
      multCiencia: { shadowcam: 1, camara: 1, neutrones: 1, termico: 1, radar: 1 },
      notaCiencia: "Pasa sobre ambos polos en cada vuelta y muy cerca del suelo: perfecta para buscar hielo.",
      descripcion: "Muy cerca de la superficie y pasa por los polos. Necesita corregirse seguido.",
      dibujo: { rx: 0.35, ry: 1.35, rot: 0.1, vel: 1.9, arcoContacto: 1.6 },
      fuentes: ["lro"]
    },
    {
      id: "ecuatorial", nombre: "Órbita ecuatorial baja", imagen: "assets/imagenes/orbita-apollo.jpg", subtitulo: "Como varias sondas Apolo (100 km)",
      destinoCohete: "tli", altitudTexto: "100 km sobre la Luna", periodoTexto: "118 min",
      eclipseFraccion: 0.42, eclipseHoras: 0.8, minutosContactoDia: 480, factorDistancia: 0.1,
      vidaOrbitaAnios: 0.5, vidaConMotorAnios: 7, deltaVLlegada: 0.85, deltaVAnual: 0.1,
      causaVidaOrbita: "Igual que todas las órbitas lunares bajas, necesita motor para no caer.",
      riesgoBasura: 0,
      multCiencia: { shadowcam: 0.05, camara: 0.3, neutrones: 0.1, termico: 0.2, radar: 0.1 },
      notaCiencia: "Da vueltas sobre el ecuador lunar: ¡nunca pasa sobre el polo sur donde está el hielo!",
      descripcion: "Un poco más fácil de alcanzar, pero no ve los polos.",
      dibujo: { rx: 1.45, ry: 0.4, rot: -0.1, vel: 2, arcoContacto: 1.6 },
      fuentes: ["moon_facts"]
    },
    {
      id: "nrho", nombre: "Órbita de halo (NRHO)", imagen: "assets/imagenes/orbita-gateway.jpg", subtitulo: "Como CAPSTONE y la futura estación Gateway",
      destinoCohete: "tli", altitudTexto: "3.000 a 70.000 km", periodoTexto: "~7 días",
      eclipseFraccion: 0, eclipseHoras: 0, minutosContactoDia: 1200, factorDistancia: 0.06,
      vidaOrbitaAnios: 1, vidaConMotorAnios: 15, deltaVLlegada: 0.45, deltaVAnual: 0.005,
      causaVidaOrbita: "Es una órbita estable, pero necesita pequeños empujones para no escaparse.",
      riesgoBasura: 0,
      multCiencia: { shadowcam: 0.15, camara: 0.15, neutrones: 0.05, termico: 0.2, radar: 0.05 },
      notaCiencia: "Pasa casi todo el tiempo sobre el polo sur, pero a 70.000 km: ideal para comunicarse con astronautas, no para mirar el suelo de cerca.",
      descripcion: "Muy poco combustible, casi nunca en sombra y siempre ve la Tierra.",
      dibujo: { rx: 0.7, ry: 2.1, rot: 0.2, vel: 0.7, arcoContacto: 7 },
      fuentes: ["capstone"]
    }
  ],

  instrumentos: [
    { id: "shadowcam", nombre: "Cámara para cráteres en sombra", imagen: "assets/imagenes/inst-luna-shadowcam.jpg", inspirado: "Inspirada en ShadowCam (NASA, en la nave coreana Danuri)",
      descripcion: "Tan sensible que fotografía el fondo de cráteres oscuros con la poca luz que rebota en sus paredes.",
      masa: 10, energia: 25, costo: 10, datos: 8, ciencia: 260, necesitaPunteria: true, fuentes: ["lro"] },
    { id: "camara", nombre: "Cámara de alta resolución", imagen: "assets/imagenes/inst-luna-camara.jpg", inspirado: "Inspirada en LROC de LRO",
      descripcion: "Ve detalles de medio metro: rocas, laderas y lugares seguros para aterrizar.",
      masa: 15, energia: 30, costo: 12, datos: 20, ciencia: 200, necesitaPunteria: true, fuentes: ["lro"] },
    { id: "neutrones", nombre: "Detector de neutrones", imagen: "assets/imagenes/inst-luna-neutrones.jpg", inspirado: "Inspirado en LEND de LRO",
      descripcion: "Cuenta partículas que salen del suelo: donde hay hidrógeno (¡hielo!) salen menos.",
      masa: 25, energia: 15, costo: 8, datos: 0.05, ciencia: 280, necesitaPunteria: false, fuentes: ["lend"] },
    { id: "termico", nombre: "Radiómetro térmico", imagen: "assets/imagenes/inst-luna-termico.jpg", inspirado: "Inspirado en Diviner de LRO",
      descripcion: "Mide la temperatura del suelo y encuentra 'trampas frías' donde el hielo puede durar millones de años.",
      masa: 12, energia: 25, costo: 9, datos: 0.5, ciencia: 220, necesitaPunteria: true, fuentes: ["lro"] },
    { id: "radar", nombre: "Radar de hielo", imagen: "assets/imagenes/inst-luna-radar.jpg", inspirado: "Inspirado en Mini-RF de LRO",
      descripcion: "Envía ondas de radio que rebotan distinto en el hielo que en la roca.",
      masa: 15, energia: 70, costo: 15, datos: 10, ciencia: 240, necesitaPunteria: true, fuentes: ["lro"] }
  ]
});
