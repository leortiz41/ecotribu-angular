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


## Estructura del proyecto

ecotribu-angular/
│
├── backend/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── app.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── pages/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── guards/
    │   │   └── app.routes.ts
    │   └── assets/
    └── package.json

# Flujo MVC Correcto Por Coleccion

Para cada coleccion se repite este flujo:

1. Cliente envia request HTTP a la ruta.
2. La ruta valida y delega al controlador.
3. El controlador aplica reglas de negocio.
4. El controlador usa el modelo para leer o escribir en MongoDB.
5. El controlador devuelve respuesta estandar JSON.

Respuesta estandar recomendada:

- success: true o false
- message: descripcion corta
- data: objeto o arreglo
- error: detalle solo cuando falle

# Colecciones del Proyecto

1. escuelas
Objetivo: gestionar instituciones educativas.
Flujo principal: crear escuela, listar escuelas, actualizar datos, desactivar escuela.

2. usuarios
Objetivo: gestionar alumnos, profesores y administradores.
Flujo principal: registrar usuario, asignar rol, asociar escuela, consultar perfil, actualizar estado.

3. retos
Objetivo: gestionar retos ecologicos.
Flujo principal: crear reto, publicar reto, listar retos activos, cerrar reto.

4. evidencias
Objetivo: registrar evidencia de cumplimiento de retos.
Flujo principal: alumno envia evidencia, profesor revisa, aprueba o rechaza, se actualizan puntos.

5. cuestionario
Objetivo: gestionar contenido evaluativo.
Flujo principal: crear cuestionario, agregar preguntas, publicar, listar por escuela o grado.

6. resultados_cuestionarios
Objetivo: guardar resultados de intentos.
Flujo principal: alumno responde cuestionario, sistema calcula puntaje, guarda resultado, evita duplicados segun regla.

7. rankings
Objetivo: mostrar posiciones por puntos.
Flujo principal: recalcular ranking cuando cambian puntos de retos o cuestionarios, consultar ranking general y por escuela.

8. insignias
Objetivo: otorgar reconocimientos digitales.
Flujo principal: definir criterios, evaluar logros, asignar insignia, listar insignias por usuario.

# Flujo Entre Colecciones

1. escuelas se crea primero.
2. usuarios se registran y se vinculan a escuelas.
3. profesores o administradores crean retos y cuestionarios.
4. alumnos envian evidencias y responden cuestionarios.
5. resultados y evidencias aprobadas generan puntos.
6. rankings se recalculan con esos puntos.
7. insignias se asignan segun criterios de progreso.

# Orden Recomendado de Implementacion

1. Conexion DB + escuelas + usuarios.
2. Retos + evidencias.
3. Cuestionario + resultados_cuestionarios.
4. Rankings + insignias.
5. Validaciones, manejo de errores y permisos por rol.

# Regla Practica

Si agregas una nueva coleccion, debes crear sus tres capas (modelo, controlador y ruta) y registrarla en [backend/app.js](backend/app.js). Asi mantienes el proyecto consistente y escalable.

## Comandos para la compilacion Backend
- comando:
- npm install - Instalar las dependencias:
- npm run dev - Ejecuta el servidor con nodemon para desarrollo.
- npm start - Ejecuta el servidor con Node.js

## Comandos para la compilacion del Frontend
npm install - instala dependecias
ng serve - Ejecuta el proyecto en modo desarrollola 
La aplicacion generara un URL como ng serve - http://localhost:4200

# Manual Técnico - EcoTribu Escolar

## 1. Introducción

EcoTribu Escolar es una aplicación web educativa e interactiva orientada a fomentar la cultura del reciclaje en estudiantes de centros educativos públicos de Honduras. El sistema promueve la participación ambiental mediante retos ecológicos, evidencias fotográficas, cuestionarios interactivos, rankings escolares e insignias como parte de una estrategia de gamificación educativa.

Este manual técnico describe la estructura del proyecto, las tecnologías utilizadas, los requisitos de instalación, la arquitectura implementada, la base de datos, los procesos principales, las políticas de respaldo y las recomendaciones de mantenimiento del sistema.

---

## 2. Objetivo del Manual Técnico

El objetivo de este manual es servir como guía para instalar, configurar, ejecutar, mantener y comprender técnicamente el sistema EcoTribu Escolar. Está dirigido a desarrolladores, administradores técnicos o personas encargadas de dar soporte al sistema.

