import Redis from 'ioredis';

import { config } from './config';
import { createLogger } from './logger';

const log = createLogger('redis');

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null, // BullMQ için gerekli
      retryStrategy(times: number) {
        if (times > 3) {
          log.error('Redis bağlantısı kurulamadı, yeniden deneme durduruluyor');
          return null;
        }
        const delay = Math.min(times * 1000, 5000);
        log.warn(`Redis yeniden bağlanıyor... (deneme ${times}, ${delay}ms sonra)`);
        return delay;
      },
    });

    redis.on('connect', () => {
      log.info('✅ Redis bağlantısı başarılı');
    });

    redis.on('error', (err) => {
      log.error('Redis hatası:', err.message);
    });

    redis.on('close', () => {
      log.warn('Redis bağlantısı kapandı');
    });
  }

  return redis;
}

// === Cache Helper Fonksiyonları ===

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    log.error(`Cache GET hatası [${key}]:`, error);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  try {
    const json = JSON.stringify(value);
    if (ttlSeconds) {
      await getRedis().setex(key, ttlSeconds, json);
    } else {
      await getRedis().set(key, json);
    }
  } catch (error) {
    log.error(`Cache SET hatası [${key}]:`, error);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch (error) {
    log.error(`Cache DEL hatası [${key}]:`, error);
  }
}

export async function cacheExists(key: string): Promise<boolean> {
  try {
    return (await getRedis().exists(key)) === 1;
  } catch (error) {
    log.error(`Cache EXISTS hatası [${key}]:`, error);
    return false;
  }
}

export async function connectRedis(): Promise<void> {
  const r = getRedis();
  // ping ile bağlantıyı test et
  try {
    await r.ping();
  } catch (error) {
    throw new Error(`Redis bağlantısı kurulamadı: ${error}`);
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    log.info('Redis bağlantısı kapatıldı');
  }
}
