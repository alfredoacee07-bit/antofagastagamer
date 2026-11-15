/* =====================================================================
   supervivencia.js — Datos del modo "Varado en Marte" (fácil de editar)
   ---------------------------------------------------------------------
   Historia original: tu nave de regreso se dañó y quedaste solo/a en una
   base del cráter Jezero (donde trabaja el rover Perseverance). Debes
   sobrevivir hasta que llegue la nave de rescate.
   Los números de una persona (oxígeno, agua, comida) y de Marte son reales;
   algunos ritmos están acelerados para que se noten jugando (se avisa abajo).
   ===================================================================== */

DATOS.supervivencia = {
  // Tiempo
  segundosPorSol: 40,          // cuánto dura un sol (día marciano) jugando
  horasPorSol: 24.66,          // un sol real dura 24 h 39 min
  inicioHora: 7,               // la historia empieza a las 7:00 de la mañana
  amanecer: 6.2, atardecer: 18.4,

  // Rescate: cuántos soles hay que sobrevivir (según la dificultad)
  solesRescate: { cadete: 20, ingeniera: 30, directora: 40 },

  // Una persona en un sol (valores reales aproximados de la NASA)
  consumoPorSol: { oxigeno: 0.84, agua: 3.0, comida: 1 },   // kg de O2 · litros · raciones (1 ración ≈ 2.500 kcal)

  // Lo que hay en la base al comenzar
  inicial: { oxigeno: 6, agua: 12, comida: 14, energia: 14, traje: 100, salud: 100, radiacion: 0, polvo: 0.12, hielo: 0 },
  maximos: { oxigeno: 20, agua: 40, comida: 40, energia: 24, traje: 100, salud: 100, hielo: 10 },

  // Energía (kWh guardados en las baterías de la base)
  energia: {
    panelesKW: 4.8,            // potencia de los paneles limpios a pleno sol (unos 30 m² de paneles)
    baseKW: 0.35,              // calefacción, aire y computador de la base
    oxigenoKW: 0.6,            // generador de oxígeno encendido
    invernaderoKW: 0.25,       // luces y calor del invernadero
    recicladorKW: 0.1          // reciclador de agua
  },
  // Generador de oxígeno (una versión más grande de MOXIE): saca O2 del CO2 del aire
  oxigenoPorSol: 1.1,          // kg de O2 por sol si está encendido todo el sol
  reciclajeAgua: 0.8,          // el reciclador recupera el 80% del agua usada
  polvoPorSol: 0.035,          // los paneles pierden 3,5% por sol (acelerado: en Marte real es ~0,2-0,3%)
  traje: { gastoPorSolFuera: 100, gastoNocheExtra: 1.6 },   // % de batería del traje por sol afuera (de noche, ×1,6)
  radiacion: { superficiePorSol: 0.67, basePorSol: 0.35 },  // mSv por sol (medido por RAD de Curiosity)
  invernadero: { solesCosecha: 6, raciones: 9, aguaPorSol: 1.0 },
  hieloPorViaje: 6,            // kg de hielo que caben en la mochila (1 kg ≈ 1 litro de agua)

  // Lugares del mapa (en metros). "radio" = tamaño para chocar
  lugares: [
    { id: "base", nombre: "Hábitat", icono: "casa", x: 0, z: 0, radio: 3.4, color: "#f2f2f2",
      texto: "Tu casa en Marte: aire, calor y protección contra la radiación." },
    { id: "paneles", nombre: "Paneles solares", icono: "sol", x: 13, z: -7, radio: 3.2, color: "#4cc9f0",
      texto: "Dan toda la energía de la base, pero el polvo de Marte los va tapando." },
    { id: "oxigeno", nombre: "Generador de oxígeno", icono: "burbuja", x: -9, z: -5, radio: 1.6, color: "#3ddc84",
      texto: "Saca oxígeno del aire de Marte (95% dióxido de carbono), como el experimento MOXIE de Perseverance." },
    { id: "invernadero", nombre: "Invernadero", icono: "hoja", x: -11, z: 9, radio: 3.0, color: "#9be564",
      texto: "Cultiva papas y lechugas con agua, luz y el calor de la base." },
    { id: "antena", nombre: "Antena", icono: "antena", x: 8, z: 11, radio: 1.4, color: "#c77dff",
      texto: "Para hablar con la Tierra. Un mensaje tarda entre 4 y 22 minutos en llegar." },
    { id: "hielo", nombre: "Depósito de hielo", icono: "gota", x: 34, z: 27, radio: 2.6, color: "#9fe6ff",
      texto: "Hielo enterrado bajo el polvo. Derretido, es agua para beber y para el invernadero." },
    { id: "rescate", nombre: "Zona de aterrizaje", icono: "cohete", x: -38, z: -33, radio: 2.2, color: "#ffb703",
      texto: "Aquí aterrizará la nave de rescate. Tienes que estar aquí cuando llegue." }
  ],
  limite: 58,                  // el mapa va de −58 a 58 m

  // Lo que se puede hacer en cada lugar (horas = tiempo que toma)
  acciones: {
    base: [
      { id: "descansar", nombre: "Descansar hasta mañana", icono: "luna", texto: "Duermes hasta las 7:00. Recuperas salud y el traje se carga." },
      { id: "cargarTraje", nombre: "Cargar el traje", icono: "bateria", horas: 1, texto: "Llena la batería y el oxígeno del traje (1 hora)." },
      { id: "derretir", nombre: "Derretir el hielo", icono: "gota", horas: 1, texto: "Convierte el hielo que trajiste en agua (gasta 1,5 kWh)." },
      { id: "comer", nombre: "Revisar provisiones", icono: "lista", texto: "Mira cuánto te queda de todo y cuánto gastas por sol." }
    ],
    paneles: [{ id: "limpiar", nombre: "Limpiar el polvo", icono: "sol", horas: 2, texto: "Con una escobilla, panel por panel (2 horas)." }],
    oxigeno: [
      { id: "reparar", nombre: "Reparar el generador", icono: "llave", soloSiRoto: true, texto: "Conecta los cables sueltos (minijuego)." },
      { id: "alternarOxigeno", nombre: "Encender / apagar", icono: "rayo", texto: "Encendido produce oxígeno, pero gasta 0,6 kW de energía." }
    ],
    invernadero: [
      { id: "sembrar", nombre: "Sembrar", icono: "hoja", horas: 2, texto: "Siembra papas. En 6 soles podrás cosechar (2 horas)." },
      { id: "cosechar", nombre: "Cosechar", icono: "hoja", horas: 2, texto: "Recoge lo que creció (2 horas)." },
      { id: "alternarInvernadero", nombre: "Luces encendidas / apagadas", icono: "rayo", texto: "Sin luz ni calor, las plantas no crecen." }
    ],
    antena: [
      { id: "alinear", nombre: "Alinear la antena", icono: "antena", soloSiRoto: true, texto: "Apunta de nuevo a la Tierra (minijuego)." },
      { id: "contactar", nombre: "Hablar con la Tierra", icono: "antena", horas: 1, texto: "Pide noticias del rescate (1 hora)." }
    ],
    hielo: [{ id: "excavar", nombre: "Excavar hielo", icono: "llave", horas: 2, texto: "Llenas la mochila con 6 kg de hielo (2 horas)." }],
    rescate: [{ id: "esperarRescate", nombre: "Esperar la nave", icono: "cohete", texto: "La nave aterriza a las 9:00 del sol del rescate y espera hasta las 18:00." }]
  },

  // Datos curiosos que aparecen en el camino (con fuente)
  datosMarte: [
    { id: "sol", titulo: "Un día en Marte", texto: "Un día marciano se llama «sol» y dura 24 horas, 39 minutos y 35 segundos: casi lo mismo que un día en la Tierra.", fuentes: ["mars_facts"] },
    { id: "gravedad", titulo: "Más liviano", texto: "La gravedad de Marte es el 38% de la de la Tierra. Si pesas 40 kg, en Marte te sentirías como de 15 kg.", fuentes: ["mars_facts"] },
    { id: "aire", titulo: "No se puede respirar", texto: "El aire de Marte es 95% dióxido de carbono y su presión es menos del 1% de la de la Tierra. Sin traje, no sobrevivirías ni un minuto.", fuentes: ["mars_facts"] },
    { id: "frio", titulo: "Noches heladas", texto: "En el cráter Jezero, de noche la temperatura baja a unos −80 °C. El traje gasta mucha más energía para mantenerte caliente.", fuentes: ["mars2020"] },
    { id: "atardecer", titulo: "Atardeceres azules", texto: "En Marte el cielo de día es color caramelo, pero los atardeceres son azules: el polvo fino deja pasar mejor la luz azul cerca del Sol.", fuentes: ["atardecer_marte"] },
    { id: "moxie", titulo: "Oxígeno marciano", texto: "MOXIE, un aparato del tamaño de una tostadora a bordo de Perseverance, sacó oxígeno del aire de Marte: hasta 12 gramos por hora. Una persona necesita unos 35 g por hora, así que tu generador es una versión más grande.", fuentes: ["moxie"] },
    { id: "radiacion", titulo: "Radiación", texto: "Marte no tiene un campo magnético que lo proteja. El instrumento RAD del rover Curiosity midió unos 0,67 milisieverts por día en la superficie: unas 50 veces más que en la Tierra.", fuentes: ["rad_curiosity"] },
    { id: "polvo", titulo: "El enemigo polvo", texto: "El polvo que se acumuló en los paneles solares terminó apagando a las sondas InSight (2022) y Opportunity (2018). Limpiarlos es clave.", fuentes: ["insight"] },
    { id: "agua", titulo: "Reciclar el agua", texto: "En la Estación Espacial se recicla casi toda el agua, incluso el sudor y la orina. Tu base recupera el 80%.", fuentes: ["eclss"] },
    { id: "lunas", titulo: "Dos lunas", texto: "Marte tiene dos lunas pequeñas: Fobos y Deimos. Fobos da tres vueltas a Marte en un solo sol.", fuentes: ["mars_facts"] }
  ],

  /* IMPREVISTOS
     enSol: en qué parte de la espera ocurre (0,3 = al 30% del camino al rescate)
     soloDificil: solo en dificultad Directora · nocturno: pasa si estás afuera de noche
     tipo "decision" = elegir una opción · "aviso" = solo informa · "falla" = algo se rompe y
     se arregla con un minijuego en ese lugar · "minijuego" = se juega en el momento */
  eventos: [
    { id: "fallaOxigeno", enSol: 0.18, tipo: "falla", lugar: "oxigeno", minijuego: "reparacion", titulo: "¡Se rompió el generador de oxígeno!", imagen: "assets/imagenes/comp-computador.jpg",
      texto: "Una vibración soltó los cables del generador y dejó de producir oxígeno. Ve a repararlo antes de que el aire de la base se acabe.",
      paz: "Camina hasta el generador y elige «Reparar». Tendrás que conectar cada sistema con su lugar correcto.",
      resultados: { bien: { mensaje: "¡Reparación perfecta! El generador vuelve a funcionar." },
        regular: { horas: 2, mensaje: "Lo reparaste, pero te tomó 2 horas más." },
        mal: { horas: 5, traje: -20, mensaje: "Costó mucho: 5 horas de trabajo y el traje quedó con poca batería." } } },
    { id: "tormentaPolvo", enSol: 0.32, tipo: "decision", duracionSoles: 2, titulo: "¡Se acerca una tormenta de polvo!", imagen: "assets/imagenes/evento-polvoMarte.jpg",
      texto: "Una tormenta de polvo cubrirá el cielo por unos 2 soles. Los paneles darán muy poca energía y al final quedarán más sucios. En 2018, una tormenta así cubrió todo Marte y apagó para siempre al rover Opportunity.",
      paz: "Con poca energía, conviene apagar lo que no sea vital. ¿Qué decides?",
      fuentes: ["opportunity"],
      opciones: [
        { texto: "Apagar el invernadero mientras dure", explicacion: "Ahorras 0,25 kW, pero las plantas no crecen esos días.", efecto: { invernaderoOn: false } },
        { texto: "Apagar el generador de oxígeno por un rato", explicacion: "Ahorras 0,6 kW, pero tendrás que volver a encenderlo antes de que baje mucho el oxígeno.", efecto: { oxigenoOn: false } },
        { texto: "No apagar nada", explicacion: "Todo sigue funcionando… mientras dure la batería.", efecto: {} }
      ] },
    { id: "tormentaSolar", enSol: 0.5, tipo: "aviso", avisoHoras: 2, duracionHoras: 5, titulo: "¡Alerta de tormenta solar!", imagen: "assets/imagenes/evento-tormenta.jpg",
      texto: "Los satélites que vigilan el Sol detectaron una explosión enorme. En 2 horas llegará una lluvia de partículas que durará unas 5 horas. Marte no tiene campo magnético que lo proteja: afuera, la radiación será unas 60 veces mayor.",
      paz: "¡Vuelve al hábitat y quédate adentro hasta que pase! Las paredes de la base te protegen.",
      fuentes: ["swpc", "rad_curiosity"] },
    { id: "antenaFalla", enSol: 0.66, tipo: "falla", lugar: "antena", minijuego: "antena", titulo: "¡La antena perdió la Tierra!", imagen: "assets/imagenes/evento-antena.jpg",
      texto: "El viento movió la antena y ya no apunta a la Tierra. Sin ella no puedes avisar dónde estás. Si la alineas muy bien, la nave sabrá tu posición exacta y podrá llegar antes.",
      paz: "Ve a la antena y elige «Alinear». Mantén la estación terrestre dentro del círculo.",
      fuentes: ["dsn"],
      resultados: { bien: { adelantaRescate: 1, mensaje: "¡Enlace perfecto! La Tierra recibió tu ubicación exacta: el rescate se adelanta 1 sol." },
        regular: { mensaje: "La antena volvió a funcionar." },
        mal: { horas: 3, mensaje: "Lo lograste después de 3 horas de intentos." } } },
    { id: "tormentaPolvo2", enSol: 0.82, tipo: "decision", duracionSoles: 1, copiaDe: "tormentaPolvo", noEnCadete: true, titulo: "¡Otra tormenta de polvo!" },
    { id: "perdido", tipo: "minijuego", nocturno: true, desdeSol: 3, minijuego: "estrellas", titulo: "¡Perdiste el rumbo en la oscuridad!", imagen: "assets/imagenes/comp-orientacion.jpg",
      texto: "Es de noche y el polvo no deja ver la base. La pantalla del traje se reinició: para saber hacia dónde caminar, tienes que reconocer las estrellas.",
      paz: "Busca las constelaciones del mapa y toca las estrellas que te pido. ¡Así se orientaban los navegantes!",
      fuentes: ["estrellas"],
      resultados: { bien: { mensaje: "¡Te orientaste por las estrellas y volviste por el camino más corto!" },
        regular: { traje: -15, mensaje: "Encontraste el camino, pero diste vueltas: el traje gastó 15% más." },
        mal: { traje: -35, horas: 1, mensaje: "Caminaste perdido/a casi una hora: el traje gastó 35% más." } } }
  ],
  // Rescate: la nave aterriza a las 9:00 y espera hasta las 18:00
  naveLlega: 9, naveEspera: 18,

  // Textos de la historia del modo
  historia: {
    intro: "Una tormenta de polvo dañó tu nave de regreso y la tripulación tuvo que despegar sin ti. Estás en la base del cráter Jezero, en Marte. Desde la Tierra ya preparan una nave de rescate, pero tardará. Tienes que mantenerte con vida: oxígeno, agua, comida y energía. ¡Cada decisión cuenta!",
    paz: "Te hablo desde la Tierra. Mis mensajes tardan varios minutos en llegar, así que vas a tener que decidir tú. Primero revisa el panel de supervivencia. Camina hasta cada lugar y pulsa E para trabajar ahí."
  }
};

