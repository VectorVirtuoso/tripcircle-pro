const redis = require('redis');

// 1. Create the client using your Upstash URL
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

// 2. Handle connection events so our server doesn't crash if Redis goes down
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('🚀 Redis Cache connected successfully!'));

// 3. Connect to the cloud database
redisClient.connect().catch(console.error);

module.exports = redisClient;