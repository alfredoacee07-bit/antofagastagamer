/* =====================================================================
   motores.js — Piezas para armar un cohete propio por etapas (fácil de editar)
   ---------------------------------------------------------------------
   MOTORES (inspirados en motores reales, valores redondeados):
     empujeKN      → empuje de UN motor, en kilonewtons (1 kN ≈ levantar 100 kg)
     ispMar/ispVacio → impulso específico (s) a nivel del mar y en el vacío (mientras más alto, menos combustible gasta)
     ispSuperior   → impulso en etapas superiores, donde el motor usa una tobera más grande para el vacío
     masa          → kg de UN motor · costo → millones de USD por motor
     soloVacio     → true si no funciona bien a nivel del mar (solo etapas superiores)
     estructura    → fracción del combustible que pesa el tanque (el hidrógeno
                     es muy liviano y necesita tanques enormes y más pesados)
   TANQUES: cuántas toneladas de combustible lleva la etapa.
   DELTA-V POR DESTINO: cuánto debe cambiar la velocidad el cohete para dejar
     la carga en cada destino, incluyendo lo que se pierde por la gravedad y
     el aire durante el ascenso (valores típicos aproximados).
   ===================================================================== */

DATOS.motores = [
  { id: "pequeno", nombre: "Motor pequeño de queroseno", inspirado: "Inspirado en Rutherford (cohete Electron)",
    empujeKN: 25, ispMar: 303, ispVacio: 311, ispSuperior: 343, masa: 35, costo: 0.5, estructura: 0.05, combustible: "Queroseno y oxígeno líquido",
    fuentes: ["electron"] },
  { id: "mediano", nombre: "Motor de queroseno", inspirado: "Inspirado en Merlin 1D (cohete Falcon 9)",
    empujeKN: 845, ispMar: 282, ispVacio: 311, ispSuperior: 348, masa: 470, costo: 1, estructura: 0.05, combustible: "Queroseno y oxígeno líquido",
    fuentes: ["spacex"] },
  { id: "metano", nombre: "Motor de metano", inspirado: "Inspirado en los motores de metano de nueva generación",
    empujeKN: 2200, ispMar: 327, ispVacio: 350, ispSuperior: 380, masa: 1600, costo: 2, estructura: 0.05, combustible: "Metano y oxígeno líquido",
    fuentes: ["deltav"] },
  { id: "hidrogeno", nombre: "Motor de hidrógeno (etapa superior)", inspirado: "Inspirado en RL10 (etapas Centaur)",
    empujeKN: 110, ispMar: 200, ispVacio: 450, ispSuperior: 450, masa: 300, costo: 10, estructura: 0.1, soloVacio: true, combustible: "Hidrógeno y oxígeno líquido",
    fuentes: ["deltav"] }
];

DATOS.tanques = [
  { id: "micro", nombre: "Tanque mínimo", toneladas: 2.5 },
  { id: "chico", nombre: "Tanque chico", toneladas: 10 },
  { id: "mediano", nombre: "Tanque mediano", toneladas: 30 },
  { id: "grande", nombre: "Tanque grande", toneladas: 120 },
  { id: "gigante", nombre: "Tanque gigante", toneladas: 400 }
];

// km/s necesarios para llegar a cada destino desde el suelo (aproximado)
DATOS.deltaVDestino = { leo: 9.4, sso: 9.8, geo: 12.0, tli: 12.6, tmi: 13.0, esc: 12.8 };

// Reglas para armar cohetes
DATOS.reglasCohete = {
  maxEtapas: 3, maxMotores: 9,
  costoTanquePorTonelada: 0.05,   // M USD por tonelada de capacidad del tanque
  costoCombustiblePorTonelada: 0.002,
  costoIntegracionBase: 1,        // M USD por etapa (armado, pruebas, computador de vuelo)
  costoIntegracionPorTonelada: 0.02,
  empujePesoMinimo: 1.15,         // al despegar el empuje debe superar al peso con margen
  // Reutilizable: patas y aletas (+peso), combustible reservado para aterrizar y costo inicial mayor
  reutilizable: { masaExtra: 0.06, reservaAterrizaje: 0.08, sobrecosto: 1.3, costoReuso: 0.35 },
  puntosAterrizaje: 150
};

