/* =====================================================================
   prueba.js — Panel del AMBIENTE DE PRUEBA (solo se carga en prueba.html)
   ---------------------------------------------------------------------
   Atajos para probar el juego sin jugarlo completo:
     - Armar una misión lista (escenario, nave, órbita, fecha y cohete) y
       saltar a cualquier fase.
     - Jugar cualquier minijuego.
     - Saltar videos, responder imprevistos solo y acelerar la simulación.
     - Manejar la flota de etapas recuperadas y lo guardado en el navegador.
     - Ver en vivo los números del motor (masa, capacidad, costo, viaje...).
   Usa window.PruebaJuego, que interfaz.js crea solo si MODO_PRUEBA = true.
   ===================================================================== */

(function () {
  const J = window.PruebaJuego;
  if (!J) return;
  const E = J.estado;
  const ic = Iconos.svg;
  const fmt = Motor.fmt;
  const auto = { videos: true, imprevistos: false };

  /* ---------- Armar una misión lista para lanzar ---------- */
  function armar(cfg) {
    const esc = DATOS.escenarios.find(function (x) { return x.id === cfg.escenario; });
    Modos.detenerReloj();
    E.modoJuego = cfg.modo; E.modo = "individual"; E.contrato = null; E.lanzamiento = null;
    E.dificultad = cfg.dificultad; E.escenario = esc.id; E.resultado = null; E.vistaInicio = "menu";
    // Piezas: básicas o avanzadas. El motor: el que pida la órbita recomendada
    const orb = esc.orbitas.find(function (o) { return o.id === esc.orbitaRecomendada; }) || esc.orbitas[0];
    DATOS.componentes.forEach(function (c) {
      if (c.id === "propulsion") {
        const necesita = orb.deltaVLlegada > 0 || esc.propulsionObligatoria;
        E.componentes[c.id] = cfg.nave === "electrica" ? "avanzada" : (necesita ? "basica" : "ninguna");
      } else E.componentes[c.id] = cfg.nave === "basica" ? "basica" : "avanzada";
    });
    E.instrumentos = esc.instrumentosRecomendados.slice();
    E.orbita = orb.id;
    // Fecha de lanzamiento: la mejor del planificador (si la misión lo usa)
    E.trayectoria = null;
    if (Trayectorias.config(esc.id)) {
      E.trayectoria = { tipo: "directa", mes: null };
      if (Trayectorias.usaFecha(esc.id)) E.trayectoria.mes = Trayectorias.mejorMes(esc.id, "directa", esc);
    }
    // Cohete: el más barato que sirva (o el elegido)
    if (cfg.cohete === "auto") {
      if (!E.coheteDiseno) E.coheteDiseno = Cohetes.disenoPorDefecto();
      let mejor = null;
      DATOS.cohetes.map(function (c) { return c.id; }).concat(["propio"]).forEach(function (id) {
        E.cohete = id;
        const r = J.recursos();
        const sirve = r.capacidadCohete > 0 && r.masa <= r.capacidadCohete;
        if (sirve && (!mejor || r.costoCohete < mejor.costo)) mejor = { id: id, costo: r.costoCohete };
      });
      E.cohete = mejor ? mejor.id : "falconheavy";
    } else {
      E.cohete = cfg.cohete;
      if (cfg.cohete === "propio" && !E.coheteDiseno) E.coheteDiseno = Cohetes.disenoPorDefecto();
    }
    E.faseMax = 5;
    J.cambioDiseno();
  }

  function leerCfg() {
    return { escenario: val("pr-escenario"), dificultad: val("pr-dificultad"), modo: val("pr-modo"), nave: val("pr-nave"), cohete: val("pr-cohete") };
  }
  function val(id) { return document.getElementById(id).value; }

  /* ---------- El panel ---------- */
  function opcionesSelect(lista) { return lista.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join(""); }

  function construir() {
    const boton = document.createElement("button");
    boton.className = "pr-boton"; boton.id = "pr-boton"; boton.innerHTML = ic("llave") + " Pruebas";
    boton.title = "Abrir el panel de pruebas";
    document.body.appendChild(boton);

    const p = document.createElement("aside");
    p.className = "pr-panel"; p.id = "pr-panel";
    p.innerHTML =
      '<div class="pr-cabeza"><b>' + ic("llave") + ' Ambiente de prueba</b><button class="pr-cerrar" id="pr-cerrar" aria-label="Cerrar">×</button></div>' +
      '<p class="pr-nota">Atajos para probar. Lo que guardes aquí (récords, flota) queda en este navegador, igual que en el juego.</p>' +

      '<details open><summary>1. Armar una misión lista</summary>' +
        fila("Misión", '<select id="pr-escenario">' + opcionesSelect(DATOS.escenarios.map(function (e) { return [e.id, e.nombre]; })) + '</select>') +
        fila("Dificultad", '<select id="pr-dificultad">' + opcionesSelect(DATOS.dificultades.map(function (d) { return [d.id, d.nombre]; })) + '</select>') +
        fila("Modo", '<select id="pr-modo">' + opcionesSelect([["libre", "Modo libre (sin límite)"], ["completa", "Misión completa"]]) + '</select>') +
        fila("Nave", '<select id="pr-nave">' + opcionesSelect([["avanzada", "Piezas avanzadas"], ["basica", "Piezas básicas"], ["electrica", "Avanzada con motor eléctrico"]]) + '</select>') +
        fila("Cohete", '<select id="pr-cohete">' + opcionesSelect([["auto", "El más barato que sirva"]].concat(DATOS.cohetes.map(function (c) { return [c.id, c.nombre]; })).concat([["propio", "Mi cohete (por etapas)"]])) + '</select>') +
        '<p>Armar e ir a la fase:</p><div class="pr-botones">' + [1, 2, 3, 4, 5].map(function (n) { return '<button data-pr="fase" data-n="' + n + '">' + n + '</button>'; }).join("") +
        '<button data-pr="lanzar" class="pr-fuerte">' + ic("cohete") + ' Armar y lanzar</button></div>' +
      '</details>' +

      '<details><summary>2. Minijuegos</summary><div class="pr-botones">' +
        Minijuegos.tipos().map(function (t) { const i = Minijuegos.info(t); return '<button data-pr="minijuego" data-t="' + t + '">' + ic(i.icono) + ' ' + i.nombre + '</button>'; }).join("") +
      '</div></details>' +

      '<details open><summary>3. Simulación</summary>' +
        '<label class="pr-check"><input type="checkbox" id="pr-videos" checked> Saltar videos automáticamente</label>' +
        '<label class="pr-check"><input type="checkbox" id="pr-auto"> Resolver imprevistos solo (piloto automático)</label>' +
        '<div class="pr-botones"><button data-pr="vel" data-v="16">Velocidad ×16</button><button data-pr="vel" data-v="64">Velocidad ×64</button></div>' +
      '</details>' +

      '<details><summary>4. Planificador del viaje</summary>' +
        fila("Mes", '<select id="pr-mes"><option value="">(sin fecha)</option>' + opcionesSelect(Trayectorias.meses("marte").map(function (m) { return [m, Trayectorias.textoMes(m)]; })) + '</select>') +
        fila("Tipo", '<select id="pr-tipo">' + opcionesSelect(Object.keys(DATOS.tiposViaje).map(function (k) { return [k, DATOS.tiposViaje[k].nombre]; })) + '</select>') +
        '<div class="pr-botones"><button data-pr="viaje">Aplicar a la misión actual</button></div>' +
        '<p class="pr-nota">Solo sirve en Marte, Apofis (fecha y tipo) y la Luna (tipo).</p>' +
      '</details>' +

      '<details><summary>5. Cohetes y flota</summary>' +
        '<div class="pr-botones"><button data-pr="recuperada">+1 etapa recuperada (diseño actual)</button><button data-pr="vaciarFlota">Vaciar flota</button></div>' +
        '<p class="pr-nota" id="pr-flota"></p>' +
      '</details>' +

      '<details><summary>6. Varado en Marte</summary>' +
        '<div class="pr-botones"><button data-pr="marte" class="pr-fuerte">' + ic("casco") + ' Empezar en Marte</button>' +
        '<button data-pr="mHoras" data-h="6">+6 horas</button><button data-pr="mHoras" data-h="24.66">+1 sol</button>' +
        '<button data-pr="mRescate">Ir al día del rescate</button><button data-pr="mLlenar">Llenar recursos</button><button data-pr="mReparar">Reparar todo</button></div>' +
        fila("Imprevisto", '<select id="pr-imprevisto">' + opcionesSelect(DATOS.supervivencia.eventos.map(function (ev) { return [ev.id, ev.titulo]; })) + '</select>') +
        '<div class="pr-botones"><button data-pr="mEvento">Provocar ahora</button></div>' +
        '<p class="pr-nota">La dificultad es la de la sección 1. Estos atajos solo funcionan con una partida de Marte abierta.</p>' +
      '</details>' +

      '<details><summary>7. Modo historia</summary><div class="pr-botones">' +
        [1, 2, 3, 4, 5].map(function (n) { return '<button data-pr="capitulo" data-n="' + n + '">Cap. ' + n + '</button>'; }).join("") +
        '<button data-pr="hDesbloquear">Desbloquear todos</button><button data-pr="hBorrar">Borrar progreso</button></div>' +
        '<p class="pr-nota">«Cap. N» abre la presentación del capítulo (aunque esté bloqueado).</p>' +
      '</details>' +

      '<details><summary>8. Datos guardados</summary><div class="pr-botones">' +
        '<button data-pr="borrar" data-k="spaceSimulator.records">Borrar récords</button>' +
        '<button data-pr="borrar" data-k="spaceSimulator.opciones">Borrar opciones</button>' +
        '<button data-pr="borrarTodo">Borrar todo</button></div>' +
      '</details>' +

      '<details open><summary>Estado en vivo</summary><div id="pr-estado" class="pr-estado"></div></details>';
    document.body.appendChild(p);

    boton.addEventListener("click", function () { p.classList.toggle("abierto"); });
    document.getElementById("pr-cerrar").addEventListener("click", function () { p.classList.remove("abierto"); });
    document.getElementById("pr-videos").addEventListener("change", function (e) { auto.videos = e.target.checked; });
    document.getElementById("pr-auto").addEventListener("change", function (e) { auto.imprevistos = e.target.checked; });
    p.addEventListener("click", accion);
  }
  function fila(etiqueta, control) { return '<label class="pr-fila"><span>' + etiqueta + '</span>' + control + '</label>'; }

  function accion(e) {
    const b = e.target.closest("[data-pr]");
    if (!b) return;
    const tipo = b.dataset.pr;
    if (tipo === "fase") { armar(leerCfg()); J.irAFase(Number(b.dataset.n)); avisar("Misión armada. Fase " + b.dataset.n + "."); }
    else if (tipo === "lanzar") {
      armar(leerCfg());
      const r = J.recursos(), v = Motor.verificarLanzamiento(E, r);
      if (!v.ok) { J.irAFase(4); avisar("No se puede lanzar: " + v.problemas.join(" "), true); return; }
      J.irAFase(5); setTimeout(J.lanzar, 300); avisar("¡Lanzando!");
    }
    else if (tipo === "minijuego") { J.practicar(b.dataset.t); }
    else if (tipo === "vel") { Simulacion.cambiarVelocidad(Number(b.dataset.v)); avisar("Velocidad ×" + b.dataset.v + " (si la simulación está corriendo)."); }
    else if (tipo === "viaje") {
      if (!E.escenario || !Trayectorias.config(E.escenario)) { avisar("Primero arma una misión a Marte, Apofis o la Luna.", true); return; }
      E.trayectoria = { mes: val("pr-mes") || null, tipo: val("pr-tipo") };
      J.cambioDiseno(); avisar("Viaje aplicado.");
    }
    else if (tipo === "recuperada") { Cohetes.registrarRecuperacion(E.coheteDiseno || Cohetes.disenoPorDefecto()); J.redibujar(); avisar("Etapa agregada a la flota."); }
    else if (tipo === "vaciarFlota") { try { localStorage.removeItem("spaceSimulator.flota"); } catch (x) { /* nada */ } J.redibujar(); avisar("Flota vacía."); }
    else if (tipo === "borrar") { if (confirm("¿Borrar " + b.textContent.toLowerCase().replace("borrar ", "") + " de este navegador? No se puede deshacer.")) { try { localStorage.removeItem(b.dataset.k); } catch (x) { /* nada */ } avisar("Borrado."); } }
    else if (tipo === "marte") { E.dificultad = val("pr-dificultad"); E.historia = null; E.modoJuego = "marte"; J.irMarte(true); avisar("Partida nueva en Marte (" + E.dificultad + ")."); }
    else if (tipo.charAt(0) === "m" && tipo !== "minijuego") {
      const s = Supervivencia.estado();
      if (E.fase !== -2 || !s || s.terminado) { avisar("Primero empieza una partida en Marte.", true); return; }
      if (tipo === "mHoras") { Supervivencia.avanzar(Number(b.dataset.h)); avisar("Avanzó el reloj: sol " + s.sol + ", " + Supervivencia.textoHora(s.hora) + "."); }
      else if (tipo === "mRescate") { s.sol = s.rescate; s.hora = 8.5; s.eventos.forEach(function (it) { it.hecho = true; }); avisar("Sol " + s.rescate + ", 8:30. La nave baja a las 9:00 en la zona de aterrizaje."); }
      else if (tipo === "mLlenar") { const m = DATOS.supervivencia.maximos; ["oxigeno", "agua", "comida", "energia", "traje", "salud"].forEach(function (k) { s.rec[k] = m[k]; }); s.rec.polvo = 0; avisar("Recursos al máximo."); }
      else if (tipo === "mReparar") { s.roto.oxigeno = false; s.roto.antena = false; s.tormenta = null; s.solar = null; avisar("Todo reparado y sin tormentas."); }
      else if (tipo === "mEvento") {
        const it = s.eventos.find(function (x) { return x.ev.id === val("pr-imprevisto"); });
        if (it) { it.hecho = false; it.sol = s.sol; it.hora = 0; Supervivencia.avanzar(0.25); avisar("Imprevisto provocado."); }
        else { s.perdidoHecho = false; avisar("«Perderse de noche» ocurre solo: sal de noche a más de 14 m de la base (desde el sol 3).", true); }
      }
    }
    else if (tipo === "capitulo") { J.introCapitulo(Number(b.dataset.n)); }
    else if (tipo === "hDesbloquear") {
      let h = {}; try { h = JSON.parse(localStorage.getItem("spaceSimulator.historia")) || {}; } catch (x) { /* nada */ }
      h.estrellas = h.estrellas || {}; [1, 2, 3, 4].forEach(function (n) { h.estrellas[n] = Math.max(h.estrellas[n] || 0, 2); });
      try { localStorage.setItem("spaceSimulator.historia", JSON.stringify(h)); } catch (x) { /* nada */ }
      J.redibujar(); avisar("Capítulos 1 a 5 desbloqueados (los 4 primeros con 2 estrellas).");
    }
    else if (tipo === "hBorrar") { if (confirm("¿Borrar el progreso de la historia? No se puede deshacer.")) { try { localStorage.removeItem("spaceSimulator.historia"); } catch (x) { /* nada */ } J.redibujar(); avisar("Progreso de la historia borrado."); } }
    else if (tipo === "borrarTodo") {
      if (confirm("¿Borrar récords, flota, historia y opciones de SPACE SIMULATOR en este navegador? No se puede deshacer.")) {
        ["spaceSimulator.records", "spaceSimulator.flota", "spaceSimulator.opciones", "spaceSimulator.historia", "misionCondor.records"].forEach(function (k) { try { localStorage.removeItem(k); } catch (x) { /* nada */ } });
        avisar("Todo borrado. Recarga la página para empezar limpio.");
      }
    }
  }

  function avisar(texto, malo) {
    let a = document.getElementById("pr-aviso");
    if (!a) { a = document.createElement("div"); a.id = "pr-aviso"; document.getElementById("pr-panel").insertBefore(a, document.getElementById("pr-panel").children[2]); }
    a.className = "pr-aviso" + (malo ? " malo" : ""); a.textContent = texto;
  }

  /* ---------- Estado en vivo y ayudantes automáticos ---------- */
  function actualizarEstado() {
    const caja = document.getElementById("pr-estado");
    if (!caja) return;
    const flota = Cohetes.leerFlota();
    document.getElementById("pr-flota").textContent = "Flota: " + (Object.keys(flota).length ? Object.keys(flota).map(function (k) { return k + " × " + flota[k]; }).join(", ") : "vacía");
    // En Marte: los números de la supervivencia
    const sv = E.fase === -2 && Supervivencia.estado();
    if (sv) {
      const r2 = sv.rec, prox = sv.eventos.filter(function (x) { return !x.hecho; }).sort(function (a, b) { return a.sol - b.sol; })[0];
      const f2 = [["Marte", "sol " + sv.sol + " de " + sv.rescate + " · " + Supervivencia.textoHora(sv.hora) + (sv.fuera ? " · afuera" : " · en la base")],
        ["Recursos", "O2 " + fmt(r2.oxigeno, 1) + " · agua " + fmt(r2.agua, 1) + " · comida " + fmt(r2.comida, 1)],
        ["Energía", fmt(r2.energia, 1) + " kWh · paneles " + Math.round((1 - r2.polvo) * 100) + "%"],
        ["Traje/salud", Math.round(r2.traje) + "% · " + Math.round(r2.salud) + "% · " + fmt(r2.radiacion, 1) + " mSv"],
        ["Roto", (sv.roto.oxigeno ? "generador " : "") + (sv.roto.antena ? "antena" : "") || "nada"],
        ["Próximo", prox ? prox.ev.titulo + " (sol " + prox.sol + ")" : "sin imprevistos pendientes"],
        ["Nave", Supervivencia.mundo.nave().fase]];
      caja.innerHTML = f2.map(function (f) { return '<div><span>' + f[0] + '</span><b>' + f[1] + '</b></div>'; }).join("");
      return;
    }
    if (!E.escenario) { caja.innerHTML = "Fase " + E.fase + " · sin misión elegida."; return; }
    let r;
    try { r = J.recursos(); } catch (x) { caja.textContent = "Faltan piezas para calcular (" + x.message + ")."; return; }
    const v = Motor.verificarLanzamiento(E, r);
    const filas = [
      ["Fase", E.fase + " · modo " + E.modoJuego + " · " + E.dificultad],
      ["Misión", r.escenario.nombre],
      ["Órbita", r.orbita.nombre + (r.orbitaEstimada ? " (estimada)" : "")],
      ["Cohete", r.cohete ? r.cohete.nombre : "—"],
      ["Masa", fmt(r.masa, 0) + " kg (" + fmt(r.masaCombustible, 0) + " de combustible)"],
      ["Capacidad", r.capacidadCohete === null ? "—" : fmt(r.capacidadCohete, 0) + " kg"],
      ["Costo", fmt(r.costoTotal) + " / " + (r.presupuesto >= 999999 ? "sin límite" : fmt(r.presupuesto, 0)) + " M USD"],
      ["Energía", fmt(r.consumo, 0) + " W de " + fmt(r.genProm, 0) + " W"],
      ["Datos", fmt(r.gbDia, 2) + " GB/día · envía " + fmt(r.bajada, 2)],
      ["Vida", fmt(r.vidaAnios) + " de " + fmt(r.duracionAnios) + " años (" + r.causaVida + ")"],
      ["Viaje", r.diasViaje + " días" + (r.viaje && r.viaje.mes ? " · " + Trayectorias.textoMes(r.viaje.mes) + " → " + Trayectorias.textoMes(r.viaje.llegada) + " · extra " + fmt(r.viaje.extra, 2) + " km/s" : "")],
      ["Ciencia", fmt(r.cienciaBase, 0) + " de " + fmt(r.maxCienciaEscenario, 0)],
      ["¿Lanzar?", v.ok ? "Sí" : v.problemas.join(" ")]
    ];
    const s = Simulacion.estado && Simulacion.estado();
    if (E.fase === 5 && s) filas.push(["Simulación", "día " + s.dia + " de " + s.duracion + (s.enViaje ? " (viajando " + s.diaViaje + "/" + s.diasViaje + ")" : "") + " · ×" + (s.velocidad || 1)]);
    caja.innerHTML = filas.map(function (f) { return '<div><span>' + f[0] + '</span><b class="' + (f[0] === "¿Lanzar?" ? (v.ok ? "ok" : "no") : "") + '">' + f[1] + '</b></div>'; }).join("");
  }

  function ayudantes() {
    if (auto.videos) {
      const saltar = Array.prototype.find.call(document.querySelectorAll("button"), function (b) { return /Saltar/i.test(b.textContent) && b.offsetParent !== null; });
      if (saltar) saltar.click();
    }
    if (auto.imprevistos) {
      const m = document.querySelector("#modal:not(.oculto)");
      if (m) {
        const b = m.querySelector('[data-accion="pilotoAutomatico"]') || m.querySelector('[data-accion="decidir"]') ||
          m.querySelector('[data-accion="continuarMision"]') || m.querySelector('[data-accion="continuarDespegue"]');
        if (b) b.click();
      }
    }
  }

  construir();
  setInterval(actualizarEstado, 1000);
  setInterval(ayudantes, 400);
  actualizarEstado();
})();
