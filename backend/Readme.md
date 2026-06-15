# Proyecto Contexto

Aplicacion web educativa e interactiva para fomentar la cultura del reciclaje en estudiantes de centros educativos publicos de Honduras mediante retos practicos, aprendizaje gamificado y participacion activa de la comunidad escolar.


## Requisitos previos

Antes de ejecutar el proyecto, se debe tener instalado:
- Node.js versión 20 o superior
- npm
- MongoDB
- Studio 3T, opcional para administrar la base de datos
- Visual Studio Code, opcional para editar el código

# Tecnologia Implementada

Del Lado del Servidor 

- Node.js
- Express
- MongoDB Almacenamiento de datos mediante colecciones.
- Mongoose Definición de esquemas y conexión con MongoDB.
- Arquitectura MVC
- Cors comunicacion entre Angular y Express
- dotenv Manejo de configuración sensible.
- Nodemon Reinicio automático del servidor durante desarrollo.

Del Lado del Cliente


## Requisitos previos para correr el Frontend 

Antes de ejecutar el frontend, se debe tener instalado:

- Node.js versión 20 o superior Desarrollo de la interfaz del cliente.
- Studio 3T Studio 3T
- npm
- Angular CLI
- Visual Studio Code Visual Studio Code
- TypeScript
- RxJS
- Angular Router
- Angular Forms
- Tailwind CSS
- Bootstrap Icons
- Chart.js
- Angular SSR

# Estructura Base del Backend

- Conexion a base de datos en [backend/config/dbconexion.js](backend/config/dbconexion.js)
- Modelos por coleccion en [backend/Model](backend/Model)
- Controladores por coleccion en [backend/Controllers](backend/Controllers)
- Rutas por coleccion en [backend/Routes](backend/Routes)
- Registro de rutas y arranque del servidor en [backend/app.js](backend/app.js)
