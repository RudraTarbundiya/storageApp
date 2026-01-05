import { model, Schema } from 'mongoose'

const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true
    },
    otp : {
        type : Number,
        required : true
    },
    createdAt : {
        type : Date,
        default : Date.now,
        expires : 300
    }
},{
    strict : 'throw',
})

const OTP = model('OTP', otpSchema)

export default OTP