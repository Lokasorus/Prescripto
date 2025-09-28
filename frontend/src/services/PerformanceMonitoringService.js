/**
 * PerformanceMonitoringService - Comprehensive Application Performance Monitoring
 * 
 * Enterprise-grade performance monitoring system that tracks all aspects of
 * application performance including page load times, API response times,
 * resource usage, user interactions, and provides detailed performance insights.
 */

class PerformanceMonitoringService {
    constructor() {
        this.config = {
            // Performance thresholds
            thresholds: {
                pageLoad: 3000,           // 3 seconds
                firstContentfulPaint: 2000, // 2 seconds
                largestContentfulPaint: 2500, // 2.5 seconds
                firstInputDelay: 100,     // 100ms
                cumulativeLayoutShift: 0.1, // 0.1 CLS score
                apiResponse: 1000,        // 1 second
                longTask: 50,            // 50ms
                memoryUsage: 0.8         // 80% of available memory
            },
            
            // Monitoring intervals
            intervals: {
                metrics: 10000,    // 10 seconds
                resources: 30000,  // 30 seconds
                memory: 60000      // 1 minute
            },
            
            // Data collection settings
            collection: {
                maxEntries: 1000,
                batchSize: 50,
                flushInterval: 30000,
                enableResourceTiming: true,
                enableUserTiming: true,
                enableNavigationTiming: true
            },
            
            // Sampling configuration
            sampling: {
                enabled: process.env.NODE_ENV === 'production',
                rate: 0.1, // 10% sampling
                alwaysCaptureSlowPages: true
            }
        };

        this.metrics = [];
        this.vitals = {};
        this.resources = new Map();
        this.userInteractions = [];
        this.apiCalls = [];
        this.performanceBuffer = [];
        this.observers = new Map();
        this.timers = new Map();
        
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.pageLoadStart = performance.now();
        
        this.initializePerformanceMonitoring();
        this.setupPerformanceObservers();
        this.trackCoreWebVitals();
        this.startPeriodicCollection();
    }

    /**
     * Initialize performance monitoring
     */
    initializePerformanceMonitoring() {
        // Track initial page load metrics
        this.trackPageLoad();
        
        // Set up API monitoring
        this.setupAPIMonitoring();
        
        // Set up user interaction monitoring
        this.setupUserInteractionMonitoring();
        
        // Set up resource monitoring
        this.setupResourceMonitoring();
        
        // Set up memory monitoring
        this.setupMemoryMonitoring();
    }

    /**
     * Set up Performance Observers
     */
    setupPerformanceObservers() {
        if (!('PerformanceObserver' in window)) {
            console.warn('PerformanceObserver not supported');
            return;
        }

        // Navigation timing
        this.createObserver('navigation', (entries) => {
            entries.forEach(entry => this.processNavigationEntry(entry));
        });

        // Paint timing
        this.createObserver('paint', (entries) => {
            entries.forEach(entry => this.processPaintEntry(entry));
        });

        // Largest Contentful Paint
        this.createObserver('largest-contentful-paint', (entries) => {
            entries.forEach(entry => this.processLCPEntry(entry));
        });

        // First Input Delay
        this.createObserver('first-input', (entries) => {
            entries.forEach(entry => this.processFIDEntry(entry));
        });

        // Layout Shift
        this.createObserver('layout-shift', (entries) => {
            entries.forEach(entry => this.processCLSEntry(entry));
        });

        // Long Tasks
        this.createObserver('longtask', (entries) => {
            entries.forEach(entry => this.processLongTaskEntry(entry));
        });

        // Resource timing
        if (this.config.collection.enableResourceTiming) {
            this.createObserver('resource', (entries) => {
                entries.forEach(entry => this.processResourceEntry(entry));
            });
        }

        // User timing
        if (this.config.collection.enableUserTiming) {
            this.createObserver('measure', (entries) => {
                entries.forEach(entry => this.processUserTimingEntry(entry));
            });
        }
    }

