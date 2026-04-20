const Admin = require("../models/Admin")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const Service = require("../models/service")
const Booking = require("../models/Booking")
const Accessory = require("../models/Accessory")

const accessoryCategories = ["Interior", "Exterior", "Electronics", "Maintenance"]

const isBrowserFormRequest = (req) => {
    const acceptHeader = req.headers.accept || ""
    const contentType = req.headers["content-type"] || ""
    return acceptHeader.includes("text/html") || contentType.includes("application/x-www-form-urlencoded")
}

const normalizePricing = (body) => {
    const hasRangeFields = body.priceMin !== undefined || body.priceMax !== undefined
    const rawMin = hasRangeFields ? body.priceMin : body.price
    const rawMax = hasRangeFields ? body.priceMax : body.price
    const priceMin = Number(rawMin)
    const priceMax = Number(rawMax)

    if (Number.isNaN(priceMin) || Number.isNaN(priceMax)) {
        return { error: "Price range is required" }
    }

    if (priceMin < 0 || priceMax < 0) {
        return { error: "Price range cannot be negative" }
    }

    if (priceMin > priceMax) {
        return { error: "Minimum price cannot be greater than maximum price" }
    }

    return {
        price: priceMin,
        priceMin,
        priceMax
    }
}

const normalizeAccessoryData = (body) => {
    const price = Number(body.price)

    if (!body.name || !body.category || Number.isNaN(price)) {
        return { error: "Product name, category, and price are required" }
    }

    if (!accessoryCategories.includes(body.category)) {
        return { error: "Please choose a valid product category" }
    }

    if (price < 0) {
        return { error: "Price cannot be negative" }
    }

    return {
        name: body.name.trim(),
        category: body.category,
        price,
        image: body.image?.trim() || "",
        description: body.description?.trim() || "Quality accessory selected for everyday car care.",
        tags: body.tags
            ? body.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
            : [],
        isRecommended: body.isRecommended === "on"
    }
}

exports.register = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // check if admin exists
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.render("admin/register", {
                error: "Email already exists",
                formData: req.body
            });
        }

        // hash password
        const hashPassword = await bcrypt.hash(password, 10);

        // create admin
        await Admin.create({
            fullname,
            email,
            password: hashPassword,
            role: "admin"
        });

        // redirect after success
        res.redirect("/admin/login");

    } catch (error) {
        console.log(error);
        res.render("admin/register", {
            error: "Server Error",
            formData: req.body
        });
    }
};

//--------- Login --------------
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body
        const wantsHTML = isBrowserFormRequest(req)
        const renderLoginError = (message) => {
            return res.status(400).render("admin/login", {
                error: message,
                formData: {}
            })
        }

        //check if admin exists
        const admin = await Admin.findOne({ email })
        if (!admin) {
            if (wantsHTML) {
                return renderLoginError("Invalid email or password. Please try again.")
            }
            return res.status(400).json({ message: "Invalid email or password" })
        }
        //compare password
        const isMatch = await bcrypt.compare(password, admin.password)
        if (!isMatch) {
            if (wantsHTML) {
                return renderLoginError("Invalid email or password. Please try again.")
            }
            return res.status(400).json({ message: "Invalid email or password" })
        }
        
        const token = jwt.sign(
            { id: admin._id, type: "admin" },
            process.env.JWT_SECRET, 
            { expiresIn: "1d" }
        )
        // set token cookie for browser flows
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        })

        // If browser form submission, redirect to dashboard; else return JSON
        if (wantsHTML) {
            return res.redirect("/admin/dashboard")
        }

        return res.status(200).json({
            message: "Login successful",
            token
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Server Error"
        })
    }
}

