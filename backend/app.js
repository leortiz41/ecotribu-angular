require('dotenv').config();
const connectDB = require('./config/dbconexion');
const express = require('express');
const escuelaRoutes = require('./Routes/escuelaRoutes');
const usuarioRoutes = require('./Routes/usuarioRoutes');
const retoRoutes = require('./Routes/retoRoutes');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EcoTribu Backend está funcionando!',
    console: '¡Bienvenido a la API de EcoTribu! Aquí puedes gestionar escuelas, usuarios y retos de manera eficiente.',
  });
});

// Rutas para las diferentes entidades del sistema. 
app.use('/api/escuelas', escuelaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/retos', retoRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada.',
  });
});


// iniciar el servidor y conectar a la base de datos

const iniciarServidor = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Servidor iniciado en http://localhost:${port}`);
    });
  } catch (error) {
    console.error(`Error al iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
};

iniciarServidor();