    /**
     * Create Performance Observer
     */
    createObserver(type, callback) {
        try {
            const observer = new PerformanceObserver((list) => {
                callback(list.getEntries());
            });
            
            observer.observe({ entryTypes: [type] });
            this.observers.set(type, observer);
            
        } catch (error) {
            console.warn(`Failed to create observer for ${type}:`, error);
        }
    }

    /**
     * Track Core Web Vitals
     */
    trackCoreWebVitals() {
        // Cumulative Layout Shift
        let clsValue = 0;
        let sessionValue = 0;
        let sessionEntries = [];

        this.vitals.cls = {
            value: 0,
            rating: 'good',
            entries: []
        };

        // First Contentful Paint
        this.vitals.fcp = {
            value: 0,
            rating: 'needs-improvement',
            entries: []
        };

        // Largest Contentful Paint
        this.vitals.lcp = {
            value: 0,
            rating: 'needs-improvement',
            entries: []
        };

        // First Input Delay
        this.vitals.fid = {
            value: 0,
            rating: 'good',
            entries: []
        };

        // Time to Interactive (estimated)
        this.vitals.tti = {
            value: 0,
            rating: 'needs-improvement',
            estimated: true
        };

        // Total Blocking Time
        this.vitals.tbt = {
            value: 0,
            rating: 'needs-improvement',
            entries: []
        };
    }

