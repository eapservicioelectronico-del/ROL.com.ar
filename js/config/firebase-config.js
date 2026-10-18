// ============================================================================
// CONFIGURACIÓN DE FIREBASE
// Pegá acá los datos de tu proyecto:
//   Consola Firebase > Configuración del proyecto > Tus apps > App web > "Config"
//
// Esta config NO es secreta (Firebase está diseñado así). La seguridad real
// la dan las reglas de firestore.rules, que se ejecutan en los servidores de
// Google y nadie puede saltearlas desde el navegador.
// ============================================================================
export const firebaseConfig = {
    apiKey: "REEMPLAZAR",
    authDomain: "REEMPLAZAR.firebaseapp.com",
    projectId: "REEMPLAZAR",
    storageBucket: "REEMPLAZAR.appspot.com",
    messagingSenderId: "REEMPLAZAR",
    appId: "REEMPLAZAR"
};
