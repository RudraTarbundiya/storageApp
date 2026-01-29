import { createClient } from 'redis';

const redisClient = createClient()

redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
    process.exit(1);
});

await redisClient.connect();

async function createSessionIndex() {
    try {
        await redisClient.ft.create(
            'sessionIdx',
            {
                userId: {
                    type: 'TAG',
                    sortable: true
                }
            },
            {
                ON: 'HASH',
                PREFIX: 'session:'
            }
        );

        console.log('✅ sessionIdx TAG index created');
    } catch (err) {
        // Index already exists
        if (err.message.includes('Index already exists')) {
            console.log('ℹ️ sessionIdx already exists');
        } else {
            console.error('❌ Error creating sessionIdx:', err);
            throw err;
        }
    }
}
//this is the index creation for redis search
//1)by redis-cli command --> FT.CREATE sessionIdx ON HASH PREFIX 1 session: SCHEMA userId TAG SORTABLE 
//2) Call once at app startup by nodejs
await createSessionIndex();

export default redisClient;