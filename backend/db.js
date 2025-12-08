import { MongoClient } from "mongodb";

const client = new MongoClient('mongodb://localhost:27017/StorageApp')


export default async function connectDB(){
    await client.connect()
    const db = client.db()
    return db
}

process.on('SIGINT', async () => {
    await client.close()
    console.log('Disconnected from DB')
    process.exit(0)``
})