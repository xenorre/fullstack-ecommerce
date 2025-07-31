import { Redis } from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

redis.on("connect", () => {
  console.log("✅ Connected to Redis server");
});

// Optional: Log when Redis is fully ready to receive commands
redis.on("ready", () => {
  console.log("🚀 Redis client is ready");
});

// Optional: Handle errors
redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});