---

## 3. Descripción General del Sistema

EcoTribu Escolar permite que los usuarios interactúen según su rol dentro de la plataforma.

### Roles del sistema

| Rol | Función principal |
|---|---|
| Alumno | Participa en retos ecológicos, sube evidencias, responde cuestionarios, consulta ranking e insignias. |
| Profesor | Crea retos y cuestionarios, revisa evidencias y consulta resultados de los alumnos. |
| Administrador | Gestiona usuarios, escuelas, retos, cuestionarios, rankings, insignias y contenido general del sistema. |

---

## 4. Arquitectura del Sistema

El sistema utiliza una arquitectura cliente-servidor.

```text
a. Cliente Angular
   Interfaz visual del usuario.

b. Servidor Node.js + Express
   API RESTful encargada de procesar solicitudes, aplicar reglas de negocio y comunicarse con MongoDB.

c. Base de datos MongoDB
   Almacena la información mediante colecciones y documentos.
```

### Flujo general de comunicación

```text
Usuario → Angular → API RESTful Express → Mongoose → MongoDB
```

---

## 5. Tecnologías Implementadas

### 5.1 Del lado del servidor

| Tecnología / Librería | Uso |
|---|---|
| Node.js | Entorno de ejecución para el backend. |
| Express | Framework para construir la API RESTful. |
| MongoDB | Base de datos NoSQL para almacenar documentos. |
| Mongoose | ODM para definir esquemas y modelos de MongoDB. |
| Arquitectura MVC | Organización del backend en modelos, controladores y rutas. |
| CORS | Permite la comunicación entre Angular y Express. |
| dotenv | Manejo de variables de entorno y configuración sensible. |
| bcryptjs | Cifrado de contraseñas de usuarios. |
| nodemon | Reinicio automático del servidor durante el desarrollo. |

### 5.2 Del lado del cliente

| Tecnología / Librería | Uso |
|---|---|
| Angular | Desarrollo de la interfaz del cliente. |
| TypeScript | Lenguaje principal utilizado por Angular. |
| Angular Router | Manejo de rutas y navegación entre pantallas. |
| Angular Forms | Manejo de formularios de registro, login, retos y cuestionarios. |
| RxJS | Manejo de datos asíncronos y peticiones HTTP. |
| Tailwind CSS | Estilos modernos y diseño responsive. |
| Bootstrap Icons | Íconos visuales para botones, menús y módulos. |
| Chart.js | Gráficos para dashboards, rankings y reportes. |
| Angular SSR | Soporte para renderizado del lado del servidor. |

---

## 6. Requisitos Previos

Antes de ejecutar el proyecto, se debe tener instalado:

| Requisito | Descripción |
|---|---|
| Node.js 20 o superior | Necesario para ejecutar backend y frontend. |
| npm | Administrador de paquetes de Node.js. |
| MongoDB | Base de datos utilizada por el sistema. |
| Angular CLI | Herramienta para ejecutar y construir el frontend Angular. |
| Studio 3T | Herramienta opcional para administrar visualmente MongoDB. |
| Visual Studio Code | Editor recomendado para modificar el código fuente. |
| Navegador web | Necesario para acceder al frontend del sistema. |

---

## 7. Requisitos de Hardware Recomendados

| Recurso | Requisito mínimo recomendado |
|---|---|
| Procesador | Intel Core i3 o equivalente. |
| Memoria RAM | 4 GB mínimo, 8 GB recomendado. |
| Almacenamiento | 2 GB libres para proyecto, dependencias y base de datos local. |
| Red | Conexión local o a internet para pruebas cliente-servidor. |

---

## 8. Estructura General del Proyecto

```text
ecotribu-angular/
│
├── backend/
│   ├── config/
│   ├── Controllers/
│   ├── Model/
│   ├── Routes/
│   ├── middleware/
│   ├── app.js
│   ├── package.json
│   └── Readme.md
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── pages/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── guards/
    │   │   └── app.routes.ts
    │   └── assets/
    └── package.json
```

---

## 9. Estructura Base del Backend

