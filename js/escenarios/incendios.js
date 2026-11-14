/* =====================================================================
   Escenario 2: Vigilar incendios, volcanes y tormentas de Sudamérica
   Órbita terrestre. La mejor opción real: GEOESTACIONARIA (como GOES-East),
   porque estos fenómenos cambian en minutos y hay que mirarlos sin parar.
   (Ver la guía de campos en chile.js)
   ===================================================================== */

DATOS.escenarios.push({
  id: "incendios",
  nombre: "Vigilar incendios, volcanes y tormentas de Sudamérica",
  destino: "Órbita de la Tierra",
  imagen: "assets/imagenes/escenario-incendios.jpg",
  cuerpo: "tierra",
  descripcion: "Los incendios forestales pueden avanzar kilómetros en una hora y los volcanes chilenos lanzan ceniza que afecta vuelos y ciudades.",
  objetivo: "Detectar incendios apenas comienzan, seguir nubes de ceniza volcánica y tormentas eléctricas, y avisar rápido a los equipos de emergencia.",
  zona: "Chile y toda Sudamérica, de día y de noche",
  presupuesto: 180,
  duracionDias: 1825,
  diasViaje: 0,
  diasViajeElectrico: 0,
  costoFijo: 12,
  factorSolar: 1,
  propulsionObligatoria: false,
  orbitaInicial: "polar",
  orbitaRecomendada: "geo",
  instrumentosRecomendados: ["imagenes", "fuego"],
  eventos: ["tormenta", "antena", "erupcion", "incendio", "basura", "arrastre", "estrellas", "cortocircuito", "rueda"],
  fuentes: ["goesr", "goes_chile_fires", "nasa_chile_rayos", "sernageomin"],
  intro: { titulo: "Misión Centinela", texto: "Para ver un incendio cuando recién empieza, no basta con una foto al día: ¡hay que mirar todo el tiempo! Piensa qué órbita lo permite." },
  preguntas: [
    "En la misión de glaciares la mejor órbita era la polar y aquí es la geoestacionaria. ¿Por qué cambia la respuesta?",
    "¿Qué es más importante en una emergencia: muchos detalles o información rápida? Explica con un ejemplo.",
    "¿Qué instituciones de Chile (CONAF, SENAPRED, SERNAGEOMIN) podrían usar tus datos y para qué?"
  ],

  orbitas: [
    {
      id: "baja", nombre: "Órbita baja", imagen: "assets/imagenes/orbita-iss.jpg", subtitulo: "Como la Estación Espacial",
      destinoCohete: "leo", altitudTexto: "400 km", periodoTexto: "92 min",
      eclipseFraccion: 0.38, eclipseHoras: 0.6, minutosContactoDia: 30, factorDistancia: 1,
      vidaOrbitaAnios: 2, vidaConMotorAnios: 15, deltaVLlegada: 0, deltaVAnual: 0.03,
      causaVidaOrbita: "El poco aire que hay a 400 km frena la nave y la hace caer en unos 2 años si no tiene motor.",
      riesgoBasura: 0.12,
      multCiencia: { imagenes: 0.4, rayos: 0.15, fuego: 0.4, sonda: 0.7, espacial: 0.6 },
      notaCiencia: "Pasa sobre cada lugar por pocos minutos y a horas distintas: nunca se queda mirando un incendio.",
      descripcion: "Fotos con mucho detalle, pero solo por ratitos.",
      dibujo: { rx: 1.45, ry: 0.45, rot: -0.35, vel: 2.2, arcoContacto: 0.45 },
      fuentes: ["iss"]
    },
    {
      id: "polar", nombre: "Órbita polar heliosíncrona", imagen: "assets/imagenes/orbita-landsat.jpg", subtitulo: "Como Landsat y los satélites del clima polares",
      destinoCohete: "sso", altitudTexto: "705 km", periodoTexto: "99 min",
      eclipseFraccion: 0.35, eclipseHoras: 0.58, minutosContactoDia: 100, factorDistancia: 1,
      vidaOrbitaAnios: 25, vidaConMotorAnios: 25, deltaVLlegada: 0, deltaVAnual: 0.005,
      causaVidaOrbita: "A 705 km casi no hay aire: la órbita dura décadas.",
      riesgoBasura: 0.2,
      multCiencia: { imagenes: 0.5, rayos: 0.15, fuego: 0.5, sonda: 1, espacial: 0.7 },
      notaCiencia: "Pasa sobre Chile solo unas 2 veces al día: un incendio puede crecer muchísimo entre una foto y otra.",
      descripcion: "Ve todo el planeta, pero vuelve al mismo lugar solo cada varias horas.",
      dibujo: { rx: 0.35, ry: 1.5, rot: 0.15, vel: 1.9, arcoContacto: 0.9 },
      fuentes: ["landsat9"]
    },
    {
      id: "geo", nombre: "Órbita geoestacionaria", imagen: "assets/imagenes/orbita-goes.jpg", subtitulo: "Como GOES-East (NOAA/NASA)",
      destinoCohete: "geo", altitudTexto: "35.786 km", periodoTexto: "24 horas",
      eclipseFraccion: 0.01, eclipseHoras: 1.2, descargaSegura: 0.8, minutosContactoDia: 1440, factorDistancia: 0.03,
      vidaOrbitaAnios: 3, vidaConMotorAnios: 15, deltaVLlegada: 0, deltaVAnual: 0.05,
      causaVidaOrbita: "Sin motor, la nave se corre de su lugar en el cielo y deja de mirar a Sudamérica.",
      riesgoBasura: 0.03,
      multCiencia: { imagenes: 1, rayos: 1, fuego: 1, sonda: 0.9, espacial: 1 },
      notaCiencia: "Ve toda Sudamérica sin parar y puede tomar una imagen completa cada 10 minutos, como GOES-East.",
      descripcion: "Siempre sobre el mismo punto del ecuador, mirando América.",
      dibujo: { rx: 2.3, ry: 0.6, rot: -0.1, vel: 0.5, arcoContacto: 7 },
      fuentes: ["goesr", "goes_chile_fires"]
    }
  ],

  instrumentos: [
    { id: "imagenes", nombre: "Generador de imágenes multibanda", imagen: "assets/imagenes/inst-incendios-imagenes.jpg", inspirado: "Inspirado en ABI de GOES-R",
      descripcion: "Fotografía nubes, humo y ceniza en 16 colores distintos, de día y de noche.",
      masa: 60, energia: 120, costo: 35, datos: 25, ciencia: 300, necesitaPunteria: true, fuentes: ["goesr"] },
    { id: "rayos", nombre: "Mapeador de rayos", imagen: "assets/imagenes/inst-incendios-rayos.jpg", inspirado: "Inspirado en GLM de GOES-R",
      descripcion: "Detecta cada rayo de las tormentas. Los rayos pueden iniciar incendios en zonas remotas.",
      masa: 30, energia: 50, costo: 15, datos: 5, ciencia: 200, necesitaPunteria: true, fuentes: ["goesr", "nasa_chile_rayos"] },
    { id: "fuego", nombre: "Detector infrarrojo de incendios", imagen: "assets/imagenes/inst-incendios-fuego.jpg", inspirado: "Inspirado en los productos de fuego de GOES",
      descripcion: "Encuentra puntos muy calientes: incendios recién empezando y lava de volcanes.",
      masa: 20, energia: 40, costo: 12, datos: 8, ciencia: 220, necesitaPunteria: true, fuentes: ["goes_chile_fires"] },
    { id: "sonda", nombre: "Sonda de humedad y temperatura del aire", imagen: "assets/imagenes/inst-incendios-sonda.jpg", inspirado: "Inspirada en las sondas infrarrojas meteorológicas",
      descripcion: "Mide el aire capa por capa: ayuda a predecir sequías, viento y riesgo de incendio.",
      masa: 40, energia: 80, costo: 20, datos: 10, ciencia: 180, necesitaPunteria: true, fuentes: ["goesr"] },
    { id: "espacial", nombre: "Monitor de clima espacial", imagen: "assets/imagenes/inst-incendios-espacial.jpg", inspirado: "Inspirado en SUVI y SEISS de GOES-R",
      descripcion: "Vigila al Sol y avisa de tormentas solares que pueden dañar satélites y redes eléctricas.",
      masa: 10, energia: 20, costo: 8, datos: 1, ciencia: 120, necesitaPunteria: false, fuentes: ["goesr", "swpc"] }
  ]
});
