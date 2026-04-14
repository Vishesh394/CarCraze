const Admin = require("../models/admin")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const Service = require("../models/service")

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

//Register
exports.register = async (req, res) => {
    try {
        const { fullname, email, password, role = "admin" } = req.body
        //check if admin already exists
        const adminExists = await Admin.findOne({ email })
        if (adminExists) {

            return res.status(400).json({ message: "Email already exists" })

        }
        //hash password
        const hashPassword = await bcrypt.hash(password, 10)
        //create admin
        const admin = await Admin.create({
            fullname,
            email,
            password: hashPassword,
            role

        })
        res.status(201).json({
            message: "Admin registered successfully",
            admin: {
                id: admin._id,
                fullname: admin.fullname,
                email: admin.email,
                role: admin.role
            }
        })

    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Server Error"
        })
    }
}

//--------- Login --------------
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        //check if admin exists
        const admin = await Admin.findOne({ email })
        if (!admin) {
            return res.status(400).json({ message: "Invalid email or password" })
        }
        //compare password
        const isMatch = await bcrypt.compare(password, admin.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Email or password" })
        }
        
        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET, 
            { expiresIn: "1d" }
        )
        // set token cookie for browser flows
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        })

        // If browser form submission, redirect to dashboard; else return JSON
        const wantsHTML = req.headers.accept && req.headers.accept.includes("text/html")
        if (wantsHTML || req.headers["content-type"] === "application/x-www-form-urlencoded") {
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
        res.clearCookie("token")
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


//show add service page
exports.getService=(req,res)=>{
    res.render("admin/addServices")
}
//add service
