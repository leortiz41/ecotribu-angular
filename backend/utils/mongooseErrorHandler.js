
// manejador de errores de mongoose
const crearManejadorErroresMongoose = ({ duplicateMessage, validationMessage }) => {
  return (error, res) => {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: duplicateMessage,
        error: error.message,
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: validationMessage,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      error: error.message,
    });
  };
};

module.exports = { crearManejadorErroresMongoose };
