// Punto de entrada: navegación (SPA), pestañas y estado de sesión.
import {
    estado, observarSesion, cerrarSesion, esAprobado, esAdmin
} from "./auth.js";
import { leerContenidoPrivado } from "./privado.js";
import {
    vistaPublica, vistaLogin, vistaRegistro, vistaPendiente,
    vistaBloqueada, vistaDocumento, vistaAdmin
} from "./vistas.js";

// ---- Definición de pestañas (para agregar una sección, sumala acá) ----
const SECCIONES = [
    { id: "introduccion", titulo: "Introducción", tipo: "publica" },
    { id: "historia",     titulo: "Historia",     tipo: "publica" },
    { id: "noticias",     titulo: "Noticias y Novedades", tipo: "publica" },
    { id: "manuales",     titulo: "Manuales y Documentación", tipo: "privada" },
    { id: "aplicaciones", titulo: "Aplicaciones", tipo: "privada" },
    { id: "admin",        titulo: "Administración", tipo: "admin" }
];

const destino = document.getElementById("content-target");
const contenedorTabs = document.getElementById("nav-tabs");
const btnSesion = document.getElementById("btnSesion");

let seccionActual = "introduccion";

function visibles() {
    return SECCIONES.filter(s => s.tipo !== "admin" || esAdmin());
}

function dibujarTabs() {
    contenedorTabs.replaceChildren(...visibles().map(s => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nav-tab" + (s.tipo === "privada" ? " protegida" : "")
            + (s.tipo === "privada" && esAprobado() ? " desbloqueada" : "")
            + (s.id === seccionActual ? " active" : "");
        b.textContent = s.titulo;
        b.addEventListener("click", () => irA(s.id));
        return b;
    }));
}

function aplicarAccesibilidad() {
    document.body.classList.toggle("alto-contraste", estado.perfil?.accesibilidad === "visual");
}

async function irA(id) {
    seccionActual = id;
    dibujarTabs();
    const seccion = SECCIONES.find(s => s.id === id);

    if (seccion.tipo === "publica") return vistaPublica(id, destino);

    // Desde acá la sección requiere sesión
    if (!estado.usuario) return vistaLogin(destino);
    if (!estado.perfil) return vistaRegistro(destino, () => { aplicarAccesibilidad(); actualizarBoton(); irA(id); });
    if (estado.perfil.estado === "bloqueado") return vistaBloqueada(destino);
    if (!esAprobado()) return vistaPendiente(destino);

    try {
        if (seccion.tipo === "admin") {
            if (!esAdmin()) return vistaBloqueada(destino);
            return await vistaAdmin(destino);
        }
        vistaDocumento(destino, await leerContenidoPrivado(id));
    } catch {
        // El servidor rechazó la lectura (reglas) o hubo un error de red
        vistaBloqueada(destino);
    }
}

function actualizarBoton() {
    btnSesion.textContent = estado.usuario ? "Cerrar sesión" : "Iniciar sesión";
}

btnSesion.addEventListener("click", async () => {
    if (estado.usuario) await cerrarSesion();
    else vistaLogin(destino);
});

// Cada vez que cambia la sesión, se redibuja todo
observarSesion(() => {
    aplicarAccesibilidad();
    actualizarBoton();
    const seccion = SECCIONES.find(s => s.id === seccionActual);
    if (!visibles().includes(seccion)) seccionActual = "introduccion";
    irA(seccionActual);
});
