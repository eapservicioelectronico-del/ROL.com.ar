// Autenticación con Google y manejo del perfil del usuario.
// No se guardan contraseñas: Google se encarga de todo el login.
import {
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
    doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { auth, db } from "./firebase.js";

export const estado = {
    usuario: null,   // usuario de Firebase Auth
    perfil: null     // documento users/{uid}; null si todavía no completó el registro
};

export function iniciarConGoogle() {
    const proveedor = new GoogleAuthProvider();
    proveedor.setCustomParameters({ prompt: "select_account" });
    return signInWithPopup(auth, proveedor);
}

export function cerrarSesion() {
    return signOut(auth);
}

export async function cargarPerfil(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
}

export async function crearPerfil({ nombre, apellido, fechaNacimiento, accesibilidad }) {
    const u = auth.currentUser;
    const perfil = {
        nombre, apellido, fechaNacimiento, accesibilidad,
        email: u.email,
        estado: "pendiente",   // un administrador debe aprobarlo
        rol: "miembro",
        creado: serverTimestamp()
    };
    await setDoc(doc(db, "users", u.uid), perfil);
    estado.perfil = await cargarPerfil(u.uid);
}

export async function actualizarAccesibilidad(valor) {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { accesibilidad: valor });
    estado.perfil.accesibilidad = valor;
}

export const esAprobado = () => estado.perfil?.estado === "aprobado";
export const esAdmin = () => esAprobado() && estado.perfil?.rol === "admin";

// Avisa cada vez que cambia la sesión
export function observarSesion(callback) {
    onAuthStateChanged(auth, async (usuario) => {
        estado.usuario = usuario;
        estado.perfil = usuario ? await cargarPerfil(usuario.uid) : null;
        callback();
    });
}
