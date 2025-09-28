/**
 * CDNOptimizationService - Content Delivery Network Optimization
 * 
 * Enterprise-grade CDN optimization service that provides intelligent asset
 * optimization, geographic distribution, cache control, and performance
 * optimization for global content delivery.
 */

class CDNOptimizationService {
    constructor() {
        this.config = {
            // CDN providers and their capabilities
            providers: {
                CLOUDFLARE: {
                    baseUrl: 'https://cdn.prescripto.com',
                    features: ['image_optimization', 'brotli_compression', 'http2_push', 'minification'],
                    regions: ['us-east', 'us-west', 'eu-west', 'ap-south', 'ap-southeast'],
                    bandwidth: 'unlimited',
                    ssl: true
                },
                AWS_CLOUDFRONT: {
                    baseUrl: 'https://d1234567890.cloudfront.net',
                    features: ['lambda_edge', 'field_level_encryption', 'real_time_logs'],
                    regions: ['global'],
                    bandwidth: 'pay_per_use',
                    ssl: true
                },
                FASTLY: {
                    baseUrl: 'https://prescripto.fastly.com',
                    features: ['edge_computing', 'instant_purging', 'streaming'],
                    regions: ['global'],
                    bandwidth: 'pay_per_use',
                    ssl: true
                }
            },
            
            // Asset optimization settings
            optimization: {
                images: {
                    formats: ['webp', 'avif', 'jpeg', 'png'],
                    qualities: { high: 85, medium: 75, low: 60 },
                    breakpoints: [480, 768, 1024, 1200, 1600],
                    lazyLoad: true,
                    progressive: true
                },
                fonts: {
                    formats: ['woff2', 'woff', 'ttf'],
                    preload: ['primary', 'secondary'],
                    fontDisplay: 'swap',
                    subsetting: true
                },
                scripts: {
                    minification: true,
                    compression: 'brotli',
                    bundling: true,
                    treeshaking: true
                },
                styles: {
                    minification: true,
                    compression: 'brotli',
                    inlining: 'critical',
                    autoprefixer: true
                }
            },
            
            // Cache control strategies
            cacheControl: {
                static: {
                    maxAge: 31536000,        // 1 year
                    immutable: true,
                    sMaxAge: 31536000
                },
                dynamic: {
                    maxAge: 300,             // 5 minutes
                    sMaxAge: 60,             // 1 minute
                    staleWhileRevalidate: 3600
                },
                api: {
                    maxAge: 0,               // No client cache
                    sMaxAge: 300,            // 5 minutes CDN cache
                    mustRevalidate: true
                },
                fonts: {
                    maxAge: 31536000,        // 1 year
                    crossOrigin: 'anonymous',
                    immutable: true
                },
                images: {
                    maxAge: 2592000,         // 30 days
                    sMaxAge: 86400,          // 1 day
                    vary: 'Accept'
                }
            }
        };

        this.currentProvider = 'CLOUDFLARE';
        this.userLocation = null;
        this.deviceCapabilities = null;
        this.networkInfo = null;
        this.assetCache = new Map();
        this.preloadQueue = [];
        this.performanceMetrics = {
            loadTimes: [],
            bandwidth: [],
            errors: [],
            hitRates: []
        };
        
        this.initializeCDN();
        this.detectUserContext();
        this.setupPerformanceTracking();
    }

    /**
     * Initialize CDN optimization
     */
    initializeCDN() {
        // Set up resource hints
        this.setupResourceHints();
        
        // Initialize lazy loading
        this.setupLazyLoading();
        
        // Set up service worker for advanced caching
        this.setupServiceWorker();
        
        // Monitor network changes
        this.setupNetworkMonitoring();
        
        // Set up preloading strategies
        this.setupPreloading();
    }

