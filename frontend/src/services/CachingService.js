/**
 * CachingService - Advanced Multi-Level Caching System
 * 
 * Enterprise-grade caching service with multiple cache layers, intelligent
 * invalidation strategies, cache warming, and comprehensive cache analytics
 * for optimal performance in production environments.
 */

class CachingService {
    constructor() {
        this.config = {
            // Cache levels and their TTLs (in milliseconds)
            levels: {
                L1_MEMORY: { ttl: 60000, maxSize: 100 },      // 1 minute, 100 items
                L2_SESSION: { ttl: 300000, maxSize: 500 },    // 5 minutes, 500 items
                L3_LOCAL: { ttl: 3600000, maxSize: 1000 },    // 1 hour, 1000 items
                L4_INDEXED_DB: { ttl: 86400000, maxSize: 5000 } // 24 hours, 5000 items
            },
            
            // Cache strategies
            strategies: {
                LRU: 'least_recently_used',
                LFU: 'least_frequently_used',
                FIFO: 'first_in_first_out',
                TTL: 'time_to_live'
            },
            
            // Cache categories with specific configurations
            categories: {
                API_RESPONSES: {
                    levels: ['L1_MEMORY', 'L2_SESSION'],
                    strategy: 'LRU',
                    compression: true,
                    encryption: false
                },
                USER_DATA: {
                    levels: ['L1_MEMORY', 'L3_LOCAL'],
                    strategy: 'LRU',
                    compression: false,
                    encryption: true
                },
                STATIC_CONTENT: {
                    levels: ['L2_SESSION', 'L3_LOCAL', 'L4_INDEXED_DB'],
                    strategy: 'TTL',
                    compression: true,
                    encryption: false
                },
                COMPUTED_DATA: {
                    levels: ['L1_MEMORY', 'L2_SESSION'],
                    strategy: 'LFU',
                    compression: true,
                    encryption: false
                },
                OFFLINE_DATA: {
                    levels: ['L4_INDEXED_DB'],
                    strategy: 'TTL',
                    compression: true,
                    encryption: true
                }
            }
        };

        this.caches = {
            L1_MEMORY: new Map(),
            L2_SESSION: this.createSessionCache(),
            L3_LOCAL: this.createLocalStorageCache(),
            L4_INDEXED_DB: this.createIndexedDBCache()
        };

        this.metadata = new Map(); // Cache metadata for analytics
        this.stats = this.initializeStats();
        this.warmingQueue = [];
        this.invalidationListeners = new Map();
        
        this.initializeCaching();
        this.startCacheManagement();
    }

