import {Schema,model} from "mongoose"

const sessionSchema = new Schema({
    userId : {
        type : Schema.Types.ObjectId,
        required : true,
        ref : 'User' 
    },
    ceratedAt : {
        type : Date,
        default : Date.now,
        expires : 3600 //after each hour user must need login again
    }
},{
    strict : 'throw',
})

const Session = model('Session', sessionSchema)

export default Session