// El aterrizaje de la primera etapa (minijuego)
DATOS.aterrizaje = {
  titulo: "¡Aterriza la primera etapa!", imagen: "assets/imagenes/cohete-falcon9.jpg", rol: "ingeniera",
  descripcion: "La primera etapa ya separó y cae hacia la plataforma en el mar. Enciende el motor en el momento justo para posarla suavemente.",
  paz: "Mantén la flecha arriba para frenar y usa izquierda y derecha para inclinarte. Llega despacio (menos de 4 m/s), derecha y sobre la plataforma. ¡Ojo con el combustible!",
  minijuego: "aterrizaje",
  resultados: {
    bien: { mensaje: "¡Aterrizaje perfecto! La etapa se puede volver a usar: tu próxima misión con ella será mucho más barata." },
    regular: { mensaje: "La etapa aterrizó, pero dañada: habrá que repararla mucho antes de volver a usarla." },
    mal: { mensaje: "La etapa se estrelló en el mar. No se pudo recuperar esta vez." }
  }
};

// Fuente de los delta-v por destino
DATOS.fuentes.deltav = { titulo: "Delta-v budget", org: "Wikipedia (datos de NASA y libros de mecánica orbital)", url: "https://en.wikipedia.org/wiki/Delta-v_budget",
  usado: "Delta-v típicos: unos 9,4 km/s a órbita baja (con pérdidas), más ~3,2 km/s hacia la Luna y ~3,6 km/s hacia Marte." };

// Explicaciones para "¿Por qué?" y la Ingeniera Paz
Object.assign(DATOS.porQue, {
  etapas: { titulo: "¿Por qué los cohetes tienen etapas?", texto: "Cuando un tanque se vacía, sigue siendo peso muerto. Soltar la etapa vacía hace que el resto del cohete sea mucho más liviano y acelere más con el mismo combustible. Por eso casi todos los cohetes que llegan a órbita tienen 2 o 3 etapas." },
  empujePeso: { titulo: "Empuje y peso", texto: "Para despegar, el empuje de los motores debe ser MAYOR que el peso del cohete lleno. Si el empuje es menor, el cohete no se levanta. Los cohetes reales despegan con un empuje 1,2 a 1,5 veces su peso." },
  deltaVCohete: { titulo: "Delta-v del cohete", texto: "Cuánto puede cambiar su velocidad tu cohete con el combustible que tiene. Para quedar en órbita baja se necesitan unos 9,4 km/s (8 km/s de velocidad orbital más lo que se pierde por la gravedad y el aire). Cada etapa aporta una parte." },
  reutilizable: { titulo: "Etapas reutilizables", texto: "Una etapa que vuelve y aterriza se puede usar otra vez, como un avión. Pero necesita patas, aletas y combustible guardado para frenar: cuesta más la primera vez y lleva menos carga. A la larga, ahorra mucho dinero." },
  tiempoQuemado: { titulo: "Tiempo de encendido", texto: "Cuántos segundos funciona cada etapa hasta vaciar su tanque. Se calcula con el combustible, el impulso específico y el empuje de los motores." }
});
Object.assign(DATOS.conceptos, {
  cohetePropio: { titulo: "Arma tu propio cohete", texto: "Elige cuántas etapas, qué motores y qué tanques. Mira el delta-v: debe alcanzar para tu destino. ¡Y revisa que el empuje supere al peso, o no despegará!" },
  aterrizaje: { titulo: "Cohetes que aterrizan", texto: "Algunas primeras etapas vuelven y aterrizan en una plataforma en el mar. Si lo logras, la etapa se puede reutilizar y tu próxima misión será más barata." }
});
