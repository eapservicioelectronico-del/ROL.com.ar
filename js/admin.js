// Panel de administración: aprobar o bloquear usuarios.
// Las reglas de Firestore verifican en el servidor que quien lo usa sea admin.
import {
    collection, query, where, getDocs, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase.js";

export async function listarPorEstado(estadoBuscado) {
    const q = query(collection(db, "users"), where("estado", "==", estadoBuscado));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export function cambiarEstado(uid, nuevoEstado) {
    return updateDoc(doc(db, "users", uid), { estado: nuevoEstado });
}
