# Comunidad Rol San Francisco — Portal

## Estructura

| Qué querés cambiar | Dónde |
|---|---|
| Textos públicos (Introducción, Historia, Noticias) | `contenido/*.html` |
| Colores / estilos | `css/base.css` (variables), `css/layout.css`, `css/componentes.css` |
| Alto contraste | `css/accesibilidad.css` |
| Celulares | `css/responsive.css` |
| Pestañas (agregar/quitar) | `js/main.js` → `SECCIONES` |
| Pantallas de login, registro, admin | `js/vistas.js` |
| Login con Google y perfiles | `js/auth.js` |
| Manuales y Aplicaciones (privado) | `datos/contenido_privado.json` + `node scripts/cargar-contenido.js` |
| Reglas de seguridad | `firestore.rules` |
| Cabeceras HTTP / CSP | `firebase.json` |

## Cómo funciona la seguridad

- **Login:** Google (Firebase Auth). No existen contraseñas propias: no hay nada que copiar ni robar de tu sitio.
- **Aprobación manual:** quien se registra queda `pendiente`. Un admin lo aprueba desde la pestaña *Administración*.
- **Contenido privado en el servidor:** Manuales y Aplicaciones están en Firestore, no en el código. Las reglas (`firestore.rules`) solo lo entregan a usuarios aprobados. Ver el código fuente o modificar el JS no sirve de nada.
- **No se puede escalar privilegios:** un usuario no puede cambiarse `estado` ni `rol`; las reglas lo rechazan en el servidor.
- **Sin XSS:** los datos de usuarios y de Firestore se muestran con `textContent`; CSP bloquea scripts ajenos.
- **Correo verificado:** las reglas exigen `email_verified` (las cuentas Google lo tienen).

## Puesta en marcha (una sola vez)

1. Crear proyecto en https://console.firebase.google.com
2. **Authentication → Sign-in method →** habilitar **Google**.
3. **Authentication → Settings → Authorized domains:** dejar solo tu dominio final (y `localhost` mientras probás).
4. **Firestore Database →** crear base (modo producción).
5. **Configuración del proyecto → Tus apps → Web:** copiar la config en `js/config/firebase-config.js`.
6. Instalar CLI y publicar:
   ```
   npm install -g firebase-tools
   firebase login
   firebase init   # elegir el proyecto; NO sobrescribir firebase.json ni firestore.rules
   firebase deploy --only firestore:rules,hosting
   ```
7. **Primer admin:** iniciá sesión en el sitio con tu cuenta y completá el registro. Después, en la consola de Firebase → Firestore → `users` → tu documento, cambiá a mano `estado` = `aprobado` y `rol` = `admin`. (Es la única vez que se hace a mano.)
8. Cargar el contenido privado:
   ```
   npm install firebase-admin
   export GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/clave-de-servicio.json
   node scripts/cargar-contenido.js
   ```
   Para editar luego: cambiás `datos/contenido_privado.json` y volvés a correr el script (o editás directo en la consola).

## Recomendado antes de abrir al público

- **Firebase App Check** (reCAPTCHA Enterprise): evita que scripts ajenos usen tu proyecto.
- **Restringir la API key** en Google Cloud Console → Credenciales → solo tus dominios (referrers HTTP).
- **Presupuesto y alertas** en Google Cloud para evitar costos por abuso.
- Activar **verificación en dos pasos** en tu cuenta de Google de administrador.
- El sitio recolecta fecha de nacimiento y puede haber menores: pedí consentimiento de tutores y evitá guardar más datos de los necesarios (Ley 25.326 de Protección de Datos Personales, Argentina).

## Probar en local

No abras `index.html` con doble clic (los módulos JS no cargan por `file://`). Usá:
```
firebase emulators:start --only hosting
```
o `npx serve .` y agregá `localhost` a los dominios autorizados.

## Límite honesto

Ningún sistema es "imposible de vulnerar". Esta arquitectura delega lo crítico (login, validación, acceso a datos) en servidores de Google y aplica reglas en el servidor, que es lo que corresponde. Lo que quede mal configurado (reglas, admin, dominios) sigue siendo responsabilidad tuya: no cambies `firestore.rules` sin probarlo.
