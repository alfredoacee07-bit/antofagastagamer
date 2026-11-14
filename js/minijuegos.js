/* =====================================================================
   minijuegos.js — Desafíos que aparecen durante la simulación
   ---------------------------------------------------------------------
   Cinco minijuegos. Cada uno DEPENDE DEL DISEÑO de la nave:
     asteroides  → esquivar basura/piedras. Más ágil con buen control de
                   orientación y poca masa.
     tormenta    → apagar y encender sistemas durante una tormenta solar.
                   Una batería grande y un computador resistente ayudan.
     antena      → apuntar la antena a la estación terrestre. Una antena
                   grande (banda X con parabólica) tiene un círculo mayor.
     orbita      → dar impulsos en el momento justo para no perder altura.
                   Depende del motor: hidracina, eléctrico o sin motor.
     reparacion  → conectar cables. El computador avanzado da una pista.
   La dificultad (Cadete, Ingeniera, Directora de vuelo) cambia la velocidad,
   la tolerancia y el tiempo.

   Uso: Minijuegos.jugar(tipo, contenedor, recursos, alTerminar)
        alTerminar recibe { puntaje: 0 a 1, detalle: "texto" }
   Controles: flechas o WASD, Espacio para la acción, y botones táctiles.
   ===================================================================== */

