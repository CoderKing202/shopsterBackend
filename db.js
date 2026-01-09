const mongoose = require('mongoose') 
require("dotenv").config()
 //"mongodb://localhost:27017/inotebook"//mongodb://localhost:27017/ => Previous

const connectToMango = ()=>{
    mongoose.connect(process.env.MONGO_URI).then(()=>{console.log("Connected to Mongo Successfully")})
}

module.exports = connectToMango