    /**
     * Track page load performance
     */
    trackPageLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.collectPageLoadMetrics();
            }, 0);
        });

        // Track DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            this.recordMetric('dom_content_loaded', {
                timestamp: performance.now(),
                type: 'timing',
                category: 'page_load'
            });
        });
    }

    /**
     * Collect page load metrics
     */
    collectPageLoadMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return;

        const metrics = {
            // Navigation timing
            redirectTime: navigation.redirectEnd - navigation.redirectStart,
            dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
            connectTime: navigation.connectEnd - navigation.connectStart,
            tlsTime: navigation.secureConnectionStart > 0 ? 
                navigation.connectEnd - navigation.secureConnectionStart : 0,
            requestTime: navigation.responseStart - navigation.requestStart,
            responseTime: navigation.responseEnd - navigation.responseStart,
            
            // Page load times
            domInteractive: navigation.domInteractive,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            
            // Total time
            totalTime: navigation.loadEventEnd - navigation.fetchStart,
            
            // Performance ratings
            rating: this.getPageLoadRating(navigation.loadEventEnd - navigation.fetchStart)
        };

        this.recordMetric('page_load', {
            ...metrics,
            timestamp: Date.now(),
            type: 'navigation',
            category: 'page_load',
            url: window.location.href
        });

        // Check thresholds and alert if necessary
        this.checkPerformanceThresholds(metrics);
    }

    /**
     * Set up API monitoring
     */
    setupAPIMonitoring() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = typeof args[0] === 'string' ? args[0] : args[0].url;
            const method = args[1]?.method || 'GET';
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.recordAPICall({
                    url,
                    method,
                    status: response.status,
                    duration,
                    success: response.ok,
                    size: this.getResponseSize(response),
                    timestamp: Date.now()
                });
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.recordAPICall({
                    url,
                    method,
                    status: 0,
                    duration,
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                });
                
                throw error;
            }
        };
    }

    /**
     * Set up user interaction monitoring
     */
    setupUserInteractionMonitoring() {
        const interactionEvents = ['click', 'input', 'scroll', 'keydown'];
        
        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.recordUserInteraction({
                    type: eventType,
                    target: this.getElementSelector(event.target),
                    timestamp: performance.now(),
                    page: window.location.pathname
                });
            }, { passive: true });
        });
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.recordMetric('visibility_change', {
                hidden: document.hidden,
                timestamp: performance.now(),
                type: 'user_behavior',
                category: 'engagement'
            });
        });
    }

    /**
     * Set up resource monitoring
     */
    setupResourceMonitoring() {
        // Monitor resource loading
        const resourceObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                this.processResourceEntry(entry);
            });
        });
        
        try {
            resourceObserver.observe({ entryTypes: ['resource'] });
        } catch (error) {
            console.warn('Resource monitoring not supported:', error);
        }
    }

    /**
     * Set up memory monitoring
     */
    setupMemoryMonitoring() {
        if (!performance.memory) {
            console.warn('Memory monitoring not available');
            return;
        }
        
        setInterval(() => {
            const memory = performance.memory;
            const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            
            this.recordMetric('memory_usage', {
                used: memory.usedJSHeapSize,
                total: memory.jsHeapSizeLimit,
                limit: memory.totalJSHeapSize,
                usage: usage,
                rating: this.getMemoryRating(usage),
                timestamp: Date.now(),
                type: 'resource',
                category: 'memory'
            });
            
            // Alert on high memory usage
            if (usage > this.config.thresholds.memoryUsage) {
                this.emitPerformanceAlert('high_memory_usage', {
                    usage,
                    threshold: this.config.thresholds.memoryUsage
                });
            }
            
        }, this.config.intervals.memory);
    }

    /**
     * Process Performance Observer entries
     */

    processNavigationEntry(entry) {
        this.recordMetric('navigation_timing', {
            ...entry.toJSON(),
            timestamp: Date.now(),
            type: 'navigation',
            category: 'page_load'
        });
    }

    processPaintEntry(entry) {
        const vitalName = entry.name === 'first-contentful-paint' ? 'fcp' : null;
        
        if (vitalName) {
            this.vitals[vitalName] = {
                value: entry.startTime,
                rating: this.getVitalRating(vitalName, entry.startTime),
                entries: [entry]
            };
        }
        
        this.recordMetric('paint_timing', {
            name: entry.name,
            value: entry.startTime,
            timestamp: Date.now(),
            type: 'paint',
            category: 'rendering'
        });
    }

    processLCPEntry(entry) {
        this.vitals.lcp = {
            value: entry.startTime,
            rating: this.getVitalRating('lcp', entry.startTime),
            entries: [entry],
            element: this.getElementSelector(entry.element)
        };
        
        this.recordMetric('largest_contentful_paint', {
            value: entry.startTime,
            element: this.getElementSelector(entry.element),
            timestamp: Date.now(),
            type: 'paint',
            category: 'rendering'
        });
    }

    processFIDEntry(entry) {
        this.vitals.fid = {
            value: entry.processingStart - entry.startTime,
            rating: this.getVitalRating('fid', entry.processingStart - entry.startTime),
            entries: [entry]
        };
        
        this.recordMetric('first_input_delay', {
            delay: entry.processingStart - entry.startTime,
            eventType: entry.name,
            timestamp: Date.now(),
            type: 'interaction',
            category: 'responsiveness'
        });
    }

    processCLSEntry(entry) {
        if (!entry.hadRecentInput) {
            this.vitals.cls.value += entry.value;
            this.vitals.cls.entries.push(entry);
            this.vitals.cls.rating = this.getVitalRating('cls', this.vitals.cls.value);
            
            this.recordMetric('cumulative_layout_shift', {
                value: entry.value,
                total: this.vitals.cls.value,
                sources: entry.sources.map(source => this.getElementSelector(source.node)),
                timestamp: Date.now(),
                type: 'layout',
                category: 'visual_stability'
            });
        }
    }

    processLongTaskEntry(entry) {
        this.vitals.tbt.value += Math.max(0, entry.duration - 50);
        this.vitals.tbt.entries.push(entry);
        
        this.recordMetric('long_task', {
            duration: entry.duration,
            attribution: entry.attribution,
            timestamp: Date.now(),
            type: 'task',
            category: 'responsiveness'
        });
        
        // Alert on long tasks
        if (entry.duration > this.config.thresholds.longTask * 2) {
            this.emitPerformanceAlert('long_task_detected', {
                duration: entry.duration,
                threshold: this.config.thresholds.longTask
            });
        }
    }

    processResourceEntry(entry) {
        const resource = {
            name: entry.name,
            type: this.getResourceType(entry),
            duration: entry.responseEnd - entry.requestStart,
            size: entry.transferSize,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            timestamp: Date.now()
        };
        
        this.resources.set(entry.name, resource);
        
        this.recordMetric('resource_timing', {
            ...resource,
            timing: {
                dns: entry.domainLookupEnd - entry.domainLookupStart,
                connect: entry.connectEnd - entry.connectStart,
                request: entry.responseStart - entry.requestStart,
                response: entry.responseEnd - entry.responseStart
            },
            type: 'resource',
            category: 'loading'
        });
    }

    processUserTimingEntry(entry) {
        this.recordMetric('user_timing', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now(),
            type: 'user_timing',
            category: 'custom'
        });
    }

    /**
     * Record performance metric
     */
    recordMetric(name, data) {
        const metric = {
            id: this.generateMetricId(),
            name,
            ...data,
            sessionId: this.sessionId,
            userId: this.userId,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.metrics.push(metric);
        this.addToBuffer(metric);
        
        // Limit metrics array size
        if (this.metrics.length > this.config.collection.maxEntries) {
            this.metrics.splice(0, 100);
        }
        
        this.emitPerformanceEvent('metric.recorded', metric);
    }

    /**
     * Record API call performance
     */
    recordAPICall(data) {
        const apiCall = {
            id: this.generateMetricId(),
            ...data,
            sessionId: this.sessionId,
            userId: this.userId,
            rating: this.getAPIRating(data.duration)
        };
        
        this.apiCalls.push(apiCall);
        
        // Alert on slow API calls
        if (data.duration > this.config.thresholds.apiResponse) {
            this.emitPerformanceAlert('slow_api_call', {
                url: data.url,
                duration: data.duration,
                threshold: this.config.thresholds.apiResponse
            });
        }
        
        this.recordMetric('api_call', {
            ...apiCall,
            type: 'api',
            category: 'network'
        });
    }

    /**
     * Record user interaction
     */
    recordUserInteraction(data) {
        const interaction = {
            id: this.generateMetricId(),
            ...data,
            sessionId: this.sessionId,
            userId: this.userId
        };
        
        this.userInteractions.push(interaction);
        
        // Limit interactions array size
        if (this.userInteractions.length > 500) {
            this.userInteractions.splice(0, 50);
        }
    }

    /**
     * Start periodic data collection
     */
    startPeriodicCollection() {
        // Collect metrics periodically
        setInterval(() => {
            this.collectPeriodicMetrics();
        }, this.config.intervals.metrics);
        
        // Flush buffer periodically
        setInterval(() => {
            if (this.performanceBuffer.length > 0) {
                this.flushBuffer();
            }
        }, this.config.collection.flushInterval);
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flushBuffer();
        });
    }

    /**
     * Collect periodic metrics
     */
    collectPeriodicMetrics() {
        // Collect current performance state
        const currentMetrics = {
            timestamp: Date.now(),
            vitals: { ...this.vitals },
            resourceCount: this.resources.size,
            interactionCount: this.userInteractions.length,
            apiCallCount: this.apiCalls.length
        };
        
        this.recordMetric('periodic_snapshot', {
            ...currentMetrics,
            type: 'snapshot',
            category: 'monitoring'
        });
    }

    /**
     * Performance rating methods
     */

    getPageLoadRating(loadTime) {
        if (loadTime < 1000) return 'excellent';
        if (loadTime < 2500) return 'good';
        if (loadTime < 4000) return 'needs-improvement';
        return 'poor';
    }

    getVitalRating(vital, value) {
        const thresholds = {
            fcp: { good: 1800, poor: 3000 },
            lcp: { good: 2500, poor: 4000 },
            fid: { good: 100, poor: 300 },
            cls: { good: 0.1, poor: 0.25 }
        };
        
        const threshold = thresholds[vital];
        if (!threshold) return 'unknown';
        
        if (value <= threshold.good) return 'good';
        if (value <= threshold.poor) return 'needs-improvement';
        return 'poor';
    }

    getAPIRating(duration) {
        if (duration < 200) return 'excellent';
        if (duration < 500) return 'good';
        if (duration < 1000) return 'fair';
        return 'poor';
    }

    getMemoryRating(usage) {
        if (usage < 0.5) return 'excellent';
        if (usage < 0.7) return 'good';
        if (usage < 0.85) return 'fair';
        return 'poor';
    }

    /**
     * Performance analysis methods
     */

    getPerformanceSummary() {
        return {
            vitals: this.vitals,
            pageLoad: this.getPageLoadSummary(),
            apiPerformance: this.getAPIPerformanceSummary(),
            resources: this.getResourceSummary(),
            interactions: this.getUserInteractionSummary(),
            issues: this.getPerformanceIssues()
        };
    }

    getPageLoadSummary() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return null;
        
        return {
            totalTime: navigation.loadEventEnd - navigation.fetchStart,
            dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
            connectTime: navigation.connectEnd - navigation.connectStart,
            responseTime: navigation.responseEnd - navigation.responseStart,
            domProcessingTime: navigation.domInteractive - navigation.responseEnd,
            rating: this.getPageLoadRating(navigation.loadEventEnd - navigation.fetchStart)
        };
    }

    getAPIPerformanceSummary() {
        if (this.apiCalls.length === 0) return null;
        
        const durations = this.apiCalls.map(call => call.duration);
        const successRate = this.apiCalls.filter(call => call.success).length / this.apiCalls.length;
        
        return {
            totalCalls: this.apiCalls.length,
            averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
            medianResponseTime: this.getMedian(durations),
            slowestCall: Math.max(...durations),
            fastestCall: Math.min(...durations),
            successRate,
            errorRate: 1 - successRate
        };
    }

    getResourceSummary() {
        const resources = Array.from(this.resources.values());
        
        if (resources.length === 0) return null;
        
        const totalSize = resources.reduce((sum, resource) => sum + (resource.size || 0), 0);
        const cachedCount = resources.filter(resource => resource.cached).length;
        
        return {
            totalResources: resources.length,
            totalSize,
            cachedResources: cachedCount,
            cacheHitRate: cachedCount / resources.length,
            resourceTypes: this.groupResourcesByType(resources)
        };
    }

    getUserInteractionSummary() {
        if (this.userInteractions.length === 0) return null;
        
        const interactionTypes = {};
        this.userInteractions.forEach(interaction => {
            interactionTypes[interaction.type] = (interactionTypes[interaction.type] || 0) + 1;
        });
        
        return {
            totalInteractions: this.userInteractions.length,
            interactionTypes,
            firstInteraction: this.userInteractions[0]?.timestamp,
            lastInteraction: this.userInteractions[this.userInteractions.length - 1]?.timestamp
        };
    }

    getPerformanceIssues() {
        const issues = [];
        
        // Check Core Web Vitals
        if (this.vitals.lcp.rating === 'poor') {
            issues.push({
                type: 'core_web_vital',
                metric: 'Largest Contentful Paint',
                value: this.vitals.lcp.value,
                threshold: 2500,
                severity: 'high'
            });
        }
        
        if (this.vitals.fid.rating === 'poor') {
            issues.push({
                type: 'core_web_vital',
                metric: 'First Input Delay',
                value: this.vitals.fid.value,
                threshold: 100,
                severity: 'high'
            });
        }
        
        if (this.vitals.cls.rating === 'poor') {
            issues.push({
                type: 'core_web_vital',
                metric: 'Cumulative Layout Shift',
                value: this.vitals.cls.value,
                threshold: 0.1,
                severity: 'medium'
            });
        }
        
        // Check for slow API calls
        const slowAPICalls = this.apiCalls.filter(call => 
            call.duration > this.config.thresholds.apiResponse
        );
        
        if (slowAPICalls.length > 0) {
            issues.push({
                type: 'slow_api',
                count: slowAPICalls.length,
                averageDuration: slowAPICalls.reduce((sum, call) => sum + call.duration, 0) / slowAPICalls.length,
                threshold: this.config.thresholds.apiResponse,
                severity: 'medium'
            });
        }
        
        return issues;
    }

    /**
     * Utility methods
     */

    addToBuffer(metric) {
        // Apply sampling
        if (this.shouldSample(metric)) {
            return;
        }
        
        this.performanceBuffer.push(metric);
        
        if (this.performanceBuffer.length >= this.config.collection.batchSize) {
            this.flushBuffer();
        }
    }

    shouldSample(metric) {
        if (!this.config.sampling.enabled) return false;
        
        // Always capture slow pages
        if (this.config.sampling.alwaysCaptureSlowPages && 
            metric.category === 'page_load' && 
            metric.rating === 'poor') {
            return false;
        }
        
        return Math.random() > this.config.sampling.rate;
    }

    async flushBuffer() {
        if (this.performanceBuffer.length === 0) return;
        
        const metricsToSend = [...this.performanceBuffer];
        this.performanceBuffer = [];
        
        try {
            await this.sendMetrics(metricsToSend);
        } catch (error) {
            console.error('Failed to send performance metrics:', error);
        }
    }

    async sendMetrics(metrics) {
        const response = await fetch('/api/performance/metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
                metrics,
                sessionId: this.sessionId,
                timestamp: Date.now()
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to send metrics: ${response.status}`);
        }
    }

    checkPerformanceThresholds(metrics) {
        Object.entries(this.config.thresholds).forEach(([metric, threshold]) => {
            if (metrics[metric] && metrics[metric] > threshold) {
                this.emitPerformanceAlert(`${metric}_threshold_exceeded`, {
                    metric,
                    value: metrics[metric],
                    threshold
                });
            }
        });
    }

    /**
     * Helper methods
     */

    getElementSelector(element) {
        if (!element) return null;
        
        // Generate a simple CSS selector
        let selector = element.tagName.toLowerCase();
        
        if (element.id) {
            selector += `#${element.id}`;
        } else if (element.className) {
            selector += `.${element.className.split(' ').join('.')}`;
        }
        
        return selector;
    }

    getResourceType(entry) {
        if (entry.initiatorType) return entry.initiatorType;
        
        const url = new URL(entry.name);
        const extension = url.pathname.split('.').pop().toLowerCase();
        
        const typeMap = {
            js: 'script',
            css: 'stylesheet',
            png: 'image',
            jpg: 'image',
            jpeg: 'image',
            gif: 'image',
            svg: 'image',
            woff: 'font',
            woff2: 'font',
            ttf: 'font'
        };
        
        return typeMap[extension] || 'other';
    }

    getResponseSize(response) {
        const contentLength = response.headers.get('content-length');
        return contentLength ? parseInt(contentLength, 10) : null;
    }

    getMedian(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        return sorted.length % 2 !== 0 
            ? sorted[mid] 
            : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    groupResourcesByType(resources) {
        const types = {};
        
        resources.forEach(resource => {
            types[resource.type] = (types[resource.type] || 0) + 1;
        });
        
        return types;
    }

    generateSessionId() {
        return `perf_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateMetricId() {
        return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getAuthToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }

    emitPerformanceEvent(eventName, data) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
        }
    }

    emitPerformanceAlert(alertType, data) {
        this.emitPerformanceEvent('performance.alert', { alertType, ...data });
    }

    /**
     * Public API methods
     */

    setUser(userId) {
        this.userId = userId;
    }

    mark(name) {
        performance.mark(name);
    }

    measure(name, startMark, endMark) {
        try {
            performance.measure(name, startMark, endMark);
        } catch (error) {
            console.warn('Performance measure failed:', error);
        }
    }

    getMetrics(category = null, limit = 100) {
        let metrics = [...this.metrics];
        
        if (category) {
            metrics = metrics.filter(metric => metric.category === category);
        }
        
        return metrics
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    getCoreWebVitals() {
        return { ...this.vitals };
    }

    getAPIMetrics() {
        return [...this.apiCalls];
    }

    getResourceMetrics() {
        return Array.from(this.resources.values());
    }

    /**
     * Cleanup method
     */
    destroy() {
        // Disconnect observers
        for (const observer of this.observers.values()) {
            observer.disconnect();
        }
        
        // Clear timers
        for (const timer of this.timers.values()) {
            clearInterval(timer);
        }
        
        // Clear data
        this.observers.clear();
        this.timers.clear();
        this.metrics = [];
        this.performanceBuffer = [];
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitoringService();

export default performanceMonitor;