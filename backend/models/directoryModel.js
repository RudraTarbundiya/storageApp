import { model, Schema } from 'mongoose'

const directorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    parentDirId : {
        type : Schema.Types.ObjectId,
        default : null,
        ref : 'Directory'
    },
    isPublic : {
        type : Boolean,
        default : false
    }
},{
    strict : 'throw',
})

const Directory = model('Directory', directorySchema)

export default Directory