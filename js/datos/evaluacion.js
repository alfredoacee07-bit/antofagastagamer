/* =====================================================================
   evaluacion.js — Prueba "antes y después" (fácil de editar)
   ---------------------------------------------------------------------
   Las mismas preguntas se responden ANTES de jugar y DESPUÉS de jugar.
   Así se puede medir cuánto se aprendió (el impacto del juego).
   Cada pregunta: texto, opciones, cuál es la correcta (desde 0),
   explicación y fuentes (ids de DATOS.fuentes).
   ===================================================================== */

DATOS.evaluacion = [
  { pregunta: "¿Por qué casi todos los cohetes que llegan a órbita tienen 2 o 3 etapas?",
    opciones: ["Para que se vean más grandes", "Para soltar el peso de los tanques vacíos y acelerar más", "Porque cada etapa lleva a un astronauta", "Para gastar más combustible"],
    correcta: 1, explicacion: "Un tanque vacío es peso muerto. Al soltarlo, el resto del cohete es más liviano y acelera más con el mismo combustible.", fuentes: ["tsiolkovsky"] },
  { pregunta: "¿Cada cuánto tiempo hay una buena «ventana» para lanzar una nave a Marte?",
    opciones: ["Todos los meses", "Cada unos 26 meses", "Cada 10 años", "Solo con luna llena"],
    correcta: 1, explicacion: "La Tierra y Marte giran a distinta velocidad: quedan en la posición justa cada ~26 meses. Lo comprobaste con las posiciones reales de JPL Horizons.", fuentes: ["horizons"] },
  { pregunta: "Un satélite que debe mirar SIEMPRE la misma zona de Chile (por ejemplo, para ver incendios apenas empiezan), ¿qué órbita usa?",
    opciones: ["Órbita baja, a 400 km", "Órbita polar", "Órbita geoestacionaria, a 35.786 km", "Una órbita alrededor de la Luna"],
    correcta: 2, explicacion: "En la órbita geoestacionaria el satélite da una vuelta en un día, igual que la Tierra: siempre ve la misma región.", fuentes: ["goesr"] },
  { pregunta: "¿Cuánto oxígeno respira una persona en un día?",
    opciones: ["Unos 8 gramos", "Unos 0,84 kilos", "Unos 8 kilos", "Unos 84 kilos"],
    correcta: 1, explicacion: "Una persona usa unos 0,84 kg de oxígeno por día. En Marte hay que producirlo, por ejemplo sacándolo del CO2 del aire como MOXIE.", fuentes: ["eclss", "moxie"] },
  { pregunta: "¿Por qué los paneles solares producen menos energía en Marte que cerca de la Tierra?",
    opciones: ["Porque Marte es rojo", "Porque Marte está más lejos del Sol y llega menos luz (cerca del 43%)", "Porque en Marte no hay día", "Producen lo mismo"],
    correcta: 1, explicacion: "La luz disminuye con el cuadrado de la distancia: Marte está 1,52 veces más lejos, así que llega 1 ÷ 1,52² ≈ 43% de la luz. Y además el polvo los tapa.", fuentes: ["mars_facts", "insight"] },
  { pregunta: "Si a tu nave le agregas un instrumento más, ¿qué puede pasar?",
    opciones: ["Nada, solo hay más ciencia", "Necesita más energía, más memoria y más espacio en el cohete, y cuesta más", "La nave se vuelve más liviana", "El cohete viaja más rápido"],
    correcta: 1, explicacion: "En ingeniería todo está conectado: cada decisión afecta a las demás. Por eso hay que buscar el equilibrio.", fuentes: [] }
];
