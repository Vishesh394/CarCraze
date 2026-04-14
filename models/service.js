const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    priceMin: { type: Number },
    priceMax: { type: Number },
    image: { type: String, trim: true },
    description: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
