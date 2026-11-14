/* =====================================================================
   trayectorias.js — Datos para planificar el viaje (fácil de editar)
   ---------------------------------------------------------------------
   EFEMÉRIDES: posiciones REALES de la Tierra, Marte y el asteroide Apofis
   alrededor del Sol, el día 1 de cada mes de 2027 a 2032. Se descargaron de
   NASA JPL Horizons (https://ssd.jpl.nasa.gov/horizons/) y se guardan aquí
   para que el juego funcione sin internet.
     Pedido usado: EPHEM_TYPE=VECTORS, CENTER=Sol (500@10), REF_PLANE=ECLIPTIC,
     STEP_SIZE=1 mes, unidades UA. La longitud (°) es el ángulo de cada cuerpo
     visto desde el Sol; la distancia, en UA (1 UA = 150 millones de km).
   Columnas de cada fila:
     [mes, longTierra, distTierra, longMarte, distMarte, TierraAMarte,
           longApofis, distApofis, TierraAApofis]
   ===================================================================== */

DATOS.efemerides = {
  fuente: "horizons", inicio: "2027-01",
  filas: [
  ["2027-01", 99.9, 0.983, 128.5, 1.647, 0.914, 33.3, 0.817, 0.999],
  ["2027-02", 131.5, 0.985, 142.2, 1.661, 0.718, 71.5, 0.922, 0.955],
  ["2027-03", 159.8, 0.991, 154.5, 1.666, 0.687, 99.4, 1.010, 1.007],
  ["2027-04", 190.7, 0.999, 168.0, 1.662, 0.835, 125.8, 1.075, 1.115],
  ["2027-05", 220.0, 1.007, 181.3, 1.650, 1.071, 149.3, 1.099, 1.222],
  ["2027-06", 249.9, 1.014, 195.2, 1.629, 1.332, 173.4, 1.079, 1.297],
  ["2027-07", 278.6, 1.017, 209.1, 1.601, 1.566, 198.6, 1.019, 1.308],
  ["2027-08", 308.2, 1.015, 224.1, 1.565, 1.775, 229.0, 0.924, 1.238],
  ["2027-09", 338.0, 1.009, 239.8, 1.526, 1.946, 267.2, 0.819, 1.071],
  ["2027-10", 7.2, 1.001, 255.8, 1.487, 2.074, 313.1, 0.752, 0.828],
  ["2027-11", 37.9, 0.993, 273.3, 1.449, 2.173, 4.2, 0.767, 0.555],
  ["2027-12", 68.2, 0.986, 291.0, 1.417, 2.243, 47.2, 0.851, 0.360],
  ["2028-01", 99.7, 0.983, 310.0, 1.393, 2.296, 82.6, 0.957, 0.294],
  ["2028-02", 131.2, 0.985, 329.6, 1.382, 2.338, 111.3, 1.043, 0.361],
  ["2028-03", 160.5, 0.991, 348.0, 1.384, 2.369, 134.9, 1.089, 0.474],
  ["2028-04", 191.4, 0.999, 7.4, 1.398, 2.396, 158.9, 1.096, 0.595],
  ["2028-05", 220.8, 1.008, 25.7, 1.424, 2.411, 182.7, 1.060, 0.676],
  ["2028-06", 250.6, 1.014, 43.8, 1.458, 2.407, 210.1, 0.984, 0.693],
  ["2028-07", 279.3, 1.017, 60.4, 1.496, 2.375, 242.0, 0.884, 0.621],
  ["2028-08", 308.9, 1.015, 76.7, 1.537, 2.303, 283.7, 0.786, 0.454],
  ["2028-09", 338.7, 1.009, 92.2, 1.575, 2.184, 333.8, 0.746, 0.276],
  ["2028-10", 7.9, 1.001, 106.6, 1.608, 2.018, 21.6, 0.793, 0.297],
  ["2028-11", 38.7, 0.992, 120.9, 1.635, 1.793, 62.4, 0.894, 0.400],
  ["2028-12", 68.9, 0.986, 134.3, 1.654, 1.533, 93.7, 0.992, 0.428],
  ["2029-01", 100.4, 0.983, 147.9, 1.664, 1.235, 120.8, 1.065, 0.376],
  ["2029-02", 132.0, 0.985, 161.5, 1.665, 0.943, 145.3, 1.098, 0.271],
  ["2029-03", 160.3, 0.991, 173.7, 1.658, 0.733, 167.0, 1.088, 0.160],
  ["2029-04", 191.1, 0.999, 187.5, 1.641, 0.648, 192.3, 1.036, 0.044],
  ["2029-05", 220.5, 1.007, 201.2, 1.617, 0.745, 222.0, 0.955, 0.059],
  ["2029-06", 250.4, 1.014, 215.8, 1.585, 0.945, 259.0, 0.900, 0.185],
  ["2029-07", 279.1, 1.017, 230.6, 1.549, 1.159, 296.9, 0.905, 0.319],
  ["2029-08", 308.6, 1.015, 246.7, 1.509, 1.367, 333.2, 0.967, 0.425],
  ["2029-09", 338.4, 1.009, 263.6, 1.469, 1.550, 4.0, 1.060, 0.460],
  ["2029-10", 7.7, 1.001, 280.9, 1.434, 1.703, 28.9, 1.152, 0.423],
  ["2029-11", 38.4, 0.993, 299.5, 1.405, 1.842, 51.1, 1.231, 0.341],
  ["2029-12", 68.7, 0.986, 318.2, 1.387, 1.963, 70.3, 1.284, 0.301],
  ["2030-01", 100.2, 0.983, 337.8, 1.381, 2.081, 88.9, 1.310, 0.397],
  ["2030-02", 131.7, 0.985, 357.4, 1.389, 2.194, 107.3, 1.304, 0.578],
  ["2030-03", 160.0, 0.991, 14.8, 1.408, 2.292, 124.4, 1.273, 0.744],
  ["2030-04", 190.9, 0.999, 33.4, 1.437, 2.391, 144.8, 1.211, 0.888],
  ["2030-05", 220.3, 1.007, 50.5, 1.473, 2.471, 167.0, 1.129, 0.964],
  ["2030-06", 250.2, 1.014, 67.4, 1.513, 2.526, 194.0, 1.033, 0.964],
  ["2030-07", 278.8, 1.017, 82.8, 1.552, 2.544, 225.2, 0.948, 0.888],
  ["2030-08", 308.4, 1.015, 98.1, 1.589, 2.517, 262.6, 0.898, 0.752],
  ["2030-09", 338.2, 1.009, 112.6, 1.620, 2.436, 301.7, 0.910, 0.609],
  ["2030-10", 7.4, 1.001, 126.3, 1.643, 2.300, 336.3, 0.975, 0.531],
  ["2030-11", 38.2, 0.993, 140.0, 1.659, 2.101, 6.6, 1.069, 0.566],
  ["2030-12", 68.4, 0.986, 153.2, 1.666, 1.857, 31.1, 1.160, 0.705],
  ["2031-01", 99.9, 0.983, 166.7, 1.663, 1.564, 53.0, 1.238, 0.915],
  ["2031-02", 131.5, 0.985, 180.4, 1.651, 1.249, 72.7, 1.289, 1.148],
  ["2031-03", 159.8, 0.991, 193.0, 1.633, 0.970, 89.5, 1.310, 1.350],
  ["2031-04", 190.6, 0.999, 207.3, 1.605, 0.708, 107.9, 1.304, 1.540],
  ["2031-05", 220.0, 1.007, 221.7, 1.571, 0.565, 126.2, 1.269, 1.671],
  ["2031-06", 249.9, 1.014, 237.3, 1.533, 0.587, 146.8, 1.204, 1.741],
  ["2031-07", 278.6, 1.017, 253.1, 1.493, 0.722, 169.3, 1.121, 1.744],
  ["2031-08", 308.2, 1.015, 270.4, 1.455, 0.901, 196.8, 1.024, 1.684],
  ["2031-09", 337.9, 1.009, 288.6, 1.421, 1.081, 229.7, 0.939, 1.579],
  ["2031-10", 7.2, 1.001, 307.0, 1.397, 1.251, 266.3, 0.896, 1.465],
  ["2031-11", 37.9, 0.993, 326.4, 1.383, 1.424, 305.2, 0.914, 1.381],
  ["2031-12", 68.1, 0.986, 345.5, 1.383, 1.593, 339.4, 0.983, 1.377],
  ["2032-01", 99.7, 0.983, 4.9, 1.396, 1.772, 9.1, 1.078, 1.466]
  ]
};

