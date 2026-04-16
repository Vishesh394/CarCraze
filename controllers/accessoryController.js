const Accessory = require("../models/Accessory");

const categories = ["Interior", "Exterior", "Electronics", "Maintenance"];

const starterAccessories = [
  {
    name: "Premium Seat Covers",
    category: "Interior",
    price: 2499,
    image: "https://images.unsplash.com/photo-1600661653561-629509216228?auto=format&fit=crop&w=1200&q=80",
    description: "Comfort-fit covers with a refined finish to protect your cabin and upgrade daily drives.",
    tags: ["comfort", "cabin"],
    isRecommended: true
  },
  {
    name: "All-Weather Floor Mats",
    category: "Interior",
    price: 1499,
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80",
    description: "Durable mats designed to trap dust, mud, and spills while keeping the cabin easy to clean.",
    tags: ["protection", "daily use"]
  },
  {
    name: "LED Headlight Kit",
    category: "Exterior",
    price: 3299,
    image: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
    description: "Bright, efficient LED lighting for better night visibility and a sharper road presence.",
    tags: ["lighting", "visibility"],
    isRecommended: true
  },
  {
    name: "Chrome Door Guard Set",
    category: "Exterior",
    price: 899,
    image: "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=80",
    description: "Simple exterior protection that helps reduce everyday door-edge scratches and scuffs.",
    tags: ["protection", "style"]
  },
  {
    name: "Wireless Dash Camera",
    category: "Electronics",
    price: 4499,
    image: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=80",
    description: "Compact camera with loop recording support for safer commutes and useful trip records.",
    tags: ["safety", "recording"],
    isRecommended: true
  },
  {
    name: "Fast Car Charger",
    category: "Electronics",
    price: 799,
    image: "https://images.unsplash.com/photo-1601737487795-dab272f52420?auto=format&fit=crop&w=1200&q=80",
    description: "Dual-port charging support for phones, navigation devices, and everyday road essentials.",
    tags: ["charging", "convenience"]
  },
  {
    name: "Microfiber Care Kit",
    category: "Maintenance",
    price: 999,
    image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80",
    description: "Soft microfiber towels and applicators for safe cleaning, drying, and polish touch-ups.",
    tags: ["cleaning", "detailing"]
  },
  {
    name: "Emergency Tyre Inflator",
    category: "Maintenance",
    price: 2199,
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    description: "Portable inflator for quick pressure top-ups during long drives and unexpected roadside needs.",
    tags: ["safety", "road trip"],
    isRecommended: true
  }
];

const ensureStarterAccessories = async () => {
  const count = await Accessory.countDocuments();
  if (count === 0) {
    await Accessory.insertMany(starterAccessories);
  }
};

exports.renderAccessories = async (req, res) => {
  try {
    await ensureStarterAccessories();

    const { category, minPrice, maxPrice } = req.query;
    const filters = {};
    const priceFilter = {};

    if (categories.includes(category)) {
      filters.category = category;
    }

    if (minPrice && !Number.isNaN(Number(minPrice))) {
      priceFilter.$gte = Number(minPrice);
    }

    if (maxPrice && !Number.isNaN(Number(maxPrice))) {
      priceFilter.$lte = Number(maxPrice);
    }

    if (Object.keys(priceFilter).length) {
      filters.price = priceFilter;
    }

    const [accessories, recommendedAccessories] = await Promise.all([
      Accessory.find(filters).sort({ category: 1, price: 1, createdAt: -1 }),
      Accessory.find({ isRecommended: true }).sort({ price: 1 }).limit(4)
    ]);

    return res.render("pages/shop", {
      accessories,
      recommendedAccessories,
      categories,
      filters: {
        category: category || "",
        minPrice: minPrice || "",
        maxPrice: maxPrice || ""
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).render("pages/shop", {
      accessories: [],
      recommendedAccessories: [],
      categories,
      filters: {
        category: "",
        minPrice: "",
        maxPrice: ""
      },
      error: "Accessories are temporarily unavailable. Please try again shortly."
    });
  }
};
