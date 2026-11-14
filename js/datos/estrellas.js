/* =====================================================================
   estrellas.js — Estrellas reales para orientarse (fácil de editar)
   ---------------------------------------------------------------------
   Las naves usan un "rastreador de estrellas" (star tracker): una cámara
   que fotografía el cielo y lo compara con un mapa para saber hacia dónde
   apunta la nave. Aquí está ese mapa: estrellas brillantes reales del
   cielo del sur, con su posición (coordenadas de época J2000).
     ar  → ascensión recta en horas (0 a 24): la "longitud" del cielo
     dec → declinación en grados (−90 = polo sur celeste)
     mag → brillo (magnitud): mientras MENOR el número, más brillante
   Valores redondeados del Catálogo de Estrellas Brillantes de Yale.
   ===================================================================== */

DATOS.estrellas = [
  // Cruz del Sur (Crux)
  { id: "acrux", nombre: "Acrux", ar: 12.443, dec: -63.10, mag: 0.8, con: "cruz" },
  { id: "mimosa", nombre: "Mimosa", ar: 12.795, dec: -59.69, mag: 1.3, con: "cruz" },
  { id: "gacrux", nombre: "Gacrux", ar: 12.519, dec: -57.11, mag: 1.6, con: "cruz" },
  { id: "imai", nombre: "Imai (δ Cru)", ar: 12.252, dec: -58.75, mag: 2.8, con: "cruz" },
  { id: "ginan", nombre: "Ginan (ε Cru)", ar: 12.356, dec: -60.40, mag: 3.6, con: "cruz" },
  // Centauro: las dos "punteras" que señalan a la Cruz
  { id: "rigilkent", nombre: "Alfa Centauri", ar: 14.660, dec: -60.83, mag: -0.3, con: "centauro" },
  { id: "hadar", nombre: "Hadar (β Cen)", ar: 14.064, dec: -60.37, mag: 0.6, con: "centauro" },
  { id: "menkent", nombre: "Menkent (θ Cen)", ar: 14.111, dec: -36.37, mag: 2.1, con: "centauro" },
  { id: "muhlifain", nombre: "Muhlifain (γ Cen)", ar: 12.692, dec: -48.96, mag: 2.2, con: "centauro" },
  { id: "epscen", nombre: "ε Centauri", ar: 13.665, dec: -53.47, mag: 2.3, con: "centauro" },
  // Escorpión
  { id: "antares", nombre: "Antares", ar: 16.490, dec: -26.43, mag: 1.1, con: "escorpion" },
  { id: "acrab", nombre: "Acrab (β Sco)", ar: 16.091, dec: -19.81, mag: 2.6, con: "escorpion" },
  { id: "dschubba", nombre: "Dschubba (δ Sco)", ar: 16.006, dec: -22.62, mag: 2.3, con: "escorpion" },
  { id: "fang", nombre: "Fang (π Sco)", ar: 15.981, dec: -26.11, mag: 2.9, con: "escorpion" },
  { id: "alniyat", nombre: "Alniyat (σ Sco)", ar: 16.353, dec: -25.59, mag: 2.9, con: "escorpion" },
  { id: "tausco", nombre: "τ Scorpii", ar: 16.598, dec: -28.22, mag: 2.8, con: "escorpion" },
  { id: "larawag", nombre: "Larawag (ε Sco)", ar: 16.836, dec: -34.29, mag: 2.3, con: "escorpion" },
  { id: "musco", nombre: "μ Scorpii", ar: 16.864, dec: -38.05, mag: 3.0, con: "escorpion" },
  { id: "zetasco", nombre: "ζ Scorpii", ar: 16.910, dec: -42.36, mag: 3.6, con: "escorpion" },
  { id: "etasco", nombre: "η Scorpii", ar: 17.203, dec: -43.24, mag: 3.3, con: "escorpion" },
  { id: "sargas", nombre: "Sargas (θ Sco)", ar: 17.622, dec: -43.00, mag: 1.9, con: "escorpion" },
  { id: "iotasco", nombre: "ι Scorpii", ar: 17.793, dec: -40.13, mag: 3.0, con: "escorpion" },
  { id: "girtab", nombre: "Girtab (κ Sco)", ar: 17.708, dec: -39.03, mag: 2.4, con: "escorpion" },
  { id: "shaula", nombre: "Shaula", ar: 17.560, dec: -37.10, mag: 1.6, con: "escorpion" },
  // Orión (se ve "al revés" desde Chile: las Tres Marías son "el cinturón")
  { id: "betelgeuse", nombre: "Betelgeuse", ar: 5.919, dec: 7.41, mag: 0.5, con: "orion" },
  { id: "rigel", nombre: "Rigel", ar: 5.242, dec: -8.20, mag: 0.1, con: "orion" },
  { id: "bellatrix", nombre: "Bellatrix", ar: 5.419, dec: 6.35, mag: 1.6, con: "orion" },
  { id: "saiph", nombre: "Saiph", ar: 5.796, dec: -9.67, mag: 2.1, con: "orion" },
  { id: "alnitak", nombre: "Alnitak", ar: 5.679, dec: -1.94, mag: 1.8, con: "orion" },
  { id: "alnilam", nombre: "Alnilam", ar: 5.604, dec: -1.20, mag: 1.7, con: "orion" },
  { id: "mintaka", nombre: "Mintaka", ar: 5.533, dec: -0.30, mag: 2.2, con: "orion" },
  // Estrellas muy brillantes sueltas, útiles para orientarse
  { id: "sirio", nombre: "Sirio", ar: 6.752, dec: -16.72, mag: -1.5, con: "canmayor" },
  { id: "canopus", nombre: "Canopus", ar: 6.399, dec: -52.70, mag: -0.7, con: "carina" },
  { id: "achernar", nombre: "Achernar", ar: 1.629, dec: -57.24, mag: 0.5, con: "eridano" }
];

