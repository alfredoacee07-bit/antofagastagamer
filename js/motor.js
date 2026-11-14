/* =====================================================================
   motor.js — Los CÁLCULOS del juego
   ---------------------------------------------------------------------
   Aquí no se dibuja nada: solo se hacen cuentas.
   Recibe las elecciones del jugador (el "estado") y responde:
     - cuánto pesa la nave (con combustible), cuánta energía usa, cuánto cuesta...
     - si el cohete puede llevarla
     - el puntaje final, el diagnóstico y las medallas de cada rol
   ===================================================================== */

const Motor = (function () {

  /* ---------- Pequeñas herramientas ---------- */
  function buscar(lista, id) {
    return (lista || []).find(function (x) { return x.id === id; }) || null;
  }
  function suma(lista, campo) {
    return lista.reduce(function (total, x) { return total + (x[campo] || 0); }, 0);
  }
  // Escribe un número a la chilena: 1.234,5
  function fmt(n, decimales) {
    if (!isFinite(n)) return "∞";
    return Number(n).toLocaleString("es-CL", { maximumFractionDigits: decimales === undefined ? 1 : decimales });
  }

  /* ---------- Leer las elecciones del jugador ---------- */
  function escenario(e) { return buscar(DATOS.escenarios, e.escenario) || DATOS.escenarios[0]; }
  function dificultad(e) { return buscar(DATOS.dificultades, e.dificultad) || DATOS.dificultades[1]; }
  function orbita(e) {
    const esc = escenario(e);
    return buscar(esc.orbitas, e.orbita) || buscar(esc.orbitas, esc.orbitaInicial);
  }
  // El cohete elegido: uno real de la lista, o el cohete propio armado por etapas (cohetes.js)
  function cohete(e) {
    if (e.cohete === "propio" && typeof Cohetes !== "undefined") return Cohetes.objeto(e.coheteDiseno || Cohetes.disenoPorDefecto());
    return buscar(DATOS.cohetes, e.cohete);
  }
  // Presupuesto según el modo: Modo libre = sin límite; Misión rápida = el del contrato
  const SIN_LIMITE = 999999;
  function presupuesto(e) {
    if (e.modoJuego === "libre") return SIN_LIMITE;
    const c = e.modoJuego === "rapida" && e.contrato && typeof Modos !== "undefined" ? Modos.contrato(e.contrato) : null;
    return Math.round((c ? c.presupuesto : escenario(e).presupuesto) * dificultad(e).multPresupuesto);
  }

  // Devuelve la opción elegida de una pieza, ajustada al escenario
  // (por ejemplo, en Marte los paneles son 2,5 veces más grandes)
  function opcionAjustada(comp, version, esc) {
    const op = comp.opciones[version];
    if (!op) return null;
    if (comp.id === "paneles" && esc.ajustePaneles) {
      const f = esc.ajustePaneles;
      return Object.assign({}, op, { masa: op.masa * f, costo: op.costo * f, generacion: op.generacion * f, ajustado: f });
    }
    return op;
  }

  // { estructura: {...}, paneles: {...}, ..., propulsion: {...} } (null si falta)
  function piezas(e) {
    const esc = escenario(e);
    const resultado = {};
    DATOS.componentes.forEach(function (c) {
      const v = e.componentes[c.id];
      resultado[c.id] = v ? opcionAjustada(c, v, esc) : null;
    });
    return resultado;
  }

  function instrumentos(e) {
    const esc = escenario(e);
    return e.instrumentos.map(function (id) { return buscar(esc.instrumentos, id); }).filter(Boolean);
  }

  /* ---------- Fórmulas de ingeniería (simplificadas) ---------- */

  // GB que la antena envía por día:
  // velocidad (Mbps) × debilitamiento por distancia × minutos de contacto × 60 s ÷ 8.000 (Mb GB)
  function bajadaGbDia(antena, orb) {
    if (!antena) return 0;
    return antena.velocidadMbps * orb.factorDistancia * orb.minutosContactoDia * 60 / 8000;
  }

  // Ecuación del cohete de Tsiolkovsky:
  // combustible = masaSeca × (e^(Δv / (Isp × g)) − 1)
  function combustible(masaSeca, deltaVkms, isp) {
    if (deltaVkms <= 0) return 0;
    if (!isp) return Infinity;
    return masaSeca * (Math.exp(deltaVkms * 1000 / (isp * DATOS.config.gravedad)) - 1);
  }

  // Ciencia máxima: puntos × utilidad en esa órbita × precisión de apuntado
  function cienciaBase(lista, orb, orientacion) {
    return lista.reduce(function (total, ins) {
      let pts = ins.ciencia * (orb.multCiencia[ins.id] !== undefined ? orb.multCiencia[ins.id] : 1);
      if (ins.necesitaPunteria) pts *= orientacion ? orientacion.precision : 0.5;
      return total + pts;
    }, 0);
  }

  // Precio del cohete (el viaje compartido cobra por kilo)
  function costoCohete(coh, masa) {
    if (!coh) return 0;
    if (coh.costoPorKg) return coh.costoBase + Math.max(0, masa - coh.kgIncluidos) * coh.costoPorKg;
    return coh.costo;
  }

  function nivel(uso, amarilloDesde) {
    if (uso > 1) return "rojo";
    if (uso >= amarilloDesde) return "amarillo";
    return "verde";
  }

  /* =================================================================
     calcularRecursos: el corazón del panel de recursos.
     Se llama CADA VEZ que el jugador cambia algo.
     ================================================================= */
  function calcularRecursos(e) {
    const esc = escenario(e);
    const dif = dificultad(e);
    const orb = orbita(e);
    const coh = cohete(e);
    const p = piezas(e);
    const ins = instrumentos(e);
    const listaPiezas = Object.values(p).filter(Boolean);
    const todo = listaPiezas.concat(ins);
    const cfg = DATOS.config;
    const pres = presupuesto(e);
    const duracionAnios = esc.duracionDias / 365;

    // --- Propulsión y combustible (ecuación del cohete) ---
    const motor = p.propulsion && p.propulsion.isp > 0 ? p.propulsion : null;
    const deltaV = (orb.deltaVLlegada + (motor ? orb.deltaVAnual * duracionAnios : 0)) * cfg.margenDeltaV;
    const masaSeca = suma(todo, "masa");
    const faltaMotor = orb.deltaVLlegada > 0 && !motor;
    const masaCombustible = faltaMotor ? 0 : combustible(masaSeca, deltaV, motor ? motor.isp : 0);
    const masa = masaSeca + masaCombustible;
    const capacidadCohete = coh ? coh.capacidad[orb.destinoCohete] : null;

    // --- Presupuesto ---
    const costoPiezas = suma(todo, "costo");
    const precioCohete = costoCohete(coh, masa);
    const costoTotal = esc.costoFijo + costoPiezas + precioCohete;

    // --- Energía (los paneles generan menos lejos del Sol) ---
    const consumoPlataforma = cfg.consumoBaseW + suma(listaPiezas, "energia");
    const consumoInstr = suma(ins, "energia");
    const consumo = consumoPlataforma + consumoInstr;
    const genMax = p.paneles ? p.paneles.generacion * esc.factorSolar : 0;
    const genProm = genMax * (1 - orb.eclipseFraccion);

    // --- Batería en la sombra ---
    const capBat = p.bateria ? p.bateria.capacidadWh : 0;
    const necesidadSombra = consumo * orb.eclipseHoras;
    const descarga = capBat > 0 ? necesidadSombra / capBat : 0;

    // --- Datos y comunicaciones ---
    const gbDia = suma(ins, "datos");
    const memoria = p.computador ? p.computador.memoriaGB : 0;
    const bajada = bajadaGbDia(p.antena, orb);

    // --- Viaje ---
    const diasViaje = esc.diasViaje + (p.propulsion && p.propulsion.isp > 1000 ? esc.diasViajeElectrico : 0);

    // --- Vida útil: manda lo que se gaste primero ---
    const limites = [];
    if (p.estructura) limites.push({ anios: p.estructura.vidaAnios, causa: "estructura" });
    // Límite seguro de descarga: en órbitas con pocos eclipses al año (geoestacionaria)
    // la batería tolera descargas más profundas porque hace muchos menos ciclos
    const limiteDescarga = orb.descargaSegura || cfg.descargaSegura;
    if (p.bateria) {
      const exigida = descarga > limiteDescarga;
      limites.push({ anios: p.bateria.vidaAnios * (exigida ? cfg.castigoDescarga : 1), causa: exigida ? "bateriaExigida" : "bateria" });
    }
    limites.push({ anios: motor ? orb.vidaConMotorAnios : orb.vidaOrbitaAnios, causa: "orbita" });
    if (faltaMotor) limites.push({ anios: 0, causa: "sinMotor" });
    limites.sort(function (a, b) { return a.anios - b.anios; });
    const vidaAnios = limites[0].anios;
    const causaVida = limites[0].causa;

    const ciencia = cienciaBase(ins, orb, p.orientacion);
    const maxCienciaEscenario = suma(esc.instrumentos, "ciencia");

    /* --- Las 6 barras del panel --- */
    const barras = {};
    if (coh) {
      const uso = capacidadCohete > 0 ? masa / capacidadCohete : Infinity;
      barras.masa = { fill: Math.min(uso, 1), nivel: nivel(uso, 0.75),
        texto: capacidadCohete > 0 ? fmt(masa, 0) + " / " + fmt(capacidadCohete, 0) + " kg" : fmt(masa, 0) + " kg · no llega" };
    } else {
      barras.masa = { fill: Math.min(masa / 500, 1), nivel: "neutro", texto: fmt(masa, 0) + " kg (falta cohete)" };
    }

    const usoPres = costoTotal / pres;
    barras.presupuesto = pres >= SIN_LIMITE
      ? { fill: 0.05, nivel: "verde", texto: fmt(costoTotal) + " M USD · sin límite" }
      : { fill: Math.min(usoPres, 1), nivel: nivel(usoPres, 0.85), texto: fmt(costoTotal) + " / " + fmt(pres, 0) + " M USD" };

    if (genMax > 0) {
      const uso = consumo / genProm;
      barras.energia = { fill: Math.min(uso, 1), nivel: nivel(uso, 0.8), texto: fmt(consumo, 0) + " / " + fmt(genProm, 0) + " W prom." };
    } else {
      barras.energia = { fill: 0, nivel: "neutro", texto: fmt(consumo, 0) + " W (faltan paneles)" };
    }

    if (memoria > 0) {
      const uso = gbDia / memoria;
      barras.datos = { fill: Math.min(uso, 1), nivel: nivel(uso, 0.7), texto: fmt(gbDia, 2) + " GB/día · memoria " + fmt(memoria, 0) + " GB" };
    } else {
      barras.datos = { fill: 0, nivel: "neutro", texto: fmt(gbDia, 2) + " GB/día (falta computador)" };
    }

    if (p.antena) {
      const uso = gbDia > 0 ? gbDia / bajada : 0;
      barras.comunicaciones = { fill: Math.min(uso, 1), nivel: nivel(uso, 0.85), texto: "envía " + fmt(bajada, 2) + " de " + fmt(gbDia, 2) + " GB/día" };
    } else {
      barras.comunicaciones = { fill: 0, nivel: "neutro", texto: "falta antena" };
    }

    if (p.estructura && p.bateria) {
      const razon = vidaAnios / duracionAnios;
      barras.tiempo = { fill: Math.min(razon, 1), nivel: razon >= 1 ? "verde" : (razon >= 0.7 ? "amarillo" : "rojo"),
        texto: faltaMotor ? "¡necesita motor!" : fmt(vidaAnios) + " de " + fmt(duracionAnios) + " años" };
    } else {
      barras.tiempo = { fill: 0, nivel: "neutro", texto: "faltan estructura y batería" };
    }

    return {
      escenario: esc, dificultad: dif, orbita: orb, cohete: coh, piezas: p, instrumentos: ins,
      orbitaEstimada: !e.orbita,
      masa: masa, masaSeca: masaSeca, masaCombustible: masaCombustible, deltaV: deltaV, motor: motor, faltaMotor: faltaMotor,
      capacidadCohete: capacidadCohete,
      costoTotal: costoTotal, costoCohete: precioCohete, presupuesto: pres,
      consumo: consumo, consumoPlataforma: consumoPlataforma, consumoInstr: consumoInstr,
      genMax: genMax, genProm: genProm,
      capBat: capBat, necesidadSombra: necesidadSombra, descarga: descarga, limiteDescarga: limiteDescarga,
      gbDia: gbDia, memoria: memoria, bajada: bajada,
      diasViaje: diasViaje,
      vidaAnios: vidaAnios, causaVida: causaVida, duracionAnios: duracionAnios,
      cienciaBase: ciencia, maxCienciaEscenario: maxCienciaEscenario,
      barras: barras
    };
  }

  /* ---------- ¿Se puede lanzar? (fase 4) ---------- */
  function verificarLanzamiento(e, r) {
    const problemas = [];
    if (!e.orbita) problemas.push("Elige una órbita.");
    if (!e.cohete) problemas.push("Elige un cohete.");
    if (r.faltaMotor) problemas.push("Esta órbita necesita propulsión: vuelve a la fase 2 y elige un motor.");
    if (e.orbita && e.cohete && !r.faltaMotor) {
      if (r.capacidadCohete === 0) problemas.push(r.cohete.nombre + " no puede llegar a este destino.");
      else if (r.masa > r.capacidadCohete) problemas.push("Tu nave pesa " + fmt(r.masa, 0) + " kg (con combustible) y " + r.cohete.nombre + " solo lleva " + fmt(r.capacidadCohete, 0) + " kg a este destino.");
    }
    if (r.costoTotal > r.presupuesto) problemas.push("Te pasaste del presupuesto por " + fmt(r.costoTotal - r.presupuesto) + " M USD.");
    return { ok: problemas.length === 0, problemas: problemas };
  }

  /* ---------- Metas de cada rol (modo equipo) ---------- */
  function evaluarRoles(r, s, puntosCiencia) {
    const sobrante = Math.max(0, r.presupuesto - r.costoTotal);
    return {
      directora: r.presupuesto >= SIN_LIMITE ? { logrado: false, detalle: "Modo libre: no hay presupuesto que cuidar." } :
        { logrado: sobrante >= r.presupuesto * 0.1, detalle: "Sobró " + fmt(sobrante) + " M USD (" + Math.round(sobrante / r.presupuesto * 100) + "% del presupuesto)." },
      ingeniera: { logrado: s.finPor === "completa" && s.diasSinEnergia <= 5, detalle: s.finPor === "completa" ? "La nave sobrevivió; días sin energía: " + s.diasSinEnergia + "." : "La nave no completó la misión." },
      cientifica: { logrado: puntosCiencia >= r.maxCienciaEscenario * 0.4, detalle: "Ciencia: " + puntosCiencia + " de " + fmt(r.maxCienciaEscenario, 0) + " posibles (" + Math.round(puntosCiencia / r.maxCienciaEscenario * 100) + "%)." },
      comunicaciones: { logrado: s.generadoGB > 0 && s.perdidoGB <= s.generadoGB * 0.15, detalle: "Se perdió el " + (s.generadoGB > 0 ? Math.round(s.perdidoGB / s.generadoGB * 100) : 0) + "% de los datos." }
    };
  }

  /* =================================================================
     generarInforme: puntaje + explicación de POR QUÉ pasó lo que pasó
     ================================================================= */
  function generarInforme(r, s) {
    const cfg = DATOS.config;
    const dur = r.escenario.duracionDias;

    // --- Puntaje ---
    const idealGB = r.gbDia * dur;
    const fraccionCiencia = idealGB > 0 ? Math.min(1, s.enviadoGB / idealGB) : 0;
    const puntosCiencia = Math.max(0, Math.round(r.cienciaBase * fraccionCiencia + s.cienciaExtra));
    const sobrante = Math.max(0, r.presupuesto - r.costoTotal);
    const sinLimite = r.presupuesto >= SIN_LIMITE;           // Modo libre: el ahorro no da puntos
    const puntosPresupuesto = sinLimite ? 0 : Math.round(sobrante * cfg.puntosPorMillon);
    const fraccionVida = Math.min(1, s.dia / dur);
    const puntosSupervivencia = Math.round(cfg.puntosSupervivenciaMax * fraccionVida);
    const subtotal = puntosCiencia + puntosPresupuesto + puntosSupervivencia;
    const total = Math.round(subtotal * r.dificultad.multPuntaje);

    // --- Clasificación (relativa a la ciencia posible del escenario) ---
    const fraccionMax = puntosCiencia / r.maxCienciaEscenario;
    let clasificacion, estrellas;
    if (fraccionVida < 0.5 || fraccionMax < 0.15) { clasificacion = "Misión fallida"; estrellas = 1; }
    else if (fraccionVida >= 0.95 && fraccionCiencia >= 0.6 && fraccionMax >= 0.35) { clasificacion = "¡Misión exitosa!"; estrellas = 3; }
    else { clasificacion = "Éxito parcial"; estrellas = 2; }

    const mal = [], bien = [];
    const recomendada = buscar(r.escenario.orbitas, r.escenario.orbitaRecomendada);

    // 1. ¿Sobrevivió?
    if (s.finPor === "vida") {
      let causa;
      if (s.vidaPerdidaEventos > 0 && r.vidaAnios * 365 >= dur) causa = "Los imprevistos le quitaron " + fmt(s.vidaPerdidaEventos, 0) + " días de vida.";
      else if (r.causaVida === "orbita") causa = r.orbita.causaVidaOrbita;
      else if (r.causaVida === "bateriaExigida") causa = "En cada sombra usabas el " + fmt(r.descarga * 100, 0) + "% de la batería (en esta órbita lo seguro es menos de " + Math.round(r.limiteDescarga * 100) + "%). Una batería tan exigida dura la mitad.";
      else if (r.causaVida === "bateria") causa = "Tu batería de " + r.piezas.bateria.nombre.toLowerCase() + " solo dura " + fmt(r.piezas.bateria.vidaAnios, 0) + " años.";
      else causa = "La estructura se desgastó antes de tiempo.";
      mal.push({ icono: "reloj", texto: "Tu nave dejó de funcionar el día " + fmt(s.dia, 0) + " de " + fmt(dur, 0) + ". " + causa,
        consejo: r.causaVida === "orbita" && !r.motor ? "Agrega propulsión: con motor la nave puede mantener su órbita." : "Usa una batería avanzada, baja el consumo o evita decisiones que gasten vida útil." });
    } else if (s.finPor === "energia") {
      mal.push({ icono: "bateriaBaja", texto: "La nave se quedó sin energía incluso para sus sistemas básicos y se apagó.", consejo: "Usa paneles más potentes o piezas que gasten menos." });
    } else {
      bien.push({ icono: "satelite", texto: "Tu nave funcionó los " + fmt(dur, 0) + " días que pedían los científicos." });
    }

    // 2. Comunicaciones
    if (r.gbDia > r.bajada) {
      const perdido = Math.round((1 - r.bajada / r.gbDia) * 100);
      mal.push({ icono: "antena", texto: "Tus instrumentos generaban " + fmt(r.gbDia, 2) + " GB diarios, pero tu antena solo envía " + fmt(r.bajada, 2) + " GB: perdiste el " + perdido + "% de la ciencia.",
        consejo: r.piezas.antena && r.piezas.antena.velocidadMbps < 50 ? "Cambia a la antena de banda X con parabólica (10 veces más rápida)."
          : (r.escenario.cuerpo === "tierra" && r.orbita.minutosContactoDia < 100 ? "Elige una órbita con más contacto con estaciones terrenas." : "Lejos de la Tierra hay que elegir instrumentos que produzcan pocos datos.") });
    } else {
      bien.push({ icono: "antena", texto: "Tu antena alcanzaba para enviar todos los datos (" + fmt(r.bajada, 2) + " GB/día de capacidad)." });
    }

    // 3. Memoria
    if (r.gbDia > r.memoria) {
      mal.push({ icono: "memoria", texto: "Generabas " + fmt(r.gbDia, 2) + " GB al día, pero el computador solo guarda " + fmt(r.memoria, 0) + " GB: los datos se borraban antes de enviarlos.", consejo: "Usa el computador avanzado (256 GB)." });
    }

    // 4. Energía
    if (r.consumo > r.genProm) {
      mal.push({ icono: "rayo", texto: "Consumías " + fmt(r.consumo, 0) + " W, pero los paneles entregaban en promedio " + fmt(r.genProm, 0) + " W" +
        (r.escenario.factorSolar < 1 ? " (allá llega solo el " + Math.round(r.escenario.factorSolar * 100) + "% de la luz del Sol)" : "") +
        ". La nave apagó instrumentos " + fmt(s.diasSinEnergia, 0) + " días.", consejo: "Usa paneles avanzados o quita el instrumento que más energía gasta." });
    } else {
      bien.push({ icono: "rayo", texto: "Tu energía alcanzaba: gastabas " + fmt(r.consumo, 0) + " W de " + fmt(r.genProm, 0) + " W disponibles." });
    }

    // 5. Batería en sombra
    if (r.necesidadSombra > r.capBat) {
      mal.push({ icono: "luna", texto: "En cada sombra necesitabas " + fmt(r.necesidadSombra, 0) + " Wh, pero tu batería guarda " + fmt(r.capBat, 0) + " Wh: los instrumentos se apagaban en la oscuridad.", consejo: "Usa la batería de ion-litio o baja el consumo." });
    }

    // 6. Órbita
    if (r.orbita.id !== r.escenario.orbitaRecomendada) {
      mal.push({ icono: "planeta", texto: r.orbita.notaCiencia, consejo: "Para este objetivo, piensa en la " + recomendada.nombre.toLowerCase() + ": " + recomendada.notaCiencia });
    } else {
      bien.push({ icono: "planeta", texto: "Elegiste la " + r.orbita.nombre.toLowerCase() + ": " + r.orbita.notaCiencia });
    }

    // 7. Combustible
    if (r.motor && r.masaCombustible > r.masaSeca * 0.5) {
      mal.push({ icono: "gota", texto: "Tu nave llevaba " + fmt(r.masaCombustible, 0) + " kg de combustible: ¡" + Math.round(r.masaCombustible / r.masaSeca * 100) + "% de su peso seco! Así lo exige la ecuación del cohete con un Δv de " + fmt(r.deltaV, 2) + " km/s.",
        consejo: r.motor.isp < 1000 ? "Un motor eléctrico necesita mucho menos combustible (aunque el viaje sea más largo)." : "Elige una órbita que necesite menos Δv." });
    } else if (r.motor && r.masaCombustible > 0) {
      bien.push({ icono: "gota", texto: "Tu combustible (" + fmt(r.masaCombustible, 0) + " kg) fue razonable para un Δv de " + fmt(r.deltaV, 2) + " km/s." });
    }

    // 8. Apuntado
    const conPunteria = r.instrumentos.some(function (i) { return i.necesitaPunteria; });
    if (conPunteria && r.piezas.orientacion && r.piezas.orientacion.precision < 1) {
      mal.push({ icono: "objetivo", texto: "Tu control de orientación básico hacía temblar la nave: los instrumentos que apuntan perdieron el " + Math.round((1 - r.piezas.orientacion.precision) * 100) + "% de su valor.", consejo: "El rastreador de estrellas mantiene la nave quieta." });
    }

    // 9. Dinero
    if (sinLimite) bien.push({ icono: "moneda", texto: "Modo libre: gastaste " + fmt(r.costoTotal) + " millones. En una misión real, ¿te lo aprobarían?" });
    else if (sobrante >= r.presupuesto * 0.2) bien.push({ icono: "moneda", texto: "Te sobraron " + fmt(sobrante) + " millones (+" + puntosPresupuesto + " puntos). ¿Podrías haber agregado un instrumento más?" });
    else if (sobrante > 0) bien.push({ icono: "moneda", texto: "Usaste bien el presupuesto: sobraron " + fmt(sobrante) + " millones." });

    // 10. Poca ciencia
    if (r.cienciaBase < r.maxCienciaEscenario * 0.3) {
      mal.push({ icono: "telescopio", texto: "Tu diseño podía lograr como máximo " + fmt(r.cienciaBase, 0) + " puntos de ciencia, de " + fmt(r.maxCienciaEscenario, 0) + " posibles en esta misión.", consejo: "Agrega instrumentos o elige una órbita donde sirvan más." });
    }

    if (s.cienciaExtra > 0) bien.push({ icono: "dado", texto: "Tus decisiones en los imprevistos sumaron " + fmt(s.cienciaExtra, 0) + " puntos de ciencia extra." });
    if (s.cienciaExtra < 0) mal.push({ icono: "dado", texto: "Los imprevistos te quitaron " + fmt(-s.cienciaExtra, 0) + " puntos de ciencia.", consejo: "Piensa en qué piezas te habrían protegido mejor." });

    // 11. Desafíos (minijuegos): cómo le fue al jugador y qué pieza lo habría ayudado
    const desafios = s.decisiones.filter(function (d) { return d.minijuego; });
    if (desafios.length) {
      const promedio = Math.round(desafios.reduce(function (t, d) { return t + d.puntaje; }, 0) / desafios.length);
      const peor = desafios.slice().sort(function (a, b) { return a.puntaje - b.puntaje; })[0];
      const AYUDA = {
        asteroides: "Una nave más liviana y con control de orientación avanzado es más ágil para esquivar.",
        tormenta: "Una batería más grande y un computador endurecido aguantan mejor las tormentas solares.",
        antena: "Una antena parabólica de banda X tiene un círculo de enlace más grande: es más fácil apuntarla.",
        orbita: "Un motor (hidracina o eléctrico) da impulsos para mantener la órbita; sin motor casi no puedes corregirla.",
        reparacion: "El computador avanzado hace un diagnóstico que te muestra una conexión correcta."
      };
      if (promedio >= 70) bien.push({ icono: "trofeo", texto: "Superaste " + desafios.length + " desafío(s) con un promedio de " + promedio + "%: tus reflejos y tu diseño protegieron la nave." });
      else mal.push({ icono: "alerta", texto: "En los desafíos lograste un promedio de " + promedio + "%. Cada error tuvo un costo real en energía, datos o vida útil. El más difícil fue «" + peor.evento + "» (" + peor.puntaje + "%).",
        consejo: AYUDA[peor.minijuego] + " También puedes practicar en el Centro de entrenamiento." });
    }

    let resumen;
    if (estrellas === 3) resumen = "Tu diseño estuvo equilibrado: la nave sobrevivió y la mayoría de los datos llegaron a la Tierra.";
    else if (mal.length > 0) resumen = "El problema principal: " + mal[0].texto;
    else resumen = "Tu nave funcionó, pero llevaba poca ciencia.";

    return {
      puntosCiencia: puntosCiencia, puntosPresupuesto: puntosPresupuesto, puntosSupervivencia: puntosSupervivencia,
      subtotal: subtotal, total: total, clasificacion: clasificacion, estrellas: estrellas, resumen: resumen,
      fraccionCiencia: fraccionCiencia, fraccionVida: fraccionVida, sobrante: sobrante,
      mal: mal, bien: bien, roles: evaluarRoles(r, s, puntosCiencia)
    };
  }

  return {
    buscar: buscar, fmt: fmt, escenario: escenario, dificultad: dificultad, orbita: orbita, presupuesto: presupuesto,
    piezas: piezas, opcionAjustada: opcionAjustada, combustible: combustible, costoCohete: costoCohete,
    calcularRecursos: calcularRecursos, verificarLanzamiento: verificarLanzamiento,
    generarInforme: generarInforme, bajadaGbDia: bajadaGbDia
  };
})();