// Paso cercano de Apofis a la Tierra (también de JPL Horizons, cada 10 minutos)
DATOS.pasoApofis = {
  mes: "2029-04", fechaTexto: "13 de abril de 2029, ~21:50 (hora universal)",
  distanciaKm: 38040, // desde el centro de la Tierra: unos 31.700 km sobre la superficie
  texto: "Apofis pasará más cerca que los satélites geoestacionarios y se verá a simple vista desde Europa, África y parte de Asia."
};

/* ---------------------------------------------------------------------
   PLANIFICADOR POR ESCENARIO
     modo "ventana"   → hay que lanzar cuando el planeta esté en el ángulo justo
                        (faseIdeal = cuántos grados va Marte adelante de la Tierra)
     modo "distancia" → mientras más cerca esté el objetivo, menos energía cuesta
     modo "tipos"     → no hay fecha que elegir, solo el tipo de viaje
   penalizacion: km/s extra por cada (grado de diferencia)²
   tipos: los tipos de viaje que se pueden elegir (ver DATOS.tiposViaje)
   --------------------------------------------------------------------- */
DATOS.trayectorias = {
  marte: { modo: "ventana", cuerpo: "marte", nombreCuerpo: "Marte", faseIdeal: 44, penalizacion: 0.001,
    desde: "2027-01", hasta: "2031-12", tipos: ["directa", "asistencia"] },
  apofis: { modo: "distancia", cuerpo: "apofis", nombreCuerpo: "Apofis", distanciaLibre: 0.3, penalizacion: 0.8,
    desde: "2027-01", hasta: "2030-12", tipos: ["directa", "asistencia"],
    meta: { hasta: "2029-04", bonoCiencia: 0.2, texto: "Llegar antes del paso cercano del 13 de abril de 2029 permite estudiar cómo la gravedad de la Tierra sacude al asteroide." } },
  luna: { modo: "tipos", tipos: ["directa", "bajaEnergia"] }
};

