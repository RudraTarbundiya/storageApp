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

// Indexes for query performance
directorySchema.index({ parentDirId: 1 })          // getDirectoryById, deleteDirectory
directorySchema.index({ userId: 1 })               // hard delete, ownership queries
directorySchema.index({ 'sharedWith.user': 1 })    // getSharedWithMe
directorySchema.index({ userId: 1, isPublic: 1 })  // getMyPublicItems

const Directory = model('Directory', directorySchema)

export default Directory