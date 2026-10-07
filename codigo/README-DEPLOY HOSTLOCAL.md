# 🏋️ LIFTING UP - Sistema de Gestión de Gimnasio y Entrenamiento

Plataforma integral moderna diseñada para la gestión operativa y el seguimiento de entrenamiento en gimnasios. Permite a los atletas registrar asistencia, seguir sus rutinas y métricas físicas, y a los administradores gestionar máquinas, equipamiento, usuarios y estadísticas del establecimiento.

---

## 🚀 Tecnologías Utilizadas

- **Frontend:** [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [React Router 7](https://reactrouter.com/), [Lucide React](https://lucide.dev/), Vanilla CSS con arquitectura responsive (Sidebar persistente en Desktop y Bottom Navigation en Mobile).
- **Backend:** [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/), [MySQL2](https://github.com/sidorares/node-mysql2).
- **Base de Datos:** [MySQL](https://www.mysql.com/) en la nube a través de **Aiven Cloud** con conexión segura SSL.
- **Servicio de Correo Transaccional:** [Brevo (Sendinblue) API V3](https://www.brevo.com/) con el SDK oficial `@getbrevo/brevo` para verificación de cuentas y códigos OTP.
- **Plataforma Móvil:** [Capacitor](https://capacitorjs.com/) para compilación nativa en Android (APK instalable).

---

## 📁 Estructura del Repositorio

```text
LIFTING_UP/
├── codigo/
│   ├── backend/             # Servidor API RESTful con Express y MySQL
│   │   ├── config/          # Conexión al pool de Aiven Cloud (db.js)
│   │   ├── controllers/     # Controladores (usuarios, admins, equipamiento, rutinas, etc.)
│   │   ├── routes/          # Definición de rutas de la API (/api/...)
│   │   ├── services/        # Servicio de correos transaccionales (emailService.js con Brevo)
│   │   ├── scripts/         # Migraciones y scripts SQL de soporte
│   │   ├── .env.example     # Plantilla de variables de entorno requeridas
│   │   └── Server.js        # Punto de entrada del servidor (puerto 5000 por defecto)
│   │
│   └── client/              # Single Page Application (SPA) en React + Vite
│       ├── android/         # Proyecto nativo generado por Capacitor
│       │   └── app/build/outputs/apk/debug/app-debug.apk   # <-- APK compilada
│       ├── src/
│       │   ├── components/  # Layouts (Dashboard, AtletaDashboard, Sidebars, Navbars)
│       │   ├── pages/       # Vistas principales (Login, Register, Home, VerifyEmail)
│       │   ├── views/       # Vistas embebidas (Equipamiento, PerfilAtleta, PerfilAdmin)
│       │   ├── features/    # Servicios de sesión y autenticación
│       │   ├── services/    # Cliente HTTP y llamadas a la API
│       │   └── styles/      # Hojas de estilo modulares y responsive
│       ├── .env.example     # Plantilla de variables de cliente
│       └── vite.config.js
│
├── .gitignore               # Configuración global de exclusiones para Git
└── README.md                # Documentación del proyecto
```

---

## ⚙️ Guía de Ejecución en Entorno Local (Localhost)

Para ejecutar el sistema completo en su computadora apuntando a la base de datos de Aiven, siga los pasos a continuación:

### 1. Clonar el repositorio
```bash
git clone https://github.com/morenaprestint/Grupo8_ProyectoLIFTINGUP_ESTFA_2026.git
cd Grupo8_ProyectoLIFTINGUP_ESTFA_2026
```

---

**Profe, te deje preparado un usuario admin para que puedas ingresar**
Mail: [tixi123@gmail.com]
contra: 1234


### 2. Puesta en marcha del Backend (Servidor API)

1. **Ingresar a la carpeta del backend:**
   ```bash
   cd codigo/backend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el archivo `.env`:**
   Copie el archivo de ejemplo `.env.example` a un archivo `.env`:
  

4. **Iniciar el servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```
   > El servidor iniciará en `http://localhost:5000` y confirmará la conexión exitosa al pool de base de datos MySQL en Aiven Cloud.

---

### 3. Puesta en marcha del Frontend (Cliente React)

1. **Abrir una nueva terminal y navegar a la carpeta del cliente:**
   ```bash
   cd codigo/client
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Variables de entorno (Opcional):**
   El cliente viene preconfigurado para conectarse de forma predeterminada a `http://localhost:5000/api`. Si desea sobreescribirlo explícitamente, puede crear un archivo `.env` en `codigo/client/`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Iniciar el servidor de desarrollo de Vite:**
   ```bash
   npm run dev
   ```
   > La aplicación se abrirá en `http://localhost:5173` (o el puerto mostrado en la terminal).

---




## 📱 Aplicación Móvil (APK para Android)

El proyecto cuenta con integración nativa a través de **Capacitor**, permitiendo distribuir la app en dispositivos Android.

### 📥 Ubicación de la APK de depuración precompilada:
La APK lista para instalar se encuentra disponible en:
```text
codigo/client/android/app/build/outputs/apk/debug/app-debug.apk
```

### Instrucciones de instalación:
1. Conecte su teléfono Android a la computadora o envíe el archivo `app-debug.apk` por correo / Google Drive / Whatsapp.
2. Habilite en su dispositivo la opción **"Instalar aplicaciones de fuentes desconocidas"**.
3. Abra el archivo e instale **LIFTING UP**.

### Compilación y sincronización con Capacitor (Opcional):
Si realiza cambios en el frontend y desea actualizar la aplicación móvil Android:
```bash
cd codigo/client
npm run build
npx cap sync android
npx cap open android
```
Esto abrirá Android Studio para compilar y generar una nueva APK (`Build > Build Bundle(s) / APK(s) > Build APK(s)`).

---

## 🗄️ Base de Datos en Aiven Cloud

La base de datos MySQL se encuentra alojada en la nube mediante Aiven Cloud con cifrado SSL obligatorio (`rejectUnauthorized: false`).
- **Host:** `lifti-pazmax563-4588.i.aivencloud.com`
- **Puerto:** `18946`
- **Base activa:** `defaultdb`
- **Tablas principales:** `usuarios`, `admins`, `equipamiento`, `rutinas`, `ejercicios`, `asistencia`, `historial`.



## 📧 Servicio de Correo Transaccional (Brevo V3)

El envío de códigos de verificación OTP de 6 dígitos se realiza mediante la API V3 de **Brevo (Sendinblue)** a través del SDK oficial `@getbrevo/brevo`.
- **Remitente oficial:** `liftingup.app@gmail.com` ("LIFTING UP").
- **Módulo responsable:** `codigo/backend/services/emailService.js`.
- Los códigos tienen una validez de 15 minutos para garantizar la seguridad del registro.

---

## 👥 Roles de Usuario del Sistema

1. **Atleta:**
   - Visualización de rutinas y ejercicios asignados.
   - Registro de asistencia al gimnasio.
   - Historial de entrenamientos.
   - Perfil de atleta con peso corporal editable y métricas físicas.
2. **Administrador:**
   - Gestión integral de atletas y asistencias.
   - Inventario y mantenimiento de máquinas y equipamiento (`/equipamiento`).
   - Perfil de administrador para gestión de datos de cuenta.

> **Nota a la hora de desplegar:** El proyecto incluye la conexión a la base de datos de Aiven y el servicio de correo Brevo preconfigurados. Para ejecutar localmente, basta con copiar los archivos `.env.example` a `.env` en las carpetas `codigo/backend` y `codigo/client`.