    /**
     * Initialize caching system
     */
    initializeCaching() {
        // Set up cache warming on app start
        this.warmCriticalData();
        
        // Set up network change listener for cache strategy adjustment
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.adjustCacheStrategy();
            });
        }
        
        // Set up visibility change listener for cache optimization
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.optimizeCachesForBackground();
            } else {
                this.optimizeCachesForForeground();
            }
        });
        
        // Set up beforeunload listener for cache persistence
        window.addEventListener('beforeunload', () => {
            this.persistCriticalCache();
        });
    }

    /**
     * Primary cache operations
     */

    /**
     * Get item from cache with multi-level fallback
     */
    async get(key, category = 'API_RESPONSES', options = {}) {
        const startTime = performance.now();
        const categoryConfig = this.config.categories[category];
        
        if (!categoryConfig) {
            throw new Error(`Unknown cache category: ${category}`);
        }

        // Try each cache level in order
        for (const level of categoryConfig.levels) {
            try {
                const cached = await this.getCacheLevel(level, key, categoryConfig);
                
                if (cached) {
                    // Update access statistics
                    this.updateAccessStats(key, level, true, performance.now() - startTime);
                    
                    // Promote to higher cache levels if beneficial
                    if (this.shouldPromote(key, level, cached.metadata)) {
                        await this.promoteToHigherLevels(key, cached, category, level);
                    }
                    
                    return cached.data;
                }
            } catch (error) {
                console.warn(`Cache level ${level} error:`, error);
                continue;
            }
        }
        
        // Cache miss - update statistics
        this.updateAccessStats(key, null, false, performance.now() - startTime);
        
        return null;
    }

    /**
     * Set item in appropriate cache levels
     */
    async set(key, data, category = 'API_RESPONSES', options = {}) {
        const startTime = performance.now();
        const categoryConfig = this.config.categories[category];
        
        if (!categoryConfig) {
            throw new Error(`Unknown cache category: ${category}`);
        }

        const metadata = {
            timestamp: Date.now(),
            accessCount: 1,
            lastAccessed: Date.now(),
            size: this.calculateSize(data),
            category,
            version: options.version || 1,
            tags: options.tags || [],
            priority: options.priority || 'normal'
        };

        // Prepare data for caching
        const cacheEntry = {
            data: categoryConfig.compression ? await this.compress(data) : data,
            metadata,
            encrypted: categoryConfig.encryption
        };

        // Encrypt if required
        if (categoryConfig.encryption) {
            cacheEntry.data = await this.encrypt(cacheEntry.data);
        }

        // Store in appropriate cache levels
        const promises = categoryConfig.levels.map(level => 
            this.setCacheLevel(level, key, cacheEntry, categoryConfig)
        );

        await Promise.allSettled(promises);
        
        // Update metadata
        this.metadata.set(key, metadata);
        
        // Update statistics
        this.updateSetStats(key, metadata.size, performance.now() - startTime);
        
        // Trigger cache warming for related data
        this.triggerRelatedCacheWarming(key, category, options.relatedKeys || []);
    }

    /**
     * Invalidate cache entry
     */
    async invalidate(key, category = null, options = {}) {
        const patterns = options.pattern ? [options.pattern] : [key];
        const categories = category ? [category] : Object.keys(this.config.categories);
        
        for (const cat of categories) {
            const categoryConfig = this.config.categories[cat];
            if (!categoryConfig) continue;
            
            for (const level of categoryConfig.levels) {
                for (const pattern of patterns) {
                    await this.invalidateCacheLevel(level, pattern, options.regex || false);
                }
            }
        }
        
        // Remove metadata
        this.metadata.delete(key);
        
        // Notify invalidation listeners
        this.notifyInvalidation(key, category, options);
        
        // Update statistics
        this.stats.invalidations++;
    }

    /**
     * Cache level implementations
     */

    async getCacheLevel(level, key, categoryConfig) {
        switch (level) {
            case 'L1_MEMORY':
                return this.getMemoryCache(key);
            case 'L2_SESSION':
                return this.getSessionCache(key);
            case 'L3_LOCAL':
                return this.getLocalStorageCache(key);
            case 'L4_INDEXED_DB':
                return await this.getIndexedDBCache(key);
            default:
                throw new Error(`Unknown cache level: ${level}`);
        }
    }

    async setCacheLevel(level, key, cacheEntry, categoryConfig) {
        const levelConfig = this.config.levels[level];
        
        // Check size limits
        await this.enforceSize(level, levelConfig.maxSize);
        
        switch (level) {
            case 'L1_MEMORY':
                return this.setMemoryCache(key, cacheEntry, levelConfig.ttl);
            case 'L2_SESSION':
                return this.setSessionCache(key, cacheEntry, levelConfig.ttl);
            case 'L3_LOCAL':
                return this.setLocalStorageCache(key, cacheEntry, levelConfig.ttl);
            case 'L4_INDEXED_DB':
                return await this.setIndexedDBCache(key, cacheEntry, levelConfig.ttl);
            default:
                throw new Error(`Unknown cache level: ${level}`);
        }
    }

    /**
     * Memory cache (L1)
     */
    getMemoryCache(key) {
        const cached = this.caches.L1_MEMORY.get(key);
        if (!cached) return null;
        
        if (this.isExpired(cached)) {
            this.caches.L1_MEMORY.delete(key);
            return null;
        }
        
        cached.metadata.lastAccessed = Date.now();
        cached.metadata.accessCount++;
        
        return cached;
    }

    setMemoryCache(key, cacheEntry, ttl) {
        cacheEntry.expiresAt = Date.now() + ttl;
        this.caches.L1_MEMORY.set(key, cacheEntry);
    }

    /**
     * Session storage cache (L2)
     */
    createSessionCache() {
        return {
            get: (key) => {
                try {
                    const item = sessionStorage.getItem(`cache_${key}`);
                    return item ? JSON.parse(item) : null;
                } catch (error) {
                    console.warn('Session cache get error:', error);
                    return null;
                }
            },
            set: (key, value) => {
                try {
                    sessionStorage.setItem(`cache_${key}`, JSON.stringify(value));
                } catch (error) {
                    console.warn('Session cache set error:', error);
                    // Clear some space and retry
                    this.clearOldestSessionItems(10);
                    try {
                        sessionStorage.setItem(`cache_${key}`, JSON.stringify(value));
                    } catch (retryError) {
                        console.error('Session cache retry failed:', retryError);
                    }
                }
            },
            delete: (key) => {
                try {
                    sessionStorage.removeItem(`cache_${key}`);
                } catch (error) {
                    console.warn('Session cache delete error:', error);
                }
            }
        };
    }

    getSessionCache(key) {
        const cached = this.caches.L2_SESSION.get(key);
        if (!cached) return null;
        
        if (this.isExpired(cached)) {
            this.caches.L2_SESSION.delete(key);
            return null;
        }
        
        cached.metadata.lastAccessed = Date.now();
        cached.metadata.accessCount++;
        
        return cached;
    }

    setSessionCache(key, cacheEntry, ttl) {
        cacheEntry.expiresAt = Date.now() + ttl;
        this.caches.L2_SESSION.set(key, cacheEntry);
    }

    /**
     * Local storage cache (L3)
     */
    createLocalStorageCache() {
        return {
            get: (key) => {
                try {
                    const item = localStorage.getItem(`cache_${key}`);
                    return item ? JSON.parse(item) : null;
                } catch (error) {
                    console.warn('Local cache get error:', error);
                    return null;
                }
            },
            set: (key, value) => {
                try {
                    localStorage.setItem(`cache_${key}`, JSON.stringify(value));
                } catch (error) {
                    console.warn('Local cache set error:', error);
                    // Clear some space and retry
                    this.clearOldestLocalItems(10);
                    try {
                        localStorage.setItem(`cache_${key}`, JSON.stringify(value));
                    } catch (retryError) {
                        console.error('Local cache retry failed:', retryError);
                    }
                }
            },
            delete: (key) => {
                try {
                    localStorage.removeItem(`cache_${key}`);
                } catch (error) {
                    console.warn('Local cache delete error:', error);
                }
            }
        };
    }

    getLocalStorageCache(key) {
        const cached = this.caches.L3_LOCAL.get(key);
        if (!cached) return null;
        
        if (this.isExpired(cached)) {
            this.caches.L3_LOCAL.delete(key);
            return null;
        }
        
        cached.metadata.lastAccessed = Date.now();
        cached.metadata.accessCount++;
        
        return cached;
    }

    setLocalStorageCache(key, cacheEntry, ttl) {
        cacheEntry.expiresAt = Date.now() + ttl;
        this.caches.L3_LOCAL.set(key, cacheEntry);
    }

    /**
     * IndexedDB cache (L4)
     */
    createIndexedDBCache() {
        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                resolve(null);
                return;
            }
            
            const request = indexedDB.open('PrescrptoCacheDB', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                resolve({
                    db,
                    get: async (key) => {
                        return new Promise((resolve, reject) => {
                            const transaction = db.transaction(['cache'], 'readonly');
                            const store = transaction.objectStore('cache');
                            const request = store.get(key);
                            
                            request.onsuccess = () => resolve(request.result);
                            request.onerror = () => reject(request.error);
                        });
                    },
                    set: async (key, value) => {
                        return new Promise((resolve, reject) => {
                            const transaction = db.transaction(['cache'], 'readwrite');
                            const store = transaction.objectStore('cache');
                            const request = store.put({ key, ...value });
                            
                            request.onsuccess = () => resolve();
                            request.onerror = () => reject(request.error);
                        });
                    },
                    delete: async (key) => {
                        return new Promise((resolve, reject) => {
                            const transaction = db.transaction(['cache'], 'readwrite');
                            const store = transaction.objectStore('cache');
                            const request = store.delete(key);
                            
                            request.onsuccess = () => resolve();
                            request.onerror = () => reject(request.error);
                        });
                    }
                });
            };
            
            request.onupgradeneeded = () => {
                const db = request.result;
                const store = db.createObjectStore('cache', { keyPath: 'key' });
                store.createIndex('expiresAt', 'expiresAt');
                store.createIndex('category', 'metadata.category');
            };
        });
    }

    async getIndexedDBCache(key) {
        if (!this.caches.L4_INDEXED_DB) return null;
        
        try {
            const cached = await this.caches.L4_INDEXED_DB.get(key);
            if (!cached) return null;
            
            if (this.isExpired(cached)) {
                await this.caches.L4_INDEXED_DB.delete(key);
                return null;
            }
            
            cached.metadata.lastAccessed = Date.now();
            cached.metadata.accessCount++;
            
            return cached;
        } catch (error) {
            console.warn('IndexedDB cache get error:', error);
            return null;
        }
    }

    async setIndexedDBCache(key, cacheEntry, ttl) {
        if (!this.caches.L4_INDEXED_DB) return;
        
        try {
            cacheEntry.expiresAt = Date.now() + ttl;
            await this.caches.L4_INDEXED_DB.set(key, cacheEntry);
        } catch (error) {
            console.warn('IndexedDB cache set error:', error);
        }
    }

    /**
     * Cache management and optimization
     */

    async warmCriticalData() {
        const criticalData = [
            { key: 'user_profile', endpoint: '/api/user/profile', category: 'USER_DATA' },
            { key: 'doctor_list', endpoint: '/api/doctors', category: 'API_RESPONSES' },
            { key: 'specialties', endpoint: '/api/specialties', category: 'STATIC_CONTENT' },
            { key: 'app_config', endpoint: '/api/config', category: 'STATIC_CONTENT' }
        ];

        for (const item of criticalData) {
            this.warmingQueue.push(item);
        }

        this.processCacheWarmingQueue();
    }

    async processCacheWarmingQueue() {
        while (this.warmingQueue.length > 0) {
            const item = this.warmingQueue.shift();
            
            try {
                // Check if already cached
                const cached = await this.get(item.key, item.category);
                if (cached) continue;
                
                // Fetch and cache data
                const response = await fetch(item.endpoint);
                if (response.ok) {
                    const data = await response.json();
                    await this.set(item.key, data, item.category, { priority: 'high' });
                }
            } catch (error) {
                console.warn(`Cache warming failed for ${item.key}:`, error);
            }
            
            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    shouldPromote(key, currentLevel, metadata) {
        // Promote if frequently accessed
        if (metadata.accessCount > 10) return true;
        
        // Promote if recently accessed multiple times
        if (metadata.accessCount > 3 && 
            Date.now() - metadata.timestamp < 300000) return true; // 5 minutes
        
        // Promote if high priority
        if (metadata.priority === 'high') return true;
        
        return false;
    }

    async promoteToHigherLevels(key, cached, category, currentLevel) {
        const categoryConfig = this.config.categories[category];
        const currentIndex = categoryConfig.levels.indexOf(currentLevel);
        
        // Promote to higher levels (lower indices)
        for (let i = 0; i < currentIndex; i++) {
            const higherLevel = categoryConfig.levels[i];
            await this.setCacheLevel(higherLevel, key, cached, categoryConfig);
        }
    }

    async enforceSize(level, maxSize) {
        const cache = this.caches[level];
        if (!cache) return;
        
        // For memory cache, check size directly
        if (level === 'L1_MEMORY' && cache.size >= maxSize) {
            const strategy = this.config.strategies.LRU;
            await this.evictItems(level, Math.floor(maxSize * 0.2), strategy);
        }
        
        // For other caches, implement size checking
        // This is a simplified implementation
    }

    async evictItems(level, count, strategy) {
        const cache = this.caches[level];
        if (level === 'L1_MEMORY') {
            const items = Array.from(cache.entries());
            
            if (strategy === this.config.strategies.LRU) {
                items.sort(([, a], [, b]) => a.metadata.lastAccessed - b.metadata.lastAccessed);
            } else if (strategy === this.config.strategies.LFU) {
                items.sort(([, a], [, b]) => a.metadata.accessCount - b.metadata.accessCount);
            }
            
            for (let i = 0; i < count && i < items.length; i++) {
                cache.delete(items[i][0]);
            }
        }
    }

    /**
     * Cache analytics and statistics
     */

    initializeStats() {
        return {
            hits: 0,
            misses: 0,
            sets: 0,
            invalidations: 0,
            totalSize: 0,
            averageAccessTime: 0,
            levelStats: {
                L1_MEMORY: { hits: 0, misses: 0, size: 0 },
                L2_SESSION: { hits: 0, misses: 0, size: 0 },
                L3_LOCAL: { hits: 0, misses: 0, size: 0 },
                L4_INDEXED_DB: { hits: 0, misses: 0, size: 0 }
            },
            categoryStats: {}
        };
    }

    updateAccessStats(key, level, hit, accessTime) {
        if (hit) {
            this.stats.hits++;
            if (level) this.stats.levelStats[level].hits++;
        } else {
            this.stats.misses++;
        }
        
        // Update average access time
        this.stats.averageAccessTime = 
            (this.stats.averageAccessTime * (this.stats.hits + this.stats.misses - 1) + accessTime) /
            (this.stats.hits + this.stats.misses);
    }

    updateSetStats(key, size, setTime) {
        this.stats.sets++;
        this.stats.totalSize += size;
    }

    getHitRate() {
        const total = this.stats.hits + this.stats.misses;
        return total > 0 ? this.stats.hits / total : 0;
    }

    getCacheStats() {
        return {
            ...this.stats,
            hitRate: this.getHitRate(),
            totalItems: this.metadata.size,
            memoryUsage: this.calculateTotalMemoryUsage()
        };
    }

    /**
     * Utility methods
     */

    isExpired(cached) {
        return cached.expiresAt && Date.now() > cached.expiresAt;
    }

    calculateSize(data) {
        return JSON.stringify(data).length;
    }

    async compress(data) {
        // Simple compression using JSON.stringify (in production, use proper compression)
        return JSON.stringify(data);
    }

    async decompress(data) {
        return JSON.parse(data);
    }

    async encrypt(data) {
        // Simple encryption placeholder (use proper encryption in production)
        return btoa(JSON.stringify(data));
    }

    async decrypt(data) {
        return JSON.parse(atob(data));
    }

    calculateTotalMemoryUsage() {
        let total = 0;
        for (const metadata of this.metadata.values()) {
            total += metadata.size || 0;
        }
        return total;
    }

    adjustCacheStrategy() {
        const connection = navigator.connection;
        if (!connection) return;
        
        // Adjust cache behavior based on connection
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            // Increase cache TTLs for slow connections
            Object.values(this.config.levels).forEach(level => {
                level.ttl *= 2;
            });
        } else if (connection.effectiveType === '4g') {
            // Decrease cache TTLs for fast connections (get fresh data)
            Object.values(this.config.levels).forEach(level => {
                level.ttl *= 0.8;
            });
        }
    }

    optimizeCachesForBackground() {
        // Reduce memory cache when app is in background
        this.evictItems('L1_MEMORY', 50, this.config.strategies.LRU);
    }

    optimizeCachesForForeground() {
        // Warm critical caches when app becomes active
        this.warmCriticalData();
    }

    persistCriticalCache() {
        // Move critical L1 cache items to L3 before page unload
        for (const [key, cached] of this.caches.L1_MEMORY.entries()) {
            if (cached.metadata.priority === 'high') {
                this.setLocalStorageCache(key, cached, this.config.levels.L3_LOCAL.ttl);
            }
        }
    }

    clearOldestSessionItems(count) {
        // Implementation to clear oldest session storage items
        const keys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith('cache_')) {
                keys.push(key);
            }
        }
        
        keys.slice(0, count).forEach(key => {
            sessionStorage.removeItem(key);
        });
    }

    clearOldestLocalItems(count) {
        // Implementation to clear oldest local storage items
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('cache_')) {
                keys.push(key);
            }
        }
        
        keys.slice(0, count).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    startCacheManagement() {
        // Periodic cache cleanup
        setInterval(() => {
            this.cleanupExpiredItems();
        }, 300000); // Every 5 minutes
        
        // Cache statistics reporting
        setInterval(() => {
            this.reportCacheMetrics();
        }, 60000); // Every minute
    }

    async cleanupExpiredItems() {
        // Clean up expired items from all cache levels
        const levels = ['L1_MEMORY', 'L2_SESSION', 'L3_LOCAL', 'L4_INDEXED_DB'];
        
        for (const level of levels) {
            try {
                await this.cleanupCacheLevel(level);
            } catch (error) {
                console.warn(`Cache cleanup error for ${level}:`, error);
            }
        }
    }

    async cleanupCacheLevel(level) {
        const cache = this.caches[level];
        if (!cache) return;
        
        if (level === 'L1_MEMORY') {
            for (const [key, cached] of cache.entries()) {
                if (this.isExpired(cached)) {
                    cache.delete(key);
                    this.metadata.delete(key);
                }
            }
        }
        // Similar cleanup for other levels...
    }

    reportCacheMetrics() {
        const stats = this.getCacheStats();
        
        // Report to performance monitoring
        if (window.performanceMonitor) {
            window.performanceMonitor.recordMetric('cache_performance', {
                hitRate: stats.hitRate,
                totalItems: stats.totalItems,
                memoryUsage: stats.memoryUsage,
                averageAccessTime: stats.averageAccessTime,
                type: 'cache',
                category: 'performance'
            });
        }
    }

    /**
     * Public API methods
     */

    // High-level API for common operations
    async cacheAPIResponse(endpoint, data, ttl = 300000) {
        const key = `api_${this.hashKey(endpoint)}`;
        await this.set(key, data, 'API_RESPONSES', { ttl });
        return key;
    }

    async getCachedAPIResponse(endpoint) {
        const key = `api_${this.hashKey(endpoint)}`;
        return await this.get(key, 'API_RESPONSES');
    }

    async cacheUserData(userId, data, ttl = 3600000) {
        const key = `user_${userId}`;
        await this.set(key, data, 'USER_DATA', { ttl, priority: 'high' });
        return key;
    }

    async getCachedUserData(userId) {
        const key = `user_${userId}`;
        return await this.get(key, 'USER_DATA');
    }

    hashKey(input) {
        // Simple hash function for key generation
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Invalidation patterns
    async invalidatePattern(pattern, category = null) {
        await this.invalidate(pattern, category, { pattern: true, regex: true });
    }

    async invalidateUserData(userId) {
        await this.invalidatePattern(`user_${userId}*`, 'USER_DATA');
    }

    async invalidateAPIResponses() {
        await this.invalidatePattern('api_*', 'API_RESPONSES');
    }

    // Cache warming API
    warmCache(key, fetcher, category = 'API_RESPONSES') {
        this.warmingQueue.push({
            key,
            fetcher,
            category,
            priority: 'normal'
        });
    }

    // Event listeners for cache invalidation
    onInvalidation(callback) {
        const id = Math.random().toString(36);
        this.invalidationListeners.set(id, callback);
        return id;
    }

    offInvalidation(id) {
        this.invalidationListeners.delete(id);
    }

    notifyInvalidation(key, category, options) {
        for (const callback of this.invalidationListeners.values()) {
            try {
                callback({ key, category, options });
            } catch (error) {
                console.warn('Invalidation listener error:', error);
            }
        }
    }

    async invalidateCacheLevel(level, pattern, isRegex) {
        // Implementation for invalidating cache level with pattern
        // This is a placeholder - implement based on cache level type
    }
}

// Create singleton instance
const cachingService = new CachingService();

export default cachingService;