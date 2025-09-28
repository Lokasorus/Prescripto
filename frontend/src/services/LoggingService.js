/**
 * LoggingService - Comprehensive Production Logging Infrastructure
 * 
 * Enterprise-grade logging service with structured logging, log aggregation,
 * correlation tracking, sampling, and multiple transport mechanisms for
 * production monitoring and debugging.
 */

class LoggingService {
    constructor() {
        this.config = {
            // Environment configuration
            environment: process.env.NODE_ENV || 'development',
            appName: 'prescripto-frontend',
            version: process.env.REACT_APP_VERSION || '1.0.0',
            
            // Logging levels
            levels: {
                ERROR: 0,
                WARN: 1,
                INFO: 2,
                DEBUG: 3,
                TRACE: 4
            },
            
            // Production configuration
            maxLogLevel: process.env.NODE_ENV === 'production' ? 2 : 4,
            batchSize: 50,
            flushInterval: 5000, // 5 seconds
            maxRetries: 3,
            
            // Transport endpoints
            endpoints: {
                logs: process.env.REACT_APP_LOGS_ENDPOINT || '/api/logs',
                errors: process.env.REACT_APP_ERRORS_ENDPOINT || '/api/errors',
                metrics: process.env.REACT_APP_METRICS_ENDPOINT || '/api/metrics'
            }
        };

        this.logBuffer = [];
        this.correlationId = this.generateCorrelationId();
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.metadata = this.collectSystemMetadata();
        
        this.initializeTransports();
        this.setupPeriodicFlush();
        this.setupErrorHandlers();
    }

    /**
     * Initialize logging transports
     */
    initializeTransports() {
        this.transports = [];
        
        // Console transport for development
        if (this.config.environment !== 'production') {
            this.transports.push({
                name: 'console',
                log: this.consoleTransport.bind(this)
            });
        }
        
        // HTTP transport for production
        this.transports.push({
            name: 'http',
            log: this.httpTransport.bind(this)
        });
        
        // Local storage transport for offline scenarios
        this.transports.push({
            name: 'localStorage',
            log: this.localStorageTransport.bind(this)
        });
    }

    /**
     * Set user context for logging
     */
    setUserContext(userId, userProfile = {}) {
        this.userId = userId;
        this.userProfile = {
            id: userId,
            type: userProfile.type || 'patient',
            subscription: userProfile.subscription || 'free',
            location: userProfile.location || 'unknown'
        };
    }

    /**
     * Log error with full context
     */
    error(message, error, context = {}) {
        const logEntry = this.createLogEntry('ERROR', message, {
            ...context,
            error: this.serializeError(error),
            stackTrace: error?.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        
        this.processLog(logEntry);
        
        // Immediate error reporting for critical errors
        this.reportError(logEntry);
    }

    /**
     * Log warning
     */
    warn(message, context = {}) {
        const logEntry = this.createLogEntry('WARN', message, context);
        this.processLog(logEntry);
    }

    /**
     * Log info
     */
    info(message, context = {}) {
        const logEntry = this.createLogEntry('INFO', message, context);
        this.processLog(logEntry);
    }

    /**
     * Log debug information
     */
    debug(message, context = {}) {
        const logEntry = this.createLogEntry('DEBUG', message, context);
        this.processLog(logEntry);
    }

    /**
     * Log trace information
     */
    trace(message, context = {}) {
        const logEntry = this.createLogEntry('TRACE', message, context);
        this.processLog(logEntry);
    }

    /**
     * Log user action with context
     */
    logUserAction(action, context = {}) {
        this.info(`User Action: ${action}`, {
            ...context,
            category: 'user_action',
            userId: this.userId,
            sessionId: this.sessionId,
            timestamp: Date.now()
        });
    }

    /**
     * Log performance metrics
     */
    logPerformance(metric, value, context = {}) {
        this.info(`Performance: ${metric}`, {
            ...context,
            category: 'performance',
            metric,
            value,
            timestamp: Date.now()
        });
    }

    /**
     * Log business event
     */
    logBusinessEvent(event, data = {}) {
        this.info(`Business Event: ${event}`, {
            ...data,
            category: 'business',
            event,
            userId: this.userId,
            sessionId: this.sessionId,
            timestamp: Date.now()
        });
    }

    /**
     * Log security event
     */
    logSecurityEvent(event, context = {}) {
        const logEntry = this.createLogEntry('WARN', `Security Event: ${event}`, {
            ...context,
            category: 'security',
            event,
            timestamp: Date.now(),
            severity: 'high'
        });
        
        this.processLog(logEntry);
        
        // Immediate security alert
        this.reportSecurityEvent(logEntry);
    }

    /**
     * Create structured log entry
     */
    createLogEntry(level, message, context = {}) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            correlationId: this.correlationId,
            sessionId: this.sessionId,
            userId: this.userId,
            userProfile: this.userProfile,
            environment: this.config.environment,
            appName: this.config.appName,
            version: this.config.version,
            metadata: {
                ...this.metadata,
                ...context
            },
            id: this.generateLogId()
        };
    }

    /**
     * Process log entry through transports
     */
    processLog(logEntry) {
        // Check log level
        if (this.config.levels[logEntry.level] > this.config.maxLogLevel) {
            return;
        }

        // Add to buffer
        this.logBuffer.push(logEntry);

        // Process through transports
        this.transports.forEach(transport => {
            try {
                transport.log(logEntry);
            } catch (error) {
                console.error(`Transport error (${transport.name}):`, error);
            }
        });

        // Flush if buffer is full
        if (this.logBuffer.length >= this.config.batchSize) {
            this.flushLogs();
        }
    }

