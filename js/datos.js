/* =====================================================================
   datos.js — Datos GENERALES del juego "SPACE SIMULATOR"
   ---------------------------------------------------------------------
   Aquí están las cosas que se comparten entre todos los escenarios:
   piezas de la nave, cohetes, niveles de dificultad, roles del equipo,
   eventos, explicaciones de la Ingeniera Paz y las FUENTES de los datos.

   Cada escenario (Chile, incendios, Luna, Marte, Apofis) está en su
   propio archivo dentro de la carpeta js/escenarios/.

   Unidades:
     masa    kilogramos (kg)
     costo   millones de dólares (M USD)
     energia watts (W) que el equipo CONSUME
     datos   gigabytes por día (GB/día) que el instrumento PRODUCE
     ciencia puntos de ciencia si todos sus datos llegan a la Tierra
     deltaV  kilómetros por segundo (km/s) de cambio de velocidad

   Los valores están simplificados y redondeados para el juego, pero
   están basados en las fuentes que aparecen en DATOS.fuentes.
   El campo "fuentes" de cada elemento indica de dónde sale el dato.
   ===================================================================== */

const DATOS = {

  /* ---------- Reglas generales ---------- */
  config: {
    // Retrato de la Ingeniera Paz. Hoy es un retrato 3D creado para el juego (astronauta
    // con visor dorado). Si consigues una foto real CON PERMISO de la persona, reemplaza
    // ese archivo por la foto. Con null se muestra solo un ícono de casco.
    fotoPaz: "assets/imagenes/ingeniera-paz.jpg",
    consumoBaseW: 20,              // W que la nave usa siempre (calefactores, sensores internos)
    descargaSegura: 0.4,           // si cada sombra gasta más del 40% de la batería...
    castigoDescarga: 0.5,          // ...la batería dura la mitad de los años
    degradacionPanelesAnual: 0.02, // los paneles pierden ~2% por año por la radiación
    margenDeltaV: 1.1,             // los ingenieros siempre llevan 10% de combustible extra
    gravedad: 9.81,                // m/s², para la ecuación del cohete
    puntosPorMillon: 3,            // puntos por cada millón de dólares que sobre
    puntosSupervivenciaMax: 300,   // puntos si la nave funciona toda la misión
    diasPorSegundo: 25,            // velocidad de la simulación
    diasPorSegundoViaje: 60        // durante el viaje la simulación va más rápido
  },

  escenarios: [],   // se llenan desde js/escenarios/*.js

  /* ---------- Niveles de dificultad ---------- */
  dificultades: [
    {
      id: "cadete", nombre: "Cadete", icono: "persona",
      descripcion: "Más presupuesto, imprevistos suaves y la Ingeniera Paz te da pistas.",
      multPresupuesto: 1.25, eventosMin: 1, eventosMax: 2, multRiesgo: 0.6,
      pistas: true, fallasExtra: false, multPuntaje: 0.8, factorMinijuego: 0.75
    },
    {
      id: "ingeniera", nombre: "Ingeniera / Ingeniero", icono: "llave",
      descripcion: "Las reglas normales: presupuesto justo y 2 o 3 imprevistos.",
      multPresupuesto: 1, eventosMin: 2, eventosMax: 3, multRiesgo: 1,
      pistas: false, fallasExtra: false, multPuntaje: 1, factorMinijuego: 1
    },
    {
      id: "directora", nombre: "Directora / Director de vuelo", icono: "auriculares",
      descripcion: "Presupuesto ajustado, 3 o 4 imprevistos, más riesgo y fallas de piezas. Sin pistas.",
      multPresupuesto: 0.85, eventosMin: 3, eventosMax: 4, multRiesgo: 1.4,
      pistas: false, fallasExtra: true, multPuntaje: 1.3, factorMinijuego: 1.3
    }
  ],

  /* ---------- Roles del modo equipo ----------
     "meta": lo que el motor revisa al final para dar la medalla del rol. */
  roles: [
    {
      id: "directora", nombre: "Directora de misión", icono: "medalla", color: "#ffb703",
      tareas: "Acepta el encargo, cuida el presupuesto y elige el cohete.",
      meta: "Terminar con al menos 10% del presupuesto sin gastar."
    },
    {
      id: "ingeniera", nombre: "Ingeniera de la nave", icono: "llave", color: "#4cc9f0",
      tareas: "Elige estructura, paneles, batería, orientación y propulsión.",
      meta: "Que la nave funcione todos los días de la misión sin quedarse sin energía."
    },
    {
      id: "cientifica", nombre: "Científica", icono: "ciencia", color: "#3ddc84",
      tareas: "Elige los instrumentos y la órbita que mejor sirvan al objetivo.",
      meta: "Lograr al menos 40% de la ciencia máxima posible del escenario."
    },
    {
      id: "comunicaciones", nombre: "Comunicaciones", icono: "antena", color: "#c77dff",
      tareas: "Elige la antena y el computador, y decide en los problemas de señal.",
      meta: "Perder menos del 15% de los datos generados."
    }
  ],

  // Cómo repartir los roles según cuántas personas juegan
  repartoRoles: {
    1: [["directora", "ingeniera", "cientifica", "comunicaciones"]],
    2: [["directora", "cientifica"], ["ingeniera", "comunicaciones"]],
    3: [["directora", "comunicaciones"], ["ingeniera"], ["cientifica"]],
    4: [["directora"], ["ingeniera"], ["cientifica"], ["comunicaciones"]]
  },

  /* ---------- Piezas de la nave ----------
     Básica = barata y pesada. Avanzada = cara y liviana.
     "rol": qué integrante del equipo la elige.
     "soloSi": la pieza solo es opcional en algunos escenarios (propulsión). */
  componentes: [
    {
      id: "estructura", nombre: "Estructura", imagen: "assets/imagenes/comp-estructura.jpg", concepto: "estructura", rol: "ingeniera",
      descripcion: "El esqueleto que sostiene todo y lo protege de las sacudidas del lanzamiento.",
      extra: [{ campo: "vidaAnios", etiqueta: "Resiste", unidad: "años", porque: "vidaAnios" }],
      fuentes: ["nasa_sst"],
      opciones: {
        basica:   { nombre: "Aluminio", masa: 50, costo: 1.5, energia: 0, vidaAnios: 10, descripcion: "Fuerte y barata, pero pesada." },
        avanzada: { nombre: "Fibra de carbono y panal de abeja", masa: 25, costo: 5, energia: 0, vidaAnios: 12, descripcion: "La mitad del peso. Se usa en satélites modernos." }
      }
    },
    {
      id: "paneles", nombre: "Paneles solares", imagen: "assets/imagenes/comp-paneles.jpg", concepto: "paneles", rol: "ingeniera",
      descripcion: "Convierten la luz del Sol en electricidad.",
      extra: [{ campo: "generacion", etiqueta: "Genera cerca de la Tierra", unidad: "W", porque: "generacion" }],
      fuentes: ["nasa_sst_power"],
      opciones: {
        basica:   { nombre: "Silicio (~20% de eficiencia)", masa: 30, costo: 1.5, energia: 0, generacion: 300, descripcion: "Como los de los techos, pero reforzados." },
        avanzada: { nombre: "Multiunión de arseniuro de galio (~30%)", masa: 15, costo: 6, energia: 0, generacion: 450, descripcion: "El tipo de celda que usan hoy casi todas las naves." }
      }
    },
    {
      id: "bateria", nombre: "Batería", imagen: "assets/imagenes/comp-bateria.jpg", concepto: "bateria", rol: "ingeniera",
      descripcion: "Guarda energía para cuando la nave pasa por la sombra.",
      extra: [
        { campo: "capacidadWh", etiqueta: "Guarda", unidad: "Wh", porque: "capacidadBateria" },
        { campo: "vidaAnios", etiqueta: "Dura", unidad: "años", porque: "vidaAnios" }
      ],
      fuentes: ["nasa_sst_power"],
      opciones: {
        basica:   { nombre: "Níquel-cadmio", masa: 10, costo: 0.8, energia: 0, capacidadWh: 400, vidaAnios: 5, descripcion: "Tecnología antigua: unos 40 Wh por kilo." },
        avanzada: { nombre: "Ion-litio", masa: 3, costo: 3, energia: 0, capacidadWh: 450, vidaAnios: 8, descripcion: "Como la de tu celular, pero espacial: unos 150 Wh por kilo." }
      }
    },
    {
      id: "computador", nombre: "Computador a bordo", imagen: "assets/imagenes/comp-computador.jpg", concepto: "computador", rol: "comunicaciones",
      descripcion: "El cerebro: controla la nave y guarda los datos hasta poder enviarlos.",
      extra: [
        { campo: "memoriaGB", etiqueta: "Memoria", unidad: "GB", porque: "memoria" },
        { campo: "resistencia", etiqueta: "Resistencia a radiación", unidad: "%", porque: "resistencia", porcentaje: true }
      ],
      fuentes: ["nasa_sst"],
      opciones: {
        basica:   { nombre: "Computador común reforzado", masa: 5, costo: 0.8, energia: 20, memoriaGB: 64, resistencia: 0.3, descripcion: "Barato, pero la radiación lo puede reiniciar." },
        avanzada: { nombre: "Computador endurecido contra radiación", masa: 1.5, costo: 4, energia: 8, memoriaGB: 256, resistencia: 0.8, descripcion: "Diseñado para aguantar tormentas solares." }
      }
    },
    {
      id: "antena", nombre: "Antena", imagen: "assets/imagenes/comp-antena.jpg", concepto: "antena", rol: "comunicaciones",
      descripcion: "Envía los datos a las estaciones en la Tierra.",
      extra: [{ campo: "velocidadMbps", etiqueta: "Velocidad (cerca de la Tierra)", unidad: "Mbps", porque: "velocidadAntena" }],
      fuentes: ["nasa_sst", "dsn"],
      opciones: {
        basica:   { nombre: "Banda S (antena simple)", masa: 3, costo: 0.4, energia: 15, velocidadMbps: 10, descripcion: "Confiable y simple, pero lenta." },
        avanzada: { nombre: "Banda X con antena parabólica", masa: 1.5, costo: 2, energia: 35, velocidadMbps: 100, descripcion: "10 veces más rápida. La usan las naves de imágenes y de espacio profundo." }
      }
    },
    {
      id: "orientacion", nombre: "Control de orientación", imagen: "assets/imagenes/comp-orientacion.jpg", concepto: "orientacion", rol: "ingeniera",
      descripcion: "Mantiene la nave apuntando hacia donde queremos mirar.",
      extra: [{ campo: "precision", etiqueta: "Precisión", unidad: "%", porque: "precision", porcentaje: true }],
      fuentes: ["nasa_sst"],
      opciones: {
        basica:   { nombre: "Imanes y sensores de Sol", masa: 12, costo: 1, energia: 25, precision: 0.7, descripcion: "Se mueve un poco: las fotos pueden salir movidas. (Los imanes solo funcionan cerca de la Tierra; lejos usa pequeños chorros de gas)." },
        avanzada: { nombre: "Rastreador de estrellas y ruedas de reacción", masa: 6, costo: 4, energia: 15, precision: 1, descripcion: "Se guía mirando las estrellas, muy preciso." }
      }
    },
    {
      id: "propulsion", nombre: "Propulsión", imagen: "assets/imagenes/comp-propulsion.jpg", concepto: "propulsion", rol: "ingeniera",
      descripcion: "Motores para frenar al llegar, mantener la órbita o esquivar basura. El combustible se calcula con la ecuación del cohete.",
      opcional: true,   // en órbita terrestre puedes ir sin motor; en la Luna, Marte y Apofis es obligatoria
      extra: [{ campo: "isp", etiqueta: "Impulso específico", unidad: "s", porque: "isp" }],
      fuentes: ["purdue_prop", "smart1", "tsiolkovsky"],
      opciones: {
        ninguna:  { nombre: "Sin motor", masa: 0, costo: 0, energia: 0, isp: 0, descripcion: "Más liviana y barata, pero no puede corregir su órbita." },
        basica:   { nombre: "Hidracina (cohete químico)", masa: 8, costo: 2, energia: 5, isp: 220, descripcion: "Mucha fuerza al instante, pero gasta mucho combustible." },
        avanzada: { nombre: "Motor eléctrico de efecto Hall", masa: 12, costo: 7, energia: 0, isp: 1500, descripcion: "Usa 7 veces menos combustible, pero empuja muy suave: los viajes largos tardan más." }
      }
    }
  ],

  /* ---------- Cohetes reales ----------
     capacidad: kg que el cohete lleva a cada DESTINO:
       leo = órbita baja · sso = órbita polar heliosíncrona · geo = geoestacionaria
       tli = camino a la Luna · tmi = camino a Marte · esc = escapar de la Tierra (asteroides)
     Valores aproximados basados en las fuentes. Para "geo" usamos ~la mitad de lo
     que llega a la órbita de transferencia (GTO), porque la nave gasta el resto en llegar. */
  cohetes: [
    {
      id: "electron", nombre: "Electron", empresa: "Rocket Lab", pais: "Nueva Zelanda / EE.UU.", imagen: "assets/imagenes/cohete-electron.jpg",
      costo: 7.5,
      capacidad: { leo: 300, sso: 200, geo: 0, tli: 30, tmi: 0, esc: 0 },
      descripcion: "Cohete pequeño para satélites chicos. Con su etapa Photon llevó la nave CAPSTONE (25 kg) a la Luna.",
      dato: "Su capacidad pasó de 225 a 300 kg gracias a mejores baterías en sus motores eléctricos de bombeo.",
      fuentes: ["electron", "capstone"]
    },
    {
      id: "rideshare", nombre: "Falcon 9 · viaje compartido", empresa: "SpaceX (programa Transporter)", pais: "EE.UU.", imagen: "assets/imagenes/cohete-rideshare.jpg",
      costoBase: 0.35, kgIncluidos: 50, costoPorKg: 0.007,   // 350.000 USD hasta 50 kg + 7.000 USD por kg extra (2026)
      capacidad: { leo: 0, sso: 800, geo: 0, tli: 0, tmi: 0, esc: 0 },
      descripcion: "Tu nave viaja junto a decenas de satélites de otros clientes. Muy barato, pero solo va a la órbita polar heliosíncrona.",
      dato: "Cobra por kilo: unos 350.000 USD hasta 50 kg y 7.000 USD por cada kilo extra.",
      fuentes: ["rideshare_2026"]
    },
    {
      id: "pslv", nombre: "PSLV-XL", empresa: "ISRO", pais: "India", imagen: "assets/imagenes/cohete-pslv.jpg",
      costo: 25,
      capacidad: { leo: 3800, sso: 1750, geo: 700, tli: 1000, tmi: 450, esc: 450 },
      descripcion: "El cohete que lanzó la sonda india a Marte (Mangalyaan, 1.337 kg) dejándola en órbita alrededor de la Tierra; la sonda hizo el resto con su motor.",
      dato: "En 2017 lanzó 104 satélites en un solo viaje.",
      fuentes: ["pslv", "mom"]
    },
    {
      id: "falcon9", nombre: "Falcon 9", empresa: "SpaceX", pais: "EE.UU.", imagen: "assets/imagenes/cohete-falcon9.jpg",
      costo: 70, reutilizable: true,        // reutilizable: su primera etapa aterriza (minijuego)
      capacidad: { leo: 17500, sso: 12500, geo: 2750, tli: 3500, tmi: 4000, esc: 4500 },
      descripcion: "Reutilizable: su primera etapa vuelve y aterriza. Lleva astronautas a la Estación Espacial.",
      dato: "Precio de lista cercano a 70 millones de dólares por lanzamiento dedicado.",
      fuentes: ["spacex", "elvperf"]
    },
    {
      id: "falconheavy", nombre: "Falcon Heavy", empresa: "SpaceX", pais: "EE.UU.", imagen: "assets/imagenes/cohete-falconheavy.jpg",
      costo: 97, reutilizable: true,
      capacidad: { leo: 63800, sso: 40000, geo: 13000, tli: 20000, tmi: 16800, esc: 18000 },
      descripcion: "Tres primeras etapas de Falcon 9 juntas. Uno de los cohetes más potentes en servicio.",
      dato: "Puede enviar 16.800 kg hacia Marte. ¡Tu nave probablemente sea mucho más chica!",
      fuentes: ["falcon_heavy", "spacex"]
    }
  ],

  /* ---------- Eventos (imprevistos) ----------
     Cada escenario elige cuáles usa (campo "eventos" del escenario).
     "rol": qué integrante del equipo decide.
     consecuencia pasa siempre al elegir la opción.
     consecuenciaConPropulsion reemplaza a la anterior si la nave tiene motor.
     riesgo algo que PUEDE pasar. modo de cálculo:
        "fija"       usa "probabilidad"
        "computador" probabilidad × (1 − resistencia del computador)
        "orbita"     usa el riesgo de basura de la órbita
        "bateria"    sale mal si la batería no alcanza "horas" de consumo
     Cambios posibles: seguroDias, bajadaTemporal{factor,dias}, generacion (−0,1 = −10%),
       bajada (−0,5 = −50%), vidaDias, borrarMemoria, cienciaExtra, bonoInstrumento{id,puntos}

     MINIJUEGOS: si un evento tiene "minijuego", en vez de elegir una opción se juega
     un desafío (ver js/minijuegos.js). El puntaje (0 a 100%) elige el resultado:
       resultados.bien (70% o más) · resultados.regular (40% a 69%) · resultados.mal (menos de 40%)
     "soloOrbitas": el evento solo aparece en esas órbitas. */
  eventos: [
    {
      id: "tormenta", titulo: "¡Tormenta solar!", imagen: "assets/imagenes/evento-tormenta.jpg", rol: "ingeniera",
      descripcion: "El Sol lanzó una enorme nube de partículas. Llegará en ráfagas que pueden dañar los circuitos.",
      paz: "Cuando el medidor de radiación se ponga amarillo, apaga los instrumentos y la antena. ¡Pero cuida la batería y no dejes que la nave se congele!",
      fuentes: ["swpc"],
      minijuego: "tormenta",
      resultados: {
        bien: { cienciaExtra: 40, mensaje: "¡Protegiste la nave en cada ráfaga y seguiste midiendo entre medio! (+40 puntos de ciencia)" },
        regular: { generacion: -0.05, seguroDias: 1, mensaje: "La nave sobrevivió, pero la radiación gastó un poco los paneles (−5% de energía) y perdiste 1 día." },
        mal: { borrarMemoria: true, generacion: -0.12, seguroDias: 3, mensaje: "La radiación reinició el computador: se borraron los datos guardados, los paneles perdieron 12% de energía y perdiste 3 días." }
      }
    },
    {
      id: "antena", titulo: "¡Se perdió la señal!", imagen: "assets/imagenes/evento-antena.jpg", rol: "comunicaciones",
      descripcion: "La antena quedó mal apuntada. Hay que alinearla con la estación terrestre antes de que se cierre la ventana de comunicación.",
      paz: "Mueve la mira hasta que la estación quede dentro del círculo y mantenla ahí. Una antena grande tiene un círculo más grande: ¡es más fácil!",
      fuentes: ["dsn"],
      minijuego: "antena",
      resultados: {
        bien: { cienciaExtra: 50, mensaje: "¡Enlace perfecto! Enviaste todos los datos atrasados (+50 puntos de ciencia)." },
        regular: { bajadaTemporal: { factor: 0.6, dias: 15 }, mensaje: "Enviaste parte de los datos. Durante 15 días la antena trabajará al 60% mientras se ajusta." },
        mal: { bajadaTemporal: { factor: 0.25, dias: 30 }, bajada: -0.1, mensaje: "Se cerró la ventana sin enlace: 30 días con la antena de respaldo y la principal quedó 10% más lenta." }
      }
    },
    {
      id: "basura", titulo: "¡Lluvia de basura espacial!", imagen: "assets/imagenes/evento-basura.jpg", rol: "directora",
      descripcion: "Restos de un satélite viejo que se rompió cruzan tu órbita a unos 10 km por segundo.",
      paz: "Esquiva los trozos con las flechas. Si tu nave es liviana y tiene buen control de orientación, se moverá más rápido.",
      fuentes: ["esa_debris"],
      minijuego: "asteroides",
      resultados: {
        bien: { cienciaExtra: 20, mensaje: "¡Esquivaste toda la basura! La nave sigue intacta." },
        regular: { generacion: -0.08, vidaDias: -60, mensaje: "Algunos trozos golpearon la nave: los paneles perdieron 8% de energía y la vida útil bajó 60 días." },
        mal: { generacion: -0.25, vidaDias: -200, mensaje: "¡Muchos impactos! Los paneles perdieron 25% de energía y la nave durará 200 días menos." }
      }
    },
    {
      id: "arrastre", titulo: "¡La nave está perdiendo altura!", imagen: "assets/imagenes/orbita-iss.jpg", rol: "ingeniera",
      soloOrbitas: ["baja", "polar"],
      descripcion: "La actividad del Sol calentó la atmósfera de arriba: se infló y ahora frena más a la nave.",
      paz: "Enciende el motor justo cuando la nave pase por la zona verde: así cada impulso sube más la órbita. Sin motor, solo puedes girar la nave para cambiar cómo la frena el aire.",
      fuentes: ["iss"],
      minijuego: "orbita",
      resultados: {
        bien: { mensaje: "¡Órbita corregida con precisión! La nave recuperó su altura." },
        regular: { vidaDias: -90, mensaje: "Mantuviste la nave arriba, pero bajó un poco: la vida útil se redujo 90 días." },
        mal: { vidaDias: -300, seguroDias: 2, mensaje: "La nave bajó mucho: tuvo que hacer una maniobra de emergencia y perdió 300 días de vida útil." }
      }
    },
    {
      id: "cortocircuito", titulo: "¡Cortocircuito a bordo!", imagen: "assets/imagenes/comp-computador.jpg", rol: "ingeniera",
      descripcion: "Una vibración soltó varios cables. El computador de la nave entró en modo seguro y espera instrucciones.",
      paz: "Conecta cada sistema con el lugar correcto. Piensa: ¿adónde manda su energía o sus datos cada pieza?",
      minijuego: "reparacion",
      resultados: {
        bien: { mensaje: "¡Reparación perfecta! Todos los sistemas volvieron a funcionar." },
        regular: { seguroDias: 4, mensaje: "Reparaste casi todo, pero la nave estuvo 4 días en modo seguro." },
        mal: { seguroDias: 10, generacion: -0.05, mensaje: "La reparación quedó incompleta: 10 días sin ciencia y un panel desconectado (−5% de energía)." }
      }
    },
    {
      id: "erupcion", titulo: "¡Erupción volcánica!", imagen: "assets/imagenes/evento-erupcion.jpg", rol: "cientifica",
      descripcion: "Un volcán del sur de Chile entró en erupción. Chile tiene unos 90 volcanes activos vigilados por SERNAGEOMIN.",
      paz: "Es una oportunidad científica única, pero medir más seguido produce muchos más datos.",
      fuentes: ["sernageomin"],
      opciones: [
        { texto: "Escaneo rápido: una imagen cada minuto", explicacion: "Gran valor para las alertas, pero se generan muchos datos extra por 5 días.",
          consecuencia: { cienciaExtra: 80, bajadaTemporal: { factor: 0.6, dias: 5 }, mensaje: "¡Tus imágenes ayudaron a seguir la nube de ceniza! (+80 puntos de ciencia), aunque se acumularon datos." } },
        { texto: "Seguir el plan normal", explicacion: "Sin riesgo, pero se pierde la oportunidad.",
          consecuencia: { mensaje: "La misión siguió tranquila. Otros satélites cubrieron la erupción." } }
      ]
    },
    {
      id: "incendio", titulo: "¡Gran incendio forestal!", imagen: "assets/imagenes/evento-incendio.jpg", rol: "comunicaciones",
      descripcion: "Un incendio avanza rápido en la zona central. Los brigadistas necesitan saber hacia dónde se mueve.",
      paz: "Podemos mandar alertas directas a los equipos de emergencia, pero eso ocupa parte de la antena.",
      fuentes: ["goes_chile_fires"],
      opciones: [
        { texto: "Enviar alertas en tiempo real", explicacion: "Ayuda a las brigadas, pero por 10 días la antena envía menos datos científicos.",
          consecuencia: { cienciaExtra: 100, bajadaTemporal: { factor: 0.5, dias: 10 }, mensaje: "Tus alertas ayudaron a decidir dónde trabajar. ¡Los satélites salvan vidas! (+100 puntos)." } },
        { texto: "Guardar los datos para enviarlos después", explicacion: "No afecta la ciencia, pero la información llega tarde para la emergencia.",
          consecuencia: { mensaje: "Los datos llegaron después y sirvieron para estudiar el incendio, pero no para combatirlo." } }
      ]
    },
    {
      id: "mascons", titulo: "¡La gravedad de la Luna te tira hacia abajo!", imagen: "assets/imagenes/evento-mascons.jpg", rol: "ingeniera",
      descripcion: "La Luna tiene zonas con más masa (mascons) que deforman las órbitas bajas. Tu nave está bajando.",
      paz: "En órbita lunar baja hay que corregir la órbita seguido. Enciende el motor cuando la nave pase por la zona verde, ¡o chocará con la Luna!",
      fuentes: ["lro"],
      soloOrbitas: ["polarBaja", "ecuatorial"],
      minijuego: "orbita",
      resultados: {
        bien: { cienciaExtra: 40, mensaje: "¡Corrección perfecta! Hasta aprovechaste para sacar fotos más cercanas del polo sur (+40 puntos)." },
        regular: { vidaDias: -60, seguroDias: 2, mensaje: "Corregiste la órbita, pero gastaste más combustible del necesario (−60 días de vida útil)." },
        mal: { vidaDias: -200, seguroDias: 3, mensaje: "La nave bajó demasiado: un rescate de emergencia gastó mucho combustible (−200 días de vida útil)." }
      }
    },
    {
      id: "eclipseLunar", titulo: "¡Eclipse lunar total!", imagen: "assets/imagenes/evento-eclipseLunar.jpg", rol: "ingeniera",
      descripcion: "La Tierra tapará el Sol durante unas 3 horas. Tu nave estará en sombra mucho más tiempo que en una vuelta normal.",
      paz: "La nave LRO de la NASA apagó instrumentos en los eclipses lunares de 2014 para que la batería aguantara. ¿Lo hacemos?",
      fuentes: ["lro"],
      opciones: [
        { texto: "Apagar instrumentos durante el eclipse", explicacion: "Seguro: perdemos 1 día de ciencia.",
          consecuencia: { seguroDias: 1, mensaje: "La batería aguantó el eclipse sin problemas." } },
        { texto: "Seguir midiendo en la oscuridad", explicacion: "Solo funciona si tu batería guarda energía para 3 horas de consumo.",
          riesgo: { modo: "bateria", horas: 3,
            siPasa: { generacion: -0.1, seguroDias: 5, mensaje: "La batería se vació por completo: la nave se apagó, se enfrió y tardó 5 días en recuperarse (y la batería quedó dañada)." },
            siNoPasa: { cienciaExtra: 40, mensaje: "¡Tu batería alcanzó! Mediste cómo se enfría la superficie lunar durante el eclipse (+40 puntos)." } } }
      ]
    },
    {
      id: "polvoMarte", titulo: "¡Tormenta de polvo global en Marte!", imagen: "assets/imagenes/evento-polvoMarte.jpg", rol: "cientifica",
      descripcion: "Una tormenta de polvo cubre todo el planeta, como la de 2018 que apagó para siempre al robot Opportunity.",
      paz: "Las cámaras no verán el suelo por semanas, pero es la oportunidad perfecta para estudiar el clima.",
      fuentes: ["opportunity"],
      opciones: [
        { texto: "Apuntar todo a estudiar la tormenta", explicacion: "Si llevas la sonda de clima, ganarás mucha ciencia.",
          consecuencia: { bonoInstrumento: { id: "clima", puntos: 120 }, mensaje: "Estudiaste la tormenta completa." } },
        { texto: "Esperar a que pase", explicacion: "Apagamos cámaras 30 días para ahorrar energía.",
          consecuencia: { seguroDias: 30, mensaje: "La tormenta pasó. Perdiste un mes de mediciones." } }
      ]
    },
    {
      id: "conjuncion", titulo: "Conjunción solar: ¡el Sol tapa la señal!", imagen: "assets/imagenes/evento-conjuncion.jpg", rol: "comunicaciones",
      descripcion: "Marte quedó detrás del Sol. Cada ~26 meses la NASA deja de enviar órdenes a Marte por unas 2 semanas.",
      paz: "Durante 14 días no podremos enviar ni recibir datos. ¿Cómo lo enfrentamos?",
      fuentes: ["conjuncion"],
      opciones: [
        { texto: "Dejar un plan cargado y seguir midiendo", explicacion: "Los datos se guardan en memoria. Si no caben, se pierden.",
          consecuencia: { bajadaTemporal: { factor: 0, dias: 14 }, mensaje: "La nave siguió midiendo sola. Después envió todo lo que cupo en la memoria." } },
        { texto: "Poner la nave en modo tranquilo", explicacion: "Sin riesgo, pero perdemos 14 días de ciencia.",
          consecuencia: { seguroDias: 14, bajadaTemporal: { factor: 0, dias: 14 }, mensaje: "La nave esperó tranquila a que el Sol se moviera." } }
      ]
    },
    {
      id: "giroApofis", titulo: "¡Apofis cambió su forma de girar!", imagen: "assets/imagenes/inst-apofis-radar.jpg", rol: "cientifica",
      descripcion: "Al pasar cerca de la Tierra, la gravedad de nuestro planeta sacudió al asteroide. ¡Puede haber deslizamientos de rocas en su superficie!",
      paz: "Los científicos predicen justamente esto. ¿Nos acercamos a mirar?",
      fuentes: ["apophis_esa"],
      opciones: [
        { texto: "Acercarse para observar de cerca", explicacion: "Muchísima ciencia, pero hay rocas y polvo flotando cerca.",
          riesgo: { modo: "fija", probabilidad: 0.25,
            siPasa: { generacion: -0.2, cienciaExtra: 60, mensaje: "Lograste ver los deslizamientos (+60), pero una partícula golpeó un panel (−20% de energía)." },
            siNoPasa: { cienciaExtra: 150, mensaje: "¡Imágenes históricas de un asteroide cambiando en vivo! (+150 puntos)." } } },
        { texto: "Observar desde lejos", explicacion: "Seguro, con menos detalle.",
          consecuencia: { cienciaExtra: 50, mensaje: "Mediste el cambio de giro desde una distancia segura (+50 puntos)." } }
      ]
    },
    {
      id: "particulas", titulo: "¡Partículas saltando del asteroide!", imagen: "assets/imagenes/evento-particulas.jpg", rol: "directora",
      descripcion: "Como vio la nave OSIRIS-REx en el asteroide Bennu, pequeñas piedras salen disparadas de la superficie.",
      paz: "Son lentas, pero pueden golpear la nave. ¡Esquívalas con las flechas! Una nave liviana y bien controlada es más ágil.",
      fuentes: ["osiris_apex"],
      minijuego: "asteroides",
      resultados: {
        bien: { cienciaExtra: 90, mensaje: "¡Esquivaste todas las piedras y las fotografiaste en vuelo! (+90 puntos de ciencia)" },
        regular: { generacion: -0.08, cienciaExtra: 30, mensaje: "Algunas piedritas golpearon los paneles (−8% de energía), pero lograste buenas fotos (+30 puntos)." },
        mal: { generacion: -0.2, vidaDias: -60, mensaje: "Muchos golpes: los paneles perdieron 20% de energía y la nave durará 60 días menos." }
      }
    },
    {
      id: "rueda", titulo: "¡Falla en una rueda de reacción!", imagen: "assets/imagenes/evento-rueda.jpg", rol: "ingeniera", soloDificil: true,
      descripcion: "Una de las ruedas que orientan la nave se trabó, como le pasó al telescopio Kepler y a la nave Dawn. Hay que reconectar el sistema de orientación.",
      paz: "Conecta cada sistema con su lugar. Si lo haces rápido y bien, la nave volverá a apuntar casi como antes.",
      minijuego: "reparacion",
      resultados: {
        bien: { seguroDias: 2, mensaje: "¡Reparación lograda! Tras 2 días de pruebas la nave apunta casi como antes." },
        regular: { seguroDias: 5, cienciaExtra: -40, mensaje: "La nave volvió a apuntar, pero con menos precisión (−40 puntos) y 5 días de pruebas." },
        mal: { seguroDias: 10, cienciaExtra: -90, mensaje: "La reparación falló: la nave apunta peor desde ahora (−90 puntos) y perdió 10 días." }
      }
    }
  ],

  /* ---------- Ingeniera Paz: conceptos generales (solo la primera vez) ---------- */
  conceptos: {
    inicio: { titulo: "¡Hola, soy la Ingeniera Paz!", texto: "Voy a acompañarte a diseñar misiones espaciales de verdad. Primero, elijan cómo van a jugar y qué tan difícil será." },
    fase1: { titulo: "El encargo", texto: "Elige una misión. Cada una ocurre en un lugar distinto del espacio y tiene problemas distintos: ¡no hay un diseño que sirva para todas!" },
    presupuesto: { titulo: "Presupuesto", texto: "Es todo el dinero de la misión: la nave, los instrumentos, el cohete y el equipo humano. Si te pasas, la misión no se aprueba." },
    duracion: { titulo: "Duración de la misión", texto: "Los científicos necesitan cierta cantidad de días midiendo. Tu nave debe vivir al menos eso." },
    fase2: { titulo: "Construyamos la nave", texto: "Cada pieza tiene una versión básica (barata pero pesada) y una avanzada (cara pero liviana). Mira cómo cambian las barras de arriba." },
    estructura: { titulo: "La estructura", texto: "Durante el lanzamiento la nave se sacude como en un terremoto. La estructura la protege. ¡Pero cada kilo cuesta llevarlo al espacio!" },
    paneles: { titulo: "Energía solar", texto: "En el espacio no hay enchufes. Los paneles son la fuente de energía, y mientras más lejos del Sol, menos energía dan." },
    bateria: { titulo: "La batería", texto: "Cuando la nave pasa detrás del planeta queda a oscuras. La batería mantiene todo funcionando hasta volver al Sol." },
    computador: { titulo: "El computador", texto: "En el espacio hay radiación que puede confundir a los computadores. Por eso algunos se fabrican 'endurecidos', como con armadura." },
    antena: { titulo: "La antena", texto: "De nada sirve medir si no puedes enviar los datos. Mientras más lejos esté la nave, más débil llega la señal." },
    orientacion: { titulo: "Apuntar bien", texto: "Imagina sacar una foto desde un auto a 27.000 km/h. Si la nave tiembla, la foto sale movida." },
    propulsion: { titulo: "La ecuación del cohete", texto: "Para frenar o cambiar de órbita hay que lanzar combustible hacia atrás. Mientras más rápido sale, menos combustible necesitas. ¡Por eso el motor eléctrico ahorra tanto!" },
    fase3: { titulo: "Los instrumentos", texto: "Esta es la parte científica: los 'ojos' de tu misión. Cada instrumento suma ciencia, pero también peso, energía, costo y datos." },
    datos: { titulo: "Datos", texto: "Cada medición ocupa espacio, como las fotos en tu celular. Hay que guardarlos y enviarlos a la Tierra." },
    ciencia: { titulo: "Puntos de ciencia", texto: "Representan cuánto aprenderán los científicos. ¡Solo cuentan los datos que lleguen a la Tierra!" },
    fase4: { titulo: "¿A dónde vamos?", texto: "Elige la órbita (el camino de tu nave) y el cohete. Cada órbita cambia la energía, las comunicaciones, el combustible y la ciencia." },
    cohete: { titulo: "El cohete", texto: "Mientras más lejos sea el destino, menos peso puede llevar el mismo cohete." },
    incompatible: { titulo: "¡Demasiado pesada!", texto: "Tu nave pesa más de lo que ese cohete puede llevar a ese destino. Elige un cohete más grande o aliviana la nave." },
    rideshare: { titulo: "Viaje compartido", texto: "Muchas universidades y empresas pequeñas lanzan así: compartiendo el cohete con otros. Es barato, pero vas a donde va el cohete." },
    fase5: { titulo: "¡Hora del lanzamiento!", texto: "Vamos a ver tu misión funcionando, muy acelerada. Mira la batería, los datos guardados y los enviados. ¡Tú decides qué hacer ante los problemas!" },
    viaje: { titulo: "El viaje", texto: "Primero la nave debe viajar hasta su destino. Durante el viaje no hay ciencia: solo esperar y cuidar la nave." },
    sombra: { titulo: "La sombra", texto: "Cuando la nave se oscurece, está detrás del planeta y usa la batería. Al volver al Sol, la recarga." },
    fase6: { titulo: "El informe", texto: "En las misiones reales, aprender de los errores es parte del trabajo. Lee por qué pasó lo que pasó y mejora tu diseño." },
    alertaRoja: { titulo: "¡Una barra en rojo!", texto: "Rojo significa que te pasaste del límite. Masa y presupuesto te impiden lanzar; las demás te harán perder ciencia." },
    equipo: { titulo: "Trabajo en equipo", texto: "En las misiones reales nadie decide solo. Cuando sea tu turno, conversen: lo que elige una persona cambia las barras de todo el equipo." }
  },

  /* ---------- Textos del botón "¿Por qué?" ---------- */
  porQue: {
    masa: { titulo: "Masa", texto: "Lo que pesa toda tu nave: piezas, instrumentos y combustible. Cada cohete puede llevar un máximo de kilos a cada destino. Llevar 1 kg al espacio cuesta entre unos miles y decenas de miles de dólares." },
    energia: { titulo: "Energía", texto: "Compara lo que gastan tus equipos (W) con lo que entregan tus paneles en promedio, contando la sombra y la distancia al Sol. Si gastas más de lo que generas, la batería se vacía y hay que apagar instrumentos." },
    presupuesto: { titulo: "Presupuesto", texto: "Suma piezas, instrumentos, cohete y un costo fijo de armado, pruebas y operación (en espacio profundo incluye usar las grandes antenas de la Red de Espacio Profundo de la NASA). La misión india a Marte costó unos 74 millones de dólares; Landsat 9 cerca de 750 millones." },
    datos: { titulo: "Datos guardados", texto: "Compara los GB que generas en un día con la memoria del computador. La nave debe guardar al menos un día de datos mientras espera poder enviarlos. Si no caben, se borran." },
    comunicaciones: { titulo: "Comunicaciones", texto: "Compara los datos que generas al día con los que tu antena alcanza a enviar. Depende de la velocidad de la antena, de los minutos de contacto con la Tierra y de la distancia: al doble de distancia, la señal llega 4 veces más débil." },
    tiempo: { titulo: "Tiempo (vida útil)", texto: "Cuántos años puede funcionar tu nave. Lo limita lo que se gaste primero: la estructura, la batería o la órbita (el aire frena a las naves bajas, y algunas órbitas necesitan motor para mantenerse)." },
    costo: { titulo: "Costo", texto: "Precio aproximado en millones de dólares (M USD). Las piezas espaciales son caras porque deben aguantar vacío, radiación, frío extremo y sacudidas, y se prueban muchísimo." },
    ciencia: { titulo: "Puntos de ciencia", texto: "Cuánto aportará el instrumento si TODOS sus datos llegan a la Tierra. Se reduce si la órbita no le sirve, si la nave no apunta bien o si se pierden datos." },
    gbDia: { titulo: "GB por día", texto: "La información que produce el instrumento cada día. 1 GB = 1.000 MB. Las naves lejanas producen menos datos porque no podrían enviarlos todos." },
    consumo: { titulo: "Consumo (W)", texto: "Los watts que usa el equipo mientras funciona. Una ampolleta LED usa unos 10 W; un radar espacial puede usar cientos." },
    generacion: { titulo: "Generación", texto: "Los watts que entregan los paneles con Sol directo cerca de la Tierra. En Marte llega menos de la mitad de luz (43%), así que generan menos." },
    capacidadBateria: { titulo: "Capacidad (Wh)", texto: "Watts-hora: cuánta energía guarda. 400 Wh pueden dar 400 W durante 1 hora. Debe alcanzar para cada sombra, idealmente usando menos del 40%." },
    memoria: { titulo: "Memoria", texto: "Cuántos GB puede guardar el computador antes de enviarlos. Si se llena, ya no caben datos nuevos." },
    resistencia: { titulo: "Resistencia a la radiación", texto: "Qué tan probable es que el computador aguante una tormenta solar sin reiniciarse." },
    velocidadAntena: { titulo: "Velocidad de la antena", texto: "Megabits por segundo (Mbps) cerca de la Tierra. Lejos, la señal se debilita muchísimo: por eso las naves de espacio profundo usan antenas parabólicas y la Tierra usa antenas gigantes de 34 y 70 metros." },
    precision: { titulo: "Precisión", texto: "Qué tan quieta y bien apuntada se mantiene la nave. Con 70% de precisión, los instrumentos que apuntan pierden 30% de su valor." },
    vidaAnios: { titulo: "Años de vida", texto: "Cuántos años puede funcionar esa pieza en el espacio antes de gastarse." },
    isp: { titulo: "Impulso específico (Isp)", texto: "Mide qué tan bien aprovecha el combustible un motor, en segundos. Un motor de hidracina tiene unos 220 s; un motor eléctrico de efecto Hall más de 1.500 s, así que necesita mucho menos combustible para el mismo cambio de velocidad." },
    ecuacionCohete: { titulo: "La ecuación del cohete (Tsiolkovsky)", texto: "Combustible = masa de la nave × (e^(Δv ÷ (Isp × 9,81)) − 1). Δv es cuánto hay que cambiar la velocidad. Como es una exponencial, ¡pedir el doble de Δv puede necesitar mucho más del doble de combustible!" },
    deltaV: { titulo: "Delta-v (Δv)", texto: "El cambio de velocidad que la nave debe hacer con su propio motor: frenar al llegar a la Luna o Marte, acercarse a un asteroide o mantener la órbita. Se mide en km/s." },
    capacidadCohete: { titulo: "Capacidad del cohete", texto: "Los kilos que el cohete puede llevar a ese destino. Llegar más lejos requiere más velocidad, así que se lleva menos peso. Son valores aproximados basados en los datos de cada empresa y de la NASA." },
    sombra: { titulo: "Tiempo en sombra", texto: "La parte de cada vuelta que la nave pasa detrás del planeta, sin Sol." },
    contacto: { titulo: "Contacto con la Tierra", texto: "Los minutos al día que la nave puede enviar datos. En órbita terrestre depende de pasar sobre estaciones; en espacio profundo, de cuántas horas nos presta la Red de Espacio Profundo de la NASA." },
    distancia: { titulo: "Distancia y señal", texto: "La señal se debilita con el cuadrado de la distancia. Marte está en promedio unas 600 veces más lejos que la Luna: por eso las naves en Marte envían pocos GB al día." },
    altitud: { titulo: "Altitud", texto: "A qué altura sobre la superficie vuela la nave. Más cerca = más detalle; más lejos = ve más área a la vez." },
    duracion: { titulo: "Duración deseada", texto: "Cuántos días quieren los científicos que la nave mida (sin contar el viaje)." },
    viaje: { titulo: "Tiempo de viaje", texto: "Los días que tarda la nave en llegar. A la Luna, unos 5 días con motor químico; a Marte, unos 7 meses. Con motor eléctrico es más lento: la nave europea SMART-1 tardó más de un año en llegar a la Luna." },
    rideshare: { titulo: "Viaje compartido (rideshare)", texto: "Varios satélites comparten un mismo cohete y se reparten el costo. Pagas por kilo, pero no eliges la órbita ni la fecha." },
    costoFijo: { titulo: "Costo fijo", texto: "Armar y probar la nave, pagarle al equipo humano y operar la misión. En espacio profundo es mayor porque hay que usar antenas gigantes y navegación especial." },
    dificultad: { titulo: "Dificultad", texto: "Cambia el presupuesto, la cantidad de imprevistos y el riesgo. Los puntos se multiplican según la dificultad." },
    bateriaNave: { titulo: "Batería en vivo", texto: "Cuánta energía queda. Si llega a 0, la nave apaga los instrumentos para salvarse." },
    datosGuardados: { titulo: "Datos guardados", texto: "Lo que está en memoria esperando ser enviado. Si se llena, los datos nuevos se pierden." },
    datosEnviados: { titulo: "Datos enviados", texto: "Lo que ya llegó a la Tierra. ¡Esto es lo único que los científicos pueden usar!" }
  },

  /* ---------- Preguntas de reflexión generales (se suman a las del escenario) ---------- */
  preguntasReflexion: [
    "Si pudieras cambiar SOLO una pieza de tu nave, ¿cuál cambiarías y qué otras barras se verían afectadas?",
    "En los imprevistos tuviste que elegir entre seguridad y riesgo. ¿Cómo decidirías si fuera una misión real que costó millones?"
  ],

  /* =================================================================
     FUENTES — de dónde salen los datos del juego.
     Si algún enlace deja de funcionar, busca el título en el sitio
     de la organización.
     ================================================================= */
  fuentes: {
    // --- Piezas de la nave y física ---
    nasa_sst: { titulo: "Small Spacecraft Technology State of the Art", org: "NASA", url: "https://www.nasa.gov/smallsat-institute/sst-soa/", usado: "Masas, consumos y tipos de piezas de satélites pequeños (estructura, computador, antenas, orientación)." },
    nasa_sst_power: { titulo: "Small Spacecraft Technology State of the Art: Power", org: "NASA", url: "https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems", usado: "Celdas solares multiunión (~30% de eficiencia) y baterías de ion-litio." },
    tsiolkovsky: { titulo: "Ideal Rocket Equation", org: "NASA Glenn Research Center", url: "https://www.grc.nasa.gov/www/k-12/rocket/rktpow.html", usado: "Ecuación del cohete para calcular el combustible." },
    purdue_prop: { titulo: "Satellite Propulsion", org: "Purdue University", url: "https://engineering.purdue.edu/AAE/research/propulsion/Info/rockets/satellites/", usado: "Impulso específico de motores de hidracina (~200–230 s)." },
    smart1: { titulo: "Electric spacecraft propulsion (SMART-1)", org: "ESA", url: "https://sci.esa.int/web/smart-1/-/34201-electric-spacecraft-propulsion", usado: "Motor eléctrico de efecto Hall (~1.600 s de impulso) y su viaje lento a la Luna." },
    dsn: { titulo: "Deep Space Network", org: "NASA", url: "https://www.nasa.gov/communicating-with-missions/dsn/", usado: "Antenas gigantes para comunicarse con naves lejanas." },
    swpc: { titulo: "Coronal Mass Ejections", org: "NOAA Space Weather Prediction Center", url: "https://www.swpc.noaa.gov/phenomena/coronal-mass-ejections", usado: "Tormentas solares y sus efectos en los satélites." },
    esa_debris: { titulo: "Space Debris", org: "ESA", url: "https://www.esa.int/Space_Safety/Space_Debris", usado: "Riesgo de basura espacial y maniobras para esquivarla." },

    // --- Cohetes ---
    electron: { titulo: "Electron: datos del vehículo", org: "RocketLaunch.org (datos de Rocket Lab)", url: "https://rocketlaunch.org/launch-providers/rocket-lab/electron", usado: "Precio (~7,5 M USD) y capacidad (300 kg a órbita baja, ~200 kg a heliosíncrona)." },
    capstone: { titulo: "CAPSTONE", org: "NASA", url: "https://www.nasa.gov/mission/capstone/", usado: "Nave de 25 kg lanzada a la Luna en Electron/Photon; órbita de halo (NRHO)." },
    rideshare_2026: { titulo: "Satellite Ridesharing Market Analysis 2026", org: "New Space Economy", url: "https://newspaceeconomy.ca/2026/02/27/satellite-ridesharing-market-analysis-2026/", usado: "Precio del viaje compartido de SpaceX: ~350.000 USD hasta 50 kg + ~7.000 USD por kg extra." },
    pslv: { titulo: "PSLV", org: "ISRO", url: "https://www.isro.gov.in/PSLV_CON.html", usado: "Capacidad del PSLV a órbita heliosíncrona (~1.750 kg) y de transferencia (~1.425 kg)." },
    mom: { titulo: "Mars Orbiter Mission: Spacecraft", org: "ISRO", url: "https://www.isro.gov.in/Spacecraft.html", usado: "Mangalyaan: 1.337 kg al despegar, 852 kg de combustible, lanzada en PSLV-XL; costo ~74 M USD." },
    spacex: { titulo: "Falcon 9", org: "SpaceX", url: "https://www.spacex.com/vehicles/falcon-9/", usado: "Capacidades y reutilización del Falcon 9; precio de lista cercano a 70 M USD." },
    falcon_heavy: { titulo: "Falcon Heavy", org: "Wikipedia (datos de SpaceX)", url: "https://en.wikipedia.org/wiki/Falcon_Heavy", usado: "63.800 kg a órbita baja, 26.700 kg a GTO, 16.800 kg hacia Marte." },
    elvperf: { titulo: "Launch Vehicle Performance Website", org: "NASA Launch Services Program", url: "https://elvperf.ksc.nasa.gov/", usado: "Referencia para estimar cuánto lleva cada cohete a destinos lejanos." },

    // --- Tierra y Chile ---
    iss: { titulo: "International Space Station Facts", org: "NASA", url: "https://www.nasa.gov/international-space-station/space-station-facts-and-figures/", usado: "Órbita de ~400 km, inclinación 51,6°, una vuelta cada ~90 minutos." },
    landsat9: { titulo: "Landsat 9", org: "NASA / USGS", url: "https://landsat.gsfc.nasa.gov/satellites/landsat-9/", usado: "Órbita polar heliosíncrona de 705 km y su cámara OLI y térmica TIRS." },
    sentinel2: { titulo: "Sentinel-2", org: "ESA / Copernicus", url: "https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-2", usado: "Cámara multiespectral para vegetación, agua y glaciares." },
    iceye: { titulo: "ICEYE SAR satellites", org: "ICEYE", url: "https://www.iceye.com/", usado: "Radares de apertura sintética en satélites pequeños (~100 kg)." },
    dga_glaciares: { titulo: "Inventario Público de Glaciares", org: "Dirección General de Aguas (MOP Chile)", url: "https://dga.mop.gob.cl/inventario-publico-glaciares/", usado: "Chile tiene más de 26.000 glaciares (inventario 2022) y su superficie disminuyó respecto de 2014." },
    meteored_glaciares: { titulo: "Contabilizaron 26.129: ¿Por qué aumentó el número de glaciares en Chile?", org: "Meteored Chile", url: "https://www.meteored.cl/noticias/actualidad/contabilizaron-26129-por-que-aumento-el-numero-de-glaciares-en-chile.html", usado: "Los glaciares se fragmentan: hay más, pero más pequeños." },
    cr2_megasequia: { titulo: "La megasequía 2010–2015: una lección para el futuro", org: "Centro de Ciencia del Clima y la Resiliencia (CR)2", url: "https://www.cr2.cl/megasequia/", usado: "Megasequía de Chile central desde 2010." },
    goesr: { titulo: "GOES-R Series", org: "NOAA / NASA", url: "https://www.goes-r.gov/", usado: "Satélites geoestacionarios con generador de imágenes ABI y mapeador de rayos GLM." },
    goes_chile_fires: { titulo: "Wildfires in Chile (febrero 2024)", org: "CIMSS, Universidad de Wisconsin", url: "https://cimss.ssec.wisc.edu/satellite-blog/archives/56833", usado: "Seguimiento de incendios en Chile con GOES-16 cada 10 minutos." },
    nasa_chile_rayos: { titulo: "Lightning-caused wildfire risk in central Chile (DEVELOP)", org: "NASA", url: "https://ntrs.nasa.gov/api/citations/20220013143/downloads/2022Sum_LaRC_ChileWildfires_TechPaper_FD_v2.docx.pdf", usado: "Uso del mapeador de rayos GLM para riesgo de incendios con CONAF." },
    sernageomin: { titulo: "Red Nacional de Vigilancia Volcánica", org: "SERNAGEOMIN", url: "https://rnvv.sernageomin.cl/", usado: "Vigilancia de los volcanes activos de Chile." },

    // --- Luna ---
    moon_facts: { titulo: "Moon Facts", org: "NASA", url: "https://science.nasa.gov/moon/facts/", usado: "Distancia promedio Tierra–Luna: ~384.400 km." },
    lro: { titulo: "Lunar Reconnaissance Orbiter", org: "NASA", url: "https://science.nasa.gov/mission/lro/", usado: "Órbita polar baja, instrumentos (LROC, LEND, Diviner, Mini-RF) y apagado en eclipses." },
    lcross: { titulo: "LCROSS impact ejects minerals and frozen water", org: "AAAS / Science", url: "https://www.aaas.org/news/science-lcross-impact-ejects-minerals-and-frozen-water-crater-moon", usado: "Confirmación de hielo de agua en el cráter Cabeus (2009)." },
    lend: { titulo: "Hydrogen mapping of the lunar south pole using LEND", org: "Mitrofanov et al., Science (2010)", url: "https://experts.arizona.edu/en/publications/hydrogen-mapping-of-the-lunar-south-pole-using-the-lro-neutron-de/", usado: "Detector de neutrones para encontrar hidrógeno (hielo) en el polo sur." },
    artemis: { titulo: "Artemis", org: "NASA", url: "https://www.nasa.gov/humans-in-space/artemis/", usado: "Regreso de astronautas a la Luna, cerca del polo sur." },

    // --- Marte ---
    mars_facts: { titulo: "Mars Facts", org: "NASA", url: "https://science.nasa.gov/mars/facts/", usado: "Año marciano de 687 días; distancia y luz solar en Marte." },
    mro: { titulo: "Mars Reconnaissance Orbiter", org: "NASA", url: "https://science.nasa.gov/mission/mars-reconnaissance-orbiter/", usado: "Órbita baja (~300 km), cámara HiRISE, radar SHARAD y espectrómetro CRISM." },
    maven: { titulo: "MAVEN makes final preparations for Mars", org: "LASP / NASA", url: "https://lasp.colorado.edu/maven/2014/09/08/maven-spacecraft-makes-final-preparations-for-mars/", usado: "Órbita elíptica (~150 km de punto bajo) y estudio de la atmósfera." },
    conjuncion: { titulo: "NASA Mars missions stand down as the Sun blocks communications", org: "New Atlas (información de NASA)", url: "https://newatlas.com/space/nasa-mars-missions-pause-solar-conjunction", usado: "Conjunción solar: ~2 semanas sin enviar órdenes, cada ~26 meses." },
    opportunity: { titulo: "Mars Exploration Rover Opportunity", org: "NASA", url: "https://science.nasa.gov/mission/mer-opportunity/", usado: "La tormenta de polvo global de 2018 terminó la misión." },

    // --- Asteroide Apofis ---
    apophis_esa: { titulo: "Ramses: ESA's mission to asteroid Apophis", org: "ESA", url: "https://www.esa.int/Space_Safety/Planetary_Defence/Ramses_ESA_s_mission_to_asteroid_Apophis", usado: "Apofis (~375 m) pasará a ~32.000 km de la Tierra el 13 de abril de 2029; Ramses llegaría en febrero de 2029." },
    apophis_nasa: { titulo: "Apophis", org: "NASA", url: "https://science.nasa.gov/solar-system/asteroids/apophis/", usado: "Datos del asteroide y su paso cercano." },
    osiris_apex: { titulo: "Asteroid Apophis will visit Earth in 2029", org: "Space.com", url: "https://www.space.com/asteroid-apophis-2029-ramses-esa-mission", usado: "OSIRIS-APEX (ex OSIRIS-REx) llegará a Apofis después del paso cercano." },
    hera: { titulo: "Hera", org: "ESA", url: "https://www.esa.int/Space_Safety/Hera", usado: "Misión a un asteroide con CubeSats acompañantes y radar de baja frecuencia." }
  }
};
