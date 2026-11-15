/* =====================================================================
   supervivencia.js — Modo "Varado en Marte": la lógica
   ---------------------------------------------------------------------
   - El astronauta camina por el cráter (flechas, WASD o control táctil).
   - El reloj avanza: cada sol (día marciano) dura unos segundos de juego.
   - Los recursos de la base (oxígeno, agua, comida, energía) suben y bajan
     según lo que esté encendido, el Sol, el polvo y lo que hagas.
   - En cada lugar hay acciones (limpiar paneles, excavar hielo, sembrar...)
     que toman horas del día.
   Los números están en js/datos/supervivencia.js. El dibujo 3D está en
   vista3d.js (mostrarMarte); aquí está el dibujo 2D de respaldo.
   ===================================================================== */

const Supervivencia = (function () {

  const D = DATOS.supervivencia;
  const ic = Iconos.svg;
  const VELOCIDAD = 4.2, DIST_USO = 3.2, RADIO_BASE_DENTRO = 6;

  const teclas = { arriba: false, abajo: false, izquierda: false, derecha: false };
  const palanca = { x: 0, z: 0 };
  let opciones = null, activo = false, raf2D = null, contenedor = null, ultimoHud = 0;
  let s = null;                       // el estado de la partida

  /* ---------- Relieve del terreno (lo usan la lógica y el 3D) ---------- */
  function altura(x, z) {
    let h = 1.3 * Math.sin(x * 0.07) * Math.cos(z * 0.06) + 0.7 * Math.sin(x * 0.19 + 1.3) * Math.sin(z * 0.16 + 0.4) + 0.25 * Math.sin(x * 0.5 + z * 0.43);
    // Borde del cráter: el terreno sube hacia las orillas del mapa
    const r = Math.hypot(x, z);
    h += Math.max(0, r - 44) * 0.35;
    // Cerca de cada lugar el suelo es plano (ahí se construyó)
    D.lugares.forEach(function (l) {
      const d = Math.hypot(x - l.x, z - l.z), f = Math.max(0, Math.min(1, (d - l.radio - 1.5) / 6));
      h = h * f + (1 - f) * 0;
    });
    return h;
  }

  // Rocas fijas repartidas por el cráter (número pseudoaleatorio con semilla)
  function crearRocas() {
    let semilla = 7;
    const azar = function () { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
    const rocas = [];
    for (let i = 0; i < 90; i++) {
      const x = (azar() - 0.5) * 110, z = (azar() - 0.5) * 110, t = 0.25 + Math.pow(azar(), 3) * 1.6;
      const lejos = D.lugares.every(function (l) { return Math.hypot(x - l.x, z - l.z) > l.radio + 3; }) && Math.hypot(x, z - 4) > 6;
      if (lejos) rocas.push({ x: x, z: z, t: t, giro: azar() * 6.28 });
    }
    return rocas;
  }

  const mundo = {
    jugador: { x: 0, z: 6, ang: 0, andando: 0, paso: 0 },
    lugares: D.lugares, rocas: crearRocas(), cerca: null, limite: D.limite,
    altura: altura, actualizar: actualizarMovimiento,
    estado: function () { return s; }, luzSolar: luzSolar, esNoche: esNoche,
    nave: function () { return estadoNave(); }, hayTormenta: function () { return !!(s && s.tormenta); }
  };

  /* ---------- Una partida nueva ---------- */
  function nuevaPartida(dificultad) {
    const ini = D.inicial;
    s = {
      sol: 1, hora: D.inicioHora, dificultad: dificultad || "ingeniera",
      rescate: D.solesRescate[dificultad] || D.solesRescate.ingeniera,
      rec: Object.assign({}, ini),
      oxigenoOn: true, invernaderoOn: true,
      cultivo: { sembrado: false, progreso: 0 },
      fuera: false, panel: null, pausado: false, terminado: false, ganaste: false, causa: null,
      datosVistos: {}, bitacora: [], tiempoAfuera: 0, viajesHielo: 0, cosechas: 0, limpiezas: 0, contactos: 0,
      roto: { oxigeno: false, antena: false }, tormenta: null, solar: null, perdidoHecho: false, desafios: [], despegue: 0
    };
    s.eventos = programarEventos(s);
    mundo.jugador.x = 0; mundo.jugador.z = 5.2; mundo.jugador.ang = 0;    // frente a la puerta del hábitat
    registrar("casa", "Sol 1: despiertas en la base del cráter Jezero. El rescate llegará el sol " + s.rescate + ".");
    return s;
  }

  // Hora "absoluta" (desde el comienzo), para saber cuándo empieza y termina cada imprevisto
  function horaAbs() { return (s.sol - 1) * D.horasPorSol + s.hora; }

  // Reparte los imprevistos a lo largo de la espera
  function programarEventos(st) {
    const lista = [];
    D.eventos.forEach(function (ev) {
      if (ev.noEnCadete && st.dificultad === "cadete") return;
      if (ev.enSol === undefined) return;                          // los nocturnos se disparan solos
      const base = ev.copiaDe ? Object.assign({}, D.eventos.find(function (x) { return x.id === ev.copiaDe; }), ev) : ev;
      lista.push({ ev: base, sol: Math.max(2, Math.round(1 + ev.enSol * (st.rescate - 1))), hora: 8 + Math.random() * 7, hecho: false });
    });
    return lista;
  }
  function evento(id) { return D.eventos.find(function (x) { return x.id === id; }); }

  /* ---------- Imprevistos ---------- */
  function disparar(item) {
    item.hecho = true;
    const ev = item.ev;
    s.interrumpido = true;
    Sonido.efecto("alarma");
    registrar("alerta", "<b>" + ev.titulo + "</b> " + ev.texto.split(". ")[0] + ".", "mal");
    if (ev.tipo === "falla") {
      s.roto[ev.lugar] = true;
      if (ev.lugar === "oxigeno") registrar("burbuja", "El generador de oxígeno está roto: ve a repararlo.", "mal");
      mostrar(ev, null);
    } else if (ev.tipo === "aviso") {
      const ahora = horaAbs();
      s.solar = { desde: ahora + ev.avisoHoras, hasta: ahora + ev.avisoHoras + ev.duracionHoras, avisado: false };
      mostrar(ev, null);
    } else if (ev.tipo === "decision") {
      s.tormenta = { hasta: horaAbs() + ev.duracionSoles * D.horasPorSol };
      mostrar(ev, function (i) {
        const op = ev.opciones[i];
        if (op.efecto.invernaderoOn === false) s.invernaderoOn = false;
        if (op.efecto.oxigenoOn === false) s.oxigenoOn = false;
        registrar("sol", "Decidiste: " + op.texto.toLowerCase() + ".");
        dibujarHud();
      });
    } else if (ev.tipo === "minijuego") {
      jugar(ev, function (nivel) { aplicarResultado(ev, nivel); });
    }
  }
  function mostrar(ev, alElegir) {
    if (opciones && opciones.mostrarImprevisto) opciones.mostrarImprevisto(ev, alElegir);
    else if (alElegir) alElegir(ev.opciones.length - 1);
  }
  function jugar(ev, alTerminar) {
    if (opciones && opciones.jugarDesafio) opciones.jugarDesafio(ev, function (nivel, pct) { s.desafios.push(pct); alTerminar(nivel); });
    else alTerminar("regular");
  }
  // Lo que pasa según cómo te fue en el minijuego
  function aplicarResultado(ev, nivel) {
    const res = ev.resultados[nivel] || {};
    if (res.horas) avanzar(res.horas);
    if (res.traje) s.rec.traje = limitar(s.rec.traje + res.traje, 0, 100);
    if (res.adelantaRescate && s.rescate - res.adelantaRescate > s.sol) s.rescate -= res.adelantaRescate;
    registrar(nivel === "mal" ? "alerta" : "check", res.mensaje, nivel === "mal" ? "mal" : "");
    dibujarHud(); dibujarPanel();
    return res;
  }

  // Estado de la nave de rescate (para el dibujo 3D): "ausente", "bajando", "en tierra" o "despegando"
  function estadoNave() {
    if (!s) return { fase: "ausente" };
    if (s.ganaste) return { fase: "despegando", t: (performance.now() - s.despegue) / 1000 };
    const dia = s.sol === s.rescate || s.sol === s.rescate + 1;
    if (!dia) return { fase: "ausente" };
    if (s.hora >= D.naveLlega - 1 && s.hora < D.naveLlega) return { fase: "bajando", progreso: s.hora - (D.naveLlega - 1) };
    if (s.hora >= D.naveLlega && s.hora <= D.naveEspera) return { fase: "en tierra" };
    return { fase: "ausente" };
  }

  /* ---------- Sol y noche ---------- */
  // Cuánta luz solar hay a esa hora (0 = noche, 1 = mediodía)
  function luzSolar(hora) {
    if (hora < D.amanecer || hora > D.atardecer) return 0;
    return Math.sin(Math.PI * (hora - D.amanecer) / (D.atardecer - D.amanecer));
  }
  function esNoche(hora) { return luzSolar(hora === undefined ? s.hora : hora) <= 0; }
  function textoHora(h) { const hh = Math.floor(h), mm = Math.floor((h - hh) * 60); return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm; }

  /* ---------- El paso del tiempo: aquí se calculan todos los recursos ---------- */
  function avanzar(horas) {
    const E = D.energia, c = D.consumoPorSol;
    let resto = horas;
    s.interrumpido = false;
    while (resto > 0 && !s.terminado && !s.interrumpido) {
      const dh = Math.min(0.25, resto); resto -= dh;
      const fr = dh / D.horasPorSol, r = s.rec, noche = esNoche(), ahora = horaAbs();
      // Tormenta de polvo: tapa el Sol y al final deja los paneles más sucios
      if (s.tormenta && ahora >= s.tormenta.hasta) { s.tormenta = null; r.polvo = Math.min(0.9, r.polvo + 0.2); registrar("sol", "La tormenta de polvo terminó, pero dejó los paneles muy sucios. ¡A limpiarlos!"); }
      // Tormenta solar: muchísima radiación afuera mientras dura
      const solarActiva = s.solar && ahora >= s.solar.desde && ahora < s.solar.hasta;
      if (s.solar && solarActiva && !s.solar.avisado) { s.solar.avisado = true; registrar("alerta", "¡Llegó la tormenta solar! " + (s.fuera ? "Estás afuera: ¡corre al hábitat!" : "Quédate dentro del hábitat."), "mal"); Sonido.efecto("alarma"); }
      if (s.solar && ahora >= s.solar.hasta) { registrar("check", "La tormenta solar terminó. Ya puedes salir."); s.solar = null; }
      // Energía: lo que dan los paneles menos lo que gasta la base
      const hayEnergia = r.energia > 0.01;
      const produccion = E.panelesKW * (1 - r.polvo) * luzSolar(s.hora) * (s.tormenta ? 0.2 : 1);
      let gasto = E.baseKW + E.recicladorKW + (s.oxigenoOn ? E.oxigenoKW : 0) + (s.invernaderoOn ? E.invernaderoKW : 0);
      r.energia = limitar(r.energia + (produccion - gasto) * dh, 0, D.maximos.energia);
      // Oxígeno: el generador produce (si hay energía) y tú respiras
      r.oxigeno += ((s.oxigenoOn && hayEnergia && !s.roto.oxigeno ? D.oxigenoPorSol : 0) - c.oxigeno) * fr;
      // Agua: el reciclador recupera una parte; el invernadero también usa
      const recicla = hayEnergia ? D.reciclajeAgua : 0;
      r.agua -= c.agua * (1 - recicla) * fr + (s.cultivo.sembrado && s.invernaderoOn ? D.invernadero.aguaPorSol * fr : 0);
      r.comida -= c.comida * fr;
      // Polvo sobre los paneles
      r.polvo = Math.min(0.9, r.polvo + D.polvoPorSol * fr);
      // Cultivo: crece con luz, calor y agua
      if (s.cultivo.sembrado && s.invernaderoOn && hayEnergia && r.agua > 0) s.cultivo.progreso = Math.min(1, s.cultivo.progreso + fr / D.invernadero.solesCosecha);
      // Traje y radiación
      if (s.fuera) {
        r.traje -= D.traje.gastoPorSolFuera * (noche ? D.traje.gastoNocheExtra : 1) * fr;
        r.radiacion += D.radiacion.superficiePorSol * fr * (solarActiva ? 60 : 1);
        s.tiempoAfuera += dh;
      } else {
        r.traje += 100 * 4 * fr;                     // dentro se carga (lleno en ~6 horas)
        r.radiacion += D.radiacion.basePorSol * fr * (solarActiva ? 3 : 1);
      }
      // Salud: baja si falta algo vital; sube un poco si todo está bien y estás en la base
      let dano = 0;
      if (r.oxigeno <= 0) dano += 220;               // por sol (sin aire, muy rápido)
      if (r.agua <= 0) dano += 30;
      if (r.comida <= 0) dano += 14;
      if (!hayEnergia && !s.fuera) dano += 20;        // sin calefacción
      if (s.fuera && r.traje <= 0) dano += 300;
      if (s.fuera && solarActiva) dano += 70;         // radiación muy alta (unas 3% de salud por hora)
      r.salud += (dano > 0 ? -dano : (s.fuera ? 0 : 6)) * fr;
      r.oxigeno = limitar(r.oxigeno, 0, D.maximos.oxigeno); r.agua = limitar(r.agua, 0, D.maximos.agua);
      r.comida = limitar(r.comida, 0, D.maximos.comida); r.traje = limitar(r.traje, 0, 100); r.salud = limitar(r.salud, 0, 100);
      // Reloj
      s.hora += dh;
      if (s.hora >= D.horasPorSol) { s.hora -= D.horasPorSol; s.sol++; nuevoSol(); }
      revisarAvisos();
      if (r.salud <= 0) { terminar(false, causaMuerte()); break; }
      // ¿Toca un imprevisto? (interrumpe lo que estabas haciendo, incluso dormir)
      const toca = s.eventos.find(function (it) { return !it.hecho && (s.sol > it.sol || (s.sol === it.sol && s.hora >= it.hora)); });
      if (toca) { disparar(toca); break; }
      if (!s.perdidoHecho && s.sol >= 3 && s.fuera && noche && Math.hypot(mundo.jugador.x, mundo.jugador.z) > 14) {
        s.perdidoHecho = true; disparar({ ev: evento("perdido"), hecho: false }); break;
      }
    }
  }
  function limitar(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function causaMuerte() {
    const r = s.rec;
    if (r.oxigeno <= 0) return "Se acabó el oxígeno de la base.";
    if (s.fuera && r.traje <= 0) return "El traje se quedó sin batería afuera.";
    if (r.agua <= 0) return "Se acabó el agua.";
    if (r.comida <= 0) return "Se acabó la comida.";
    return "La base se quedó sin energía y se congeló.";
  }

  function nuevoSol() {
    registrar("sol", "Amanece el sol " + s.sol + ". Faltan " + Math.max(0, s.rescate - s.sol) + " soles para el rescate.");
    const orden = ["sol", "aire", "moxie", "frio", "polvo", "gravedad", "radiacion", "agua", "atardecer", "lunas"];
    const dato = orden[(s.sol - 2) % orden.length];
    if (s.sol >= 2) mostrarDato(dato);
    if (s.sol === s.rescate) { registrar("cohete", "¡Hoy llega la nave de rescate! Aterriza a las 9:00 en la zona de aterrizaje y espera hasta las 18:00."); avisarPaz("¡Hoy es el día!", "La nave de rescate aterriza hoy a las 9:00 en la zona de aterrizaje, al noroeste de la base. Llega allá antes de las 18:00 con el traje cargado."); }
    if (s.sol === s.rescate + 1) { registrar("alerta", "¡Última oportunidad! La nave volvió a aterrizar: hoy espera hasta las 18:00.", "mal"); }
    if (s.sol > s.rescate + 1) terminar(false, "La nave de rescate no pudo esperar más y tuvo que despegar sin ti.");
  }

  // Avisos cuando un recurso se pone en peligro (una vez por recurso hasta que se recupere)
  const avisado = {};
  function revisarAvisos() {
    const r = s.rec;
    [["oxigeno", r.oxigeno < 2, "¡Queda poco oxígeno en la base! Revisa que el generador esté encendido y que haya energía."],
     ["agua", r.agua < 4, "¡Queda poca agua! Trae hielo del depósito y derrítelo en el hábitat."],
     ["comida", r.comida < 4, "¡Quedan pocas raciones! Siembra y cosecha en el invernadero."],
     ["energia", r.energia < 2.5, "¡Baterías casi vacías! Limpia los paneles o apaga algo."],
     ["traje", s.fuera && r.traje < 25, "¡El traje se está descargando! Vuelve al hábitat."]].forEach(function (a) {
      if (a[1] && !avisado[a[0]]) { avisado[a[0]] = true; registrar("alerta", a[2], "mal"); Sonido.efecto("alarma"); }
      if (!a[1]) avisado[a[0]] = false;
    });
    if (esNoche() && !s.datosVistos.frio) mostrarDato("frio");
    if (s.hora > D.atardecer - 0.8 && s.hora < D.atardecer && !s.datosVistos.atardecer) mostrarDato("atardecer");
  }

  function mostrarDato(id) {
    if (s.datosVistos[id]) return;
    const d = D.datosMarte.find(function (x) { return x.id === id; });
    if (!d) return;
    s.datosVistos[id] = true;
    registrar("idea", "<b>" + d.titulo + ":</b> " + d.texto, "dato");
  }

  function registrar(icono, texto, tipo) {
    s.bitacora.unshift({ sol: s.sol, hora: s.hora, icono: icono, texto: texto, tipo: tipo || "" });
    if (s.bitacora.length > 40) s.bitacora.pop();
    dibujarBitacora();
  }
  function avisarPaz(t, x) { if (opciones && opciones.decirPaz) opciones.decirPaz(t, x); }

  /* ---------- Movimiento (cada cuadro) ---------- */
  function actualizarMovimiento(dt) {
    if (!s || s.terminado) return;
    const j = mundo.jugador;
    const quieto = s.panel || s.pausado || !document.getElementById("modal").classList.contains("oculto");
    if (!quieto) {
      let dx = (teclas.derecha ? 1 : 0) - (teclas.izquierda ? 1 : 0) + palanca.x;
      let dz = (teclas.abajo ? 1 : 0) - (teclas.arriba ? 1 : 0) + palanca.z;
      const largo = Math.hypot(dx, dz);
      if (largo > 1) { dx /= largo; dz /= largo; }
      const moviendo = largo > 0.08;
      if (moviendo) {
        j.x += dx * VELOCIDAD * dt; j.z += dz * VELOCIDAD * dt;
        let dif = Math.atan2(dx, dz) - j.ang;
        while (dif > Math.PI) dif -= Math.PI * 2; while (dif < -Math.PI) dif += Math.PI * 2;
        j.ang += dif * Math.min(1, dt * 12);
        j.paso += dt * VELOCIDAD * Math.min(1, largo) * 2.2;
      }
      j.andando += ((moviendo ? 1 : 0) - j.andando) * Math.min(1, dt * 8);
      // Bordes y choques con lugares y rocas grandes
      j.x = limitar(j.x, -D.limite, D.limite); j.z = limitar(j.z, -D.limite, D.limite);
      D.lugares.concat(mundo.rocas.filter(function (r) { return r.t > 0.9; }).map(function (r) { return { x: r.x, z: r.z, radio: r.t * 0.9 }; })).forEach(function (l) {
        const ex = j.x - l.x, ez = j.z - l.z, d = Math.hypot(ex, ez);
        if (d < l.radio && d > 0.0001) { j.x = l.x + ex / d * l.radio; j.z = l.z + ez / d * l.radio; }
      });
      // El tiempo corre
      avanzar(dt / D.segundosPorSol * D.horasPorSol);
    } else j.andando *= 0.8;
    s.fuera = Math.hypot(j.x, j.z) > RADIO_BASE_DENTRO;
    j.y = altura(j.x, j.z);
    // ¿Qué lugar está cerca?
    let cerca = null, mejor = Infinity;
    D.lugares.forEach(function (l) { const d = Math.hypot(j.x - l.x, j.z - l.z) - l.radio; if (d < DIST_USO && d < mejor) { mejor = d; cerca = l; } });
    if (cerca !== mundo.cerca) { mundo.cerca = cerca; avisoCercania(); }
    // Si llegas a la zona de aterrizaje con la nave en tierra, subes solo
    if (cerca && cerca.id === "rescate" && estadoNave().fase === "en tierra" && !s.terminado) subirANave();
    const ahora = performance.now();
    if (ahora - ultimoHud > 250) { ultimoHud = ahora; dibujarHud(); }
  }

  /* ---------- Acciones en cada lugar ---------- */
  function puede(id) {
    const r = s.rec;
    switch (id) {
      case "derretir": return s.rec.hielo > 0 ? { ok: true } : { ok: false, motivo: "No traes hielo. Ve al depósito de hielo." };
      case "sembrar": return s.cultivo.sembrado ? { ok: false, motivo: "Ya hay plantas creciendo." } : { ok: true };
      case "cosechar": return s.cultivo.sembrado && s.cultivo.progreso >= 1 ? { ok: true } : { ok: false, motivo: s.cultivo.sembrado ? "Aún no están listas (" + Math.round(s.cultivo.progreso * 100) + "%)." : "No hay nada sembrado." };
      case "excavar": return r.hielo >= D.maximos.hielo ? { ok: false, motivo: "La mochila está llena." } : { ok: true };
      case "esperarRescate": return s.sol === s.rescate || s.sol === s.rescate + 1 ? { ok: true } : { ok: false, motivo: "La nave llega el sol " + s.rescate + ". Hoy es el sol " + s.sol + "." };
      case "reparar": return s.roto.oxigeno ? { ok: true } : { ok: false, motivo: "El generador funciona bien." };
      case "alinear": return s.roto.antena ? { ok: true } : { ok: false, motivo: "La antena apunta bien a la Tierra." };
      case "contactar": return s.roto.antena ? { ok: false, motivo: "La antena no apunta a la Tierra: primero alinéala." } : { ok: true };
      case "alternarOxigeno": return s.roto.oxigeno ? { ok: false, motivo: "Está roto: primero repáralo." } : { ok: true };
      default: return { ok: true };
    }
  }

  // Las acciones visibles de un lugar (reparar solo aparece si algo se rompió)
  function accionesDe(lugar) {
    return (D.acciones[lugar] || []).filter(function (a) { return !a.soloSiRoto || s.roto[lugar]; });
  }

  function ejecutar(id) {
    const acc = accionesDe(s.panel).find(function (a) { return a.id === id; });
    const p = puede(id);
    if (!p.ok) { Sonido.efecto("error"); registrar("alerta", p.motivo, "mal"); dibujarPanel(); return; }
    const r = s.rec;
    if (acc && acc.horas) avanzar(acc.horas);
    if (s.terminado) return;
    switch (id) {
      case "descansar": {
        let horas = (D.inicioHora - s.hora + D.horasPorSol) % D.horasPorSol; if (horas < 1) horas += D.horasPorSol;
        avanzar(horas); if (s.terminado) return;
        if (s.interrumpido) { registrar("alerta", "¡Una alarma te despertó a las " + textoHora(s.hora) + "!", "mal"); break; }
        r.salud = Math.min(100, r.salud + 8);
        registrar("luna", "Dormiste hasta las " + textoHora(s.hora) + ". Recuperaste energías.");
        break;
      }
      case "reparar": case "alinear": {
        const lugar = id === "reparar" ? "oxigeno" : "antena";
        const ev = evento(lugar === "oxigeno" ? "fallaOxigeno" : "antenaFalla");
        s.panel = null; dibujarPanel();
        jugar(ev, function (nivel) {
          s.roto[lugar] = false;
          aplicarResultado(ev, nivel);
          if (lugar === "oxigeno" && !s.oxigenoOn) s.oxigenoOn = true;
        });
        return;
      }
      case "cargarTraje": r.traje = 100; registrar("bateria", "Traje cargado al 100%."); break;
      case "derretir": {
        const litros = r.hielo; r.hielo = 0; r.agua = Math.min(D.maximos.agua, r.agua + litros); r.energia = Math.max(0, r.energia - 1.5);
        registrar("gota", "Derretiste el hielo: +" + fmt(litros) + " litros de agua."); Sonido.efecto("exitoCorto"); break;
      }
      case "comer": abrirResumen(); return;
      case "limpiar": { const antes = r.polvo; r.polvo = 0.02; s.limpiezas++; registrar("sol", "Paneles limpios: rinden " + Math.round((antes - 0.02) * 100) + "% más."); Sonido.efecto("exitoCorto"); mostrarDato("polvo"); break; }
      case "alternarOxigeno": s.oxigenoOn = !s.oxigenoOn; registrar("burbuja", "Generador de oxígeno " + (s.oxigenoOn ? "ENCENDIDO." : "APAGADO: ahorras energía, pero no se produce oxígeno."), s.oxigenoOn ? "" : "mal"); mostrarDato("moxie"); break;
      case "alternarInvernadero": s.invernaderoOn = !s.invernaderoOn; registrar("hoja", "Invernadero " + (s.invernaderoOn ? "encendido." : "apagado: las plantas no crecen.")); break;
      case "sembrar": s.cultivo = { sembrado: true, progreso: 0 }; registrar("hoja", "Sembraste papas. Estarán listas en unos " + D.invernadero.solesCosecha + " soles si tienen luz, calor y agua."); Sonido.efecto("exitoCorto"); break;
      case "cosechar": r.comida = Math.min(D.maximos.comida, r.comida + D.invernadero.raciones); s.cultivo = { sembrado: false, progreso: 0 }; s.cosechas++; registrar("hoja", "¡Cosecha! +" + D.invernadero.raciones + " raciones de comida."); Sonido.efecto("exito"); break;
      case "contactar": {
        s.contactos++;
        const faltan = s.rescate - s.sol;
        registrar("antena", "Mensaje de la Tierra (llegó " + (4 + Math.floor(Math.random() * 18)) + " minutos después): «Te escuchamos. La nave de rescate llegará en " + Math.max(0, faltan) + " soles. ¡Resiste!»");
        Sonido.efecto("pitido"); break;
      }
      case "excavar": { const k = Math.min(D.hieloPorViaje, D.maximos.hielo - r.hielo); r.hielo += k; s.viajesHielo++; registrar("gota", "Llenaste la mochila: " + fmt(r.hielo) + " kg de hielo. Llévalo al hábitat para derretirlo."); Sonido.efecto("exitoCorto"); break; }
      case "esperarRescate": {
        if (s.hora < D.naveLlega) { avanzar(D.naveLlega - s.hora); if (s.terminado || s.interrumpido) break; }
        if (s.hora > D.naveEspera) { registrar("alerta", s.sol === s.rescate ? "La nave ya despegó por hoy. Mañana vuelve: ¡es la última oportunidad!" : "La nave ya se fue.", "mal"); break; }
        subirANave(); return;
      }
    }
    dibujarPanel();
    dibujarHud();
  }
  function fmt(n) { return Motor.fmt(n, 1); }

  /* ---------- Fin de la partida ---------- */
  function subirANave() {
    s.panel = null; dibujarPanel();
    registrar("cohete", "¡Subiste a la nave de rescate! Despegue en 3, 2, 1…");
    Sonido.efecto("despegue");
    terminar(true, "¡La nave de rescate te llevó de vuelta a casa! Sobreviviste " + s.sol + " soles en Marte.", true);
  }
  function terminar(ganaste, causa, conDespegue) {
    if (s.terminado) return;
    s.terminado = true; s.ganaste = ganaste; s.causa = causa; s.panel = null; s.despegue = performance.now();
    if (!conDespegue) Sonido.efecto(ganaste ? "exito" : "falla");
    const avisar = function () { if (conDespegue) Sonido.efecto("exito"); if (opciones && opciones.alTerminar) opciones.alTerminar(resultado()); };
    // Si hay 3D, se ve despegar la nave antes del resumen
    if (conDespegue && Vista3D.disponible()) setTimeout(avisar, 3800); else avisar();
  }
  function resultado() {
    const r = s.rec;
    const promDesafios = s.desafios.length ? s.desafios.reduce(function (a, b) { return a + b; }, 0) / s.desafios.length : 0;
    const mult = (DATOS.dificultades.find(function (d) { return d.id === s.dificultad; }) || { multPuntaje: 1 }).multPuntaje;
    const base = (s.ganaste ? 1000 : 0) + (s.sol - 1) * 40 + r.salud * 3 + Object.keys(s.datosVistos).length * 15 + s.cosechas * 60 + promDesafios * 3 - Math.max(0, r.radiacion - 20) * 5;
    const puntos = Math.round(Math.max(0, base) * mult);
    // Estrellas: 3 = rescatado con buena salud · 2 = rescatado · 1 = sobreviviste más de la mitad · 0 = no
    const estrellas = s.ganaste ? (r.salud >= 70 ? 3 : 2) : (s.sol >= s.rescate / 2 ? 1 : 0);
    return { ganaste: s.ganaste, causa: s.causa, sol: s.sol, rescate: s.rescate, salud: Math.round(r.salud), radiacion: r.radiacion,
      cosechas: s.cosechas, viajesHielo: s.viajesHielo, limpiezas: s.limpiezas, datos: Object.keys(s.datosVistos).length,
      horasAfuera: s.tiempoAfuera, puntos: puntos, estrellas: estrellas, dificultad: s.dificultad,
      desafios: Math.round(promDesafios), aprendido: D.datosMarte.filter(function (d) { return s.datosVistos[d.id]; }) };
  }

  /* =================================================================
     INTERFAZ DENTRO DEL JUEGO: panel de supervivencia, avisos y bitácora
     ================================================================= */
  const BARRAS = [
    { id: "oxigeno", nombre: "Oxígeno", icono: "burbuja", unidad: "kg", max: "oxigeno", pq: "svOxigeno" },
    { id: "agua", nombre: "Agua", icono: "gota", unidad: "L", max: "agua", pq: "svAgua" },
    { id: "comida", nombre: "Comida", icono: "hoja", unidad: "raciones", max: "comida", pq: "svComida" },
    { id: "energia", nombre: "Energía", icono: "rayo", unidad: "kWh", max: "energia", pq: "svEnergia" },
    { id: "traje", nombre: "Traje", icono: "casco", unidad: "%", max: "traje", pq: "svTraje" },
    { id: "salud", nombre: "Salud", icono: "corazon", unidad: "%", max: "salud", pq: "svSalud" }
  ];
  // Soles que alcanza un recurso con el gasto actual (para que se entienda el número)
  function duracion(id) {
    const r = s.rec, c = D.consumoPorSol;
    if (id === "oxigeno") { const neto = c.oxigeno - (s.oxigenoOn && r.energia > 0 ? D.oxigenoPorSol : 0); return neto > 0 ? r.oxigeno / neto : Infinity; }
    if (id === "agua") { const neto = c.agua * (1 - (r.energia > 0 ? D.reciclajeAgua : 0)) + (s.cultivo.sembrado && s.invernaderoOn ? D.invernadero.aguaPorSol : 0); return r.agua / neto; }
    if (id === "comida") return r.comida / c.comida;
    return null;
  }

  function dibujarHud() {
    const hud = document.getElementById("sv-hud");
    if (!hud || !s) return;
    const r = s.rec, noche = esNoche();
    let html = '<div class="sv-reloj"><b>Sol ' + s.sol + '</b><span>' + ic(noche ? "luna" : "sol") + ' ' + textoHora(s.hora) + '</span>' +
      '<small>Rescate: sol ' + s.rescate + ' (' + (s.rescate - s.sol > 0 ? "faltan " + (s.rescate - s.sol) : "¡hoy!") + ')</small></div><div class="sv-barras">';
    BARRAS.forEach(function (b) {
      const v = r[b.id], max = D.maximos[b.max], fr = v / max;
      const nivel = fr < 0.15 ? "rojo" : (fr < 0.35 ? "amarillo" : "verde");
      const dur = duracion(b.id);
      const extra = dur === null ? "" : (dur === Infinity ? " · sube" : " · " + (dur < 1 ? "<1" : Math.floor(dur)) + " soles");
      html += '<div class="sv-barra nivel-' + nivel + (b.id === "traje" && !s.fuera ? " tenue" : "") + '"><span>' + ic(b.icono) + ' ' + b.nombre +
        ' <button class="porque" data-accion="porque" data-clave="' + b.pq + '" aria-label="¿Por qué?">?</button></span>' +
        '<div class="barra"><div class="barra-relleno relleno-' + nivel + '" style="width:' + Math.max(2, fr * 100) + '%"></div></div>' +
        '<small>' + (b.unidad === "%" ? Math.round(v) + "%" : fmt(v) + " " + b.unidad) + extra + '</small></div>';
    });
    html += '</div><div class="sv-extra">' +
      '<span title="Polvo sobre los paneles">' + ic("sol") + ' Paneles al ' + Math.round((1 - r.polvo) * 100) + '%</span>' +
      '<span class="' + (s.roto.oxigeno ? "sv-fuera" : "") + '">' + ic("burbuja") + ' Generador ' + (s.roto.oxigeno ? "¡ROTO!" : (s.oxigenoOn ? "ON" : "OFF")) + '</span>' +
      (s.roto.antena ? '<span class="sv-fuera">' + ic("antena") + ' Antena sin señal</span>' : '') +
      (s.tormenta ? '<span class="sv-fuera">' + ic("sol") + ' Tormenta de polvo: paneles al 20%</span>' : '') +
      (s.solar ? '<span class="sv-fuera">' + ic("alerta") + (horaAbs() < s.solar.desde ? ' Tormenta solar en ' + fmt(s.solar.desde - horaAbs()) + ' h: ¡ve a la base!' : ' ¡TORMENTA SOLAR! Quédate en la base') + '</span>' : '') +
      (estadoNave().fase === "en tierra" ? '<span class="sv-dentro">' + ic("cohete") + ' ¡La nave te espera hasta las 18:00!</span>' : '') +
      '<span>' + ic("hoja") + ' Cultivo ' + (s.cultivo.sembrado ? Math.round(s.cultivo.progreso * 100) + "%" : "vacío") + '</span>' +
      (r.hielo > 0 ? '<span>' + ic("gota") + ' Llevas ' + fmt(r.hielo) + ' kg de hielo</span>' : '') +
      '<span title="Radiación acumulada">' + ic("alerta") + ' ' + fmt(r.radiacion) + ' mSv <button class="porque" data-accion="porque" data-clave="svRadiacion" aria-label="¿Por qué?">?</button></span>' +
      '<span class="' + (s.fuera ? "sv-fuera" : "sv-dentro") + '">' + (s.fuera ? "Afuera" : "En la base") + '</span></div>';
    hud.innerHTML = html;
  }

  function dibujarBitacora() {
    const b = document.getElementById("sv-bitacora");
    if (!b || !s) return;
    b.innerHTML = s.bitacora.slice(0, 5).map(function (m) {
      return '<li class="' + m.tipo + '">' + ic(m.icono) + ' <span><small>Sol ' + m.sol + ' · ' + textoHora(m.hora) + '</small> ' + m.texto + '</span></li>';
    }).join("");
  }

  function avisoCercania() {
    const a = document.getElementById("sv-aviso");
    if (!a) return;
    const l = mundo.cerca;
    if (!l) { a.className = "hangar-aviso"; a.innerHTML = '<span>Camina con las flechas, WASD o el control. Acércate a un lugar y pulsa E.</span>'; return; }
    a.className = "hangar-aviso cerca";
    a.innerHTML = ic(l.icono) + ' <b>' + l.nombre + '</b> · ' + l.texto + '<button class="btn btn-principal btn-mini" data-sv="abrir">Trabajar aquí (E)</button>';
    Sonido.efecto("pitido");
  }

  /* ---------- Panel de un lugar (pausa el tiempo mientras está abierto) ---------- */
  function abrirPanel(id) {
    if (!s || s.terminado) return;
    s.panel = id || (mundo.cerca && mundo.cerca.id);
    if (!s.panel) return;
    dibujarPanel();
  }
  function cerrarPanel() { if (!s) return; s.panel = null; const p = document.getElementById("sv-panel"); if (p) p.classList.add("oculto"); }

  function dibujarPanel() {
    const p = document.getElementById("sv-panel");
    if (!p) return;
    if (!s.panel) { p.classList.add("oculto"); return; }
    const l = D.lugares.find(function (x) { return x.id === s.panel; });
    const acciones = accionesDe(s.panel);
    let estadoLugar = "";
    if (s.panel === "paneles") estadoLugar = "Rinden al " + Math.round((1 - s.rec.polvo) * 100) + "% por el polvo. Producen ahora " + fmt(D.energia.panelesKW * (1 - s.rec.polvo) * luzSolar(s.hora)) + " kW.";
    if (s.panel === "oxigeno") estadoLugar = (s.oxigenoOn ? "ENCENDIDO: produce " : "APAGADO: podría producir ") + fmt(D.oxigenoPorSol) + " kg de oxígeno por sol. Tú respiras " + D.consumoPorSol.oxigeno + " kg por sol.";
    if (s.panel === "invernadero") estadoLugar = s.cultivo.sembrado ? "Papas creciendo: " + Math.round(s.cultivo.progreso * 100) + "%. Luces " + (s.invernaderoOn ? "encendidas." : "APAGADAS.") : "No hay nada sembrado.";
    if (s.panel === "base") estadoLugar = "Energía: " + fmt(s.rec.energia) + " de " + D.maximos.energia + " kWh. Hielo en la mochila: " + fmt(s.rec.hielo) + " kg.";
    if (s.panel === "rescate") estadoLugar = "La nave aterriza el sol " + s.rescate + " a las " + D.naveLlega + ":00 y espera hasta las " + D.naveEspera + ":00. Si no llegas, vuelve una sola vez al sol siguiente.";
    if (s.panel === "oxigeno" && s.roto.oxigeno) estadoLugar = "¡ROTO! No produce oxígeno. Repáralo cuanto antes.";
    if (s.panel === "antena") estadoLugar = s.roto.antena ? "No apunta a la Tierra: alinéala." : "Apunta a la Tierra. Hablaste " + s.contactos + " vez/veces con la Tierra.";
    p.classList.remove("oculto");
    p.innerHTML = '<div class="sv-panel-caja"><h3>' + ic(l.icono) + ' ' + l.nombre + '</h3><p>' + l.texto + '</p>' + (estadoLugar ? '<p class="nota">' + estadoLugar + '</p>' : '') +
      '<div class="sv-acciones">' + acciones.map(function (a, k) {
        const ok = puede(a.id);
        return '<button class="opcion-evento' + (ok.ok ? "" : " deshabilitada") + '" data-sv="accion" data-id="' + a.id + '"><strong>' + (k + 1) + '. ' + ic(a.icono) + ' ' + a.nombre + '</strong><small>' + (ok.ok ? a.texto : ok.motivo) + '</small></button>';
      }).join("") + '</div><div class="centro"><button class="btn btn-secundario" data-sv="cerrar">Volver a caminar (Esc)</button></div></div>';
  }

  function abrirResumen() {
    const r = s.rec, c = D.consumoPorSol;
    const filas = [
      ["Oxígeno", fmt(r.oxigeno) + " kg", "Respiras " + c.oxigeno + " kg/sol · el generador da " + (s.oxigenoOn ? D.oxigenoPorSol : 0) + " kg/sol"],
      ["Agua", fmt(r.agua) + " L", "Usas " + c.agua + " L/sol · se recicla el " + Math.round(D.reciclajeAgua * 100) + "%"],
      ["Comida", fmt(r.comida) + " raciones", "1 ración por sol · el invernadero da " + D.invernadero.raciones + " por cosecha"],
      ["Energía", fmt(r.energia) + " kWh", "La base gasta " + fmt(D.energia.baseKW + D.energia.recicladorKW + (s.oxigenoOn ? D.energia.oxigenoKW : 0) + (s.invernaderoOn ? D.energia.invernaderoKW : 0)) + " kW · los paneles dan hasta " + fmt(D.energia.panelesKW * (1 - r.polvo)) + " kW de día"],
      ["Radiación", fmt(r.radiacion) + " mSv", "Afuera " + D.radiacion.superficiePorSol + " mSv/sol · en la base " + D.radiacion.basePorSol]
    ];
    const p = document.getElementById("sv-panel");
    p.classList.remove("oculto");
    p.innerHTML = '<div class="sv-panel-caja"><h3>' + ic("lista") + ' Provisiones de la base</h3><table class="sv-tabla">' +
      filas.map(function (f) { return '<tr><th>' + f[0] + '</th><td><b>' + f[1] + '</b></td><td><small>' + f[2] + '</small></td></tr>'; }).join("") +
      '</table><div class="centro"><button class="btn btn-secundario" data-sv="volverBase">Volver</button></div></div>';
  }

  /* ---------- Teclado y control táctil ---------- */
  const MAPA = { ArrowUp: "arriba", w: "arriba", W: "arriba", ArrowDown: "abajo", s: "abajo", S: "abajo",
    ArrowLeft: "izquierda", a: "izquierda", A: "izquierda", ArrowRight: "derecha", d: "derecha", D: "derecha" };
  window.addEventListener("keydown", function (e) {
    if (!activo || !s || s.terminado) return;
    if (!document.getElementById("modal").classList.contains("oculto")) return;
    const t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
    if (s.panel) {
      if (e.key === "Escape") { cerrarPanel(); e.preventDefault(); }
      const n = Number(e.key);
      if (n >= 1 && n <= 9) { const a = accionesDe(s.panel)[n - 1]; if (a) { ejecutar(a.id); e.preventDefault(); } }
      return;
    }
    if (MAPA[e.key]) { teclas[MAPA[e.key]] = true; e.preventDefault(); e.stopPropagation(); }
    else if ((e.key === "e" || e.key === "E" || e.key === "Enter" || e.key === " ") && mundo.cerca) { e.preventDefault(); e.stopPropagation(); abrirPanel(); }
  }, true);
  window.addEventListener("keyup", function (e) { if (MAPA[e.key]) teclas[MAPA[e.key]] = false; });
  window.addEventListener("blur", function () { Object.keys(teclas).forEach(function (k) { teclas[k] = false; }); });

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
    base.addEventListener("pointerdown", function (e) { id = e.pointerId; const b = base.getBoundingClientRect(); cx = b.left + b.width / 2; cy = b.top + b.height / 2; base.setPointerCapture(id); mover(e); e.preventDefault(); });
    base.addEventListener("pointermove", function (e) { if (e.pointerId === id) mover(e); });
    const soltar = function (e) { if (e.pointerId !== id) return; id = null; palanca.x = 0; palanca.z = 0; perilla.style.transform = ""; };
    base.addEventListener("pointerup", soltar); base.addEventListener("pointercancel", soltar);
  }

  /* =================================================================
     DIBUJO 2D DE RESPALDO: el cráter visto desde arriba
     ================================================================= */
  function iniciar2D(area) {
    const c = document.createElement("canvas");
    c.className = "hangar-2d";
    area.appendChild(c);
    const g = c.getContext("2d");
    let ultimo = performance.now();
    function paso(t) {
      if (!activo || !document.body.contains(c)) { raf2D = null; return; }
      const dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t;
      actualizarMovimiento(dt);
      dibujar2D(c, g);
      raf2D = requestAnimationFrame(paso);
    }
    raf2D = requestAnimationFrame(paso);
  }

  function dibujar2D(c, g) {
    const caja = c.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    if (c.width !== Math.round(caja.width * ratio)) { c.width = caja.width * ratio; c.height = caja.height * ratio; }
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    const W = caja.width, H = caja.height, j = mundo.jugador;
    const esc = Math.min(W, H) / 46;                                // unos 46 m visibles
    const px = function (x) { return W / 2 + (x - j.x) * esc; }, pz = function (z) { return H / 2 + (z - j.z) * esc; };
    const luz = luzSolar(s.hora);
    g.fillStyle = "rgb(" + Math.round(70 + 110 * luz) + "," + Math.round(30 + 50 * luz) + "," + Math.round(25 + 25 * luz) + ")"; g.fillRect(0, 0, W, H);
    // Borde del mapa
    g.strokeStyle = "rgba(0,0,0,0.4)"; g.lineWidth = 4; g.strokeRect(px(-D.limite), pz(-D.limite), D.limite * 2 * esc, D.limite * 2 * esc);
    mundo.rocas.forEach(function (r) { g.fillStyle = "rgba(60,25,15,0.7)"; g.beginPath(); g.arc(px(r.x), pz(r.z), r.t * esc * 0.7, 0, Math.PI * 2); g.fill(); });
    D.lugares.forEach(function (l) {
      g.fillStyle = l.color; g.globalAlpha = mundo.cerca === l ? 1 : 0.8;
      g.beginPath(); g.arc(px(l.x), pz(l.z), l.radio * esc, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      g.fillStyle = "#fff"; g.font = "bold 13px sans-serif"; g.textAlign = "center"; g.fillText(l.nombre, px(l.x), pz(l.z) - l.radio * esc - 6);
    });
    // Astronauta
    g.save(); g.translate(px(j.x), pz(j.z)); g.rotate(-j.ang);
    g.fillStyle = "#c9ccd3"; g.fillRect(-0.32 * esc, -0.42 * esc, 0.64 * esc, 0.3 * esc);
    g.fillStyle = "#f2f2f2"; g.beginPath(); g.arc(0, 0, 0.4 * esc, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#d4a017"; g.beginPath(); g.arc(0, 0.12 * esc, 0.27 * esc, 0.15 * Math.PI, 0.85 * Math.PI); g.fill();
    g.restore();
    // Nave de rescate en tierra (un triángulo blanco con llama) y tormenta de polvo (neblina café)
    const n = estadoNave();
    if (n.fase !== "ausente") {
      const l = D.lugares.find(function (x) { return x.id === "rescate"; }), sube = n.fase === "despegando" ? n.t * 30 : (n.fase === "bajando" ? (1 - n.progreso) * 40 : 0);
      g.fillStyle = "#f2f2f2"; g.beginPath(); g.moveTo(px(l.x), pz(l.z) - 22 - sube); g.lineTo(px(l.x) - 9, pz(l.z) + 6 - sube); g.lineTo(px(l.x) + 9, pz(l.z) + 6 - sube); g.closePath(); g.fill();
      if (n.fase !== "en tierra") { g.fillStyle = "#ffb347"; g.beginPath(); g.moveTo(px(l.x) - 5, pz(l.z) + 6 - sube); g.lineTo(px(l.x) + 5, pz(l.z) + 6 - sube); g.lineTo(px(l.x), pz(l.z) + 22 - sube); g.closePath(); g.fill(); }
    }
    if (s.tormenta) { g.fillStyle = "rgba(120,70,40,0.45)"; g.fillRect(0, 0, W, H); }
    // Flecha hacia la zona de rescate el día del rescate
    if (s.sol >= s.rescate) {
      const l = D.lugares.find(function (x) { return x.id === "rescate"; }), a = Math.atan2(l.z - j.z, l.x - j.x);
      g.fillStyle = "#ffb703"; g.save(); g.translate(W / 2 + Math.cos(a) * 60, H / 2 + Math.sin(a) * 60); g.rotate(a);
      g.beginPath(); g.moveTo(14, 0); g.lineTo(-8, -8); g.lineTo(-8, 8); g.closePath(); g.fill(); g.restore();
    }
    g.textAlign = "left";
  }

  /* =================================================================
     INICIAR / DETENER
     op: { dificultad, decirPaz(t, x), alTerminar(resultado) }
     ================================================================= */
  function iniciar(cont, op) {
    opciones = op; activo = true; contenedor = cont;
    Object.keys(teclas).forEach(function (k) { teclas[k] = false; });
    if (!s || s.terminado || op.nueva) nuevaPartida(op.dificultad);
    mundo.cerca = null;
    cont.innerHTML =
      '<div class="sv-juego">' +
        '<div class="hangar-area sv-area" id="sv-area"></div>' +
        '<div class="sv-hud" id="sv-hud"></div>' +
        '<ul class="sv-bitacora" id="sv-bitacora"></ul>' +
        '<div class="sv-panel oculto" id="sv-panel"></div>' +
      '</div>' +
      '<div class="hangar-aviso" id="sv-aviso"></div>' +
      '<div class="hangar-tactil">' +
        '<div class="palanca" aria-label="Control para caminar"><div class="palanca-perilla"></div></div>' +
        '<button class="mj-boton mj-accion hangar-entrar" data-sv="abrir">' + ic("play") + ' TRABAJAR</button>' +
      '</div>';
    instalarPalanca(cont.querySelector(".palanca"));
    cont.addEventListener("click", function (e) {
      const b = e.target.closest("[data-sv]");
      if (!b) return;
      const t = b.dataset.sv;
      if (t === "abrir") abrirPanel();
      else if (t === "cerrar") cerrarPanel();
      else if (t === "accion") ejecutar(b.dataset.id);
      else if (t === "volverBase") { s.panel = "base"; dibujarPanel(); }
    });
    avisoCercania(); dibujarHud(); dibujarBitacora();
    const area = cont.querySelector("#sv-area");
    if (!(Vista3D.disponible() && Vista3D.mostrarMarte && Vista3D.mostrarMarte(area, mundo))) iniciar2D(area);
  }

  function detener() { activo = false; palanca.x = 0; palanca.z = 0; }

  return { iniciar: iniciar, detener: detener, mundo: mundo, estado: function () { return s; }, nuevaPartida: nuevaPartida,
    avanzar: function (h) { if (s) avanzar(h); }, resultado: function () { return s ? resultado() : null; }, textoHora: textoHora,
    // Para el ambiente de prueba y las partidas simuladas: hacer una acción en un lugar
    accion: function (lugar, id) { if (!s || s.terminado) return; s.panel = lugar; ejecutar(id); if (s) s.panel = null; dibujarPanel(); } };
})();
