/* =====================================================================
   hangar.js — El centro de control: caminar hasta cada estación
   ---------------------------------------------------------------------
   El jugador maneja a un astronauta con las flechas o WASD (en tablet,
   con el control táctil en pantalla) y camina hasta una estación:
     Comunicaciones → fase 1 (recibir el encargo) o el informe final
     Diseño de nave → fase 2
     Instrumentos   → fase 3
     Lanzamiento    → fase 4 (órbita y cohete) y luego el despegue
   Cerca de una estación, se entra con E, Espacio, Enter o el botón ENTRAR.
   Este archivo tiene la LÓGICA (movimiento, choques, cercanía) y el dibujo
   2D de respaldo. El dibujo 3D está en vista3d.js (mostrarHangar).
   ===================================================================== */

const Hangar = (function () {

  const ic = Iconos.svg;
  const LIM_X = 9, LIM_Z = 6.6;           // tamaño de la sala (en metros del juego)
  const RADIO_ESTACION = 1.5;             // no se puede atravesar la estación
  const DIST_USO = 2.7;                   // distancia para poder entrar
  const VELOCIDAD = 4.3;

  // Posiciones y aspecto de cada estación
  const ESTACIONES = [
    { id: "comunicaciones", nombre: "Comunicaciones", fase: 1, x: -6, z: -3.6, color: "#4cc9f0", icono: "antena" },
    { id: "diseno", nombre: "Diseño de nave", fase: 2, x: 6, z: -3.6, color: "#ffb703", icono: "satelite" },
    { id: "instrumentos", nombre: "Instrumentos", fase: 3, x: -6, z: 3.6, color: "#3ddc84", icono: "telescopio" },
    { id: "lanzamiento", nombre: "Lanzamiento", fase: 4, x: 6, z: 3.6, color: "#ff7b00", icono: "cohete" }
  ];

  // El "mundo" que comparten la lógica y los dibujos 2D y 3D
  const mundo = {
    jugador: { x: 0, z: 1.5, ang: Math.PI, andando: 0, paso: 0 },
    estaciones: ESTACIONES,
    cerca: null,
    actualizar: actualizar
  };

  const teclas = { arriba: false, abajo: false, izquierda: false, derecha: false };
  const palanca = { x: 0, z: 0 };         // joystick táctil (−1 a 1)
  let opciones = null, activo = false, raf2D = null, ctx2D = null;

  /* ---------- Movimiento, choques y cercanía ---------- */
  function actualizar(dt) {
    const j = mundo.jugador;
    let dx = (teclas.derecha ? 1 : 0) - (teclas.izquierda ? 1 : 0) + palanca.x;
    let dz = (teclas.abajo ? 1 : 0) - (teclas.arriba ? 1 : 0) + palanca.z;
    const largo = Math.hypot(dx, dz);
    if (largo > 1) { dx /= largo; dz /= largo; }
    const moviendo = largo > 0.08;
    if (moviendo) {
      j.x += dx * VELOCIDAD * dt;
      j.z += dz * VELOCIDAD * dt;
      // Gira suavemente hacia donde camina
      const objetivo = Math.atan2(dx, dz);
      let dif = objetivo - j.ang;
      while (dif > Math.PI) dif -= Math.PI * 2;
      while (dif < -Math.PI) dif += Math.PI * 2;
      j.ang += dif * Math.min(1, dt * 12);
      j.paso += dt * VELOCIDAD * Math.min(1, largo) * 2.2;
    }
    j.andando += ((moviendo ? 1 : 0) - j.andando) * Math.min(1, dt * 8);
    // Paredes
    j.x = Math.max(-LIM_X, Math.min(LIM_X, j.x));
    j.z = Math.max(-LIM_Z, Math.min(LIM_Z, j.z));
    // Estaciones y mesa central: empujar hacia afuera
    ESTACIONES.concat([{ x: 0, z: -0.6, radio: 1.2 }]).forEach(function (e) {
      const r = e.radio || RADIO_ESTACION;
      const ex = j.x - e.x, ez = j.z - e.z, d = Math.hypot(ex, ez);
      if (d < r && d > 0.0001) { j.x = e.x + ex / d * r; j.z = e.z + ez / d * r; }
    });
    // ¿Qué estación está cerca?
    let cerca = null, mejor = DIST_USO;
    ESTACIONES.forEach(function (e) { const d = Math.hypot(j.x - e.x, j.z - e.z); if (d < mejor) { mejor = d; cerca = e; } });
    if (cerca !== mundo.cerca) { mundo.cerca = cerca; avisoCercania(); }
  }

  function infoEstacion(e) { return opciones && opciones.estadoEstacion ? opciones.estadoEstacion(e) : { bloqueada: false, hecha: false, texto: "" }; }

  function avisoCercania() {
    const aviso = document.getElementById("hangar-aviso");
    if (!aviso) return;
    const e = mundo.cerca;
    if (!e) { aviso.innerHTML = '<span>Camina hasta una estación con las flechas, WASD o el control.</span>'; aviso.className = "hangar-aviso"; return; }
    const info = infoEstacion(e);
    aviso.className = "hangar-aviso cerca" + (info.bloqueada ? " bloqueada" : "");
    aviso.innerHTML = ic(e.icono) + ' <b>' + e.nombre + '</b> · ' + info.texto +
      '<button class="btn btn-principal btn-mini hangar-entrar-aviso" data-hangar="entrar">' + (info.bloqueada ? ic("candado") + " Bloqueada" : "Entrar (E)") + '</button>';
    Sonido.efecto(info.bloqueada ? "error" : "pitido");
  }

  function entrar(id) {
    const e = id ? ESTACIONES.find(function (x) { return x.id === id; }) : mundo.cerca;
    if (!e || !opciones) return;
    opciones.alEntrar(e);
  }

  /* ---------- Teclado ---------- */
  const MAPA = { ArrowUp: "arriba", w: "arriba", W: "arriba", ArrowDown: "abajo", s: "abajo", S: "abajo",
    ArrowLeft: "izquierda", a: "izquierda", A: "izquierda", ArrowRight: "derecha", d: "derecha", D: "derecha" };
  function puedeUsarTeclado(e) {
    if (!activo) return false;
    if (!document.getElementById("modal").classList.contains("oculto")) return false;     // hay una ventana abierta
    const t = e.target;
    return !(t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA"));
  }
  window.addEventListener("keydown", function (e) {
    if (!puedeUsarTeclado(e)) return;
    if (MAPA[e.key]) { teclas[MAPA[e.key]] = true; e.preventDefault(); e.stopPropagation(); }
    else if ((e.key === "e" || e.key === "E" || e.key === " " || e.key === "Enter") && mundo.cerca) { e.preventDefault(); e.stopPropagation(); entrar(); }
  }, true);
  window.addEventListener("keyup", function (e) { if (MAPA[e.key]) teclas[MAPA[e.key]] = false; });
  window.addEventListener("blur", function () { Object.keys(teclas).forEach(function (k) { teclas[k] = false; }); });

  /* ---------- Control táctil (joystick) ---------- */
  function instalarPalanca(base) {
    const perilla = base.querySelector(".palanca-perilla");
    let id = null, cx = 0, cy = 0;
    const radio = 46;
    function mover(e) {
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > radio) { dx = dx / d * radio; dy = dy / d * radio; }
      perilla.style.transform = "translate(" + dx + "px," + dy + "px)";
      palanca.x = dx / radio; palanca.z = dy / radio;
    }
    base.addEventListener("pointerdown", function (e) {
      id = e.pointerId; const b = base.getBoundingClientRect(); cx = b.left + b.width / 2; cy = b.top + b.height / 2;
      base.setPointerCapture(id); mover(e); e.preventDefault();
    });
    base.addEventListener("pointermove", function (e) { if (e.pointerId === id) mover(e); });
    const soltar = function (e) { if (e.pointerId !== id) return; id = null; palanca.x = 0; palanca.z = 0; perilla.style.transform = ""; };
    base.addEventListener("pointerup", soltar); base.addEventListener("pointercancel", soltar);
  }

  /* =================================================================
     DIBUJO 2D DE RESPALDO (sin 3D o con "Calidad baja"): vista desde arriba
     ================================================================= */
  function iniciar2D(area) {
    const c = document.createElement("canvas");
    c.className = "hangar-2d";
    area.appendChild(c);
    ctx2D = c.getContext("2d");
    let ultimo = performance.now();
    function paso(t) {
      if (!activo || !document.body.contains(c)) { raf2D = null; return; }
      const dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t;
      actualizar(dt);
      dibujar2D(c);
      raf2D = requestAnimationFrame(paso);
    }
    raf2D = requestAnimationFrame(paso);
  }

  function dibujar2D(c) {
    const caja = c.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    if (c.width !== Math.round(caja.width * ratio)) { c.width = caja.width * ratio; c.height = caja.height * ratio; }
    const g = ctx2D; g.setTransform(ratio, 0, 0, ratio, 0, 0);
    const W = caja.width, H = caja.height;
    const esc = Math.min(W / ((LIM_X + 1.5) * 2), H / ((LIM_Z + 1.5) * 2));
    const px = function (x) { return W / 2 + x * esc; }, pz = function (z) { return H / 2 + z * esc; };
    // Piso
    g.fillStyle = "#0d1433"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(120,150,255,0.12)"; g.lineWidth = 1;
    for (let x = -LIM_X; x <= LIM_X; x++) { g.beginPath(); g.moveTo(px(x), pz(-LIM_Z - 1)); g.lineTo(px(x), pz(LIM_Z + 1)); g.stroke(); }
    for (let z = -LIM_Z - 1; z <= LIM_Z + 1; z++) { g.beginPath(); g.moveTo(px(-LIM_X - 1), pz(z)); g.lineTo(px(LIM_X + 1), pz(z)); g.stroke(); }
    g.strokeStyle = "#4cc9f0"; g.lineWidth = 3; g.strokeRect(px(-LIM_X - 1), pz(-LIM_Z - 1), (LIM_X + 1) * 2 * esc, (LIM_Z + 1) * 2 * esc);
    // Mesa central
    g.fillStyle = "rgba(76,201,240,0.25)"; g.beginPath(); g.arc(px(0), pz(-0.6), 1.1 * esc, 0, Math.PI * 2); g.fill();
    // Estaciones
    ESTACIONES.forEach(function (e) {
      const info = infoEstacion(e), cerca = mundo.cerca === e;
      g.fillStyle = info.bloqueada ? "#3a3f55" : e.color;
      g.globalAlpha = cerca ? 1 : 0.75;
      g.beginPath(); g.arc(px(e.x), pz(e.z), RADIO_ESTACION * esc * 0.85, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      if (cerca) { g.strokeStyle = "#fff"; g.lineWidth = 3; g.beginPath(); g.arc(px(e.x), pz(e.z), DIST_USO * esc, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = "#fff"; g.font = "bold " + Math.max(12, esc * 0.42) + "px sans-serif"; g.textAlign = "center";
      g.fillText(e.nombre, px(e.x), pz(e.z) - RADIO_ESTACION * esc - 6);
      g.font = Math.max(11, esc * 0.32) + "px sans-serif"; g.fillStyle = "#c8d4ff";
      g.fillText(info.hecha ? "Lista" : (info.bloqueada ? "Bloqueada" : "Fase " + e.fase), px(e.x), pz(e.z) + 5);
    });
    // Astronauta (visto desde arriba: casco blanco y visor dorado mirando hacia donde camina)
    const j = mundo.jugador;
    g.save(); g.translate(px(j.x), pz(j.z)); g.rotate(-j.ang);
    g.fillStyle = "#c9ccd3"; g.fillRect(-0.32 * esc, -0.42 * esc, 0.64 * esc, 0.3 * esc);          // mochila
    g.fillStyle = "#f2f2f2"; g.beginPath(); g.arc(0, 0, 0.38 * esc, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#d4a017"; g.beginPath(); g.arc(0, 0.12 * esc, 0.26 * esc, 0.15 * Math.PI, 0.85 * Math.PI); g.fill();
    g.restore();
    g.textAlign = "left";
  }

  /* =================================================================
     INICIAR / DETENER
     ================================================================= */
  // contenedor: donde va la sala · op: { estadoEstacion(e), alEntrar(e) }
  function iniciar(contenedor, op) {
    opciones = op; activo = true;
    Object.keys(teclas).forEach(function (k) { teclas[k] = false; });
    mundo.cerca = null;
    contenedor.innerHTML =
      '<div class="hangar-area" id="hangar-area"></div>' +
      '<div class="hangar-aviso" id="hangar-aviso"></div>' +
      '<div class="hangar-tactil">' +
        '<div class="palanca" aria-label="Control para caminar"><div class="palanca-perilla"></div></div>' +
        '<button class="mj-boton mj-accion hangar-entrar" data-hangar="entrar">' + ic("play") + ' ENTRAR</button>' +
      '</div>';
    instalarPalanca(contenedor.querySelector(".palanca"));
    contenedor.addEventListener("click", function (e) { if (e.target.closest('[data-hangar="entrar"]')) entrar(); });
    avisoCercania();
    const area = contenedor.querySelector("#hangar-area");
    if (!(Vista3D.disponible() && Vista3D.mostrarHangar(area, mundo, op.estadoEstacion))) iniciar2D(area);
  }

  function detener() { activo = false; palanca.x = 0; palanca.z = 0; }

  return { iniciar: iniciar, detener: detener, entrar: entrar, estaciones: function () { return ESTACIONES; }, mundo: mundo };
})();