// Líneas que dibujan cada constelación (pares de estrellas)
DATOS.constelaciones = {
  cruz: { nombre: "Cruz del Sur", lineas: [["gacrux", "acrux"], ["mimosa", "imai"]],
    pista: "Cuatro estrellas en cruz; la más baja y brillante es Acrux." },
  centauro: { nombre: "Centauro", lineas: [["rigilkent", "hadar"], ["hadar", "epscen"], ["epscen", "muhlifain"], ["epscen", "menkent"]],
    pista: "Dos estrellas muy brillantes juntas (las punteras) que apuntan hacia la Cruz del Sur." },
  escorpion: { nombre: "Escorpión", lineas: [["acrab", "dschubba"], ["dschubba", "fang"], ["dschubba", "alniyat"], ["alniyat", "antares"], ["antares", "tausco"],
    ["tausco", "larawag"], ["larawag", "musco"], ["musco", "zetasco"], ["zetasco", "etasco"], ["etasco", "sargas"], ["sargas", "iotasco"], ["iotasco", "girtab"], ["girtab", "shaula"]],
    pista: "Una curva larga como una cola, con una estrella rojiza en el corazón: Antares." },
  orion: { nombre: "Orión", lineas: [["betelgeuse", "bellatrix"], ["betelgeuse", "alnitak"], ["bellatrix", "mintaka"], ["alnitak", "alnilam"], ["alnilam", "mintaka"],
    ["alnitak", "saiph"], ["mintaka", "rigel"]],
    pista: "Tres estrellas en fila al centro (las Tres Marías), rodeadas por cuatro brillantes." }
};

// Rondas del desafío: qué hay que encontrar
DATOS.rondasEstrellas = [
  { tipo: "estrella", con: "cruz", objetivo: "acrux", texto: "Encuentra la Cruz del Sur y toca Acrux, su estrella más brillante." },
  { tipo: "estrella", con: "escorpion", objetivo: "antares", texto: "Encuentra el Escorpión y toca Antares, su corazón rojo." },
  { tipo: "estrella", con: "orion", objetivo: "rigel", texto: "Encuentra Orión y toca Rigel, la estrella azul de su pie." },
  { tipo: "estrella", con: "centauro", objetivo: "rigilkent", texto: "Encuentra las punteras de Centauro y toca Alfa Centauri, la estrella más cercana que se ve a simple vista." },
  { tipo: "polo", con: "cruz", texto: "Prolonga el palo largo de la Cruz (de Gacrux a Acrux) unas 4,5 veces y toca el Polo Sur celeste." }
];

DATOS.fuentes.estrellas = { titulo: "Bright Star Catalogue (Yale)", org: "Harvard-Smithsonian CfA", url: "http://tdc-www.harvard.edu/catalogs/bsc5.html",
  usado: "Posición y brillo de las estrellas del minijuego de orientación." };
DATOS.fuentes.constelaciones = { titulo: "The Constellations", org: "Unión Astronómica Internacional (IAU)", url: "https://www.iau.org/public/themes/constellations/",
  usado: "Nombres oficiales de constelaciones y estrellas." };

DATOS.porQue.rastreadorEstrellas = { titulo: "Rastreador de estrellas", texto: "Es una cámara que mira el cielo. El computador compara las estrellas que ve con un mapa guardado y así sabe exactamente hacia dónde apunta la nave, como un marinero que navega mirando las estrellas." };

// Imprevisto: la nave pierde su orientación (minijuego "estrellas")
DATOS.eventos.push({
  id: "estrellas", titulo: "¡La nave perdió su orientación!", imagen: "assets/imagenes/comp-orientacion.jpg", rol: "ingeniera",
  descripcion: "Un reinicio del computador borró hacia dónde apunta la nave. Hay que reconocer las constelaciones que ve el rastreador de estrellas para volver a orientarla.",
  paz: "Mira el mapa de la derecha y busca ese dibujo en el cielo. Puedes girar la vista con las flechas. ¡Toca la estrella correcta!",
  fuentes: ["estrellas", "constelaciones"],
  minijuego: "estrellas",
  resultados: {
    bien: { cienciaExtra: 30, mensaje: "¡Orientación recuperada en tiempo récord! La nave volvió a apuntar sus instrumentos (+30 puntos de ciencia)." },
    regular: { seguroDias: 2, mensaje: "La nave se orientó, pero tardó: 2 días en modo seguro." },
    mal: { seguroDias: 5, bajadaTemporal: { factor: 0.5, dias: 10 }, mensaje: "Costó mucho orientarse: 5 días en modo seguro y la antena mal apuntada durante 10 días (50% de velocidad)." }
  }
});