// Fuentes nuevas
Object.assign(DATOS.fuentes, {
  moxie: { titulo: "MOXIE (Mars Oxygen In-Situ Resource Utilization Experiment)", org: "NASA / JPL", url: "https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/",
    usado: "MOXIE produjo oxígeno del aire de Marte (hasta ~12 g por hora)." },
  rad_curiosity: { titulo: "Mars' Surface Radiation Environment Measured with Curiosity (Hassler et al., Science 2014)", org: "Science / NASA", url: "https://doi.org/10.1126/science.1244797",
    usado: "Unos 0,67 mSv por día de radiación en la superficie de Marte." },
  insight: { titulo: "InSight Lander", org: "NASA", url: "https://science.nasa.gov/mission/insight/",
    usado: "La misión terminó en 2022 porque el polvo tapó sus paneles solares." },
  eclss: { titulo: "Environmental Control and Life Support System", org: "NASA", url: "https://www.nasa.gov/reference/environmental-control-and-life-support-system-eclss/",
    usado: "Consumo de oxígeno y agua de una persona y reciclaje del agua en la Estación Espacial." },
  atardecer_marte: { titulo: "Sunset Sequence in Mars' Gale Crater (PIA19400)", org: "NASA/JPL-Caltech", url: "https://photojournal.jpl.nasa.gov/catalog/PIA19400",
    usado: "Los atardeceres azules de Marte fotografiados por Curiosity." }
});

