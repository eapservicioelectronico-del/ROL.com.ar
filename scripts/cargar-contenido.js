// Carga (o actualiza) datos/contenido_privado.json en Firestore.
// Uso:  node scripts/cargar-contenido.js
// Requiere: npm install firebase-admin  y la variable GOOGLE_APPLICATION_CREDENTIALS
//           apuntando a tu clave de servicio (NUNCA la subas al hosting ni a Git).
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const datos = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "datos", "contenido_privado.json"), "utf8")
);

(async () => {
    for (const [id, contenido] of Object.entries(datos)) {
        await db.collection("contenido_privado").doc(id).set(contenido);
        console.log("Cargado:", id);
    }
    process.exit(0);
})();
