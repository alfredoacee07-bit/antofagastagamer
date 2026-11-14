/* =====================================================================
   Escenario 4: Estudiar el agua escondida y el clima de Marte
   Espacio profundo. En Marte llega solo 43% de la luz del Sol y la
   señal tarda entre 3 y 22 minutos en llegar a la Tierra.
   Por eso las naves llevan paneles más grandes (ajustePaneles) y sus
   instrumentos producen pocos datos.
   (Ver la guía de campos en chile.js)
   ===================================================================== */

DATOS.escenarios.push({
  id: "marte",
  nombre: "Estudiar el agua escondida y el clima de Marte",
  destino: "Marte (de 55 a 400 millones de km)",
  imagen: "assets/imagenes/escenario-marte.jpg",
  cuerpo: "marte",
  descripcion: "Marte tuvo ríos y lagos. Hoy su agua está congelada bajo el suelo y en los polos, y su atmósfera se escapa lentamente al espacio.",
  objetivo: "Encontrar hielo enterrado que puedan usar futuros astronautas y entender cómo cambia el clima marciano durante un año completo de Marte (687 días).",
  zona: "Todo Marte, con atención a las zonas de latitud media donde hay hielo bajo el suelo",
  presupuesto: 170,
  duracionDias: 687,
  diasViaje: 210,
  diasViajeElectrico: 200,
  costoFijo: 30,
  factorSolar: 0.43,
  ajustePaneles: 2.5,       // en Marte la nave lleva paneles 2,5 veces más grandes
  propulsionObligatoria: true,
  orbitaInicial: "eliptica",
  orbitaRecomendada: "baja",
  instrumentosRecomendados: ["radar", "clima"],
  eventos: ["tormenta", "antena", "polvoMarte", "conjuncion", "estrellas", "cortocircuito", "rueda"],
  fuentes: ["mars_facts", "mro", "maven", "mom", "conjuncion", "opportunity", "dsn"],
  intro: { titulo: "Misión Planeta Rojo", texto: "Marte está tan lejos que tu señal tarda hasta 22 minutos en llegar. ¡No puedes manejar la nave en vivo! Y como hay menos luz, la energía será un desafío." },
  preguntas: [
    "En Marte, ¿por qué tus instrumentos tienen que producir muchos menos datos que en la Tierra?",
    "La sonda india Mangalyaan costó unos 74 millones de dólares, menos que algunas películas. ¿Qué decisiones crees que tomaron para ahorrar?",
    "Si la señal tarda 20 minutos, ¿cómo debería 'pensar' la nave por sí sola cuando aparece un problema?"
  ],

  orbitas: [
    {
      id: "baja", nombre: "Órbita baja circular", imagen: "assets/imagenes/orbita-mro.jpg", subtitulo: "Como Mars Reconnaissance Orbiter (~300 km)",
      destinoCohete: "tmi", altitudTexto: "~300 km sobre Marte", periodoTexto: "112 min",
      eclipseFraccion: 0.38, eclipseHoras: 0.7, minutosContactoDia: 480, factorDistancia: 0.004,
      vidaOrbitaAnios: 3, vidaConMotorAnios: 10, deltaVLlegada: 2.0, deltaVAnual: 0.01,
      causaVidaOrbita: "La delgada atmósfera de Marte frena un poco a la nave.",
      riesgoBasura: 0,
      multCiencia: { camara: 1, minerales: 1, radar: 1, clima: 0.9, atmosfera: 0.7 },
      notaCiencia: "Cerca del suelo: fotos con mucho detalle y el radar puede ver el hielo enterrado. (MRO ahorró combustible frenando con la atmósfera durante meses: 'aerofrenado').",
      descripcion: "La mejor para mirar la superficie, pero frenar hasta ahí gasta mucho combustible.",
      dibujo: { rx: 1.4, ry: 0.5, rot: -0.3, vel: 2.1, arcoContacto: 1.2 },
      fuentes: ["mro"]
    },
    {
      id: "eliptica", nombre: "Órbita elíptica", imagen: "assets/imagenes/orbita-maven.jpg", subtitulo: "Como MAVEN (150 × 6.200 km)",
      destinoCohete: "tmi", altitudTexto: "150 a 6.200 km", periodoTexto: "4,5 horas",
      eclipseFraccion: 0.15, eclipseHoras: 0.6, minutosContactoDia: 480, factorDistancia: 0.004,
      vidaOrbitaAnios: 10, vidaConMotorAnios: 10, deltaVLlegada: 1.2, deltaVAnual: 0.005,
      causaVidaOrbita: "Una órbita estable que dura muchos años.",
      riesgoBasura: 0,
      multCiencia: { camara: 0.4, minerales: 0.5, radar: 0.4, clima: 0.9, atmosfera: 1.2 },
      notaCiencia: "En cada vuelta atraviesa la parte alta de la atmósfera: ideal para estudiar cómo se escapa el aire de Marte, pero pasa poco tiempo cerca del suelo.",
      descripcion: "Gasta menos combustible para llegar. Se acerca y se aleja de Marte en cada vuelta.",
      dibujo: { rx: 1.9, ry: 0.75, rot: -0.2, vel: 1.3, arcoContacto: 1.2 },
      fuentes: ["maven"]
    },
    {
      id: "areo", nombre: "Órbita areoestacionaria", imagen: "assets/imagenes/orbita-areo.jpg", subtitulo: "La 'geoestacionaria' de Marte (17.000 km)",
      destinoCohete: "tmi", altitudTexto: "17.032 km", periodoTexto: "24,6 horas (un día marciano)",
      eclipseFraccion: 0.02, eclipseHoras: 1.1, descargaSegura: 0.8, minutosContactoDia: 480, factorDistancia: 0.004,
      vidaOrbitaAnios: 2, vidaConMotorAnios: 10, deltaVLlegada: 1.6, deltaVAnual: 0.02,
      causaVidaOrbita: "Sin motor, la nave se corre de su lugar sobre Marte.",
      riesgoBasura: 0,
      multCiencia: { camara: 0.1, minerales: 0.1, radar: 0, clima: 1.3, atmosfera: 0.6 },
      notaCiencia: "Mira siempre la misma mitad de Marte: perfecta para seguir tormentas y nubes, pero muy lejos para ver el suelo o el hielo enterrado.",
      descripcion: "Gira al ritmo de Marte, como un satélite meteorológico marciano.",
      dibujo: { rx: 2.3, ry: 0.6, rot: -0.1, vel: 0.5, arcoContacto: 1.2 },
      fuentes: ["mars_facts"]
    }
  ],

  instrumentos: [
    { id: "camara", nombre: "Cámara de alta resolución", imagen: "assets/imagenes/inst-marte-camara.jpg", inspirado: "Inspirada en HiRISE de MRO",
      descripcion: "Ve objetos del tamaño de una mesa desde la órbita: cráteres nuevos que muestran hielo fresco.",
      masa: 40, energia: 60, costo: 25, datos: 1.5, ciencia: 260, necesitaPunteria: true, fuentes: ["mro"] },
    { id: "minerales", nombre: "Espectrómetro de minerales", imagen: "assets/imagenes/inst-marte-minerales.jpg", inspirado: "Inspirado en CRISM de MRO",
      descripcion: "Identifica rocas que solo se forman con agua: arcillas, sales y yeso.",
      masa: 30, energia: 45, costo: 20, datos: 0.8, ciencia: 230, necesitaPunteria: true, fuentes: ["mro"] },
    { id: "radar", nombre: "Radar de subsuelo", imagen: "assets/imagenes/inst-marte-radar.jpg", inspirado: "Inspirado en SHARAD de MRO",
      descripcion: "Ve hasta cientos de metros bajo el suelo: encuentra capas de hielo enterrado.",
      masa: 15, energia: 40, costo: 15, datos: 0.4, ciencia: 280, necesitaPunteria: true, fuentes: ["mro"] },
    { id: "clima", nombre: "Sonda del clima", imagen: "assets/imagenes/inst-marte-clima.jpg", inspirado: "Inspirada en Mars Climate Sounder de MRO",
      descripcion: "Mide temperatura, polvo y vapor de agua del aire marciano capa por capa.",
      masa: 9, energia: 12, costo: 8, datos: 0.03, ciencia: 170, necesitaPunteria: false, fuentes: ["mro"] },
    { id: "atmosfera", nombre: "Analizador de atmósfera y magnetómetro", imagen: "assets/imagenes/inst-marte-atmosfera.jpg", inspirado: "Inspirado en MAVEN",
      descripcion: "Mide cómo el viento solar arranca el aire de Marte, que no tiene un campo magnético que lo proteja.",
      masa: 20, energia: 30, costo: 15, datos: 0.1, ciencia: 200, necesitaPunteria: false, fuentes: ["maven"] }
  ]
});
