import { model, Schema } from "mongoose";


const fileSchema = new Schema({
    name :{
        type : String,
        required : true,
        trim : true
    },
    extension : {
        type : String,
        required : true,
        trim : true
    },
    parentDirId : {
        type : Schema.Types.ObjectId,
        required : true,
        ref : 'Directory'
    },
    userId : {
        type : Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    }
},{
   strict : 'throw',
   versionKey : false
})

const File = model('File',fileSchema)

export default File