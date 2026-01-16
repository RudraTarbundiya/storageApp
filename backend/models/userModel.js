import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import Session from "./sesssionModel.js";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        minLength: [3, 'Name must be at least 3 characters long'],
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        trim: true
    },
    picture: {
        type: String,
        default: null
    },
    rootDirId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Directory'
    }
}, {
    strict: 'throw'
})

userSchema.pre("save", function () {
    if (!this.isModified("password")) return
    this.password = bcrypt.hashSync(this.password, 12)
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.set('toJSON', { virtuals: true })
userSchema.set('toObject', { virtuals: true })

const User = model('User', userSchema)

export default User