    /**
     * Console transport
     */
    consoleTransport(logEntry) {
        const { level, message, metadata } = logEntry;
        const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
        
        const logMethod = {
            ERROR: 'error',
            WARN: 'warn',
            INFO: 'info',
            DEBUG: 'log',
            TRACE: 'log'
        }[level] || 'log';

        console[logMethod](
            `[${timestamp}] ${level}: ${message}`,
            metadata
        );
    }

    /**
     * HTTP transport for production logging
     */
    async httpTransport(logEntry) {
        // Don't send immediately, use batching
        return;
    }

    /**
     * Local storage transport for offline scenarios
     */
    localStorageTransport(logEntry) {
        try {
            const storageKey = `prescripto_logs_${new Date().toDateString()}`;
            const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            existingLogs.push(logEntry);
            
            // Keep only last 100 logs per day
            if (existingLogs.length > 100) {
                existingLogs.splice(0, existingLogs.length - 100);
            }
            
            localStorage.setItem(storageKey, JSON.stringify(existingLogs));
        } catch (error) {
            console.error('Local storage logging error:', error);
        }
    }

    /**
     * Flush logs to remote endpoints
     */
    async flushLogs() {
        if (this.logBuffer.length === 0) return;

        const logsToSend = [...this.logBuffer];
        this.logBuffer = [];

        try {
            await fetch(this.config.endpoints.logs, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    logs: logsToSend,
                    correlationId: this.correlationId,
                    sessionId: this.sessionId
                })
            });
        } catch (error) {
            console.error('Failed to flush logs:', error);
            // Put logs back in buffer for retry
            this.logBuffer.unshift(...logsToSend);
        }
    }

    /**
     * Report critical error immediately
     */
    async reportError(logEntry) {
        try {
            await fetch(this.config.endpoints.errors, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    error: logEntry,
                    priority: 'high',
                    correlationId: this.correlationId
                })
            });
        } catch (error) {
            console.error('Failed to report error:', error);
        }
    }

    /**
     * Report security event immediately
     */
    async reportSecurityEvent(logEntry) {
        try {
            await fetch('/api/security/alert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    event: logEntry,
                    priority: 'critical',
                    correlationId: this.correlationId
                })
            });
        } catch (error) {
            console.error('Failed to report security event:', error);
        }
    }

    /**
     * Serialize error object
     */
    serializeError(error) {
        if (!error) return null;
        
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            status: error.status,
            response: error.response?.data
        };
    }

    /**
     * Collect system metadata
     */
    collectSystemMetadata() {
        return {
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
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            connectionType: navigator.connection?.effectiveType
        };
    }

    /**
     * Setup periodic log flushing
     */
    setupPeriodicFlush() {
        setInterval(() => {
            this.flushLogs();
        }, this.config.flushInterval);

        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flushLogs();
        });

        // Flush on visibility change (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.flushLogs();
            }
        });
    }

    /**
     * Setup global error handlers
     */
    setupErrorHandlers() {
        // Unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.error('Unhandled JavaScript Error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled Promise Rejection', event.reason, {
                promise: event.promise
            });
        });

        // React error boundary support
        if (window.ErrorBoundary) {
            window.ErrorBoundary.onError = (error, errorInfo) => {
                this.error('React Error Boundary', error, errorInfo);
            };
        }
    }

    /**
     * Generate correlation ID for request tracking
     */
    generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique log ID
     */
    generateLogId() {
        return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get authentication token
     */
    getAuthToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }

    /**
     * Create child logger with additional context
     */
    child(context = {}) {
        const childLogger = Object.create(this);
        childLogger.defaultContext = context;
        
        // Override log creation to include default context
        const originalCreateLogEntry = childLogger.createLogEntry;
        childLogger.createLogEntry = (level, message, additionalContext = {}) => {
            return originalCreateLogEntry.call(this, level, message, {
                ...context,
                ...additionalContext
            });
        };
        
        return childLogger;
    }

    /**
     * Get logs from local storage for debugging
     */
    getLocalLogs(date = new Date().toDateString()) {
        const storageKey = `prescripto_logs_${date}`;
        return JSON.parse(localStorage.getItem(storageKey) || '[]');
    }

    /**
     * Clear local logs
     */
    clearLocalLogs(date = new Date().toDateString()) {
        const storageKey = `prescripto_logs_${date}`;
        localStorage.removeItem(storageKey);
    }

    /**
     * Export logs for debugging
     */
    exportLogs() {
        const logs = this.getLocalLogs();
        const blob = new Blob([JSON.stringify(logs, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescripto-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Create singleton instance
const logger = new LoggingService();

// Export convenience methods
export const log = {
    error: (message, error, context) => logger.error(message, error, context),
    warn: (message, context) => logger.warn(message, context),
    info: (message, context) => logger.info(message, context),
    debug: (message, context) => logger.debug(message, context),
    trace: (message, context) => logger.trace(message, context),
    
    // Specialized logging methods
    userAction: (action, context) => logger.logUserAction(action, context),
    performance: (metric, value, context) => logger.logPerformance(metric, value, context),
    business: (event, data) => logger.logBusinessEvent(event, data),
    security: (event, context) => logger.logSecurityEvent(event, context),
    
    // Utilities
    setUser: (userId, profile) => logger.setUserContext(userId, profile),
    child: (context) => logger.child(context),
    export: () => logger.exportLogs(),
    flush: () => logger.flushLogs()
};

export { LoggingService };
export default logger;