const express = require("express")
const path=require("path")

const app=express()

//set view engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

//static files
app.use(express.static(path.join(__dirname,"public")))

//routes
app.get("/", (req,res)=>{
    res.render("pages/home")
})
app.get("/services",(req,res)=>{
    res.render("pages/services")
})

const indexRoutes= require("./routes/index")
app.use("/",indexRoutes)

//server
PORT=5000;
app.listen(PORT,()=>{
    console.log(`the server is running on http://localhost:${PORT}`)

})
