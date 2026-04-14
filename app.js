require("dotenv").config()
const express = require("express");
const path = require("path");
const adminRoutes = require("./routes/adminRoutes");
const pagesRoutes = require("./routes/pagesRoutes");
const { attachCurrentUser } = require("./middleware/auth");

const connnectDB = require("./config/db.js")
const app = express();


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

connnectDB()
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(attachCurrentUser);

// Public site routes
app.use("/", pagesRoutes);
// Admin API/routes
app.use("/admin", adminRoutes);

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
