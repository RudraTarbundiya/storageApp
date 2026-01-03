import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

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
        required: true,
        trim: true
    },
    rootDirId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Directory'
    }
}, {
    strict: 'throw'
})

userSchema.pre("save",  function () {
  if (!this.isModified("password")) return
  this.password = bcrypt.hashSync(this.password, 12)
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

const User = model('User', userSchema)

export default User