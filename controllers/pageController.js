const Service = require("../models/service");
const Booking = require("../models/Booking");

exports.renderHome = (req, res) => {
  return res.render("index");
};

exports.renderAbout = (req, res) => {
  return res.render("pages/about");
};

exports.renderServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    return res.render("pages/services", { services });
  } catch (error) {
    console.log(error);
    return res.status(500).render("pages/services", { services: [] });
  }
};

exports.renderBooking = async (req, res) => {
  try {
    const selectedServiceId = req.query.service;
    let selectedService = null;

    if (selectedServiceId) {
      selectedService = await Service.findById(selectedServiceId);
    }

    return res.render("pages/booking", { selectedService });
  } catch (error) {
    console.log(error);
    return res.status(500).render("pages/booking", { selectedService: null });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const { serviceId, serviceTitle, customerName, phone, bookingDate, vehicleModel, notes } = req.body;

    let selectedService = null;
    if (serviceId) {
      selectedService = await Service.findById(serviceId);
    }

    if (!selectedService) {
      return res.status(400).render("pages/booking", {
        selectedService: null,
        error: "Please choose a valid service before confirming the booking."
      });
    }

    if (!customerName || !phone || !bookingDate || !vehicleModel) {
      return res.status(400).render("pages/booking", {
        selectedService,
        error: "Please fill in all required booking details."
      });
    }

    const booking = await Booking.create({
      service: selectedService._id,
      user: req.currentUser?._id,
      serviceTitle: selectedService.title || serviceTitle || "Car Service",
      customerName: customerName.trim(),
      phone: phone.trim(),
      bookingDate,
      vehicleModel: vehicleModel.trim(),
      notes: notes?.trim() || ""
    });

    const confirmedServiceTitle = booking.serviceTitle;

    const query = new URLSearchParams({
      bookingId: booking._id.toString(),
      service: confirmedServiceTitle,
      customer: customerName || "",
      phone: phone || "",
      date: bookingDate || "",
      vehicle: vehicleModel || ""
    }).toString();

    return res.redirect(`/booking/success?${query}`);
  } catch (error) {
    console.log(error);
    return res.status(500).render("pages/booking", { selectedService: null });
  }
};

exports.renderBookingSuccess = (req, res) => {
  const booking = {
    id: req.query.bookingId || "",
    service: req.query.service || "Car Service",
    customer: req.query.customer || "",
    phone: req.query.phone || "",
    date: req.query.date || "",
    vehicle: req.query.vehicle || ""
  };

  return res.render("pages/booking-success", { booking });
};

exports.renderLegacyHome = (req, res) => {
  return res.render("pages/home");
};
