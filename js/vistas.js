// Construcción de vistas. Todo el texto dinámico se inserta con textContent
// (nunca innerHTML) para evitar inyección de código (XSS).
import { crearPerfil, iniciarConGoogle, estado } from "./auth.js";
import { listarPorEstado, cambiarEstado } from "./admin.js";

// ---------- utilidades ----------
function el(tag, props = {}, ...hijos) {
    const nodo = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        if (k === "class") nodo.className = v;
        else if (k === "text") nodo.textContent = v;
        else if (k.startsWith("on")) nodo.addEventListener(k.slice(2), v);
        else nodo.setAttribute(k, v);
    }
    hijos.flat().forEach(h => h && nodo.append(h));
    return nodo;
}

const esUrlSegura = (u) => typeof u === "string" && /^https:\/\//i.test(u);

function campo(etiqueta, id, tipo = "text", extra = {}) {
    return el("div", { class: "form-group" },
        el("label", { for: id, text: etiqueta }),
        el("input", { id, type: tipo, required: "", ...extra })
    );
}

// ---------- contenido público (archivos en /contenido) ----------
export async function vistaPublica(nombre, destino) {
    const resp = await fetch(`contenido/${nombre}.html`);
    destino.innerHTML = resp.ok
        ? await resp.text()   // son archivos del propio sitio, escritos por vos
        : "<h1>Error</h1><p>Sección no encontrada.</p>";
}

// ---------- login con Google ----------
export function vistaLogin(destino) {
    const error = el("div", { class: "aviso-error", role: "alert" });
    const boton = el("button", {
        class: "btn-google", type: "button",
        onclick: async () => {
            error.textContent = "";
            try { await iniciarConGoogle(); }
            catch (e) {
                if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
                    error.textContent = "No se pudo iniciar sesión. Probá de nuevo.";
                }
            }
        }
    }, "Continuar con Google");

    destino.replaceChildren(el("div", { class: "auth-container" },
        el("h1", { text: "Iniciar sesión" }),
        el("p", { text: "Para acceder a esta sección ingresá con tu cuenta de Google. No guardamos contraseñas." }),
        boton, error,
        el("p", { class: "nota-chica", text: "Si es tu primera vez, te vamos a pedir unos datos y un administrador aprobará tu cuenta." })
    ));
}

// ---------- completar registro ----------
export function vistaRegistro(destino, alTerminar) {
    const error = el("div", { class: "aviso-error", role: "alert" });
    const hoy = new Date().toISOString().slice(0, 10);

    const select = el("select", { id: "reg-accesibilidad" },
        el("option", { value: "ninguna", text: "No requiero asistencia" }),
        el("option", { value: "visual", text: "Discapacidad visual (activar alto contraste)" }),
        el("option", { value: "auditiva", text: "Discapacidad auditiva (asistencia de texto)" })
    );

    const form = el("form", {
        onsubmit: async (e) => {
            e.preventDefault();
            error.textContent = "";
            const btn = form.querySelector("button");
            btn.disabled = true;
            try {
                await crearPerfil({
                    nombre: form.querySelector("#reg-nombre").value.trim(),
                    apellido: form.querySelector("#reg-apellido").value.trim(),
                    fechaNacimiento: form.querySelector("#reg-fecha").value,
                    accesibilidad: select.value
                });
                alTerminar();
            } catch {
                error.textContent = "No se pudo guardar el registro. Revisá los datos.";
                btn.disabled = false;
            }
        }
    },
        campo("Nombre", "reg-nombre", "text", { maxlength: "60" }),
        campo("Apellido", "reg-apellido", "text", { maxlength: "60" }),
        campo("Fecha de nacimiento", "reg-fecha", "date", { max: hoy, min: "1900-01-01" }),
        el("div", { class: "form-group" },
            el("label", { for: "reg-accesibilidad", text: "Asistencia de accesibilidad (opcional)" }), select),
        el("button", { class: "btn-submit", type: "submit", text: "Confirmar registro" }),
        error
    );

    destino.replaceChildren(el("div", { class: "auth-container" },
        el("h1", { text: "Completar registro" }),
        el("p", { text: `Sesión iniciada como ${estado.usuario.email}. Completá estos datos para solicitar el acceso.` }),
        form
    ));
}

// ---------- estados de cuenta ----------
export function vistaPendiente(destino) {
    destino.replaceChildren(
        el("h1", { text: "Cuenta pendiente de aprobación" }),
        el("p", { text: "Recibimos tu registro. Un administrador de la comunidad tiene que aprobar tu cuenta antes de que puedas ver esta sección." }),
        el("div", { class: "technical-box naranja", text: "Volvé a entrar más tarde. No hace falta que vuelvas a registrarte." })
    );
}

export function vistaBloqueada(destino) {
    destino.replaceChildren(
        el("h1", { text: "Acceso no habilitado" }),
        el("p", { text: "Tu cuenta no tiene acceso a esta sección. Si creés que es un error, contactá a la coordinación." })
    );
}

// ---------- contenido privado ----------
function lista(items = []) {
    return el("ul", { class: "doc-list" }, items.map(it => {
        const contenido = esUrlSegura(it.url)
            ? el("a", { href: it.url, target: "_blank", rel: "noopener noreferrer", text: it.texto })
            : el("span", { text: it.texto });
        return el("li", { class: "doc-item" }, contenido);
    }));
}

export function vistaDocumento(destino, datos) {
    if (!datos) {
        destino.replaceChildren(el("h1", { text: "Sin contenido" }),
            el("p", { text: "Todavía no se cargó contenido en esta sección." }));
        return;
    }
    const nodos = [el("h1", { text: datos.titulo || "" })];
    if (datos.intro) nodos.push(el("p", { text: datos.intro }));
    if (datos.items) nodos.push(lista(datos.items));
    (datos.secciones || []).forEach(s => {
        nodos.push(el("h2", { text: s.titulo || "" }), lista(s.items));
    });
    destino.replaceChildren(...nodos);
}

// ---------- administración ----------
export async function vistaAdmin(destino) {
    destino.replaceChildren(el("h1", { text: "Administración de usuarios" }),
        el("p", { text: "Cargando..." }));

    const pendientes = await listarPorEstado("pendiente");
    const filas = pendientes.map(u => {
        const fila = el("div", { class: "fila-usuario" },
            el("span", { text: `${u.nombre} ${u.apellido} — ${u.email}` }),
            el("div", { class: "acciones" },
                el("button", {
                    class: "btn-chico btn-aprobar", type: "button", text: "Aprobar",
                    onclick: async () => { await cambiarEstado(u.uid, "aprobado"); fila.remove(); }
                }),
                el("button", {
                    class: "btn-chico btn-bloquear", type: "button", text: "Bloquear",
                    onclick: async () => { await cambiarEstado(u.uid, "bloqueado"); fila.remove(); }
                })
            )
        );
        return fila;
    });

    destino.replaceChildren(
        el("h1", { text: "Administración de usuarios" }),
        el("h2", { text: `Pendientes de aprobación (${pendientes.length})` }),
        ...(filas.length ? filas : [el("p", { text: "No hay solicitudes pendientes." })])
    );
}
