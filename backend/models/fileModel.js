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
    mimeType: {
        type: String,
        default: null
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
    },
    isUploading: {
        type: Boolean,
        default: true
    },
    summaryPoints: {
        type: [String],
        default: []
    },
    summaryTags: {
        type: [String],
        default: []
    },
    summaryGeneratedAt: {
        type: Date,
        default: null
    }
}, {
    strict: 'throw',
    timestamps: true
})

// Indexes for query performance
fileSchema.index({ parentDirId: 1 })          // getDirectoryById, deleteDirectory, share operations
fileSchema.index({ userId: 1 })               // getUsers aggregate (storage calc), hard delete
fileSchema.index({ 'sharedWith.user': 1 })    // getSharedWithMe
fileSchema.index({ userId: 1, isPublic: 1 })  // getMyPublicItems

const File = model('File', fileSchema)

export default File