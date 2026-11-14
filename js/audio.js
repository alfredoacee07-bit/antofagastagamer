/* =====================================================================
   audio.js — Efectos de sonido y música de SPACE SIMULATOR
   ---------------------------------------------------------------------
   Todo el sonido se CREA con código usando la Web Audio API: no hace
   falta descargar nada y no hay derechos de autor de terceros.

   - Efectos: Sonido.efecto("despegue"), Sonido.efecto("clic"), ...
   - Música:  Sonido.musica("inicio"), "diseno", "lanzamiento",
              "simulacion", "victoria" o "derrota".
     Si pones un archivo MP3 con ese nombre en assets/musica/
     (por ejemplo assets/musica/inicio.mp3), el juego lo usa en lugar
     de la música creada por código.
   - Volumen de música y de efectos por separado, y botón de silencio.

   Los navegadores solo dejan sonar audio después de que la persona
   toca la pantalla o hace clic: por eso existe Sonido.desbloquear().
   ===================================================================== */

const Sonido = (function () {

  let ctx = null;                 // el "estudio de sonido" del navegador
  let gMaestro, gMusica, gEfectos;
  let bufferRuido = null;         // ruido blanco para motores, humo, impactos
  const prefs = { volMusica: 0.6, volEfectos: 0.8, silencio: false };

  /* ---------- Preparar el audio ---------- */
  function asegurar() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      gMaestro = ctx.createGain(); gMaestro.connect(ctx.destination);
      gMusica = ctx.createGain(); gMusica.connect(gMaestro);
      gEfectos = ctx.createGain(); gEfectos.connect(gMaestro);
      // 2 segundos de ruido blanco, reutilizable
      bufferRuido = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const datos = bufferRuido.getChannelData(0);
      for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
      aplicarVolumenes();
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  }

  function aplicarVolumenes() {
    if (gMaestro) {
      gMaestro.gain.value = prefs.silencio ? 0 : 1;
      gMusica.gain.value = prefs.volMusica * 0.35;     // la música va más suave que los efectos
      gEfectos.gain.value = prefs.volEfectos * 0.7;
    }
    if (pistaArchivo) pistaArchivo.volume = prefs.silencio ? 0 : prefs.volMusica * 0.7;
  }

  function configurar(nuevas) {
    Object.assign(prefs, nuevas);
    aplicarVolumenes();
  }

  /* ---------- Ladrillos básicos: una nota y un ruido ---------- */
  // Toca una nota con forma de onda "tipo", que sube en "ataque" segundos y se apaga en "salida"
  function nota(freq, t, dur, o) {
    o = o || {};
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.tipo || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.freqFinal) osc.frequency.exponentialRampToValueAtTime(o.freqFinal, t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const vol = o.vol === undefined ? 0.3 : o.vol;
    const ataque = o.ataque || 0.005, salida = o.salida || 0.1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + ataque);
    g.gain.setValueAtTime(vol, t + Math.max(ataque, dur - salida));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let salidaNodo = g;
    if (o.filtro) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = o.filtro; f.Q.value = o.q || 0.7;
      g.connect(f); salidaNodo = f;
    }
    salidaNodo.connect(o.destino || gEfectos);
    osc.connect(g);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  // Ruido filtrado: sirve para motores, viento, impactos y platillos
  function ruido(t, dur, o) {
    o = o || {};
    const src = ctx.createBufferSource();
    src.buffer = bufferRuido; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.filtroTipo || "lowpass";
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.freqFinal) f.frequency.exponentialRampToValueAtTime(o.freqFinal, t + dur);
    f.Q.value = o.q || 0.7;
    const g = ctx.createGain();
    const vol = o.vol === undefined ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.ataque || 0.01));
    if (o.sostener) g.gain.setValueAtTime(vol, t + o.sostener);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.destino || gEfectos);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }

  /* =================================================================
     EFECTOS DE SONIDO
     ================================================================= */
  const EFECTOS = {
    clic: function (t) { nota(1200, t, 0.05, { tipo: "triangle", vol: 0.15, salida: 0.04 }); },
    seleccionar: function (t) {
      nota(660, t, 0.08, { tipo: "triangle", vol: 0.18 });
      nota(990, t + 0.06, 0.1, { tipo: "triangle", vol: 0.15 });
    },
    error: function (t) { nota(220, t, 0.18, { tipo: "square", vol: 0.12, filtro: 1200 }); },
    // Cuenta regresiva: pitido corto
    cuenta: function (t) { nota(880, t, 0.18, { tipo: "sine", vol: 0.35, salida: 0.12 }); },
    // Despegue: rugido grave que crece y luego se aleja
    despegue: function (t) {
      nota(1320, t, 0.4, { tipo: "sine", vol: 0.35 });                       // "¡cero!"
      ruido(t + 0.1, 6, { freq: 200, freqFinal: 900, vol: 0.9, ataque: 0.8, sostener: 3.5, q: 0.5 });
      ruido(t + 0.1, 6, { freq: 60, freqFinal: 120, vol: 0.9, ataque: 0.5, sostener: 3.8, q: 1.5 });
      nota(45, t + 0.1, 5.5, { tipo: "sawtooth", vol: 0.25, ataque: 0.8, salida: 2, filtro: 150 });
    },
    // Separación de etapas: golpe metálico + soplido
    separacion: function (t) {
      nota(140, t, 0.35, { tipo: "square", vol: 0.3, freqFinal: 60, filtro: 900 });
      ruido(t, 0.25, { filtroTipo: "bandpass", freq: 2500, vol: 0.5, q: 2 });
      ruido(t + 0.15, 1.5, { filtroTipo: "highpass", freq: 3000, freqFinal: 800, vol: 0.25, ataque: 0.05 });
    },
    // Alarma de emergencia: dos tonos que se alternan
    alarma: function (t) {
      for (let i = 0; i < 4; i++) {
        nota(880, t + i * 0.36, 0.18, { tipo: "square", vol: 0.12, filtro: 2500 });
        nota(660, t + i * 0.36 + 0.18, 0.18, { tipo: "square", vol: 0.12, filtro: 2500 });
      }
    },
    // Impacto de asteroide o basura
    impacto: function (t) {
      nota(90, t, 0.6, { tipo: "sine", vol: 0.7, freqFinal: 35 });
      ruido(t, 0.5, { freq: 2500, freqFinal: 200, vol: 0.7 });
      ruido(t + 0.05, 1.2, { filtroTipo: "bandpass", freq: 900, vol: 0.12, q: 4, ataque: 0.02 });
    },
    // Pitidos de comunicación (estación terrena)
    pitido: function (t) {
      [0, 0.12, 0.24].forEach(function (d, i) { nota(1800 + i * 200, t + d, 0.07, { tipo: "sine", vol: 0.2 }); });
      ruido(t, 0.4, { filtroTipo: "bandpass", freq: 3000, vol: 0.05, q: 8 });
    },
    // Éxito: arpegio mayor ascendente
    exito: function (t) {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { nota(f, t + i * 0.12, 0.5, { tipo: "triangle", vol: 0.25, salida: 0.3 }); });
      nota(1046.5, t + 0.48, 1.2, { tipo: "sine", vol: 0.15, ataque: 0.05, salida: 0.9 });
    },
    // Falla: tonos menores que bajan
    falla: function (t) {
      [392, 349.23, 311.13, 233.08].forEach(function (f, i) { nota(f, t + i * 0.22, 0.45, { tipo: "sawtooth", vol: 0.12, filtro: 1200, salida: 0.3 }); });
    },
    exitoCorto: function (t) {
      nota(784, t, 0.15, { tipo: "triangle", vol: 0.22 }); nota(1175, t + 0.1, 0.3, { tipo: "triangle", vol: 0.2 });
    },
    fallaCorta: function (t) {
      nota(330, t, 0.2, { tipo: "sawtooth", vol: 0.12, filtro: 1000 }); nota(247, t + 0.15, 0.35, { tipo: "sawtooth", vol: 0.12, filtro: 900 });
    }
  };

  function efecto(nombre) {
    if (!EFECTOS[nombre] || !asegurar()) return;
    try { EFECTOS[nombre](ctx.currentTime + 0.01); } catch (e) { /* nunca detener el juego por un sonido */ }
  }

  /* =================================================================
     MÚSICA CREADA POR CÓDIGO
     Cada pista tiene: velocidad (bpm), nota base, acordes y "capas":
       pad = fondo suave · arpegio = notas rápidas · bajo · bateria
     Los acordes son semitonos desde la nota base.
     ================================================================= */
  const PISTAS = {
    inicio: {
      nombre: "Inicio: horizonte", bpm: 68, base: 110,           // La
      acordes: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]],   // Lam · Fa · Do · Sol
      pad: { tipo: "sawtooth", vol: 0.12, filtro: 900 }, arpegio: { cada: 4, octava: 2, tipo: "triangle", vol: 0.08 }, bajo: { cada: 8, vol: 0.18 }
    },
    diseno: {
      nombre: "Diseño: taller espacial", bpm: 96, base: 146.83,  // Re
      acordes: [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 17]],
      pad: { tipo: "triangle", vol: 0.1, filtro: 1400 }, arpegio: { cada: 2, octava: 1, tipo: "sine", vol: 0.1 }, bajo: { cada: 8, vol: 0.16 }, bateria: { platillo: 4 }
    },
    lanzamiento: {
      nombre: "Lanzamiento: cuenta regresiva", bpm: 122, base: 82.41, // Mi
      acordes: [[0, 7, 12], [0, 7, 12], [-4, 3, 8], [-2, 5, 10]],
      pad: { tipo: "sawtooth", vol: 0.09, filtro: 700 }, arpegio: { cada: 1, octava: 2, tipo: "square", vol: 0.045, filtro: 1800 }, bajo: { cada: 2, vol: 0.2 }, bateria: { bombo: 4, platillo: 2, caja: 8 }
    },
    simulacion: {
      nombre: "Simulación: en órbita", bpm: 76, base: 130.81,     // Do
      acordes: [[0, 4, 7, 14], [2, 6, 9, 14], [4, 7, 11, 16], [2, 6, 9, 13]],
      pad: { tipo: "sine", vol: 0.14, filtro: 1200 }, arpegio: { cada: 3, octava: 2, tipo: "sine", vol: 0.07, azar: true }, bajo: { cada: 16, vol: 0.14 }
    },
    victoria: {
      nombre: "Victoria: misión cumplida", bpm: 112, base: 130.81,
      acordes: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]],
      pad: { tipo: "triangle", vol: 0.12, filtro: 2000 }, arpegio: { cada: 2, octava: 2, tipo: "square", vol: 0.05, filtro: 2500 }, bajo: { cada: 4, vol: 0.18 }, bateria: { bombo: 4, caja: 8 }
    },
    derrota: {
      nombre: "Derrota: silencio en la radio", bpm: 58, base: 110,
      acordes: [[0, 3, 7], [5, 8, 12], [7, 11, 14], [0, 3, 7]],
      pad: { tipo: "sine", vol: 0.15, filtro: 700 }, arpegio: { cada: 8, octava: 1, tipo: "triangle", vol: 0.07 }, bajo: { cada: 16, vol: 0.14 }
    }
  };

  let pistaActual = null;       // nombre de la pista que suena
  let pistaArchivo = null;      // si suena un MP3, el elemento <audio>
  const hayArchivo = {};        // recuerda qué pistas tienen MP3 (true / false)
  let temporizador = null, paso = 0, proximoTiempo = 0;

  function frecuencia(base, semitonos) { return base * Math.pow(2, semitonos / 12); }

  // Programa los sonidos de un "paso" (una semicorchea)
  function tocarPaso(p, t) {
    const pista = PISTAS[pistaActual];
    const acorde = pista.acordes[Math.floor(p / 16) % pista.acordes.length];
    const dur16 = 60 / pista.bpm / 4;

    if (p % 16 === 0) acorde.forEach(function (s, i) {        // fondo: un acorde por compás
      nota(frecuencia(pista.base * 2, s), t, dur16 * 16, { tipo: pista.pad.tipo, vol: pista.pad.vol / acorde.length * 2, ataque: dur16 * 3, salida: dur16 * 6, filtro: pista.pad.filtro, destino: gMusica, detune: i % 2 ? 6 : -6 });
    });
    if (pista.arpegio && p % pista.arpegio.cada === 0) {
      const a = pista.arpegio;
      const idx = a.azar ? Math.floor(Math.random() * acorde.length) : (p / a.cada) % acorde.length;
      if (!a.azar || Math.random() < 0.6) nota(frecuencia(pista.base * Math.pow(2, a.octava), acorde[idx]), t, dur16 * Math.max(2, a.cada), { tipo: a.tipo, vol: a.vol, salida: dur16 * 1.5, filtro: a.filtro, destino: gMusica });
    }
    if (pista.bajo && p % pista.bajo.cada === 0) {
      nota(frecuencia(pista.base / 2, acorde[0]), t, dur16 * Math.min(pista.bajo.cada, 8), { tipo: "triangle", vol: pista.bajo.vol, salida: dur16 * 2, filtro: 600, destino: gMusica });
    }
    const b = pista.bateria;
    if (b) {
      if (b.bombo && p % b.bombo === 0) nota(120, t, 0.25, { tipo: "sine", vol: 0.5, freqFinal: 40, destino: gMusica });
      if (b.platillo && p % b.platillo === 0) ruido(t, 0.05, { filtroTipo: "highpass", freq: 7000, vol: 0.08, destino: gMusica });
      if (b.caja && p % b.caja === b.caja / 2) ruido(t, 0.15, { filtroTipo: "bandpass", freq: 1800, vol: 0.18, q: 0.8, destino: gMusica });
    }
  }

  // Programador: mira 0,2 s hacia adelante y agenda las notas a tiempo
  function programar() {
    if (!pistaActual || !PISTAS[pistaActual]) return;
    const dur16 = 60 / PISTAS[pistaActual].bpm / 4;
    while (proximoTiempo < ctx.currentTime + 0.2) {
      try { tocarPaso(paso, proximoTiempo); } catch (e) { /* seguir */ }
      paso++;
      proximoTiempo += dur16;
    }
  }

  function detenerMusica() {
    if (temporizador) { clearInterval(temporizador); temporizador = null; }
    if (pistaArchivo) { pistaArchivo.pause(); pistaArchivo = null; }
  }

  function empezarGenerada(nombre) {
    if (!asegurar()) return;
    paso = 0;
    proximoTiempo = ctx.currentTime + 0.1;
    temporizador = setInterval(programar, 50);
  }

  // Cambia la música (si ya suena esa pista, no hace nada)
  let pausada = false;                          // true mientras se ve un video
  function musica(nombre) {
    if (!PISTAS[nombre] || nombre === pistaActual) return;
    detenerMusica();
    pistaActual = nombre;
    if (!desbloqueado || pausada) return;       // empezará cuando la persona toque la pantalla o termine el video
    iniciarPista(nombre);
  }
  function pausarMusica() { pausada = true; detenerMusica(); }
  function reanudarMusica() {
    if (!pausada) return;
    pausada = false;
    if (desbloqueado && pistaActual) iniciarPista(pistaActual);
  }

  function iniciarPista(nombre) {
    if (hayArchivo[nombre] === false) { empezarGenerada(nombre); return; }
    // Probar si existe assets/musica/<nombre>.mp3
    const el = new Audio("assets/musica/" + nombre + ".mp3");
    el.loop = true;
    el.volume = prefs.silencio ? 0 : prefs.volMusica * 0.7;
    el.addEventListener("error", function () {
      hayArchivo[nombre] = false;
      if (pistaActual === nombre && pistaArchivo === el) { pistaArchivo = null; empezarGenerada(nombre); }
    });
    el.addEventListener("playing", function () { hayArchivo[nombre] = true; });
    pistaArchivo = el;
    el.play().catch(function () { /* lo resuelve el evento "error" */ });
  }

  /* ---------- Desbloqueo con el primer toque ---------- */
  let desbloqueado = false;
  function desbloquear() {
    if (desbloqueado) return;
    desbloqueado = true;
    asegurar();
    if (pistaActual && !pausada) iniciarPista(pistaActual);
  }

  return {
    efecto: efecto, musica: musica, detenerMusica: detenerMusica, pausarMusica: pausarMusica, reanudarMusica: reanudarMusica,
    volumenEfectos: function () { return prefs.silencio ? 0 : prefs.volEfectos; }, desbloquear: desbloquear, configurar: configurar,
    pistas: function () { return Object.keys(PISTAS).map(function (id) { return { id: id, nombre: PISTAS[id].nombre }; }); },
    pistaActual: function () { return pistaActual; },
    estado: function () { return ctx ? ctx.state : "sin iniciar"; },   // "running" = sonando
    usaArchivo: function (n) { return hayArchivo[n] === true; }
  };
})();
