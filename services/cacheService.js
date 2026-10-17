// High-Speed In-Memory Cache Service with ETag, TTL, and HTTP Cache-Control
// Designed to relieve database stress, optimize API throughput, and prevent server fatigue.
import crypto from 'crypto';

class CacheService {
  constructor(defaultTtl = 60) {
    this.defaultTtl = defaultTtl; // in seconds
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
    };

    // Background garbage collection sweep every 2 minutes
    setInterval(() => this.cleanup(), 120000).unref();
  }

  generateEtag(content) {
    const str = typeof content === 'string' ? content : JSON.stringify(content);
    return `"${crypto.createHash('md5').update(str).digest('hex')}"`;
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item;
  }

  set(key, value, ttlSeconds = this.defaultTtl) {
    const etag = this.generateEtag(value);
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt, etag, createdAt: Date.now() });
    return { etag, expiresAt };
  }

  del(key) {
    this.store.delete(key);
  }

  invalidatePattern(prefixOrRegex) {
    let count = 0;
    const isRegex = prefixOrRegex instanceof RegExp;
    for (const key of this.store.keys()) {
      const match = isRegex ? prefixOrRegex.test(key) : key.startsWith(prefixOrRegex);
      if (match) {
        this.store.delete(key);
        count++;
      }
    }
    this.stats.invalidations += count;
    return count;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }

  /**
   * Express Cache Middleware
   * @param {Object} options
   * @param {number} options.ttl - TTL in seconds (default: 60)
   * @param {string} options.prefix - Prefix namespace for key (e.g. 'events:')
   * @param {boolean} options.isPublic - Set Cache-Control public vs private
   */
  middleware(options = {}) {
    const { ttl = this.defaultTtl, prefix = 'api:', isPublic = true } = options;

    return (req, res, next) => {
      // Only cache safe GET / HEAD requests
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }

      // Do not cache authenticated user-specific mutations or admin writes
      const tenantPart = req.headers['x-tenant-id'] || req.tenantId || 'global';
      const cacheKey = `${prefix}:${tenantPart}:${req.originalUrl}`;

      const cached = this.get(cacheKey);

      if (cached) {
        // HTTP 304 Not Modified validation via ETag
        const clientEtag = req.headers['if-none-match'];
        if (clientEtag && clientEtag === cached.etag) {
          res.setHeader('ETag', cached.etag);
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('Cache-Control', `${isPublic ? 'public' : 'private'}, max-age=${ttl}, stale-while-revalidate=30`);
          return res.status(304).end();
        }

        res.setHeader('X-Cache', 'HIT');
        res.setHeader('ETag', cached.etag);
        res.setHeader('Cache-Control', `${isPublic ? 'public' : 'private'}, max-age=${ttl}, stale-while-revalidate=30`);
        return res.json(cached.value);
      }

      // Intercept res.json to capture and cache output
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Cache only successful 200 responses
        if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
          const { etag } = this.set(cacheKey, body, ttl);
          res.setHeader('X-Cache', 'MISS');
          res.setHeader('ETag', etag);
          res.setHeader('Cache-Control', `${isPublic ? 'public' : 'private'}, max-age=${ttl}, stale-while-revalidate=30`);
        }
        return originalJson(body);
      };

      next();
    };
  }

  /**
   * Invalidate cache on mutations
   */
  invalidateOnMutation(patterns = []) {
    return (req, res, next) => {
      const originalEnd = res.end.bind(res);
      res.end = (...args) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          for (const pattern of patterns) {
            this.invalidatePattern(pattern);
          }
        }
        return originalEnd(...args);
      };
      next();
    };
  }
}

export const cacheService = new CacheService(60);
export default cacheService;
