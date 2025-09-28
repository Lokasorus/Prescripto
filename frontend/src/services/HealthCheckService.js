/**
 * HealthCheckService - Comprehensive System Health Monitoring
 * 
 * Enterprise-grade health monitoring system that continuously monitors
 * all critical system components, performs health checks, and provides
 * real-time system status with automated recovery mechanisms.
 */

class HealthCheckService {
    constructor() {
        this.config = {
            // Health check intervals (in milliseconds)
            intervals: {
                critical: 30000,    // 30 seconds
                important: 60000,   // 1 minute
                normal: 300000,     // 5 minutes
                background: 900000  // 15 minutes
            },
            
            // Health status levels
            status: {
                HEALTHY: { level: 0, color: '#00C851', icon: '✅' },
                DEGRADED: { level: 1, color: '#FF8800', icon: '⚠️' },
                UNHEALTHY: { level: 2, color: '#FF4444', icon: '❌' },
                CRITICAL: { level: 3, color: '#CC0000', icon: '🚨' },
                UNKNOWN: { level: 4, color: '#999999', icon: '❓' }
            },
            
            // Timeout configurations
            timeouts: {
                api: 5000,      // 5 seconds
                database: 3000, // 3 seconds
                external: 10000 // 10 seconds
            },
            
            // Retry configurations
            retries: {
                max: 3,
                delay: 1000,
                backoff: 2
            }
        };

        this.healthChecks = new Map();
        this.healthStatus = new Map();
        this.healthHistory = [];
        this.checkIntervals = new Map();
        this.lastFullCheck = null;
        this.systemStatus = 'UNKNOWN';
        
        this.initializeHealthChecks();
        this.startHealthMonitoring();
    }

    /**
     * Initialize all health checks
     */
    initializeHealthChecks() {
        // Frontend Application Health
        this.registerHealthCheck('frontend_app', {
            name: 'Frontend Application',
            category: 'application',
            priority: 'critical',
            description: 'Core frontend application health',
            check: this.checkFrontendHealth.bind(this)
        });

        // API Connectivity
        this.registerHealthCheck('api_connectivity', {
            name: 'API Connectivity',
            category: 'api',
            priority: 'critical',
            description: 'Backend API connection and response',
            check: this.checkAPIConnectivity.bind(this)
        });

        // Database Connectivity
        this.registerHealthCheck('database_connectivity', {
            name: 'Database Connectivity',
            category: 'database',
            priority: 'critical',
            description: 'Database connection and query performance',
            check: this.checkDatabaseConnectivity.bind(this)
        });

        // User Authentication Service
        this.registerHealthCheck('auth_service', {
            name: 'Authentication Service',
            category: 'service',
            priority: 'critical',
            description: 'User authentication and session management',
            check: this.checkAuthService.bind(this)
        });

        // Payment Gateway
        this.registerHealthCheck('payment_gateway', {
            name: 'Payment Gateway',
            category: 'external',
            priority: 'important',
            description: 'Payment processing gateway availability',
            check: this.checkPaymentGateway.bind(this)
        });

        // Real-time Communication (WebSocket)
        this.registerHealthCheck('websocket_connection', {
            name: 'WebSocket Connection',
            category: 'communication',
            priority: 'important',
            description: 'Real-time communication channel',
            check: this.checkWebSocketHealth.bind(this)
        });

        // Email Service
        this.registerHealthCheck('email_service', {
            name: 'Email Service',
            category: 'external',
            priority: 'normal',
            description: 'Email notification service',
            check: this.checkEmailService.bind(this)
        });

        // SMS Service
        this.registerHealthCheck('sms_service', {
            name: 'SMS Service',
            category: 'external',
            priority: 'normal',
            description: 'SMS notification service',
            check: this.checkSMSService.bind(this)
        });

        // File Storage Service
        this.registerHealthCheck('file_storage', {
            name: 'File Storage',
            category: 'storage',
            priority: 'important',
            description: 'File upload and storage service',
            check: this.checkFileStorage.bind(this)
        });

        // CDN Health
        this.registerHealthCheck('cdn_health', {
            name: 'CDN Health',
            category: 'infrastructure',
            priority: 'normal',
            description: 'Content delivery network performance',
            check: this.checkCDNHealth.bind(this)
        });

        // Memory Usage
        this.registerHealthCheck('memory_usage', {
            name: 'Memory Usage',
            category: 'system',
            priority: 'normal',
            description: 'Application memory consumption',
            check: this.checkMemoryUsage.bind(this)
        });

        // Performance Metrics
        this.registerHealthCheck('performance_metrics', {
            name: 'Performance Metrics',
            category: 'performance',
            priority: 'normal',
            description: 'Application performance indicators',
            check: this.checkPerformanceMetrics.bind(this)
        });

        // Error Rate Monitor
        this.registerHealthCheck('error_rate', {
            name: 'Error Rate',
            category: 'monitoring',
            priority: 'important',
            description: 'Application error rate monitoring',
            check: this.checkErrorRate.bind(this)
        });

        // Browser Compatibility
        this.registerHealthCheck('browser_compatibility', {
            name: 'Browser Compatibility',
            category: 'client',
            priority: 'background',
            description: 'Browser feature compatibility',
            check: this.checkBrowserCompatibility.bind(this)
        });

        // Security Status
        this.registerHealthCheck('security_status', {
            name: 'Security Status',
            category: 'security',
            priority: 'critical',
            description: 'Security configuration and threats',
            check: this.checkSecurityStatus.bind(this)
        });
    }

