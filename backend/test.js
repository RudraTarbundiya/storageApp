import mongoose from "mongoose";

mongoose.connect("mongodb://admin:admin@localhost:27017/?")

const userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String
},{
    virtuals : {
        fullname : {
            get: function(){
                return this.firstname + ' ' + this.lastname;
            }
        }
    }
})

const User = mongoose.model('User',userSchema)

// const newUser = await User.create({
//     firstname : "Rudra",
//     lastname : "Pratap",  
// })

const foundUser = await User.findOne({firstname : 'Rudra'})
console.log(foundUser.fullname)

mongoose.disconnect()
