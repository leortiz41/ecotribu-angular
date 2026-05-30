# Proyecto Contexto

Aplicacion web educativa e interactiva para fomentar la cultura del reciclaje en estudiantes de centros educativos publicos de Honduras mediante retos practicos, aprendizaje gamificado y participacion activa de la comunidad escolar.

# Tecnologia Implementada

- Node.js
- Express
- MongoDB con Mongoose
- Arquitectura MVC

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

