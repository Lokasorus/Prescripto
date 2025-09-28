/**
 * ErrorTrackingService - Comprehensive Error Monitoring and Analysis
 * 
 * Enterprise-grade error tracking system that captures, categorizes, analyzes,
 * and reports all application errors with intelligent grouping, trend analysis,
 * and automated alerting for production applications.
 */

class ErrorTrackingService {
    constructor() {
        this.config = {
            // Error severity levels
            severity: {
                LOW: { level: 0, color: '#28a745', threshold: 10 },
                MEDIUM: { level: 1, color: '#ffc107', threshold: 5 },
                HIGH: { level: 2, color: '#fd7e14', threshold: 3 },
                CRITICAL: { level: 3, color: '#dc3545', threshold: 1 }
            },
            
            // Error categories
            categories: {
                JAVASCRIPT: 'javascript',
                NETWORK: 'network',
                AUTHENTICATION: 'authentication',
                VALIDATION: 'validation',
                BUSINESS_LOGIC: 'business_logic',
                PERFORMANCE: 'performance',
                SECURITY: 'security',
                UNKNOWN: 'unknown'
            },
            
            // Sampling configuration
            sampling: {
                enabled: process.env.NODE_ENV === 'production',
                rate: 0.1, // 10% sampling in production
                criticalAlwaysCapture: true
            },
            
            // Buffering configuration
            buffer: {
                maxSize: 100,
                flushInterval: 30000, // 30 seconds
                maxRetries: 3
            },
            
            // Privacy settings
            privacy: {
                scrubFields: ['password', 'token', 'ssn', 'credit_card'],
                scrubPatterns: [/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g], // Credit card
                maxStackTraceLines: 50
            }
        };

        this.errors = new Map(); // Error instances by ID
        this.errorGroups = new Map(); // Grouped errors by signature
        this.errorBuffer = []; // Buffer for batch sending
        this.errorStats = {
            total: 0,
            byCategory: {},
            bySeverity: {},
            byUrl: {},
            byUserAgent: {}
        };
        
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.userContext = {};
        
        this.initializeErrorTracking();
        this.setupErrorHandlers();
        this.startPeriodicProcessing();
    }

    /**
     * Initialize error tracking
     */
    initializeErrorTracking() {
        // Initialize category stats
        Object.values(this.config.categories).forEach(category => {
            this.errorStats.byCategory[category] = 0;
        });
        
        // Initialize severity stats
        Object.keys(this.config.severity).forEach(severity => {
            this.errorStats.bySeverity[severity] = 0;
        });
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
    }

    /**
     * Set up global error handlers
     */
    setupErrorHandlers() {
        // JavaScript runtime errors
        window.addEventListener('error', (event) => {
            this.captureError(event.error, {
                type: 'javascript_error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                source: 'window.error'
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError(new Error(event.reason), {
                type: 'unhandled_promise_rejection',
                source: 'window.unhandledrejection',
                promise: event.promise
            });
        });

        // Network errors (fetch failures)
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                if (!response.ok) {
                    this.captureError(new Error(`HTTP ${response.status}: ${response.statusText}`), {
                        type: 'network_error',
                        category: this.config.categories.NETWORK,
                        url: args[0],
                        status: response.status,
                        statusText: response.statusText,
                        source: 'fetch'
                    });
                }
                
                return response;
            } catch (error) {
                this.captureError(error, {
                    type: 'network_error',
                    category: this.config.categories.NETWORK,
                    url: args[0],
                    source: 'fetch'
                });
                throw error;
            }
        };

        // Console error override (optional, for development)
        if (process.env.NODE_ENV !== 'production') {
            const originalConsoleError = console.error;
            console.error = (...args) => {
                originalConsoleError(...args);
                
                if (args[0] instanceof Error) {
                    this.captureError(args[0], {
                        type: 'console_error',
                        source: 'console.error',
                        arguments: args.slice(1)
                    });
                }
            };
        }
    }

