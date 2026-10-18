// Contenido privado: vive en Firestore (colección "contenido_privado"),
// NO en los archivos del sitio. Las reglas del servidor solo lo entregan
// a usuarios aprobados, así que no se puede ver desde el código fuente.
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase.js";

export async function leerContenidoPrivado(id) {
    const snap = await getDoc(doc(db, "contenido_privado", id));
    return snap.exists() ? snap.data() : null;
}
