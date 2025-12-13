import mongoose from 'mongoose'


export default async function connectDB() {
    try {
        await mongoose.connect('mongodb://rudra:rudra@localhost:27017/storageApp?authSource=storageApp')
        console.log('Connected to DB')
    }catch(err){
        console.error('DB connection error:', err)
        process.exit(1)
    }
}

process.on('SIGINT', async () => {
    await mongoose.disconnect()
    console.log('Disconnected from DB')
    process.exit(0)
})