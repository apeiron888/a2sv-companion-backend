import { env } from "./env.js";
import { Redis } from "ioredis";

let redis: Redis | null = null;

export function getRedis() {
  if (!env.REDIS_URL) {
    return null;
  }
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null
    });
  }
  return redis;
}
