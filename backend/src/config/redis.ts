import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;
let isConnected = false;
let redisUnavailable = false;

// In-memory fallback used when Redis is not configured or unreachable
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

function memorySet(key: string, value: string, ttlSeconds: number): void {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memoryGet(key: string): string | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memoryCache.delete(key); return null; }
  return entry.value;
}

function memoryDelete(key: string): void {
  memoryCache.delete(key);
}

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && isConnected) return redisClient;
  if (redisUnavailable) throw new Error('Redis unavailable');

  const url = process.env.REDIS_URL;
  if (!url) {
    redisUnavailable = true;
    throw new Error('REDIS_URL not set, using in-memory fallback');
  }

  redisClient = createClient({ url }) as RedisClientType;

  redisClient.on('connect', () => { isConnected = true; logger.info('Redis connected'); });
  redisClient.on('error', (err: Error) => { isConnected = false; logger.error('Redis error:', err); });
  redisClient.on('reconnecting', () => { logger.warn('Redis reconnecting...'); });
  redisClient.on('end', () => { isConnected = false; logger.info('Redis disconnected'); });

  await redisClient.connect();
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  try {
    await getRedisClient();
  } catch (error) {
    logger.warn('Redis unavailable, using in-memory cache fallback');
    redisUnavailable = true;
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
  } catch {
    memorySet(key, value, ttlSeconds);
  }
}

export async function getCache(key: string): Promise<string | null> {
  try {
    const client = await getRedisClient();
    return await client.get(key);
  } catch {
    return memoryGet(key);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch {
    memoryDelete(key);
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(keys);
  } catch {
    // In-memory: delete keys matching simple prefix pattern
    const prefix = pattern.replace('*', '');
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
  }
}

export default { getRedisClient, connectRedis, disconnectRedis, setCache, getCache, deleteCache, deleteCachePattern };
