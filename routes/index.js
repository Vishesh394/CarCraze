const express = require("express")
const router= express.Router();

router.get("/", (req,res)=>{
    res.render("pages/home")
})

router.get("/services",(req,res)=>{
    res.render("pages/services")
})
router.get("/about",(req,res)=>{
    res.render("pages/about")
})
router.get("/contact",(req,res)=>{
    res.render("pages/contact")
})
router.get("/boooking",(req,res)=>{
    res.render("pages/booking")
})

module.exports= router;