// Explicaciones "¿Por qué?"
Object.assign(DATOS.porQue, {
  svOxigeno: { titulo: "Oxígeno", texto: "Una persona respira unos 0,84 kg de oxígeno por día. El generador lo saca del CO2 del aire de Marte, pero necesita energía. Si se acaba el oxígeno, la salud cae muy rápido." },
  svAgua: { titulo: "Agua", texto: "Una persona usa unos 3 litros de agua por día para beber y preparar comida. El reciclador recupera el 80%. El resto hay que sacarlo del hielo que hay bajo el suelo." },
  svComida: { titulo: "Comida", texto: "Una ración es la comida de un día (unas 2.500 kilocalorías). Las provisiones no alcanzan hasta el rescate: hay que cultivar en el invernadero." },
  svEnergia: { titulo: "Energía", texto: "Los paneles solares cargan las baterías de día. De noche solo se gasta. El polvo tapa los paneles y cada aparato encendido consume más." },
  svTraje: { titulo: "Batería del traje", texto: "Afuera, el traje te da aire y calor. Se descarga con el tiempo, y de noche mucho más rápido por el frío. Se carga dentro del hábitat." },
  svSalud: { titulo: "Salud", texto: "Baja si te falta oxígeno, agua o comida, o si el traje se descarga afuera. Descansar en el hábitat ayuda a recuperarla." },
  svRadiacion: { titulo: "Radiación", texto: "Afuera recibes unos 0,67 milisieverts por sol; dentro del hábitat, menos. Un astronauta no debería pasar de unos cientos de milisieverts en toda su carrera." }
});
