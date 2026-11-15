/* =====================================================================
   historia.js — Modo historia: "Rumbo a Marte" (fácil de editar)
   ---------------------------------------------------------------------
   Una historia original en 5 capítulos. Tú eres el/la protagonista: el
   texto {nombre} se reemplaza por el nombre que escribas.
   Cada capítulo de misión es un CONTRATO (como en Misión rápida): tiene
   presupuesto, minutos para lanzar y objetivos. El último capítulo es
   "Varado en Marte" (modo supervivencia).
   Para pasar un capítulo de misión hay que cumplir todos los objetivos
   menos uno (como máximo). Cumplirlos todos da 3 estrellas.
   ===================================================================== */

DATOS.historia = {
  titulo: "Rumbo a Marte",
  resumen: "Eres {nombre}, la persona más nueva del equipo de misiones del centro espacial de Antofagasta. Empiezas con un satélite pequeño… y terminas caminando sobre Marte.",
  capitulos: [
    { n: 1, tipo: "mision", contrato: "hist-1", titulo: "El primer satélite", icono: "satelite",
      intro: "Primer día en el centro espacial. La Ingeniera Paz te recibe con un encargo: los glaciares de los Andes se están derritiendo y nadie los está midiendo de cerca. Tienes que diseñar tu primer satélite. Pequeño, barato… y que dure.",
      leccion: "Todo está conectado: cada instrumento que agregas pide más energía, más memoria, más masa y más dinero. Diseñar es encontrar el equilibrio.",
      final: "Tu satélite manda las primeras imágenes de los glaciares. En el centro espacial aplauden: «{nombre}, eso fue un gran comienzo»." },
    { n: 2, tipo: "mision", contrato: "hist-2", titulo: "Fuego en el sur", icono: "alerta",
      intro: "Es verano y los incendios avanzan rápido en el centro-sur de Chile. Las brigadas necesitan ver el fuego apenas comienza, de día y de noche. Esta vez no hay tiempo: tienes un reloj corriendo.",
      leccion: "Desde la órbita geoestacionaria (a 35.786 km) un satélite mira SIEMPRE la misma región, porque da la vuelta a la Tierra en un día. Por eso sirve para vigilar cosas que cambian rápido.",
      final: "Gracias a tu satélite, las brigadas detectan dos incendios en sus primeros minutos. Te ganaste un lugar en el programa lunar." },
    { n: 3, tipo: "mision", contrato: "hist-3", titulo: "Hielo en la Luna", icono: "luna",
      intro: "Los astronautas que volverán a la Luna necesitan agua, y en los cráteres del polo sur, que nunca ven el Sol, puede haber hielo. Paz te pide algo nuevo: esta vez diseñarás también el cohete, etapa por etapa.",
      leccion: "La ecuación del cohete: para llegar más lejos necesitas más combustible, que pesa, y que necesita más combustible para moverse. Por eso los cohetes tienen etapas: soltar los tanques vacíos los hace más livianos.",
      final: "Tu detector encuentra señales de hielo en el polo sur lunar. La agencia te ofrece lo que soñabas: viajar a Marte." },
    { n: 4, tipo: "mision", contrato: "hist-4", titulo: "La ventana a Marte", icono: "calendario",
      intro: "Antes de viajar tú, hay que enviar una nave que estudie el agua y el clima de Marte. Pero Marte no espera: la Tierra y Marte se alinean bien solo cada 26 meses. Usa el planificador del viaje con las posiciones reales de los planetas.",
      leccion: "Las ventanas de lanzamiento: el camino más barato a Marte sale cuando Marte va unos 44° adelante de la Tierra. Fuera de la ventana, el cohete gasta mucha más energía y lleva menos carga.",
      final: "La nave llega a Marte en la fecha justa. Con sus datos se elige el lugar para la primera base: el cráter Jezero. Y tú irás en la tripulación." },
    { n: 5, tipo: "marte", dificultad: "ingeniera", titulo: "Varado en Marte", icono: "casco",
      intro: "Llevas semanas en la base de Jezero cuando una tormenta de polvo daña la nave de regreso. La tripulación tiene que despegar sin ti. Ahora todo depende de lo que aprendiste: oxígeno, agua, comida y energía… hasta que llegue el rescate.",
      leccion: "Para vivir en otro planeta hay que producir allí lo que se necesita: oxígeno del aire, agua del hielo, comida del invernadero y energía del Sol.",
      final: "La nave de rescate despega con {nombre} a bordo. Desde la ventana ves la base hacerse pequeña sobre el polvo rojo." }
  ],
  epilogo: "Meses después, en Antofagasta, todo el centro espacial te espera. Diseñaste satélites, cohetes y una misión a Marte, y sobreviviste en el planeta rojo. Paz te entrega tu insignia: {nombre}, astronauta. «Lo más importante no fue que nada fallara», te dice, «sino que siempre supiste por qué fallaba y cómo arreglarlo». Fin… por ahora."
};

// Los contratos de los capítulos (no aparecen en Misión rápida: historia: true)
DATOS.contratos.push(
  { id: "hist-1", historia: true, nombre: "Capítulo 1 · El primer satélite", escenario: "chile", minutos: 15, presupuesto: 80,
    cliente: "Centro espacial de Antofagasta (ficticio)", encargo: "Diseña un satélite que mida los glaciares de Chile durante 3 años.",
    objetivos: [{ tipo: "ciencia", valor: 250 }, { tipo: "supervivencia", valor: 1 }],
    recompensa: { porObjetivo: 100, bonoCompleto: 200 } },
  { id: "hist-2", historia: true, nombre: "Capítulo 2 · Fuego en el sur", escenario: "incendios", minutos: 10, presupuesto: 180,
    cliente: "Brigadas de emergencia (ficticio)", encargo: "Vigila los incendios de día y de noche. ¡Rápido!",
    objetivos: [{ tipo: "orbita", valor: "geo" }, { tipo: "instrumento", valor: "fuego" }, { tipo: "perdidosMax", valor: 0.25 }],
    recompensa: { porObjetivo: 100, bonoCompleto: 200 } },
  { id: "hist-3", historia: true, nombre: "Capítulo 3 · Hielo en la Luna", escenario: "luna", minutos: 15, presupuesto: 150,
    cliente: "Programa lunar (ficticio)", encargo: "Busca hielo en el polo sur lunar con un cohete diseñado por ti.",
    objetivos: [{ tipo: "cohetePropio", valor: true }, { tipo: "instrumento", valor: "neutrones" }, { tipo: "supervivencia", valor: 1 }],
    recompensa: { porObjetivo: 100, bonoCompleto: 250 } },
  { id: "hist-4", historia: true, nombre: "Capítulo 4 · La ventana a Marte", escenario: "marte", minutos: 15, presupuesto: 190,
    cliente: "Programa Marte (ficticio)", encargo: "Envía una nave a Marte en la mejor ventana de lanzamiento.",
    objetivos: [{ tipo: "ventana", valor: true }, { tipo: "supervivencia", valor: 0.9 }, { tipo: "ciencia", valor: 200 }],
    recompensa: { porObjetivo: 100, bonoCompleto: 250 } }
);
