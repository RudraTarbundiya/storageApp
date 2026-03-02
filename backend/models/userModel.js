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
    },
    maxStorageInBytes:{
        type: Number,
        default : 1 * (1024 ** 3) // Default to 1GB
    },
    role : {
        type : String,
        enum : ['user', 'admin' , 'manager','owner'],//owner role only change manually in db
        default : 'user'
    },
    isDelete : {
        type : Boolean,
        default : false
    },
    googleTokens: {
        type: new Schema({
            sub: {
                type: String,
            },
            refreshToken: {
                type: String,
            },
            accessToken: {
                type: String,
            },
            expiryDate: {
                type: Number, // epoch ms
            }
        }, { _id: false }),
        default: null,
        select: false
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

const User = model('User', userSchema)

export default User