import express from 'express'
import cors from 'cors'

//importing routes
import filesRoutes from './routes/filesRoutes.js'
import directoryRoutes from './routes/directoryRoutes.js'
import userRouteres from  './routes/userRoutes.js'

const app = express()

app.use(express.json())//for json parsing newname in rename handler

app.use(cors())//enable CORS

app.use('/directory',directoryRoutes)
app.use('/file',filesRoutes)
app.use('/user', userRouteres)

//this is global middleware for eroor handling
app.use((err,req,res,next)=>{
    return res.status(err.status || 500).json({mesasge : err.message || 'Internal Server Error'})
})

app.listen(1234, () => {
    console.log('Server is running on http://localhost:1234')
})