    /**
     * Detect user context for optimization
     */
    async detectUserContext() {
        // Detect user location for edge selection
        this.userLocation = await this.detectLocation();
        
        // Detect device capabilities
        this.deviceCapabilities = this.detectDeviceCapabilities();
        
        // Detect network information
        this.networkInfo = this.detectNetworkInfo();
        
        // Optimize based on context
        this.optimizeForContext();
    }

    /**
     * Asset optimization methods
     */

    /**
     * Optimize image delivery
     */
    optimizeImage(src, options = {}) {
        const {
            width = null,
            height = null,
            quality = 'high',
            format = 'auto',
            lazy = true,
            responsive = true,
            priority = false
        } = options;

        const provider = this.config.providers[this.currentProvider];
        const optimization = this.config.optimization.images;
        
        // Determine optimal format based on browser support
        const optimalFormat = format === 'auto' ? this.getOptimalImageFormat() : format;
        
        // Build optimized URL
        let optimizedUrl = `${provider.baseUrl}/images`;
        const params = new URLSearchParams();
        
        // Add optimization parameters
        if (width) params.set('w', width);
        if (height) params.set('h', height);
        params.set('q', optimization.qualities[quality]);
        params.set('f', optimalFormat);
        
        // Add network-aware quality
        if (this.networkInfo?.effectiveType) {
            const networkQuality = this.getQualityForNetwork(this.networkInfo.effectiveType);
            params.set('q', optimization.qualities[networkQuality]);
        }
        
        optimizedUrl += `/${src}?${params.toString()}`;
        
        // Generate responsive image set if requested
        if (responsive) {
            return this.generateResponsiveImageSet(optimizedUrl, options);
        }
        
        // Set up lazy loading if requested
        if (lazy && !priority) {
            this.setupImageLazyLoading(optimizedUrl, options);
        }
        
        // Preload if high priority
        if (priority) {
            this.preloadResource(optimizedUrl, 'image');
        }
        
        return optimizedUrl;
    }

    /**
     * Generate responsive image set
     */
    generateResponsiveImageSet(baseUrl, options) {
        const breakpoints = this.config.optimization.images.breakpoints;
        const srcSet = [];
        const sizes = [];
        
        breakpoints.forEach(breakpoint => {
            const url = baseUrl.replace(/w=\d+/, `w=${breakpoint}`);
            srcSet.push(`${url} ${breakpoint}w`);
            
            // Generate sizes attribute
            if (breakpoint <= 480) {
                sizes.push('(max-width: 480px) 100vw');
            } else if (breakpoint <= 768) {
                sizes.push('(max-width: 768px) 50vw');
            } else {
                sizes.push(`(max-width: ${breakpoint}px) 33vw`);
            }
        });
        
        return {
            src: baseUrl,
            srcSet: srcSet.join(', '),
            sizes: sizes.join(', ')
        };
    }

    /**
     * Optimize font delivery
     */
    optimizeFont(fontFamily, options = {}) {
        const {
            weight = '400',
            style = 'normal',
            display = 'swap',
            preload = false,
            subset = null
        } = options;

        const provider = this.config.providers[this.currentProvider];
        const optimization = this.config.optimization.fonts;
        
        // Build optimized font URL
        let fontUrl = `${provider.baseUrl}/fonts/${fontFamily}`;
        const params = new URLSearchParams();
        
        params.set('weight', weight);
        params.set('style', style);
        params.set('display', display);
        
        if (subset) {
            params.set('subset', subset);
        }
        
        fontUrl += `?${params.toString()}`;
        
        // Generate font-face declaration
        const fontFace = this.generateFontFaceCSS(fontFamily, fontUrl, options);
        
        // Preload if requested
        if (preload) {
            this.preloadResource(fontUrl, 'font', { crossOrigin: 'anonymous' });
        }
        
        return {
            url: fontUrl,
            css: fontFace
        };
    }