| Elemento | Ruta | Descripción |
|---|---|---|
| Conexión a base de datos | `backend/config/dbconexion.js` | Archivo encargado de conectar el servidor con MongoDB. |
| Modelos | `backend/Model` | Contiene los esquemas de las colecciones. |
| Controladores | `backend/Controllers` | Contiene la lógica de negocio de cada módulo. |
| Rutas | `backend/Routes` | Define los endpoints de la API RESTful. |
| Archivo principal | `backend/app.js` | Registra middlewares, rutas y arranque del servidor. |
| Dependencias | `backend/package.json` | Lista las librerías necesarias para ejecutar el backend. |

---

## 10. Arquitectura MVC del Backend

El backend se organiza utilizando el patrón MVC.

| Capa | Descripción |
|---|---|
| Modelo | Define la estructura de los datos mediante esquemas de Mongoose. |
| Controlador | Contiene las reglas de negocio y procesa las solicitudes. |
| Ruta | Recibe las peticiones HTTP y las dirige al controlador correspondiente. |

### Flujo MVC por colección

```text
1. El cliente envía una solicitud HTTP.
2. La ruta recibe la solicitud.
3. La ruta delega la operación al controlador.
4. El controlador valida y aplica reglas de negocio.
5. El controlador utiliza el modelo para leer o escribir en MongoDB.
6. El servidor devuelve una respuesta JSON al cliente.
```

### Respuesta JSON recomendada

```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {}
}
```

En caso de error:

```json
{
  "success": false,
  "message": "No se pudo completar la operación",
  "error": "Detalle del error"
}
```

---

## 11. Colecciones de la Base de Datos

La base de datos del sistema se llama:

```text
ecotribuescolar
```

### Colecciones principales

| No. | Colección | Objetivo |
|---|---|---|
| 1 | `escuelas` | Gestionar instituciones educativas. |
| 2 | `usuarios` | Gestionar alumnos, profesores y administradores. |
| 3 | `retos` | Gestionar retos ecológicos. |
| 4 | `evidencias` | Registrar evidencias del cumplimiento de retos. |
| 5 | `cuestionarios` | Gestionar contenido evaluativo. |
| 6 | `resultados_cuestionarios` | Guardar resultados de cuestionarios. |
| 7 | `rankings` | Mostrar posiciones por puntos acumulados. |
| 8 | `insignias` | Otorgar reconocimientos digitales. |

---

## 12. Descripción de Colecciones y Procesos

### 12.1 escuelas

**Objetivo:** gestionar instituciones educativas.

**Flujo principal:** crear escuela, listar escuelas, actualizar datos y desactivar escuela.

### 12.2 usuarios

**Objetivo:** gestionar alumnos, profesores y administradores.

**Flujo principal:** registrar usuario, asignar rol, asociar escuela, consultar perfil y actualizar estado.

### 12.3 retos

**Objetivo:** gestionar retos ecológicos.

**Flujo principal:** crear reto, publicar reto, listar retos activos y cerrar reto.

### 12.4 evidencias

**Objetivo:** registrar evidencias de cumplimiento de retos.

**Flujo principal:** el alumno envía evidencia, el profesor revisa, aprueba o rechaza, y el sistema actualiza puntos si corresponde.

### 12.5 cuestionarios

**Objetivo:** gestionar contenido evaluativo.

**Flujo principal:** crear cuestionario, agregar preguntas, publicar y listar por escuela o grado.

### 12.6 resultados_cuestionarios

**Objetivo:** guardar resultados de intentos realizados por los alumnos.

**Flujo principal:** el alumno responde un cuestionario, el sistema calcula puntaje, guarda el resultado y evita duplicados según la regla definida.

### 12.7 rankings

**Objetivo:** mostrar posiciones por puntos.

**Flujo principal:** recalcular ranking cuando cambian los puntos de retos o cuestionarios, y consultar ranking general o por escuela.

### 12.8 insignias

**Objetivo:** otorgar reconocimientos digitales.

**Flujo principal:** definir criterios, evaluar logros, asignar insignia y listar insignias por usuario.

---

## 13. Flujo entre Colecciones

```text
1. La escuela se crea primero.
2. Los usuarios se registran y se vinculan a una escuela.
3. Profesores o administradores crean retos y cuestionarios.
4. Los alumnos envían evidencias y responden cuestionarios.
5. Los resultados y evidencias aprobadas generan puntos.
6. Los rankings se recalculan con esos puntos.
7. Las insignias se asignan según criterios de progreso.
```

---

## 14. Orden Recomendado de Implementación

