const mongoose = require('mongoose');

const connectDB = async () => {
	const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

	if (!mongoUri) {
		throw new Error('No se encontro MONGO_URI o MONGODB_URI en las variables de entorno.');
	}

	await mongoose.connect(mongoUri, {
		serverSelectionTimeoutMS: 5000,
	});

	console.log('MongoDB conectado exitosamente.');
};

module.exports = connectDB;
