const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true//function run when a new document will be inserted 
    },
    date:{
        type:Date,
        default:Date.now//function run when a new document will be inserted 
    },
  });
  const User = mongoose.model('users',userSchema)
  User.createIndexes()// not needed when it is done by default as we add unique:true in any field
  module.exports = User