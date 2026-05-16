import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;
let isConnected = false;

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && isConnected) {
    return redisClient;
  }

  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = createClient({ url }) as RedisClientType;

  redisClient.on('connect', () => {
    isConnected = true;
    logger.info('Redis connected');
  });

  redisClient.on('error', (err: Error) => {
    isConnected = false;
    logger.error('Redis error:', err);
  });

  redisClient.on('reconnecting', () => {
    logger.warn('Redis reconnecting...');
  });

  redisClient.on('end', () => {
    isConnected = false;
    logger.info('Redis disconnected');
  });

  await redisClient.connect();
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  try {
    await getRedisClient();
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache:', error);
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
  }
}

export async function setCache(key: string, value: string, ttlSeconds = 300): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttlSeconds, value);
  } catch (error) {
    logger.warn(`Cache set failed for key ${key}:`, error);
  }
}

export async function getCache(key: string): Promise<string | null> {
  try {
    const client = await getRedisClient();
    return await client.get(key);
  } catch (error) {
    logger.warn(`Cache get failed for key ${key}:`, error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.warn(`Cache delete failed for key ${key}:`, error);
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    logger.warn(`Cache pattern delete failed for ${pattern}:`, error);
  }
}

export default { getRedisClient, connectRedis, disconnectRedis, setCache, getCache, deleteCache, deleteCachePattern };
