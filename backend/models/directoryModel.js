import { model, Schema } from 'mongoose'

const directorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    size: {
        type: Number,
        default: 0
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    parentDirId: {
        type: Schema.Types.ObjectId,
        default: null,
        ref: 'Directory'
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

const Directory = model('Directory', directorySchema)

export default Directory