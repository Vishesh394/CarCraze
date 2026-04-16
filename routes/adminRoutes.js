const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Public landing for admin base (could redirect)
router.get("/", (req, res) => res.render("index"));

// Admin pages
router.get("/login", (req, res) => res.render("admin/login"));
router.get("/dashboard", (req, res) => res.render("admin/dashboard"));
router.get("/services/add", (req, res) => res.render("admin/addServices"));
router.get("/services", adminController.listServices);
router.get("/bookings", adminController.listBookings);
router.get("/services/:id/edit", adminController.editServicePage);

// API handlers (existing)
router.post("/register", adminController.register);
router.post("/login", adminController.login);
router.post("/logout", adminController.logout);
router.post("/services", adminController.createService);
router.post("/services/:id/edit", adminController.updateService);
router.post("/services/:id/delete", adminController.deleteService);


module.exports = router;