    /**
     * Set up performance monitoring for error context
     */
    setupPerformanceMonitoring() {
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.duration > 50) { // Tasks longer than 50ms
                            this.captureError(new Error('Long task detected'), {
                                type: 'performance_issue',
                                category: this.config.categories.PERFORMANCE,
                                severity: 'MEDIUM',
                                duration: entry.duration,
                                source: 'performance_observer'
                            });
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                console.warn('Performance monitoring not available:', error);
            }
        }
    }

    /**
     * Capture and process an error
     */
    captureError(error, context = {}) {
        try {
            // Apply sampling (except for critical errors)
            if (this.shouldSample(context)) {
                return;
            }

            const errorData = this.processError(error, context);
            const errorId = this.generateErrorId();
            
            // Add to errors collection
            this.errors.set(errorId, errorData);
            
            // Group similar errors
            this.groupError(errorData);
            
            // Update statistics
            this.updateErrorStats(errorData);
            
            // Add to buffer for sending
            this.addToBuffer(errorData);
            
            // Immediate processing for critical errors
            if (errorData.severity === 'CRITICAL') {
                this.sendImmediateAlert(errorData);
            }
            
            // Emit error event
            this.emitErrorEvent('error.captured', errorData);
            
        } catch (processingError) {
            console.error('Error processing failed:', processingError);
        }
    }

    /**
     * Process raw error into structured format
     */
    processError(error, context = {}) {
        const timestamp = Date.now();
        
        return {
            id: this.generateErrorId(),
            timestamp,
            
            // Error details
            name: error.name || 'UnknownError',
            message: this.scrubSensitiveData(error.message || 'No message'),
            stack: this.processStackTrace(error.stack),
            
            // Classification
            category: context.category || this.categorizeError(error, context),
            severity: context.severity || this.determineSeverity(error, context),
            type: context.type || 'unknown',
            
            // Context information
            url: window.location.href,
            userAgent: navigator.userAgent,
            userId: this.userId,
            sessionId: this.sessionId,
            
            // User context
            userContext: { ...this.userContext },
            
            // Browser context
            browserContext: this.getBrowserContext(),
            
            // Application context
            appContext: this.getApplicationContext(),
            
            // Custom context
            customContext: this.scrubSensitiveData(context),
            
            // Error signature for grouping
            signature: this.generateErrorSignature(error, context),
            
            // Fingerprint for deduplication
            fingerprint: this.generateErrorFingerprint(error, context),
            
            // Metadata
            tags: this.generateErrorTags(error, context),
            breadcrumbs: this.getBreadcrumbs(),
            
            // Performance data
            performance: this.getPerformanceContext(),
            
            // Network state
            networkState: this.getNetworkState()
        };
    }

    /**
     * Generate error signature for grouping
     */
    generateErrorSignature(error, context) {
        const components = [
            error.name || 'UnknownError',
            this.normalizeStackTrace(error.stack),
            context.type || 'unknown'
        ];
        
        return this.hashString(components.join('|'));
    }

    /**
     * Generate error fingerprint for deduplication
     */
    generateErrorFingerprint(error, context) {
        const components = [
            error.message,
            error.stack,
            window.location.pathname,
            context.type
        ];
        
        return this.hashString(components.join('|'));
    }

    /**
     * Categorize error automatically
     */
    categorizeError(error, context) {
        if (context.category) return context.category;
        
        // Network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return this.config.categories.NETWORK;
        }
        
        // Authentication errors
        if (error.message.includes('401') || error.message.includes('authentication')) {
            return this.config.categories.AUTHENTICATION;
        }
        
        // Validation errors
        if (error.message.includes('validation') || error.message.includes('invalid')) {
            return this.config.categories.VALIDATION;
        }
        
        // Performance errors
        if (context.type === 'performance_issue') {
            return this.config.categories.PERFORMANCE;
        }
        
        // Security errors
        if (error.message.includes('security') || error.message.includes('XSS')) {
            return this.config.categories.SECURITY;
        }
        
        // Default to JavaScript error
        return this.config.categories.JAVASCRIPT;
    }

    /**
     * Determine error severity
     */
    determineSeverity(error, context) {
        if (context.severity) return context.severity;
        
        // Critical errors
        if (error.name === 'SecurityError' || 
            context.type === 'security_violation' ||
            error.message.includes('payment')) {
            return 'CRITICAL';
        }
        
        // High severity errors
        if (error.name === 'ReferenceError' ||
            error.name === 'TypeError' ||
            context.type === 'unhandled_promise_rejection') {
            return 'HIGH';
        }
        
        // Medium severity errors
        if (error.name === 'NetworkError' ||
            context.type === 'network_error' ||
            context.type === 'performance_issue') {
            return 'MEDIUM';
        }
        
        // Default to low severity
        return 'LOW';
    }

    /**
     * Process and clean stack trace
     */
    processStackTrace(stack) {
        if (!stack) return null;
        
        const lines = stack.split('\n').slice(0, this.config.privacy.maxStackTraceLines);
        
        return lines.map(line => {
            // Remove absolute paths, keep relative paths
            return line.replace(/https?:\/\/[^\/]+/g, '');
        }).join('\n');
    }

    /**
     * Normalize stack trace for grouping
     */
    normalizeStackTrace(stack) {
        if (!stack) return '';
        
        return stack
            .split('\n')
            .slice(0, 3) // Use only first 3 lines for grouping
            .map(line => line.replace(/:\d+:\d+/g, '')) // Remove line/column numbers
            .join('|');
    }

    /**
     * Scrub sensitive data
     */
    scrubSensitiveData(data) {
        if (typeof data === 'string') {
            let scrubbed = data;
            
            // Scrub patterns
            this.config.privacy.scrubPatterns.forEach(pattern => {
                scrubbed = scrubbed.replace(pattern, '[SCRUBBED]');
            });
            
            return scrubbed;
        }
        
        if (typeof data === 'object' && data !== null) {
            const scrubbed = {};
            
            for (const [key, value] of Object.entries(data)) {
                if (this.config.privacy.scrubFields.some(field => 
                    key.toLowerCase().includes(field.toLowerCase()))) {
                    scrubbed[key] = '[SCRUBBED]';
                } else {
                    scrubbed[key] = this.scrubSensitiveData(value);
                }
            }
            
            return scrubbed;
        }
        
        return data;
    }

    /**
     * Generate error tags
     */
    generateErrorTags(error, context) {
        const tags = [];
        
        // Add browser tags
        tags.push(`browser:${this.getBrowserName()}`);
        tags.push(`platform:${navigator.platform}`);
        
        // Add URL tags
        tags.push(`url:${window.location.pathname}`);
        
        // Add user tags
        if (this.userId) {
            tags.push(`user:${this.userId}`);
        }
        
        // Add context tags
        if (context.type) {
            tags.push(`type:${context.type}`);
        }
        
        return tags;
    }

    /**
     * Get browser context
     */
    getBrowserContext() {
        return {
            name: this.getBrowserName(),
            version: this.getBrowserVersion(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    /**
     * Get application context
     */
    getApplicationContext() {
        return {
            version: process.env.REACT_APP_VERSION || 'unknown',
            environment: process.env.NODE_ENV || 'unknown',
            buildTime: process.env.REACT_APP_BUILD_TIME,
            route: window.location.pathname,
            referrer: document.referrer
        };
    }

    /**
     * Get performance context
     */
    getPerformanceContext() {
        if (!window.performance) return null;
        
        const navigation = performance.getEntriesByType('navigation')[0];
        const memory = performance.memory;
        
        return {
            navigationTiming: navigation ? {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                responseTime: navigation.responseEnd - navigation.requestStart
            } : null,
            memory: memory ? {
                used: memory.usedJSHeapSize,
                total: memory.jsHeapSizeLimit,
                limit: memory.totalJSHeapSize
            } : null
        };
    }

    /**
     * Get network state
     */
    getNetworkState() {
        return {
            onLine: navigator.onLine,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }

    /**
     * Get breadcrumbs (simplified implementation)
     */
    getBreadcrumbs() {
        // This would typically track user actions leading up to the error
        return []; // Placeholder
    }

    /**
     * Group similar errors
     */
    groupError(errorData) {
        const signature = errorData.signature;
        
        if (this.errorGroups.has(signature)) {
            const group = this.errorGroups.get(signature);
            group.count++;
            group.lastSeen = errorData.timestamp;
            group.errors.push(errorData.id);
            
            // Update severity if this error is more severe
            const currentSeverityLevel = this.config.severity[group.severity].level;
            const newSeverityLevel = this.config.severity[errorData.severity].level;
            
            if (newSeverityLevel > currentSeverityLevel) {
                group.severity = errorData.severity;
            }
            
        } else {
            this.errorGroups.set(signature, {
                signature,
                firstSeen: errorData.timestamp,
                lastSeen: errorData.timestamp,
                count: 1,
                severity: errorData.severity,
                category: errorData.category,
                message: errorData.message,
                errors: [errorData.id]
            });
        }
    }

    /**
     * Update error statistics
     */
    updateErrorStats(errorData) {
        this.errorStats.total++;
        
        // By category
        this.errorStats.byCategory[errorData.category] = 
            (this.errorStats.byCategory[errorData.category] || 0) + 1;
        
        // By severity
        this.errorStats.bySeverity[errorData.severity] = 
            (this.errorStats.bySeverity[errorData.severity] || 0) + 1;
        
        // By URL
        const url = errorData.url || 'unknown';
        this.errorStats.byUrl[url] = (this.errorStats.byUrl[url] || 0) + 1;
        
        // By user agent
        const userAgent = this.getBrowserName();
        this.errorStats.byUserAgent[userAgent] = 
            (this.errorStats.byUserAgent[userAgent] || 0) + 1;
    }

    /**
     * Determine if error should be sampled
     */
    shouldSample(context) {
        if (!this.config.sampling.enabled) return false;
        
        // Always capture critical errors
        if (this.config.sampling.criticalAlwaysCapture && 
            context.severity === 'CRITICAL') {
            return false;
        }
        
        return Math.random() > this.config.sampling.rate;
    }

    /**
     * Add error to buffer for batch sending
     */
    addToBuffer(errorData) {
        this.errorBuffer.push(errorData);
        
        if (this.errorBuffer.length >= this.config.buffer.maxSize) {
            this.flushBuffer();
        }
    }

    /**
     * Send immediate alert for critical errors
     */
    async sendImmediateAlert(errorData) {
        try {
            await fetch('/api/errors/alert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    error: errorData,
                    priority: 'immediate'
                })
            });
        } catch (error) {
            console.error('Failed to send immediate alert:', error);
        }
    }

    /**
     * Start periodic processing
     */
    startPeriodicProcessing() {
        // Flush buffer periodically
        setInterval(() => {
            if (this.errorBuffer.length > 0) {
                this.flushBuffer();
            }
        }, this.config.buffer.flushInterval);
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flushBuffer();
        });
    }

    /**
     * Flush error buffer to server
     */
    async flushBuffer() {
        if (this.errorBuffer.length === 0) return;
        
        const errorsToSend = [...this.errorBuffer];
        this.errorBuffer = [];
        
        try {
            await this.sendErrors(errorsToSend);
        } catch (error) {
            console.error('Failed to send errors:', error);
            
            // Put errors back in buffer for retry (with limit)
            if (errorsToSend.length < this.config.buffer.maxRetries * this.config.buffer.maxSize) {
                this.errorBuffer.unshift(...errorsToSend);
            }
        }
    }

    /**
     * Send errors to server
     */
    async sendErrors(errors) {
        const response = await fetch('/api/errors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
                errors,
                sessionId: this.sessionId,
                timestamp: Date.now()
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to send errors: ${response.status} ${response.statusText}`);
        }
    }

    /**
     * Public API methods
     */

    setUser(userId, userContext = {}) {
        this.userId = userId;
        this.userContext = userContext;
    }

    setContext(context) {
        this.userContext = { ...this.userContext, ...context };
    }

    captureException(error, context = {}) {
        this.captureError(error, context);
    }

    captureMessage(message, level = 'INFO', context = {}) {
        const error = new Error(message);
        error.name = 'CapturedMessage';
        
        this.captureError(error, {
            ...context,
            type: 'captured_message',
            severity: level
        });
    }

    addBreadcrumb(breadcrumb) {
        // Implementation for adding breadcrumbs
    }

    getErrorStats() {
        return { ...this.errorStats };
    }

    getErrorGroups() {
        return Array.from(this.errorGroups.values())
            .sort((a, b) => b.lastSeen - a.lastSeen);
    }

    getError(errorId) {
        return this.errors.get(errorId);
    }

    getRecentErrors(limit = 50) {
        return Array.from(this.errors.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Utility methods
     */

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getBrowserName() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';
        
        return 'Unknown';
    }

    getBrowserVersion() {
        // Simplified browser version detection
        return 'unknown';
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    getAuthToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }

    emitErrorEvent(eventName, errorData) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent(eventName, { detail: errorData }));
        }
    }
}

// Create singleton instance
const errorTracker = new ErrorTrackingService();

// Export convenience methods
export const captureError = (error, context) => errorTracker.captureError(error, context);
export const captureException = (error, context) => errorTracker.captureException(error, context);
export const captureMessage = (message, level, context) => errorTracker.captureMessage(message, level, context);
export const setUser = (userId, userContext) => errorTracker.setUser(userId, userContext);
export const setContext = (context) => errorTracker.setContext(context);

export default errorTracker;