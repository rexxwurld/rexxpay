const dotenv = require("dotenv");
dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });

module.exports = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET
};