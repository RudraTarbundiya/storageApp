import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        minLength: [3, 'Name must be at least 3 characters long'],
    },
    email: {
        type: String,
        required: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    rootDirId :{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Directory'
    }
}, {
    strict: 'throw',
    versionKey: false
})

const User = model('User', userSchema)

export default User