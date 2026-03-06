const mongoose=require('mongoose');
require('dotenv').config();

mongoose.connect("mongodb+srv://srihari:srihari123@cluster0.lswdt.mongodb.net/SparePartsDB?retryWrites=true&w=majority&appName=Cluster0")
.then(()=>{
    console.log("Connected to mongo DB");
}).catch((err)=>{
    console.log(err);
})
