# 🌐 Guía Rápida: Cómo Publicar el Dashboard en GitHub Pages (2 Minutos)

El Dashboard Gerencial de **Mr. Parrilla -Xpress-** ya está completamente diseñado con HTML5, CSS Glassmorphism y conexión en tiempo real a tu Google Sheets.

Sigue estos sencillos pasos para publicarlo gratis en internet con **GitHub Pages**:

---

### 1️⃣ Crear un Repositorio en GitHub
1. Entra a [github.com](https://github.com) e inicia sesión con tu cuenta.
2. Haz clic en el botón verde **"New"** para crear un nuevo repositorio.
3. Ponle de nombre: **`sicr-mrparrilla-dashboard`**.
4. Asegúrate de marcarlo como **Public** y haz clic en **"Create repository"**.

---

### 2️⃣ Subir los Archivos del Dashboard
1. En la página del repositorio creado, haz clic en **"uploading an existing file"**.
2. Arrastra los 3 archivos que están en la carpeta `04_Dashboard_Web`:
   - 📄 [`index.html`](file:///c:/Users/chugu/Downloads/CLAUDECODE/SICR_RESTAURANTE/04_Dashboard_Web/index.html)
   - 🎨 [`styles.css`](file:///c:/Users/chugu/Downloads/CLAUDECODE/SICR_RESTAURANTE/04_Dashboard_Web/styles.css)
   - ⚙️ [`app.js`](file:///c:/Users/chugu/Downloads/CLAUDECODE/SICR_RESTAURANTE/04_Dashboard_Web/app.js)
3. Haz clic en **"Commit changes"**.

---

### 3️⃣ Activar GitHub Pages
1. Dentro de tu repositorio en GitHub, ve a la pestaña **Settings** (Configuración ⚙️).
2. En el menú de la izquierda, busca y selecciona **Pages**.
3. En la sección **Build and deployment > Branch**, selecciona:
   - Rama: **`main`**
   - Carpeta: **`/ (root)`**
4. Haz clic en **Save**.

---

### 4️⃣ ¡Listo! Tu Dashboard estará en vivo en:
🌐 **`https://TU_USUARIO.github.io/sicr-mrparrilla-dashboard/`**

> **Tip:** Puedes colocar ese enlace en la variable `URL_DASHBOARD_GITHUB` dentro de tu código de Apps Script para que el botón **`[🌐 Abrir Dashboard Gerencial]`** del bot de Telegram lo abra directamente con un toque.