```text
1. Conexión a MongoDB.
2. Módulo de escuelas.
3. Módulo de usuarios.
4. Módulo de retos.
5. Módulo de evidencias.
6. Módulo de cuestionarios.
7. Módulo de resultados_cuestionarios.
8. Módulo de rankings.
9. Módulo de insignias.
10. Validaciones, manejo de errores y permisos por rol.
```

---

## 15. Instalación y Ejecución del Backend

### 15.1 Entrar a la carpeta del backend

```bash
cd backend
```

### 15.2 Instalar dependencias

```bash
npm install
```

### 15.3 Ejecutar en modo desarrollo

```bash
npm run dev
```

### 15.4 Ejecutar en modo producción

```bash
npm start
```

### 15.5 URL base del backend

```text
http://localhost:3000
```

---

## 16. Instalación y Ejecución del Frontend

### 16.1 Entrar a la carpeta del frontend

```bash
cd frontend
```

### 16.2 Instalar dependencias

```bash
npm install
```

### 16.3 Ejecutar proyecto Angular

```bash
ng serve
```

También puede ejecutarse con:

```bash
npm start
```

### 16.4 URL del frontend

```text
http://localhost:4200
```

---

## 17. Variables de Entorno del Backend

Se recomienda crear un archivo `.env` dentro de la carpeta `backend` con la siguiente configuración:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/ecotribuescolar
```

Si posteriormente se implementa autenticación con JWT, se puede agregar:

```env
JWT_SECRET=clave_secreta_ecotribu
JWT_EXPIRES_IN=1d
```

---

## 18. Dependencias del Backend

| Dependencia | Uso |
|---|---|
| `express` | Crear la API RESTful del sistema. |
| `mongoose` | Crear modelos y esquemas para MongoDB. |
| `mongodb` | Driver oficial de MongoDB para Node.js. |
| `cors` | Permitir la comunicación entre frontend y backend. |
| `dotenv` | Manejar variables de entorno. |
| `bcryptjs` | Cifrar contraseñas de usuarios. |
| `nodemon` | Reiniciar automáticamente el servidor durante desarrollo. |

---

## 19. Dependencias del Frontend

| Dependencia | Uso |
|---|---|
| `@angular/core` | Base principal del framework Angular. |
| `@angular/forms` | Manejo de formularios. |
| `@angular/router` | Navegación entre pantallas. |
| `rxjs` | Manejo de peticiones asíncronas. |
| `tailwindcss` | Estilos y diseño responsive. |
| `bootstrap-icons` | Uso de íconos en la interfaz. |
| `chart.js` | Gráficos para dashboards y rankings. |
| `@angular/ssr` | Soporte para renderizado del lado del servidor. |

---

## 20. Rutas Principales de la API RESTful

| Módulo | Ruta base | Descripción |
|---|---|---|
| Autenticación | `/api/auth` | Registro, login y perfil. |
| Usuarios | `/api/usuarios` | Gestión de usuarios. |
| Escuelas | `/api/escuelas` | Gestión de escuelas. |
| Retos | `/api/retos` | Gestión de retos ecológicos. |
| Evidencias | `/api/evidencias` | Gestión y revisión de evidencias. |
| Cuestionarios | `/api/cuestionarios` | Gestión de cuestionarios. |
| Resultados | `/api/resultados-cuestionarios` | Consulta de resultados. |
| Rankings | `/api/rankings` | Consulta y actualización de rankings. |
| Insignias | `/api/insignias` | Gestión de insignias. |

---

## 21. Seguridad y Control de Acceso

El sistema trabaja con tres roles principales:

```text
alumno
profesor
administrador
```

### Reglas generales de acceso

| Rol | Acceso permitido |
|---|---|
| Alumno | Participar en retos, subir evidencias, responder cuestionarios, consultar ranking e insignias. |
| Profesor | Crear retos, crear cuestionarios, revisar evidencias y consultar resultados. |
| Administrador | Gestionar usuarios, escuelas, retos, cuestionarios, rankings, insignias y reportes generales. |

### Recomendaciones de seguridad

- Cifrar contraseñas con `bcryptjs` antes de guardarlas.
- Validar los datos recibidos desde formularios.
- Restringir rutas según el rol del usuario.
- No guardar contraseñas en texto plano.
- Utilizar variables de entorno para datos sensibles.
- Implementar tokens JWT si se requiere autenticación persistente.

---

## 22. Políticas de Respaldo

Para proteger la información del sistema, se recomienda aplicar las siguientes políticas:

| Política | Descripción |
|---|---|
| Respaldo diario | Realizar una copia diaria de la base de datos durante el periodo de uso del sistema. |
| Respaldo antes de cambios | Crear una copia antes de modificar esquemas, rutas o colecciones. |
| Respaldo semanal completo | Guardar una copia completa al finalizar cada semana. |
| Ubicación del respaldo | Almacenar respaldos en una carpeta segura local o en almacenamiento externo. |
| Verificación del respaldo | Comprobar que el respaldo pueda restaurarse correctamente. |
| Responsable | Administrador técnico del sistema. |

### Comando para respaldo de MongoDB

```bash
mongodump --db ecotribuescolar --out respaldos/
```

### Comando para restauración de MongoDB

```bash
mongorestore --db ecotribuescolar respaldos/ecotribuescolar
```

---

## 23. Mantenimiento del Sistema

Para mantener el sistema en buen estado, se recomienda:

- Revisar periódicamente las dependencias del proyecto.
- Mantener respaldos actualizados de la base de datos.
- Verificar que las rutas de la API respondan correctamente.
- Revisar errores en consola durante pruebas.
- Mantener documentados los cambios realizados.
- Validar que los roles tengan permisos adecuados.
- Evitar modificar directamente la base de datos sin respaldo previo.

---

## 24. Regla Práctica para Nuevas Colecciones

Si se agrega una nueva colección al sistema, se deben crear sus tres capas principales:

```text
1. Modelo
2. Controlador
3. Ruta
```

Luego debe registrarse la ruta correspondiente en:

```text
backend/app.js
```

Esto permite mantener el proyecto consistente, ordenado y escalable.

---

## 25. Conclusión

El sistema EcoTribu Escolar se encuentra diseñado bajo una arquitectura cliente-servidor, utilizando Angular para la interfaz del usuario, Node.js y Express para el backend, y MongoDB como base de datos. Su estructura modular permite organizar los procesos principales en colecciones, controladores y rutas, facilitando el mantenimiento y crecimiento del sistema.

Este manual técnico sirve como guía para instalar, ejecutar, comprender y mantener el proyecto durante su desarrollo y futuras mejoras.
# Manual Técnico - EcoTribu Escolar

## 1. Introducción

EcoTribu Escolar es una aplicación web educativa creada para fomentar la cultura del reciclaje en centros educativos. El sistema permite que los alumnos participen en retos ecológicos, suban evidencias, respondan cuestionarios, acumulen puntos y reciban insignias por su participación.

Este manual técnico describe de manera general cómo está organizado el proyecto, qué tecnologías se utilizaron, cómo se ejecuta el sistema y cómo se administra la base de datos.

---

## 2. Objetivo del Manual

El objetivo de este manual es explicar la parte técnica del sistema EcoTribu Escolar, para que otra persona pueda comprender su estructura, instalarlo, ejecutarlo y darle mantenimiento básico.

---

## 3. Descripción General del Sistema

El sistema trabaja con tres tipos de usuarios:

| Rol | Función dentro del sistema |
|---|---|
| Alumno | Participa en retos, sube evidencias, responde cuestionarios y consulta su ranking e insignias. |
| Profesor | Crea retos y cuestionarios, revisa evidencias y consulta el progreso de los alumnos. |
| Administrador | Gestiona usuarios, escuelas, retos, cuestionarios, rankings e insignias. |

---

## 4. Arquitectura del Sistema

EcoTribu Escolar utiliza una arquitectura cliente-servidor.

```text
Usuario → Frontend Angular → Backend Node.js / Express → MongoDB
```

El frontend se encarga de mostrar las pantallas al usuario. El backend recibe las solicitudes, procesa la información y se comunica con la base de datos MongoDB.

---

## 5. Tecnologías Utilizadas

### Backend

| Tecnología | Uso |
|---|---|
| Node.js | Permite ejecutar el servidor. |
| Express | Permite crear la API RESTful. |
| MongoDB | Base de datos NoSQL utilizada para guardar la información. |
| Mongoose | Permite crear modelos y esquemas para MongoDB. |
| CORS | Permite la comunicación entre Angular y Express. |
| dotenv | Permite manejar variables de entorno. |
| bcryptjs | Permite cifrar contraseñas. |
| nodemon | Reinicia el servidor automáticamente durante el desarrollo. |

### Frontend

| Tecnología | Uso |
|---|---|
| Angular | Framework utilizado para crear la interfaz del cliente. |
| TypeScript | Lenguaje utilizado por Angular. |
| Angular Router | Permite navegar entre las pantallas. |
| Angular Forms | Permite trabajar con formularios. |
| RxJS | Permite manejar peticiones y datos asíncronos. |
| Tailwind CSS | Permite crear estilos y diseño responsive. |
| Bootstrap Icons | Permite utilizar íconos en la interfaz. |
| Chart.js | Permite mostrar gráficos en dashboards y rankings. |

---

## 6. Requisitos Previos

Antes de ejecutar el proyecto se necesita tener instalado:

| Requisito | Descripción |
|---|---|
| Node.js 20 o superior | Necesario para ejecutar frontend y backend. |
| npm | Administrador de paquetes de Node.js. |
| MongoDB | Base de datos utilizada por el sistema. |
| Angular CLI | Herramienta para ejecutar el proyecto Angular. |
| Studio 3T | Herramienta opcional para administrar MongoDB visualmente. |
| Visual Studio Code | Editor recomendado para trabajar el proyecto. |
| Navegador web | Necesario para visualizar la aplicación. |

---

## 7. Requisitos de Hardware Recomendados

| Recurso | Recomendación |
|---|---|
| Procesador | Intel Core i3 o equivalente. |
| Memoria RAM | 4 GB mínimo, 8 GB recomendado. |
| Almacenamiento | 2 GB disponibles como mínimo. |
| Red | Conexión local o a internet para pruebas. |

---

## 8. Estructura General del Proyecto

```text
ecotribu-angular/
│
├── backend/
│   ├── config/
│   ├── Controllers/
│   ├── Model/
│   ├── Routes/
│   ├── middleware/
│   ├── app.js
│   ├── package.json
│   └── Readme.md
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── pages/
    │   │   ├── components/
    │   │   ├── services/
    │   │   └── app.routes.ts
    │   └── assets/
    └── package.json
