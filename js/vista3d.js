/* =====================================================================
   vista3d.js — Las partes en 3D de SPACE SIMULATOR (con Three.js)
   ---------------------------------------------------------------------
   Three.js está guardado en js/lib/three.min.js: funciona sin internet.
   Hay UN solo "dibujante" 3D (renderer) que se mueve de pantalla en pantalla:
     - mostrarInicio(contenedor)        → la Tierra girando en el menú
     - mostrarNave(contenedor, r)        → la nave que armaste (se gira con
                                           el mouse o el dedo, rueda/pellizco = zoom)
     - mostrarSimulacion(contenedor)     → la nave orbitando durante la misión
     - cinematica(contenedor, tipo, fin) → escenas de respaldo cuando no hay video:
                                           "despegue", "orbita", "exito", "falla"
   Si el equipo no tiene WebGL o se eligió "Calidad baja", el juego usa las
   imágenes y el dibujo 2D de siempre.
   ===================================================================== */

const Vista3D = (function () {

  const hayWebGL = (function () {
    try {
      const c = document.createElement("canvas");
      return !!(window.THREE && window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  })();

  let calidadBaja = false;
  let renderer = null, canvas = null;
  let escena = null, camara = null, contenedor = null;
  let actualizar = null;            // función que anima la escena actual
  let raf = null, ultimo = 0;
  const texturas = {};
  const controles = { activo: false, rotX: 0.35, rotY: 0, dist: 6, minDist: 2.5, maxDist: 14, auto: true, punteros: {} };

  function disponible() { return hayWebGL && !calidadBaja; }

  /* ---------- El dibujante 3D (se crea una sola vez) ---------- */
  function asegurarRenderer() {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    canvas = renderer.domElement;
    canvas.className = "lienzo-3d";
    instalarControles();
  }

  // Vigila el tamaño del contenedor: si cambia (o aún no tenía alto), se reajusta
  const vigia = window.ResizeObserver ? new ResizeObserver(function () { redimensionar(); }) : null;

  function montar(cont) {
    asegurarRenderer();
    if (vigia) { vigia.disconnect(); vigia.observe(cont); }
    contenedor = cont;
    cont.appendChild(canvas);
    redimensionar();
    requestAnimationFrame(redimensionar);
    ultimo = performance.now();
    if (raf) cancelAnimationFrame(raf);          // siempre se reinicia el bucle (evita quedar esperando un cuadro viejo)
    raf = requestAnimationFrame(bucle);
  }

  function redimensionar() {
    if (!contenedor || !camara) return;
    const caja = contenedor.getBoundingClientRect();
    const w = Math.max(50, Math.round(caja.width)), h = Math.max(50, Math.round(caja.height) || Math.round(w * 0.6));
    renderer.setSize(w, h, false);
    canvas.style.width = "100%"; canvas.style.height = "100%";
    camara.aspect = w / h; camara.updateProjectionMatrix();
  }
  window.addEventListener("resize", redimensionar);

  function bucle(t) {
    raf = null;
    // Si la pantalla cambió y el contenedor ya no existe, se detiene solo
    if (!contenedor || !document.body.contains(contenedor)) { contenedor = null; return; }
    const dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t;
    if (actualizar) actualizar(dt, t / 1000);
    renderer.render(escena, camara);
    raf = requestAnimationFrame(bucle);
  }

  function detener() { contenedor = null; actualizar = null; }

  // Libera la memoria de la escena anterior (las texturas se reutilizan)
  function limpiarEscena() {
    if (!escena) return;
    escena.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m.map && !m.map.userData.compartida) m.map.dispose(); m.dispose(); });
    });
  }

  function nuevaEscena(fov) {
    limpiarEscena();
    escena = new THREE.Scene();
    camara = new THREE.PerspectiveCamera(fov || 45, 1.6, 0.05, 2000);
    escena.add(new THREE.AmbientLight(0xffffff, 0.28));
    const sol = new THREE.DirectionalLight(0xffffff, 1.25);
    sol.position.set(-10, 3, 6);                    // el Sol está a la izquierda, como en el dibujo 2D
    escena.add(sol);
    return sol;
  }

  /* ---------- Controles: arrastrar para girar, rueda o pellizco para acercar ---------- */
  function instalarControles() {
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", function (e) {
      if (!controles.activo) return;
      controles.punteros[e.pointerId] = { x: e.clientX, y: e.clientY };
      controles.auto = false;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", function (e) {
      const p = controles.punteros[e.pointerId];
      if (!p || !controles.activo) return;
      const ids = Object.keys(controles.punteros);
      if (ids.length === 2) {           // pellizco con dos dedos
        const otro = controles.punteros[ids[0] == e.pointerId ? ids[1] : ids[0]];
        const antes = Math.hypot(p.x - otro.x, p.y - otro.y), ahora = Math.hypot(e.clientX - otro.x, e.clientY - otro.y);
        controles.dist = Math.max(controles.minDist, Math.min(controles.maxDist, controles.dist * antes / Math.max(1, ahora)));
      } else {
        controles.rotY -= (e.clientX - p.x) * 0.008;
        controles.rotX = Math.max(-1.3, Math.min(1.3, controles.rotX + (e.clientY - p.y) * 0.006));
      }
      p.x = e.clientX; p.y = e.clientY;
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (t) {
      canvas.addEventListener(t, function (e) { delete controles.punteros[e.pointerId]; });
    });
    canvas.addEventListener("wheel", function (e) {
      if (!controles.activo) return;
      e.preventDefault();
      controles.dist = Math.max(controles.minDist, Math.min(controles.maxDist, controles.dist * (e.deltaY > 0 ? 1.1 : 0.9)));
    }, { passive: false });
  }

  function aplicarCamara(objetivo) {
    const o = objetivo || new THREE.Vector3();
    camara.position.set(
      o.x + controles.dist * Math.cos(controles.rotX) * Math.sin(controles.rotY),
      o.y + controles.dist * Math.sin(controles.rotX),
      o.z + controles.dist * Math.cos(controles.rotX) * Math.cos(controles.rotY));
    camara.lookAt(o);
  }

  /* =================================================================
     TEXTURAS (Tierra y Luna vienen de texturas.js; Marte y el asteroide
     se pintan con código)
     ================================================================= */
  function textura(nombre) {
    if (texturas[nombre]) return texturas[nombre];
    let t;
    if ((nombre === "tierra" || nombre === "luna") && typeof TEXTURAS !== "undefined") {
      t = new THREE.TextureLoader().load(TEXTURAS[nombre]);
    } else {
      t = new THREE.CanvasTexture(pintarTextura(nombre));
    }
    t.encoding = THREE.sRGBEncoding;
    t.userData.compartida = true;
    texturas[nombre] = t;
    return t;
  }

  function pintarTextura(nombre) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 256;
    const g = c.getContext("2d");
    const marte = nombre === "marte";
    g.fillStyle = marte ? "#b5532a" : (nombre === "asteroide" ? "#7d756a" : "#3a6fd8"); g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 900; i++) {           // manchas y cráteres
      const x = Math.random() * 512, y = Math.random() * 256, r = Math.random() * (marte ? 22 : 8) + 2;
      g.fillStyle = marte ? "rgba(" + (90 + Math.random() * 60) + "," + (30 + Math.random() * 25) + ",15," + (0.15 + Math.random() * 0.25) + ")"
        : "rgba(" + (60 + Math.random() * 60 | 0) + "," + (55 + Math.random() * 50 | 0) + "," + (48 + Math.random() * 40 | 0) + ",0.5)";
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    if (marte) {
      g.fillStyle = "rgba(90,30,15,0.5)"; g.fillRect(60, 120, 260, 14);      // un gran cañón, como Valles Marineris
      g.fillStyle = "#f2efe9"; g.fillRect(0, 0, 512, 12); g.fillRect(0, 246, 512, 10);   // casquetes polares
    }
    return c;
  }

  /* ---------- Planetas, estrellas y atmósfera ---------- */
  function crearCuerpo(tipo, radio) {
    const seg = calidadBaja ? 24 : 64;
    const grupo = new THREE.Group();
    let geo;
    if (tipo === "asteroide") {
      geo = new THREE.IcosahedronGeometry(radio, 3);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {           // deformar la esfera para que parezca una roca
        const v = new THREE.Vector3().fromBufferAttribute(pos, i);
        const n = 1 + 0.18 * Math.sin(v.x * 3.1) * Math.cos(v.y * 2.7) + 0.08 * Math.sin(v.z * 7.3);
        v.multiplyScalar(n); v.x *= 1.35;
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
    } else {
      geo = new THREE.SphereGeometry(radio, seg, seg / 2);
    }
    const mat = new THREE.MeshPhongMaterial({ map: textura(tipo), shininess: tipo === "tierra" ? 12 : 2, flatShading: tipo === "asteroide" });
    grupo.add(new THREE.Mesh(geo, mat));
    if (tipo === "tierra" || tipo === "marte") {
      const atm = new THREE.Mesh(new THREE.SphereGeometry(radio * 1.06, seg, seg / 2),
        new THREE.MeshBasicMaterial({ color: tipo === "tierra" ? 0x5ab4ff : 0xffa070, transparent: true, opacity: tipo === "tierra" ? 0.16 : 0.08, side: THREE.BackSide }));
      grupo.add(atm);
    }
    return grupo;
  }

  function crearEstrellas(cantidad) {
    const n = calidadBaja ? Math.round(cantidad / 3) : cantidad;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(300 + Math.random() * 200);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false }));
  }

  /* =================================================================
     LA NAVE: se arma según las piezas e instrumentos elegidos
     ================================================================= */
  function mat(color, metal, rugosidad, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({ color: color, metalness: metal || 0.2, roughness: rugosidad === undefined ? 0.6 : rugosidad }, extra || {}));
  }
  function caja(w, h, d, material) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); }
  function cilindro(r1, r2, h, material, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 16), material); }

  function crearNave(r) {
    const nave = new THREE.Group();
    const p = (r && r.piezas) || {};
    const ajuste = (r && r.escenario && r.escenario.ajustePaneles) || 1;

    // Cuerpo: aluminio con mantas doradas (básica) o fibra de carbono oscura (avanzada)
    const avanzada = p.estructura && p.estructura.masa < 40;
    const tam = avanzada ? 1 : 1.15;
    const cuerpo = caja(tam, tam * 1.15, tam, avanzada ? mat(0x2a2d33, 0.3, 0.55) : mat(0xd4a017, 0.9, 0.32));
    nave.add(cuerpo);
    if (!p.estructura) cuerpo.material.wireframe = true;            // aún sin estructura: solo el contorno

    // Paneles solares: más largos en Marte (ajuste 2,5)
    if (p.paneles) {
      const avz = p.paneles.generacion >= 400;
      const matPanel = mat(avz ? 0x0d1a52 : 0x1f3a72, 0.4, 0.3, { emissive: avz ? 0x050a30 : 0x000000 });
      const matMarco = mat(0xb8bcc8, 0.7, 0.4);
      const cantidad = Math.max(2, Math.round(3 * Math.sqrt(ajuste)));
      [-1, 1].forEach(function (lado) {
        const brazo = cilindro(0.03, 0.03, 0.45, matMarco); brazo.rotation.z = Math.PI / 2; brazo.position.x = lado * (tam / 2 + 0.22); nave.add(brazo);
        for (let i = 0; i < cantidad; i++) {
          const panel = caja(0.8, 0.025, 0.62, matPanel);
          panel.position.x = lado * (tam / 2 + 0.45 + 0.42 + i * 0.84);
          nave.add(panel);
          const marco = caja(0.82, 0.015, 0.02, matMarco); marco.position.set(panel.position.x, 0, 0.31); nave.add(marco);
        }
      });
    }

    // Antena: varilla simple (banda S) o plato parabólico (banda X)
    if (p.antena) {
      const matBlanco = mat(0xf2f2f2, 0.2, 0.5);
      if (p.antena.velocidadMbps >= 50) {
        const perfil = []; for (let i = 0; i <= 10; i++) { const x = i / 10 * 0.42; perfil.push(new THREE.Vector2(x, x * x * 1.4)); }
        const plato = new THREE.Mesh(new THREE.LatheGeometry(perfil, 24), mat(0xf5f5f5, 0.3, 0.45, { side: THREE.DoubleSide }));
        plato.rotation.x = Math.PI; plato.position.y = tam * 0.58 + 0.42; nave.add(plato);
        const mastil = cilindro(0.025, 0.025, 0.4, matBlanco); mastil.position.y = tam * 0.58 + 0.2; nave.add(mastil);
      } else {
        const varilla = cilindro(0.015, 0.015, 0.7, matBlanco); varilla.position.set(0.25, tam * 0.58 + 0.35, 0.25); nave.add(varilla);
        const parche = caja(0.22, 0.03, 0.22, mat(0xdadada, 0.5, 0.4)); parche.position.set(-0.2, tam * 0.58 + 0.02, -0.2); nave.add(parche);
      }
    }

    // Orientación: rastreadores de estrellas (avanzada) o barras magnéticas (básica)
    if (p.orientacion) {
      if (p.orientacion.precision >= 1) {
        [0, 1].forEach(function (i) {
          const st = cilindro(0.07, 0.09, 0.2, mat(0x111111, 0.6, 0.3)); st.rotation.x = Math.PI / 3;
          st.position.set(-tam * 0.35 + i * 0.2, tam * 0.58 + 0.08, -tam * 0.35); nave.add(st);
        });
      } else {
        const matBarra = mat(0x8a8f99, 0.8, 0.35);
        [[0, 0], [Math.PI / 2, 0], [0, Math.PI / 2]].forEach(function (rot, i) {
          const b = cilindro(0.035, 0.035, tam * 0.9, matBarra); b.rotation.set(rot[0], 0, rot[1]);
          b.position.set(-tam / 2 - 0.05, -tam * 0.3 + i * 0.05, tam / 2 + 0.05); nave.add(b);
        });
      }
    }

    // Propulsión: tobera (hidracina) o motor iónico con brillo azul (efecto Hall)
    if (p.propulsion && p.propulsion.isp > 0) {
      if (p.propulsion.isp > 1000) {
        const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 10, 24), mat(0x9aa0aa, 0.8, 0.3));
        anillo.rotation.x = Math.PI / 2; anillo.position.y = -tam * 0.58 - 0.05; nave.add(anillo);
        const brillo = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), new THREE.MeshBasicMaterial({ color: 0x5fa8ff }));
        brillo.rotation.x = Math.PI / 2; brillo.position.y = -tam * 0.58 - 0.06; nave.add(brillo);
      } else {
        const tobera = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.32, 18, 1, true), mat(0x55575c, 0.9, 0.3, { side: THREE.DoubleSide }));
        tobera.position.y = -tam * 0.58 - 0.15; nave.add(tobera);
      }
    }

    // Instrumentos en la cara delantera
    const ins = (r && r.instrumentos) || [];
    ins.forEach(function (i, k) {
      const obj = crearInstrumento(i.id);
      const fila = Math.floor(k / 2), col = k % 2;
      if (obj.userData.abajo) { obj.position.set(0, -tam * 0.58 - 0.02, tam * 0.1); }
      else obj.position.set(-tam * 0.22 + col * tam * 0.44, tam * 0.25 - fila * tam * 0.38, tam / 2 + 0.06);
      nave.add(obj);
    });
    return nave;
  }

  function crearInstrumento(id) {
    const g = new THREE.Group();
    if (/radar/.test(id)) {                              // antena plana de radar
      const panel = caja(1.0, 0.04, 0.42, mat(0xe8e8e8, 0.3, 0.5)); g.add(panel); g.userData.abajo = true;
    } else if (/camara|optica|shadowcam|imagenes/.test(id)) {       // lente de cámara
      const tubo = cilindro(0.13, 0.13, 0.22, mat(0x1b1b1f, 0.5, 0.4)); tubo.rotation.x = Math.PI / 2; g.add(tubo);
      const vidrio = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), mat(0x3355aa, 0.9, 0.05)); vidrio.position.z = 0.115; g.add(vidrio);
    } else if (/termic|fuego|sonda|espectro|minerales/.test(id)) {   // caja con ventana
      g.add(caja(0.28, 0.22, 0.12, mat(0x6c7380, 0.6, 0.4)));
      const ventana = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), mat(0x441111, 0.8, 0.1)); ventana.position.z = 0.065; g.add(ventana);
    } else if (/cubesat/.test(id)) {
      g.add(caja(0.2, 0.2, 0.2, mat(0x223355, 0.5, 0.4)));
    } else {                                              // sensores pequeños en un brazo
      const brazo = cilindro(0.02, 0.02, 0.3, mat(0xb0b4bc, 0.7, 0.3)); brazo.rotation.x = Math.PI / 2; g.add(brazo);
      const punta = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), mat(0xffb703, 0.5, 0.4)); punta.position.z = 0.17; g.add(punta);
    }
    return g;
  }

  /* =================================================================
     ESCENA 1: la Tierra girando (menú de inicio)
     ================================================================= */
  function mostrarInicio(cont) {
    if (!disponible()) return false;
    nuevaEscena(38);
    controles.activo = false; modoActual = "inicio";
    const tierra = crearCuerpo("tierra", 2);
    tierra.rotation.z = 0.41;                       // inclinación del eje: 23,4°
    escena.add(tierra);
    const sat = crearNave(null); sat.scale.setScalar(0.09);
    escena.add(sat);
    camara.position.set(0, 0.4, 6.6); camara.lookAt(0, 0, 0);
    actualizar = function (dt, t) {
      tierra.children[0].rotation.y += dt * 0.12;
      sat.position.set(Math.cos(t * 0.5) * 2.7, Math.sin(t * 0.5) * 0.8, Math.sin(t * 0.5) * 2.7);
      sat.rotation.y = -t * 0.5;
    };
    montar(cont);
    return true;
  }

  /* =================================================================
     ESCENA 2: la nave que armaste (fase 2)
     ================================================================= */
  let naveVista = null, modoActual = null;
  function mostrarNave(cont, r) {
    if (!disponible()) return false;
    nuevaEscena(40);
    escena.add(crearEstrellas(900));
    const luzRelleno = new THREE.DirectionalLight(0x88aaff, 0.45); luzRelleno.position.set(6, -2, -4); escena.add(luzRelleno);
    controles.activo = true; controles.minDist = 2.5; controles.maxDist = 12;
    // Si ya estábamos mirando la nave, se mantiene el ángulo que eligió el jugador
    if (modoActual !== "nave") { controles.auto = true; controles.dist = 7; controles.rotX = 0.35; }
    modoActual = "nave";
    naveVista = crearNave(r);
    escena.add(naveVista);
    // La cámara se aleja según el tamaño de la nave (los paneles de Marte son muy largos)
    const radio = new THREE.Box3().setFromObject(naveVista).getBoundingSphere(new THREE.Sphere()).radius;
    controles.maxDist = Math.max(12, radio * 5);
    if (controles.auto) controles.dist = Math.max(4, radio * 2.6);
    actualizar = function (dt) {
      if (controles.auto) controles.rotY += dt * 0.35;
      aplicarCamara();
    };
    montar(cont);
    return true;
  }

  /* =================================================================
     ESCENA 3: la simulación en 3D (fase 5)
     Lee el estado de la simulación (ángulo, sombra, contacto, viaje)
     ================================================================= */
  function mostrarSimulacion(cont) {
    if (!disponible()) return false;
    const r = Simulacion.recursos();
    if (!r) return false;
    nuevaEscena(42);
    modoActual = "simulacion";
    escena.add(crearEstrellas(1400));
    controles.activo = true; controles.auto = true; controles.minDist = 3; controles.maxDist = 16;
    controles.dist = 9; controles.rotX = 0.42; controles.rotY = 0.25;

    const tipo = r.escenario.cuerpo;
    const R = tipo === "asteroide" ? 0.7 : 2;
    const cuerpo = crearCuerpo(tipo, R);
    escena.add(cuerpo);

    // Órbita: elipse inclinada (usa los mismos números que el dibujo 2D)
    const d = r.orbita.dibujo;
    const escala = 2.05;
    const rx = Math.min(d.rx * escala, 5.2), rz = Math.min(d.ry * escala, 5.2);
    const grupoOrbita = new THREE.Group();
    grupoOrbita.rotation.z = d.rot;
    escena.add(grupoOrbita);
    const puntos = [];
    for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; puntos.push(new THREE.Vector3(rx * Math.cos(a), 0, rz * Math.sin(a))); }
    grupoOrbita.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntos), new THREE.LineDashedMaterial({ color: 0x8cb4ff, dashSize: 0.15, gapSize: 0.12, transparent: true, opacity: 0.6 })));
    grupoOrbita.children[0].computeLineDistances();

    const nave = crearNave(r); nave.scale.setScalar(0.16);
    grupoOrbita.add(nave);

    // Tierra lejana (cuando la misión no es en la Tierra) y rayo de comunicación
    let tierraLejana = null;
    if (tipo !== "tierra") {
      tierraLejana = crearCuerpo("tierra", 0.35); tierraLejana.position.set(7, 3.5, -9); escena.add(tierraLejana);
    }
    const estacion = new THREE.Vector3();
    const rayo = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 }));
    escena.add(rayo);

    // Objetos para el viaje (Tierra → destino)
    const viaje = new THREE.Group(); escena.add(viaje);
    const tierraViaje = crearCuerpo("tierra", 0.6); tierraViaje.position.set(-4.5, 0, 0); viaje.add(tierraViaje);
    const destinoViaje = crearCuerpo(tipo, tipo === "asteroide" ? 0.25 : 0.45); destinoViaje.position.set(4.5, 0, 0); viaje.add(destinoViaje);
    const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-4.5, 0, 0), new THREE.Vector3(0, 2.6, -1), new THREE.Vector3(4.5, 0, 0));
    viaje.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curva.getPoints(60)), new THREE.LineDashedMaterial({ color: 0x8cb4ff, dashSize: 0.2, gapSize: 0.15 })));
    viaje.children[viaje.children.length - 1].computeLineDistances();
    const naveViaje = crearNave(r); naveViaje.scale.setScalar(0.14); viaje.add(naveViaje);

    actualizar = function (dt) {
      const s = Simulacion.estado();
      if (!s) return;
      const enViaje = s.enViaje;
      viaje.visible = enViaje; cuerpo.visible = !enViaje; grupoOrbita.visible = !enViaje;
      if (tierraLejana) tierraLejana.visible = !enViaje;
      if (controles.auto) controles.rotY += dt * 0.08;
      if (enViaje) {
        const u = s.diaViaje / Math.max(1, s.diasViaje);
        naveViaje.position.copy(curva.getPoint(u));
        rayo.visible = false;
        aplicarCamara(new THREE.Vector3(0, 0.6, 0));
        return;
      }
      cuerpo.children[0].rotation.y += dt * 0.05;
      const v = s.visual || { angulo: 0, enContacto: false };
      // En el dibujo 2D el Sol está a la izquierda (−x): la sombra queda a la derecha
      nave.position.set(rx * Math.cos(v.angulo), 0, rz * Math.sin(v.angulo));
      nave.rotation.y = -v.angulo;
      rayo.visible = !!v.enContacto && !s.terminada;
      if (rayo.visible) {
        const desde = nave.getWorldPosition(new THREE.Vector3());
        if (tierraLejana) estacion.copy(tierraLejana.position);
        else estacion.set(-0.6, -1.2, 1.5).normalize().multiplyScalar(R);
        rayo.geometry.setFromPoints([desde, estacion]);
      }
      aplicarCamara();
    };
    montar(cont);
    return true;
  }

  /* =================================================================
     ESCENAS CINEMATOGRÁFICAS (respaldo cuando falta un video)
     ================================================================= */
  // Partículas de fuego y humo
  function crearParticulas(n) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const puntos = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.9, map: new THREE.CanvasTexture(c), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    const vida = [];
    for (let i = 0; i < n; i++) { vida.push({ t: 0, max: 0, vx: 0, vy: 0, vz: 0 }); pos[i * 3 + 1] = -9999; }
    let siguiente = 0;
    return {
      objeto: puntos,
      emitir: function (origen, cantidad, colorFuego) {
        for (let k = 0; k < cantidad; k++) {
          const i = siguiente; siguiente = (siguiente + 1) % n;
          pos[i * 3] = origen.x + (Math.random() - 0.5) * 0.3; pos[i * 3 + 1] = origen.y; pos[i * 3 + 2] = origen.z + (Math.random() - 0.5) * 0.3;
          vida[i] = { t: 0, max: 1 + Math.random() * 1.6, vx: (Math.random() - 0.5) * 2.2, vy: -3 - Math.random() * 3, vz: (Math.random() - 0.5) * 2.2, fuego: colorFuego };
        }
      },
      actualizar: function (dt) {
        for (let i = 0; i < n; i++) {
          const v = vida[i]; if (v.max === 0) continue;
          v.t += dt;
          if (v.t > v.max) { v.max = 0; pos[i * 3 + 1] = -9999; continue; }
          pos[i * 3] += v.vx * dt; pos[i * 3 + 1] += v.vy * dt; pos[i * 3 + 2] += v.vz * dt;
          v.vx *= 0.98; v.vy *= 0.94; v.vz *= 0.98;
          const u = v.t / v.max;
          // del amarillo-naranja al gris del humo
          const f = v.fuego || [1, 0.7, 0.25];
          col[i * 3] = u < 0.25 ? f[0] : 0.45 * (1 - u) + 0.1; col[i * 3 + 1] = u < 0.25 ? f[1] : 0.42 * (1 - u) + 0.1; col[i * 3 + 2] = u < 0.25 ? f[2] : 0.42 * (1 - u) + 0.12;
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      }
    };
  }

  function crearCohete() {
    const cohete = new THREE.Group();
    const blanco = mat(0xf2f2f2, 0.3, 0.5), negro = mat(0x1a1a1a, 0.4, 0.5);
    const etapa1 = new THREE.Group();
    const c1 = cilindro(0.35, 0.35, 4, blanco, 24); c1.position.y = 2; etapa1.add(c1);
    const banda = cilindro(0.355, 0.355, 0.3, negro, 24); banda.position.y = 3.6; etapa1.add(banda);
    for (let i = 0; i < 4; i++) {                    // aletas
      const aleta = caja(0.05, 0.6, 0.4, negro); const a = i * Math.PI / 2;
      aleta.position.set(Math.cos(a) * 0.38, 0.3, Math.sin(a) * 0.38); aleta.rotation.y = -a; etapa1.add(aleta);
    }
    const etapa2 = new THREE.Group();
    const c2 = cilindro(0.33, 0.35, 1.4, blanco, 24); c2.position.y = 4.7; etapa2.add(c2);
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.33, 1, 24), blanco); punta.position.y = 5.9; etapa2.add(punta);
    cohete.add(etapa1); cohete.add(etapa2);
    cohete.userData = { etapa1: etapa1, etapa2: etapa2 };
    return cohete;
  }

  // rNave: los recursos del diseño, para dibujar TU nave en la escena
  function cinematica(cont, tipo, alTerminar, rNave) {
    if (!disponible()) { setTimeout(alTerminar, 50); return false; }
    nuevaEscena(50);
    controles.activo = false; modoActual = "cinematica";
    const sacudir = function (fuerza) { cont.style.transform = fuerza > 0.01 ? "translate(" + ((Math.random() - 0.5) * fuerza) + "px," + ((Math.random() - 0.5) * fuerza) + "px)" : ""; };
    let tiempo = 0, terminado = false;
    const fin = function () { if (terminado) return; terminado = true; cont.style.transform = ""; actualizar = null; alTerminar(); };

    if (tipo === "despegue") {
      // Cámara que sigue al cohete, humo, fuego, vibración y separación de etapas
      const cielo = new THREE.Color(0x6aa7e8), espacio = new THREE.Color(0x02030a);
      escena.background = cielo.clone();
      const suelo = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat(0x3d4a35, 0, 1)); suelo.rotation.x = -Math.PI / 2; escena.add(suelo);
      const torre = caja(0.5, 7, 0.5, mat(0x8a3b2b, 0.5, 0.6)); torre.position.set(-1.4, 3.5, 0); escena.add(torre);
      const cohete = crearCohete(); escena.add(cohete);
      const estrellas = crearEstrellas(600); estrellas.material.transparent = true; estrellas.material.opacity = 0; escena.add(estrellas);
      const humo = crearParticulas(calidadBaja ? 300 : 900); escena.add(humo.objeto);
      let altura = 0, velocidad = 0, separado = false;
      const etapa1 = cohete.userData.etapa1, etapa2 = cohete.userData.etapa2;
      let caidaEtapa1 = 0;
      actualizar = function (dt) {
        tiempo += dt;
        if (tiempo > 0.6) { velocidad += dt * (2 + tiempo * 1.6); altura += velocidad * dt; }
        cohete.position.y = altura;
        if (!separado && tiempo > 4.6) {               // ¡separación de etapas!
          separado = true; Sonido.efecto("separacion");
          escena.remove(etapa1); escena.add(etapa1); etapa1.position.y = altura;
        }
        if (separado) { caidaEtapa1 += dt * 6; etapa1.position.y = altura - 1 - caidaEtapa1 * caidaEtapa1 * 0.4; etapa1.rotation.z += dt * 0.6; }
        const boquilla = new THREE.Vector3(0, separado ? altura + 4 : altura, 0);
        humo.emitir(boquilla, calidadBaja ? 4 : 12, separado ? [0.6, 0.75, 1] : [1, 0.7, 0.25]);
        humo.actualizar(dt);
        const u = Math.min(1, altura / 140);
        escena.background.copy(cielo).lerp(espacio, u);
        estrellas.material.opacity = u;
        camara.position.set(6 - Math.min(3, tiempo * 0.4), altura + 2.5 - Math.min(2, tiempo * 0.2), 9);
        camara.lookAt(0, altura + 3, 0);
        sacudir(tiempo < 4.5 ? Math.max(0, 10 - altura * 0.08) : 2);
        if (tiempo > 7.2) fin();
      };
    } else if (tipo === "orbita" || tipo === "exito" || tipo === "falla") {
      const tierra = crearCuerpo("tierra", 6); tierra.position.set(0, -6.6, -2); escena.add(tierra);
      escena.add(crearEstrellas(1200));
      const nave = crearNave(rNave || null); escena.add(nave); nave.scale.setScalar(0.5);
      const chispas = crearParticulas(400); escena.add(chispas.objeto);
      if (tipo === "exito") Sonido.efecto("exito");
      if (tipo === "falla") Sonido.efecto("alarma");
      actualizar = function (dt) {
        tiempo += dt;
        tierra.children[0].rotation.y += dt * 0.04;
        camara.position.set(Math.sin(tiempo * 0.15) * 3, 0.9, 5 - tiempo * 0.12);
        camara.lookAt(0, 0, 0);
        if (tipo === "falla") {
          nave.rotation.x += dt * 1.7; nave.rotation.z += dt * 1.1;
          nave.position.y -= dt * 0.15;
          if (Math.random() < 0.5) chispas.emitir(nave.position, 3, [1, 0.35, 0.2]);
          sacudir(Math.max(0, 6 - tiempo));
        } else {
          nave.rotation.y += dt * 0.4;
          if (tipo === "exito" && Math.random() < 0.4) chispas.emitir(new THREE.Vector3((Math.random() - 0.5) * 4, 2.5, (Math.random() - 0.5) * 2), 2, [1, 0.85, 0.3]);
        }
        chispas.actualizar(dt);
        if (tiempo > 5.5) fin();
      };
    }
    montar(cont);
    return true;
  }

  /* =================================================================
     ESCENA 5: el centro de control (hangar) con el astronauta
     "mundo" viene de hangar.js: posición del jugador y estaciones
     ================================================================= */
  // Astronauta con traje completo y visor dorado (no se ve la cara)
  function crearAstronauta(textoParche) {
    const a = new THREE.Group();
    const traje = mat(0xf0f0ee, 0.05, 0.85), gris = mat(0x9aa0aa, 0.4, 0.6), oscuro = mat(0x2a2d33, 0.3, 0.7);
    const naranja = mat(0xff7b00, 0.1, 0.7);
    const capsula = function (r, l, m) { return new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), m); };
    const torso = capsula(0.3, 0.45, traje); torso.position.y = 1.28; a.add(torso);
    const cinturon = cilindro(0.31, 0.31, 0.08, gris, 20); cinturon.position.y = 1.0; a.add(cinturon);
    const pecho = caja(0.34, 0.2, 0.06, gris); pecho.position.set(0, 1.38, 0.28); a.add(pecho);
    const mochila = caja(0.55, 0.62, 0.28, mat(0xd8dade, 0.2, 0.7)); mochila.position.set(0, 1.35, -0.34); a.add(mochila);
    const casco = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), traje); casco.position.y = 1.95; a.add(casco);
    // Visor dorado: un "casquete" curvo sobre la parte delantera del casco
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.31, 32, 24, Math.PI / 2 - 0.85, 1.7, 0.8, 1.1),
      mat(0xe0a92a, 0.65, 0.22, { side: THREE.DoubleSide, emissive: 0x4a3008 }));
    visor.position.y = 1.95; a.add(visor);
    const cuello = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.045, 10, 28), gris);
    cuello.rotation.x = Math.PI / 2; cuello.position.y = 1.68; a.add(cuello);
    // Brazos y piernas con "bisagra" para animar la caminata
    function extremidad(x, y, largo, radio, color, punta) {
      const pivote = new THREE.Group(); pivote.position.set(x, y, 0);
      const parte = capsula(radio, largo, color); parte.position.y = -largo / 2 - radio; pivote.add(parte);
      const fin = punta(); fin.position.y = -largo - radio * 2; pivote.add(fin);
      a.add(pivote); return pivote;
    }
    const guante = function () { return new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), gris); };
    const bota = function () { const b = caja(0.2, 0.14, 0.32, oscuro); b.position.z = 0.05; return b; };
    a.userData.brazoI = extremidad(-0.42, 1.55, 0.42, 0.1, traje, guante);
    a.userData.brazoD = extremidad(0.42, 1.55, 0.42, 0.1, traje, guante);
    a.userData.piernaI = extremidad(-0.16, 0.95, 0.5, 0.12, traje, bota);
    a.userData.piernaD = extremidad(0.16, 0.95, 0.5, 0.12, traje, bota);
    [-1, 1].forEach(function (l) { const banda = cilindro(0.105, 0.105, 0.06, naranja, 12); banda.position.y = -0.25; (l < 0 ? a.userData.brazoI : a.userData.brazoD).add(banda); });
    // Parche con el nombre (PAZ) en el pecho y bandera de Chile en el hombro
    const parche = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.09), new THREE.MeshStandardMaterial({ map: texturaParche(textoParche), roughness: 0.8 }));
    parche.position.set(-0.13, 1.56, 0.29); parche.rotation.y = -0.15; a.add(parche);
    const bandera = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.1), new THREE.MeshStandardMaterial({ map: texturaBandera(), roughness: 0.8, side: THREE.DoubleSide }));
    bandera.position.set(0, -0.08, 0.105); a.userData.brazoD.add(bandera);
    return a;
  }

  function texturaParche(texto) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 104;
    const g = c.getContext("2d");
    texto = (texto || "PAZ").toUpperCase().slice(0, 10);
    g.fillStyle = "#1d2b64"; g.fillRect(0, 0, 256, 104);
    g.strokeStyle = "#ffb703"; g.lineWidth = 8; g.strokeRect(4, 4, 248, 96);
    g.fillStyle = "#ffffff"; g.font = "bold " + (texto.length <= 4 ? 64 : Math.max(26, Math.round(230 / texto.length * 1.6))) + "px Trebuchet MS, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(texto, 128, 56);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  function texturaBandera() {         // bandera de Chile
    const c = document.createElement("canvas"); c.width = 150; c.height = 100;
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 150, 50);
    g.fillStyle = "#d52b1e"; g.fillRect(0, 50, 150, 50);
    g.fillStyle = "#0039a6"; g.fillRect(0, 0, 50, 50);
    g.fillStyle = "#ffffff"; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 15; g.lineTo(25 + Math.cos(a) * r, 25 + Math.sin(a) * r); }
    g.closePath(); g.fill();
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }

  /* ---------- Retrato de la Ingeniera Paz (imagen fija del personaje) ----------
     Dibuja al astronauta de medio cuerpo con luz de estudio y la Tierra de fondo,
     y devuelve la imagen (data URL JPEG). Se usó para crear assets/imagenes/ingeniera-paz.jpg */
  function retratoPaz(tam) {
    if (!hayWebGL) return null;
    tam = tam || 512;
    const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    r.setSize(tam, tam); r.outputEncoding = THREE.sRGBEncoding;
    const esc = new THREE.Scene();
    esc.background = new THREE.Color(0x0a1030);
    esc.add(new THREE.AmbientLight(0xffffff, 0.35));
    const clave = new THREE.DirectionalLight(0xfff1dc, 1.4); clave.position.set(-2, 3, 3); esc.add(clave);
    const borde = new THREE.DirectionalLight(0x4cc9f0, 1.1); borde.position.set(3, 1.5, -2); esc.add(borde);
    const relleno = new THREE.PointLight(0xffb703, 0.6, 6); relleno.position.set(1.2, 1.4, 1.5); esc.add(relleno);
    const tierra = crearCuerpo("tierra", 2.4); tierra.position.set(2.2, 0.9, -4); tierra.children[0].rotation.y = 2.2; esc.add(tierra);
    const estrellas = crearEstrellas(500); esc.add(estrellas);
    const paz = crearAstronauta();
    paz.rotation.y = -0.35;
    paz.userData.brazoD.rotation.z = 0.15; paz.userData.brazoI.rotation.z = -0.15;
    esc.add(paz);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
    cam.position.set(0.6, 2.05, 2.6); cam.lookAt(0.05, 1.72, 0);       // casco y hombros
    r.render(esc, cam);
    const url = r.domElement.toDataURL("image/jpeg", 0.9);
    r.dispose();
    return url;
  }

  // Cartel con texto (nombre de la estación y su estado)
  function crearCartel(titulo, subtitulo, color, bloqueada) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 180;
    const g = c.getContext("2d");
    g.fillStyle = "rgba(8,12,36,0.88)"; g.strokeStyle = bloqueada ? "#6b7394" : color; g.lineWidth = 8;
    g.beginPath(); g.roundRect ? g.roundRect(6, 6, 500, 168, 26) : g.rect(6, 6, 500, 168); g.fill(); g.stroke();
    g.fillStyle = bloqueada ? "#aab4dd" : "#ffffff"; g.font = "bold 58px Trebuchet MS, sans-serif"; g.textAlign = "center";
    g.fillText(titulo, 256, 82);
    g.fillStyle = bloqueada ? "#8890b0" : color; g.font = "36px Trebuchet MS, sans-serif";
    g.fillText(subtitulo, 256, 140);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false }));
    s.scale.set(3.2, 1.125, 1);
    return s;
  }

  function crearConsola(color) {
    const g = new THREE.Group();
    const mueble = caja(1.4, 0.9, 0.6, mat(0x262c40, 0.5, 0.5)); mueble.position.y = 0.45; g.add(mueble);
    const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.55), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(0.8) }));
    pantalla.position.set(0, 1.25, 0.05); pantalla.rotation.x = -0.25; g.add(pantalla);
    const soporte = caja(0.1, 0.4, 0.1, mat(0x262c40, 0.5, 0.5)); soporte.position.y = 1.0; g.add(soporte);
    return g;
  }

  function mostrarHangar(cont, mundo, estadoEstacion) {
    if (!disponible()) return false;
    nuevaEscena(48);
    modoActual = "hangar";
    controles.activo = false;
    escena.add(new THREE.HemisphereLight(0x9cc3ff, 0x1a1f33, 0.55));
    escena.add(crearEstrellas(700));

    // Piso, rejilla y paredes bajas
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), mat(0x1a2142, 0.6, 0.45));
    piso.rotation.x = -Math.PI / 2; escena.add(piso);
    const rejilla = new THREE.GridHelper(22, 22, 0x4cc9f0, 0x2a3566); rejilla.position.y = 0.01;
    rejilla.material.transparent = true; rejilla.material.opacity = 0.35; escena.add(rejilla);
    const matPared = mat(0x2b3352, 0.5, 0.5);
    [[0, 9, 22, 0.3], [-11, 0, 0.3, 18], [11, 0, 0.3, 18]].forEach(function (p) {
      const pared = caja(p[2], 1.4, p[3], matPared); pared.position.set(p[0], 0.7, p[1]); escena.add(pared);
    });
    // Ventanal del fondo con la Tierra afuera
    for (let x = -10; x <= 10; x += 4) { const poste = caja(0.25, 6, 0.25, matPared); poste.position.set(x, 3, -8.6); escena.add(poste); }
    const viga = caja(22, 0.3, 0.3, matPared); viga.position.set(0, 6, -8.6); escena.add(viga);
    const tierra = crearCuerpo("tierra", 9); tierra.position.set(4, -4, -32); escena.add(tierra);

    // Mesa central con holograma de la Tierra
    const mesa = cilindro(1.1, 1.2, 0.8, mat(0x262c40, 0.6, 0.4), 32); mesa.position.set(0, 0.4, -0.6); escena.add(mesa);
    const holo = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), new THREE.MeshBasicMaterial({ color: 0x4cc9f0, wireframe: true, transparent: true, opacity: 0.55 }));
    holo.position.set(0, 1.55, -0.6); escena.add(holo);

    // Estaciones
    const anillos = [];
    mundo.estaciones.forEach(function (e) {
      const info = estadoEstacion(e);
      const g = new THREE.Group(); g.position.set(e.x, 0, e.z); escena.add(g);
      const base = cilindro(1.35, 1.45, 0.12, mat(0x222a48, 0.6, 0.4), 32); base.position.y = 0.06; g.add(base);
      const anillo = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.62, 40), new THREE.MeshBasicMaterial({ color: info.bloqueada ? 0x6b7394 : e.color, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
      anillo.rotation.x = -Math.PI / 2; anillo.position.y = 0.14; g.add(anillo); anillos.push({ anillo: anillo, e: e });
      const luz = new THREE.PointLight(info.bloqueada ? 0x6b7394 : e.color, 0.9, 6); luz.position.set(0, 2.6, 0); g.add(luz);
      const consola = crearConsola(info.bloqueada ? "#3a3f55" : e.color);
      consola.position.set(e.x < 0 ? 0.9 : -0.9, 0, e.z < 0 ? 0.6 : -0.6); consola.rotation.y = e.x < 0 ? -0.6 : 0.6; g.add(consola);
      // Objeto de cada estación
      let objeto;
      if (e.id === "comunicaciones") {
        objeto = new THREE.Group();
        const perfil = []; for (let i = 0; i <= 10; i++) { const x = i / 10 * 0.8; perfil.push(new THREE.Vector2(x, x * x * 0.7)); }
        const plato = new THREE.Mesh(new THREE.LatheGeometry(perfil, 28), mat(0xf2f2f2, 0.3, 0.4, { side: THREE.DoubleSide }));
        plato.rotation.x = -0.9; plato.position.y = 1.9; objeto.add(plato);
        const mastil = cilindro(0.08, 0.12, 1.6, mat(0x9aa0aa, 0.6, 0.4)); mastil.position.y = 0.95; objeto.add(mastil);
      } else if (e.id === "diseno") {
        objeto = crearNave(mundo.recursos || null); objeto.scale.setScalar(0.45); objeto.position.y = 1.5;
      } else if (e.id === "instrumentos") {
        objeto = new THREE.Group();
        const mesaI = caja(1.4, 0.7, 0.8, mat(0x3a4260, 0.5, 0.5)); mesaI.position.y = 0.35; objeto.add(mesaI);
        ["optica", "radar", "termica"].forEach(function (id, k) { const o = crearInstrumento(id); o.position.set(-0.45 + k * 0.45, 0.85, 0); o.scale.setScalar(1.3); objeto.add(o); });
      } else {
        objeto = crearCohete(); objeto.scale.setScalar(0.42); objeto.position.y = 0.12;
      }
      g.add(objeto);
      g.userData.objeto = objeto;
      const cartel = crearCartel(e.nombre, info.hecha ? "Lista" : (info.bloqueada ? "Bloqueada" : "Fase " + e.fase), e.color, info.bloqueada);
      cartel.position.set(0, e.id === "lanzamiento" ? 3.5 : 3.2, 0); g.add(cartel);
      e.grupo3D = g;
    });

    const astronauta = crearAstronauta();
    escena.add(astronauta);
    const objetivo = new THREE.Vector3();
    camara.position.set(0, 9, 12);

    actualizar = function (dt, t) {
      mundo.actualizar(dt);
      const j = mundo.jugador;
      astronauta.position.set(j.x, 0, j.z);
      astronauta.rotation.y = j.ang;
      // Caminata: piernas y brazos se mueven al revés
      const vaiven = Math.sin(j.paso * 3) * 0.65 * j.andando;
      astronauta.userData.piernaI.rotation.x = vaiven; astronauta.userData.piernaD.rotation.x = -vaiven;
      astronauta.userData.brazoI.rotation.x = -vaiven * 0.8; astronauta.userData.brazoD.rotation.x = vaiven * 0.8;
      astronauta.position.y = Math.abs(Math.sin(j.paso * 3)) * 0.05 * j.andando;
      // Estaciones: la cercana brilla y su objeto gira
      anillos.forEach(function (a) {
        const cerca = mundo.cerca === a.e;
        a.anillo.material.opacity = cerca ? 0.75 + Math.sin(t * 6) * 0.25 : 0.45;
        a.anillo.scale.setScalar(cerca ? 1.06 : 1);
        if (a.e.grupo3D.userData.objeto && a.e.id === "diseno") a.e.grupo3D.userData.objeto.rotation.y += dt * 0.5;
      });
      holo.rotation.y += dt * 0.6;
      tierra.children[0].rotation.y += dt * 0.02;
      // Cámara que sigue al astronauta desde atrás y arriba
      objetivo.set(j.x * 0.75, 1.2, j.z * 0.75 - 0.5);
      camara.position.lerp(new THREE.Vector3(j.x * 0.75, 8.5, j.z * 0.75 + 10.5), Math.min(1, dt * 3));
      camara.lookAt(objetivo);
    };
    montar(cont);
    return true;
  }

  /* =================================================================
     ESCENA 6: "Varado en Marte" — el cráter Jezero, la base y el astronauta
     "mundo" viene de supervivencia.js (jugador, lugares, rocas, relieve, hora)
     ================================================================= */
  function mostrarMarte(cont, mundo) {
    if (!disponible()) return false;
    const sol = nuevaEscena(50);
    modoActual = "marte";
    controles.activo = false;
    const D = DATOS.supervivencia;
    const cielo = new THREE.Color(), colorDia = new THREE.Color(0xc99c74), colorAtardecer = new THREE.Color(0x6f8db8), colorNoche = new THREE.Color(0x07070f);
    escena.background = cielo;
    escena.fog = new THREE.Fog(0xc99c74, 35, 120);
    const hemi = new THREE.HemisphereLight(0xffd9b0, 0x5a2a18, 0.5); escena.add(hemi);
    const estrellas = crearEstrellas(900); estrellas.material.fog = false; estrellas.material.transparent = true; escena.add(estrellas);
    // Fobos y Deimos (las dos lunas)
    const fobos = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 8), new THREE.MeshBasicMaterial({ color: 0x9a8f86, fog: false, transparent: true }));
    const deimos = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), new THREE.MeshBasicMaterial({ color: 0xb3a99f, fog: false, transparent: true }));
    escena.add(fobos); escena.add(deimos);
    // Disco del Sol (se ve más pequeño que desde la Tierra)
    const discoSol = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff4dc, fog: false }));
    escena.add(discoSol);

    // --- Terreno con relieve y colores de óxido ---
    const T = 140, seg = calidadBaja ? 70 : 140;
    const geo = new THREE.PlaneGeometry(T, T, seg, seg); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, colores = new Float32Array(pos.count * 3);
    const tonos = [new THREE.Color(0xb5562d), new THREE.Color(0x8f3f22), new THREE.Color(0xc87a4a), new THREE.Color(0x6e2f1a)];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, mundo.altura(x, z));
      const n = (Math.sin(x * 0.9) * Math.cos(z * 1.1) + Math.sin(x * 0.23 + z * 0.31) + 2) / 4;
      const c = tonos[Math.floor(n * 3.99)].clone().lerp(tonos[(Math.floor(n * 3.99) + 1) % 4], (n * 4) % 1 * 0.5);
      colores.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colores, 3));
    geo.computeVertexNormals();
    escena.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })));

    // --- Rocas ---
    const matRoca = [mat(0x5e2a18, 0, 0.95), mat(0x7a3a22, 0, 0.9), mat(0x4a2216, 0, 0.95)];
    mundo.rocas.forEach(function (r, k) {
      const roca = new THREE.Mesh(new THREE.DodecahedronGeometry(r.t, 0), matRoca[k % 3]);
      roca.position.set(r.x, mundo.altura(r.x, r.z) + r.t * 0.25, r.z);
      roca.rotation.set(r.giro, r.giro * 1.7, r.giro * 0.6); roca.scale.y = 0.6;
      escena.add(roca);
    });

    // --- Lugares ---
    const blanco = mat(0xf0efe9, 0.15, 0.6), gris = mat(0x8d939c, 0.5, 0.5), oscuro = mat(0x2a2d33, 0.3, 0.6);
    const objetos = {};
    mundo.lugares.forEach(function (l) {
      const g = new THREE.Group(); g.position.set(l.x, 0, l.z); escena.add(g); objetos[l.id] = g;
      if (l.id === "base") {
        const cuerpo = cilindro(3.2, 3.2, 2.6, blanco, 40); cuerpo.position.y = 1.3; g.add(cuerpo);
        const cupula = new THREE.Mesh(new THREE.SphereGeometry(3.2, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), blanco); cupula.position.y = 2.6; cupula.scale.y = 0.45; g.add(cupula);
        const esclusa = caja(1.6, 2.1, 2, blanco); esclusa.position.set(0, 1.05, 3.6); g.add(esclusa);
        const puerta = caja(0.9, 1.6, 0.05, oscuro); puerta.position.set(0, 0.85, 4.61); g.add(puerta);
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * Math.PI * 2 + 0.5, v = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ color: 0xffd98a }));
          v.position.set(Math.sin(a) * 3.22, 1.7, Math.cos(a) * 3.22); v.rotation.y = a; g.add(v);
        }
        const franja = cilindro(3.22, 3.22, 0.18, mat(0xff7b00, 0.1, 0.6), 40); franja.position.y = 0.4; g.add(franja);
      } else if (l.id === "paneles") {
        g.userData.paneles = [];
        for (let fx = -1; fx <= 1; fx++) for (let fz = -1; fz <= 1; fz += 2) {
          const p = caja(1.9, 0.06, 1.2, mat(0x1d3d8f, 0.6, 0.35)); p.position.set(fx * 2.1, 1.1, fz * 0.9); p.rotation.x = -0.35 * fz; g.add(p); g.userData.paneles.push(p);
          const poste = cilindro(0.05, 0.05, 1.1, gris, 8); poste.position.set(fx * 2.1, 0.55, fz * 0.9); g.add(poste);
        }
      } else if (l.id === "oxigeno") {
        const maquina = caja(1.6, 1.1, 1.2, mat(0xd9d9d4, 0.4, 0.5)); maquina.position.y = 0.55; g.add(maquina);
        const tubo = cilindro(0.12, 0.12, 1.6, gris, 10); tubo.position.set(0.5, 1.4, 0); g.add(tubo);
        const tanque = cilindro(0.35, 0.35, 1.2, mat(0x3a6ea5, 0.4, 0.4), 16); tanque.position.set(-1.1, 0.6, 0); g.add(tanque);
        const luz = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0x3ddc84 })); luz.position.set(0, 1.18, 0.62); g.add(luz);
        g.userData.luz = luz;
      } else if (l.id === "invernadero") {
        const tunel = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5, 24, 1, true, 0, Math.PI), mat(0xcfe8ff, 0.1, 0.15, { transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
        tunel.rotation.z = Math.PI / 2; tunel.rotation.y = Math.PI / 2; tunel.position.y = 0; g.add(tunel);
        const suelo = caja(4.2, 0.2, 4.6, mat(0x4a2a1a, 0, 0.95)); suelo.position.y = 0.1; g.add(suelo);
        g.userData.plantas = [];
        for (let px = -1; px <= 1; px++) for (let pz = -2; pz <= 2; pz++) {
          const planta = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat(0x4caf50, 0, 0.8)); planta.position.set(px * 1.1, 0.35, pz * 0.85); g.add(planta); g.userData.plantas.push(planta);
        }
        g.userData.luzInv = new THREE.PointLight(0xff66cc, 0.8, 6); g.userData.luzInv.position.y = 1.6; g.add(g.userData.luzInv);
      } else if (l.id === "antena") {
        const perfil = []; for (let i = 0; i <= 10; i++) { const x = i / 10 * 1.1; perfil.push(new THREE.Vector2(x, x * x * 0.6)); }
        const plato = new THREE.Mesh(new THREE.LatheGeometry(perfil, 28), mat(0xf2f2f2, 0.3, 0.4, { side: THREE.DoubleSide }));
        plato.rotation.x = -0.8; plato.position.y = 2.6; g.add(plato);
        const mastil = cilindro(0.1, 0.16, 2.4, gris, 10); mastil.position.y = 1.2; g.add(mastil);
        g.userData.plato = plato;
      } else if (l.id === "hielo") {
        for (let k = 0; k < 7; k++) {
          const a = k * 0.9, r = 0.6 + (k % 3) * 0.6;
          const bloque = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + (k % 2) * 0.25, 0), mat(0xdff6ff, 0.1, 0.25, { emissive: 0x10303a }));
          bloque.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r); bloque.scale.y = 0.5; g.add(bloque);
        }
        const hoyo = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), mat(0x5a2a18, 0, 1)); hoyo.rotation.x = -Math.PI / 2; hoyo.position.y = 0.03; g.add(hoyo);
      } else if (l.id === "rescate") {
        const pista = new THREE.Mesh(new THREE.CircleGeometry(2.4, 32), mat(0x55575e, 0.3, 0.8)); pista.rotation.x = -Math.PI / 2; pista.position.y = 0.04; g.add(pista);
        const anillo = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.7, 40), new THREE.MeshBasicMaterial({ color: 0xffb703, side: THREE.DoubleSide })); anillo.rotation.x = -Math.PI / 2; anillo.position.y = 0.05; g.add(anillo);
        g.userData.balizas = [];
        for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3b3b })); b.position.set(Math.cos(k * Math.PI / 2) * 2.9, 0.25, Math.sin(k * Math.PI / 2) * 2.9); g.add(b); g.userData.balizas.push(b); }
      }
      const cartel = crearCartel(l.nombre, "", l.color, false);
      cartel.scale.set(3.6, 1.27, 1);
      cartel.position.set(0, l.id === "base" ? 5.2 : (l.id === "antena" ? 4.4 : 3.4), 0); g.add(cartel);
    });

    // --- Nave de rescate: baja a la zona de aterrizaje y despega contigo ---
    const lugarRescate = mundo.lugares.find(function (l) { return l.id === "rescate"; });
    const nave = crearCohete(); nave.scale.setScalar(0.55);
    const llama = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.85, fog: false }));
    llama.rotation.x = Math.PI; llama.position.y = -1.3; nave.add(llama);
    const luzNave = new THREE.PointLight(0xffa040, 0, 25); luzNave.position.y = -0.5; nave.add(luzNave);
    nave.position.set(lugarRescate.x, 0, lugarRescate.z); nave.visible = false; escena.add(nave);
    const colorTormenta = new THREE.Color(0x8a5a3a);

    // --- Astronauta (con tu nombre en el parche) y su linterna ---
    const astronauta = crearAstronauta(mundo.nombre || "TÚ");
    escena.add(astronauta);
    const linterna = new THREE.PointLight(0xfff2d0, 0, 14); escena.add(linterna);
    const objetivo = new THREE.Vector3(), deseada = new THREE.Vector3();
    camara.position.set(0, 9, 16);

    actualizar = function (dt, t) {
      mundo.actualizar(dt);
      const s = mundo.estado(); if (!s) return;
      const j = mundo.jugador, y = mundo.altura(j.x, j.z);
      astronauta.position.set(j.x, y + Math.abs(Math.sin(j.paso * 3)) * 0.05 * j.andando, j.z);
      astronauta.rotation.y = j.ang;
      const vaiven = Math.sin(j.paso * 3) * 0.65 * j.andando;
      astronauta.userData.piernaI.rotation.x = vaiven; astronauta.userData.piernaD.rotation.x = -vaiven;
      astronauta.userData.brazoI.rotation.x = -vaiven * 0.8; astronauta.userData.brazoD.rotation.x = vaiven * 0.8;

      // Sol, cielo y noche según la hora
      const h = s.hora, luz = mundo.luzSolar(h);
      const angSol = (h - D.amanecer) / (D.atardecer - D.amanecer) * Math.PI;     // 0 al amanecer, π al atardecer
      sol.position.set(Math.cos(angSol) * 60 + j.x, Math.max(-20, Math.sin(angSol) * 50), -20 + j.z);
      sol.target.position.set(j.x, 0, j.z); sol.target.updateMatrixWorld();
      sol.intensity = 0.15 + luz * 1.15;
      sol.color.setHSL(0.08, 0.5, 0.55 + luz * 0.4);
      hemi.intensity = 0.12 + luz * 0.45;
      const cercaHorizonte = luz > 0 && luz < 0.3 ? 1 - luz / 0.3 : 0;
      if (luz > 0) cielo.copy(colorDia).lerp(colorAtardecer, cercaHorizonte * 0.85).lerp(colorNoche, Math.max(0, 0.35 - luz) * 1.2);
      else cielo.copy(colorNoche);
      // Tormenta de polvo: cielo café y neblina espesa
      const tormenta = mundo.hayTormenta();
      if (tormenta) { cielo.lerp(colorTormenta, 0.75).multiplyScalar(0.4 + luz * 0.6); sol.intensity *= 0.35; }
      escena.fog.near += ((tormenta ? 6 : 35) - escena.fog.near) * Math.min(1, dt * 0.8);
      escena.fog.far += ((tormenta ? 38 : 120) - escena.fog.far) * Math.min(1, dt * 0.8);
      escena.fog.color.copy(cielo);
      // Nave de rescate
      const n = mundo.nave();
      nave.visible = n.fase !== "ausente";
      llama.visible = n.fase === "bajando" || n.fase === "despegando";
      llama.scale.y = 0.8 + Math.random() * 0.4;
      luzNave.intensity = llama.visible ? 2.5 : 0;
      if (n.fase === "bajando") nave.position.y = (1 - n.progreso) * 70;
      else if (n.fase === "en tierra") nave.position.y = 0;
      else if (n.fase === "despegando") { nave.position.y = n.t * n.t * 4; astronauta.visible = n.t < 0.3; }
      if (n.fase !== "despegando") astronauta.visible = true;
      estrellas.material.opacity = Math.max(0, 1 - luz * 4);
      discoSol.position.set(Math.cos(angSol) * 300 + j.x, Math.sin(angSol) * 250, -100 + j.z);
      discoSol.visible = luz > 0;
      const angF = t * 0.05;
      fobos.position.set(Math.cos(angF) * 260 + j.x, 120 + Math.sin(angF) * 40, -200 + j.z); fobos.material.opacity = estrellas.material.opacity;
      deimos.position.set(-180 + j.x, 160, -260 + j.z); deimos.material.opacity = estrellas.material.opacity;
      // Linterna del casco de noche
      linterna.intensity = luz > 0.15 ? 0 : 1.2;
      linterna.position.set(j.x + Math.sin(j.ang) * 1.5, y + 2.4, j.z + Math.cos(j.ang) * 1.5);

      // Estado de cada lugar
      const og = objetos.oxigeno; if (og) og.userData.luz.material.color.set(s.oxigenoOn && s.rec.energia > 0.01 ? 0x3ddc84 : 0xff3b3b);
      const pg = objetos.paneles; if (pg) pg.userData.paneles.forEach(function (p) { p.material.color.setRGB(0.11 + s.rec.polvo * 0.55, 0.24 + s.rec.polvo * 0.1, 0.56 - s.rec.polvo * 0.45); });
      const ig = objetos.invernadero;
      if (ig) {
        const crec = s.cultivo.sembrado ? 0.15 + s.cultivo.progreso * 0.95 : 0.001;
        ig.userData.plantas.forEach(function (p) { p.scale.setScalar(crec); });
        ig.userData.luzInv.intensity = s.invernaderoOn && s.rec.energia > 0.01 ? 0.9 : 0;
      }
      if (objetos.antena) objetos.antena.userData.plato.rotation.z = Math.sin(t * 0.2) * 0.3;
      if (objetos.rescate) objetos.rescate.userData.balizas.forEach(function (b, k) { b.visible = s.sol >= s.rescate ? Math.sin(t * 6 + k) > 0 : k === 0; });

      // Cámara que sigue al astronauta desde atrás y arriba
      deseada.set(j.x, y + 7.5, j.z + 10.5);
      camara.position.lerp(deseada, Math.min(1, dt * 3));
      objetivo.set(j.x, y + 1.2, j.z - 1);
      camara.lookAt(objetivo);
    };
    montar(cont);
    return true;
  }

  function configurar(op) {
    calidadBaja = !!op.calidadBaja;
    if (renderer) renderer.setPixelRatio(calidadBaja ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  }

  return {
    disponible: disponible, configurar: configurar, detener: detener,
    mostrarInicio: mostrarInicio, mostrarNave: mostrarNave, mostrarSimulacion: mostrarSimulacion, cinematica: cinematica,
    mostrarHangar: mostrarHangar, mostrarMarte: mostrarMarte, retratoPaz: retratoPaz
  };
})();
