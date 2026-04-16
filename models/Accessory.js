const mongoose = require("mongoose");

const accessorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ["Interior", "Exterior", "Electronics", "Maintenance"],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    image: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    tags: [{ type: String, trim: true }],
    isRecommended: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

accessorySchema.index({ category: 1, price: 1 });

module.exports = mongoose.model("Accessory", accessorySchema);
