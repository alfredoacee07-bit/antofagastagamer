/* =====================================================================
   iconos.js — Íconos de línea dibujados en SVG (reemplazan a los emojis)
   ---------------------------------------------------------------------
   Cada ícono es un dibujo simple de 24×24 hecho con líneas.
   Se usa así:  Iconos.svg("cohete")  →  devuelve el código <svg> listo.
   Toman el color del texto que los rodea (currentColor).
   ===================================================================== */

const Iconos = (function () {

  const DIBUJOS = {
    peso: '<path d="M6 8h12l2 12H4z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    rayo: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    moneda: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2m0 8v2"/>',
    memoria: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v5h8V3M8 21v-6h8v6"/>',
    antena: '<path d="M4 10a8 8 0 0 0 10 10z"/><path d="M9 15l4-4"/><circle cx="14" cy="10" r="1.5"/><path d="M16 4a5 5 0 0 1 4 4M16 7a2 2 0 0 1 1 1"/>',
    reloj: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
    ciencia: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/>',
    cohete: '<path d="M12 2c3 2.5 5 6 5 10l-2 4H9l-2-4c0-4 2-7.5 5-10z"/><circle cx="12" cy="9" r="1.8"/><path d="M9 16l-3 3 1-5M15 16l3 3-1-5M10.5 19.5 12 22l1.5-2.5"/>',
    gota: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    luna: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    regla: '<path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/>',
    orbita: '<ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-20 12 12)"/><circle cx="12" cy="12" r="3"/>',
    llama: '<path d="M12 22a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-1.5-2-1.5-3C7 11 6 13.5 6 16a6 6 0 0 0 6 6z"/>',
    estrella: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    calendario: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M7.5 14h2M11 14h2M14.5 14h2M7.5 17h2M11 17h2"/>',
    constelacion: '<circle cx="5" cy="17" r="1.6"/><circle cx="10" cy="7" r="1.6"/><circle cx="15" cy="13" r="1.6"/><circle cx="20" cy="5" r="1.6"/><path d="M6.2 15.8 9 8.5M11.3 8.2l2.6 3.6M16.1 11.8l2.9-5.4"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    cruz: '<path d="M6 6l12 12M18 6 6 18"/>',
    alerta: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    idea: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    libro: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/>',
    casa: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>',
    documento: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h6"/>',
    satelite: '<rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M2 6l4-4 5 5-4 4zM22 18l-4 4-5-5 4-4zM14 10l2-2M17 5a4 4 0 0 1 2 2"/>',
    telescopio: '<path d="M3 12l14-6 2 5-14 6z"/><path d="M10 15l-3 6M12 14l3 7"/>',
    planeta: '<circle cx="12" cy="12" r="6"/><path d="M4.5 15.5C2 17.5 1.5 19 2.2 19.6c1.4 1.3 7-1.4 12.3-6.2s8.4-10.2 7-11.4c-.7-.6-2.3 0-4.4 1.6"/>',
    trofeo: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6"/>',
    grupo: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5 5"/>',
    persona: '<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    medalla: '<circle cx="12" cy="15" r="6"/><path d="M8.5 3 12 9l3.5-6"/><path d="m12 12.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/>',
    llave: '<path d="M15 4a5 5 0 0 0-4.6 6.9L3 18.3 5.7 21l7.4-7.4A5 5 0 0 0 20 9l-3 3-3-1-1-3z"/>',
    dado: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>',
    menos: '<path d="M6 12h12"/>',
    grafico: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
    camara: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l2-3h4l2 3"/>',
    enviar: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    basura: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    objetivo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    mapa: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    prohibido: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    pregunta: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>',
    reiniciar: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    bandera: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
    bateria: '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2M6 10v4M10 10v4M14 10v4"/>',
    bateriaBaja: '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2M6 10v4"/>',
    escudo: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    pausa: '<path d="M9 5v14M15 5v14"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    lista: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    engranaje: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    volumen: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
    silencio: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
    nota: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    hablar: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    auriculares: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/>',
    casco: '<path d="M4 13a8 8 0 0 1 16 0v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M7 11.5h10v4.5H7z"/>',
    flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    flechaIzq: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
  };

  // Devuelve el <svg> del ícono pedido (o un círculo si no existe)
  function svg(nombre, clase) {
    const dibujo = DIBUJOS[nombre] || '<circle cx="12" cy="12" r="4"/>';
    return '<svg class="icono ' + (clase || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + dibujo + '</svg>';
  }

  return { svg: svg, existe: function (n) { return !!DIBUJOS[n]; } };
})();
