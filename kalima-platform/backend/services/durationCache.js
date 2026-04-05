/**
 * Redis Cache Service for Course Durations
 * Caches duration calculations to reduce YouTube API calls
 */

const redis = require('redis');

class DurationCacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 24 * 60 * 60; // 24 hours in seconds
    this.keyPrefix = 'course_duration:';
  }

  async connect() {
    if (this.isConnected) return;
    if (this.client === 'disabled') return;

    const redisUrl = process.env.REDIS_URL;
    
    // Skip Redis if no URL provided
    if (!redisUrl) {
      console.log('Redis not configured, skipping cache');
      this.client = 'disabled';
      return;
    }
    
    try {
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.log('Redis connection failed, continuing without cache');
              return false;
            }
            return Math.min(retries * 100, 1000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.log('Redis unavailable, continuing without cache:', error.message);
      this.client = 'disabled';
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  _getKey(courseId) {
    return `${this.keyPrefix}${courseId}`;
  }

  async getDuration(courseId) {
    if (!this.isConnected || !this.client || this.client === 'disabled') {
      return null;
    }

    try {
      const key = this._getKey(courseId);
      const data = await this.client.get(key);
      
      if (!data) return null;

      const parsed = JSON.parse(data);
      
      // Check if cache is expired (older than 24 hours)
      const age = Date.now() - parsed.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        await this.client.del(key);
        return null;
      }

      return parsed.duration;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setDuration(courseId, duration, ttl = null) {
    if (!this.isConnected || !this.client || this.client === 'disabled') {
      return false;
    }

    try {
      const key = this._getKey(courseId);
      const data = JSON.stringify({
        duration,
        timestamp: Date.now()
      });

      await this.client.setEx(key, ttl || this.defaultTTL, data);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async invalidate(courseId) {
    if (!this.isConnected || !this.client || this.client === 'disabled') {
      return false;
    }

    try {
      const key = this._getKey(courseId);
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    if (!this.isConnected || !this.client || this.client === 'disabled') {
      return 0;
    }

    try {
      const keys = await this.client.keys(`${this.keyPrefix}${pattern}`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Redis pattern delete error:', error);
      return 0;
    }
  }

  async getStats() {
    if (!this.isConnected || !this.client || this.client === 'disabled') {
      return { status: 'disabled' };
    }

    try {
      const keys = await this.client.keys(`${this.keyPrefix}*`);
      return {
        cachedCourses: keys.length,
        isConnected: this.isConnected
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return { error: error.message };
    }
  }
}

// Singleton instance
const durationCache = new DurationCacheService();

module.exports = durationCache;
