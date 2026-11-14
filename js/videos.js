/* =====================================================================
   videos.js — Videos reales en los momentos clave
   ---------------------------------------------------------------------
   Muestra videos de dominio público de la NASA (carpeta assets/videos/)
   en el despegue, la separación de etapas, la llegada a órbita y el final.
   Solo se reproduce un TRAMO de cada video (inicio → fin, en segundos).
   - Botón "Saltar" (pasa al siguiente) y "Saltar todo".
   - Si un video no existe o no carga, se muestra una escena 3D
     cinematográfica (vista3d.js). Si tampoco hay 3D, una foto animada.
   Para cambiar un video: reemplaza el archivo y ajusta inicio/fin aquí.
   ===================================================================== */

const Videos = (function () {

  const CATALOGO = {
    despegue: {
      archivo: "assets/videos/despegue.mp4", inicio: 45, fin: 65,
      titulo: "¡Despegue!", credito: "Video: NASA · Lanzamiento de Artemis I (2022)",
      escena: "despegue", foto: "assets/imagenes/cohete-falcon9.jpg"
    },
    separacion: {
      archivo: "assets/videos/separacion.mp4", inicio: 4, fin: 20,
      titulo: "Separación de etapas", credito: "Video: NASA · Cámara en un propulsor de Artemis I al separarse",
      escena: null, foto: "assets/imagenes/cohete-falconheavy.jpg"     // la escena de despegue ya incluye la separación
    },
    orbita: {
      archivo: "assets/videos/orbita.mp4", inicio: 74, fin: 89,
      titulo: "¡En órbita!", credito: "Video: NASA Goddard · La Tierra vista por satélites",
      escena: "orbita", foto: "assets/imagenes/orbita-iss.jpg"
    },
    exito: {
      archivo: "assets/videos/exito.mp4", inicio: 29, fin: 41,
      titulo: "¡Misión exitosa!", credito: "Video: NASA/JPL-Caltech · Equipo de Perseverance celebrando",
      escena: "exito", foto: "assets/imagenes/escenario-marte.jpg"
    },
    falla: {
      archivo: null,                     // sin video: siempre se usa la escena 3D
      titulo: "Problemas en la misión", credito: "Escena creada para SPACE SIMULATOR",
      escena: "falla", foto: "assets/imagenes/evento-basura.jpg"
    }
  };

  const ic = Iconos.svg;
  let capa = null;               // el elemento de pantalla completa
  let cola = [], alFinal = null, rDiseno = null, actual = null, temporizador = null;
  let saltoEscena = false;       // si el despegue fue escena 3D, se omite la separación (ya está incluida)

  function crearCapa() {
    if (capa) return;
    capa = document.createElement("div");
    capa.className = "cine oculto";
    capa.innerHTML =
      '<div class="cine-marco">' +
        '<video class="cine-video" playsinline preload="auto"></video>' +
        '<div class="cine-3d"></div>' +
        '<div class="cine-foto"></div>' +
        '<div class="cine-titulo"></div>' +
        '<div class="cine-credito"></div>' +
        '<div class="cine-botones">' +
          '<button class="btn btn-secundario cine-saltar-todo">Saltar todo</button>' +
          '<button class="btn btn-principal cine-saltar">Saltar ' + ic("flecha") + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(capa);
    capa.querySelector(".cine-saltar").addEventListener("click", siguiente);
    capa.querySelector(".cine-saltar-todo").addEventListener("click", terminarTodo);
    document.addEventListener("keydown", function (e) {
      if (capa.classList.contains("oculto")) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); terminarTodo(); }
    }, true);
    const v = capa.querySelector("video");
    v.addEventListener("timeupdate", function () {
      if (actual && actual.fin && v.currentTime >= actual.fin) siguiente();
    });
    v.addEventListener("ended", siguiente);
  }

  // Reproduce una lista de momentos: ["despegue", "separacion", "orbita"]
  function secuencia(tipos, r, alTerminar) {
    crearCapa();
    cola = tipos.slice(); alFinal = alTerminar; rDiseno = r; saltoEscena = false;
    Sonido.pausarMusica();
    capa.classList.remove("oculto");
    siguiente();
  }

  function limpiarMomento() {
    clearTimeout(temporizador);
    const v = capa.querySelector("video");
    v.pause(); v.removeAttribute("src"); v.load();
    v.style.display = "none";
    capa.querySelector(".cine-3d").innerHTML = "";
    capa.querySelector(".cine-foto").innerHTML = "";
    Vista3D.detener();
  }

  function siguiente() {
    if (!capa) return;
    limpiarMomento();
    let tipo = cola.shift();
    if (tipo === "separacion" && saltoEscena) tipo = cola.shift();
    if (!tipo) { terminarTodo(); return; }
    actual = CATALOGO[tipo];
    capa.querySelector(".cine-titulo").textContent = actual.titulo;
    capa.querySelector(".cine-credito").textContent = actual.credito;
    capa.querySelector(".cine-saltar-todo").style.display = cola.length ? "" : "none";
    if (tipo === "separacion") Sonido.efecto("separacion");
    if (actual.archivo) reproducirVideo(actual); else respaldo(actual, tipo);
  }

  function reproducirVideo(info) {
    const v = capa.querySelector("video");
    let arranco = false;
    v.style.display = "block";
    v.volume = Math.min(1, Sonido.volumenEfectos());
    v.muted = v.volume === 0;
    v.src = info.archivo + "#t=" + info.inicio + "," + info.fin;
    const fallar = function () { if (!arranco && actual === info) { v.style.display = "none"; respaldo(info); } };
    v.onerror = fallar;
    v.onplaying = function () { arranco = true; };
    const p = v.play();
    if (p && p.catch) p.catch(function () { v.muted = true; v.play().catch(fallar); });
    temporizador = setTimeout(fallar, 5000);       // si en 5 s no empezó, usar el respaldo
  }

  // Respaldo: escena 3D cinematográfica, o una foto animada si no hay 3D
  function respaldo(info, tipo) {
    if (info.escena && Vista3D.disponible()) {
      if (info.escena === "despegue") { saltoEscena = true; Sonido.efecto("despegue"); }
      Vista3D.cinematica(capa.querySelector(".cine-3d"), info.escena, siguiente, rDiseno);
      return;
    }
    const foto = capa.querySelector(".cine-foto");
    foto.innerHTML = '<img src="' + info.foto + '" alt="">';
    if (tipo === "despegue" || info === CATALOGO.despegue) Sonido.efecto("despegue");
    if (info === CATALOGO.falla) Sonido.efecto("falla");
    temporizador = setTimeout(siguiente, 4000);
  }

  function terminarTodo() {
    if (!capa || capa.classList.contains("oculto")) return;
    cola = [];
    limpiarMomento();
    actual = null;
    capa.classList.add("oculto");
    Sonido.reanudarMusica();
    const f = alFinal; alFinal = null;
    if (f) f();
  }

  return { secuencia: secuencia, activo: function () { return !!capa && !capa.classList.contains("oculto"); } };
})();
