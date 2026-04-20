const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/auth");

// Direct admin entry point
router.get("/", (req, res) => res.redirect("/admin/login"));

// Admin pages
router.get("/login", (req, res) => res.render("admin/login", { error: null, formData: {} }));
router.get("/register", (req, res) => { res.render("admin/register") });
router.get("/dashboard", requireAdmin, (req, res) => res.render("admin/dashboard"));
router.get("/services/add", requireAdmin, (req, res) => res.render("admin/addServices"));
router.get("/services", requireAdmin, adminController.listServices);
router.get("/accessories/add", requireAdmin, adminController.addAccessoryPage);
router.get("/accessories", requireAdmin, adminController.listAccessories);
router.get("/bookings", requireAdmin, adminController.listBookings);
router.get("/bookings/history", requireAdmin, adminController.listCompletedBookings);
router.get("/services/:id/edit", requireAdmin, adminController.editServicePage);
router.get("/accessories/:id/edit", requireAdmin, adminController.editAccessoryPage);


// API handlers (existing)
router.post("/register", adminController.register);
router.post("/login", adminController.login);
router.post("/logout", requireAdmin, adminController.logout);
router.post("/services", requireAdmin, adminController.createService);
router.post("/accessories", requireAdmin, adminController.createAccessory);
router.post("/bookings/:id/complete", requireAdmin, adminController.completeBooking);
router.post("/services/:id/edit", requireAdmin, adminController.updateService);
router.post("/services/:id/delete", requireAdmin, adminController.deleteService);
router.post("/accessories/:id/edit", requireAdmin, adminController.updateAccessory);
router.post("/accessories/:id/delete", requireAdmin, adminController.deleteAccessory);


module.exports = router;