const Minijuegos = (function () {

  const ANCHO = 640, ALTO = 360;          // tamaño "lógico" del dibujo
  const ic = Iconos.svg;
  let juego = null;                        // el minijuego que se está jugando
  const teclas = { arriba: false, abajo: false, izquierda: false, derecha: false };
  let accionPendiente = false;             // se pulsó Espacio o el botón de acción

  const INFO = {
    asteroides: { nombre: "Esquivar la lluvia", icono: "alerta", controles: "Mueve la nave con las flechas, WASD o los botones." },
    tormenta: { nombre: "Proteger la nave", icono: "sol", controles: "Toca los interruptores o usa las teclas 1, 2, 3 y 4." },
    antena: { nombre: "Apuntar la antena", icono: "antena", controles: "Mueve la mira con las flechas, WASD, los botones o arrastrando con el dedo." },
    orbita: { nombre: "Corregir la órbita", icono: "orbita", controles: "Pulsa Espacio o IMPULSO cuando la nave pase por la zona verde." },
    reparacion: { nombre: "Reparar los cables", icono: "llave", controles: "Toca un sistema de la izquierda y luego su conexión de la derecha." },
    aterrizaje: { nombre: "Aterrizar la primera etapa", icono: "cohete", controles: "Flecha arriba (o W): encender el motor. Izquierda/derecha (A/D): inclinarse." }
  };

  /* =================================================================
     CÓMO INFLUYE EL DISEÑO (se muestra antes de jugar)
     ================================================================= */
  function influencia(tipo, r) {
    const p = r.piezas;
    const dif = r.dificultad.factorMinijuego || 1;
    const out = { dif: dif, lineas: [] };
    if (tipo === "asteroides") {
      const precision = p.orientacion ? p.orientacion.precision : 0.7;
      const factorMasa = Math.max(0.6, Math.min(1.2, 1.25 - r.masa / 1000));
      out.agilidad = precision * factorMasa;
      out.lineas.push("Control de orientación " + (precision >= 1 ? "avanzado: la nave responde rápido." : "básico: la nave responde más lento."));
      out.lineas.push("Masa de " + Math.round(r.masa) + " kg: " + (factorMasa >= 1 ? "liviana y ágil." : "pesada, cuesta moverla."));
      out.lineas.push("Agilidad total: " + Math.round(out.agilidad * 100) + "%.");
    } else if (tipo === "tormenta") {
      out.bateria = 55 + Math.min(1, r.capBat / 450) * 35;
      out.resistencia = p.computador ? p.computador.resistencia : 0.3;
      out.lineas.push("Batería de " + Math.round(r.capBat) + " Wh: empiezas con " + Math.round(out.bateria) + "% de carga.");
      out.lineas.push("Computador con " + Math.round(out.resistencia * 100) + "% de resistencia a la radiación.");
    } else if (tipo === "antena") {
      const grande = p.antena && p.antena.velocidadMbps >= 50;
      out.radio = (grande ? 48 : 30) / Math.sqrt(dif);
      out.lineas.push(grande ? "Antena parabólica de banda X: círculo de enlace GRANDE." : "Antena simple de banda S: círculo de enlace pequeño. ¡Apunta con cuidado!");
    } else if (tipo === "orbita") {
      const m = r.motor;
      if (!m) { out.impulso = 14; out.cargas = 5; out.motor = "ninguno"; out.lineas.push("Sin motor: solo puedes girar la nave para que el aire la frene distinto (impulsos débiles)."); }
      else if (m.isp > 1000) { out.impulso = 13; out.cargas = 10; out.motor = "electrico"; out.lineas.push("Motor eléctrico: muchos impulsos suaves (10 cargas)."); }
      else { out.impulso = 22; out.cargas = 6; out.motor = "hidracina"; out.lineas.push("Motor de hidracina: pocos impulsos, pero fuertes (6 cargas)."); }
    } else if (tipo === "reparacion") {
      out.pista = p.computador && p.computador.resistencia >= 0.8;
      out.cables = dif < 0.9 ? 3 : (dif > 1.2 ? 5 : 4);
      out.lineas.push(out.cables + " cables sueltos.");
      out.lineas.push(out.pista ? "Tu computador avanzado hace un diagnóstico: te mostrará una conexión." : "Tu computador básico no puede hacer diagnóstico: tendrás que pensar.");
    }
    if (tipo === "aterrizaje") {
      // El combustible de reserva depende de la etapa (en un cohete propio, de su tamaño)
      const coh = r.cohete;
      out.combustible = (coh && coh.propio ? 7.5 : 7) / Math.sqrt(dif);
      out.lineas.push("Combustible de reserva para frenar: " + out.combustible.toFixed(1).replace(".", ",") + " segundos de motor.");
      out.lineas.push("Para aterrizar bien: menos de 4 m/s de bajada, menos de 3 m/s hacia el lado, menos de 12° de inclinación y sobre la plataforma (la X amarilla).");
    }
    out.lineas.push("Dificultad: " + r.dificultad.nombre + ".");
    return out;
  }

  /* =================================================================
     ESTRUCTURA COMÚN: cabecera, área de juego y controles táctiles
     ================================================================= */
  function armarPantalla(contenedor, tipo, usaCanvas, conFlechas, conAccion) {
    const info = INFO[tipo];
    contenedor.innerHTML =
      '<div class="mj">' +
        '<div class="mj-cabeza"><span class="mj-titulo">' + ic(info.icono) + ' ' + info.nombre + '</span>' +
        '<span class="mj-marcador" id="mj-marcador"></span><span class="mj-tiempo">' + ic("reloj") + ' <b id="mj-tiempo">0</b> s</span></div>' +
        '<div class="mj-area" id="mj-area">' + (usaCanvas ? '<canvas id="mj-canvas"></canvas>' : '') + '</div>' +
        '<p class="mj-ayuda">' + info.controles + '</p>' +
        '<div class="mj-controles">' +
          (conFlechas ? '<div class="mj-cruceta">' +
            '<button class="mj-boton" data-tecla="arriba" aria-label="Arriba">' + flecha(-90) + '</button>' +
            '<button class="mj-boton" data-tecla="izquierda" aria-label="Izquierda">' + flecha(180) + '</button>' +
            '<button class="mj-boton" data-tecla="derecha" aria-label="Derecha">' + flecha(0) + '</button>' +
            '<button class="mj-boton" data-tecla="abajo" aria-label="Abajo">' + flecha(90) + '</button></div>' : '') +
          (conAccion ? '<button class="mj-boton mj-accion" data-tecla="accion">' + ic("llama") + ' IMPULSO</button>' : '') +
        '</div>' +
      '</div>';
    // Botones táctiles: mantener presionado = tecla presionada
    contenedor.querySelectorAll(".mj-boton").forEach(function (b) {
      const t = b.dataset.tecla;
      const bajar = function (e) { e.preventDefault(); if (t === "accion") accionPendiente = true; else teclas[t] = true; };
      const subir = function () { if (t !== "accion") teclas[t] = false; };
      b.addEventListener("pointerdown", bajar);
      b.addEventListener("pointerup", subir);
      b.addEventListener("pointerleave", subir);
      b.addEventListener("pointercancel", subir);
    });
    if (!usaCanvas) return null;
    const canvas = contenedor.querySelector("#mj-canvas");
    const ratio = window.devicePixelRatio || 1;
    canvas.width = ANCHO * ratio; canvas.height = ALTO * ratio;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { canvas: canvas, ctx: ctx };
  }
  function flecha(grados) {
    return '<span style="display:inline-flex;transform:rotate(' + grados + 'deg)">' + ic("flecha") + '</span>';
  }

  // Teclado (se escucha en "captura" para que las flechas no muevan la página)
  const MAPA = { ArrowUp: "arriba", w: "arriba", W: "arriba", ArrowDown: "abajo", s: "abajo", S: "abajo",
    ArrowLeft: "izquierda", a: "izquierda", A: "izquierda", ArrowRight: "derecha", d: "derecha", D: "derecha" };
  function teclaAbajo(e) {
    if (!juego) return;
    if (MAPA[e.key]) { teclas[MAPA[e.key]] = true; e.preventDefault(); e.stopPropagation(); }
    else if (e.key === " " || e.key === "Enter") { if (!e.repeat) accionPendiente = true; e.preventDefault(); e.stopPropagation(); }
    else if (juego.tecla) { juego.tecla(e.key); }
  }
  function teclaArriba(e) { if (MAPA[e.key]) teclas[MAPA[e.key]] = false; }
  window.addEventListener("keydown", teclaAbajo, true);
  window.addEventListener("keyup", teclaArriba, true);

  /* ---------- Bucle común ---------- */
  function iniciarBucle(alTerminar) {
    let ultimo = performance.now();
    function paso(t) {
      if (!juego) return;
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      juego.tiempo -= dt;
      juego.actualizar(dt);
      accionPendiente = false;
      if (juego.dibujar) juego.dibujar();
      const tEl = document.getElementById("mj-tiempo");
      if (tEl) tEl.textContent = Math.max(0, Math.ceil(juego.tiempo));
      if (juego.tiempo <= 0 || juego.terminado) { terminar(alTerminar); return; }
      juego.raf = requestAnimationFrame(paso);
    }
    juego.raf = requestAnimationFrame(paso);
  }

  function terminar(alTerminar) {
    if (!juego) return;
    const resultado = { puntaje: Math.max(0, Math.min(1, juego.puntaje())), detalle: juego.detalle() };
    cancelAnimationFrame(juego.raf);
    juego = null;
    Object.keys(teclas).forEach(function (k) { teclas[k] = false; });
    alTerminar(resultado);
  }

  function marcador(html) { const m = document.getElementById("mj-marcador"); if (m) m.innerHTML = html; }

  // Estrellas de fondo reutilizables
  const estrellas = [];
  for (let i = 0; i < 70; i++) estrellas.push({ x: Math.random() * ANCHO, y: Math.random() * ALTO, r: Math.random() * 1.3 + 0.3, v: 10 + Math.random() * 30 });
  function fondo(ctx, mover, dt) {
    ctx.fillStyle = "#050818"; ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    estrellas.forEach(function (s) {
      if (mover) { s.y += s.v * dt; if (s.y > ALTO) { s.y = 0; s.x = Math.random() * ANCHO; } }
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    });
  }
  function dibujarNave(ctx, x, y, escala, alfa) {
    ctx.save(); ctx.translate(x, y); ctx.scale(escala, escala); ctx.globalAlpha = alfa === undefined ? 1 : alfa;
    ctx.fillStyle = "#3a7bd5"; ctx.fillRect(-26, -5, 16, 10); ctx.fillRect(10, -5, 16, 10);
    ctx.strokeStyle = "#9cc3ff"; ctx.lineWidth = 1; ctx.strokeRect(-26, -5, 16, 10); ctx.strokeRect(10, -5, 16, 10);
    ctx.fillStyle = "#ffb703"; ctx.fillRect(-9, -8, 18, 16);
    ctx.fillStyle = "#e8ecff"; ctx.beginPath(); ctx.arc(0, -8, 4, Math.PI, 0); ctx.fill();
    ctx.restore();
  }

  /* =================================================================
     1. ASTEROIDES / BASURA ESPACIAL
     ================================================================= */
  function asteroides(contenedor, r, inf, alTerminar) {
    const c = armarPantalla(contenedor, "asteroides", true, true, false);
    const ctx = c.ctx, dif = inf.dif;
    const piedras = r.escenario.cuerpo === "asteroide";
    const nave = { x: ANCHO / 2, y: ALTO - 60, r: 18 };
    const maxImpactos = Math.max(3, Math.round(5 / dif));
    juego = {
      tiempo: 18, rocas: [], espera: 0.5, impactos: 0, invulnerable: 0, destello: 0,
      actualizar: function (dt) {
        const v = 300 * inf.agilidad;
        if (teclas.izquierda) nave.x -= v * dt;
        if (teclas.derecha) nave.x += v * dt;
        if (teclas.arriba) nave.y -= v * dt;
        if (teclas.abajo) nave.y += v * dt;
        nave.x = Math.max(30, Math.min(ANCHO - 30, nave.x));
        nave.y = Math.max(40, Math.min(ALTO - 20, nave.y));
        this.espera -= dt;
        if (this.espera <= 0) {
          const radio = 8 + Math.random() * 16;
          const forma = []; for (let k = 0; k < 8; k++) forma.push(0.7 + Math.random() * 0.45);
          this.rocas.push({ x: 20 + Math.random() * (ANCHO - 40), y: -30, r: radio, vy: (120 + Math.random() * 130) * dif, vx: (Math.random() - 0.5) * 80 * dif, giro: Math.random() * 6, vg: (Math.random() - 0.5) * 3, forma: forma });
          this.espera = 0.45 / dif;
        }
        this.invulnerable -= dt; this.destello -= dt;
        const self = this;
        this.rocas.forEach(function (k) {
          k.x += k.vx * dt; k.y += k.vy * dt; k.giro += k.vg * dt;
          const d = Math.hypot(k.x - nave.x, k.y - nave.y);
          if (d < k.r + nave.r * 0.75 && self.invulnerable <= 0) {
            self.impactos++; self.invulnerable = 1; self.destello = 0.25; k.y = ALTO + 100;
            Sonido.efecto("impacto");
          }
        });
        this.rocas = this.rocas.filter(function (k) { return k.y < ALTO + 40; });
        if (this.impactos >= maxImpactos + 2) this.terminado = true;
        marcador(ic("alerta") + " Impactos: <b>" + this.impactos + "</b> / " + maxImpactos);
      },
      dibujar: function () {
        fondo(ctx, true, 1 / 60);
        if (!piedras) {      // borde de la Tierra abajo
          const g = ctx.createRadialGradient(ANCHO / 2, ALTO + 600, 560, ANCHO / 2, ALTO + 600, 640);
          g.addColorStop(0, "#2f6fd1"); g.addColorStop(0.9, "rgba(90,170,255,0.5)"); g.addColorStop(1, "rgba(90,170,255,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ANCHO / 2, ALTO + 600, 640, 0, Math.PI * 2); ctx.fill();
        }
        this.rocas.forEach(function (k) {
          ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.giro);
          ctx.fillStyle = piedras ? "#8a7f70" : "#9aa3b5"; ctx.strokeStyle = piedras ? "#5c5246" : "#d0d6e6"; ctx.lineWidth = 1.5;
          ctx.beginPath();
          k.forma.forEach(function (f, i) { const a = i / k.forma.length * Math.PI * 2; const px = Math.cos(a) * k.r * f, py = Math.sin(a) * k.r * f; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
          ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        });
        dibujarNave(ctx, nave.x, nave.y, 1, this.invulnerable > 0 && Math.floor(this.invulnerable * 10) % 2 ? 0.3 : 1);
        if (this.destello > 0) { ctx.fillStyle = "rgba(255,80,80," + this.destello + ")"; ctx.fillRect(0, 0, ANCHO, ALTO); }
      },
      puntaje: function () { return 1 - this.impactos / maxImpactos; },
      detalle: function () { return "Recibiste " + this.impactos + " impacto(s)."; }
    };
    iniciarBucle(alTerminar);
  }

  /* =================================================================
     2. TORMENTA SOLAR: gestionar la energía en vivo
     ================================================================= */
  function tormenta(contenedor, r, inf, alTerminar) {
    armarPantalla(contenedor, "tormenta", false, false, false);
    const area = contenedor.querySelector("#mj-area");
    const SISTEMAS = [
      { id: "instrumentos", nombre: "Instrumentos", icono: "telescopio", consumo: 4.5, tecla: "1" },
      { id: "antena", nombre: "Antena", icono: "antena", consumo: 2.5, tecla: "2" },
      { id: "calefactores", nombre: "Calefactores", icono: "llama", consumo: 1.5, tecla: "3" },
      { id: "computador", nombre: "Computador", icono: "memoria", consumo: 1.2, tecla: "4" }
    ];
    area.innerHTML =
      '<div class="tormenta">' +
        '<div class="tm-medidor"><span>' + ic("sol") + ' Radiación</span><div class="barra grande"><div class="barra-relleno" id="tm-rad"></div></div><b id="tm-rad-txt">Calma</b></div>' +
        '<div class="tm-medidor"><span>' + ic("bateria") + ' Batería</span><div class="barra grande"><div class="barra-relleno" id="tm-bat"></div></div><b id="tm-bat-txt"></b></div>' +
        '<div class="tm-medidor"><span>' + ic("alerta") + ' Daño</span><div class="barra grande"><div class="barra-relleno relleno-rojo" id="tm-dano"></div></div><b id="tm-dano-txt"></b></div>' +
        '<div class="tm-sistemas">' + SISTEMAS.map(function (s) {
          return '<button class="tm-sistema encendido" data-sis="' + s.id + '">' + ic(s.icono) + '<span>' + s.nombre + '</span><small>Tecla ' + s.tecla + ' · <b class="tm-estado">ENCENDIDO</b></small></button>';
        }).join("") + '</div>' +
        '<p class="tm-aviso" id="tm-aviso"></p>' +
      '</div>';
    const on = { instrumentos: true, antena: true, calefactores: true, computador: true };
    function alternar(id) {
      if (!juego) return;
      if (juego.reinicio > 0 && id !== "computador") { Sonido.efecto("error"); return; }
      on[id] = !on[id];
      if (id === "computador") {
        if (!on.computador) { on.instrumentos = false; on.antena = false; }      // sin cerebro, todo se apaga
        else juego.reinicio = 2;                                                 // el computador tarda en reiniciar
      } else if (!on.computador && on[id]) { on[id] = false; Sonido.efecto("error"); return; }
      Sonido.efecto("clic");
      pintar();
    }
    function pintar() {
      area.querySelectorAll(".tm-sistema").forEach(function (b) {
        const prendido = on[b.dataset.sis];
        b.classList.toggle("encendido", prendido);
        b.querySelector(".tm-estado").textContent = prendido ? "ENCENDIDO" : "APAGADO";
      });
    }
    area.querySelectorAll(".tm-sistema").forEach(function (b) { b.addEventListener("click", function () { alternar(b.dataset.sis); }); });

    const dif = inf.dif;
    juego = {
      tiempo: 25, bateria: inf.bateria, dano: 0, ciencia: 0, frio: 0, reinicio: 0, apagada: false,
      fase: "calma", reloj: 2.5, ultimaFase: "",
      tecla: function (k) { const s = SISTEMAS.find(function (x) { return x.tecla === k; }); if (s) alternar(s.id); },
      actualizar: function (dt) {
        // Ciclo de la tormenta: calma → aviso → ráfaga
        this.reloj -= dt;
        if (this.reloj <= 0) {
          if (this.fase === "calma") { this.fase = "aviso"; this.reloj = 1.4 / Math.sqrt(dif); Sonido.efecto("alarma"); }
          else if (this.fase === "aviso") { this.fase = "rafaga"; this.reloj = 2 + Math.random() * 1.2; }
          else { this.fase = "calma"; this.reloj = (2.4 + Math.random() * 1.6) / dif; }
        }
        if (this.reinicio > 0) this.reinicio -= dt;
        const rafaga = this.fase === "rafaga";
        // Energía
        let consumo = 0;
        SISTEMAS.forEach(function (s) { if (on[s.id]) consumo += s.consumo; });
        const carga = rafaga ? 4 : 5.5;
        this.bateria = Math.max(0, Math.min(100, this.bateria + (carga - consumo) * dt));
        if (this.bateria <= 0) { this.apagada = true; this.terminado = true; }
        // Daño por radiación (el computador resistente sufre menos)
        if (rafaga) this.dano += dt * dif * ((on.instrumentos ? 1 : 0) + (on.antena ? 0.7 : 0) + (on.computador ? (1 - inf.resistencia) * 0.25 : 0));
        // Frío: sin calefactores más de 4 segundos, la batería se daña
        if (!on.calefactores) { this.frio += dt; if (this.frio > 4) this.dano += dt * 0.5; } else this.frio = 0;
        // Ciencia: solo se mide y envía fuera de las ráfagas
        if (!rafaga && on.computador && this.reinicio <= 0) this.ciencia += dt * ((on.instrumentos ? 1 : 0) + (on.antena ? 0.5 : 0));

        // Pantalla
        const rad = this.fase === "calma" ? 15 : (this.fase === "aviso" ? 60 : 100);
        const radEl = document.getElementById("tm-rad");
        radEl.style.width = rad + "%";
        radEl.className = "barra-relleno relleno-" + (this.fase === "calma" ? "verde" : (this.fase === "aviso" ? "amarillo" : "rojo"));
        document.getElementById("tm-rad-txt").textContent = this.fase === "calma" ? "Calma" : (this.fase === "aviso" ? "¡Se acerca una ráfaga!" : "¡RÁFAGA!");
        const bat = document.getElementById("tm-bat");
        bat.style.width = this.bateria + "%";
        bat.className = "barra-relleno relleno-" + (this.bateria < 20 ? "rojo" : (this.bateria < 45 ? "amarillo" : "verde"));
        document.getElementById("tm-bat-txt").textContent = Math.round(this.bateria) + "%";
        const danoPct = Math.min(100, this.dano / 4 * 100);
        document.getElementById("tm-dano").style.width = Math.max(2, danoPct) + "%";
        document.getElementById("tm-dano-txt").textContent = Math.round(danoPct) + "%";
        let aviso = "";
        if (this.reinicio > 0) aviso = "El computador se está reiniciando…";
        else if (this.frio > 2) aviso = "¡La nave se está enfriando! Enciende los calefactores.";
        else if (this.bateria < 20) aviso = "¡Batería baja! Apaga algo que gaste mucho.";
        else if (rafaga && (on.instrumentos || on.antena)) aviso = "¡Apaga los instrumentos y la antena!";
        document.getElementById("tm-aviso").textContent = aviso;
        if (this.fase !== this.ultimaFase) { area.querySelector(".tormenta").dataset.fase = this.fase; this.ultimaFase = this.fase; }
        marcador(ic("ciencia") + " Ciencia: <b>" + Math.round(this.ciencia) + "</b>");
      },
      puntaje: function () {
        const pC = Math.min(1, this.ciencia / 14);
        const pD = Math.max(0, 1 - this.dano / 4);
        const p = 0.45 * pC + 0.55 * pD;
        return this.apagada ? p * 0.3 : p;
      },
      detalle: function () {
        return (this.apagada ? "¡La batería se agotó y la nave se apagó! " : "") + "Daño por radiación: " + Math.round(Math.min(100, this.dano / 4 * 100)) + "%. Ciencia salvada: " + Math.round(this.ciencia) + " puntos de medición.";
      }
    };
    iniciarBucle(alTerminar);
  }

  /* =================================================================
     3. APUNTAR LA ANTENA
     ================================================================= */
  function antena(contenedor, r, inf, alTerminar) {
    const c = armarPantalla(contenedor, "antena", true, true, false);
    const ctx = c.ctx, dif = inf.dif;
    const mira = { x: ANCHO / 2, y: ALTO / 2 };
    const fase1 = Math.random() * 6, fase2 = Math.random() * 6;
    let arrastrando = false, objetivoDedo = null;
    // En tablet: arrastrar con el dedo mueve la mira
    c.canvas.addEventListener("pointerdown", function (e) { arrastrando = true; objetivoDedo = posicion(e); });
    c.canvas.addEventListener("pointermove", function (e) { if (arrastrando) objetivoDedo = posicion(e); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (t) { c.canvas.addEventListener(t, function () { arrastrando = false; objetivoDedo = null; }); });
    function posicion(e) {
      const b = c.canvas.getBoundingClientRect();
      return { x: (e.clientX - b.left) / b.width * ANCHO, y: (e.clientY - b.top) / b.height * ALTO };
    }
    const DURACION = 16;
    juego = {
      tiempo: DURACION, t: 0, datos: 0, enlazado: false, barrido: 0,
      estacion: { x: 0, y: 0 },
      actualizar: function (dt) {
        this.t += dt; this.barrido += dt * 2;
        const v = 230;
        if (teclas.izquierda) mira.x -= v * dt;
        if (teclas.derecha) mira.x += v * dt;
        if (teclas.arriba) mira.y -= v * dt;
        if (teclas.abajo) mira.y += v * dt;
        if (objetivoDedo) { mira.x += (objetivoDedo.x - mira.x) * Math.min(1, dt * 8); mira.y += (objetivoDedo.y - mira.y) * Math.min(1, dt * 8); }
        mira.x = Math.max(10, Math.min(ANCHO - 10, mira.x)); mira.y = Math.max(10, Math.min(ALTO - 10, mira.y));
        // La estación "se mueve" porque la nave sigue girando en su órbita
        const k = 0.45 * dif;
        this.estacion.x = ANCHO / 2 + 230 * Math.sin(this.t * k + fase1) + 20 * Math.sin(this.t * 2.3 * dif);
        this.estacion.y = ALTO / 2 + 120 * Math.sin(this.t * k * 1.37 + fase2) + 14 * Math.cos(this.t * 2.9 * dif);
        const dentro = Math.hypot(this.estacion.x - mira.x, this.estacion.y - mira.y) < inf.radio;
        if (dentro && !this.enlazado) Sonido.efecto("pitido");
        this.enlazado = dentro;
        if (dentro) this.datos = Math.min(1, this.datos + dt / (DURACION * 0.7));
        if (this.datos >= 1) this.terminado = true;
        marcador(ic("enviar") + " Datos enviados: <b>" + Math.round(this.datos * 100) + "%</b>");
      },
      dibujar: function () {
        ctx.fillStyle = "#03140c"; ctx.fillRect(0, 0, ANCHO, ALTO);
        ctx.strokeStyle = "rgba(61,220,132,0.18)"; ctx.lineWidth = 1;
        for (let x = 0; x < ANCHO; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ALTO); ctx.stroke(); }
        for (let y = 0; y < ALTO; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ANCHO, y); ctx.stroke(); }
        // Barrido de radar
        ctx.save(); ctx.translate(ANCHO / 2, ALTO / 2); ctx.rotate(this.barrido);
        const g = ctx.createLinearGradient(0, 0, 360, 0); g.addColorStop(0, "rgba(61,220,132,0.35)"); g.addColorStop(1, "rgba(61,220,132,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 400, -0.15, 0.15); ctx.closePath(); ctx.fill(); ctx.restore();
        // Estación terrestre (antena parabólica)
        const e = this.estacion;
        ctx.save(); ctx.translate(e.x, e.y);
        ctx.strokeStyle = "#ffd166"; ctx.fillStyle = "#ffd166"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, -4, 10, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(-6, 12); ctx.moveTo(0, 2); ctx.lineTo(6, 12); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -4, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Mira con su círculo de enlace
        ctx.strokeStyle = this.enlazado ? "#3ddc84" : "#4cc9f0"; ctx.lineWidth = 2;
        ctx.fillStyle = this.enlazado ? "rgba(61,220,132,0.15)" : "rgba(76,201,240,0.08)";
        ctx.beginPath(); ctx.arc(mira.x, mira.y, inf.radio, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mira.x - inf.radio - 8, mira.y); ctx.lineTo(mira.x + inf.radio + 8, mira.y);
        ctx.moveTo(mira.x, mira.y - inf.radio - 8); ctx.lineTo(mira.x, mira.y + inf.radio + 8); ctx.stroke();
        ctx.fillStyle = this.enlazado ? "#3ddc84" : "#c8d4ff"; ctx.font = "bold 15px sans-serif";
        ctx.fillText(this.enlazado ? "ENLACE ESTABLECIDO" : "Buscando estación…", 14, 24);
      },
      puntaje: function () { return this.datos; },
      detalle: function () { return "Enviaste el " + Math.round(this.datos * 100) + "% de los datos durante la ventana de comunicación."; }
    };
    iniciarBucle(alTerminar);
  }

  /* =================================================================
     4. CORREGIR LA ÓRBITA
     ================================================================= */
  function orbita(contenedor, r, inf, alTerminar) {
    const c = armarPantalla(contenedor, "orbita", true, false, true);
    const ctx = c.ctx, dif = inf.dif;
    const cuerpo = r.escenario.cuerpo;
    const colores = { tierra: ["#5fb4ff", "#1b4fa0"], luna: ["#d9d9d9", "#6b6b6b"], marte: ["#e8875a", "#8a3418"], asteroide: ["#a89f91", "#4a443c"] }[cuerpo] || ["#5fb4ff", "#1b4fa0"];
    const ZONA = 0.75 / Math.sqrt(dif);           // ancho de la zona verde (en radianes)
    const LIMITE = 40;                            // por debajo de esta altura, la nave cae
    juego = {
      tiempo: 22, angulo: Math.PI / 2, altura: 100, cargas: inf.cargas, aciertos: 0, desperdicios: 0, cayo: false, transcurrido: 0, chispa: 0,
      actualizar: function (dt) {
        this.transcurrido += dt;
        this.angulo += dt * 2.1;
        this.altura -= dt * 5.5 * dif;
        this.chispa -= dt;
        if (accionPendiente) {
          if (this.cargas <= 0) Sonido.efecto("error");
          else {
            this.cargas--;
            const a = ((this.angulo % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const enZona = Math.abs(a - Math.PI * 1.5) < ZONA / 2;     // zona verde arriba (ángulo 270°)
            if (enZona) { this.altura += inf.impulso; this.aciertos++; Sonido.efecto("separacion"); }
            else { this.altura += inf.impulso * 0.25; this.desperdicios++; Sonido.efecto("fallaCorta"); }
            this.chispa = 0.3;
          }
        }
        this.altura = Math.min(120, this.altura);
        if (this.altura <= LIMITE) { this.cayo = true; this.terminado = true; }
        marcador(ic("gota") + " Cargas: <b>" + this.cargas + "</b> · Altura: <b>" + Math.round(this.altura) + "%</b>");
      },
      dibujar: function () {
        fondo(ctx, false, 0);
        const cx = ANCHO / 2, cy = ALTO / 2 + 6, R = 62;
        const radioOrbita = R + 18 + this.altura * 0.85;
        // Planeta
        const g = ctx.createRadialGradient(cx - 20, cy - 20, 8, cx, cy, R);
        g.addColorStop(0, colores[0]); g.addColorStop(1, colores[1]);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        // Línea de peligro
        ctx.strokeStyle = "rgba(255,92,122,0.7)"; ctx.setLineDash([4, 6]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, R + 18 + LIMITE * 0.85, 0, Math.PI * 2); ctx.stroke();
        // Órbita actual
        ctx.strokeStyle = "rgba(140,180,255,0.5)"; ctx.setLineDash([5, 6]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, radioOrbita, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        // Zona verde de encendido (arriba)
        ctx.strokeStyle = "rgba(61,220,132,0.9)"; ctx.lineWidth = 12; ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(cx, cy, radioOrbita, Math.PI * 1.5 - ZONA / 2, Math.PI * 1.5 + ZONA / 2); ctx.stroke(); ctx.lineCap = "butt";
        // Nave
        const x = cx + Math.cos(this.angulo) * radioOrbita, y = cy + Math.sin(this.angulo) * radioOrbita;
        if (this.chispa > 0) { ctx.fillStyle = "rgba(255,160,40," + this.chispa * 3 + ")"; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill(); }
        dibujarNave(ctx, x, y, 0.7, 1);
        // Barra de altura
        ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(ANCHO - 40, 30, 16, 300);
        const h = Math.max(0, Math.min(1, this.altura / 120));
        ctx.fillStyle = this.altura < 55 ? "#ff5c7a" : (this.altura < 75 ? "#ffd166" : "#3ddc84");
        ctx.fillRect(ANCHO - 40, 330 - 300 * h, 16, 300 * h);
        ctx.fillStyle = "#ff5c7a"; ctx.fillRect(ANCHO - 46, 330 - 300 * (LIMITE / 120), 28, 2);
        ctx.fillStyle = "#c8d4ff"; ctx.font = "12px sans-serif"; ctx.fillText("Altura", ANCHO - 54, 22);
      },
      puntaje: function () {
        if (this.cayo) return 0.15 * (this.transcurrido / 22);
        return 0.4 + 0.6 * Math.max(0, Math.min(1, (this.altura - LIMITE) / 60));
      },
      detalle: function () {
        return (this.cayo ? "¡La nave bajó demasiado! " : "") + "Impulsos certeros: " + this.aciertos + ", desperdiciados: " + this.desperdicios + ". Altura final: " + Math.round(Math.max(0, this.altura)) + "%.";
      }
    };
    iniciarBucle(alTerminar);
  }

  /* =================================================================
     5. REPARACIÓN: conectar cada sistema con su lugar
     ================================================================= */
  const PARES = [
    { a: "Panel solar", b: "Regulador de energía", color: "#ffd166" },
    { a: "Batería", b: "Línea de energía principal", color: "#3ddc84" },
    { a: "Antena", b: "Transmisor de radio", color: "#4cc9f0" },
    { a: "Cámara", b: "Procesador de imágenes", color: "#c77dff" },
    { a: "Rueda de reacción", b: "Control de orientación", color: "#ff7b00" },
    { a: "Calefactor", b: "Control de temperatura", color: "#ff5c7a" },
    { a: "Rastreador de estrellas", b: "Computador de navegación", color: "#9cc3ff" }
  ];
  function mezclar(l) { const c = l.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = c[i]; c[i] = c[j]; c[j] = t; } return c; }

  function reparacion(contenedor, r, inf, alTerminar) {
    armarPantalla(contenedor, "reparacion", false, false, false);
    const area = contenedor.querySelector("#mj-area");
    const dif = inf.dif;
    const pares = mezclar(PARES).slice(0, inf.cables);
    const derecha = mezclar(pares);
    const conColor = dif < 0.9;                         // en Cadete los cables tienen colores de ayuda
    const pista = inf.pista ? pares[0] : null;
    area.innerHTML = '<div class="rep">' +
      (pista ? '<p class="rep-pista">' + ic("memoria") + ' Diagnóstico del computador: «' + pista.a + '» va con «' + pista.b + '».</p>' : '') +
      '<div class="rep-columnas"><div class="rep-col">' + pares.map(function (p, i) {
        return '<button class="rep-item" data-lado="a" data-i="' + i + '">' + (conColor ? '<span class="rep-punto" style="background:' + p.color + '"></span>' : '') + p.a + '</button>';
      }).join("") + '</div><div class="rep-cables">' + ic("flecha") + '</div><div class="rep-col">' + derecha.map(function (p) {
        const i = pares.indexOf(p);
        return '<button class="rep-item" data-lado="b" data-i="' + i + '">' + (conColor ? '<span class="rep-punto" style="background:' + p.color + '"></span>' : '') + p.b + '</button>';
      }).join("") + '</div></div></div>';

    const tiempoTotal = Math.round(26 / dif);
    let elegido = null;
    juego = {
      tiempo: tiempoTotal, conectados: 0, errores: 0,
      actualizar: function () {
        marcador(ic("llave") + " Conectados: <b>" + this.conectados + "</b> / " + pares.length);
        if (this.conectados >= pares.length) this.terminado = true;
      },
      puntaje: function () {
        const base = this.conectados / pares.length;
        return base * (0.75 + 0.25 * Math.max(0, this.tiempo) / tiempoTotal);
      },
      detalle: function () { return "Conectaste " + this.conectados + " de " + pares.length + " cables" + (this.errores ? " (con " + this.errores + " error(es))." : " sin errores."); }
    };
    area.querySelectorAll(".rep-item").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!juego || b.classList.contains("listo")) return;
        if (b.dataset.lado === "a") {
          area.querySelectorAll('.rep-item[data-lado="a"]').forEach(function (x) { x.classList.remove("elegido"); });
          b.classList.add("elegido"); elegido = b; Sonido.efecto("clic");
          return;
        }
        if (!elegido) { Sonido.efecto("error"); return; }
        if (elegido.dataset.i === b.dataset.i) {
          const n = ++juego.conectados;
          [elegido, b].forEach(function (x) { x.classList.remove("elegido"); x.classList.add("listo"); x.insertAdjacentHTML("afterbegin", '<span class="rep-num">' + n + '</span>'); });
          elegido = null; Sonido.efecto("exitoCorto");
        } else {
          juego.errores++; juego.tiempo -= 2;
          b.classList.add("mal"); setTimeout(function () { b.classList.remove("mal"); }, 400);
          Sonido.efecto("error");
        }
      });
    });
    iniciarBucle(alTerminar);
  }

  /* =================================================================
     6. ATERRIZAR LA PRIMERA ETAPA (cohetes reutilizables)
     Física simple: gravedad hacia abajo, el motor empuja en la dirección
     en que apunta la etapa. 1 píxel ≈ 1 metro; velocidades en m/s ÷ 5.
     ================================================================= */
  function aterrizaje(contenedor, r, inf, alTerminar) {
    const c = armarPantalla(contenedor, "aterrizaje", true, true, false);
    const ctx = c.ctx, dif = inf.dif;
    const G = 26, EMPUJE = 62;                     // aceleraciones en px/s²
    const MAR = ALTO - 40;                         // altura del mar
    const PLAT = { x: ANCHO / 2 + (Math.random() - 0.5) * 220, ancho: 110 - 15 * (dif - 1) * 2, y: MAR - 14 };
    const et = { x: ANCHO / 2 + (Math.random() - 0.5) * 120, y: 30, vx: (Math.random() - 0.5) * 50 * dif, vy: 60 * dif, ang: (Math.random() - 0.5) * 0.3 };
    const humo = [];
    const MS = function (v) { return Math.abs(v) / 5; };      // px/s → m/s que se muestran
    const coma = function (n) { return n.toFixed(1).replace(".", ","); };   // 2.5 → "2,5"
    juego = {
      tiempo: 25, combustible: inf.combustible, encendido: false, resultado: null,
      actualizar: function (dt) {
        if (teclas.izquierda) et.ang -= dt * 1.4;
        if (teclas.derecha) et.ang += dt * 1.4;
        et.ang = Math.max(-1, Math.min(1, et.ang));
        this.encendido = teclas.arriba && this.combustible > 0;
        let ax = 0, ay = G;
        if (this.encendido) {
          this.combustible = Math.max(0, this.combustible - dt);
          ax += Math.sin(et.ang) * EMPUJE; ay -= Math.cos(et.ang) * EMPUJE;
          humo.push({ x: et.x - Math.sin(et.ang) * 46, y: et.y + Math.cos(et.ang) * 46, vida: 1 });
        }
        et.vx += ax * dt; et.vy += ay * dt;
        et.x += et.vx * dt; et.y += et.vy * dt;
        humo.forEach(function (h) { h.vida -= dt * 1.5; h.y += 20 * dt; });
        while (humo.length && humo[0].vida <= 0) humo.shift();
        // ¿Tocó la plataforma o el mar?
        const base = et.y + 44;
        if (base >= PLAT.y) {
          const sobre = Math.abs(et.x - PLAT.x) < PLAT.ancho / 2;
          const suave = MS(et.vy) < 4 && MS(et.vx) < 3, recta = Math.abs(et.ang) < 0.21;
          if (sobre && suave && recta) { this.resultado = "perfecto"; Sonido.efecto("exito"); }
          else if (sobre && MS(et.vy) < 8 && Math.abs(et.ang) < 0.4) { this.resultado = "dañado"; Sonido.efecto("fallaCorta"); }
          else {
            this.resultado = "choque"; Sonido.efecto("impacto");
            this.motivo = !sobre ? "cayó fuera de la plataforma" : (Math.abs(et.ang) >= 0.4 ? "llegó muy inclinada" : "bajó demasiado rápido");
          }
          this.velocidadFinal = MS(et.vy); this.anguloFinal = Math.abs(et.ang) * 180 / Math.PI;
          this.terminado = true;
        }
        if (et.x < -40 || et.x > ANCHO + 40) { this.resultado = "choque"; this.motivo = "se salió de la zona"; this.terminado = true; }
        marcador(ic("gota") + " Combustible: <b>" + coma(this.combustible) + " s</b> · Bajada: <b>" + coma(MS(et.vy)) + " m/s</b>" +
          " · Lado: <b>" + coma(MS(et.vx)) + " m/s</b>");
      },
      dibujar: function () {
        // Cielo y mar
        const g = ctx.createLinearGradient(0, 0, 0, ALTO);
        g.addColorStop(0, "#0b1a3a"); g.addColorStop(1, "#2a5f9e");
        ctx.fillStyle = g; ctx.fillRect(0, 0, ANCHO, ALTO);
        ctx.fillStyle = "#123b6b"; ctx.fillRect(0, MAR, ANCHO, ALTO - MAR);
        // Plataforma en el mar con su "X"
        ctx.fillStyle = "#5b6070"; ctx.fillRect(PLAT.x - PLAT.ancho / 2, PLAT.y, PLAT.ancho, 16);
        ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(PLAT.x - 14, PLAT.y + 3); ctx.lineTo(PLAT.x + 14, PLAT.y + 13); ctx.moveTo(PLAT.x + 14, PLAT.y + 3); ctx.lineTo(PLAT.x - 14, PLAT.y + 13); ctx.stroke();
        // Humo
        humo.forEach(function (h) { ctx.fillStyle = "rgba(220,220,230," + Math.max(0, h.vida) * 0.35 + ")"; ctx.beginPath(); ctx.arc(h.x, h.y, 10 + (1 - h.vida) * 14, 0, Math.PI * 2); ctx.fill(); });
        // La etapa
        ctx.save(); ctx.translate(et.x, et.y); ctx.rotate(et.ang);
        if (this.encendido) {
          ctx.fillStyle = "#ffb703"; ctx.beginPath(); ctx.moveTo(-6, 44); ctx.lineTo(6, 44); ctx.lineTo(0, 44 + 22 + Math.random() * 10); ctx.closePath(); ctx.fill();
          ctx.fillStyle = "#fff3c4"; ctx.beginPath(); ctx.moveTo(-3, 44); ctx.lineTo(3, 44); ctx.lineTo(0, 56); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = "#eef0f4"; ctx.fillRect(-7, -44, 14, 88);
        ctx.fillStyle = "#1a1a1a"; ctx.fillRect(-7, -44, 14, 8); ctx.fillRect(-7, 30, 14, 4);
        ctx.strokeStyle = "#cfd3dc"; ctx.lineWidth = 2;                         // aletas y patas
        ctx.beginPath(); ctx.moveTo(-7, -36); ctx.lineTo(-13, -32); ctx.moveTo(7, -36); ctx.lineTo(13, -32);
        ctx.moveTo(-7, 36); ctx.lineTo(-16, 46); ctx.moveTo(7, 36); ctx.lineTo(16, 46); ctx.stroke();
        ctx.restore();
        // Indicadores
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(10, 10, 200, 52);
        ctx.fillStyle = "#eef2ff"; ctx.font = "13px sans-serif";
        ctx.fillText("Altura: " + Math.max(0, Math.round(PLAT.y - et.y - 44)) + " m", 18, 28);
        ctx.fillText("Inclinación: " + Math.round(et.ang * 180 / Math.PI) + "°", 18, 46);
        const ok = MS(et.vy) < 4;
        ctx.fillStyle = ok ? "#3ddc84" : "#ff5c7a"; ctx.fillText(ok ? "Velocidad segura" : "¡Demasiado rápido!", 120, 46);
      },
      puntaje: function () {
        if (this.resultado === "perfecto") return 0.7 + 0.3 * this.combustible / inf.combustible;
        if (this.resultado === "dañado") return 0.5;
        return 0.1;
      },
      detalle: function () {
        if (!this.resultado) return "Se acabó el tiempo y la etapa cayó al mar.";
        return "Llegó a " + coma(this.velocidadFinal || 0) + " m/s con " + Math.round(this.anguloFinal || 0) + "° de inclinación" +
          (this.resultado === "choque" ? ": " + (this.motivo || "se estrelló") + "." : ", con " + coma(this.combustible) + " s de combustible sobrante.");
      }
    };
    iniciarBucle(alTerminar);
  }

  /* =================================================================
     ENTRADA PRINCIPAL
     ================================================================= */
  const JUEGOS = { asteroides: asteroides, tormenta: tormenta, antena: antena, orbita: orbita, reparacion: reparacion, aterrizaje: aterrizaje };

  function jugar(tipo, contenedor, r, alTerminar) {
    if (juego) { cancelAnimationFrame(juego.raf); juego = null; }
    accionPendiente = false;
    JUEGOS[tipo](contenedor, r, influencia(tipo, r), alTerminar);
  }

  // Nivel según el puntaje: bien (≥70%), regular (≥40%) o mal
  function nivel(puntaje) { return puntaje >= 0.7 ? "bien" : (puntaje >= 0.4 ? "regular" : "mal"); }

  return {
    jugar: jugar, influencia: influencia, nivel: nivel,
    info: function (tipo) { return INFO[tipo]; },
    tipos: function () { return Object.keys(INFO); },
    activo: function () { return !!juego; },
    detener: function () { if (juego) { cancelAnimationFrame(juego.raf); juego = null; } }
  };
})();
