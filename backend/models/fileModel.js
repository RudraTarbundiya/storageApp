import { model, Schema } from "mongoose";


const fileSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    extension: {
        type: String,
        required: true,
        trim: true
    },
    size: {
        type: Number,
        default: 0
    },
    parentDirId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Directory'
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    strict: 'throw'
})

const File = model('File', fileSchema)

export default File