```

---

## 9. Organización del Backend

El backend está organizado usando una estructura parecida al patrón MVC.

| Carpeta / Archivo | Función |
|---|---|
| `config` | Contiene la conexión con MongoDB. |
| `Model` | Contiene los modelos o esquemas de las colecciones. |
| `Controllers` | Contiene la lógica de cada módulo. |
| `Routes` | Contiene las rutas de la API. |
| `middleware` | Contiene validaciones o funciones intermedias. |
| `app.js` | Archivo principal del servidor. |

### Flujo básico del backend

```text
1. El usuario realiza una acción desde Angular.
2. Angular envía una petición HTTP al backend.
3. Express recibe la petición por medio de una ruta.
4. El controlador procesa la solicitud.
5. Mongoose consulta o guarda información en MongoDB.
6. El backend devuelve una respuesta JSON.
```

---

## 10. Base de Datos

La base de datos utilizada por el sistema se llama:

```text
ecotribuescolar
```

### Colecciones principales

| Colección | Descripción |
|---|---|
| `escuelas` | Guarda la información de las instituciones educativas. |
| `usuarios` | Guarda alumnos, profesores y administradores. |
| `retos` | Guarda los retos ecológicos. |
| `evidencias` | Guarda las evidencias enviadas por los alumnos. |
| `cuestionarios` | Guarda las evaluaciones o quizzes. |
| `resultados_cuestionarios` | Guarda los resultados obtenidos por los alumnos. |
| `rankings` | Guarda la posición de los alumnos según sus puntos. |
| `insignias` | Guarda los reconocimientos digitales del sistema. |

---

## 11. Flujo de Información entre Colecciones

```text
1. Primero se registra una escuela.
2. Luego se registran los usuarios y se asocian a una escuela.
3. Los profesores o administradores crean retos y cuestionarios.
4. Los alumnos participan en retos y responden cuestionarios.
5. Los alumnos suben evidencias fotográficas.
6. El profesor revisa las evidencias.
7. Las evidencias aprobadas y los cuestionarios generan puntos.
8. Los puntos actualizan el ranking.
9. El sistema puede asignar insignias según los logros del alumno.
```

---

## 12. Instalación del Backend

Entrar a la carpeta del backend:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Ejecutar el backend en modo desarrollo:

```bash
npm run dev
```

Ejecutar el backend en modo normal:

```bash
npm start
```

URL local del backend:

```text
http://localhost:3000
```

---

## 13. Instalación del Frontend

Entrar a la carpeta del frontend:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Ejecutar el proyecto Angular:

```bash
ng serve
```

También se puede ejecutar con:

```bash
npm start
```

URL local del frontend:

```text
http://localhost:4200
```

---

## 14. Variables de Entorno

Se recomienda crear un archivo `.env` dentro de la carpeta `backend`.

Ejemplo:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/ecotribuescolar
```

