const mongoose = require("mongoose");

const validateMongoUri = (mongoUri) => {
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Add it to your .env file.");
  }

  let parsedUri;
  try {
    parsedUri = new URL(mongoUri);
  } catch (error) {
    throw new Error("MONGO_URI is not a valid MongoDB connection string.");
  }

  const allowedProtocols = ["mongodb:", "mongodb+srv:"];
  if (!allowedProtocols.includes(parsedUri.protocol)) {
    throw new Error("MONGO_URI must start with mongodb:// or mongodb+srv://.");
  }

  if (!parsedUri.hostname) {
    throw new Error("MONGO_URI is missing a database host.");
  }

  if (parsedUri.protocol === "mongodb+srv:" && !parsedUri.hostname.includes(".")) {
    throw new Error(
      `MONGO_URI has an invalid Atlas host "${parsedUri.hostname}". Use the full host from MongoDB Atlas, for example cluster0.xxxxx.mongodb.net.`
    );
  }

  return parsedUri;
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const parsedUri = validateMongoUri(mongoUri);

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log(`MongoDB Connected: ${conn.connection.host || parsedUri.hostname}`);
    return conn;
  } catch (error) {
    if (error.message.includes("querySrv ENOTFOUND")) {
      throw new Error(
        `${error.message}. Check your MONGO_URI host in .env and URL-encode special characters in the username or password.`
      );
    }

    throw error;
  }
};

module.exports = connectDB;
