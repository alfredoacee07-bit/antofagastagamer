/* =====================================================================
   Escenario 1: Vigilar los glaciares y la sequía de Chile
   Órbita terrestre. La mejor opción real: polar heliosíncrona (como Landsat).
   ---------------------------------------------------------------------
   Guía de campos de un escenario:
     presupuesto (M USD), duracionDias (días midiendo), diasViaje,
     diasViajeElectrico (días EXTRA si usas motor eléctrico),
     costoFijo (armado, pruebas y operación), factorSolar (1 = luz en la Tierra),
     propulsionObligatoria, cuerpo (dibujo), orbitas[], instrumentos[], eventos[]
   Órbitas:
     destinoCohete qué columna de capacidad del cohete se usa
     deltaVLlegada km/s que la nave debe hacer con su motor para llegar
     deltaVAnual   km/s por año para mantener la órbita (si lleva motor)
     vidaOrbitaAnios / vidaConMotorAnios cuánto dura la órbita sin / con motor
   ===================================================================== */

DATOS.escenarios.push({
  id: "chile",
  nombre: "Vigilar los glaciares y la sequía de Chile",
  destino: "Órbita de la Tierra",
  imagen: "assets/imagenes/escenario-chile.jpg",
  cuerpo: "tierra",
  descripcion: "Chile tiene más de 26.000 glaciares que guardan agua para ríos y ciudades, y la zona central vive una megasequía desde 2010.",
  objetivo: "Medir cuánto retroceden los glaciares de los Andes y los Campos de Hielo, y vigilar la humedad del suelo, los embalses y la vegetación de la zona central.",
  zona: "Todo Chile: de 17° Sur (Arica) a 56° Sur (Cabo de Hornos)",
  presupuesto: 80,
  duracionDias: 1095,
  diasViaje: 0,
  diasViajeElectrico: 0,
  costoFijo: 8,
  factorSolar: 1,
  propulsionObligatoria: false,
  orbitaInicial: "baja",
  orbitaRecomendada: "polar",
  instrumentosRecomendados: ["optica", "radar"],
  eventos: ["tormenta", "antena", "basura", "arrastre", "cortocircuito", "rueda"],
  fuentes: ["dga_glaciares", "meteored_glaciares", "cr2_megasequia", "landsat9", "sentinel2", "iceye", "iss"],
  intro: { titulo: "Misión Glaciares", texto: "Los glaciares son como 'refrigeradores de agua' que alimentan los ríos en verano. Desde el espacio podemos medirlos todos, ¡incluso los que nadie puede visitar!" },
  preguntas: [
    "¿Por qué crees que casi todos los satélites que vigilan el medio ambiente usan órbitas polares y no la geoestacionaria?",
    "Agregar más instrumentos da más ciencia, pero ¿qué otros problemas aparecen? ¿Dónde está el equilibrio?",
    "¿Cómo podrían usar tus datos los agricultores, los alcaldes o la Dirección General de Aguas?"
  ],

  orbitas: [
    {
      id: "baja", nombre: "Órbita baja", imagen: "assets/imagenes/orbita-iss.jpg", subtitulo: "Como la Estación Espacial Internacional",
      destinoCohete: "leo", altitudTexto: "400 km", periodoTexto: "92 min",
      eclipseFraccion: 0.38, eclipseHoras: 0.6, minutosContactoDia: 30, factorDistancia: 1,
      vidaOrbitaAnios: 2, vidaConMotorAnios: 15, deltaVLlegada: 0, deltaVAnual: 0.03,
      causaVidaOrbita: "A 400 km todavía queda un poquito de aire: frena la nave y la hace caer en unos 2 años si no tiene motor.",
      riesgoBasura: 0.12,
      multCiencia: { optica: 0.7, termica: 0.7, radar: 0.7, espectrometro: 0.7, temperatura: 1 },
      notaCiencia: "Con inclinación de 51,6° no llega a los glaciares más australes (Cordillera Darwin) y pasa cada día a distinta hora, con distinta luz.",
      descripcion: "Muy cerca y fácil de alcanzar, pero el aire la frena y no cubre todo Chile.",
      dibujo: { rx: 1.45, ry: 0.45, rot: -0.35, vel: 2.2, arcoContacto: 0.45 },
      fuentes: ["iss"]
    },
    {
      id: "polar", nombre: "Órbita polar heliosíncrona", imagen: "assets/imagenes/orbita-landsat.jpg", subtitulo: "Como Landsat 9 (NASA/USGS)",
      destinoCohete: "sso", altitudTexto: "705 km", periodoTexto: "99 min",
      eclipseFraccion: 0.35, eclipseHoras: 0.58, minutosContactoDia: 100, factorDistancia: 1,
      vidaOrbitaAnios: 25, vidaConMotorAnios: 25, deltaVLlegada: 0, deltaVAnual: 0.005,
      causaVidaOrbita: "A 705 km casi no hay aire: la nave puede quedarse arriba décadas.",
      riesgoBasura: 0.2,
      multCiencia: { optica: 1, termica: 1, radar: 1, espectrometro: 1, temperatura: 1 },
      notaCiencia: "Pasa de polo a polo y cubre todo Chile, siempre a la misma hora (cerca de las 10 de la mañana): las fotos se pueden comparar año tras año.",
      descripcion: "Pasa sobre los polos y ve todo el planeta. Estaciones como la de Punta Arenas la ven en muchas vueltas.",
      dibujo: { rx: 0.35, ry: 1.5, rot: 0.15, vel: 1.9, arcoContacto: 0.9 },
      fuentes: ["landsat9"]
    },
    {
      id: "geo", nombre: "Órbita geoestacionaria", imagen: "assets/imagenes/orbita-goes.jpg", subtitulo: "Como los satélites del clima GOES",
      destinoCohete: "geo", altitudTexto: "35.786 km", periodoTexto: "24 horas",
      eclipseFraccion: 0.01, eclipseHoras: 1.2, descargaSegura: 0.8, minutosContactoDia: 1440, factorDistancia: 0.03,
      vidaOrbitaAnios: 3, vidaConMotorAnios: 15, deltaVLlegada: 0, deltaVAnual: 0.05,
      causaVidaOrbita: "Sin motor, la nave se va corriendo de su lugar en el cielo y deja de ser útil en pocos años.",
      riesgoBasura: 0.03,
      multCiencia: { optica: 0.15, termica: 0.3, radar: 0.05, espectrometro: 0.1, temperatura: 1 },
      notaCiencia: "Está 90 veces más lejos que la órbita baja: las cámaras ven manchas de kilómetros y los glaciares casi no se distinguen.",
      descripcion: "Gira al mismo ritmo que la Tierra y siempre mira a América, pero está lejísimos.",
      dibujo: { rx: 2.3, ry: 0.6, rot: -0.1, vel: 0.5, arcoContacto: 7 },
      fuentes: ["goesr"]
    }
  ],

  instrumentos: [
    { id: "optica", nombre: "Cámara óptica multiespectral", imagen: "assets/imagenes/inst-chile-optica.jpg", inspirado: "Inspirada en Landsat (OLI) y Sentinel-2",
      descripcion: "Fotos en colores visibles e invisibles: muestra glaciares, nieve, embalses y plantas.",
      masa: 25, energia: 45, costo: 12, datos: 40, ciencia: 250, necesitaPunteria: true, fuentes: ["landsat9", "sentinel2"] },
    { id: "termica", nombre: "Cámara térmica", imagen: "assets/imagenes/inst-chile-termica.jpg", inspirado: "Inspirada en TIRS de Landsat",
      descripcion: "Mide el calor del suelo: detecta sequía y cuánta agua pierden los cultivos.",
      masa: 30, energia: 60, costo: 14, datos: 12, ciencia: 200, necesitaPunteria: true, fuentes: ["landsat9"] },
    { id: "radar", nombre: "Radar de apertura sintética", imagen: "assets/imagenes/inst-chile-radar.jpg", inspirado: "Inspirado en ICEYE y SAOCOM",
      descripcion: "Ve a través de las nubes y de noche. Muy útil en la Patagonia, ¡que casi siempre está nublada!",
      masa: 70, energia: 150, costo: 25, datos: 60, ciencia: 350, necesitaPunteria: true, fuentes: ["iceye"] },
    { id: "espectrometro", nombre: "Espectrómetro hiperespectral", imagen: "assets/imagenes/inst-chile-espectrometro.jpg", inspirado: "Inspirado en EnMAP y PRISMA",
      descripcion: "Separa la luz en cientos de colores: mide la salud de las plantas y la calidad del agua.",
      masa: 15, energia: 30, costo: 9, datos: 25, ciencia: 180, necesitaPunteria: true, fuentes: ["nasa_sst"] },
    { id: "temperatura", nombre: "Sensor de temperatura y radiación", imagen: "assets/imagenes/inst-chile-temperatura.jpg", inspirado: "Como los de los CubeSats escolares",
      descripcion: "Mide el ambiente alrededor de la nave. Pequeño, barato y casi no usa energía.",
      masa: 0.5, energia: 2, costo: 0.3, datos: 0.05, ciencia: 30, necesitaPunteria: false, fuentes: ["nasa_sst"] }
  ]
});
