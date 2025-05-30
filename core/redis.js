const Redis = require("ioredis");
const logger = require("./logger");

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy(times) {
    // Max 3 retry attempts
    const delay = Math.min(times * 50, 2000);
    if (times > 3) {
      return null;
    }
    return delay;
  },
};

const redis = new Redis(redisConfig);

redis.on("error", (error) => {
  logger.error("Redis connection error:", error.message);
});

redis.on("connect", () => {
  logger.info("Connected to Redis");
});

redis.on("reconnecting", (delay) => {
  logger.info(`Reconnecting to Redis in ${delay}ms`);
});

const closeRedisConnection = async () => {
  try {
    await redis.quit();
    logger.info("Redis connection closed");
  } catch (error) {
    logger.error("Error closing Redis connection:", error.message);
  }
};

module.exports = {
  redis,
  closeRedisConnection,
};
