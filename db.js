const mongoose = require('mongoose') 
const mongoUri ="mongodb+srv://coderking420:SuperCoder345@aiclusters.d43d1fv.mongodb.net/shopsterUserData?retryWrites=true&w=majority&appName=AIClusters"
 //"mongodb://localhost:27017/inotebook"//mongodb://localhost:27017/ => Previous

const connectToMango = ()=>{
    mongoose.connect(mongoUri).then(()=>{console.log("Connected to Mongo Successfully")})
}

module.exports = connectToMango