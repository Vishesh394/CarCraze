const mongoose = require("mongoose")
const connnectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)

        console.log("MongoDB Connected");
    }
    catch (error) {
        console.error("MongoDb connection error: ", error.message);
        process.exit(1)
    }
}
module.exports = connnectDB;