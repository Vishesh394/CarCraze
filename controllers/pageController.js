const Service = require("../models/service");

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

exports.renderBooking = (req, res) => {
  return res.render("pages/booking");
};

exports.renderShop = (req, res) => {
  return res.render("pages/shop");
};

exports.renderLegacyHome = (req, res) => {
  return res.render("pages/home");
};