DATOS.reglasViaje = {
  maximoExtra: 5,              // km/s: más que esto no lo logra ningún cohete del juego
  efectoCapacidad: 1.3,        // cada 1,3 km/s extra, el cohete lleva ~2,7 veces menos (función exponencial)
  maximoCapacidad: 1.4,        // con asistencia gravitatoria la carga sube, pero hasta 40% más
  diasPorGradoFuera: 2         // fuera de la ventana, el camino es más largo
};

DATOS.tiposViaje = {
  directa: { nombre: "Viaje directo", icono: "cohete",
    texto: "El cohete te lanza directo hacia el destino. Es lo más rápido.", ejemplo: "Como Perseverance (lanzado en julio de 2020, en plena ventana a Marte).", fuentes: ["mars2020"] },
  asistencia: { nombre: "Con asistencia de la Tierra", icono: "orbita", extraLanzamiento: -0.5, diasExtra: 365, mesesEspera: 12,
    texto: "La nave da una vuelta al Sol y vuelve a pasar junto a la Tierra un año después: su gravedad la empuja como una honda. El cohete gasta menos, pero el viaje dura 1 año más.",
    ejemplo: "OSIRIS-REx pasó junto a la Tierra en septiembre de 2017 para ganar velocidad hacia el asteroide Bennu.", fuentes: ["osirisrex"] },
  bajaEnergia: { nombre: "Baja energía (camino largo)", icono: "orbita", diasViaje: 120, factorLlegada: 0.75,
    texto: "La nave se aleja mucho y deja que la gravedad del Sol y la Tierra la acomoden. Tarda unos 4 meses, pero frenar al llegar a la Luna cuesta 25% menos combustible.",
    ejemplo: "CAPSTONE (NASA, 2022) tardó unos 4 meses en llegar a la Luna con muy poco combustible.", fuentes: ["capstone"] }
};

// Fuentes nuevas
Object.assign(DATOS.fuentes, {
  horizons: { titulo: "Horizons System", org: "NASA JPL", url: "https://ssd.jpl.nasa.gov/horizons/",
    usado: "Posiciones reales de la Tierra, Marte y Apofis (2027–2032) y el paso cercano de Apofis del 13 de abril de 2029." },
  mars2020: { titulo: "Mars 2020 Perseverance", org: "NASA", url: "https://science.nasa.gov/mission/mars-2020-perseverance/",
    usado: "Lanzamiento en julio de 2020, dentro de la ventana hacia Marte que se abre cada ~26 meses." },
  osirisrex: { titulo: "OSIRIS-REx", org: "NASA", url: "https://science.nasa.gov/mission/osiris-rex/",
    usado: "Asistencia gravitatoria de la Tierra en septiembre de 2017." }
});
// CAPSTONE ya estaba en js/datos.js: se agrega lo que se usa aquí
DATOS.fuentes.capstone.usado += " Viaje de baja energía de unos 4 meses (2022).";

// Explicaciones para "¿Por qué?" y la Ingeniera Paz
Object.assign(DATOS.porQue, {
  ventana: { titulo: "Ventanas de lanzamiento", texto: "La Tierra y Marte giran alrededor del Sol a distinta velocidad. El camino más barato sale cuando Marte va unos 44° adelante de la Tierra: así, cuando la nave llega a la órbita de Marte, el planeta está justo ahí. Esa posición se repite cada 26 meses." },
  efemerides: { titulo: "Posiciones reales", texto: "Las posiciones de los planetas que ves aquí son reales: vienen del sistema Horizons del Laboratorio de Propulsión a Chorro de la NASA (JPL), que calcula dónde está cada cuerpo del sistema solar." },
  asistencia: { titulo: "Asistencia gravitatoria", texto: "Al pasar muy cerca de un planeta, la nave cae hacia él y sale disparada con más velocidad, sin gastar combustible. Es como una honda. Muchas misiones reales lo hacen: Voyager, Juno, OSIRIS-REx." },
  extraViaje: { titulo: "Energía extra del viaje", texto: "Si lanzas fuera de la mejor fecha, el cohete tiene que dar más velocidad (más delta-v). Con la misma potencia, eso significa que puede llevar menos kilos." }
});
Object.assign(DATOS.conceptos, {
  planificador: { titulo: "Planifica tu viaje", texto: "Los planetas se mueven. Mira la línea de tiempo: los meses verdes son las mejores fechas para lanzar. Fuera de ellas tu cohete lleva menos carga. ¡Las posiciones son datos reales de la NASA!" }
});
