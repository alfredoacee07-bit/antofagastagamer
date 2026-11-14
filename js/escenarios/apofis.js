/* =====================================================================
   Escenario 5: Acompañar al asteroide Apofis en su paso cercano (2029)
   Defensa planetaria. El 13 de abril de 2029, Apofis (~375 m) pasará a
   unos 32.000 km de la Tierra: ¡más cerca que los satélites geoestacionarios!
   La ESA planea la misión Ramses y la NASA enviará OSIRIS-APEX.
   (Ver la guía de campos en chile.js)
   ===================================================================== */

DATOS.escenarios.push({
  id: "apofis",
  nombre: "Acompañar al asteroide Apofis en su visita a la Tierra",
  destino: "Asteroide Apofis (paso cercano: 13 de abril de 2029)",
  imagen: "assets/imagenes/escenario-apofis.jpg",
  cuerpo: "asteroide",
  descripcion: "Apofis es un asteroide del tamaño de tres canchas de fútbol. En 2029 pasará tan cerca de la Tierra que se verá a simple vista desde Europa y África. No chocará, pero es una oportunidad única.",
  objetivo: "Llegar antes del paso cercano, medir la forma, el interior y la superficie de Apofis, y observar cómo la gravedad de la Tierra lo sacude. Esto ayuda a proteger el planeta de futuros asteroides.",
  zona: "El asteroide Apofis, antes, durante y después de su paso cercano",
  presupuesto: 150,
  duracionDias: 365,
  diasViaje: 300,
  diasViajeElectrico: 150,
  costoFijo: 25,
  factorSolar: 0.9,
  propulsionObligatoria: true,
  orbitaInicial: "distante",
  orbitaRecomendada: "cercana",
  instrumentosRecomendados: ["camara", "cubesat"],
  eventos: ["tormenta", "antena", "giroApofis", "particulas", "estrellas", "cortocircuito", "rueda"],
  fuentes: ["apophis_esa", "apophis_nasa", "osiris_apex", "hera", "dsn"],
  intro: { titulo: "Misión Defensa Planetaria", texto: "Un asteroide tiene tan poca gravedad que tu nave no 'orbita' como en la Tierra: ¡casi flota a su lado! Y debes llegar ANTES del 13 de abril de 2029." },
  preguntas: [
    "¿Por qué es importante estudiar un asteroide aunque sepamos que no chocará con la Tierra?",
    "Un sobrevuelo es barato pero da poca ciencia. ¿Cuándo crees que vale la pena hacer solo un sobrevuelo?",
    "Si se descubriera un asteroide peligroso, ¿qué necesitaríamos saber de él antes de intentar desviarlo?"
  ],

  orbitas: [
    {
      id: "sobrevuelo", nombre: "Sobrevuelo rápido", imagen: "assets/imagenes/orbita-sobrevuelo.jpg", subtitulo: "Como hizo la nave Lucy con varios asteroides",
      destinoCohete: "esc", altitudTexto: "pasa a ~1.000 km", periodoTexto: "unas horas de observación",
      eclipseFraccion: 0, eclipseHoras: 0, minutosContactoDia: 480, factorDistancia: 0.02,
      vidaOrbitaAnios: 10, vidaConMotorAnios: 10, deltaVLlegada: 0.1, deltaVAnual: 0,
      causaVidaOrbita: "La nave sigue viajando alrededor del Sol después del sobrevuelo.",
      riesgoBasura: 0,
      multCiencia: { camara: 0.25, espectro: 0.25, laser: 0.1, radar: 0.1, cubesat: 0 },
      notaCiencia: "Pasas una sola vez a toda velocidad: unas horas de buenas fotos y nada más. No alcanzas a soltar un CubeSat.",
      descripcion: "Casi no necesita combustible, pero ves el asteroide solo un momento.",
      dibujo: { rx: 2.4, ry: 0.25, rot: -0.15, vel: 1, arcoContacto: 7 },
      fuentes: ["apophis_nasa"]
    },
    {
      id: "distante", nombre: "Acompañamiento a distancia", imagen: "assets/imagenes/orbita-distante.jpg", subtitulo: "Como Ramses al llegar (20–50 km)",
      destinoCohete: "esc", altitudTexto: "20 a 50 km", periodoTexto: "flota junto al asteroide",
      eclipseFraccion: 0, eclipseHoras: 0, minutosContactoDia: 480, factorDistancia: 0.02,
      vidaOrbitaAnios: 0.3, vidaConMotorAnios: 10, deltaVLlegada: 1.0, deltaVAnual: 0.03,
      causaVidaOrbita: "La gravedad de Apofis es tan débil que la nave debe usar su motor para no alejarse.",
      riesgoBasura: 0,
      multCiencia: { camara: 0.7, espectro: 0.7, laser: 0.4, radar: 0.6, cubesat: 0.8 },
      notaCiencia: "Ves el asteroide todo el tiempo, desde una distancia segura.",
      descripcion: "Frenar para quedarse junto a Apofis gasta combustible, pero ganas meses de observación.",
      dibujo: { rx: 1.8, ry: 0.9, rot: 0, vel: 0.8, arcoContacto: 7 },
      fuentes: ["apophis_esa"]
    },
    {
      id: "cercana", nombre: "Órbita cercana", imagen: "assets/imagenes/orbita-cercana.jpg", subtitulo: "Como OSIRIS-REx alrededor de Bennu (1–5 km)",
      destinoCohete: "esc", altitudTexto: "1 a 5 km", periodoTexto: "~1 día por vuelta",
      eclipseFraccion: 0, eclipseHoras: 0, minutosContactoDia: 480, factorDistancia: 0.02,
      vidaOrbitaAnios: 0.2, vidaConMotorAnios: 10, deltaVLlegada: 1.1, deltaVAnual: 0.06,
      causaVidaOrbita: "Tan cerca, la luz del Sol y la forma irregular del asteroide empujan la nave: hay que corregir seguido.",
      riesgoBasura: 0,
      multCiencia: { camara: 1, espectro: 1, laser: 1, radar: 1, cubesat: 1 },
      notaCiencia: "La mejor ciencia: todos los instrumentos funcionan al máximo. Pero puede haber piedras flotando.",
      descripcion: "Muy cerca de la superficie. Máxima ciencia, más riesgo y más combustible.",
      dibujo: { rx: 1.2, ry: 1.0, rot: 0, vel: 0.9, arcoContacto: 7 },
      fuentes: ["osiris_apex"]
    }
  ],

  instrumentos: [
    { id: "camara", nombre: "Cámara de navegación y ciencia", imagen: "assets/imagenes/orbita-cercana.jpg", inspirado: "Inspirada en las cámaras de Hera y OSIRIS-REx",
      descripcion: "Fotografía cada roca y ayuda a la nave a no chocar.",
      masa: 8, energia: 15, costo: 6, datos: 3, ciencia: 220, necesitaPunteria: true, fuentes: ["hera"] },
    { id: "espectro", nombre: "Espectrómetro infrarrojo", imagen: "assets/imagenes/inst-apofis-espectro.jpg", inspirado: "Inspirado en los de Hera y OSIRIS-REx",
      descripcion: "Descubre de qué está hecho el asteroide: roca, metal o minerales con agua.",
      masa: 10, energia: 20, costo: 10, datos: 1.5, ciencia: 200, necesitaPunteria: true, fuentes: ["hera"] },
    { id: "laser", nombre: "Altímetro láser", imagen: "assets/imagenes/orbita-distante.jpg", inspirado: "Inspirado en el láser de Hera",
      descripcion: "Mide la distancia con un rayo láser para crear un mapa 3D de la forma exacta.",
      masa: 7, energia: 25, costo: 8, datos: 0.2, ciencia: 180, necesitaPunteria: true, fuentes: ["hera"] },
    { id: "radar", nombre: "Radar de baja frecuencia", imagen: "assets/imagenes/inst-apofis-radar.jpg", inspirado: "Inspirado en el radar JuRa del CubeSat Juventas (Hera)",
      descripcion: "Atraviesa el asteroide para saber si es una roca sólida o un montón de piedras sueltas.",
      masa: 6, energia: 30, costo: 12, datos: 0.5, ciencia: 240, necesitaPunteria: true, fuentes: ["hera"] },
    { id: "cubesat", nombre: "CubeSat acompañante con sismómetro", imagen: "assets/imagenes/inst-apofis-cubesat.jpg", inspirado: "Inspirado en los CubeSats de Hera y Ramses",
      descripcion: "Un mini satélite que se separa, se acerca más y puede posarse para sentir los 'temblores' del asteroide.",
      masa: 12, energia: 5, costo: 9, datos: 0.3, ciencia: 230, necesitaPunteria: false, fuentes: ["hera", "apophis_esa"] }
  ]
});