    /**
     * Optimize script delivery
     */
    optimizeScript(src, options = {}) {
        const {
            async = true,
            defer = false,
            preload = false,
            module = false,
            priority = 'normal'
        } = options;

        const provider = this.config.providers[this.currentProvider];
        
        // Build optimized script URL
        let scriptUrl = `${provider.baseUrl}/js/${src}`;
        const params = new URLSearchParams();
        
        // Add compression parameter
        if (this.supportsBrotli()) {
            params.set('compression', 'br');
        } else if (this.supportsGzip()) {
            params.set('compression', 'gzip');
        }
        
        if (params.toString()) {
            scriptUrl += `?${params.toString()}`;
        }
        
        // Create script element with optimized attributes
        const scriptElement = {
            src: scriptUrl,
            async,
            defer,
            type: module ? 'module' : 'text/javascript'
        };
        
        // Preload if requested or high priority
        if (preload || priority === 'high') {
            this.preloadResource(scriptUrl, 'script');
        }
        
        return scriptElement;
    }

    /**
     * Optimize stylesheet delivery
     */
    optimizeStylesheet(src, options = {}) {
        const {
            media = 'all',
            critical = false,
            preload = false,
            priority = 'normal'
        } = options;

        const provider = this.config.providers[this.currentProvider];
        
        // Build optimized stylesheet URL
        let cssUrl = `${provider.baseUrl}/css/${src}`;
        const params = new URLSearchParams();
        
        // Add optimization parameters
        params.set('minify', 'true');
        
        if (this.supportsBrotli()) {
            params.set('compression', 'br');
        }
        
        cssUrl += `?${params.toString()}`;
        
        // Handle critical CSS inline
        if (critical) {
            return this.inlineCriticalCSS(cssUrl);
        }
        
        // Create link element
        const linkElement = {
            href: cssUrl,
            rel: 'stylesheet',
            media
        };
        
        // Preload non-critical CSS
        if (preload || priority === 'high') {
            this.preloadResource(cssUrl, 'style');
        }
        
        return linkElement;
    }

    /**
     * Resource preloading strategies
     */

    preloadResource(url, type, options = {}) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = type;
        
        // Add type-specific attributes
        if (type === 'font') {
            link.crossOrigin = options.crossOrigin || 'anonymous';
        }
        
        if (type === 'image') {
            link.fetchPriority = options.priority || 'high';
        }
        
        // Add to preload queue for management
        this.preloadQueue.push({
            url,
            type,
            element: link,
            timestamp: Date.now()
        });
        
