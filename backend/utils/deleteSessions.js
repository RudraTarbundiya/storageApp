import redisClient from "../config/redis.js";

export const deleteAllSession = async (userId) => {
    const allSessions = await redisClient.ft.search('sessionIdx', `@userId:{${userId}}`, {
        RETURN: [],
    })
    const pipeline = redisClient.multi()
    allSessions.documents.forEach((session) => {
        pipeline.del(session.id)
    })
    await pipeline.exec()
}