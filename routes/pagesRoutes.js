const express = require("express");
const router = express.Router();
const pageController = require("../controllers/pageController");
const accessoryController = require("../controllers/accessoryController");
const userController = require("../controllers/userController");
const { requireUser, redirectIfAuthenticated } = require("../middleware/auth");

router.get("/", pageController.renderHome);
router.get("/about", pageController.renderAbout);
router.get("/services", requireUser, pageController.renderServices);
router.get("/booking", requireUser, pageController.renderBooking);
router.post("/booking", requireUser, pageController.confirmBooking);
router.get("/booking/success", requireUser, pageController.renderBookingSuccess);
router.get("/shop", requireUser, accessoryController.renderAccessories);
router.get("/accessories", requireUser, accessoryController.renderAccessories);
router.get("/home", pageController.renderLegacyHome);

router.get("/signup", redirectIfAuthenticated, userController.renderSignup);
router.post("/signup", redirectIfAuthenticated, userController.signup);
router.get("/login", redirectIfAuthenticated, userController.renderLogin);
router.post("/login", redirectIfAuthenticated, userController.login);
router.post("/logout", userController.logout);

module.exports = router;
