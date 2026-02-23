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
    sharedWith: {
        type: [{
            user: { type: Schema.Types.ObjectId, ref: 'User' },
            permission: { type: String, enum: ['view', 'edit'], default: 'view' }
        }],
        default: []
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    strict: 'throw',
    timestamps: true
})

const File = model('File', fileSchema)

export default File