Estas variables permiten manejar la configuración del servidor y la conexión con MongoDB sin escribir esos datos directamente en el código.

---

## 15. Scripts del Backend

| Comando | Descripción |
|---|---|
| `npm install` | Instala las dependencias del backend. |
| `npm run dev` | Ejecuta el servidor con nodemon para desarrollo. |
| `npm start` | Ejecuta el servidor con Node.js. |

---

## 16. Scripts del Frontend

| Comando | Descripción |
|---|---|
| `npm install` | Instala las dependencias del frontend. |
| `ng serve` | Ejecuta Angular en modo desarrollo. |
| `npm start` | Ejecuta el comando configurado para iniciar Angular. |
| `npm run build` | Compila el proyecto para producción. |

---

## 17. Rutas Principales de la API

| Módulo | Ruta base | Descripción |
|---|---|---|
| Autenticación | `/api/auth` | Registro, inicio de sesión y perfil. |
| Usuarios | `/api/usuarios` | Gestión de usuarios. |
| Escuelas | `/api/escuelas` | Gestión de escuelas. |
| Retos | `/api/retos` | Gestión de retos ecológicos. |
| Evidencias | `/api/evidencias` | Gestión y revisión de evidencias. |
| Cuestionarios | `/api/cuestionarios` | Gestión de cuestionarios. |
| Resultados | `/api/resultados-cuestionarios` | Consulta de resultados. |
| Rankings | `/api/rankings` | Consulta de rankings. |
| Insignias | `/api/insignias` | Gestión de insignias. |

