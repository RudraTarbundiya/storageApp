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
        expires : '30'
    }
},{
    strict : 'throw',
})

const Session = model('Session', sessionSchema)

export default Session