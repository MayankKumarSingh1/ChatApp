const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        minlength:[5,"Minimum length of username is 5 characters"]
    },
    password:{
        type:String,
        required:true,
        minlength:[8, "Minimum length of password is 8 characters"]
    },
    number:{
        type:String,
        required:true,
        unique:true, 
        // it allows only 10 numerical values
        match:[/^\d{10}$/, "Invalid phone number"]
    },
     friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    }],
    friendRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    sentRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
})


const messageSchema = new mongoose.Schema({
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  text:     { type: String, required: true },

  time:     { type: Date, default: Date.now }
});



const chatSchema= new mongoose.Schema({
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [messageSchema]
});


const User = mongoose.model('User', userSchema)

const Chat = mongoose.model('Chat', chatSchema)



module.exports = {User,Chat};