---

## 18. Seguridad Básica del Sistema

El sistema debe manejar permisos según el rol del usuario.

| Rol | Permisos principales |
|---|---|
| Alumno | Participar en retos, subir evidencias y responder cuestionarios. |
| Profesor | Crear retos, crear cuestionarios y revisar evidencias. |
| Administrador | Gestionar usuarios, escuelas y contenido general. |

### Medidas de seguridad consideradas

- Las contraseñas deben guardarse cifradas usando `bcryptjs`.
- Las rutas deben validarse según el rol del usuario.
- Los datos sensibles deben manejarse con variables de entorno.
- No se deben guardar contraseñas en texto plano.
- Se deben validar los datos recibidos desde formularios.

---

## 19. Políticas de Respaldo

Para proteger la información del sistema se recomienda realizar respaldos de la base de datos MongoDB.

| Política | Descripción |
|---|---|
| Respaldo diario | Realizar una copia de la base de datos durante el uso del sistema. |
| Respaldo antes de cambios | Crear una copia antes de modificar colecciones o estructura del sistema. |
| Respaldo semanal | Guardar una copia completa al finalizar cada semana. |
| Verificación | Comprobar que el respaldo pueda restaurarse correctamente. |

Comando para crear respaldo:

```bash
mongodump --db ecotribuescolar --out respaldos/
```

Comando para restaurar respaldo:

```bash
mongorestore --db ecotribuescolar respaldos/ecotribuescolar
```

---

## 20. Mantenimiento del Sistema

Para mantener el sistema funcionando correctamente se recomienda:

- Revisar errores en consola durante las pruebas.
- Verificar que el backend y frontend se ejecuten correctamente.
- Mantener actualizadas las dependencias cuando sea necesario.
- Realizar respaldos antes de hacer cambios importantes.
- Documentar los cambios realizados en el proyecto.
- Probar las rutas principales de la API.
- Revisar que los roles tengan permisos adecuados.

---

## 21. Conclusión

EcoTribu Escolar está organizado como una aplicación web con frontend en Angular, backend en Node.js y Express, y base de datos en MongoDB. Esta estructura permite separar la interfaz del usuario, la lógica del servidor y el almacenamiento de datos.

El manual técnico permite comprender cómo se instala, ejecuta y mantiene el sistema, además de servir como guía para futuras mejoras del proyecto.