        document.head.appendChild(link);
    }

    setupPreloading() {
        // Preload critical resources on page load
        window.addEventListener('load', () => {
            this.preloadCriticalResources();
        });
        
        // Prefetch resources on hover/focus
        document.addEventListener('mouseover', (event) => {
            this.prefetchOnHover(event);
        });
        
        // Preload for route changes (SPA)
        if (window.history && window.history.pushState) {
            this.setupSPAPreloading();
        }
    }

    preloadCriticalResources() {
        const criticalResources = [
            { url: '/api/user/profile', type: 'fetch' },
            { url: '/images/logo.svg', type: 'image' },
            { url: '/fonts/primary-font.woff2', type: 'font' }
        ];
        
        criticalResources.forEach(resource => {
            if (resource.type === 'fetch') {
                this.prefetchData(resource.url);
            } else {
                this.preloadResource(resource.url, resource.type);
            }
        });
    }

    prefetchOnHover(event) {
        const link = event.target.closest('a[href]');
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Only prefetch internal links
        if (href.startsWith('/') || href.startsWith(window.location.origin)) {
            this.prefetchPage(href);
        }
    }

    async prefetchPage(url) {
        // Avoid duplicate prefetches
        if (this.assetCache.has(`prefetch_${url}`)) return;
        
        this.assetCache.set(`prefetch_${url}`, true);
        
        try {
            // Prefetch the page and its critical resources
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Purpose': 'prefetch'
                }
            });
            
            if (response.ok) {
                // Parse and prefetch linked resources
                const text = await response.text();
                this.extractAndPrefetchResources(text);
            }
        } catch (error) {
            console.warn('Prefetch failed:', error);
        }
    }

    extractAndPrefetchResources(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract stylesheets
        doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            this.preloadResource(link.href, 'style');
        });
        
        // Extract important images
        doc.querySelectorAll('img[data-priority="high"]').forEach(img => {
            this.preloadResource(img.src, 'image');
        });
        
        // Extract fonts
        doc.querySelectorAll('link[rel="preload"][as="font"]').forEach(link => {
            this.preloadResource(link.href, 'font', { crossOrigin: 'anonymous' });
        });
    }

    /**
     * Advanced caching strategies
     */

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/cdn-sw.js')
                .then(registration => {
                    this.serviceWorkerRegistration = registration;
                    this.setupSWCommunication();
                })
                .catch(error => {
                    console.warn('Service Worker registration failed:', error);
                });
        }
    }

    setupSWCommunication() {
        // Send CDN configuration to service worker
        navigator.serviceWorker.ready.then(registration => {
            registration.active.postMessage({
                type: 'CDN_CONFIG',
                config: {
                    provider: this.currentProvider,
                    cacheControl: this.config.cacheControl,
                    optimization: this.config.optimization
                }
            });
        });
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleSWMessage(event.data);
        });
    }

    handleSWMessage(data) {
        switch (data.type) {
            case 'CACHE_HIT':
                this.recordCacheHit(data.url);
                break;
            case 'CACHE_MISS':
                this.recordCacheMiss(data.url);
                break;
            case 'NETWORK_ERROR':
                this.recordNetworkError(data.url, data.error);
                break;
        }
    }

    /**
     * Performance monitoring
     */

    setupPerformanceTracking() {
        // Track resource loading performance
        this.observeResourceTiming();
        
        // Track CDN performance metrics
        this.trackCDNMetrics();
        
        // Monitor Core Web Vitals impact
        this.monitorWebVitals();
        
        // Report performance periodically
        setInterval(() => {
            this.reportPerformanceMetrics();
        }, 60000); // Every minute
    }

    observeResourceTiming() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.name.includes(this.config.providers[this.currentProvider].baseUrl)) {
                        this.recordResourceTiming(entry);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
    }

    recordResourceTiming(entry) {
        const timing = {
            url: entry.name,
            duration: entry.duration,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
            decodedBodySize: entry.decodedBodySize,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            timestamp: Date.now()
        };
        
        this.performanceMetrics.loadTimes.push(timing);
        
        // Keep only recent metrics
        if (this.performanceMetrics.loadTimes.length > 1000) {
            this.performanceMetrics.loadTimes.splice(0, 100);
        }
    }

    trackCDNMetrics() {
        // Track CDN-specific metrics
        const metrics = {
            provider: this.currentProvider,
            region: this.getOptimalRegion(),
            hitRate: this.calculateHitRate(),
            averageLoadTime: this.calculateAverageLoadTime(),
            bandwidth: this.calculateBandwidth(),
            errorRate: this.calculateErrorRate()
        };
        
        // Report to performance monitoring service
        if (window.performanceMonitor) {
            window.performanceMonitor.recordMetric('cdn_performance', {
                ...metrics,
                type: 'cdn',
                category: 'infrastructure'
            });
        }
    }

    /**
     * Context-aware optimization
     */

    async detectLocation() {
        try {
            // Use IP geolocation service
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            return {
                country: data.country_code,
                region: data.region_code,
                city: data.city,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone
            };
        } catch (error) {
            console.warn('Location detection failed:', error);
            return null;
        }
    }

    detectDeviceCapabilities() {
        return {
            screen: {
                width: screen.width,
                height: screen.height,
                pixelRatio: window.devicePixelRatio || 1
            },
            memory: navigator.deviceMemory || null,
            cores: navigator.hardwareConcurrency || null,
            touchScreen: 'ontouchstart' in window,
            webp: this.supportsWebP(),
            avif: this.supportsAVIF(),
            brotli: this.supportsBrotli()
        };
    }

    detectNetworkInfo() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        return null;
    }

    optimizeForContext() {
        // Adjust optimization based on user context
        
        // Low-end device optimization
        if (this.deviceCapabilities.memory && this.deviceCapabilities.memory < 4) {
            this.adjustForLowEndDevice();
        }
        
        // Slow network optimization
        if (this.networkInfo?.effectiveType === 'slow-2g' || this.networkInfo?.effectiveType === '2g') {
            this.adjustForSlowNetwork();
        }
        
        // Data saver mode
        if (this.networkInfo?.saveData) {
            this.adjustForDataSaver();
        }
        
        // Geographic optimization
        if (this.userLocation) {
            this.selectOptimalCDNRegion();
        }
    }

    adjustForLowEndDevice() {
        // Reduce image quality
        this.config.optimization.images.qualities = {
            high: 75,
            medium: 65,
            low: 50
        };
        
        // Disable some optimizations that consume CPU
        this.config.optimization.images.progressive = false;
    }

    adjustForSlowNetwork() {
        // Reduce image quality and sizes
        this.config.optimization.images.qualities = {
            high: 65,
            medium: 55,
            low: 45
        };
        
        // Enable aggressive lazy loading
        this.config.optimization.images.lazyLoad = true;
        
        // Prefer smaller image formats
        this.config.optimization.images.formats = ['webp', 'jpeg'];
    }

    adjustForDataSaver() {
        // Minimal quality settings
        this.config.optimization.images.qualities = {
            high: 50,
            medium: 40,
            low: 30
        };
        
        // Disable preloading
        this.preloadQueue = [];
        
        // Enable maximum compression
        this.config.optimization.scripts.compression = 'brotli';
        this.config.optimization.styles.compression = 'brotli';
    }

    selectOptimalCDNRegion() {
        const provider = this.config.providers[this.currentProvider];
        let optimalRegion = 'global';
        
        if (this.userLocation) {
            const { country } = this.userLocation;
            
            // Simple region mapping
            if (['US', 'CA', 'MX'].includes(country)) {
                optimalRegion = 'us-east';
            } else if (['GB', 'FR', 'DE', 'IT', 'ES'].includes(country)) {
                optimalRegion = 'eu-west';
            } else if (['IN', 'SG', 'JP', 'AU'].includes(country)) {
                optimalRegion = 'ap-southeast';
            }
        }
        
        // Update CDN URLs for optimal region
        if (provider.regions.includes(optimalRegion)) {
            provider.baseUrl = provider.baseUrl.replace(/\/\/[^.]+\./, `//${optimalRegion}.`);
        }
    }

    /**
     * Utility methods
     */

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    supportsAVIF() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    }

    supportsBrotli() {
        return 'br' in (window.CompressionStream?.prototype || {});
    }

    supportsGzip() {
        return 'gzip' in (window.CompressionStream?.prototype || {}) || 
               navigator.userAgent.includes('gzip');
    }

    getOptimalImageFormat() {
        if (this.deviceCapabilities.avif) return 'avif';
        if (this.deviceCapabilities.webp) return 'webp';
        return 'jpeg';
    }

    getQualityForNetwork(effectiveType) {
        switch (effectiveType) {
            case 'slow-2g':
            case '2g':
                return 'low';
            case '3g':
                return 'medium';
            case '4g':
            default:
                return 'high';
        }
    }

    generateFontFaceCSS(fontFamily, fontUrl, options) {
        return `
            @font-face {
                font-family: '${fontFamily}';
                src: url('${fontUrl}') format('woff2');
                font-weight: ${options.weight || '400'};
                font-style: ${options.style || 'normal'};
                font-display: ${options.display || 'swap'};
            }
        `;
    }

    async inlineCriticalCSS(cssUrl) {
        try {
            const response = await fetch(cssUrl);
            const css = await response.text();
            
            // Create style element with critical CSS
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
            
            return { inline: true, css };
        } catch (error) {
            console.warn('Critical CSS inlining failed:', error);
            return { inline: false, url: cssUrl };
        }
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyResource(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            this.lazyLoadObserver = observer;
        }
    }

    setupImageLazyLoading(src, options) {
        // This would be called when creating lazy-loaded images
        // Implementation depends on how images are rendered in the app
    }

    loadLazyResource(element) {
        if (element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
        }
        
        if (element.dataset.srcset) {
            element.srcset = element.dataset.srcset;
            element.removeAttribute('data-srcset');
        }
    }

    setupResourceHints() {
        // Add DNS prefetch for CDN
        const dnsPrefetch = document.createElement('link');
        dnsPrefetch.rel = 'dns-prefetch';
        dnsPrefetch.href = this.config.providers[this.currentProvider].baseUrl;
        document.head.appendChild(dnsPrefetch);
        
        // Add preconnect for CDN
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = this.config.providers[this.currentProvider].baseUrl;
        document.head.appendChild(preconnect);
    }

    setupNetworkMonitoring() {
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.networkInfo = this.detectNetworkInfo();
                this.optimizeForContext();
            });
        }
    }

    setupSPAPreloading() {
        // Monitor route changes for preloading
        const originalPushState = window.history.pushState;
        window.history.pushState = (...args) => {
            this.onRouteChange(args[2]); // URL is the third argument
            return originalPushState.apply(window.history, args);
        };
        
        window.addEventListener('popstate', (event) => {
            this.onRouteChange(window.location.pathname);
        });
    }

    onRouteChange(url) {
        // Preload resources for the new route
        this.preloadRouteResources(url);
    }

    preloadRouteResources(route) {
        // Define route-specific resources
        const routeResources = {
            '/appointments': [
                { url: '/api/doctors', type: 'fetch' },
                { url: '/images/appointment-bg.jpg', type: 'image' }
            ],
            '/doctors': [
                { url: '/api/doctors', type: 'fetch' },
                { url: '/api/specialties', type: 'fetch' }
            ],
            '/profile': [
                { url: '/api/user/profile', type: 'fetch' },
                { url: '/images/profile-placeholder.jpg', type: 'image' }
            ]
        };
        
        const resources = routeResources[route];
        if (resources) {
            resources.forEach(resource => {
                if (resource.type === 'fetch') {
                    this.prefetchData(resource.url);
                } else {
                    this.preloadResource(resource.url, resource.type);
                }
            });
        }
    }

    async prefetchData(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Purpose': 'prefetch'
                }
            });
            
            if (response.ok) {
                // Store in cache service if available
                if (window.cachingService) {
                    const data = await response.json();
                    await window.cachingService.cacheAPIResponse(url, data);
                }
            }
        } catch (error) {
            console.warn(`Data prefetch failed for ${url}:`, error);
        }
    }

    /**
     * Performance calculation methods
     */

    calculateHitRate() {
        const totalRequests = this.performanceMetrics.loadTimes.length;
        const hits = this.performanceMetrics.loadTimes.filter(t => t.cached).length;
        return totalRequests > 0 ? hits / totalRequests : 0;
    }

    calculateAverageLoadTime() {
        const times = this.performanceMetrics.loadTimes.map(t => t.duration);
        return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    }

    calculateBandwidth() {
        const recentMetrics = this.performanceMetrics.loadTimes.slice(-50); // Last 50 requests
        const totalBytes = recentMetrics.reduce((sum, m) => sum + (m.transferSize || 0), 0);
        const totalTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
        
        return totalTime > 0 ? (totalBytes / totalTime) * 8 : 0; // bits per millisecond
    }

    calculateErrorRate() {
        const totalRequests = this.performanceMetrics.errors.length + this.performanceMetrics.loadTimes.length;
        const errors = this.performanceMetrics.errors.length;
        return totalRequests > 0 ? errors / totalRequests : 0;
    }

    getOptimalRegion() {
        // Return the current optimal region based on user location
        if (this.userLocation) {
            const { country } = this.userLocation;
            
            if (['US', 'CA', 'MX'].includes(country)) return 'us-east';
            if (['GB', 'FR', 'DE', 'IT', 'ES'].includes(country)) return 'eu-west';
            if (['IN', 'SG', 'JP', 'AU'].includes(country)) return 'ap-southeast';
        }
        
        return 'global';
    }

    recordCacheHit(url) {
        this.performanceMetrics.hitRates.push({ url, hit: true, timestamp: Date.now() });
    }

    recordCacheMiss(url) {
        this.performanceMetrics.hitRates.push({ url, hit: false, timestamp: Date.now() });
    }

    recordNetworkError(url, error) {
        this.performanceMetrics.errors.push({ url, error, timestamp: Date.now() });
    }

    reportPerformanceMetrics() {
        const metrics = {
            hitRate: this.calculateHitRate(),
            averageLoadTime: this.calculateAverageLoadTime(),
            bandwidth: this.calculateBandwidth(),
            errorRate: this.calculateErrorRate(),
            provider: this.currentProvider,
            region: this.getOptimalRegion()
        };
        
        // Report to monitoring service
        if (window.performanceMonitor) {
            window.performanceMonitor.recordMetric('cdn_metrics', {
                ...metrics,
                type: 'cdn',
                category: 'infrastructure'
            });
        }
    }

    monitorWebVitals() {
        // Monitor impact on Core Web Vitals
        if (window.performanceMonitor) {
            const vitals = window.performanceMonitor.getCoreWebVitals();
            
            // Correlate CDN performance with Core Web Vitals
            const correlation = {
                lcp: vitals.lcp?.value || 0,
                fid: vitals.fid?.value || 0,
                cls: vitals.cls?.value || 0,
                cdn_hit_rate: this.calculateHitRate(),
                cdn_avg_load_time: this.calculateAverageLoadTime()
            };
            
            window.performanceMonitor.recordMetric('cdn_vitals_correlation', {
                ...correlation,
                type: 'correlation',
                category: 'performance'
            });
        }
    }

    /**
     * Public API
     */

    // Get optimized asset URLs
    getOptimizedImageUrl(src, options = {}) {
        return this.optimizeImage(src, options);
    }

    getOptimizedFontUrl(fontFamily, options = {}) {
        return this.optimizeFont(fontFamily, options);
    }

    getOptimizedScriptUrl(src, options = {}) {
        return this.optimizeScript(src, options);
    }

    getOptimizedStyleUrl(src, options = {}) {
        return this.optimizeStylesheet(src, options);
    }

    // Preloading API
    preloadCriticalResource(url, type, options = {}) {
        this.preloadResource(url, type, { ...options, priority: 'high' });
    }

    prefetchResource(url, type = 'fetch') {
        if (type === 'fetch') {
            this.prefetchData(url);
        } else {
            this.preloadResource(url, type);
        }
    }

    // Performance API
    getCDNMetrics() {
        return {
            hitRate: this.calculateHitRate(),
            averageLoadTime: this.calculateAverageLoadTime(),
            bandwidth: this.calculateBandwidth(),
            errorRate: this.calculateErrorRate(),
            provider: this.currentProvider,
            region: this.getOptimalRegion(),
            deviceCapabilities: this.deviceCapabilities,
            networkInfo: this.networkInfo
        };
    }

    // Configuration API
    switchProvider(providerName) {
        if (this.config.providers[providerName]) {
            this.currentProvider = providerName;
            this.setupResourceHints(); // Update resource hints
            return true;
        }
        return false;
    }

    updateOptimizationSettings(category, settings) {
        if (this.config.optimization[category]) {
            this.config.optimization[category] = {
                ...this.config.optimization[category],
                ...settings
            };
            return true;
        }
        return false;
    }
}

// Create singleton instance
const cdnService = new CDNOptimizationService();

export default cdnService;