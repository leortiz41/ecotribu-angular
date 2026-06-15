# Proyecto Contexto

Aplicacion web educativa e interactiva para fomentar la cultura del reciclaje en estudiantes de centros educativos publicos de Honduras mediante retos practicos, aprendizaje gamificado y participacion activa de la comunidad escolar.


## Requisitos previos para Correr Backend

Antes de ejecutar el proyecto, se debe tener instalado:
- Node.js versión 20 o superior
- npm
- MongoDB
- Studio 3T, opcional para administrar la base de datos
- Visual Studio Code, opcional para editar el código


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
Objetivo: 
gestionar instituciones educativas.

Flujo principal:
crear escuela, listar escuelas, actualizar datos, desactivar escuela.

2. usuarios
Objetivo:
gestionar alumnos, profesores y administradores.
Flujo principal: 
registrar usuario, asignar rol, asociar escuela, consultar perfil, actualizar estado.

3. retos
Objetivo: 
gestionar retos ecologicos.
Flujo principal:
crear reto, publicar reto, listar retos activos, cerrar reto.

4. evidencias
Objetivo: 
registrar evidencia de cumplimiento de retos.
Flujo principal: 
alumno envia evidencia, profesor revisa, aprueba o rechaza, se actualizan puntos.

5. cuestionario
Objetivo: 
gestionar contenido evaluativo.
Flujo principal: 
crear cuestionario, agregar preguntas, publicar, listar por escuela o grado.

6. resultados_cuestionarios
Objetivo: 
guardar resultados de intentos.
Flujo principal: 
alumno responde cuestionario, sistema calcula puntaje, guarda resultado, evita duplicados segun regla.

7. rankings
Objetivo: 
mostrar posiciones por puntos.
Flujo principal: 
recalcular ranking cuando cambian puntos de retos o cuestionarios, consultar ranking general y por escuela.

8. insignias
Objetivo: 
otorgar reconocimientos digitales.
Flujo principal: 
definir criterios, evaluar logros, asignar insignia, listar insignias por usuario.

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


### Roles del sistema

| Rol | Función principal |
|---|---|
| Alumno | Participa en retos ecológicos, sube evidencias, responde cuestionarios, consulta ranking e insignias. |
| Profesor | Crea retos y cuestionarios, revisa evidencias y consulta resultados de los alumnos. |
| Administrador | Gestiona usuarios, escuelas, retos, cuestionarios, rankings, insignias y contenido general del sistema. |

---

## Arquitectura del Sistema

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
## Requisitos Previos

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

## Requisitos de Hardware Recomendados

| Recurso | Requisito mínimo recomendado |
|---|---|
| Procesador | Intel Core i3 o equivalente. |
| Memoria RAM | 4 GB mínimo, 8 GB recomendado. |
| Almacenamiento | 2 GB libres para proyecto, dependencias y base de datos local. |
| Red | Conexión local o a internet para pruebas cliente-servidor. |

---

## Estructura General del Proyecto

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

## Estructura Base del Backend

| Elemento | Ruta | Descripción |
|---|---|---|
| Conexión a base de datos | `backend/config/dbconexion.js` | Archivo encargado de conectar el servidor con MongoDB. |
| Modelos | `backend/Model` | Contiene los esquemas de las colecciones. |
| Controladores | `backend/Controllers` | Contiene la lógica de negocio de cada módulo. |
| Rutas | `backend/Routes` | Define los endpoints de la API RESTful. |
| Archivo principal | `backend/app.js` | Registra middlewares, rutas y arranque del servidor. |
| Dependencias | `backend/package.json` | Lista las librerías necesarias para ejecutar el backend. |

---

## Arquitectura MVC del Backend

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

## Colecciones de la Base de Datos

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



## Orden Recomendado de Implementación

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

## Instalación y Ejecución del Backend

### Entrar a la carpeta del backend

```bash
cd backend
```

###  Instalar dependencias

```bash
npm install
```

### Ejecutar en modo desarrollo

```bash
npm run dev
```

### Ejecutar en modo producción

```bash
npm start
```

### URL base del backend

```text
http://localhost:3000
```

---

## Instalación y Ejecución del Frontend

###  Entrar a la carpeta del frontend

```bash
cd frontend
```

### Instalar dependencias

```bash
npm install
```

### Ejecutar proyecto Angular

```bash
ng serve
```

También puede ejecutarse con:

```bash
npm start
```

### URL del frontend

```text
http://localhost:4200
```

---

## Dependencias del Backend

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

## Dependencias del Frontend

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

## Rutas Principales de la API RESTful

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

## Seguridad y Control de Acceso

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

## Políticas de Respaldo

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

## Mantenimiento del Sistema

Para mantener el sistema en buen estado, se recomienda:

- Revisar periódicamente las dependencias del proyecto.
- Mantener respaldos actualizados de la base de datos.
- Verificar que las rutas de la API respondan correctamente.
- Revisar errores en consola durante pruebas.
- Mantener documentados los cambios realizados.
- Validar que los roles tengan permisos adecuados.
- Evitar modificar directamente la base de datos sin respaldo previo.

---

## Regla Práctica para Nuevas Colecciones

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
