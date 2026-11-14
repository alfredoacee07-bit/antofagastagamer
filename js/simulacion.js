/* =====================================================================
   simulacion.js — La misión funcionando (fase 5)
   ---------------------------------------------------------------------
   Hace dos cosas al mismo tiempo:
     1. CUENTAS: primero el viaje, luego la misión día por día
        (batería, datos, imprevistos).
     2. DIBUJO: anima la nave alrededor de la Tierra, la Luna, Marte
        o el asteroide en un <canvas>.
   La interfaz recibe avisos con: alActualizar(s), alEvento(evento), alTerminar(s)
   ===================================================================== */

const Simulacion = (function () {

  let s = null;          // estado de la simulación
  let r = null;          // recursos calculados por el motor
  let cb = null;         // funciones de aviso hacia la interfaz
  let canvas = null, ctx = null;
  let animacion = null, ultimoTiempo = 0;
  let angulo = 0, estela = [];
  let vistaExterna = false;   // true = la vista 3D (vista3d.js) dibuja la escena en vez del canvas 2D

  function mezclar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = copia[i]; copia[i] = copia[j]; copia[j] = t;
    }
    return copia;
  }

  /* ---------- Preparar una misión nueva ---------- */
  function crear(recursos) {
    r = recursos;
    const dif = r.dificultad;
    const dur = r.escenario.duracionDias;
    const vidaDias = Math.round(r.vidaAnios * 365);

    // Elegimos los imprevistos según la dificultad
    const pool = r.escenario.eventos
      .map(function (id) { return DATOS.eventos.find(function (ev) { return ev.id === id; }); })
      .filter(function (ev) {
        return ev && (!ev.soloDificil || dif.fallasExtra) &&
          (!ev.soloOrbitas || ev.soloOrbitas.indexOf(r.orbita.id) >= 0);    // algunos solo pasan en ciertas órbitas
      });
    const cantidad = Math.min(pool.length, dif.eventosMin + Math.floor(Math.random() * (dif.eventosMax - dif.eventosMin + 1)));
    const elegidos = mezclar(pool).slice(0, cantidad);
    const tramo = Math.min(dur, vidaDias);
    const programados = elegidos.map(function (ev, k) {
      const base = tramo * (k + 1) / (cantidad + 1);
      const variacion = (Math.random() - 0.5) * 0.12 * tramo;
      return { dia: Math.max(5, Math.round(base + variacion)), evento: ev };
    }).sort(function (a, b) { return a.dia - b.dia; });

    s = {
      dia: 0, duracion: dur, vidaDias: vidaDias,
      diasViaje: r.diasViaje, diaViaje: 0, enViaje: r.diasViaje > 0,
      bateriaWh: r.capBat,
      almacenGB: 0, generadoGB: 0, enviadoGB: 0, perdidoGB: 0,
      sinEnergia: false, diasSinEnergia: 0, diasApagadaTotal: 0,
      seguroDias: 0, bajadaTempDias: 0, bajadaTempFactor: 1,
      mods: { generacion: 1, bajada: 1 },
      vidaPerdidaEventos: 0, cienciaExtra: 0,
      eventos: programados, eventoActual: null, decisiones: [],
      pausada: false, terminada: false, finPor: null,
      velocidad: 1, acumulador: 0, instrumentosOn: true
    };
    angulo = 0; estela = [];
  }

  /* ---------- Un día de VIAJE (sin ciencia) ---------- */
  function simularDiaViaje() {
    s.diaViaje++;
    if (s.diaViaje >= s.diasViaje) {
      s.enViaje = false;
      if (cb && cb.alLlegar) cb.alLlegar(s);
    }
  }

  /* ---------- Un día de MISIÓN ---------- */
  function simularDia() {
    const cfg = DATOS.config;
    const orb = r.orbita;
    s.dia++;

    // 1. ENERGÍA
    const desgaste = Math.max(0.5, 1 - cfg.degradacionPanelesAnual * ((s.dia + s.diasViaje) / 365));
    const genProm = r.genMax * s.mods.generacion * desgaste * (1 - orb.eclipseFraccion);

    const encendidos = s.seguroDias === 0 && !s.sinEnergia;
    if (s.seguroDias > 0) s.seguroDias--;

    // Si la batería no aguanta una sombra completa, los instrumentos solo funcionan al sol
    let factorEncendido = encendidos ? 1 : 0;
    if (encendidos && r.necesidadSombra > r.capBat) factorEncendido = 1 - orb.eclipseFraccion;

    const consumo = r.consumoPlataforma + r.consumoInstr * factorEncendido;
    s.bateriaWh = Math.max(0, Math.min(r.capBat, s.bateriaWh + (genProm - consumo) * 24));

    if (s.bateriaWh <= 0) {
      if (!encendidos && s.seguroDias === 0) s.diasApagadaTotal++;
      s.sinEnergia = true;
    } else if (s.sinEnergia && s.bateriaWh >= r.capBat * 0.5) {
      s.sinEnergia = false;
      s.diasApagadaTotal = 0;
    }
    if (s.sinEnergia && !encendidos) s.diasSinEnergia++;
    s.instrumentosOn = factorEncendido > 0;
    if (s.diasApagadaTotal >= 5) { terminar("energia"); return; }

    // 2. DATOS: se guardan, lo que no cabe se pierde, y la antena envía lo que alcanza
    const generadoHoy = r.gbDia * factorEncendido;
    s.generadoGB += generadoHoy;
    s.almacenGB += generadoHoy;
    if (s.almacenGB > r.memoria) { s.perdidoGB += s.almacenGB - r.memoria; s.almacenGB = r.memoria; }

    let bajadaHoy = r.bajada * s.mods.bajada;
    if (s.bajadaTempDias > 0) { bajadaHoy *= s.bajadaTempFactor; s.bajadaTempDias--; }
    const enviadoHoy = Math.min(s.almacenGB, bajadaHoy);
    s.enviadoGB += enviadoHoy;
    s.almacenGB -= enviadoHoy;

    // 3. ¿TERMINÓ?
    if (s.dia >= s.vidaDias) { terminar("vida"); return; }
    if (s.dia >= s.duracion) { terminar("completa"); return; }

    // 4. ¿IMPREVISTO?
    if (s.eventos.length > 0 && s.dia >= s.eventos[0].dia) {
      s.eventoActual = s.eventos.shift().evento;
      s.pausada = true;
      if (cb && cb.alEvento) cb.alEvento(s.eventoActual);
    }
  }

  function terminar(motivo) {
    s.terminada = true;
    s.finPor = motivo;
    if (cb && cb.alTerminar) cb.alTerminar(s);
  }

  /* ---------- Decisiones ante imprevistos ---------- */
  function aplicarCambios(c) {
    if (!c) return "";
    let extra = "";
    if (c.seguroDias) s.seguroDias += c.seguroDias;
    if (c.bajadaTemporal) { s.bajadaTempFactor = c.bajadaTemporal.factor; s.bajadaTempDias = c.bajadaTemporal.dias; }
    if (c.generacion) s.mods.generacion = Math.max(0.2, s.mods.generacion + c.generacion);
    if (c.bajada) s.mods.bajada = Math.max(0.1, s.mods.bajada + c.bajada);
    if (c.vidaDias) { s.vidaDias += c.vidaDias; s.vidaPerdidaEventos -= c.vidaDias; }
    if (c.borrarMemoria) { s.perdidoGB += s.almacenGB; s.almacenGB = 0; }
    if (c.cienciaExtra) s.cienciaExtra += c.cienciaExtra;
    if (c.bonoInstrumento) {
      const lleva = r.instrumentos.some(function (i) { return i.id === c.bonoInstrumento.id; });
      if (lleva) { s.cienciaExtra += c.bonoInstrumento.puntos; extra = " ¡Tu instrumento era perfecto para esto! (+" + c.bonoInstrumento.puntos + " puntos)"; }
      else extra = " Pero no llevabas el instrumento adecuado, así que casi no sumaste ciencia.";
    }
    return extra;
  }

  function decidir(indiceOpcion) {
    const ev = s.eventoActual;
    const op = ev.opciones[indiceOpcion];
    const tieneMotor = !!r.motor;
    let mensaje = "", salioMal = false;

    const consecuencia = (tieneMotor && op.consecuenciaConPropulsion) ? op.consecuenciaConPropulsion : op.consecuencia;
    if (consecuencia) { const extra = aplicarCambios(consecuencia); mensaje = consecuencia.mensaje + extra; }

    if (op.riesgo) {
      const rg = op.riesgo;
      let prob;
      if (rg.modo === "computador") prob = rg.probabilidad * (1 - (r.piezas.computador ? r.piezas.computador.resistencia : 0));
      else if (rg.modo === "orbita") prob = r.orbita.riesgoBasura;
      else if (rg.modo === "bateria") prob = r.capBat >= r.consumo * rg.horas ? 0 : 1;   // depende del diseño, no del azar
      else prob = rg.probabilidad || 0;
      if (rg.modo !== "bateria") prob = Math.min(0.95, prob * r.dificultad.multRiesgo);

      if (Math.random() < prob) { salioMal = true; mensaje = rg.siPasa.mensaje + aplicarCambios(rg.siPasa); }
      else { mensaje = rg.siNoPasa.mensaje + aplicarCambios(rg.siNoPasa); }

      if (rg.modo === "bateria") mensaje += " (Necesitabas " + Math.round(r.consumo * rg.horas) + " Wh y tu batería guarda " + Math.round(r.capBat) + " Wh)";
      else mensaje += " (Probabilidad de que saliera mal: " + Math.round(prob * 100) + "%)";
    }

    s.decisiones.push({ imagen: ev.imagen, evento: ev.titulo, rol: ev.rol, opcion: op.texto, resultado: mensaje, salioMal: salioMal, dia: s.dia });
    return { mensaje: mensaje, salioMal: salioMal };
  }

  /* ---------- Resultado de un minijuego ----------
     puntaje de 0 a 1 → elige "bien", "regular" o "mal" del evento y aplica sus cambios */
  function resolverMinijuego(puntaje, detalle, automatico) {
    const ev = s.eventoActual;
    const nivel = Minijuegos.nivel(puntaje);
    const res = ev.resultados[nivel];
    const extra = aplicarCambios(res);
    const pct = Math.round(puntaje * 100);
    const mensaje = res.mensaje + extra;
    s.decisiones.push({
      imagen: ev.imagen, evento: ev.titulo, rol: ev.rol, minijuego: ev.minijuego,
      opcion: (automatico ? "Piloto automático" : "Desafío: " + Minijuegos.info(ev.minijuego).nombre) + " (" + pct + "%)",
      resultado: mensaje + (detalle ? " " + detalle : ""), salioMal: nivel === "mal", nivel: nivel, puntaje: pct, dia: s.dia
    });
    return { mensaje: mensaje, nivel: nivel, salioMal: nivel === "mal", pct: pct };
  }

  function reanudar() { s.eventoActual = null; s.pausada = false; ultimoTiempo = performance.now(); }
  function cambiarVelocidad(v) { if (s) s.velocidad = v; }

  /* =================================================================
     DIBUJO
     ================================================================= */
  function ajustarTamano() {
    if (!canvas || !canvas.parentElement) return;
    const caja = canvas.parentElement.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const ancho = Math.max(260, caja.width - 16);
    const alto = Math.min(380, Math.max(260, ancho * 0.7));
    canvas.width = ancho * ratio; canvas.height = alto * ratio;
    canvas.style.width = ancho + "px"; canvas.style.height = alto + "px";
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // Colores de cada cuerpo celeste
  const CUERPOS = {
    tierra:    { claro: "#5fb4ff", oscuro: "#1b4fa0", radio: 0.2 },
    luna:      { claro: "#d9d9d9", oscuro: "#6b6b6b", radio: 0.16 },
    marte:     { claro: "#e8875a", oscuro: "#8a3418", radio: 0.17 },
    asteroide: { claro: "#a89f91", oscuro: "#4a443c", radio: 0.07 }
  };

  function dibujar(dt) {
    const ratio = window.devicePixelRatio || 1;
    const W = canvas.width / ratio, H = canvas.height / ratio;
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    // Sol a la izquierda (más pequeño y débil en Marte)
    const brillo = 0.45 * r.escenario.factorSolar;
    const sol = ctx.createRadialGradient(0, cy, 0, 0, cy, W * 0.35);
    sol.addColorStop(0, "rgba(255,210,110," + brillo + ")"); sol.addColorStop(1, "rgba(255,210,110,0)");
    ctx.fillStyle = sol; ctx.fillRect(0, 0, W, H);

    if (s.enViaje) { dibujarViaje(W, H); return; }

    const tipo = CUERPOS[r.escenario.cuerpo] || CUERPOS.tierra;
    const R = Math.min(W, H) * tipo.radio;
    const base = Math.min(W, H) * 0.2;                   // las órbitas usan una escala común
    const d = r.orbita.dibujo;
    const rx = Math.min(base * d.rx, W / 2 - 18), ry = Math.min(base * d.ry, H / 2 - 14), rot = d.rot;

    if (!s.pausada && !s.terminada) angulo += dt * d.vel * (0.6 + s.velocidad * 0.4);

    function punto(a) {
      const x = rx * Math.cos(a), y = ry * Math.sin(a);
      return { x: cx + x * Math.cos(rot) - y * Math.sin(rot), y: cy + x * Math.sin(rot) + y * Math.cos(rot) };
    }
    const pos = punto(angulo);
    const detras = Math.sin(angulo) < 0;

    // ¿En sombra? (lado opuesto al Sol)
    const a = ((angulo % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const enSombra = Math.min(a, Math.PI * 2 - a) < Math.PI * r.orbita.eclipseFraccion;
    const enContacto = d.arcoContacto >= 6.28 || Math.abs(a - Math.PI / 2) < d.arcoContacto / 2;
    s.enSombraVisual = enSombra;
    s.visual = { angulo: angulo, enSombra: enSombra, enContacto: enContacto };
    if (vistaExterna) return;          // la vista 3D usa estos datos para dibujar

    // Tierra pequeña en la esquina cuando estamos lejos
    if (r.escenario.cuerpo !== "tierra") dibujarTierraLejana(W);

    // Órbita
    ctx.strokeStyle = "rgba(140,180,255,0.35)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]);
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) { const p = punto(i / 80 * Math.PI * 2); if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
    ctx.stroke(); ctx.setLineDash([]);

    estela.push({ x: pos.x, y: pos.y });
    if (estela.length > 24) estela.shift();

    if (detras) dibujarNave(pos, enSombra);
    dibujarCuerpo(cx, cy, R, r.escenario.cuerpo, tipo);
    if (enContacto && !detras) dibujarRayo(cx, cy, R, pos, W);
    if (!detras) dibujarNave(pos, enSombra);

    ctx.strokeStyle = "rgba(255,200,80,0.35)"; ctx.lineWidth = 2;
    ctx.beginPath();
    estela.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.stroke();

    if (enSombra) etiqueta(W, "En sombra: usa batería");
  }

  function etiqueta(W, texto) {
    ctx.fillStyle = "rgba(10,14,40,0.75)"; ctx.fillRect(W - 190, 10, 180, 26);
    ctx.fillStyle = "#c8d4ff"; ctx.font = "13px sans-serif"; ctx.fillText(texto, W - 182, 28);
  }

  // Animación del viaje: la nave va de la Tierra al destino
  function dibujarViaje(W, H) {
    const prog = s.diaViaje / Math.max(1, s.diasViaje);
    const x0 = W * 0.15, x1 = W * 0.85, y = H * 0.55;
    // Camino curvo
    ctx.strokeStyle = "rgba(140,180,255,0.4)"; ctx.setLineDash([5, 6]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo(W / 2, H * 0.1, x1, y); ctx.stroke(); ctx.setLineDash([]);
    // Tierra y destino
    const t = CUERPOS.tierra, dest = CUERPOS[r.escenario.cuerpo] || CUERPOS.luna;
    dibujarCuerpo(x0, y, 22, "tierra", t);
    dibujarCuerpo(x1, y, r.escenario.cuerpo === "asteroide" ? 10 : 18, r.escenario.cuerpo, dest);
    // Nave sobre la curva (curva de Bézier)
    const u = prog;
    const px = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * (W / 2) + u * u * x1;
    const py = (1 - u) * (1 - u) * y + 2 * (1 - u) * u * (H * 0.1) + u * u * y;
    dibujarNave({ x: px, y: py }, false);
    ctx.fillStyle = "#eef2ff"; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Viajando: día " + s.diaViaje + " de " + s.diasViaje, W / 2, H - 24);
    ctx.textAlign = "left";
  }

  function dibujarTierraLejana(W) {
    const x = W - 34, y = 54;
    ctx.fillStyle = "#4a90e2"; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3fae6a"; ctx.beginPath(); ctx.arc(x - 2, y + 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#aab4dd"; ctx.font = "11px sans-serif"; ctx.fillText("Tierra", x - 18, y + 24);
  }

  function dibujarCuerpo(cx, cy, R, cuerpo, tipo) {
    const g = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, tipo.claro); g.addColorStop(1, tipo.oscuro);
    ctx.save();
    ctx.beginPath();
    if (cuerpo === "asteroide") {
      // Forma de "maní" irregular
      ctx.ellipse(cx - R * 0.3, cy, R * 0.8, R * 0.65, 0.3, 0, Math.PI * 2);
      ctx.ellipse(cx + R * 0.5, cy + R * 0.1, R * 0.6, R * 0.5, -0.2, 0, Math.PI * 2);
    } else {
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
    }
    ctx.fillStyle = g; ctx.fill(); ctx.clip();

    if (cuerpo === "tierra") {
      ctx.fillStyle = "#3fae6a";
      ctx.beginPath(); ctx.ellipse(cx - R * 0.15, cy + R * 0.3, R * 0.22, R * 0.45, 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx - R * 0.35, cy - R * 0.4, R * 0.35, R * 0.25, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + R * 0.55, cy - R * 0.15, R * 0.25, R * 0.35, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#eaf6ff";
      ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.98, R * 0.5, R * 0.14, 0, 0, Math.PI * 2); ctx.fill();
    } else if (cuerpo === "luna") {
      ctx.fillStyle = "rgba(90,90,90,0.5)";
      [[-0.3, -0.2, 0.18], [0.25, 0.1, 0.12], [-0.1, 0.4, 0.1], [0.4, -0.4, 0.09], [-0.5, 0.2, 0.08]].forEach(function (c) {
        ctx.beginPath(); ctx.arc(cx + c[0] * R, cy + c[1] * R, c[2] * R, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = "#1a1a26";    // cráteres en sombra permanente del polo sur
      ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.93, R * 0.3, R * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    } else if (cuerpo === "marte") {
      ctx.fillStyle = "rgba(120,40,20,0.5)";
      ctx.beginPath(); ctx.ellipse(cx - R * 0.2, cy + R * 0.1, R * 0.5, R * 0.12, -0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f4f4f4";
      ctx.beginPath(); ctx.ellipse(cx, cy - R * 0.95, R * 0.35, R * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    } else if (cuerpo === "asteroide") {
      ctx.fillStyle = "rgba(40,36,30,0.6)";
      [[-0.4, -0.1, 0.15], [0.3, 0.2, 0.12], [0.6, -0.1, 0.08]].forEach(function (c) {
        ctx.beginPath(); ctx.arc(cx + c[0] * R, cy + c[1] * R, c[2] * R, 0, Math.PI * 2); ctx.fill();
      });
    }
    // Lado de noche
    const noche = ctx.createLinearGradient(cx - R * 0.2, cy, cx + R * 1.2, cy);
    noche.addColorStop(0, "rgba(3,6,25,0)"); noche.addColorStop(0.35, "rgba(3,6,25,0.7)"); noche.addColorStop(1, "rgba(3,6,25,0.85)");
    ctx.fillStyle = noche; ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
    ctx.restore();

    if (cuerpo === "tierra" || cuerpo === "marte") {
      ctx.strokeStyle = cuerpo === "tierra" ? "rgba(120,200,255,0.5)" : "rgba(255,170,120,0.35)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2); ctx.stroke();
    }
    if (cuerpo === "tierra") {
      ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(cx - R * 0.22, cy + R * 0.62, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  function dibujarRayo(cx, cy, R, pos, W) {
    // En la Tierra: rayo a la estación. Lejos: rayo hacia la Tierra (esquina superior derecha)
    const destino = r.escenario.cuerpo === "tierra" ? { x: cx - R * 0.22, y: cy + R * 0.62 } : { x: W - 34, y: 54 };
    ctx.strokeStyle = "rgba(255,209,102,0.8)"; ctx.lineWidth = 2; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(destino.x, destino.y); ctx.stroke(); ctx.setLineDash([]);
  }

  function dibujarNave(pos, enSombra) {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.globalAlpha = enSombra ? 0.45 : 1;
    ctx.fillStyle = "#3a7bd5"; ctx.fillRect(-20, -4, 12, 8); ctx.fillRect(8, -4, 12, 8);
    ctx.strokeStyle = "#9cc3ff"; ctx.lineWidth = 1; ctx.strokeRect(-20, -4, 12, 8); ctx.strokeRect(8, -4, 12, 8);
    ctx.fillStyle = "#ffb703"; ctx.fillRect(-7, -6, 14, 12);
    ctx.fillStyle = s.enViaje ? "#4cc9f0" : (s.instrumentosOn ? "#3ddc84" : "#ff5c7a");
    ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* ---------- Bucle principal (~60 veces por segundo) ---------- */
  function bucle(t) {
    const dt = Math.min(0.1, (t - ultimoTiempo) / 1000);
    ultimoTiempo = t;

    if (!s.pausada && !s.terminada) {
      const velocidad = s.enViaje ? DATOS.config.diasPorSegundoViaje : DATOS.config.diasPorSegundo;
      s.acumulador += dt * velocidad * s.velocidad;
      while (s.acumulador >= 1 && !s.pausada && !s.terminada) {
        s.acumulador -= 1;
        if (s.enViaje) simularDiaViaje(); else simularDia();
      }
    }
    dibujar(dt);
    if (cb && cb.alActualizar) cb.alActualizar(s, r);
    animacion = requestAnimationFrame(bucle);
  }

  function iniciar(canvasElemento, recursos, callbacks) {
    detener();
    canvas = canvasElemento; ctx = canvas.getContext("2d");
    cb = callbacks;
    crear(recursos);
    ajustarTamano();
    ultimoTiempo = performance.now();
    animacion = requestAnimationFrame(bucle);
  }

  function detener() {
    if (animacion) cancelAnimationFrame(animacion);
    animacion = null;
  }

  window.addEventListener("resize", ajustarTamano);

  return {
    iniciar: iniciar, detener: detener, decidir: decidir, reanudar: reanudar, resolverMinijuego: resolverMinijuego,
    cambiarVelocidad: cambiarVelocidad,
    usarVistaExterna: function (si) { vistaExterna = !!si; },
    recursos: function () { return r; },
    estado: function () { return s; }
  };
})();
