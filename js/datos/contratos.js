/* =====================================================================
   contratos.js — Modos de juego y contratos (fácil de editar)
   ---------------------------------------------------------------------
   MODOS: aparecen en la pantalla "Elige cómo jugar".
     disponible: false → no se muestra en el juego (ideas para una versión futura).

   CONTRATOS (Misión rápida): un encargo con objetivos claros y un reloj.
     escenario   → id del escenario (chile, incendios, luna, marte, apofis)
     presupuesto → millones de USD (se multiplica por la dificultad)
     minutos     → tiempo sugerido para preparar y lanzar la misión
     objetivos   → lista de metas. Tipos posibles:
        ciencia      valor = puntos de ciencia mínimos
        supervivencia valor = fracción de la misión que la nave debe funcionar (1 = completa)
        costoMax     valor = costo máximo en M USD
        perdidosMax  valor = fracción máxima de datos perdidos (0,2 = 20%)
        orbita       valor = id de la órbita exigida, o una lista de órbitas permitidas
        instrumento  valor = id del instrumento que debe ir a bordo
        desafios     valor = promedio mínimo (%) en los desafíos (minijuegos)
     recompensa  → puntos por cada objetivo cumplido; "bonoCompleto" si se cumplen todos
   ===================================================================== */

DATOS.modos = [
  { id: "historia", nombre: "Modo historia", icono: "libro", duracion: "5 capítulos", disponible: true,
    descripcion: "Eres el/la protagonista: desde tu primer satélite hasta sobrevivir en Marte. Cada capítulo tiene una meta, un presupuesto y un reloj." },
  { id: "completa", nombre: "Misión completa", icono: "play", duracion: "30 a 45 min", disponible: true,
    descripcion: "Elige uno de los cinco encargos y diseña tu misión con calma, paso a paso." },
  { id: "rapida", nombre: "Misión rápida", icono: "reloj", duracion: "10 a 15 min", disponible: true,
    descripcion: "Un contrato con objetivos claros y un reloj. Ideal para una clase." },
  { id: "libre", nombre: "Modo libre", icono: "planeta", duracion: "Sin límite", disponible: true,
    descripcion: "Sin límite de presupuesto ni de tiempo. Experimenta con cualquier diseño, sin ranking." },
  { id: "equipo", nombre: "Modo equipo", icono: "grupo", duracion: "30 a 45 min", disponible: true,
    descripcion: "De 2 a 4 personas, cada una con un rol y una meta propia." },
  { id: "marte", nombre: "Varado en Marte", icono: "casco", duracion: "15 a 30 min", disponible: true,
    descripcion: "Quedaste solo/a en una base de Marte. Camina por el cráter y consigue oxígeno, agua, comida y energía hasta que llegue el rescate." },
  { id: "campana", nombre: "Campaña de contratos", icono: "documento", disponible: false,
    descripcion: "Administra un presupuesto a lo largo de varios contratos y desbloquea tecnologías." },
  { id: "carrera", nombre: "Carrera espacial", icono: "bandera", disponible: false,
    descripcion: "Varios equipos, el mismo contrato: ¿quién hace la mejor misión?" },
  { id: "desafio", nombre: "Desafío del día", icono: "estrella", disponible: false,
    descripcion: "Un contrato nuevo cada día, igual para todos." },
  { id: "historicas", nombre: "Misiones históricas", icono: "libro", disponible: false,
    descripcion: "Recrea versiones simplificadas de misiones reales de la historia espacial." },
  { id: "profesora", nombre: "Modo profesora", icono: "persona", disponible: false,
    descripcion: "La docente crea un contrato y el curso lo juega con un código." }
];

DATOS.contratos = [
  {
    id: "vigia-glaciares", nombre: "Vigía de glaciares", escenario: "chile", minutos: 12, presupuesto: 75,
    cliente: "Dirección General de Aguas (ficticio para el juego)",
    encargo: "Necesitamos un satélite que mida los glaciares de Chile durante 3 años completos, sin gastar de más.",
    objetivos: [
      { tipo: "ciencia", valor: 300 },
      { tipo: "supervivencia", valor: 1 },
      { tipo: "costoMax", valor: 70 }
    ],
    recompensa: { porObjetivo: 100, bonoCompleto: 200 }
  },
  {
    id: "alerta-incendios", nombre: "Alerta temprana de incendios", escenario: "incendios", minutos: 12, presupuesto: 170,
    cliente: "Brigadas de emergencia (ficticio para el juego)",
    encargo: "Queremos ver los incendios apenas comienzan, de día y de noche, sin perder datos importantes.",
    objetivos: [
      { tipo: "orbita", valor: "geo" },
      { tipo: "instrumento", valor: "fuego" },
      { tipo: "perdidosMax", valor: 0.2 }
    ],
    recompensa: { porObjetivo: 100, bonoCompleto: 200 }
  },
  {
    id: "hielo-lunar", nombre: "Cazadores de hielo lunar", escenario: "luna", minutos: 15, presupuesto: 120,
    cliente: "Programa de exploración lunar (ficticio para el juego)",
    encargo: "Los astronautas necesitan saber dónde hay hielo en el polo sur. Lleva un detector de neutrones.",
    objetivos: [
      { tipo: "instrumento", valor: "neutrones" },
      { tipo: "ciencia", valor: 350 },
      { tipo: "supervivencia", valor: 1 }
    ],
    recompensa: { porObjetivo: 120, bonoCompleto: 250 }
  },
  {
    id: "clima-marte", nombre: "Meteorólogo marciano", escenario: "marte", minutos: 15, presupuesto: 170,
    cliente: "Equipo de ciencia planetaria (ficticio para el juego)",
    encargo: "Estudia el clima de Marte durante casi un año marciano completo, con un presupuesto ajustado.",
    objetivos: [
      { tipo: "instrumento", valor: "clima" },
      { tipo: "supervivencia", valor: 0.9 },
      { tipo: "costoMax", valor: 160 }
    ],
    recompensa: { porObjetivo: 120, bonoCompleto: 250 }
  },
  {
    id: "guardianes-apofis", nombre: "Guardianes de Apofis", escenario: "apofis", minutos: 15, presupuesto: 150,
    cliente: "Oficina de defensa planetaria (ficticio para el juego)",
    encargo: "Acompaña de cerca al asteroide Apofis y supera los imprevistos con buenos reflejos.",
    objetivos: [
      { tipo: "orbita", valor: ["distante", "cercana"] },
      { tipo: "ciencia", valor: 300 },
      { tipo: "desafios", valor: 60 }
    ],
    recompensa: { porObjetivo: 120, bonoCompleto: 250 }
  }
];

// Puntos extra en Misión rápida por cada minuto que sobre al lanzar
DATOS.config.puntosPorMinutoSobrante = 20;
