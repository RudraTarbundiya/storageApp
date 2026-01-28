// import {Schema,model} from "mongoose"

// const sessionSchema = new Schema({
//     userId : {
//         type : Schema.Types.ObjectId,
//         required : true,
//         ref : 'User' 
//     },
//     ceratedAt : {
//         type : Date,
//         default : Date.now,
//         expires : 60 * 60 * 24 * 7 //after one week user must need login again
//     }
// },{
//     strict : 'throw',
// })

// const Session = model('Session', sessionSchema)

// export default Session