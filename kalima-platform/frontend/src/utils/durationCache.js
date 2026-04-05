/**
 * Client-side duration cache utility using LocalStorage
 * Caches course durations to reduce API calls and improve performance
 */

const DURATION_CACHE_PREFIX = 'fekra_duration_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const durationCache = {
  /**
   * Get cached duration for a course
   * @param {string} courseId - The course ID
   * @returns {number|null} - Duration in minutes or null if not cached/expired
   */
  getDuration(courseId) {
    try {
      const key = `${DURATION_CACHE_PREFIX}${courseId}`;
      const data = localStorage.getItem(key);
      
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      const age = Date.now() - parsed.timestamp;
      
      // Check if cache is expired
      if (age > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.duration;
    } catch (error) {
      console.error('Error reading duration from cache:', error);
      return null;
    }
  },

  /**
   * Set cached duration for a course
   * @param {string} courseId - The course ID
   * @param {number} duration - Duration in minutes
   */
  setDuration(courseId, duration) {
    try {
      const key = `${DURATION_CACHE_PREFIX}${courseId}`;
      const data = JSON.stringify({
        duration,
        timestamp: Date.now()
      });
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('Error saving duration to cache:', error);
      // If localStorage is full, clear old entries
      if (error.name === 'QuotaExceededError') {
        this.clearOldEntries();
      }
    }
  },

  /**
   * Invalidate cached duration for a course
   * @param {string} courseId - The course ID
   */
  invalidate(courseId) {
    try {
      const key = `${DURATION_CACHE_PREFIX}${courseId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  },

  /**
   * Clear all expired entries from cache
   */
  clearExpired() {
    try {
      const now = Date.now();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(DURATION_CACHE_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (now - parsed.timestamp > CACHE_TTL) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  },

  /**
   * Clear oldest entries when storage is full
   */
  clearOldEntries() {
    try {
      const entries = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(DURATION_CACHE_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            entries.push({ key, timestamp: parsed.timestamp });
          }
        }
      }
      
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest 20% of entries
      const toRemove = Math.ceil(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }
    } catch (error) {
      console.error('Error clearing old entries:', error);
    }
  },

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getStats() {
    try {
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(DURATION_CACHE_PREFIX)) {
          count++;
        }
      }
      return { cachedCourses: count };
    } catch (error) {
      return { error: error.message };
    }
  }
};

export default durationCache;
