const mongoose=require("mongoose")
const carServiceSchema=new mongoose.Schema({
    title:{
    type:String,
    required:true
},
price:{

    type:Number,
    required:true
},
image:{
    type:String
}
})
module.exports=mongoose.model("CarService",CarServiceSchema)

 