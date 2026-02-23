// import redisClient from '../config/redis.js'

// const createThrottler = (
//     throttlerName,
//     useUserId = false,
//     delayAfter = 3,
//     windowMs = 60000,
//     limitPerSecond = 1
// ) => {
//     return async (req, _, next) => {
//         try {
//             let key = `${throttlerName}:${req.ip}`
//             if (useUserId && req.user?._id) {
//                 key = `${throttlerName}:${req.user._id}`
//             }
//             const now = Date.now()

//             const requestDataRaw = await redisClient.get(key)
//             let requestData = requestDataRaw
//                 ? JSON.parse(requestDataRaw)
//                 : {
//                       count: 0,
//                       lastRequestTime: 0,
//                       windowStart: now,
//                   }

//             let { count, lastRequestTime, windowStart } = requestData

//             // Reset window if expired
//             if (now - windowStart > windowMs) {
//                 requestData = {
//                     count: 0,
//                     lastRequestTime: 0,
//                     windowStart: now,
//                 }
//             }

//             const timeDiff = now - (lastRequestTime || 0)
//             const minInterval = 1000 / limitPerSecond

//             let newCount = count++

//             if (newCount > delayAfter && timeDiff < minInterval) {
//                 const delayTime = minInterval - timeDiff
//                 await new Promise((resolve) => {
//                     setTimeout(resolve, delayTime)
//                 })
//             }

//             await redisClient.set(
//                 key,
//                 JSON.stringify({
//                     count: newCount,
//                     lastRequestTime: now,
//                     windowStart: now,
//                 }),
//                 'EX',
//                 Math.ceil(windowMs / 1000)
//             )
//             next()
//         } catch (error) {
//             console.error('Throttling error:', error)
//             next()
//         }
//     }
// }

// export default createThrottler