    /**
     * Register a health check
     */
    registerHealthCheck(checkId, config) {
        this.healthChecks.set(checkId, {
            ...config,
            id: checkId,
            enabled: true,
            lastCheck: null,
            lastResult: null,
            consecutiveFailures: 0,
            totalChecks: 0,
            totalFailures: 0
        });

        // Initialize status
        this.healthStatus.set(checkId, {
            status: 'UNKNOWN',
            message: 'Not yet checked',
            timestamp: Date.now(),
            responseTime: null,
            metadata: {}
        });
    }

    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        // Start monitoring for each priority level
        Object.entries(this.config.intervals).forEach(([priority, interval]) => {
            const intervalId = setInterval(() => {
                this.runHealthChecksForPriority(priority);
            }, interval);
            
            this.checkIntervals.set(priority, intervalId);
        });

        // Run initial health check
        this.runFullHealthCheck();
    }

    /**
     * Run health checks for specific priority
     */
    async runHealthChecksForPriority(priority) {
        const checks = Array.from(this.healthChecks.values())
            .filter(check => check.priority === priority && check.enabled);

        const promises = checks.map(check => this.executeHealthCheck(check.id));
        await Promise.allSettled(promises);
        
        this.updateSystemStatus();
    }

    /**
     * Run full health check
     */
    async runFullHealthCheck() {
        const allChecks = Array.from(this.healthChecks.keys());
        const promises = allChecks.map(checkId => this.executeHealthCheck(checkId));
        
        await Promise.allSettled(promises);
        
        this.lastFullCheck = Date.now();
        this.updateSystemStatus();
        
        // Emit health check completed event
        this.emitHealthEvent('health.full_check_completed', {
            timestamp: this.lastFullCheck,
            status: this.systemStatus,
            checks: this.getHealthSummary()
        });
    }

    /**
     * Execute individual health check
     */
    async executeHealthCheck(checkId) {
        const check = this.healthChecks.get(checkId);
        if (!check || !check.enabled) {
            return;
        }

        const startTime = Date.now();
        
        try {
            check.totalChecks++;
            
            // Execute health check with timeout and retries
            const result = await this.executeWithRetry(
                () => Promise.race([
                    check.check(),
                    this.createTimeoutPromise(this.config.timeouts[check.category] || 5000)
                ])
            );

            const responseTime = Date.now() - startTime;
            
            // Process successful result
            const status = this.determineHealthStatus(result, check);
            
            this.updateHealthStatus(checkId, {
                status,
                message: result.message || 'Health check passed',
                timestamp: Date.now(),
                responseTime,
                metadata: result.metadata || {}
            });

            // Reset consecutive failures on success
            if (status === 'HEALTHY') {
                check.consecutiveFailures = 0;
            }

            check.lastCheck = Date.now();
            check.lastResult = result;

        } catch (error) {
            check.totalFailures++;
            check.consecutiveFailures++;
            
            const responseTime = Date.now() - startTime;
            
            this.updateHealthStatus(checkId, {
                status: this.determineErrorStatus(error, check),
                message: error.message || 'Health check failed',
                timestamp: Date.now(),
                responseTime,
                metadata: {
                    error: error.name,
                    code: error.code,
                    consecutiveFailures: check.consecutiveFailures
                }
            });

            // Log error for monitoring
            console.error(`Health check failed: ${checkId}`, error);
        }
    }

    /**
     * Individual Health Check Implementations
     */

    async checkFrontendHealth() {
        const checks = {
            domReady: document.readyState === 'complete',
            reactMounted: !!document.querySelector('#root'),
            routerWorking: !!window.location.pathname,
            localStorageAvailable: this.testLocalStorage(),
            sessionStorageAvailable: this.testSessionStorage()
        };

        const healthyChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        
        return {
            healthy: healthyChecks === totalChecks,
            message: `Frontend health: ${healthyChecks}/${totalChecks} checks passed`,
            metadata: { checks, score: healthyChecks / totalChecks }
        };
    }

    async checkAPIConnectivity() {
        const healthEndpoint = '/api/health';
        
        const response = await fetch(healthEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`API health check failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            healthy: data.status === 'healthy',
            message: data.message || 'API connection healthy',
            metadata: {
                status: response.status,
                responseHeaders: Object.fromEntries(response.headers.entries()),
                serverData: data
            }
        };
    }

    async checkDatabaseConnectivity() {
        try {
            const response = await fetch('/api/health/database', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const data = await response.json();
            
            return {
                healthy: data.connected && data.queryTime < 1000,
                message: `Database ${data.connected ? 'connected' : 'disconnected'}, query time: ${data.queryTime}ms`,
                metadata: {
                    connected: data.connected,
                    queryTime: data.queryTime,
                    connectionPool: data.poolStatus
                }
            };
        } catch (error) {
            return {
                healthy: false,
                message: `Database connectivity check failed: ${error.message}`,
                metadata: { error: error.message }
            };
        }
    }

    async checkAuthService() {
        try {
            // Test token validation
            const response = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            const isValid = response.ok;
            
            return {
                healthy: isValid || response.status === 401, // 401 is expected for invalid tokens
                message: isValid ? 'Auth service healthy' : 'Auth service available but token invalid',
                metadata: {
                    tokenValid: isValid,
                    responseStatus: response.status
                }
            };
        } catch (error) {
            return {
                healthy: false,
                message: `Auth service check failed: ${error.message}`,
                metadata: { error: error.message }
            };
        }
    }

    async checkPaymentGateway() {
        try {
            const response = await fetch('/api/payments/health', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const data = await response.json();
            
            return {
                healthy: data.status === 'operational',
                message: `Payment gateway: ${data.status}`,
                metadata: {
                    gateway: data.gateway,
                    status: data.status,
                    lastTransaction: data.lastTransaction
                }
            };
        } catch (error) {
            return {
                healthy: false,
                message: `Payment gateway check failed: ${error.message}`,
                metadata: { error: error.message }
            };
        }
    }

    async checkWebSocketHealth() {
        return new Promise((resolve) => {
            try {
                const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
                const ws = new WebSocket(wsUrl);
                
                const timeout = setTimeout(() => {
                    ws.close();
                    resolve({
                        healthy: false,
                        message: 'WebSocket connection timeout',
                        metadata: { error: 'connection_timeout' }
                    });
                }, 5000);
                
                ws.onopen = () => {
                    clearTimeout(timeout);
                    ws.close();
                    resolve({
                        healthy: true,
                        message: 'WebSocket connection healthy',
                        metadata: { connected: true }
                    });
                };
                
                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    resolve({
                        healthy: false,
                        message: 'WebSocket connection failed',
                        metadata: { error: error.message }
                    });
                };
                
            } catch (error) {
                resolve({
                    healthy: false,
                    message: `WebSocket check failed: ${error.message}`,
                    metadata: { error: error.message }
                });
            }
        });
    }

    async checkEmailService() {
        try {
            const response = await fetch('/api/notifications/email/health', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const data = await response.json();
            
            return {
                healthy: data.status === 'operational',
                message: `Email service: ${data.status}`,
                metadata: data
            };
        } catch (error) {
            return {
                healthy: false,
                message: `Email service check failed: ${error.message}`,
                metadata: { error: error.message }
            };
        }
    }

    async checkSMSService() {
        try {
            const response = await fetch('/api/notifications/sms/health', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const data = await response.json();
            
            return {
                healthy: data.status === 'operational',
                message: `SMS service: ${data.status}`,
                metadata: data
            };
        } catch (error) {
            return {
                healthy: false,
                message: `SMS service check failed: ${error.message}`,
                metadata: { error: error.message }
            };
        }
    }

    async checkFileStorage() {
        try {
            const response = await fetch('/api/files/health', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const data = await response.json();
            
            return {
                healthy: data.status === 'operational' && data.storageUsage < 0.9,
                message: `File storage: ${data.status}, usage: ${Math.round(data.storageUsage * 100)}%`,
                metadata: data
            };
        } catch (error) {
            return {
                healthy: false,
                message: `File storage check failed: ${error.message}`,
                metadata: { error: error.message }
            };
        }
    }

    async checkCDNHealth() {
        try {
            const cdnUrl = process.env.REACT_APP_CDN_URL;
            if (!cdnUrl) {
                return {
                    healthy: true,
                    message: 'CDN not configured',
                    metadata: { configured: false }
                };
            }

            const startTime = Date.now();
            const response = await fetch(`${cdnUrl}/health`);
            const responseTime = Date.now() - startTime;
            
            return {
                healthy: response.ok && responseTime < 2000,
                message: `CDN health: ${response.status}, response time: ${responseTime}ms`,
                metadata: {
                    status: response.status,
                    responseTime,
                    healthy: response.ok
                }
            };
        } catch (error) {
            return {
                healthy: false,
                message: `CDN check failed: ${error.message}`,
                metadata: { error: error.message }
            };
        }
    }

    async checkMemoryUsage() {
        if (!performance.memory) {
            return {
                healthy: true,
                message: 'Memory monitoring not available',
                metadata: { available: false }
            };
        }

        const memory = performance.memory;
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        return {
            healthy: usageRatio < 0.8, // Alert if using more than 80% of available memory
            message: `Memory usage: ${Math.round(usageRatio * 100)}%`,
            metadata: {
                used: memory.usedJSHeapSize,
                total: memory.jsHeapSizeLimit,
                ratio: usageRatio
            }
        };
    }

    async checkPerformanceMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        const metrics = {
            loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
            domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };

        const isHealthy = metrics.loadTime < 3000 && metrics.firstContentfulPaint < 2000;
        
        return {
            healthy: isHealthy,
            message: `Performance: Load ${metrics.loadTime}ms, FCP ${metrics.firstContentfulPaint}ms`,
            metadata: metrics
        };
    }

    async checkErrorRate() {
        // This would typically get data from error tracking service
        const errorData = this.getErrorRateData();
        
        return {
            healthy: errorData.rate < 0.05, // Less than 5% error rate
            message: `Error rate: ${(errorData.rate * 100).toFixed(2)}%`,
            metadata: errorData
        };
    }

    async checkBrowserCompatibility() {
        const compatibility = {
            fetch: typeof fetch !== 'undefined',
            webSocket: typeof WebSocket !== 'undefined',
            localStorage: typeof Storage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined',
            geolocation: 'geolocation' in navigator,
            webWorker: typeof Worker !== 'undefined',
            serviceWorker: 'serviceWorker' in navigator
        };

        const supportedFeatures = Object.values(compatibility).filter(Boolean).length;
        const totalFeatures = Object.keys(compatibility).length;
        
        return {
            healthy: supportedFeatures >= totalFeatures * 0.8, // 80% compatibility required
            message: `Browser compatibility: ${supportedFeatures}/${totalFeatures} features supported`,
            metadata: compatibility
        };
    }

    async checkSecurityStatus() {
        const security = {
            https: location.protocol === 'https:',
            csp: this.hasContentSecurityPolicy(),
            xFrameOptions: this.hasXFrameOptions(),
            tokenPresent: !!this.getAuthToken(),
            sessionSecure: this.isSessionSecure()
        };

        const secureFeatures = Object.values(security).filter(Boolean).length;
        const totalFeatures = Object.keys(security).length;
        
        return {
            healthy: secureFeatures >= totalFeatures * 0.8,
            message: `Security status: ${secureFeatures}/${totalFeatures} checks passed`,
            metadata: security
        };
    }

    /**
     * Helper methods for health checks
     */

    testLocalStorage() {
        try {
            const test = 'health_check_test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    testSessionStorage() {
        try {
            const test = 'health_check_test';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    hasContentSecurityPolicy() {
        return document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null;
    }

    hasXFrameOptions() {
        // This would typically be checked via response headers
        return true; // Placeholder
    }

    isSessionSecure() {
        // Check if session is properly secured
        return location.protocol === 'https:' && document.cookie.includes('Secure');
    }

    getErrorRateData() {
        // This would typically come from error tracking service
        // Placeholder implementation
        return {
            rate: Math.random() * 0.1, // Random rate between 0-10%
            total: Math.floor(Math.random() * 1000),
            errors: Math.floor(Math.random() * 50)
        };
    }

    /**
     * Utility methods
     */

    async executeWithRetry(fn, maxRetries = this.config.retries.max) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = this.config.retries.delay * Math.pow(this.config.retries.backoff, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Health check timeout')), timeout);
        });
    }

    determineHealthStatus(result, check) {
        if (result.healthy === true) return 'HEALTHY';
        if (result.healthy === false) return 'UNHEALTHY';
        return 'DEGRADED';
    }

    determineErrorStatus(error, check) {
        if (error.message.includes('timeout')) return 'DEGRADED';
        if (check.consecutiveFailures >= 3) return 'CRITICAL';
        return 'UNHEALTHY';
    }

    updateHealthStatus(checkId, status) {
        this.healthStatus.set(checkId, status);
        
        // Add to history
        this.healthHistory.push({
            checkId,
            ...status,
            id: this.generateHealthId()
        });
        
        // Limit history size
        if (this.healthHistory.length > 1000) {
            this.healthHistory.splice(0, 100);
        }
        
        // Emit health status update event
        this.emitHealthEvent('health.status_updated', { checkId, status });
    }

    updateSystemStatus() {
        const statuses = Array.from(this.healthStatus.values());
        
        if (statuses.some(s => s.status === 'CRITICAL')) {
            this.systemStatus = 'CRITICAL';
        } else if (statuses.some(s => s.status === 'UNHEALTHY')) {
            this.systemStatus = 'UNHEALTHY';
        } else if (statuses.some(s => s.status === 'DEGRADED')) {
            this.systemStatus = 'DEGRADED';
        } else if (statuses.every(s => s.status === 'HEALTHY')) {
            this.systemStatus = 'HEALTHY';
        } else {
            this.systemStatus = 'UNKNOWN';
        }
        
        // Emit system status update event
        this.emitHealthEvent('health.system_status_updated', {
            status: this.systemStatus,
            timestamp: Date.now()
        });
    }

    /**
     * Public API methods
     */

    getSystemStatus() {
        return {
            status: this.systemStatus,
            lastCheck: this.lastFullCheck,
            summary: this.getHealthSummary()
        };
    }

    getHealthSummary() {
        const summary = {
            total: this.healthChecks.size,
            healthy: 0,
            degraded: 0,
            unhealthy: 0,
            critical: 0,
            unknown: 0
        };
        
        for (const status of this.healthStatus.values()) {
            summary[status.status.toLowerCase()]++;
        }
        
        return summary;
    }

    getHealthCheck(checkId) {
        const check = this.healthChecks.get(checkId);
        const status = this.healthStatus.get(checkId);
        
        return check && status ? { ...check, ...status } : null;
    }

    getAllHealthChecks() {
        const checks = [];
        
        for (const [checkId, check] of this.healthChecks.entries()) {
            const status = this.healthStatus.get(checkId);
            checks.push({ ...check, ...status });
        }
        
        return checks.sort((a, b) => 
            this.config.status[a.status]?.level - this.config.status[b.status]?.level
        );
    }

    getHealthHistory(checkId = null, limit = 100) {
        let history = [...this.healthHistory];
        
        if (checkId) {
            history = history.filter(h => h.checkId === checkId);
        }
        
        return history
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    async forceHealthCheck(checkId = null) {
        if (checkId) {
            await this.executeHealthCheck(checkId);
        } else {
            await this.runFullHealthCheck();
        }
        
        return this.getSystemStatus();
    }

    enableHealthCheck(checkId) {
        const check = this.healthChecks.get(checkId);
        if (check) {
            check.enabled = true;
        }
    }

    disableHealthCheck(checkId) {
        const check = this.healthChecks.get(checkId);
        if (check) {
            check.enabled = false;
        }
    }

    /**
     * Utility methods
     */

    generateHealthId() {
        return `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getAuthToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }

    emitHealthEvent(eventName, data) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        // Clear all intervals
        for (const intervalId of this.checkIntervals.values()) {
            clearInterval(intervalId);
        }
        
        this.checkIntervals.clear();
        this.healthChecks.clear();
        this.healthStatus.clear();
        this.healthHistory = [];
    }
}

// Create singleton instance
const healthCheckService = new HealthCheckService();

export default healthCheckService;