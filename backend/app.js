require('dotenv').config();
const express = require('express');
const connectDB = require('./config/dbconexion');
const escuelaRoutes = require('./Routes/escuelaRoutes');
const usuarioRoutes = require('./Routes/usuarioRoutes');
const retoRoutes = require('./Routes/retoRoutes');

const app = express();
const port = Number(process.env.PORT || process.env.POR) || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ecotribu Backend is running!',
  });
});

app.use('/api/escuelas', escuelaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/retos', retoRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada.',
  });
});

const startServer = async () => {
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

startServer();