//--------- Logout --------------
// For stateless JWT we simply ask the client to drop the token; if it was stored
// in an httpOnly cookie, clear it as well.
exports.logout = (req, res) => {
    try {
        res.clearCookie("token", { path: "/" })
        const wantsHTML = req.headers.accept && req.headers.accept.includes("text/html")
        if (wantsHTML) {
            return res.redirect("/admin/login")
        }
        return res.status(200).json({ message: "Logout successful" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

//--------- Services --------------
exports.createService = async (req, res) => {
    try {
        const { title, image, description } = req.body
        const pricing = normalizePricing(req.body)

        if (!title || pricing.error) {
            const message = pricing.error || "Title and price range are required"
            if (isBrowserFormRequest(req)) {
                return res.status(400).render("admin/addServices", {
                    error: message,
                    formData: req.body
                })
            }
            return res.status(400).json({ message })
        }

        await Service.create({ title, image, description, ...pricing })

        if (isBrowserFormRequest(req)) {
            return res.redirect("/admin/services")
        }
        return res.status(201).json({ message: "Service added" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.listServices = async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 })

        if (!isBrowserFormRequest(req)) {
            return res.status(200).json({ services })
        }

        return res.render("admin/services", { services })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.listBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ status: { $nin: ["completed", "cancelled"] } })
            .populate("service", "title priceMin priceMax price")
            .populate("user", "fullname email")
            .sort({ createdAt: -1 })

        if (!isBrowserFormRequest(req)) {
            return res.status(200).json({ bookings })
        }

        return res.render("admin/bookings", { bookings })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.listCompletedBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ status: "completed" })
            .populate("service", "title priceMin priceMax price")
            .populate("user", "fullname email")
            .sort({ completedAt: -1, updatedAt: -1 })

        if (!isBrowserFormRequest(req)) {
            return res.status(200).json({ bookings })
        }

        return res.render("admin/completedBookings", { bookings })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.completeBooking = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return isBrowserFormRequest(req)
                ? res.redirect("/admin/bookings")
                : res.status(400).json({ message: "Invalid booking id" })
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                status: "completed",
                completedAt: new Date()
            },
            { new: true, runValidators: true }
        )

        if (!booking) {
            return isBrowserFormRequest(req)
                ? res.redirect("/admin/bookings")
                : res.status(404).json({ message: "Booking not found" })
        }

        if (isBrowserFormRequest(req)) {
            return res.redirect("/admin/bookings")
        }

        return res.status(200).json({ message: "Booking marked as completed", booking })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.editServicePage = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.redirect("/admin/services")
        }

        const service = await Service.findById(req.params.id)

        if (!service) {
            return res.redirect("/admin/services")
        }

        return res.render("admin/editService", { service, error: null })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.updateService = async (req, res) => {
    try {
        const { title, image, description } = req.body
        const pricing = normalizePricing(req.body)

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return isBrowserFormRequest(req)
                ? res.redirect("/admin/services")
                : res.status(400).json({ message: "Invalid service id" })
        }

        if (!title || pricing.error) {
            if (isBrowserFormRequest(req)) {
                const existingService = await Service.findById(req.params.id)
                return res.status(400).render("admin/editService", {
                    service: {
                        ...(existingService ? existingService.toObject() : {}),
                        ...req.body
                    },
                    error: pricing.error || "Title and price range are required"
                })
            }
            return res.status(400).json({ message: pricing.error || "Title and price range are required" })
        }

        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { title, image, description, ...pricing },
            { new: true, runValidators: true }
        )

        if (!service) {
            return isBrowserFormRequest(req)
                ? res.redirect("/admin/services")
                : res.status(404).json({ message: "Service not found" })
        }

        if (isBrowserFormRequest(req)) {
            return res.redirect("/admin/services")
        }

        return res.status(200).json({ message: "Service updated", service })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.deleteService = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return isBrowserFormRequest(req)
                ? res.redirect("/admin/services")
                : res.status(400).json({ message: "Invalid service id" })
        }

        const service = await Service.findByIdAndDelete(req.params.id)

        if (!service) {
            return isBrowserFormRequest(req)
                ? res.redirect("/admin/services")
                : res.status(404).json({ message: "Service not found" })
        }

        if (isBrowserFormRequest(req)) {
            return res.redirect("/admin/services")
        }

        return res.status(200).json({ message: "Service deleted" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

//--------- Accessories --------------
exports.addAccessoryPage = (req, res) => {
    return res.render("admin/addAccessory", {
        categories: accessoryCategories,
        formData: {},
        error: null
    })
}

exports.createAccessory = async (req, res) => {
    try {
        const accessoryData = normalizeAccessoryData(req.body)

        if (accessoryData.error) {
            if (isBrowserFormRequest(req)) {
                return res.status(400).render("admin/addAccessory", {
                    categories: accessoryCategories,
                    formData: req.body,
                    error: accessoryData.error
                })
            }
            return res.status(400).json({ message: accessoryData.error })
        }

        await Accessory.create(accessoryData)

        if (isBrowserFormRequest(req)) {
            return res.redirect("/admin/accessories")
        }
        return res.status(201).json({ message: "Accessory added" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.listAccessories = async (req, res) => {
    try {
        const accessories = await Accessory.find().sort({ createdAt: -1 })

        if (!isBrowserFormRequest(req)) {
            return res.status(200).json({ accessories })
        }

        return res.render("admin/accessories", { accessories })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.editAccessoryPage = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.redirect("/admin/accessories")
        }

        const accessory = await Accessory.findById(req.params.id)

        if (!accessory) {
            return res.redirect("/admin/accessories")
        }

        return res.render("admin/editAccessory", {
            accessory,
            categories: accessoryCategories,
            error: null
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.updateAccessory = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return isBrowserFormRequest(req)
                ? res.redirect("/admin/accessories")
                : res.status(400).json({ message: "Invalid accessory id" })
        }

        const accessoryData = normalizeAccessoryData(req.body)

        if (accessoryData.error) {
            if (isBrowserFormRequest(req)) {
                const existingAccessory = await Accessory.findById(req.params.id)
                return res.status(400).render("admin/editAccessory", {
                    accessory: {
                        ...(existingAccessory ? existingAccessory.toObject() : {}),
                        ...req.body,
                        tags: req.body.tags
                    },
                    categories: accessoryCategories,
                    error: accessoryData.error
                })
            }
            return res.status(400).json({ message: accessoryData.error })
        }

        const accessory = await Accessory.findByIdAndUpdate(
            req.params.id,
            accessoryData,
            { new: true, runValidators: true }
        )

        if (!accessory) {
            return isBrowserFormRequest(req)
                ? res.redirect("/admin/accessories")
                : res.status(404).json({ message: "Accessory not found" })
        }

        if (isBrowserFormRequest(req)) {
            return res.redirect("/admin/accessories")
        }

        return res.status(200).json({ message: "Accessory updated", accessory })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.deleteAccessory = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return isBrowserFormRequest(req)
                ? res.redirect("/admin/accessories")
                : res.status(400).json({ message: "Invalid accessory id" })
        }

        const accessory = await Accessory.findByIdAndDelete(req.params.id)

        if (!accessory) {
            return isBrowserFormRequest(req)
                ? res.redirect("/admin/accessories")
                : res.status(404).json({ message: "Accessory not found" })
        }

        if (isBrowserFormRequest(req)) {
            return res.redirect("/admin/accessories")
        }

        return res.status(200).json({ message: "Accessory deleted" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}


//show add service page
exports.getService=(req,res)=>{
    res.render("admin/addServices")
}
//add service 
