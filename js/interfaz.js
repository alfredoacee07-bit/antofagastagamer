/* =====================================================================
   interfaz.js — Todo lo que se VE y se TOCA en SPACE SIMULATOR
   ---------------------------------------------------------------------
   - Guarda las elecciones del jugador en el objeto "estado".
   - Dibuja el menú de inicio y las 6 fases.
   - Actualiza el panel de recursos con cada clic.
   - Maneja a la Ingeniera Paz, los "¿Por qué?", el modo equipo,
     las opciones, los créditos, las fuentes, los imprevistos y los récords.
   Las imágenes vienen de assets/imagenes/ y los íconos de iconos.js.
   ===================================================================== */

(function () {

  /* ---------- Las elecciones del jugador ---------- */
  const estado = {
    fase: 0,                    // 0 = inicio, 1 a 6 = fases del juego, −1 = centro de control
    vistaInicio: "menu",        // "menu", "modos", "jugar", "equipo", "rapida" o "libre"
    modoJuego: "completa",      // "completa", "rapida" (contrato con reloj) o "libre" (sin límites)
    contrato: null,             // id del contrato elegido (Misión rápida)
    lanzamiento: null,          // { aTiempo, minutosSobrantes } al lanzar en Misión rápida
    faseMax: 0,
    modo: "individual",         // "individual" o "equipo"
    numJugadores: 2,
    nombres: ["", "", "", ""],
    dificultad: "ingeniera",
    escenario: null,
    componentes: {},
    instrumentos: [],
    orbita: null,
    cohete: null,
    resultado: null,
    conceptosVistos: {}
  };
  DATOS.componentes.forEach(function (c) { estado.componentes[c.id] = null; });

  const FASES = [
    { n: 0, nombre: "Inicio", icono: "casa" },
    { n: 1, nombre: "El encargo", icono: "documento" },
    { n: 2, nombre: "La nave", icono: "satelite" },
    { n: 3, nombre: "Instrumentos", icono: "telescopio" },
    { n: 4, nombre: "Órbita y cohete", icono: "cohete" },
    { n: 5, nombre: "Simulación", icono: "planeta" },
    { n: 6, nombre: "Informe", icono: "trofeo" }
  ];

  // Qué roles deciden en cada fase (modo equipo)
  const ROLES_FASE = { 1: ["directora"], 2: ["ingeniera", "comunicaciones"], 3: ["cientifica"], 4: ["cientifica", "directora"] };

  const RECURSOS = [
    { id: "masa", nombre: "Masa", icono: "peso" },
    { id: "energia", nombre: "Energía", icono: "rayo" },
    { id: "presupuesto", nombre: "Presupuesto", icono: "moneda" },
    { id: "datos", nombre: "Datos", icono: "memoria" },
    { id: "comunicaciones", nombre: "Comunicaciones", corto: "Comunic.", icono: "antena" },
    { id: "tiempo", nombre: "Tiempo", icono: "reloj" }
  ];

  // Grupos para mostrar las fuentes ordenadas
  const GRUPOS_FUENTES = [
    { nombre: "Piezas de la nave y física", ids: ["nasa_sst", "nasa_sst_power", "tsiolkovsky", "purdue_prop", "smart1", "dsn", "swpc", "esa_debris"] },
    { nombre: "Cohetes", ids: ["electron", "capstone", "rideshare_2026", "pslv", "mom", "spacex", "falcon_heavy", "elvperf", "deltav"] },
    { nombre: "Tierra y Chile", ids: ["iss", "landsat9", "sentinel2", "iceye", "dga_glaciares", "meteored_glaciares", "cr2_megasequia", "goesr", "goes_chile_fires", "nasa_chile_rayos", "sernageomin"] },
    { nombre: "Luna", ids: ["moon_facts", "lro", "lcross", "lend", "artemis"] },
    { nombre: "Marte", ids: ["mars_facts", "mro", "maven", "conjuncion", "opportunity"] },
    { nombre: "Asteroide Apofis", ids: ["apophis_esa", "apophis_nasa", "osiris_apex", "hera"] },
    { nombre: "Planificación del viaje", ids: ["horizons", "mars2020", "osirisrex"] },
    { nombre: "Cielo y orientación", ids: ["estrellas", "constelaciones"] },
    { nombre: "Varado en Marte", ids: ["moxie", "rad_curiosity", "insight", "eclss", "atardecer_marte"] }
  ];

  const fmt = Motor.fmt;
  const ic = Iconos.svg;
  const $ = function (sel) { return document.querySelector(sel); };

  // Evita que un nombre escrito por el jugador rompa la página
  function seguro(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  // Foto para una tarjeta (si no carga, se oculta sola)
  function foto(src, clase) {
    if (!src) return "";
    return '<img class="' + (clase || "foto-tarjeta") + '" src="' + src + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">';
  }

  // Avatar de la Ingeniera Paz: su foto real si existe, o un ícono de casco
  function avatarPaz() {
    if (DATOS.config.fotoPaz) return '<img src="' + DATOS.config.fotoPaz + '" alt="Ingeniera Paz">';
    return '<span class="avatar-icono">' + ic("casco") + '</span>';
  }

  /* =================================================================
     OPCIONES (se guardan en este dispositivo)
     ================================================================= */
  const CLAVE_OPCIONES = "spaceSimulator.opciones";
  const opciones = Object.assign({
    calidadBaja: false,
    volMusica: 0.6, volEfectos: 0.8, silencio: false, pista: "auto",   // sonido
    vozActiva: true, vozVelocidad: 1                                    // voz de Paz
  }, leerJSON(CLAVE_OPCIONES, {}));
  function leerJSON(clave, defecto) {
    try { const v = JSON.parse(localStorage.getItem(clave)); return v === null ? defecto : v; } catch (e) { return defecto; }
  }
  // Aplica las opciones al juego, al sonido y a la voz, y las guarda
  function aplicarOpciones(guardar) {
    if (guardar) { try { localStorage.setItem(CLAVE_OPCIONES, JSON.stringify(opciones)); } catch (e) { /* modo privado: no pasa nada */ } }
    document.body.classList.toggle("calidad-baja", opciones.calidadBaja);
    Sonido.configurar({ volMusica: opciones.volMusica, volEfectos: opciones.volEfectos, silencio: opciones.silencio });
    Voz.configurar({ activa: opciones.vozActiva, velocidad: opciones.vozVelocidad });
    Vista3D.configurar({ calidadBaja: opciones.calidadBaja });
    const b = $("#boton-sonido");
    if (b) { b.innerHTML = ic(opciones.silencio ? "silencio" : "volumen"); b.title = opciones.silencio ? "Activar sonido" : "Silenciar"; }
  }
  function guardarOpciones() { aplicarOpciones(true); }

  function deslizador(id, valor, min, max, paso) {
    return '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + paso + '" value="' + valor + '">';
  }

  function abrirOpciones() {
    const pistas = Sonido.pistas().map(function (p) {
      return '<option value="' + p.id + '"' + (opciones.pista === p.id ? " selected" : "") + '>' + p.nombre + '</option>';
    }).join("");
    abrirModal('<h2>' + ic("engranaje") + ' Opciones</h2>' +
      '<h3>' + ic("nota") + ' Música</h3>' +
      '<label class="opcion-fila"><input type="checkbox" id="op-silencio"' + (opciones.silencio ? " checked" : "") + '><span><b>Silenciar todo</b><br><small>Apaga la música y los efectos.</small></span></label>' +
      '<div class="opcion-control"><label for="op-musica">Volumen de la música</label>' + deslizador("op-musica", opciones.volMusica, 0, 1, 0.05) + '</div>' +
      '<div class="opcion-control"><label for="op-pista">Pista</label><select id="op-pista" class="input-nombre"><option value="auto"' + (opciones.pista === "auto" ? " selected" : "") + '>Automática (cambia según el momento del juego)</option>' + pistas + '</select></div>' +
      '<h3>' + ic("volumen") + ' Efectos de sonido</h3>' +
      '<div class="opcion-control"><label for="op-efectos">Volumen de los efectos</label>' + deslizador("op-efectos", opciones.volEfectos, 0, 1, 0.05) + '</div>' +
      '<div class="botones-prueba"><button class="btn btn-mini" data-accion="probarEfecto" data-e="despegue">Despegue</button><button class="btn btn-mini" data-accion="probarEfecto" data-e="alarma">Alarma</button>' +
      '<button class="btn btn-mini" data-accion="probarEfecto" data-e="pitido">Comunicación</button><button class="btn btn-mini" data-accion="probarEfecto" data-e="impacto">Impacto</button><button class="btn btn-mini" data-accion="probarEfecto" data-e="exito">Éxito</button><button class="btn btn-mini" data-accion="probarEfecto" data-e="falla">Falla</button></div>' +
      '<h3>' + ic("hablar") + ' Voz de la Ingeniera Paz</h3>' +
      (Voz.disponible() ? '<label class="opcion-fila"><input type="checkbox" id="op-voz"' + (opciones.vozActiva ? " checked" : "") + '><span><b>Paz habla en voz alta</b><br><small>Voz usada: ' + seguro(Voz.nombreVoz()) + '. Los textos siguen apareciendo escritos.</small></span></label>' +
        '<div class="opcion-control"><label for="op-velocidad">Velocidad de la voz: <b id="op-velocidad-txt">' + fmt(opciones.vozVelocidad, 2) + '×</b></label>' + deslizador("op-velocidad", opciones.vozVelocidad, 0.6, 1.5, 0.05) + '</div>' +
        '<div class="botones-prueba"><button class="btn btn-mini" data-accion="probarVoz">' + ic("hablar") + ' Probar voz</button></div>'
        : '<p><small>Este navegador no tiene voz sintetizada. Los textos de Paz siguen apareciendo escritos.</small></p>') +
      '<h3>' + ic("satelite") + ' Rendimiento</h3>' +
      '<label class="opcion-fila"><input type="checkbox" id="op-calidad"' + (opciones.calidadBaja ? " checked" : "") + '>' +
      '<span><b>Calidad baja</b><br><small>Menos estrellas y animaciones. Úsala en computadores o tablets lentos.</small></span></label>' +
      '<p><small>Las opciones se guardan en este dispositivo.</small></p>' +
      '<div class="centro"><button class="btn btn-principal" data-accion="cerrarModal">Listo</button></div>', true);
  }

  /* =================================================================
     MÚSICA SEGÚN EL MOMENTO DEL JUEGO
     ================================================================= */
  function musicaDeFase() {
    if (estado.fase === 0) return "inicio";
    if (estado.fase === -2) return "simulacion";
    if (estado.fase <= 4) return "diseno";
    if (estado.resultado) return estado.resultado.informe.estrellas >= 2 ? "victoria" : "derrota";
    return enVuelo ? "simulacion" : "lanzamiento";   // antes y durante el despegue suena "lanzamiento"
  }
  let enVuelo = false;
  function ponerMusica(pista) {
    Sonido.musica(opciones.pista !== "auto" ? opciones.pista : (pista || musicaDeFase()));
  }

  /* =================================================================
     CRÉDITOS
     ================================================================= */
  function abrirCreditos() {
    let html = '<h2>' + ic("info") + ' Créditos</h2>' +
      '<p><b>SPACE SIMULATOR</b> es un juego educativo creado para el desafío NASA Space Apps Challenge.</p>' +
      '<p class="aviso-legal">SPACE SIMULATOR <b>no es un producto oficial de la NASA</b> ni de ninguna agencia espacial. Usa imágenes que la NASA publica para uso libre; ninguna agencia respalda este juego.</p>' +
      '<h3>Imágenes</h3><p><small>Fuente: archivo de imágenes y videos de la NASA (images.nasa.gov). El detalle completo está en CREDITOS.md.</small></p><ul class="lista-creditos">';
    (typeof CREDITOS_IMAGENES !== "undefined" ? CREDITOS_IMAGENES : []).forEach(function (c) {
      html += '<li><img src="assets/imagenes/' + c.archivo + '" alt="" loading="lazy"><div><a href="' + c.url + '" target="_blank" rel="noopener">' + seguro(c.titulo) + '</a>' +
        '<br><small>' + seguro(c.autor) + ' · ' + seguro(c.licencia) + '</small></div></li>';
    });
    html += '</ul><h3>Música, efectos y voz</h3><p><small>La música (6 pistas) y todos los efectos de sonido fueron creados con código para este proyecto (Web Audio API). La voz de la Ingeniera Paz usa la voz en español que trae tu dispositivo.</small></p>' +
      '<h3>Videos y 3D</h3><p><small>Videos: NASA (lanzamiento y separación de etapas de Artemis I, la Tierra vista por satélites de NASA Goddard) y NASA/JPL-Caltech (equipo de Perseverance). ' +
      'Texturas de la Tierra y la Luna: NASA Scientific Visualization Studio. Motor 3D: Three.js (licencia MIT). Modelos y escenas 3D creados para este proyecto.</small></p>' +
      '<h3>Ingeniera Paz</h3><p><small>Su retrato es una imagen 3D creada para SPACE SIMULATOR (traje espacial con visor, sin rostro de una persona real).</small></p>' +
      '<div class="centro"><button class="btn btn-secundario" data-accion="fuentes">' + ic("libro") + ' Fuentes de los datos</button> <button class="btn btn-principal" data-accion="cerrarModal">Cerrar</button></div>';
    abrirModal(html, true);
  }

  /* =================================================================
     MODO EQUIPO: quién tiene cada rol
     ================================================================= */
  function jugadores() {
    const n = estado.modo === "equipo" ? estado.numJugadores : 1;
    return DATOS.repartoRoles[n].map(function (roles, i) {
      return { nombre: estado.nombres[i] || (estado.modo === "equipo" ? "Jugador " + (i + 1) : "Tú"), roles: roles };
    });
  }
  function rol(id) { return Motor.buscar(DATOS.roles, id); }
  function jugadorDeRol(rolId) {
    return jugadores().find(function (j) { return j.roles.indexOf(rolId) >= 0; });
  }
  function chipRol(rolId, sinNombre) {
    const ro = rol(rolId);
    const quien = estado.modo === "equipo" && !sinNombre ? seguro(jugadorDeRol(rolId).nombre) + " · " : "";
    return '<span class="chip-rol" style="--color-rol:' + ro.color + '">' + ic(ro.icono) + quien + ro.nombre + "</span>";
  }
  function bannerTurno(fase) {
    if (estado.modo !== "equipo" || !ROLES_FASE[fase]) return "";
    const roles = ROLES_FASE[fase];
    return '<div class="turno"><span class="turno-titulo">' + ic("grupo") + ' Turno de:</span>' + roles.map(function (r) { return chipRol(r); }).join("") +
      '<small>' + roles.map(function (id) { return rol(id).tareas; }).join(" ") + '</small></div>';
  }

  /* =================================================================
     FUENTES
     ================================================================= */
  function fuentesMini(ids) {
    if (!ids || !ids.length) return "";
    return '<span class="fuentes-mini">' + ic("libro") + ' ' + ids.map(function (id) {
      const f = DATOS.fuentes[id];
      return f ? '<a href="' + f.url + '" target="_blank" rel="noopener" title="' + seguro(f.titulo) + '">' + seguro(f.org) + "</a>" : "";
    }).join(" · ") + "</span>";
  }

  function htmlFuente(id) {
    const f = DATOS.fuentes[id];
    if (!f) return "";
    return '<li><a href="' + f.url + '" target="_blank" rel="noopener"><b>' + seguro(f.titulo) + "</b></a> — " + seguro(f.org) +
      '<br><small>Dato usado: ' + seguro(f.usado) + "</small></li>";
  }

  function abrirFuentes(soloEscenario) {
    let html = '<h2>' + ic("libro") + ' ¿De dónde salen los datos?</h2>';
    if (soloEscenario) {
      const esc = Motor.escenario(estado);
      const ids = [];
      function agregar(lista) { (lista || []).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); }
      agregar(esc.fuentes);
      esc.orbitas.forEach(function (o) { agregar(o.fuentes); });
      esc.instrumentos.forEach(function (i) { agregar(i.fuentes); });
      html += '<p class="nota-fuentes">Fuentes de la misión <b>' + esc.nombre + "</b>.</p><ul class='lista-fuentes'>" + ids.map(htmlFuente).join("") + "</ul>";
    } else {
      html += '<p class="nota-fuentes">Los números del juego están <b>simplificados y redondeados</b> para que sean fáciles de usar, pero se basan en estas fuentes reales. Si un enlace deja de funcionar, busca el título en el sitio de la organización.</p>';
      GRUPOS_FUENTES.forEach(function (g) {
        html += "<h3>" + g.nombre + "</h3><ul class='lista-fuentes'>" + g.ids.map(htmlFuente).join("") + "</ul>";
      });
    }
    abrirModal(html + '<div class="centro"><button class="btn btn-principal" data-accion="cerrarModal">Cerrar</button></div>', true);
  }

  /* =================================================================
     BOTONES "¿Por qué?" Y VENTANA EMERGENTE
     ================================================================= */
  function pq(clave, grande) {
    if (grande) return '<button class="porque porque-grande" data-accion="porque" data-clave="' + clave + '">¿Por qué?</button>';
    return '<button class="porque" data-accion="porque" data-clave="' + clave + '" aria-label="¿Por qué?" title="¿Por qué?">?</button>';
  }

  function abrirPorQue(clave) {
    const info = DATOS.porQue[clave];
    if (!info) return;
    abrirModal('<div class="modal-porque"><div class="mini-avatar">' + avatarPaz() + '</div>' +
      '<div><p class="etiqueta">¿Por qué?</p><h2>' + info.titulo + '</h2><p>' + info.texto + '</p></div></div>' +
      '<div class="centro"><button class="btn btn-principal" data-accion="cerrarModal">¡Entendido!</button></div>', true);
    Voz.decir(info.titulo + ". " + info.texto);
  }

  function abrirModal(html, cerrable, ancho) {
    if (Minijuegos.activo()) Minijuegos.detener();
    $(".modal-caja").classList.toggle("modal-ancho", !!ancho);
    $("#modal-contenido").innerHTML = html;
    $("#modal-cerrar").style.display = cerrable ? "" : "none";
    $("#modal").dataset.cerrable = cerrable ? "si" : "no";
    $("#modal").classList.remove("oculto");
  }
  function cerrarModal() { $("#modal").classList.add("oculto"); Voz.detener(); }

  /* =================================================================
     INGENIERA PAZ
     ================================================================= */
  let colaPaz = [];

  function decirPaz(titulo, texto) {
    colaPaz.push({ titulo: titulo, texto: texto });
    if ($("#paz").classList.contains("oculto")) siguientePaz();
    else actualizarBotonPaz();
  }
  function concepto(clave) {
    if (estado.conceptosVistos[clave]) return;
    const c = DATOS.conceptos[clave];
    if (!c) return;
    estado.conceptosVistos[clave] = true;
    decirPaz(c.titulo, c.texto);
  }
  let ultimoPaz = null;
  function siguientePaz() {
    const m = colaPaz.shift();
    if (!m) { $("#paz").classList.add("oculto"); Voz.detener(); return; }
    ultimoPaz = m;
    $("#paz-titulo").textContent = m.titulo;
    $("#paz-texto").textContent = m.texto;
    $("#paz").classList.remove("oculto");
    actualizarBotonPaz();
    Voz.decir(m.titulo + ". " + m.texto);     // Paz lo dice en voz alta (si la voz está activa)
  }
  function actualizarBotonPaz() {
    $("#paz-ok").textContent = colaPaz.length > 0 ? "Siguiente consejo" : "¡Entendido!";
  }

  function hayPistas() { return Motor.dificultad(estado).pistas; }
  function chipPista() { return '<span class="chip-pista">' + ic("estrella") + ' Paz recomienda</span>'; }

  /* =================================================================
     PANEL DE RECURSOS
     ================================================================= */
  function construirPanel() {
    $("#panel-recursos").innerHTML = RECURSOS.map(function (rec) {
      return '<div class="recurso" id="rec-' + rec.id + '">' +
        '<div class="recurso-cabeza"><span>' + ic(rec.icono) + ' <span class="nombre-largo">' + rec.nombre + '</span>' +
        '<span class="nombre-corto">' + (rec.corto || rec.nombre) + '</span></span>' + pq(rec.id) + '</div>' +
        '<div class="barra"><div class="barra-relleno"></div></div><div class="recurso-texto"></div></div>';
    }).join("");
  }

  function actualizarPanel() {
    $("#panel-recursos").classList.toggle("oculto", estado.fase === 0 || estado.fase === -2);
    if (estado.fase === 0 || estado.fase === -2) return null;
    const r = Motor.calcularRecursos(estado);
    let hayRojo = false;
    RECURSOS.forEach(function (rec) {
      const b = r.barras[rec.id];
      const caja = $("#rec-" + rec.id);
      caja.className = "recurso nivel-" + b.nivel;
      caja.querySelector(".barra-relleno").style.width = Math.max(3, b.fill * 100) + "%";
      caja.querySelector(".recurso-texto").textContent = b.texto;
      if (b.nivel === "rojo") hayRojo = true;
    });
    if (hayRojo && estado.fase >= 2) concepto("alertaRoja");
    return r;
  }

  /* =================================================================
     BARRA DE PASOS
     ================================================================= */
  function dibujarPasos() {
    document.body.classList.toggle("en-inicio", estado.fase === 0);
    document.body.classList.toggle("en-marte", estado.fase === -2);
    // Botón del centro de control (aparece una vez que empezó la misión)
    const centro = (estado.faseMax >= 1 || estado.fase === -1) ?
      '<button class="paso paso-centro' + (estado.fase === -1 ? " actual" : "") + '" data-accion="irHangar">' +
      '<span class="paso-num">' + ic("mapa") + '</span><span class="paso-nombre">Centro de control</span></button>' : "";
    $("#pasos").innerHTML = centro + FASES.map(function (f) {
      let clase = "paso";
      if (f.n === estado.fase) clase += " actual";
      else if (f.n <= estado.faseMax) clase += " hecho";
      return '<button class="' + clase + '" data-accion="irFase" data-fase="' + f.n + '"' + (puedeIrA(f.n) ? "" : " disabled") + '>' +
        '<span class="paso-num">' + ic(f.icono) + '</span><span class="paso-nombre">' + (f.n ? f.n + ". " : "") + f.nombre + '</span></button>';
    }).join("");
  }

  function puedeIrA(n) {
    if (n <= estado.fase) return true;
    if (n > estado.faseMax) return false;
    for (let k = 0; k < n; k++) if (!puedeAvanzar(k).ok) return false;
    return true;
  }

  function puedeAvanzar(fase) {
    if (fase === 0) {
      if (estado.vistaInicio === "rapida" && !estado.contrato) return { ok: false, motivo: "Elige un contrato para comenzar." };
      return { ok: true };
    }
    if (fase === 1) return estado.escenario ? { ok: true } : { ok: false, motivo: "Elige un encargo para continuar." };
    if (fase === 2) {
      const faltan = DATOS.componentes.filter(function (c) { return !estado.componentes[c.id]; }).map(function (c) { return c.nombre.toLowerCase(); });
      return faltan.length === 0 ? { ok: true } : { ok: false, motivo: "Te falta elegir: " + faltan.join(", ") + "." };
    }
    if (fase === 3) return estado.instrumentos.length > 0 ? { ok: true } : { ok: false, motivo: "Elige al menos un instrumento." };
    if (fase === 4) {
      const v = Motor.verificarLanzamiento(estado, Motor.calcularRecursos(estado));
      return v.ok ? { ok: true } : { ok: false, motivo: v.problemas[0] };
    }
    if (fase === 5) return estado.resultado ? { ok: true } : { ok: false, motivo: "Lanza la misión y espera a que termine." };
    return { ok: false, motivo: "" };
  }

  function actualizarNavegacion() {
    if (estado.fase === -2) {               // Varado en Marte: solo "Salir al menú"
      $(".navegacion").classList.remove("oculto");
      $("#btn-anterior").style.visibility = "visible"; $("#btn-anterior").innerHTML = ic("flechaIzq") + " Salir al menú";
      $("#btn-siguiente").style.visibility = "hidden"; $("#aviso-nav").textContent = "";
      return;
    }
    $("#btn-anterior").textContent = "Anterior";
    if (estado.fase === -1) {               // centro de control
      $(".navegacion").classList.remove("oculto");
      $("#btn-anterior").style.visibility = "visible";
      const sig = $("#btn-siguiente"), prox = proximaFase();
      sig.style.visibility = "visible"; sig.disabled = false;
      sig.innerHTML = "Ir a: " + FASES[prox].nombre + " " + ic("flecha");
      $("#aviso-nav").textContent = "";
      return;
    }
    const enMenu = estado.fase === 0 && estado.vistaInicio === "menu";
    $(".navegacion").classList.toggle("oculto", enMenu);
    $("#btn-anterior").style.visibility = estado.fase > 0 || estado.vistaInicio !== "menu" ? "visible" : "hidden";
    const sig = $("#btn-siguiente");
    if (estado.fase === 6 || (estado.fase === 0 && estado.vistaInicio === "modos")) { sig.style.visibility = "hidden"; $("#aviso-nav").textContent = ""; return; }
    sig.style.visibility = "visible";
    const p = puedeAvanzar(estado.fase);
    sig.disabled = !p.ok;
    sig.innerHTML = ({ 0: "Comenzar misión", 4: "Ir al lanzamiento", 5: "Ver informe" }[estado.fase] || "Siguiente") + " " + ic("flecha");
    $("#aviso-nav").textContent = p.ok ? "" : p.motivo;
  }

  /* =================================================================
     PANTALLAS
     ================================================================= */
  function titulo(n, texto) {
    const f = FASES[n];
    return '<div class="titulo-fase"><span class="titulo-icono">' + ic(f.icono) + '</span><div>' +
      '<p class="num-fase">Fase ' + n + ' de 6</p><h2>' + f.nombre + '</h2></div></div>' +
      '<p class="intro">' + texto + '</p>' + bannerTurno(n);
  }
  function stat(icono, valor, clave) {
    return '<li><span>' + (icono ? ic(icono) : "") + ' ' + valor + '</span>' + (clave ? pq(clave) : "") + '</li>';
  }

  // Logo de SPACE SIMULATOR (dibujado en SVG, sin marcas de ninguna agencia)
  const LOGO =
    '<svg class="logo-ss" viewBox="0 0 640 200" role="img" aria-label="SPACE SIMULATOR">' +
    '<defs><linearGradient id="lg-ss" x1="0" x2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="0.5" stop-color="#ffb703"/><stop offset="1" stop-color="#ff7b00"/></linearGradient></defs>' +
    '<ellipse cx="320" cy="100" rx="300" ry="62" fill="none" stroke="#4cc9f0" stroke-width="2.5" stroke-dasharray="6 9" opacity="0.7" transform="rotate(-6 320 100)"/>' +
    '<circle class="logo-satelite" r="7" fill="#ffd166"><animateMotion dur="9s" repeatCount="indefinite" path="M20,100 a300,62 0 1,0 600,0 a300,62 0 1,0 -600,0"/></circle>' +
    '<text x="320" y="92" text-anchor="middle" font-family="Trebuchet MS, Segoe UI, sans-serif" font-weight="800" font-size="74" letter-spacing="10" fill="url(#lg-ss)">SPACE</text>' +
    '<text x="320" y="150" text-anchor="middle" font-family="Trebuchet MS, Segoe UI, sans-serif" font-weight="700" font-size="40" letter-spacing="14" fill="#eef2ff">SIMULATOR</text>' +
    '</svg>';

  /* ---------- INICIO ---------- */
  function pantallaInicio() {
    if (estado.vistaInicio === "menu") return pantallaMenu();
    if (estado.vistaInicio === "modos") return pantallaModos();
    return pantallaPreparar();
  }

  // "Elige cómo jugar": tarjetas con cada modo de juego
  function pantallaModos() {
    let html = '<div class="titulo-fase"><span class="titulo-icono">' + ic("play") + '</span><div>' +
      '<p class="num-fase">Formas de jugar</p><h2>Elige cómo jugar</h2></div></div>' +
      '<p class="intro">Cada modo es una forma distinta de vivir la misión.</p>' +
      '<div class="grid-tarjetas modos">';
    // Solo se muestran los modos disponibles (disponible: true en js/datos/contratos.js)
    DATOS.modos.filter(function (m) { return m.disponible; }).forEach(function (m) {
      html += '<div class="tarjeta elegible modo-tarjeta" role="button" tabindex="0" data-accion="elegirModoJuego" data-id="' + m.id + '">' +
        '<div class="icono-grande-svg">' + ic(m.icono) + '</div><h3>' + m.nombre + '</h3><p>' + m.descripcion + '</p>' +
        '<span class="etiqueta-chip">' + ic("reloj") + ' ' + m.duracion + '</span></div>';
    });
    return html + '</div>';
  }

  // Tarjetas de contratos (Misión rápida)
  function tarjetasContratos() {
    const dif = Motor.dificultad(estado);
    return '<h3 class="subtitulo">Elige un contrato</h3><div class="grid-tarjetas">' + DATOS.contratos.filter(function (c) { return !c.historia; }).map(function (c) {
      const esc = DATOS.escenarios.find(function (e) { return e.id === c.escenario; });
      const sel = estado.contrato === c.id;
      return '<div class="tarjeta elegible con-foto contrato' + (sel ? " seleccionada" : "") + '" role="button" tabindex="0" data-accion="elegirContrato" data-id="' + c.id + '">' +
        foto(esc.imagen) + '<small class="inspirado">' + esc.destino + '</small><h3>' + c.nombre + '</h3><p>' + c.encargo + '</p>' +
        '<ul class="objetivos">' + c.objetivos.map(function (o) { return '<li>' + ic("objetivo") + ' ' + Modos.textoObjetivo(c, o) + '</li>'; }).join("") + '</ul>' +
        '<ul class="stats">' + stat("moneda", fmt(Math.round(c.presupuesto * dif.multPresupuesto), 0) + " M USD", null) + stat("reloj", c.minutos + " minutos", null) + '</ul>' +
        '<span class="etiqueta-chip">' + (sel ? ic("check") + " Contrato aceptado" : "Tocar para aceptar") + '</span></div>';
    }).join("") + '</div>';
  }

  function pantallaMenu() {
    return '<div class="inicio-hero">' +
      '<div class="tierra-escena" aria-hidden="true"><div class="tierra-brillo"></div><img class="tierra-foto" src="assets/imagenes/fondo-tierra.jpg" alt=""></div>' +
      LOGO +
      '<p class="lema">Diseña, lanza y dirige una misión espacial real. Cada decisión de ingeniería cambia todas las demás.</p>' +
      '<div class="menu-principal">' +
        '<button class="btn-menu principal" data-accion="menuModos">' + ic("play") + '<span>Jugar</span></button>' +
        '<button class="btn-menu" data-accion="menuEquipo">' + ic("grupo") + '<span>Modo equipo</span></button>' +
        '<button class="btn-menu" data-accion="opciones">' + ic("engranaje") + '<span>Opciones</span></button>' +
        '<button class="btn-menu" data-accion="creditos">' + ic("info") + '<span>Créditos</span></button>' +
      '</div>' +
      '<div class="menu-secundario">' +
        '<button class="btn btn-mini" data-accion="practicar">' + ic("trofeo") + ' Practicar desafíos</button>' +
        '<button class="btn btn-mini" data-accion="fuentes">' + ic("libro") + ' Fuentes de los datos</button>' +
        '<a class="btn btn-mini" href="guia-docente.html" target="_blank" rel="noopener">' + ic("documento") + ' Guía para docentes</a>' +
      '</div>' +
      tablaRecords({ pestanas: true }) +
      '<p class="aviso-legal">Juego educativo para el desafío NASA Space Apps Challenge. No es un producto oficial de la NASA.</p>' +
      '</div>';
  }

  /* ---------- MODO HISTORIA (datos/historia.js) ---------- */
  const CLAVE_HISTORIA = "spaceSimulator.historia";
  function leerHistoria() { const h = leerJSON(CLAVE_HISTORIA, null); return h && h.estrellas ? h : { nombre: "", estrellas: {} }; }
  function guardarHistoria(h) { try { localStorage.setItem(CLAVE_HISTORIA, JSON.stringify(h)); } catch (e) { /* modo privado */ } }
  function capitulo(n) { return DATOS.historia.capitulos.find(function (c) { return c.n === n; }); }
  function desbloqueado(n, h) { return n === 1 || (h.estrellas[n - 1] || 0) >= 2; }
  function textoHistoria(t) { return String(t).replace(/\{nombre\}/g, seguro(estado.nombreHistoria || leerHistoria().nombre || "astronauta")); }

  function pantallaHistoria() {
    const h = leerHistoria();
    if (!estado.nombreHistoria && h.nombre) estado.nombreHistoria = h.nombre;
    const total = Object.keys(h.estrellas).reduce(function (t, k) { return t + h.estrellas[k]; }, 0);
    let html = '<div class="tarjeta historia-cabeza"><div><h3>' + ic("libro") + ' ' + DATOS.historia.titulo + '</h3><p>' + textoHistoria(DATOS.historia.resumen) + '</p>' +
      '<label class="etiqueta-campo" for="nombre-historia">Tu nombre de astronauta</label>' +
      '<input id="nombre-historia" class="input-nombre" maxlength="10" placeholder="Ej.: Sofía" value="' + seguro(estado.nombreHistoria || "") + '"></div>' +
      '<div class="historia-estrellas"><b>' + total + ' / ' + DATOS.historia.capitulos.length * 3 + '</b>' + ic("estrella") + '<small>estrellas</small></div></div>';
    html += '<h3 class="subtitulo">Capítulos</h3><div class="capitulos">';
    DATOS.historia.capitulos.forEach(function (cap) {
      const abierto = desbloqueado(cap.n, h), est = h.estrellas[cap.n] || 0;
      const c = cap.contrato ? Modos.contrato(cap.contrato) : null;
      const esc = c ? DATOS.escenarios.find(function (e) { return e.id === c.escenario; }) : null;
      const metas = c ? stat("moneda", c.presupuesto + " M USD", null) + stat("reloj", c.minutos + " min para lanzar", null) + stat("objetivo", c.objetivos.length + 1 + " objetivos", null)
        : stat("sol", "Sobrevivir " + (DATOS.supervivencia.solesRescate[cap.dificultad] || 30) + " soles", null) + stat("casco", "Camina por Marte en 3D", null);
      html += '<div class="tarjeta capitulo' + (abierto ? "" : " bloqueada") + '">' +
        '<div class="capitulo-num">' + ic(abierto ? cap.icono : "candado") + '<b>' + cap.n + '</b></div>' +
        '<div class="capitulo-texto"><h3>' + cap.titulo + '</h3><small class="inspirado">' + (esc ? esc.destino : "Cráter Jezero, Marte") + '</small>' +
        '<ul class="stats en-fila">' + metas + '</ul>' + (est ? '<div>' + estrellasHtml(est) + '</div>' : '') + '</div>' +
        (abierto ? '<button class="btn btn-principal" data-accion="jugarCapitulo" data-n="' + cap.n + '">' + ic("play") + (est ? ' Jugar de nuevo' : ' Jugar') + '</button>'
          : '<span class="etiqueta-chip">' + ic("candado") + ' Completa el capítulo ' + (cap.n - 1) + '</span>') + '</div>';
    });
    html += '</div>' + ((h.estrellas[5] || 0) >= 2 ? '<div class="centro"><button class="btn btn-secundario" data-accion="historiaEpilogo">' + ic("trofeo") + ' Ver el epílogo</button></div>' : '') +
      '<p class="centro"><small>El progreso se guarda en este navegador. <button class="btn btn-mini" data-accion="historiaBorrar">Empezar la historia de cero</button></small></p>';
    return html;
  }

  function leerNombreHistoria() {
    const campo = $("#nombre-historia");
    if (campo) estado.nombreHistoria = campo.value.trim();
    const h = leerHistoria(); h.nombre = estado.nombreHistoria || h.nombre; guardarHistoria(h);
  }

  // Ventana con la historia del capítulo antes de empezar
  function introCapitulo(n) {
    leerNombreHistoria();
    const cap = capitulo(n), c = cap.contrato ? Modos.contrato(cap.contrato) : null;
    const metas = c ? '<ul class="objetivos grandes">' + c.objetivos.map(function (o) { return '<li>' + ic("objetivo") + ' ' + Modos.textoObjetivo(c, o) + '</li>'; }).join("") +
        '<li>' + ic("reloj") + ' Tienes <b>' + c.minutos + ' minutos</b> para lanzar y <b>' + c.presupuesto + ' millones de dólares</b></li></ul>'
      : '<ul class="objetivos grandes"><li>' + ic("sol") + ' Sobrevive <b>' + (DATOS.supervivencia.solesRescate[cap.dificultad] || 30) + ' soles</b> hasta que llegue la nave de rescate</li>' +
        '<li>' + ic("cohete") + ' Llega a la zona de aterrizaje el día del rescate</li></ul>';
    abrirModal('<div class="evento"><p class="etiqueta">' + DATOS.historia.titulo + ' · Capítulo ' + n + '</p><h2>' + cap.titulo + '</h2>' +
      '<p class="historia-texto">' + textoHistoria(cap.intro) + '</p>' +
      '<div class="paz-dice"><div class="mini-avatar">' + avatarPaz() + '</div><p><b>Ingeniera Paz:</b> ' + textoHistoria(cap.leccion) + '</p></div>' +
      '<h3>' + ic("objetivo") + ' Tu misión</h3>' + metas +
      '<div class="centro"><button class="btn btn-principal btn-gigante" data-accion="empezarCapitulo" data-n="' + n + '">' + ic("play") + ' ¡Empezar!</button> <button class="btn btn-secundario" data-accion="cerrarModal">Volver</button></div></div>', true);
    Voz.decir(cap.titulo + ". " + textoHistoria(cap.intro));
  }

  function empezarCapitulo(n) {
    const cap = capitulo(n);
    cerrarModal();
    estado.historia = { capitulo: n };
    if (cap.tipo === "marte") {
      estado.nombreMarte = estado.nombreHistoria || "";
      estado.dificultad = cap.dificultad || estado.dificultad;
      estado.modoJuego = "marte";
      estado.vistaInicio = "marte";
      irMarte(true);
      return;
    }
    estado.vistaInicio = "rapida";
    estado.contrato = cap.contrato;
    estado.escenario = null; estado.instrumentos = []; estado.orbita = null; estado.cohete = null; estado.trayectoria = null; estado.resultado = null; estado.faseMax = 0;
    DATOS.componentes.forEach(function (c) { estado.componentes[c.id] = null; });
    comenzar();
  }

  // Al terminar un capítulo: ¿pasó? (todos los objetivos menos uno) y estrellas (todos = 3)
  function resultadoCapitulo(n, cumplidos, total, completo) {
    const pasa = cumplidos >= total - 1, est = completo ? 3 : (pasa ? 2 : 0);
    const h = leerHistoria();
    h.estrellas[n] = Math.max(h.estrellas[n] || 0, est);
    if (estado.nombreHistoria) h.nombre = estado.nombreHistoria;
    guardarHistoria(h);
    return { pasa: pasa, estrellas: est };
  }

  function tarjetaCapitulo(rc) {
    const n = estado.historia.capitulo, cap = capitulo(n), hay = capitulo(n + 1);
    return '<div class="tarjeta capitulo-fin ' + (rc.pasa ? "completo" : "") + '"><h3>' + ic("libro") + ' Capítulo ' + n + ': ' + cap.titulo + ' · ' + (rc.pasa ? "¡superado!" : "no superado") + '</h3>' +
      (rc.pasa ? '<div>' + estrellasHtml(rc.estrellas) + '</div><p class="historia-texto">' + textoHistoria(cap.final) + '</p>' : '<p>Para pasar el capítulo cumple todos los objetivos menos uno, como máximo. Lee el informe: ahí está la pista de qué cambiar.</p>') +
      '<p><b>' + ic("idea") + ' Lo que aprendiste:</b> ' + textoHistoria(cap.leccion) + '</p><div class="centro">' +
      (rc.pasa && hay ? '<button class="btn btn-principal" data-accion="jugarCapitulo" data-n="' + (n + 1) + '">' + ic("play") + ' Capítulo ' + (n + 1) + ': ' + hay.titulo + '</button> ' : '') +
      (!rc.pasa ? '<button class="btn btn-principal" data-accion="jugarCapitulo" data-n="' + n + '">' + ic("reiniciar") + ' Reintentar el capítulo</button> ' : '') +
      (rc.pasa && !hay ? '<button class="btn btn-principal" data-accion="historiaEpilogo">' + ic("trofeo") + ' Ver el epílogo</button> ' : '') +
      '<button class="btn btn-secundario" data-accion="historiaVolver">Volver a los capítulos</button></div></div>';
  }

  function epilogo() {
    const h = leerHistoria(), total = Object.keys(h.estrellas).reduce(function (t, k) { return t + h.estrellas[k]; }, 0);
    abrirModal('<div class="evento"><div class="icono-grande-svg tono-bien">' + ic("medalla") + '</div><p class="etiqueta">' + DATOS.historia.titulo + ' · Epílogo</p>' +
      '<h2>' + textoHistoria("{nombre}, astronauta") + '</h2><p class="historia-texto">' + textoHistoria(DATOS.historia.epilogo) + '</p>' +
      '<div class="insignia"><div class="insignia-logo">' + ic("planeta") + '</div><div><b>' + textoHistoria("{nombre}") + '</b><small>Completó «' + DATOS.historia.titulo + '» · ' + total + ' de ' + DATOS.historia.capitulos.length * 3 + ' estrellas · ' + new Date().toLocaleDateString("es-CL") + '</small></div></div>' +
      '<div class="centro"><button class="btn btn-principal" data-accion="historiaVolver">Volver a los capítulos</button></div></div>', true);
    Voz.decir(textoHistoria(DATOS.historia.epilogo));
  }

  function volverHistoria() {
    cerrarModal();
    Modos.detenerReloj();
    Supervivencia.detener();
    estado.historia = null; estado.resultado = null; estado.contrato = null; estado.modoJuego = "completa";
    irAFase(0);
    estado.vistaInicio = "historia";
    dibujarFase();
  }

  function pantallaPreparar() {
    const vista = estado.vistaInicio;
    const equipo = vista === "equipo";
    const m = Modos.modo(vista === "jugar" ? "completa" : vista);
    let html = '<div class="titulo-fase"><span class="titulo-icono">' + ic(m ? m.icono : "persona") + '</span><div>' +
      '<p class="num-fase">Preparar la misión</p><h2>' + (m ? m.nombre : "Jugar") + '</h2></div></div>';
    if (vista === "rapida") {
      html += '<p class="intro">Elige un contrato. Tendrás un reloj para preparar y lanzar la misión: si lanzas antes de que se acabe, ganas puntos extra.</p>' + tarjetasContratos();
    } else if (vista === "libre") {
      html += '<p class="intro">Sin límite de presupuesto ni de tiempo: prueba cualquier diseño, aunque sea carísimo. Los cohetes siguen teniendo un peso máximo (¡la física no se negocia!). En este modo no hay ranking.</p>';
    } else if (vista === "marte") {
      return html + pantallaPrepararMarte();
    } else if (vista === "historia") {
      return html + pantallaHistoria();
    }

    if (equipo) {
      html += '<p class="intro">Cada persona tiene un rol y una meta propia. ¡Deberán ponerse de acuerdo!</p>' +
        '<div class="tarjeta"><h3>¿Cuántas personas?</h3><div class="botones-numero">';
      [2, 3, 4].forEach(function (n) {
        html += '<button class="btn btn-mini' + (estado.numJugadores === n ? " activa" : "") + '" data-accion="numJugadores" data-n="' + n + '">' + n + '</button>';
      });
      html += '</div><div class="grid-jugadores">';
      jugadores().forEach(function (j, i) {
        html += '<div class="jugador"><label for="nombre-' + i + '">Nombre del jugador ' + (i + 1) + '</label>' +
          '<input id="nombre-' + i + '" class="input-nombre" data-i="' + i + '" maxlength="20" placeholder="Jugador ' + (i + 1) + '" value="' + seguro(estado.nombres[i]) + '">' +
          '<div class="roles-jugador">' + j.roles.map(function (id) { return chipRol(id, true); }).join("") + '</div>' +
          '<small>' + j.roles.map(function (id) { return "Meta: " + rol(id).meta; }).join("<br>") + '</small></div>';
      });
      html += '</div></div>';
    } else if (vista === "jugar") {
      html += '<p class="intro">Tú tomarás todas las decisiones de la misión. Elige qué tan difícil será.</p>';
    }

    html += '<h3 class="subtitulo">Dificultad</h3><div class="grid-tarjetas tres">';
    DATOS.dificultades.forEach(function (d) {
      const sel = estado.dificultad === d.id;
      html += '<div class="tarjeta elegible' + (sel ? " seleccionada" : "") + '" role="button" tabindex="0" data-accion="elegirDificultad" data-id="' + d.id + '">' +
        '<div class="icono-grande-svg">' + ic(d.icono) + '</div><h3>' + d.nombre + '</h3><p>' + d.descripcion + '</p>' +
        '<ul class="stats">' + stat("moneda", "Presupuesto ×" + fmt(d.multPresupuesto, 2), "presupuesto") + stat("dado", d.eventosMin + " a " + d.eventosMax + " imprevistos", null) +
        stat("trofeo", "Puntos ×" + fmt(d.multPuntaje, 1), "dificultad") + '</ul></div>';
    });
    const listo = puedeAvanzar(0);
    html += '</div><div class="centro"><button class="btn btn-principal btn-gigante" data-accion="comenzar"' + (listo.ok ? "" : " disabled") + '>' + ic("cohete") + ' Comenzar misión</button>' +
      (listo.ok ? "" : '<p class="aviso-nav">' + listo.motivo + '</p>') + '</div>';
    return html;
  }

  /* ---------- VARADO EN MARTE (supervivencia.js + datos/supervivencia.js) ---------- */
  function pantallaPrepararMarte() {
    const D = DATOS.supervivencia;
    let html = '<div class="tarjeta marte-intro">' + foto("assets/imagenes/escenario-marte.jpg", "foto-tarjeta foto-alta") +
      '<div><h3>' + ic("alerta") + ' ¿Qué pasó?</h3><p>' + D.historia.intro + '</p>' +
      '<ul class="stats">' + stat("burbuja", "Respiras " + D.consumoPorSol.oxigeno + " kg de oxígeno por sol", "svOxigeno") + stat("gota", "Usas " + D.consumoPorSol.agua + " litros de agua por sol", "svAgua") +
      stat("hoja", "Comes 1 ración por sol (unas 2.500 kcal)", "svComida") + stat("sol", "Un sol dura 24 h 39 min (en el juego, " + D.segundosPorSol + " segundos)", null) + '</ul>' +
      '<label class="etiqueta-campo" for="nombre-marte">Tu nombre de astronauta (aparece en el traje)</label>' +
      '<input id="nombre-marte" class="input-nombre" maxlength="10" placeholder="Ej.: Sofía" value="' + seguro(estado.nombreMarte || "") + '"></div></div>';
    html += '<h3 class="subtitulo">Dificultad</h3><div class="grid-tarjetas tres">';
    DATOS.dificultades.forEach(function (d) {
      const sel = estado.dificultad === d.id;
      html += '<div class="tarjeta elegible' + (sel ? " seleccionada" : "") + '" role="button" tabindex="0" data-accion="elegirDificultad" data-id="' + d.id + '">' +
        '<div class="icono-grande-svg">' + ic(d.icono) + '</div><h3>' + d.nombre + '</h3>' +
        '<ul class="stats">' + stat("cohete", "El rescate llega el sol " + (D.solesRescate[d.id] || 30), null) + '</ul></div>';
    });
    html += '</div><div class="centro"><button class="btn btn-principal btn-gigante" data-accion="comenzar">' + ic("casco") + ' Salir a Marte</button></div>';
    return html;
  }

  function irMarte(nueva) {
    if (estado.fase === 5) Simulacion.detener();
    estado.fase = -2;
    colaPaz = [];
    $("#paz").classList.add("oculto");
    estado.marteNueva = nueva;
    dibujarFase();
    ponerMusica();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (nueva) { decirPaz("Varado en Marte", DATOS.supervivencia.historia.intro); decirPaz("Ingeniera Paz", DATOS.supervivencia.historia.paz); }
  }

  // Imprevisto en Marte: una alerta o una decisión (el tiempo se detiene mientras está abierta)
  let alElegirMarte = null, alTerminarDesafioMarte = null, desafioMarte = null;
  function imprevistoMarte(ev, alElegir) {
    alElegirMarte = alElegir;
    let html = '<div class="evento">' + foto(ev.imagen, "foto-evento") + '<p class="etiqueta">Sol ' + Supervivencia.estado().sol + ' · ' + Supervivencia.textoHora(Supervivencia.estado().hora) + ' · Imprevisto</p>' +
      '<h2>' + ev.titulo + '</h2><p>' + ev.texto + '</p>' +
      '<div class="paz-dice"><div class="mini-avatar">' + avatarPaz() + '</div><p><b>Ingeniera Paz:</b> ' + ev.paz + '</p></div>';
    if (alElegir && ev.opciones) {
      html += '<div class="opciones-evento">' + ev.opciones.map(function (op, i) {
        return '<button class="opcion-evento" data-accion="decidirMarte" data-i="' + i + '"><strong>' + op.texto + '</strong><small>' + op.explicacion + '</small></button>';
      }).join("") + '</div>';
    } else html += '<div class="centro"><button class="btn btn-principal" data-accion="decidirMarte" data-i="-1">Entendido</button></div>';
    html += (ev.fuentes ? '<p class="centro">' + fuentesMini(ev.fuentes) + '</p>' : '') + '</div>';
    abrirModal(html, false, true);
    Voz.decir(ev.titulo + " " + ev.paz);
  }
  function decidirMarte(i) {
    cerrarModal();
    const cb = alElegirMarte; alElegirMarte = null;
    if (cb && i >= 0) cb(i);
  }

  // Desafío (minijuego) en Marte: la "nave" que usa el minijuego es la base, con piezas avanzadas
  function recursosMarte() {
    const e = Object.assign({}, estado, { escenario: "marte", orbita: "baja", cohete: null, trayectoria: null, componentes: {}, instrumentos: Motor.escenario({ escenario: "marte" }).instrumentosRecomendados.slice() });
    DATOS.componentes.forEach(function (c) { e.componentes[c.id] = c.id === "propulsion" ? "basica" : "avanzada"; });
    return Motor.calcularRecursos(e);
  }
  function desafioMarteIntro(ev, alTerminar) {
    desafioMarte = ev; alTerminarDesafioMarte = alTerminar;
    const r = recursosMarte(), inf = Minijuegos.influencia(ev.minijuego, r), info = Minijuegos.info(ev.minijuego);
    abrirModal('<div class="evento">' + foto(ev.imagen, "foto-evento") + '<p class="etiqueta">Sol ' + Supervivencia.estado().sol + ' · Desafío</p>' +
      '<h2>' + ev.titulo + '</h2><p>' + ev.texto + '</p>' +
      '<div class="paz-dice"><div class="mini-avatar">' + avatarPaz() + '</div><p><b>Ingeniera Paz:</b> ' + ev.paz + '</p></div>' +
      '<div class="mj-influencia"><ul>' + inf.lineas.map(function (l) { return "<li>" + l + "</li>"; }).join("") + '</ul><p><small>' + ic(info.icono) + ' ' + info.controles + '</small></p></div>' +
      '<div class="opciones-evento">' +
        '<button class="opcion-evento destacada" data-accion="jugarMarte"><strong>' + ic("play") + ' Jugar el desafío</strong><small>Tu puntaje decide qué pasa.</small></button>' +
        '<button class="opcion-evento" data-accion="autoMarte"><strong>' + ic("satelite") + ' Que lo haga el computador</strong><small>Lo resuelve a medias (resultado regular).</small></button>' +
      '</div></div>', false, true);
    Voz.decir(ev.titulo + " " + ev.paz);
  }
  function desafioMarteJugar() {
    Voz.detener();
    abrirModal('<div id="mj-contenedor"></div>', false, true);
    Minijuegos.jugar(desafioMarte.minijuego, $("#mj-contenedor"), recursosMarte(), function (res) { desafioMarteResultado(res.puntaje, res.detalle); });
  }
  function desafioMarteResultado(puntaje, detalle) {
    const ev = desafioMarte, nivel = Minijuegos.nivel(puntaje), pct = Math.round(puntaje * 100);
    const titulos = { bien: "¡Excelente!", regular: "Bien, pero con costo", mal: "Fue muy difícil" };
    Sonido.efecto(nivel === "bien" ? "exito" : (nivel === "regular" ? "exitoCorto" : "falla"));
    abrirModal('<div class="evento"><div class="icono-grande-svg tono-' + (nivel === "mal" ? "mal" : "bien") + '">' + ic(nivel === "bien" ? "trofeo" : (nivel === "mal" ? "alerta" : "check")) + '</div>' +
      '<h2>' + titulos[nivel] + '</h2><div class="mj-puntaje"><div class="barra grande"><div class="barra-relleno relleno-' + (nivel === "bien" ? "verde" : (nivel === "regular" ? "amarillo" : "rojo")) + '" style="width:' + Math.max(3, pct) + '%"></div></div><b>' + pct + '%</b></div>' +
      '<p>' + detalle + '</p><p class="resultado-mj">' + ev.resultados[nivel].mensaje + '</p>' +
      '<div class="centro"><button class="btn btn-principal" data-accion="volverMarte" data-nivel="' + nivel + '" data-pct="' + pct + '">Volver a Marte ' + ic("play") + '</button></div></div>', false, true);
    Voz.decir(titulos[nivel] + ". " + ev.resultados[nivel].mensaje);
  }
  function volverMarte(nivel, pct) {
    cerrarModal();
    const cb = alTerminarDesafioMarte; alTerminarDesafioMarte = null; desafioMarte = null;
    if (cb) cb(nivel, pct);
  }

  function salirMarte() {
    Supervivencia.detener();
    estado.modoJuego = "completa";
    irAFase(0);
    estado.vistaInicio = "modos";
    dibujarFase();
  }

  function pantallaMarte() {
    return '<div class="titulo-fase"><span class="titulo-icono">' + ic("casco") + '</span><div>' +
      '<p class="num-fase">Varado en Marte · cráter Jezero</p><h2>Sobrevive hasta el rescate</h2></div></div>' +
      '<div class="sv-contenedor" id="sv"></div>';
  }

  function guardarRecordMarte() {
    const res = estado.resultadoMarte;
    if (!res || res.guardado) return;
    const nombre = ($("#nombre-record-marte").value || "").trim() || estado.nombreMarte || "Anónimo";
    const lista = leerRecords();
    lista.push({ nombre: nombre, escenario: "marte", dificultad: res.dificultad, modo: "marte", puntos: res.puntos, estrellas: res.estrellas,
      sol: res.sol, ganaste: res.ganaste, fecha: new Date().toLocaleDateString("es-CL") });
    lista.sort(function (a, b) { return b.puntos - a.puntos; });
    try { localStorage.setItem(CLAVE_RECORDS, JSON.stringify(lista.slice(0, 100))); res.guardado = true; } catch (e) { decirPaz("No se pudo guardar", "Este navegador no permite guardar récords."); return; }
    $("#record-marte").innerHTML = '<p>' + ic("check") + ' ¡Récord guardado!</p>' + tablaRecords({ modo: "marte", dificultad: res.dificultad, titulo: "Sobrevivientes de Marte" });
  }

  function terminarMarte(res) {
    estado.resultadoMarte = res;
    const titulo = res.ganaste ? "¡Rescate logrado!" : "La misión terminó";
    // Modo historia: el capítulo se supera si te rescatan
    let capituloHtml = "";
    if (estado.historia) {
      const h = leerHistoria(), n = estado.historia.capitulo;
      if (res.ganaste) { h.estrellas[n] = Math.max(h.estrellas[n] || 0, res.estrellas); guardarHistoria(h); }
      capituloHtml = tarjetaCapitulo({ pasa: res.ganaste, estrellas: res.estrellas });
    }
    abrirModal('<div class="evento"><div class="icono-grande-svg ' + (res.ganaste ? "tono-bien" : "tono-mal") + '">' + ic(res.ganaste ? "trofeo" : "alerta") + '</div>' +
      '<h2>' + titulo + '</h2><p>' + res.causa + '</p>' + capituloHtml +
      '<div class="grid-cifras tres">' +
        '<div class="cifra"><span class="cifra-etiqueta">' + ic("sol") + ' Soles</span><span class="cifra-valor">' + res.sol + '</span><small>de ' + res.rescate + ' hasta el rescate</small></div>' +
        '<div class="cifra"><span class="cifra-etiqueta">' + ic("corazon") + ' Salud final</span><span class="cifra-valor">' + res.salud + '%</span><small>' + fmt(res.radiacion, 1) + ' mSv de radiación</small></div>' +
        '<div class="cifra"><span class="cifra-etiqueta">' + ic("trofeo") + ' Puntos</span><span class="cifra-valor">' + res.puntos + '</span><small>' + res.datos + ' datos de Marte aprendidos</small></div></div>' +
      '<ul class="stats en-fila">' + stat("hoja", res.cosechas + " cosecha(s)", null) + stat("gota", res.viajesHielo + " viaje(s) por hielo", null) + stat("sol", res.limpiezas + " limpieza(s) de paneles", null) +
        stat("casco", fmt(res.horasAfuera, 0) + " horas afuera", null) + (res.desafios ? stat("trofeo", "Desafíos: " + res.desafios + "% de promedio", null) : "") + '</ul>' +
      '<div class="estrellas centro">' + estrellasHtml(res.estrellas) + '</div>' +
      (res.aprendido.length ? '<div class="tarjeta"><h3>' + ic("idea") + ' Lo que aprendiste de Marte</h3><ul class="lista-aprendido">' +
        res.aprendido.map(function (d) { return '<li><b>' + d.titulo + ':</b> ' + d.texto + ' ' + fuentesMini(d.fuentes) + '</li>'; }).join("") + '</ul></div>' : '') +
      '<div class="tarjeta" id="record-marte"><h3>' + ic("medalla") + ' Guardar en el ranking</h3><div class="fila-record"><input id="nombre-record-marte" class="input-nombre" maxlength="24" placeholder="Tu nombre" value="' + seguro(estado.nombreMarte || "") + '">' +
        '<button class="btn btn-principal" data-accion="guardarRecordMarte">Guardar</button></div>' + tablaRecords({ modo: "marte", dificultad: res.dificultad, titulo: "Sobrevivientes de Marte" }) + '</div>' +
      '<div class="centro"><button class="btn btn-principal" data-accion="marteOtraVez">' + ic("reiniciar") + ' Jugar otra vez</button> <button class="btn btn-secundario" data-accion="marteSalir">Salir al menú</button></div></div>', false, true);
    Voz.decir(titulo + ". " + res.causa);
  }

  // Transición suave del inicio al centro de control
  function comenzar() {
    if (!puedeAvanzar(0).ok) return;
    // Preparar el modo elegido
    const vista = estado.vistaInicio;
    if (vista === "marte") {
      const campo = $("#nombre-marte");
      estado.nombreMarte = (campo && campo.value.trim()) || "";
      estado.modoJuego = "marte";
      irMarte(true);
      return;
    }
    estado.modoJuego = vista === "rapida" ? "rapida" : (vista === "libre" ? "libre" : "completa");
    estado.modo = vista === "equipo" ? "equipo" : "individual";
    estado.resultado = null; estado.lanzamiento = null;
    Modos.detenerReloj();
    if (estado.modoJuego === "rapida") {
      const c = Modos.contrato(estado.contrato);
      if (estado.escenario !== c.escenario) { estado.escenario = c.escenario; estado.instrumentos = []; estado.orbita = null; estado.cohete = null; estado.trayectoria = null; }
      Modos.iniciarReloj(c.minutos, function () {
        if (estado.lanzamiento) return;                 // ya lanzó a tiempo
        Sonido.efecto("alarma");
        decirPaz("¡Se acabó el tiempo!", "El reloj llegó a cero. Puedes terminar la misión igual, pero perdiste el bono por lanzar a tiempo.");
      });
    } else {
      estado.contrato = null;
    }
    const pantalla = $("#pantalla");
    pantalla.classList.add("saliendo");
    setTimeout(function () {
      pantalla.classList.remove("saliendo");
      irHangar();
    }, opciones.calidadBaja ? 50 : 650);
  }

  /* ---------- CENTRO DE CONTROL ---------- */
  // La primera fase que falta completar (para el botón "Ir a")
  function proximaFase() {
    for (let k = 1; k <= 4; k++) if (!puedeAvanzar(k).ok) return k;
    return estado.resultado ? 6 : 5;
  }
  // A qué fase lleva cada estación (Comunicaciones lleva al informe si ya terminó la misión)
  function faseDeEstacion(e) { return e.id === "comunicaciones" && estado.resultado ? 6 : e.fase; }
  function estadoEstacion(e) {
    const destino = faseDeEstacion(e);
    let faltante = null;
    for (let k = 1; k < Math.min(destino, 5); k++) if (!puedeAvanzar(k).ok) { faltante = k; break; }
    const hecha = destino <= 4 && puedeAvanzar(destino).ok;
    let texto;
    if (faltante) texto = "Primero completa la fase " + faltante + ": " + FASES[faltante].nombre;
    else if (destino === 6) texto = "Leer el informe de la misión";
    else if (hecha) texto = "Lista · puedes revisarla";
    else texto = "Fase " + destino + ": " + FASES[destino].nombre;
    return { bloqueada: !!faltante, hecha: hecha, texto: texto, destino: destino, faltante: faltante };
  }
  function entrarEstacion(e) {
    const info = estadoEstacion(e);
    if (info.bloqueada) {
      Sonido.efecto("error");
      decirPaz("Estación bloqueada", "Antes de usar " + e.nombre + " hay que completar la fase " + info.faltante + ": " + FASES[info.faltante].nombre + ".");
      return;
    }
    Sonido.efecto("seleccionar");
    irAFase(info.destino);
  }

  function irHangar() {
    if (estado.fase === 5) Simulacion.detener();
    estado.fase = -1;
    estado.faseMax = Math.max(estado.faseMax, 1);
    colaPaz = [];
    $("#paz").classList.add("oculto");
    dibujarFase();
    ponerMusica();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!estado.conceptosVistos.hangar) {
      estado.conceptosVistos.hangar = true;
      decirPaz("El centro de control", "Camina con las flechas o WASD (en tablet, con el control de la esquina) hasta una estación y pulsa E o ENTRAR. Empieza por Comunicaciones: ahí llega el encargo.");
    }
  }

  function pantallaHangar() {
    let html = '<div class="titulo-fase"><span class="titulo-icono">' + ic("mapa") + '</span><div>' +
      '<p class="num-fase">Tu base de operaciones</p><h2>Centro de control</h2></div></div>' +
      '<p class="intro">Camina hasta cada estación para preparar la misión. Las estaciones se desbloquean en orden.</p>' +
      '<div class="hangar" id="hangar"></div><div class="hangar-lista">';
    Hangar.estaciones().forEach(function (e) {
      const info = estadoEstacion(e);
      html += '<button class="hangar-boton' + (info.bloqueada ? " bloqueada" : "") + (info.hecha ? " hecha" : "") + '" data-accion="estacion" data-id="' + e.id + '" style="--color-est:' + e.color + '">' +
        ic(info.bloqueada ? "candado" : (info.hecha ? "check" : e.icono)) + '<span><b>' + e.nombre + '</b><small>' + info.texto + '</small></span></button>';
    });
    return html + '</div>';
  }

  /* ---------- FASE 1: El encargo ---------- */
  // Misión rápida: el encargo ya viene dado por el contrato
  function pantallaContrato() {
    const c = Modos.contrato(estado.contrato), esc = Motor.escenario(estado);
    let html = titulo(1, "Tu contrato ya está firmado. Lee los objetivos con atención: cada uno cumplido da puntos extra, y si cumples todos ganas un gran bono.");
    html += '<div class="tarjeta detalle-encargo contrato-detalle">' + foto(esc.imagen, "foto-tarjeta foto-alta") +
      '<p class="etiqueta">Contrato · ' + c.cliente + '</p><h3>' + c.nombre + '</h3><p>' + c.encargo + '</p>' +
      '<h3>' + ic("objetivo") + ' Objetivos</h3><ul class="objetivos grandes">' +
      c.objetivos.map(function (o) { return '<li>' + ic("objetivo") + ' ' + Modos.textoObjetivo(c, o) + '</li>'; }).join("") +
      '<li>' + ic("reloj") + ' Lanzar antes de que se acabe el reloj (' + c.minutos + ' min)</li></ul>' +
      '<div class="grid-cifras">' +
      '<div class="cifra"><span class="cifra-etiqueta">' + ic("moneda") + ' Presupuesto</span><span class="cifra-valor">' + Motor.presupuesto(estado) + ' M USD</span>' + pq("presupuesto", true) + '</div>' +
      '<div class="cifra"><span class="cifra-etiqueta">' + ic("trofeo") + ' Recompensa</span><span class="cifra-valor">' + c.recompensa.porObjetivo + ' pts</span><small>por objetivo · +' + c.recompensa.bonoCompleto + ' si cumples todos</small></div>' +
      '<div class="cifra"><span class="cifra-etiqueta">' + ic("planeta") + ' Misión</span><span class="cifra-valor chico">' + esc.nombre + '</span><small>' + esc.destino + '</small></div>' +
      '</div><div class="centro"><button class="btn btn-secundario" data-accion="fuentesEscenario">' + ic("libro") + ' ¿De dónde salen estos datos?</button></div></div>';
    return html;
  }

  function pantallaEncargo() {
    if (estado.modoJuego === "rapida" && estado.contrato) return pantallaContrato();
    const dif = Motor.dificultad(estado);
    let html = titulo(1, "Una agencia espacial te propone cinco misiones. Elige una: cada una ocurre en un lugar distinto y tiene problemas distintos.");
    html += '<div class="grid-tarjetas">';
    DATOS.escenarios.forEach(function (esc) {
      const sel = estado.escenario === esc.id;
      html += '<div class="tarjeta elegible escenario con-foto' + (sel ? " seleccionada" : "") + '" role="button" tabindex="0" data-accion="elegirEscenario" data-id="' + esc.id + '">' +
        foto(esc.imagen) + '<small class="inspirado">' + esc.destino + '</small><h3>' + esc.nombre + '</h3><p>' + esc.descripcion + '</p>' +
        '<ul class="stats">' + stat("moneda", fmt(Math.round(esc.presupuesto * dif.multPresupuesto), 0) + " M USD", null) +
        stat("reloj", fmt(esc.duracionDias, 0) + " días midiendo", null) +
        (esc.diasViaje ? stat("cohete", "Viaje: " + fmt(esc.diasViaje, 0) + " días", null) : "") + '</ul>' +
        '<span class="etiqueta-chip">' + (sel ? ic("check") + " Encargo aceptado" : "Tocar para aceptar") + '</span></div>';
    });
    html += '</div>';

    if (estado.escenario) {
      const esc = Motor.escenario(estado);
      html += '<div class="tarjeta detalle-encargo"><h3>' + ic("objetivo") + ' Objetivo de la misión</h3><p>' + esc.objetivo + '</p>' +
        '<div class="grid-cifras">' +
        '<div class="cifra"><span class="cifra-etiqueta">' + ic("moneda") + ' Presupuesto</span><span class="cifra-valor">' + (estado.modoJuego === "libre" ? "Sin límite" : Motor.presupuesto(estado) + ' M USD') + '</span><small>' + (estado.modoJuego === "libre" ? "Modo libre" : "Dificultad: " + dif.nombre) + '</small>' + pq("presupuesto", true) + '</div>' +
        '<div class="cifra"><span class="cifra-etiqueta">' + ic("reloj") + ' Duración deseada</span><span class="cifra-valor">' + fmt(esc.duracionDias, 0) + ' días</span><small>(' + fmt(esc.duracionDias / 365, 1) + ' años)</small>' + pq("duracion", true) + '</div>' +
        '<div class="cifra"><span class="cifra-etiqueta">' + ic("cohete") + ' Viaje</span><span class="cifra-valor">' + (esc.diasViaje ? fmt(esc.diasViaje, 0) + " días" : "Directo") + '</span><small>' + esc.destino + '</small>' + pq("viaje", true) + '</div>' +
        '<div class="cifra"><span class="cifra-etiqueta">' + ic("mapa") + ' Zona a estudiar</span><span class="cifra-valor chico">' + esc.zona + '</span>' +
        (esc.propulsionObligatoria ? '<small>' + ic("llama") + ' Necesita motor propio</small>' : '<small>' + ic("sol") + ' Luz solar: ' + Math.round(esc.factorSolar * 100) + '%</small>') + '</div>' +
        '</div><div class="centro"><button class="btn btn-secundario" data-accion="fuentesEscenario">' + ic("libro") + ' ¿De dónde salen estos datos?</button></div></div>';
    }
    return html;
  }

  /* ---------- FASE 2: La nave ---------- */
  function pantallaNave() {
    const esc = Motor.escenario(estado);
    const r = Motor.calcularRecursos(estado);
    let html = titulo(2, "Elige cada pieza. <b>Básica</b> = barata pero pesada. <b>Avanzada</b> = cara pero liviana. ¡Mira las barras de arriba!");
    html += '<div class="tarjeta visor-nave"><div class="visor-3d" id="visor-nave"></div><div class="visor-texto"><h3>' + ic("satelite") + ' Tu nave en 3D</h3>' +
      '<p>Cambia con cada pieza que elijas: paneles, antena, motor e instrumentos.</p><p><small>Arrastra para girarla · rueda del mouse o pellizco para acercar.</small></p>' +
      '<p class="sin-3d"><small>La vista 3D está desactivada (Calidad baja o tu navegador no tiene 3D).</small></p></div></div>';
    if (esc.factorSolar < 1) html += '<div class="tarjeta aviso-escenario">' + ic("sol") + ' En este destino llega solo el <b>' + Math.round(esc.factorSolar * 100) + '%</b> de la luz del Sol.' +
      (esc.ajustePaneles ? ' Por eso los paneles son <b>' + esc.ajustePaneles + ' veces más grandes</b> (y pesados).' : '') + ' ' + pq("generacion") + '</div>';

    DATOS.componentes.forEach(function (c) {
      let versiones = ["basica", "avanzada"];
      if (c.opcional && !esc.propulsionObligatoria) versiones = ["ninguna", "basica", "avanzada"];
      html += '<article class="tarjeta componente"><header class="componente-cabeza">' + foto(c.imagen, "foto-mini") +
        '<div><h3>' + c.nombre + ' ' + chipRol(c.rol) + '</h3><p>' + c.descripcion + '</p>' +
        (c.id === "propulsion" && esc.propulsionObligatoria ? '<p class="obligatorio">' + ic("llama") + ' Obligatoria en esta misión: hay que frenar al llegar.</p>' : '') +
        fuentesMini(c.fuentes) + '</div></header><div class="opciones-' + (versiones.length === 3 ? "tres" : "dos") + '">';

      versiones.forEach(function (v) {
        const op = Motor.opcionAjustada(c, v, esc);
        const sel = estado.componentes[c.id] === v;
        let stats = stat("peso", fmt(op.masa) + " kg", "masa") + stat("moneda", fmt(op.costo) + " M USD", "costo");
        if (op.energia) stats += stat("rayo", "Usa " + op.energia + " W", "consumo");
        if (v !== "ninguna") c.extra.forEach(function (x) {
          const valor = x.porcentaje ? Math.round(op[x.campo] * 100) : fmt(op[x.campo]);
          stats += stat("estrella", x.etiqueta + ": " + valor + " " + x.unidad, x.porque);
        });
        if (c.id === "paneles" && esc.factorSolar < 1) stats += stat("planeta", "En destino: " + fmt(op.generacion * esc.factorSolar, 0) + " W", "generacion");
        if (c.id === "propulsion") stats += infoCombustible(v, r, esc);

        html += '<div class="opcion elegible' + (sel ? " seleccionada" : "") + '" role="button" tabindex="0" data-accion="elegirPieza" data-comp="' + c.id + '" data-version="' + v + '">' +
          '<span class="version version-' + v + '">' + { ninguna: "Sin motor", basica: "Básica", avanzada: "Avanzada" }[v] + '</span>' +
          '<strong>' + op.nombre + '</strong><small>' + op.descripcion + '</small><ul class="stats">' + stats + '</ul>' +
          (sel ? '<span class="marca-sel">' + ic("check") + ' Elegida</span>' : '') + '</div>';
      });
      html += '</div></article>';
    });
    return html;
  }

  // Cuánto combustible necesitaría cada motor (ecuación del cohete)
  function infoCombustible(version, r, esc) {
    const orb = r.orbita;
    const op = DATOS.componentes.find(function (c) { return c.id === "propulsion"; }).opciones[version];
    const masaSeca = r.masaSeca - (r.piezas.propulsion ? r.piezas.propulsion.masa : 0) + op.masa;
    if (version === "ninguna") {
      return orb.deltaVLlegada > 0 ? stat("prohibido", "No puede frenar en esta órbita", "deltaV") : stat("reloj", "Órbita dura " + orb.vidaOrbitaAnios + " años", "tiempo");
    }
    const dv = (orb.deltaVLlegada + orb.deltaVAnual * (esc.duracionDias / 365)) * DATOS.config.margenDeltaV;
    const comb = Motor.combustible(masaSeca, dv, op.isp);
    let txt = stat("gota", "Combustible: " + fmt(comb, 0) + " kg (Δv " + fmt(dv, 2) + " km/s)", "ecuacionCohete");
    if (op.isp > 1000 && esc.diasViajeElectrico) txt += stat("reloj", "Viaje +" + esc.diasViajeElectrico + " días más lento", "viaje");
    return txt;
  }

  /* ---------- FASE 3: Instrumentos ---------- */
  function pantallaInstrumentos() {
    const esc = Motor.escenario(estado);
    const r = Motor.calcularRecursos(estado);
    let html = titulo(3, "Elige los instrumentos científicos. Cada uno agrega peso, consume energía, cuesta dinero y produce datos que hay que enviar.");
    html += '<div class="grid-tarjetas">';
    esc.instrumentos.forEach(function (ins) {
      const sel = estado.instrumentos.indexOf(ins.id) >= 0;
      const pista = hayPistas() && esc.instrumentosRecomendados.indexOf(ins.id) >= 0;
      html += '<div class="tarjeta elegible instrumento con-foto' + (sel ? " seleccionada" : "") + '" role="button" tabindex="0" data-accion="alternarInstrumento" data-id="' + ins.id + '">' +
        foto(ins.imagen) + (pista ? chipPista() : "") +
        '<h3>' + ins.nombre + '</h3><small class="inspirado">' + ins.inspirado + '</small>' +
        '<p>' + ins.descripcion + '</p><ul class="stats">' +
        stat("peso", fmt(ins.masa) + " kg", "masa") + stat("rayo", ins.energia + " W", "consumo") + stat("moneda", fmt(ins.costo) + " M USD", "costo") +
        stat("memoria", fmt(ins.datos, 2) + " GB/día", "gbDia") + stat("ciencia", ins.ciencia + " pts de ciencia", "ciencia") +
        '</ul>' + fuentesMini(ins.fuentes) + '<span class="etiqueta-chip">' + (sel ? ic("check") + " A bordo" : ic("mas") + " Agregar") + '</span></div>';
    });
    html += '</div>';
    html += '<div class="tarjeta resumen-linea">' + ic("ciencia") + ' Ciencia máxima con tu diseño: <b>' + fmt(r.cienciaBase, 0) + ' de ' + fmt(r.maxCienciaEscenario, 0) + ' puntos</b> ' +
      (r.orbitaEstimada ? '<small>(estimado en ' + r.orbita.nombre.toLowerCase() + '; cambiará con la órbita que elijas)</small>' : '<small>(en ' + r.orbita.nombre.toLowerCase() + ')</small>') + ' ' + pq("ciencia") + '</div>';
    return html;
  }

  /* ---------- FASE 4: Órbita y cohete ---------- */
  function pantallaOrbitaCohete() {
    const esc = Motor.escenario(estado);
    const r = Motor.calcularRecursos(estado);
    let html = titulo(4, "Elige el camino de tu nave y el cohete que la llevará. El juego revisa en vivo si tu nave (con su combustible) cabe en el cohete.");

    html += '<h3 class="subtitulo">1. Elige la órbita</h3><div class="grid-tarjetas tres">';
    esc.orbitas.forEach(function (o) {
      const sel = estado.orbita === o.id;
      const prueba = Motor.calcularRecursos(Object.assign({}, estado, { orbita: o.id }));
      const pista = hayPistas() && esc.orbitaRecomendada === o.id;
      html += '<div class="tarjeta elegible orbita con-foto' + (sel ? " seleccionada" : "") + '" role="button" tabindex="0" data-accion="elegirOrbita" data-id="' + o.id + '">' +
        foto(o.imagen) + (pista ? chipPista() : "") +
        '<h3>' + o.nombre + '</h3><small class="inspirado">' + o.subtitulo + '</small><p>' + o.descripcion + '</p><ul class="stats">' +
        stat("regla", "Altura: " + o.altitudTexto, "altitud") +
        stat("orbita", "Una vuelta: " + o.periodoTexto, null) +
        stat("luna", "En sombra: " + Math.round(o.eclipseFraccion * 100) + "% del tiempo", "sombra") +
        stat("antena", "Envía: " + fmt(prueba.bajada, 2) + " GB/día", "contacto") +
        (o.deltaVLlegada > 0 ? stat("llama", "Frenar al llegar: " + fmt(o.deltaVLlegada, 2) + " km/s", "deltaV") : "") +
        (prueba.motor || o.deltaVLlegada > 0 ? stat("gota", "Combustible: " + (prueba.faltaMotor ? "¡falta motor!" : fmt(prueba.masaCombustible, 0) + " kg"), "ecuacionCohete") : "") +
        stat("reloj", "La órbita dura: " + (prueba.motor ? o.vidaConMotorAnios : o.vidaOrbitaAnios) + " años", "tiempo") +
        '</ul><p class="nota">' + o.notaCiencia + '</p>' + fuentesMini(o.fuentes) + '</div>';
    });
    html += '</div>';

    const conPlan = !!Trayectorias.config(esc.id);
    if (conPlan) html += planificadorViaje(r, esc);

    html += '<h3 class="subtitulo">' + (conPlan ? "3" : "2") + '. Elige el cohete</h3><div class="grid-tarjetas tres">';
    DATOS.cohetes.forEach(function (c) {
      const sel = estado.cohete === c.id;
      let compat = '<span class="compat neutro">Elige primero una órbita</span>';
      let capTexto = "—";
      if (estado.orbita) {
        const cap = Motor.capacidad(c, estado, r.orbita.destinoCohete, r.viaje);
        capTexto = cap > 0 ? fmt(cap, 0) + " kg" : "No llega";
        if (cap === 0) compat = '<span class="compat mal">' + ic("cruz") + ' No llega a este destino</span>';
        else if (r.masa > cap) compat = '<span class="compat mal">' + ic("cruz") + ' Tu nave es muy pesada (sobran ' + fmt(r.masa - cap, 0) + ' kg)</span>';
        else compat = '<span class="compat bien">' + ic("check") + ' Compatible (quedan ' + fmt(cap - r.masa, 0) + ' kg libres)</span>';
      }
      const precio = c.costoPorKg ? "Precio para tu nave: " + fmt(Motor.costoCohete(c, r.masa), 2) + " M USD" : "Precio: " + fmt(c.costo) + " M USD";
      html += '<div class="tarjeta elegible cohete con-foto' + (sel ? " seleccionada" : "") + '" role="button" tabindex="0" data-accion="elegirCohete" data-id="' + c.id + '">' +
        foto(c.imagen, "foto-tarjeta foto-alta") +
        '<h3>' + c.nombre + '</h3><small class="inspirado">' + c.empresa + ' · ' + c.pais + '</small><p>' + c.descripcion + '</p><ul class="stats">' +
        stat("moneda", precio, c.costoPorKg ? "rideshare" : "costo") + stat("peso", "Lleva a este destino: " + capTexto, "capacidadCohete") +
        '</ul><p class="nota">' + ic("idea") + ' ' + c.dato + '</p>' + fuentesMini(c.fuentes) + compat + '</div>';
    });
    html += '</div>';
    html += tarjetaCohetePropio(r);

    const v = Motor.verificarLanzamiento(estado, r);
    html += '<div class="tarjeta verificacion ' + (v.ok ? "ok" : "no") + '"><h3>' + (v.ok ? ic("check") + " ¡Lista para lanzar!" : ic("lista") + " Revisión antes del lanzamiento") + '</h3><ul class="stats">' +
      stat("peso", "Tu nave pesa " + fmt(r.masa, 0) + " kg (" + fmt(r.masaSeca, 0) + " kg de nave + " + fmt(r.masaCombustible, 0) + " kg de combustible)" + (r.capacidadCohete ? " · el cohete lleva " + fmt(r.capacidadCohete, 0) + " kg" : ""), "masa") +
      stat("moneda", "Costo total: " + fmt(r.costoTotal) + " de " + r.presupuesto + " M USD (incluye " + esc.costoFijo + " M de armado, pruebas y operación)", "costoFijo") +
      (r.diasViaje ? stat("cohete", "Viaje: " + fmt(r.diasViaje, 0) + " días", "viaje") : "") +
      '</ul>' + (v.ok ? "" : '<ul class="problemas">' + v.problemas.map(function (p) { return "<li>" + ic("alerta") + " " + p + "</li>"; }).join("") + "</ul>") + '</div>';
    return html;
  }

  /* ---------- Planificador del viaje (trayectorias.js + datos JPL Horizons) ---------- */
  function planificadorViaje(r, esc) {
    const c = Trayectorias.config(esc.id);
    const sel = estado.trayectoria || { tipo: "directa", mes: null };
    const v = r.viaje;
    let html = '<h3 class="subtitulo">2. Planifica el viaje ' + pq("ventana") + '</h3><div class="tarjeta planificador">';

    // Tipo de viaje
    html += '<div class="cc-fila"><span>Tipo de viaje</span><div class="cc-chips">' + c.tipos.map(function (id) {
      const t = DATOS.tiposViaje[id];
      return '<button class="chip-opcion' + (sel.tipo === id ? " activa" : "") + '" data-accion="elegirTipoViaje" data-id="' + id + '">' + ic(t.icono) + ' ' + t.nombre + '</button>';
    }).join("") + (c.tipos.indexOf("asistencia") >= 0 ? pq("asistencia") : "") + '</div></div>' +
      '<p class="nota">' + ic("idea") + ' ' + v.tipoInfo.texto + ' <i>' + v.tipoInfo.ejemplo + '</i> ' + fuentesMini(v.tipoInfo.fuentes) + '</p>';

    if (Trayectorias.usaFecha(esc.id)) {
      const mejor = hayPistas() ? Trayectorias.mejorMes(esc.id, sel.tipo, esc) : null;
      // Línea de tiempo: un botón por mes, agrupados por año
      const porAnio = {};
      Trayectorias.meses(esc.id).forEach(function (m) { (porAnio[m.slice(0, 4)] = porAnio[m.slice(0, 4)] || []).push(m); });
      html += '<p class="etiqueta-linea">' + ic("calendario") + ' Mes de lanzamiento <small>(colores: cuánta energía extra pide cada fecha)</small> ' + pq("efemerides") + '</p><div class="linea-meses">';
      Object.keys(porAnio).forEach(function (anio) {
        html += '<div class="fila-anio"><b>' + anio + '</b><div class="meses">' + porAnio[anio].map(function (m) {
          const ev = Trayectorias.evaluar(esc.id, { mes: m, tipo: sel.tipo }, esc);
          const q = Trayectorias.calidad(ev);
          const marca = c.meta && m === DATOS.pasoApofis.mes ? " evento" : "";
          return '<button class="mes mes-' + q + (sel.mes === m ? " activa" : "") + (m === mejor ? " mejor" : "") + marca + '" data-accion="elegirMes" data-mes="' + m + '" title="' +
            Trayectorias.textoMes(m) + ': ' + (ev.imposible ? "imposible" : (ev.extra >= 0 ? "+" : "") + fmt(ev.extra, 2) + " km/s") + '">' + Trayectorias.textoMes(m).slice(0, 3) + '</button>';
        }).join("") + '</div></div>';
      });
      html += '</div><p class="leyenda-meses"><span class="mes mes-buena"></span> Muy buena <span class="mes mes-media"></span> Se puede <span class="mes mes-mala"></span> Cara ' +
        '<span class="mes mes-imposible"></span> Imposible' + (mejor ? ' · <span class="mes mejor"></span> Recomendado por Paz' : '') +
        (c.meta ? ' · <span class="mes evento"></span> Paso cercano de Apofis' : '') + '</p>';
    }

    // Resumen y dibujo del sistema solar
    html += '<div class="plan-cuerpo">';
    if (v.posiciones) html += dibujoViaje(v, c);
    html += '<div class="plan-resumen">';
    if (v.sinFecha) html += '<p>' + ic("calendario") + ' <b>Elige un mes</b> en la línea de tiempo para ver dónde estarán los planetas.</p>';
    else {
      html += '<ul class="stats">';
      if (v.mes) html += stat("cohete", "Lanzamiento: " + Trayectorias.textoMes(v.mes), null);
      if (v.salida && v.salida !== v.mes) html += stat("orbita", "Pasa junto a la Tierra y sale hacia " + c.nombreCuerpo + ": " + Trayectorias.textoMes(v.salida), "asistencia");
      if (v.fase !== undefined) html += stat("planeta", c.nombreCuerpo + " va " + fmt(v.fase, 0) + "° adelante de la Tierra (ideal: " + c.faseIdeal + "°)", "ventana");
      if (v.distancia !== undefined) html += stat("planeta", c.nombreCuerpo + " está a " + fmt(v.distancia, 2) + " UA de la Tierra (" + fmt(v.distancia * 150, 0) + " millones de km)", "efemerides");
      html += stat("reloj", "Viaje: " + fmt(v.diasViaje, 0) + " días" + (v.llegada ? " · llegada: " + Trayectorias.textoMes(v.llegada) : ""), "viaje");
      if (v.factorLlegada !== 1) html += stat("llama", "Frenar al llegar cuesta " + Math.round((1 - v.factorLlegada) * 100) + "% menos", "deltaV");
      if (v.imposible) html += stat("prohibido", "Energía extra: +" + fmt(v.extra, 1) + " km/s. ¡Imposible!", "extraViaje");
      else if (Math.abs(v.extra) >= 0.005) html += stat("llama", "Energía extra del cohete: " + (v.extra > 0 ? "+" : "") + fmt(v.extra, 2) + " km/s → lleva " +
        (v.factorCapacidad >= 1 ? Math.round((v.factorCapacidad - 1) * 100) + "% MÁS" : Math.round((1 - v.factorCapacidad) * 100) + "% menos") + " carga", "extraViaje");
      else if (Trayectorias.usaFecha(esc.id)) html += stat("check", "¡Fecha ideal! El cohete no gasta energía extra.", "extraViaje");
      html += '</ul>' + v.notas.map(function (n) { return '<p class="' + (v.bonoCiencia ? "texto-bien" : "texto-mal") + '">' + ic(v.bonoCiencia ? "trofeo" : "alerta") + ' ' + n + '</p>'; }).join("");
    }
    if (c.meta) html += '<p class="nota">' + ic("alerta") + ' <b>Paso cercano:</b> ' + DATOS.pasoApofis.fechaTexto + ', a ' + fmt(DATOS.pasoApofis.distanciaKm, 0) + ' km del centro de la Tierra. ' + c.meta.texto + '</p>';
    html += fuentesMini(["horizons"].concat(c.meta ? ["apophis_nasa"] : [])) + '</div></div></div>';
    return html;
  }

  // Dibujo del Sol, las órbitas y el camino de la nave (posiciones reales del mes elegido)
  function dibujoViaje(v, c) {
    const T = 240, cx = T / 2, cy = T / 2, esc = 62;
    const pos = function (lon, r) { const a = lon * Math.PI / 180; return [cx + Math.cos(a) * r * esc, cy - Math.sin(a) * r * esc]; };
    const p0 = v.posiciones, p1 = v.posLlegada || v.posiciones;
    const tierra = pos(p0.tierra.lon, p0.tierra.r);
    const objSalida = pos(p0[c.cuerpo].lon, p0[c.cuerpo].r), objLlegada = pos(p1[c.cuerpo].lon, p1[c.cuerpo].r);
    const rOrbita = c.cuerpo === "marte" ? 1.52 : 0.92;
    // Camino: avanza en el sentido de los planetas, cambiando de radio poco a poco
    let dAng = p1[c.cuerpo].lon - p0.tierra.lon; while (dAng <= 20) dAng += 360; while (dAng > 380) dAng -= 360;
    const puntos = [];
    for (let k = 0; k <= 32; k++) {
      const u = k / 32, ang = p0.tierra.lon + dAng * u, rad = p0.tierra.r + (p1[c.cuerpo].r - p0.tierra.r) * (1 - Math.cos(u * Math.PI)) / 2;
      puntos.push(pos(ang, rad).map(function (n) { return n.toFixed(1); }).join(","));
    }
    return '<svg class="dibujo-viaje" viewBox="0 0 ' + T + ' ' + T + '" role="img" aria-label="Posiciones de la Tierra y ' + c.nombreCuerpo + '">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + esc + '" class="orb-tierra"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (rOrbita * esc) + '" class="orb-obj"/>' +
      (v.tipo === "asistencia" ? '<circle cx="' + (cx + 8) + '" cy="' + cy + '" r="' + (1.08 * esc) + '" class="orb-vuelta"/>' : '') +
      '<polyline points="' + puntos.join(" ") + '" class="camino"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="9" class="sol"/>' +
      '<circle cx="' + tierra[0] + '" cy="' + tierra[1] + '" r="6" class="p-tierra"/>' +
      '<circle cx="' + objSalida[0] + '" cy="' + objSalida[1] + '" r="5" class="p-obj-antes"/>' +
      '<circle cx="' + objLlegada[0] + '" cy="' + objLlegada[1] + '" r="6" class="p-obj"/>' +
      '<text x="' + (tierra[0] + 8) + '" y="' + (tierra[1] - 8) + '">Tierra</text>' +
      '<text x="' + (objLlegada[0] + 8) + '" y="' + (objLlegada[1] + 14) + '">' + c.nombreCuerpo + ' al llegar</text>' +
      '</svg>';
  }

  /* ---------- Cohete propio por etapas (cohetes.js + datos/motores.js) ---------- */
  function tarjetaCohetePropio(r) {
    const sel = estado.cohete === "propio";
    const diseno = estado.coheteDiseno || Cohetes.disenoPorDefecto();
    const destino = estado.orbita ? r.orbita.destinoCohete : null;
    const extraViaje = r.viaje && !r.viaje.sinFecha ? r.viaje.extra : 0;
    const necesario = destino ? DATOS.deltaVDestino[destino] + extraViaje : null;
    const a = Cohetes.analizar(diseno, estado.escenario ? r.masa : 0);
    const coh = Cohetes.objeto(diseno);
    const R = DATOS.reglasCohete;

    let html = '<div class="tarjeta constructor-cohete' + (sel ? " seleccionada" : "") + '">' +
      '<div class="cc-cabeza"><div><h3>' + ic("llave") + ' O arma tu propio cohete por etapas ' + pq("etapas") + '</h3>' +
      '<p>Elige motores y tanques para cada etapa. La ecuación del cohete calcula cuánta velocidad (delta-v) logra con tu nave encima.</p></div>' +
      (sel ? '<span class="compat bien">' + ic("check") + ' Usando tu cohete</span>'
        : '<button class="btn btn-principal" data-accion="elegirCohete" data-id="propio">' + ic("cohete") + ' Usar mi cohete</button>') + '</div>';
    if (!sel) {
      html += '<p class="nota">' + ic("idea") + ' Ejemplo para empezar: 9 motores de queroseno abajo (como un Falcon 9) y 1 arriba. Cuesta unos ' + fmt(coh.costo, 0) + ' M USD.</p></div>';
      return html;
    }

    // Etapas (se muestran de arriba hacia abajo, como se ve el cohete parado)
    html += '<div class="cc-cuerpo"><div class="cc-etapas">';
    for (let i = diseno.etapas.length - 1; i >= 0; i--) {
      const et = diseno.etapas[i], d = a.etapas[i];
      html += '<div class="cc-etapa"><div class="cc-etapa-cabeza"><b>Etapa ' + (i + 1) + (i === 0 ? " (despega)" : (i === diseno.etapas.length - 1 ? " (de arriba)" : "")) + '</b>' +
        (diseno.etapas.length > 1 && i === diseno.etapas.length - 1 ? '<button class="btn btn-mini" data-accion="cohQuitarEtapa">' + ic("cruz") + ' Quitar</button>' : '') + '</div>' +
        '<div class="cc-fila"><span>Motor</span><div class="cc-chips">' + DATOS.motores.map(function (m) {
          return '<button class="chip-opcion' + (et.motor === m.id ? " activa" : "") + '" data-accion="cohMotor" data-i="' + i + '" data-id="' + m.id + '" title="' + m.inspirado + '">' + m.nombre + '</button>';
        }).join("") + '</div></div>' +
        '<div class="cc-fila"><span>Cantidad</span><div class="cc-contador"><button class="btn btn-mini" data-accion="cohCantidad" data-i="' + i + '" data-d="-1" aria-label="Menos motores">−</button>' +
          '<b>' + et.cantidad + '</b><button class="btn btn-mini" data-accion="cohCantidad" data-i="' + i + '" data-d="1" aria-label="Más motores">+</button></div></div>' +
        '<div class="cc-fila"><span>Tanque</span><div class="cc-chips">' + DATOS.tanques.map(function (t) {
          return '<button class="chip-opcion' + (et.tanque === t.id ? " activa" : "") + '" data-accion="cohTanque" data-i="' + i + '" data-id="' + t.id + '">' + t.nombre.replace("Tanque ", "") + ' · ' + fmt(t.toneladas, 1) + ' t</button>';
        }).join("") + '</div></div>' +
        (i === 0 ? '<div class="cc-fila"><span>Reutilizable ' + pq("reutilizable") + '</span><button class="chip-opcion' + (et.reutilizable ? " activa" : "") + '" data-accion="cohReutil">' +
          ic(et.reutilizable ? "check" : "menos") + (et.reutilizable ? " Sí: aterriza en el mar" : " No: se pierde") + '</button>' +
          (d.recuperada ? ' <span class="compat bien">' + ic("reiniciar") + ' Tienes una recuperada: −' + Math.round((1 - R.reutilizable.costoReuso) * 100) + '% de costo</span>' : '') + '</div>' : '') +
        '<ul class="stats en-fila">' +
          stat("llama", "Δv: " + fmt(d.deltaV, 2) + " km/s", "deltaVCohete") +
          stat("peso", "Empuje/peso: " + fmt(d.empujePeso, 2), "empujePeso") +
          stat("reloj", "Encendido: " + fmt(d.tiempo, 0) + " s", "tiempoQuemado") +
          stat("moneda", fmt(d.costo, 1) + " M USD", "costo") +
        '</ul></div>';
    }
    if (diseno.etapas.length < R.maxEtapas) html += '<button class="btn btn-secundario" data-accion="cohAgregarEtapa">' + ic("mas") + ' Agregar etapa arriba</button>';
    html += '</div>';

    // Resumen: delta-v contra lo necesario y línea de tiempo del ascenso
    const fr = necesario ? Math.min(1, a.deltaV / necesario) : 0;
    const alcanza = necesario && a.deltaV >= necesario && a.despega;
    const tiempoTotal = a.etapas.reduce(function (t, e) { return t + e.tiempo; }, 0);
    html += '<div class="cc-resumen"><h4>' + ic("grafico") + ' Con tu nave de ' + fmt(estado.escenario ? r.masa : 0, 0) + ' kg encima</h4>' +
      (necesario
        ? '<p>Delta-v total: <b>' + fmt(a.deltaV, 2) + ' km/s</b> · necesitas <b>' + fmt(necesario, 1) + ' km/s</b> para ' + r.orbita.nombre.toLowerCase() +
            (extraViaje ? ' (' + (extraViaje > 0 ? "+" : "") + fmt(extraViaje, 2) + ' por la fecha)' : '') + ' ' + pq("deltaVCohete") + '</p>' +
          '<div class="barra grande"><div class="barra-relleno relleno-' + (alcanza ? "verde" : (fr > 0.9 ? "amarillo" : "rojo")) + '" style="width:' + Math.max(3, fr * 100) + '%"></div></div>' +
          '<p class="' + (alcanza ? "texto-bien" : "texto-mal") + '">' + ic(alcanza ? "check" : "cruz") + ' ' + (alcanza ? "¡Alcanza! Puede llevar hasta " + fmt(Motor.capacidad(coh, estado, destino, r.viaje), 0) + " kg a este destino" + (extraViaje ? " en la fecha elegida" : "") + "." : "No alcanza: agrega combustible, una etapa o un motor más eficiente.") + '</p>'
        : '<p>Delta-v total: <b>' + fmt(a.deltaV, 2) + ' km/s</b>. Elige una órbita para saber si alcanza.</p>') +
      '<p><small>Despega con ' + fmt(a.masaDespegue / 1000, 1) + ' toneladas · costo ' + fmt(coh.costo, 1) + ' M USD</small></p>' +
      '<div class="cc-linea" title="Cuánto dura encendida cada etapa">' + a.etapas.map(function (e, k) {
        return '<div class="cc-tramo tramo-' + k + '" style="flex-grow:' + Math.max(1, e.tiempo) + '"><span>E' + (k + 1) + ' · ' + fmt(e.tiempo, 0) + ' s</span></div>';
      }).join("") + '</div><p><small>Ascenso: ' + fmt(tiempoTotal / 60, 1) + ' minutos de motores encendidos.</small></p>' +
      (a.avisos.length ? '<ul class="problemas">' + a.avisos.map(function (t) { return '<li>' + ic("alerta") + ' ' + t + '</li>'; }).join("") + '</ul>' : '') +
      fuentesMini(["tsiolkovsky", "deltav"]) + '</div></div></div>';
    return html;
  }

  // Cambios en el diseño del cohete propio
  function cambiarCohete(accion, el) {
    const d = estado.coheteDiseno, R = DATOS.reglasCohete;
    const i = Number(el.dataset.i);
    if (accion === "cohMotor") d.etapas[i].motor = el.dataset.id;
    else if (accion === "cohTanque") d.etapas[i].tanque = el.dataset.id;
    else if (accion === "cohCantidad") d.etapas[i].cantidad = Math.max(1, Math.min(R.maxMotores, d.etapas[i].cantidad + Number(el.dataset.d)));
    else if (accion === "cohReutil") { d.etapas[0].reutilizable = !d.etapas[0].reutilizable; concepto("aterrizaje"); }
    else if (accion === "cohAgregarEtapa" && d.etapas.length < R.maxEtapas) d.etapas.push({ motor: "hidrogeno", cantidad: 1, tanque: "chico", reutilizable: false });
    else if (accion === "cohQuitarEtapa" && d.etapas.length > 1) d.etapas.pop();
    cambioDiseno();
    // Paz avisa una vez si la primera etapa no puede despegar
    const a = Cohetes.analizar(d, Motor.calcularRecursos(estado).masa);
    if (!a.despega && !estado.conceptosVistos.avisoEmpuje) { estado.conceptosVistos.avisoEmpuje = true; decirPaz(DATOS.porQue.empujePeso.titulo, DATOS.porQue.empujePeso.texto); }
  }

  /* ---------- FASE 5: Simulación ---------- */
  function pantallaSimulacion() {
    const r = Motor.calcularRecursos(estado);
    let html = titulo(5, "Tu nave despega en el " + r.cohete.nombre + " rumbo a la " + r.orbita.nombre.toLowerCase() + ". Todo va acelerado: cada segundo son unos " + DATOS.config.diasPorSegundo + " días.");
    html += '<div class="sim-layout">' +
      '<div class="tarjeta sim-escena"><canvas id="canvas-sim"></canvas><div id="sim-3d" class="sim-3d"></div>' +
      '<p class="ayuda-3d">Arrastra para girar la vista · rueda o pellizco para acercar</p><div id="sim-portada" class="sim-portada"></div></div>' +
      '<div class="tarjeta sim-indicadores">' +
        '<div class="sim-dia"><span id="sim-dia">Día 0</span><span id="sim-dur">de ' + fmt(r.escenario.duracionDias, 0) + '</span></div>' +
        '<div class="barra grande"><div class="barra-relleno azul" id="sim-progreso"></div></div>' +
        indicador("bateria", "Batería", "sim-bateria", "bateriaNave") +
        indicador("memoria", "Datos guardados", "sim-almacen", "datosGuardados") +
        '<div class="sim-cifras">' +
          '<div><span class="cifra-etiqueta">' + ic("enviar") + ' Enviados ' + pq("datosEnviados") + '</span><b id="sim-enviados">0 GB</b></div>' +
          '<div><span class="cifra-etiqueta">' + ic("basura") + ' Perdidos</span><b id="sim-perdidos">0 GB</b></div>' +
          '<div><span class="cifra-etiqueta">' + ic("ciencia") + ' Ciencia</span><b id="sim-ciencia">0 pts</b></div>' +
        '</div>' +
        '<div id="sim-estado" class="sim-estado">Esperando el lanzamiento…</div>' +
        '<div class="velocidades">Velocidad: ' + [1, 2, 4].map(function (v) {
          return '<button class="btn btn-mini vel' + (v === 1 ? " activa" : "") + '" data-accion="velocidad" data-v="' + v + '">×' + v + '</button>';
        }).join("") + '</div>' +
      '</div>' +
      '<div class="tarjeta sim-bitacora"><h3>' + ic("lista") + ' Bitácora de la misión</h3><ul id="bitacora"></ul></div></div>';
    return html;
  }

  function indicador(icono, nombre, id, clave) {
    return '<div class="indicador"><div class="recurso-cabeza"><span>' + ic(icono) + ' ' + nombre + '</span>' + pq(clave) + '<span class="ind-valor" id="' + id + '-txt"></span></div>' +
      '<div class="barra grande"><div class="barra-relleno" id="' + id + '"></div></div></div>';
  }

  function prepararSimulacion() {
    const portada = $("#sim-portada");
    const r = Motor.calcularRecursos(estado);
    if (estado.resultado) {
      portada.innerHTML = '<div class="portada-caja"><div class="icono-grande-svg">' + ic("bandera") + '</div><h3>Misión terminada</h3><p>' + estado.resultado.informe.clasificacion + '</p>' +
        '<button class="btn btn-principal" data-accion="siguiente">Ver informe</button> <button class="btn btn-secundario" data-accion="lanzar">' + ic("reiniciar") + ' Lanzar otra vez</button></div>';
      return;
    }
    portada.innerHTML = '<div class="portada-caja">' + foto(r.cohete.imagen, "foto-portada") + '<h3>Todo listo en la plataforma</h3>' +
      '<p>' + fmt(r.masa, 0) + ' kg · ' + r.instrumentos.length + ' instrumento(s) · ' + r.cohete.nombre + '</p>' +
      '<button class="btn btn-principal btn-gigante" data-accion="lanzar">' + ic("cohete") + ' ¡Lanzar!</button></div>';
  }

  let avisos = {};

  function lanzar() {
    estado.resultado = null;
    aterrizando = false;
    tomarRecuperada();
    // Misión rápida: se anota si se lanzó a tiempo y cuántos minutos sobraron
    if (estado.modoJuego === "rapida") {
      const resta = Modos.restanteMs();
      estado.lanzamiento = { aTiempo: resta > 0, minutosSobrantes: resta / 60000 };
      Modos.detenerReloj();
    }
    actualizarNavegacion();
    avisos = {};
    $("#bitacora").innerHTML = "";
    const portada = $("#sim-portada");
    portada.classList.remove("oculto");
    let cuenta = 3;
    enVuelo = false;
    ponerMusica("lanzamiento");
    portada.innerHTML = '<div class="portada-caja"><div class="cuenta">' + cuenta + '</div></div>';
    Sonido.efecto("cuenta"); Voz.decir("Tres");
    const intervalo = setInterval(function () {
      cuenta--;
      if (estado.fase !== 5) { clearInterval(intervalo); return; }
      if (cuenta > 0) {
        portada.querySelector(".cuenta").textContent = cuenta;
        Sonido.efecto("cuenta"); Voz.decir(cuenta === 2 ? "Dos" : "Uno");
        return;
      }
      clearInterval(intervalo);
      portada.innerHTML = "";
      portada.classList.add("oculto");
      // ¡Despegue! Videos reales (o escenas 3D de respaldo): despegue → separación → órbita
      Voz.decir("¡Despegue!");
      Videos.secuencia(["despegue", "separacion", "orbita"], Motor.calcularRecursos(estado), function () {
        if (estado.fase !== 5) return;
        const coh = Motor.calcularRecursos(estado).cohete;
        if (Cohetes.tieneAterrizaje(coh)) {
          bitacora("cohete", "<b>Separación de etapas:</b> la nave sigue su camino y la primera etapa vuelve a la Tierra.", "");
          if (estado.usoRecuperada) bitacora("reiniciar", "<b>Etapa reusada:</b> esta primera etapa ya había volado y aterrizado antes.", "bien");
          aterrizando = true; practica = null;
          introMinijuego(DATOS.aterrizaje, Motor.calcularRecursos(estado), 0);
          return;
        }
        bitacora("cohete", "<b>Separación de etapas:</b> la primera etapa se soltó y cayó; la segunda llevó la nave a su camino.", "");
        seguirVuelo();
      });
    }, 800);
  }

  function seguirVuelo() {
    enVuelo = true;
    ponerMusica();
    empezarSimulacion();
  }

  /* ---------- Etapas reutilizables ---------- */
  let aterrizando = false;      // true mientras se juega el aterrizaje de la primera etapa

  // Quita la marca de "etapa recuperada en uso" (al cambiar el diseño o antes de lanzar)
  function soltarRecuperada() {
    estado.usoRecuperada = false;
    if (estado.coheteDiseno) delete estado.coheteDiseno.etapas[0].usaRecuperada;
  }

  // Al lanzar: si hay una primera etapa recuperada igual a la del diseño, se usa (y sale de la flota)
  function tomarRecuperada() {
    soltarRecuperada();
    estado.aterrizaje = null;
    const d = estado.coheteDiseno;
    if (estado.cohete === "propio" && d && d.etapas[0].reutilizable && Cohetes.usarRecuperada(d)) {
      d.etapas[0].usaRecuperada = true;
      estado.usoRecuperada = true;
    }
  }

  function terminarAterrizaje(puntaje, detalle, automatico) {
    aterrizando = false;
    const nivel = Minijuegos.nivel(puntaje);
    const coh = Motor.calcularRecursos(estado).cohete;
    const pts = nivel === "bien" ? DATOS.reglasCohete.puntosAterrizaje : (nivel === "regular" ? Math.round(DATOS.reglasCohete.puntosAterrizaje / 3) : 0);
    estado.aterrizaje = { nivel: nivel, pct: Math.round(puntaje * 100), detalle: detalle, automatico: automatico, puntos: pts, guardada: false };
    // Solo un aterrizaje perfecto deja la etapa lista para otra misión (en un cohete propio)
    if (nivel === "bien" && coh.propio) { Cohetes.registrarRecuperacion(estado.coheteDiseno); estado.aterrizaje.guardada = true; }
    const msg = DATOS.aterrizaje.resultados[nivel].mensaje;
    bitacora(nivel === "mal" ? "alerta" : "trofeo", "<b>Aterrizaje de la primera etapa:</b> " + Math.round(puntaje * 100) + "%. " + msg, nivel === "mal" ? "mal" : "bien");
    return { nivel: nivel, pct: Math.round(puntaje * 100), mensaje: msg + (pts ? " (+" + pts + " puntos)" : "") +
      (nivel === "bien" && !coh.propio ? " En un cohete propio, además, quedaría guardada para tu próxima misión." : "") };
  }

  function bitacora(icono, texto, tipo) {
    const lista = $("#bitacora");
    if (!lista) return;
    const li = document.createElement("li");
    li.className = tipo || "";
    li.innerHTML = ic(icono) + " " + texto;
    lista.insertBefore(li, lista.firstChild);
  }

  function empezarSimulacion() {
    const r = Motor.calcularRecursos(estado);
    bitacora("cohete", "<b>Despegue:</b> ¡El " + r.cohete.nombre + " lleva tu nave rumbo a " + r.escenario.destino + "!", "bien");
    if (r.viaje && r.viaje.mes) bitacora("calendario", "<b>Ruta:</b> " + r.viaje.tipoInfo.nombre.toLowerCase() + ", lanzamiento en " + Trayectorias.textoMes(r.viaje.mes) +
      ", llegada en " + Trayectorias.textoMes(r.viaje.llegada) + "." + (r.viaje.notas.length ? " " + r.viaje.notas[0] : ""), r.viaje.bonoCiencia ? "bien" : "");
    else if (r.viaje && r.viaje.tipo === "bajaEnergia") bitacora("orbita", "<b>Ruta:</b> viaje de baja energía: más lento, pero frenar en la Luna costará menos combustible.", "");
    if (r.diasViaje > 0) concepto("viaje");
    document.querySelectorAll(".vel").forEach(function (b) { b.classList.toggle("activa", b.dataset.v === "1"); });

    Simulacion.iniciar($("#canvas-sim"), r, {
      alActualizar: actualizarIndicadores,
      alLlegar: function (s) { Sonido.efecto("pitido"); bitacora("objetivo", "<b>Llegada:</b> Tras " + s.diasViaje + " días de viaje, la nave llegó a su órbita. ¡Comienza la ciencia!", "bien"); },
      alEvento: mostrarEvento,
      alTerminar: terminarSimulacion
    });
    // Vista 3D de la órbita (si el equipo puede); si no, se ve el dibujo 2D de siempre
    const usar3D = Vista3D.disponible();
    Simulacion.usarVistaExterna(usar3D);
    $(".sim-escena").classList.toggle("con-3d", usar3D);
    if (usar3D) Vista3D.mostrarSimulacion($("#sim-3d"));
    // En Misión rápida la simulación parte al doble de velocidad para caber en la clase
    if (estado.modoJuego === "rapida") {
      Simulacion.cambiarVelocidad(2);
      document.querySelectorAll(".vel").forEach(function (b) { b.classList.toggle("activa", b.dataset.v === "2"); });
    }
  }

  function actualizarIndicadores(s, rr) {
    if (!$("#sim-dia")) return;          // ya no estamos en la pantalla de simulación
    if (s.enViaje) {
      $("#sim-dia").textContent = "Viaje " + fmt(s.diaViaje, 0);
      $("#sim-dur").textContent = "de " + fmt(s.diasViaje, 0);
      $("#sim-progreso").style.width = (s.diaViaje / s.diasViaje * 100) + "%";
      $("#sim-estado").textContent = "En viaje: instrumentos en espera";
    } else {
      $("#sim-dia").textContent = "Día " + fmt(s.dia, 0);
      $("#sim-dur").textContent = "de " + fmt(s.duracion, 0);
      $("#sim-progreso").style.width = Math.min(100, s.dia / s.duracion * 100) + "%";
      let est;
      if (s.terminada) est = "Misión terminada";
      else if (s.pausada) est = "Esperando tu decisión…";
      else if (s.seguroDias > 0) est = "Modo seguro: instrumentos apagados";
      else if (!s.instrumentosOn) est = "Sin energía: instrumentos apagados";
      else if (s.enSombraVisual) est = "En la sombra: usando batería";
      else est = "Midiendo y enviando datos";
      $("#sim-estado").textContent = est;
    }
    const bat = rr.capBat > 0 ? s.bateriaWh / rr.capBat : 0;
    const batVisual = Math.max(0, bat - (s.enSombraVisual && !s.enViaje ? Math.min(1, rr.descarga) * 0.5 : 0));
    ponerBarra("sim-bateria", batVisual, Math.round(batVisual * 100) + "%", batVisual < 0.2 ? "rojo" : (batVisual < 0.5 ? "amarillo" : "verde"));
    const mem = rr.memoria > 0 ? s.almacenGB / rr.memoria : 0;
    ponerBarra("sim-almacen", mem, fmt(s.almacenGB) + " / " + fmt(rr.memoria, 0) + " GB", mem > 0.95 ? "rojo" : (mem > 0.7 ? "amarillo" : "verde"));
    $("#sim-enviados").textContent = fmt(s.enviadoGB, 1) + " GB";
    $("#sim-perdidos").textContent = fmt(s.perdidoGB, 1) + " GB";
    const ideal = rr.gbDia * s.duracion;
    $("#sim-ciencia").textContent = fmt(Math.max(0, (ideal > 0 ? rr.cienciaBase * Math.min(1, s.enviadoGB / ideal) : 0) + s.cienciaExtra), 0) + " pts";

    if (s.enSombraVisual && !avisos.sombra) { avisos.sombra = true; concepto("sombra"); }
    if (s.sinEnergia && !avisos.energia) { avisos.energia = true; bitacora("bateriaBaja", "<b>Día " + s.dia + ":</b> ¡La batería se agotó! La nave apagó los instrumentos para salvarse.", "mal"); }
    if (s.perdidoGB > 0.05 && !avisos.datos) { avisos.datos = true; bitacora("basura", "<b>Día " + s.dia + ":</b> Se están perdiendo datos: no caben en la memoria o la antena no alcanza.", "mal"); }
    [365, 730, 1095, 1460].forEach(function (d) {
      if (s.dia >= d && !avisos["a" + d] && s.duracion > d) { avisos["a" + d] = true; bitacora("bandera", "<b>Día " + d + ":</b> ¡" + (d / 365) + " año(s) midiendo! " + fmt(s.enviadoGB, 0) + " GB enviados.", ""); }
    });
  }

  function ponerBarra(id, fraccion, texto, nivel) {
    const el = $("#" + id);
    el.style.width = Math.max(2, Math.min(1, fraccion) * 100) + "%";
    el.className = "barra-relleno relleno-" + nivel;
    $("#" + id + "-txt").textContent = texto;
  }

  /* ---------- Imprevistos ---------- */
  /* ---------- Minijuegos (desafíos) ---------- */
  let practica = null;          // si no es null, estamos practicando (sin consecuencias)

  // Pantalla previa: qué hay que hacer y cómo influye el diseño de la nave
  function introMinijuego(ev, r, dia) {
    const inf = Minijuegos.influencia(ev.minijuego, r);
    const info = Minijuegos.info(ev.minijuego);
    let quien = (estado.modo === "equipo" && !practica) ? '<div class="decide">Juega: ' + chipRol(ev.rol) + '</div>' : "";
    abrirModal('<div class="evento">' + foto(ev.imagen, "foto-evento") +
      '<p class="etiqueta">' + (practica ? "Práctica" : (aterrizando ? "Minuto 8 del lanzamiento" : "Día " + fmt(dia, 0) + " de la misión")) + ' · Desafío</p>' +
      '<h2>' + ev.titulo + '</h2>' + quien + '<p>' + ev.descripcion + '</p>' +
      '<div class="paz-dice"><div class="mini-avatar">' + avatarPaz() + '</div><p><b>Ingeniera Paz:</b> ' + ev.paz + '</p></div>' +
      '<div class="mj-influencia"><h3>' + ic("satelite") + ' Tu diseño influye</h3><ul>' + inf.lineas.map(function (l) { return "<li>" + l + "</li>"; }).join("") + '</ul>' +
      '<p><small>' + ic(info.icono) + ' ' + info.controles + '</small></p></div>' +
      '<div class="opciones-evento">' +
        '<button class="opcion-evento destacada" data-accion="jugarMinijuego"><strong>' + ic("play") + ' Jugar el desafío</strong><small>Tu puntaje decide qué le pasa a la nave.</small></button>' +
        '<button class="opcion-evento" data-accion="pilotoAutomatico"><strong>' + ic("satelite") + ' Piloto automático</strong><small>La nave lo resuelve sola, pero solo a medias (resultado regular).</small></button>' +
      '</div></div>', false, true);
    Sonido.efecto(ev.minijuego === "antena" ? "pitido" : "alarma");
    Voz.decir(ev.titulo + " " + ev.paz);
  }

  // El desafío que se está jugando: práctica, aterrizaje de la etapa o imprevisto de la misión
  function eventoEnJuego() {
    if (practica) return practica.evento;
    if (aterrizando) return DATOS.aterrizaje;
    return Simulacion.estado().eventoActual;
  }

  function jugarMinijuego() {
    const ev = eventoEnJuego();
    const r = practica ? practica.recursos : Motor.calcularRecursos(estado);
    Voz.detener();
    abrirModal('<div id="mj-contenedor"></div>', false, true);
    Minijuegos.jugar(ev.minijuego, $("#mj-contenedor"), r, function (res) { mostrarResultadoMinijuego(ev, res.puntaje, res.detalle, false); });
  }

  function pilotoAutomatico() {
    const ev = eventoEnJuego();
    mostrarResultadoMinijuego(ev, 0.4 + Math.random() * 0.15, "El piloto automático hizo lo justo.", true);
  }

  function mostrarResultadoMinijuego(ev, puntaje, detalle, automatico) {
    let res;
    const eraAterrizaje = aterrizando && !practica;
    if (practica) {
      const nivel = Minijuegos.nivel(puntaje);
      res = { nivel: nivel, pct: Math.round(puntaje * 100), mensaje: "En una misión real: " + ev.resultados[nivel].mensaje };
    } else if (aterrizando) {
      res = terminarAterrizaje(puntaje, detalle, automatico);
    } else {
      res = Simulacion.resolverMinijuego(puntaje, detalle, automatico);
      bitacora(res.nivel === "mal" ? "alerta" : (res.nivel === "bien" ? "trofeo" : "check"),
        "<b>Día " + Simulacion.estado().dia + ":</b> " + ev.titulo + " Desafío: " + res.pct + "%. " + res.mensaje, res.nivel === "mal" ? "mal" : "bien");
    }
    const titulos = { bien: "¡Excelente!", regular: "Bien, pero con costo", mal: "Fue muy difícil" };
    Sonido.efecto(res.nivel === "bien" ? "exito" : (res.nivel === "regular" ? "exitoCorto" : "falla"));
    abrirModal('<div class="evento"><div class="icono-grande-svg tono-' + (res.nivel === "mal" ? "mal" : "bien") + '">' + ic(res.nivel === "bien" ? "trofeo" : (res.nivel === "mal" ? "alerta" : "check")) + '</div>' +
      '<h2>' + titulos[res.nivel] + '</h2>' +
      '<div class="mj-puntaje"><div class="barra grande"><div class="barra-relleno relleno-' + (res.nivel === "bien" ? "verde" : (res.nivel === "regular" ? "amarillo" : "rojo")) + '" style="width:' + Math.max(3, res.pct) + '%"></div></div><b>' + res.pct + '%</b></div>' +
      '<p>' + detalle + '</p><p class="resultado-mj">' + res.mensaje + '</p>' +
      '<div class="centro">' + (practica
        ? '<button class="btn btn-secundario" data-accion="practicar">Practicar otro</button> <button class="btn btn-principal" data-accion="cerrarModal">Cerrar</button>'
        : (eraAterrizaje
          ? '<button class="btn btn-principal" data-accion="continuarDespegue">Seguir a la nave ' + ic("play") + '</button>'
          : '<button class="btn btn-principal" data-accion="continuarMision">Continuar misión ' + ic("play") + '</button>')) + '</div></div>', false);
    Voz.decir(titulos[res.nivel] + ". " + res.mensaje);
  }

  // Centro de práctica: jugar cualquier desafío sin afectar una misión
  function abrirPractica() {
    const conDiseno = estado.escenario && DATOS.componentes.every(function (c) { return estado.componentes[c.id]; });
    abrirModal('<h2>' + ic("trofeo") + ' Centro de entrenamiento</h2>' +
      '<p>Practica los desafíos antes de la misión. ' + (conDiseno ? "Se usa <b>tu diseño actual</b> de nave." : "Como aún no armas una nave, se usa una <b>nave de entrenamiento con piezas básicas</b>.") + ' Nada de esto afecta tu misión.</p>' +
      '<div class="grid-practica">' + Minijuegos.tipos().map(function (t) {
        const i = Minijuegos.info(t);
        return '<button class="btn-practica" data-accion="practicarTipo" data-tipo="' + t + '">' + ic(i.icono) + '<span>' + i.nombre + '</span></button>';
      }).join("") + '</div><div class="centro"><button class="btn btn-secundario" data-accion="cerrarModal">Cerrar</button></div>', true);
  }

  function practicar(tipo) {
    const conDiseno = estado.escenario && DATOS.componentes.every(function (c) { return estado.componentes[c.id]; });
    let e = estado;
    if (!conDiseno) {
      e = Object.assign({}, estado, { escenario: "chile", orbita: "baja", cohete: null, componentes: {}, instrumentos: ["optica"] });
      DATOS.componentes.forEach(function (c) { e.componentes[c.id] = "basica"; });
    }
    const ev = DATOS.eventos.find(function (x) { return x.minijuego === tipo; }) || (tipo === "aterrizaje" ? DATOS.aterrizaje : null);
    practica = { evento: ev, recursos: Motor.calcularRecursos(e) };
    introMinijuego(ev, practica.recursos, 0);
  }

  function mostrarEvento(ev) {
    const s = Simulacion.estado();
    practica = null;
    if (ev.minijuego) { introMinijuego(ev, Motor.calcularRecursos(estado), s.dia); return; }
    let quien = "";
    if (estado.modo === "equipo") quien = '<div class="decide">Decide: ' + chipRol(ev.rol) + '</div>';
    let html = '<div class="evento">' + foto(ev.imagen, "foto-evento") + '<p class="etiqueta">Día ' + fmt(s.dia, 0) + ' de la misión</p>' +
      '<h2>' + ev.titulo + '</h2>' + quien + '<p>' + ev.descripcion + '</p>' +
      '<div class="paz-dice"><div class="mini-avatar">' + avatarPaz() + '</div><p><b>Ingeniera Paz:</b> ' + ev.paz + '</p></div>' +
      '<div class="opciones-evento">';
    ev.opciones.forEach(function (op, i) {
      html += '<button class="opcion-evento" data-accion="decidir" data-i="' + i + '"><strong>' + op.texto + '</strong><small>' + op.explicacion + '</small></button>';
    });
    html += '</div>' + (ev.fuentes ? '<p class="centro">' + fuentesMini(ev.fuentes) + '</p>' : '') + '</div>';
    abrirModal(html, false);
    Sonido.efecto(ev.id === "antena" || ev.id === "conjuncion" ? "pitido" : "alarma");
    Voz.decir(ev.titulo + " " + ev.paz);
  }

  function decidir(i) {
    const s = Simulacion.estado();
    const ev = s.eventoActual;
    const res = Simulacion.decidir(i);
    // Sonido según lo que pasó: impacto si chocó algo, falla o éxito en los demás casos
    if (res.salioMal) Sonido.efecto(ev.id === "basura" || ev.id === "particulas" || ev.id === "giroApofis" ? "impacto" : "fallaCorta");
    else Sonido.efecto("exitoCorto");
    Voz.decir(res.mensaje.replace(/\(.*?\)/g, ""));
    bitacora(res.salioMal ? "alerta" : "check", "<b>Día " + s.dia + ":</b> " + ev.titulo + " Elegiste: " + ev.opciones[i].texto + ". " + res.mensaje, res.salioMal ? "mal" : "bien");
    abrirModal('<div class="evento"><div class="icono-grande-svg ' + (res.salioMal ? "tono-mal" : "tono-bien") + '">' + ic(res.salioMal ? "alerta" : "check") + '</div><h2>' + (res.salioMal ? "No salió como esperábamos" : "¡Bien!") + '</h2>' +
      '<p>' + res.mensaje + '</p><div class="centro"><button class="btn btn-principal" data-accion="continuarMision">Continuar misión ' + ic("play") + '</button></div></div>', false);
  }

  function terminarSimulacion(s) {
    const r = Motor.calcularRecursos(estado);
    const informe = Motor.generarInforme(r, s);
    // Misión rápida: evaluar el contrato y sumar sus puntos al total
    if (estado.modoJuego === "rapida" && estado.contrato) {
      informe.contrato = Modos.evaluar(Modos.contrato(estado.contrato), r, informe, s, estado.lanzamiento || { aTiempo: false, minutosSobrantes: 0 });
      informe.total += informe.contrato.bono;
      // Modo historia: guardar el resultado del capítulo
      if (estado.historia) informe.capitulo = resultadoCapitulo(estado.historia.capitulo, informe.contrato.cumplidos, informe.contrato.total, informe.contrato.completo);
    }
    // Cohetes reutilizables: puntos por aterrizar la primera etapa
    if (estado.aterrizaje) { informe.aterrizaje = estado.aterrizaje; informe.total += estado.aterrizaje.puntos; }
    estado.resultado = { informe: informe, sim: s, recursos: r, guardado: false };
    estado.faseMax = 6;
    const textoFin = s.finPor === "completa" ? "¡La nave completó los " + fmt(s.duracion, 0) + " días de misión!" :
      (s.finPor === "vida" ? "La nave dejó de funcionar el día " + fmt(s.dia, 0) + "." : "La nave se quedó sin energía el día " + fmt(s.dia, 0) + ".");
    bitacora(s.finPor === "completa" ? "bandera" : "alerta", "<b>Fin:</b> " + textoFin, s.finPor === "completa" ? "bien" : "mal");
    const portada = $("#sim-portada");
    portada.classList.remove("oculto");
    portada.innerHTML = '<div class="portada-caja"><div class="icono-grande-svg ' + (s.finPor === "completa" ? "tono-bien" : "tono-mal") + '">' + ic(s.finPor === "completa" ? "bandera" : "alerta") + '</div><h3>' + textoFin + '</h3>' +
      '<p>Resultado: <b>' + informe.clasificacion + '</b></p><button class="btn btn-principal" data-accion="siguiente">Ver informe ' + ic("trofeo") + '</button></div>';
    actualizarNavegacion();
    dibujarPasos();
    // Video final: celebración real o escena de falla, y luego la música del resultado
    Videos.secuencia([informe.estrellas >= 2 ? "exito" : "falla"], r, function () {
      ponerMusica();
      Voz.decir(textoFin + " Resultado: " + informe.clasificacion);
    });
  }

  /* ---------- RÉCORDS (se guardan en este navegador) ---------- */
  const CLAVE_RECORDS = "spaceSimulator.records";
  function leerRecords() {
    let lista = leerJSON(CLAVE_RECORDS, null);
    // Si existen récords del nombre anterior del juego, se conservan
    if (!lista) lista = leerJSON("misionCondor.records", []);
    return Array.isArray(lista) ? lista : [];
  }
  function guardarRecord(nombre) {
    const res = estado.resultado;
    const lista = leerRecords();
    lista.push({ nombre: nombre, escenario: estado.escenario, dificultad: estado.dificultad, modo: estado.modoJuego, contrato: estado.contrato,
      puntos: res.informe.total, estrellas: res.informe.estrellas, fecha: new Date().toLocaleDateString("es-CL") });
    lista.sort(function (a, b) { return b.puntos - a.puntos; });
    try { localStorage.setItem(CLAVE_RECORDS, JSON.stringify(lista.slice(0, 100))); return true; } catch (e) { return false; }
  }
  function estrellasHtml(n) {
    return '<span class="estrellas-mini">' + [1, 2, 3].map(function (k) { return '<span class="' + (k <= n ? "llena" : "vacia") + '">' + ic("estrella") + '</span>'; }).join("") + '</span>';
  }
  // Ranking. filtro: { modo, contrato, escenario, dificultad, titulo, pestanas }
  let rankingModo = "completa";
  function tablaRecords(filtro) {
    filtro = filtro || {};
    const modoFiltro = filtro.modo || (filtro.pestanas ? rankingModo : null);
    const lista = leerRecords().filter(function (x) {
      const modoX = x.modo || "completa";          // los récords antiguos son de Misión completa
      return (!modoFiltro || modoX === modoFiltro) && (!filtro.contrato || x.contrato === filtro.contrato) &&
        (!filtro.escenario || x.escenario === filtro.escenario) && (!filtro.dificultad || x.dificultad === filtro.dificultad);
    }).slice(0, 5);
    let html = '<div class="tarjeta records"><h3>' + ic("medalla") + ' ' + (filtro.titulo || "Salón de la fama") + '</h3>';
    if (filtro.pestanas) {
      html += '<div class="pestanas">' + ["completa", "rapida", "marte"].map(function (id) {
        return '<button class="btn btn-mini' + (rankingModo === id ? " activa" : "") + '" data-accion="rankingModo" data-id="' + id + '">' + Modos.modo(id).nombre + '</button>';
      }).join("") + '</div>';
    }
    if (!lista.length) return html + '<p><small>Todavía no hay récords aquí en este dispositivo. ¡Sé la primera persona!</small></p></div>';
    html += '<ol>' + lista.map(function (x) {
      const esc = Motor.buscar(DATOS.escenarios, x.escenario), dif = Motor.buscar(DATOS.dificultades, x.dificultad);
      const c = x.contrato ? Modos.contrato(x.contrato) : null;
      return '<li><b>' + seguro(x.nombre) + '</b> — ' + x.puntos + ' pts ' + estrellasHtml(x.estrellas) +
        '<br><small>' + (x.modo === "marte" ? "Varado en Marte · " + (x.ganaste ? "rescatado el sol " + x.sol : "resistió hasta el sol " + x.sol) : (c ? "Contrato: " + c.nombre : (esc ? esc.nombre : ""))) +
        ' · ' + (dif ? dif.nombre : "") + ' · ' + x.fecha + '</small></li>';
    }).join("") + '</ol></div>';
    return html;
  }

  /* ---------- FASE 6: Informe final ---------- */
  function pantallaInforme() {
    const res = estado.resultado;
    const inf = res.informe, s = res.sim, r = res.recursos;
    let html = titulo(6, "Así le fue a tu misión. Lee con atención el porqué: ¡así aprenden los ingenieros de verdad!");

    html += '<div class="tarjeta informe-cabeza nivel-' + inf.estrellas + '"><div class="estrellas">' + estrellasHtml(inf.estrellas) + '</div>' +
      '<h2>' + inf.clasificacion + '</h2><p class="resumen">' + inf.resumen + '</p>' +
      '<div class="puntaje-total">' + fmt(inf.total, 0) + ' <small>puntos</small></div>' +
      '<small>(' + inf.subtotal + ' × ' + fmt(r.dificultad.multPuntaje, 1) + ' por dificultad ' + r.dificultad.nombre +
      (inf.contrato ? ' + ' + inf.contrato.bono + ' del contrato' : '') +
      (inf.aterrizaje && inf.aterrizaje.puntos ? ' + ' + inf.aterrizaje.puntos + ' del aterrizaje' : '') + ')</small></div>';

    if (inf.capitulo && estado.historia) html += tarjetaCapitulo(inf.capitulo);
    html += tarjetaCoheteInforme(r, inf);

    // Misión rápida: resultado del contrato, objetivo por objetivo
    if (inf.contrato) {
      const c = Modos.contrato(estado.contrato), k = inf.contrato;
      html += '<div class="tarjeta contrato-resultado ' + (k.completo ? "completo" : "") + '"><h3>' + ic("documento") + ' Contrato: ' + c.nombre +
        ' · ' + k.cumplidos + ' de ' + k.total + ' objetivos</h3><ul class="lista-objetivos">' +
        k.lista.map(function (o) { return '<li class="' + (o.cumplido ? "si" : "no") + '">' + ic(o.cumplido ? "check" : "cruz") + ' ' + o.texto + '</li>'; }).join("") +
        '</ul><ul class="stats en-fila">' +
        stat("objetivo", "Objetivos: +" + k.puntosObjetivos + " pts", null) +
        stat("trofeo", "Contrato completo: +" + k.puntosCompleto + " pts", null) +
        stat("reloj", "Tiempo sobrante: +" + k.puntosTiempo + " pts", null) + '</ul></div>';
    }

    html += '<div class="grid-cifras tres">' +
      '<div class="cifra"><span class="cifra-etiqueta">' + ic("ciencia") + ' Ciencia lograda</span><span class="cifra-valor">' + inf.puntosCiencia + '</span><small>' + Math.round(inf.fraccionCiencia * 100) + '% de los datos llegaron' + (s.cienciaExtra ? ' · imprevistos: ' + (s.cienciaExtra > 0 ? "+" : "") + s.cienciaExtra : '') + '</small>' + pq("ciencia", true) + '</div>' +
      '<div class="cifra"><span class="cifra-etiqueta">' + ic("moneda") + ' Presupuesto sobrante</span><span class="cifra-valor">' + inf.puntosPresupuesto + '</span><small>' + fmt(inf.sobrante) + ' M USD × ' + DATOS.config.puntosPorMillon + ' puntos</small>' + pq("presupuesto", true) + '</div>' +
      '<div class="cifra"><span class="cifra-etiqueta">' + ic("satelite") + ' Supervivencia</span><span class="cifra-valor">' + inf.puntosSupervivencia + '</span><small>' + fmt(s.dia, 0) + ' de ' + fmt(s.duracion, 0) + ' días</small>' + pq("tiempo", true) + '</div></div>';

    html += '<div class="tarjeta"><h3>' + ic("grafico") + ' Datos de la misión</h3><ul class="stats en-fila">' +
      stat("camara", "Generados: " + fmt(s.generadoGB, 1) + " GB", "gbDia") +
      stat("enviar", "Enviados a la Tierra: " + fmt(s.enviadoGB, 1) + " GB", "datosEnviados") +
      stat("basura", "Perdidos: " + fmt(s.perdidoGB, 1) + " GB", "comunicaciones") +
      (r.diasViaje ? stat("cohete", "Viaje: " + s.diasViaje + " días", "viaje") : "") +
      (r.viaje && r.viaje.mes ? stat("calendario", "Lanzamiento: " + Trayectorias.textoMes(r.viaje.mes) + " · llegada: " + Trayectorias.textoMes(r.viaje.llegada) +
        " · " + r.viaje.tipoInfo.nombre.toLowerCase() + (Math.abs(r.viaje.extra) >= 0.005 ? " · " + (r.viaje.extra > 0 ? "+" : "") + fmt(r.viaje.extra, 2) + " km/s por la fecha" : " · fecha ideal"), "ventana") : "") +
      (r.viaje && r.viaje.bonoCiencia ? stat("trofeo", "Llegaste antes del paso cercano: +" + Math.round(r.viaje.bonoCiencia * 100) + "% de ciencia", "efemerides") : "") +
      (r.masaCombustible ? stat("gota", "Combustible: " + fmt(r.masaCombustible, 0) + " kg", "ecuacionCohete") : "") + '</ul></div>';

    if (inf.mal.length) html += listaDiag("llave", "¿Qué falló y cómo mejorarlo?", inf.mal.map(function (m) {
      return '<li class="mal"><span class="diag-icono">' + ic(m.icono) + '</span><div><p>' + m.texto + '</p><p class="consejo">' + ic("idea") + ' <b>Sugerencia:</b> ' + m.consejo + '</p></div></li>';
    }));
    if (inf.bien.length) html += listaDiag("check", "Lo que funcionó bien", inf.bien.map(function (b) {
      return '<li class="bien"><span class="diag-icono">' + ic(b.icono) + '</span><div><p>' + b.texto + '</p></div></li>';
    }));
    if (s.decisiones.length) html += listaDiag("dado", "Decisiones en los imprevistos", s.decisiones.map(function (d) {
      return '<li class="' + (d.salioMal ? "mal" : "bien") + '">' + foto(d.imagen, "foto-diag") + '<div><p><b>' + d.evento + '</b> (día ' + d.dia + ') ' +
        (estado.modo === "equipo" ? chipRol(d.rol) : "") + ' — ' + d.opcion + '</p><p class="consejo">' + d.resultado + '</p></div></li>';
    }));

    html += '<div class="tarjeta"><h3>' + ic("medalla") + ' ' + (estado.modo === "equipo" ? "Medallas del equipo" : "Metas de cada rol (tú los tuviste todos)") + '</h3><div class="grid-roles">';
    DATOS.roles.forEach(function (ro) {
      const m = inf.roles[ro.id];
      html += '<div class="medalla ' + (m.logrado ? "lograda" : "") + '" style="--color-rol:' + ro.color + '"><div class="medalla-icono">' + ic(m.logrado ? "medalla" : "menos") + '</div>' +
        chipRol(ro.id) + '<p><b>Meta:</b> ' + ro.meta + '</p><small>' + m.detalle + '</small></div>';
    });
    html += '</div></div>';

    if (estado.modoJuego === "libre") {
      html += '<div class="tarjeta"><h3>' + ic("planeta") + ' Modo libre</h3><p>En este modo no hay ranking: es para experimentar. ¿Te atreves a lograr lo mismo con presupuesto en una <b>Misión completa</b> o una <b>Misión rápida</b>?</p></div>';
    } else {
      html += '<div class="tarjeta"><h3>' + ic("memoria") + ' Guardar en el salón de la fama</h3>' + (res.guardado ? '<p>' + ic("check") + ' ¡Récord guardado!</p>' :
        '<div class="fila-record"><input id="nombre-record" class="input-nombre" maxlength="24" placeholder="Nombre ' + (estado.modo === "equipo" ? "del equipo" : "") + '" value="' +
        seguro(estado.modo === "equipo" ? "" : (estado.nombres[0] || "")) + '"><button class="btn btn-principal" data-accion="guardarRecord">Guardar</button></div>') + '</div>';
      html += estado.modoJuego === "rapida"
        ? tablaRecords({ modo: "rapida", contrato: estado.contrato, dificultad: estado.dificultad, titulo: "Ranking de este contrato" })
        : tablaRecords({ modo: "completa", escenario: estado.escenario, dificultad: estado.dificultad, titulo: "Salón de la fama de esta misión" });
    }

    const preguntas = r.escenario.preguntas.concat(DATOS.preguntasReflexion);
    html += '<div class="tarjeta reflexion"><h3>' + ic("pregunta") + ' Para pensar más profundo</h3><ol>' + preguntas.map(function (p) { return "<li>" + p + "</li>"; }).join("") + '</ol></div>';

    html += '<div class="acciones-finales"><button class="btn btn-principal btn-gigante" data-accion="reintentar">' + ic("llave") + ' Mejorar mi diseño</button>' +
      '<button class="btn btn-secundario" data-accion="otraMision">' + ic("planeta") + ' Otra misión</button>' +
      '<button class="btn btn-secundario" data-accion="reiniciar">' + ic("reiniciar") + ' Empezar de cero</button></div>';
    return html;
  }

  // Informe: cómo trabajó cada etapa del cohete y si la primera aterrizó
  function tarjetaCoheteInforme(r, inf) {
    const coh = r.cohete, at = inf.aterrizaje;
    if (!coh || (!coh.propio && !at)) return "";
    let html = '<div class="tarjeta informe-cohete"><h3>' + ic("cohete") + ' Tu cohete: ' + coh.nombre + '</h3>';
    if (coh.propio) {
      const a = Cohetes.analizar(estado.coheteDiseno, r.masa);
      const necesario = DATOS.deltaVDestino[r.orbita.destinoCohete];
      html += '<p>Delta-v total con tu nave: <b>' + fmt(a.deltaV, 2) + ' km/s</b> (necesitabas ' + fmt(necesario, 1) + ' km/s). Costo: ' + fmt(coh.costo, 1) + ' M USD.</p>' +
        '<div class="cc-informe">' + a.etapas.map(function (e, k) {
          return '<div class="cc-informe-etapa"><b>Etapa ' + (k + 1) + '</b><small>' + e.cantidad + ' × ' + e.motor.nombre.toLowerCase() + '</small>' +
            '<div class="barra"><div class="barra-relleno relleno-verde" style="width:' + Math.round(e.combustibleUtil / e.combustible * 100) + '%"></div></div>' +
            '<small>' + fmt(e.combustibleUtil / 1000, 1) + ' t de combustible quemadas en ' + fmt(e.tiempo, 0) + ' s · aportó ' + fmt(e.deltaV, 2) + ' km/s' +
            (e.reutilizable ? ' · ' + fmt((e.combustible - e.combustibleUtil) / 1000, 1) + ' t guardadas para aterrizar' : '') +
            (e.recuperada ? ' · <b>etapa reusada</b>' : '') + '</small></div>';
        }).join("") + '</div>';
    }
    if (at) {
      const t = { bien: "Aterrizaje perfecto", regular: "Aterrizó, pero dañada", mal: "Se estrelló en el mar" };
      html += '<p class="' + (at.nivel === "mal" ? "texto-mal" : "texto-bien") + '">' + ic(at.nivel === "mal" ? "alerta" : "trofeo") + ' <b>' + t[at.nivel] + '</b> (' + at.pct + '%' + (at.automatico ? ', piloto automático' : '') + '). ' + at.detalle +
        (at.puntos ? ' <b>+' + at.puntos + ' puntos.</b>' : '') + '</p>' +
        (at.guardada ? '<p>' + ic("reiniciar") + ' La etapa quedó guardada en tu flota: si vuelves a lanzar este mismo cohete, la primera etapa costará ' + Math.round(DATOS.reglasCohete.reutilizable.costoReuso * 100) + '% del precio.</p>' : '');
    }
    return html + pq("reutilizable") + '</div>';
  }

  function listaDiag(icono, tituloLista, items) {
    return '<div class="tarjeta diagnostico"><h3>' + ic(icono) + ' ' + tituloLista + '</h3><ul class="lista-diagnostico">' + items.join("") + '</ul></div>';
  }

  /* =================================================================
     CAMBIO DE FASE
     ================================================================= */
  function dibujarFase() {
    const pantallas = { "-2": pantallaMarte, "-1": pantallaHangar, 0: pantallaInicio, 1: pantallaEncargo, 2: pantallaNave, 3: pantallaInstrumentos, 4: pantallaOrbitaCohete, 5: pantallaSimulacion, 6: pantallaInforme };
    $("#pantalla").innerHTML = '<section class="fase">' + pantallas[estado.fase]() + '</section>';
    if (estado.fase === 5) prepararSimulacion();
    if (estado.fase === -1) {
      Hangar.mundo.recursos = estado.escenario ? Motor.calcularRecursos(estado) : null;
      Hangar.iniciar($("#hangar"), { estadoEstacion: estadoEstacion, alEntrar: entrarEstacion });
    } else Hangar.detener();
    if (estado.fase === -2) {
      Supervivencia.mundo.nombre = estado.nombreMarte || "TÚ";
      Supervivencia.iniciar($("#sv"), { nueva: estado.marteNueva, dificultad: estado.dificultad, decirPaz: decirPaz, alTerminar: terminarMarte,
        mostrarImprevisto: imprevistoMarte, jugarDesafio: desafioMarteIntro });
      estado.marteNueva = false;
    } else Supervivencia.detener();
    montar3D();
    actualizarPanel();
    actualizarNavegacion();
    dibujarPasos();
  }

  // Pone las vistas 3D en la pantalla actual (Tierra del inicio o nave de la fase 2)
  function montar3D() {
    const hay = Vista3D.disponible();
    document.body.classList.toggle("sin-3d", !hay);
    if (!hay) return;
    if (estado.fase === 0 && $(".tierra-escena")) {
      if (Vista3D.mostrarInicio($(".tierra-escena"))) $(".tierra-escena").classList.add("con-3d");
    } else if (estado.fase === 2 && $("#visor-nave")) {
      Vista3D.mostrarNave($("#visor-nave"), Motor.calcularRecursos(estado));
    }
  }

  function irAFase(n) {
    if (n < 0 || n > 6) return;
    if (n === 6 && !estado.resultado) return;
    if (estado.fase === 5) Simulacion.detener();
    if (n === 0) estado.vistaInicio = "menu";
    estado.fase = n;
    estado.faseMax = Math.max(estado.faseMax, n);
    colaPaz = [];
    $("#paz").classList.add("oculto");
    if (n === 5) enVuelo = false;
    dibujarFase();
    ponerMusica();
    window.scrollTo({ top: 0, behavior: "smooth" });
    concepto(n === 0 ? "inicio" : "fase" + n);
    if (n === 1 && estado.modo === "equipo") concepto("equipo");
  }

  function cambioDiseno() {
    estado.resultado = null;
    soltarRecuperada();
    estado.faseMax = Math.max(estado.fase, Math.min(estado.faseMax, 5));
    dibujarFase();
  }

  /* =================================================================
     CLICS
     ================================================================= */
  function manejarAccion(el) {
    switch (el.dataset.accion) {
      case "siguiente":
        if (estado.fase === 0) { comenzar(); break; }
        if (estado.fase === -1) { irAFase(proximaFase()); break; }
        if (puedeAvanzar(estado.fase).ok) irAFase(estado.fase + 1);
        break;
      case "anterior":
        if (estado.fase === 0) { estado.vistaInicio = estado.vistaInicio === "modos" ? "menu" : "modos"; dibujarFase(); break; }
        if (estado.fase === -1) { irAFase(0); break; }
        if (estado.fase === -2) { if (estado.historia) volverHistoria(); else salirMarte(); break; }
        if (estado.fase === 1) { irHangar(); break; }       // de la fase 1 se vuelve al centro de control
        irAFase(estado.fase - 1);
        break;
      case "irHangar": irHangar(); break;
      case "marteOtraVez": cerrarModal(); irMarte(true); break;
      case "decidirMarte": decidirMarte(Number(el.dataset.i)); break;
      case "jugarMarte": desafioMarteJugar(); break;
      case "autoMarte": desafioMarteResultado(0.45 + Math.random() * 0.15, "El computador de la base hizo lo justo."); break;
      case "volverMarte": volverMarte(el.dataset.nivel, Number(el.dataset.pct)); break;
      case "guardarRecordMarte": guardarRecordMarte(); break;
      case "marteSalir": cerrarModal(); if (estado.historia) volverHistoria(); else salirMarte(); break;
      case "jugarCapitulo": cerrarModal(); introCapitulo(Number(el.dataset.n)); break;
      case "empezarCapitulo": empezarCapitulo(Number(el.dataset.n)); break;
      case "historiaVolver": volverHistoria(); break;
      case "historiaEpilogo": epilogo(); break;
      case "historiaBorrar":
        if (confirm("¿Borrar todo el progreso de la historia en este navegador? No se puede deshacer.")) { try { localStorage.removeItem(CLAVE_HISTORIA); } catch (e) { /* nada */ } estado.nombreHistoria = ""; dibujarFase(); }
        break;
      case "estacion": entrarEstacion(Hangar.estaciones().find(function (x) { return x.id === el.dataset.id; })); break;
      case "irFase": irAFase(Number(el.dataset.fase)); break;
      case "menuJugar": estado.modo = "individual"; estado.vistaInicio = "jugar"; dibujarFase(); window.scrollTo(0, 0); break;
      case "menuModos": estado.vistaInicio = "modos"; dibujarFase(); window.scrollTo(0, 0); break;
      case "elegirModoJuego": {
        const id = el.dataset.id;
        estado.vistaInicio = id === "completa" ? "jugar" : id;
        estado.historia = null;                       // elegir otro modo sale de la historia
        if (id === "equipo") estado.modo = "equipo";
        dibujarFase(); window.scrollTo(0, 0);
        break;
      }
      case "elegirContrato": estado.contrato = el.dataset.id; dibujarFase(); break;
      case "rankingModo": rankingModo = el.dataset.id; dibujarFase(); break;
      case "menuEquipo": estado.modo = "equipo"; estado.vistaInicio = "equipo"; dibujarFase(); window.scrollTo(0, 0); break;
      case "comenzar": comenzar(); break;
      case "opciones": abrirOpciones(); break;
      case "silenciar": opciones.silencio = !opciones.silencio; guardarOpciones(); break;
      case "probarEfecto": Sonido.efecto(el.dataset.e); break;
      case "probarVoz": Voz.decir("Hola, soy la Ingeniera Paz. Así sueno a esta velocidad."); break;
      case "repetirVoz": if (ultimoPaz) Voz.decir(ultimoPaz.titulo + ". " + ultimoPaz.texto); break;
      case "creditos": abrirCreditos(); break;
      case "porque": abrirPorQue(el.dataset.clave); break;
      case "fuentes": abrirFuentes(false); break;
      case "fuentesEscenario": abrirFuentes(true); break;
      case "cerrarModal": cerrarModal(); break;
      case "cerrarPaz": siguientePaz(); break;
      case "abrirPaz": {
        const c = estado.fase === 0 ? DATOS.conceptos.inicio :
          (estado.fase === -2 ? { titulo: "Varado en Marte", texto: "Camina con las flechas o WASD (en tablet, con el control). Acércate a un lugar y pulsa E para trabajar. Mira el panel: oxígeno, agua, comida y energía deben durar hasta el rescate. De noche hace mucho frío y el traje se gasta más rápido." } :
           estado.fase === -1 ? { titulo: "El centro de control", texto: "Camina con las flechas o WASD hasta una estación y pulsa E o ENTRAR. También puedes tocar los botones de abajo." } : DATOS.conceptos["fase" + estado.fase]);
        colaPaz = [];
        decirPaz(c.titulo, c.texto);
        break;
      }
      case "numJugadores": estado.numJugadores = Number(el.dataset.n); dibujarFase(); break;
      case "elegirDificultad": estado.dificultad = el.dataset.id; cambioDiseno(); break;
      case "elegirEscenario": {
        if (estado.escenario !== el.dataset.id) {
          // Cada escenario tiene sus propios instrumentos y órbitas
          estado.escenario = el.dataset.id;
          estado.instrumentos = [];
          estado.orbita = null;
          estado.cohete = null;
          estado.trayectoria = null;
          if (Motor.escenario(estado).propulsionObligatoria && estado.componentes.propulsion === "ninguna") estado.componentes.propulsion = null;
        }
        cambioDiseno();
        const esc = Motor.escenario(estado);
        concepto("presupuesto"); concepto("duracion");
        if (!estado.conceptosVistos["intro_" + esc.id]) { estado.conceptosVistos["intro_" + esc.id] = true; decirPaz(esc.intro.titulo, esc.intro.texto); }
        break;
      }
      case "elegirPieza": {
        const comp = Motor.buscar(DATOS.componentes, el.dataset.comp);
        estado.componentes[comp.id] = el.dataset.version;
        cambioDiseno();
        concepto(comp.concepto);
        break;
      }
      case "alternarInstrumento": {
        const pos = estado.instrumentos.indexOf(el.dataset.id);
        if (pos >= 0) estado.instrumentos.splice(pos, 1); else estado.instrumentos.push(el.dataset.id);
        cambioDiseno();
        concepto("datos"); concepto("ciencia");
        break;
      }
      case "elegirOrbita": estado.orbita = el.dataset.id; cambioDiseno(); break;
      case "elegirMes":
        estado.trayectoria = Object.assign({ tipo: "directa" }, estado.trayectoria, { mes: el.dataset.mes });
        cambioDiseno(); concepto("planificador");
        break;
      case "elegirTipoViaje":
        estado.trayectoria = Object.assign({ mes: null }, estado.trayectoria, { tipo: el.dataset.id });
        cambioDiseno();
        if (el.dataset.id === "asistencia" && !estado.conceptosVistos.asistenciaPaz) { estado.conceptosVistos.asistenciaPaz = true; decirPaz(DATOS.porQue.asistencia.titulo, DATOS.porQue.asistencia.texto); }
        break;
      case "cohMotor": case "cohTanque": case "cohCantidad": case "cohReutil": case "cohAgregarEtapa": case "cohQuitarEtapa":
        cambiarCohete(el.dataset.accion, el); break;
      case "elegirCohete": {
        estado.cohete = el.dataset.id;
        if (el.dataset.id === "propio") {
          if (!estado.coheteDiseno) estado.coheteDiseno = Cohetes.disenoPorDefecto();
          concepto("cohetePropio");
        }
        cambioDiseno();
        concepto("cohete");
        if (el.dataset.id === "rideshare") concepto("rideshare");
        const r = Motor.calcularRecursos(estado);
        if (r.capacidadCohete !== null && r.masa > r.capacidadCohete) concepto("incompatible");
        break;
      }
      case "lanzar": lanzar(); break;
      case "velocidad":
        Simulacion.cambiarVelocidad(Number(el.dataset.v));
        document.querySelectorAll(".vel").forEach(function (b) { b.classList.toggle("activa", b === el); });
        break;
      case "decidir": decidir(Number(el.dataset.i)); break;
      case "jugarMinijuego": jugarMinijuego(); break;
      case "pilotoAutomatico": pilotoAutomatico(); break;
      case "practicar": abrirPractica(); break;
      case "practicarTipo": practicar(el.dataset.tipo); break;
      case "continuarMision": cerrarModal(); Simulacion.reanudar(); break;
      case "continuarDespegue": cerrarModal(); if (estado.fase === 5) seguirVuelo(); break;
      case "guardarRecord": {
        const nombre = ($("#nombre-record").value || "").trim() || (estado.modo === "equipo" ? "Equipo sin nombre" : "Anónimo");
        if (guardarRecord(nombre)) { estado.resultado.guardado = true; dibujarFase(); }
        else decirPaz("No se pudo guardar", "Este navegador no permite guardar récords (quizás está en modo privado).");
        break;
      }
      case "reintentar":
        estado.resultado = null;
        estado.faseMax = 5;
        // Misión rápida: el reloj vuelve a correr para el nuevo intento
        if (estado.modoJuego === "rapida") {
          estado.lanzamiento = null;
          Modos.iniciarReloj(Modos.contrato(estado.contrato).minutos, function () {
            if (!estado.lanzamiento) { Sonido.efecto("alarma"); decirPaz("¡Se acabó el tiempo!", "El reloj llegó a cero. Puedes lanzar igual, pero sin el bono de tiempo."); }
          });
        }
        irAFase(2);
        decirPaz("¡A mejorar!", "Tu diseño anterior sigue aquí. Cambia lo que falló según el informe y vuelve a lanzar. ¡Así trabajan los ingenieros de verdad!");
        break;
      case "otraMision":
        estado.resultado = null;
        Modos.detenerReloj();
        if (estado.historia) { volverHistoria(); break; }
        if (estado.modoJuego === "rapida") { estado.contrato = null; estado.vistaInicio = "rapida"; estado.faseMax = 0; irAFase(0); estado.vistaInicio = "rapida"; dibujarFase(); break; }
        estado.faseMax = 1;
        irAFase(1);
        break;
      case "reiniciar":
        Modos.detenerReloj();
        estado.contrato = null; estado.modoJuego = "completa"; estado.lanzamiento = null;
        estado.escenario = null; estado.instrumentos = []; estado.orbita = null; estado.cohete = null; estado.trayectoria = null; estado.resultado = null; estado.faseMax = 0;
        DATOS.componentes.forEach(function (c) { estado.componentes[c.id] = null; });
        irAFase(0);
        break;
    }
  }

  // Sonido de cada botón: "seleccionar" al elegir algo, "clic" en el resto
  const ACCIONES_ELEGIR = ["elegirEscenario", "elegirPieza", "alternarInstrumento", "elegirOrbita", "elegirCohete", "elegirDificultad", "numJugadores", "elegirMes", "elegirTipoViaje",
    "cohMotor", "cohTanque", "cohCantidad", "cohReutil", "cohAgregarEtapa", "cohQuitarEtapa"];
  const ACCIONES_SIN_CLIC = ["probarEfecto", "lanzar", "decidir", "jugarMinijuego", "pilotoAutomatico", "estacion"];   // ya tienen su propio sonido

  document.addEventListener("click", function (e) {
    if (e.target.closest("a")) return;              // los enlaces no seleccionan la tarjeta
    const el = e.target.closest("[data-accion]");
    if (el && !el.disabled) {
      const a = el.dataset.accion;
      if (ACCIONES_ELEGIR.indexOf(a) >= 0) Sonido.efecto("seleccionar");
      else if (ACCIONES_SIN_CLIC.indexOf(a) < 0) Sonido.efecto("clic");
      manejarAccion(el);
    }
  });

  // Los navegadores solo dejan sonar audio después del primer toque o tecla
  ["pointerdown", "keydown"].forEach(function (tipo) {
    document.addEventListener(tipo, function () { Sonido.desbloquear(); }, { once: true });
  });

  // Nombres, deslizadores y casillas de Opciones (se guardan al momento)
  document.addEventListener("input", function (e) {
    const t = e.target;
    if (t.matches(".input-nombre[data-i]")) estado.nombres[Number(t.dataset.i)] = t.value;
    else if (t.id === "op-musica") { opciones.volMusica = Number(t.value); guardarOpciones(); }
    else if (t.id === "op-efectos") { opciones.volEfectos = Number(t.value); guardarOpciones(); }
    else if (t.id === "op-velocidad") { opciones.vozVelocidad = Number(t.value); $("#op-velocidad-txt").textContent = fmt(opciones.vozVelocidad, 2) + "×"; guardarOpciones(); }
  });
  document.addEventListener("change", function (e) {
    const t = e.target;
    if (t.id === "op-calidad") {
      opciones.calidadBaja = t.checked; guardarOpciones(); dibujarEstrellas();
      if (estado.fase !== 5) dibujarFase();          // activa o quita el 3D de la pantalla actual
    }
    else if (t.id === "op-silencio") { opciones.silencio = t.checked; guardarOpciones(); }
    else if (t.id === "op-voz") { opciones.vozActiva = t.checked; guardarOpciones(); }
    else if (t.id === "op-pista") { opciones.pista = t.value; guardarOpciones(); ponerMusica(); }
    else if (t.id === "op-efectos") Sonido.efecto("exitoCorto");      // muestra cómo suena el nuevo volumen
  });

  document.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.getAttribute("role") === "button") {
      e.preventDefault();
      manejarAccion(e.target);
    }
    if (e.key === "Escape" && $("#modal").dataset.cerrable === "si") cerrarModal();
  });

  $("#modal").addEventListener("click", function (e) {
    if (e.target.id === "modal" && $("#modal").dataset.cerrable === "si") cerrarModal();
  });

  /* =================================================================
     FONDO DE ESTRELLAS
     ================================================================= */
  function dibujarEstrellas() {
    const c = $("#estrellas");
    const ratio = window.devicePixelRatio || 1;
    c.width = window.innerWidth * ratio; c.height = window.innerHeight * ratio;
    const g = c.getContext("2d");
    g.scale(ratio, ratio);
    const cantidad = Math.round(window.innerWidth * window.innerHeight / (opciones.calidadBaja ? 12000 : 4500));
    const colores = ["255,255,255", "180,210,255", "255,230,180"];
    for (let i = 0; i < cantidad; i++) {
      const radio = Math.random() < 0.9 ? Math.random() * 1.1 + 0.2 : Math.random() * 1.8 + 1;
      g.fillStyle = "rgba(" + colores[i % 3] + "," + (0.4 + Math.random() * 0.6) + ")";
      g.beginPath(); g.arc(Math.random() * window.innerWidth, Math.random() * window.innerHeight, radio, 0, Math.PI * 2); g.fill();
    }
  }

  /* =================================================================
     ¡ARRANCAR!
     ================================================================= */
  $("#paz-avatar").innerHTML = avatarPaz();
  $("#paz-boton").innerHTML = avatarPaz();
  $("#paz-repetir").innerHTML = ic("hablar");
  $("#boton-opciones").innerHTML = ic("engranaje");
  aplicarOpciones(false);
  dibujarEstrellas();
  window.addEventListener("resize", dibujarEstrellas);
  construirPanel();
  irAFase(0);

  // Solo en prueba.html (ambiente de prueba): atajos para el panel de pruebas (js/prueba.js)
  if (window.MODO_PRUEBA) {
    window.PruebaJuego = {
      estado: estado, irAFase: irAFase, irHangar: irHangar, redibujar: dibujarFase, cambioDiseno: cambioDiseno,
      practicar: practicar, lanzar: lanzar, decirPaz: decirPaz, cerrarModal: cerrarModal,
      irMarte: irMarte, volverHistoria: volverHistoria, introCapitulo: introCapitulo,
      recursos: function () { return Motor.calcularRecursos(estado); }
    };
  }

})();
