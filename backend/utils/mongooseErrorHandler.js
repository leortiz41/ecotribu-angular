


//manejador de errorres de mongoose
const crearManejadorErroresMongoose = ({ duplicateMessage, validationMessage }) => {
  return (error, res) => {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: duplicateMessage,
        error: error.message,
      });
    }

    if (error.name === 'ValidandoError') {
      return res.status(400).json({
        success: false,
        message:validando,
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
