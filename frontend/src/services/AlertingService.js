/**
 * AlertingService - Comprehensive Production Alerting Infrastructure
 * 
 * Enterprise-grade alerting system with intelligent thresholds, escalation paths,
 * multi-channel notifications, and alert suppression to prevent alert fatigue
 * while ensuring critical issues are never missed.
 */

class AlertingService {
    constructor() {
        this.config = {
            // Alert severity levels
            severity: {
                CRITICAL: { level: 1, color: '#FF0000', icon: '🚨' },
                HIGH: { level: 2, color: '#FF6600', icon: '⚠️' },
                MEDIUM: { level: 3, color: '#FFD700', icon: '⚡' },
                LOW: { level: 4, color: '#00CED1', icon: 'ℹ️' },
                INFO: { level: 5, color: '#32CD32', icon: '📋' }
            },
            
            // Alert categories
            categories: {
                SYSTEM: 'system',
                SECURITY: 'security',
                BUSINESS: 'business',
                PERFORMANCE: 'performance',
                USER_EXPERIENCE: 'user_experience',
                DATA_INTEGRITY: 'data_integrity'
            },
            
            // Notification channels
            channels: {
                IN_APP: 'in_app',
                EMAIL: 'email',
                SMS: 'sms',
                SLACK: 'slack',
                WEBHOOK: 'webhook',
                PUSH: 'push'
            },
            
            // Escalation timeouts (in minutes)
            escalationTimeouts: {
                CRITICAL: 5,
                HIGH: 15,
                MEDIUM: 60,
                LOW: 240
            },
            
            // Suppression windows (in minutes)
            suppressionWindows: {
                CRITICAL: 2,
                HIGH: 5,
                MEDIUM: 15,
                LOW: 30
            }
        };

        this.alerts = new Map(); // Active alerts
        this.suppressedAlerts = new Map(); // Suppressed alerts
        this.alertHistory = []; // Alert history
        this.subscriptions = new Map(); // Alert subscriptions
        this.escalationTimers = new Map(); // Escalation timers
        
        this.initializeDefaultAlerts();
        this.setupAlertProcessing();
    }

    /**
     * Initialize default alert configurations
     */
    initializeDefaultAlerts() {
        // System alerts
        this.registerAlert('high_error_rate', {
            name: 'High Error Rate',
            category: this.config.categories.SYSTEM,
            severity: 'HIGH',
            threshold: 5, // 5% error rate
            window: 5, // 5 minutes
            description: 'Error rate exceeds acceptable threshold',
            channels: ['IN_APP', 'EMAIL', 'SLACK'],
            escalationPath: ['dev-team', 'ops-team', 'management']
        });

        this.registerAlert('api_response_time', {
            name: 'High API Response Time',
            category: this.config.categories.PERFORMANCE,
            severity: 'MEDIUM',
            threshold: 2000, // 2 seconds
            window: 10, // 10 minutes
            description: 'API response time is higher than expected',
            channels: ['IN_APP', 'SLACK'],
            escalationPath: ['dev-team']
        });

        this.registerAlert('user_session_errors', {
            name: 'User Session Errors',
            category: this.config.categories.USER_EXPERIENCE,
            severity: 'HIGH',
            threshold: 3, // 3 errors per user session
            window: 15, // 15 minutes
            description: 'Multiple errors occurring in user sessions',
            channels: ['IN_APP', 'EMAIL'],
            escalationPath: ['support-team', 'dev-team']
        });

        this.registerAlert('security_breach_attempt', {
            name: 'Security Breach Attempt',
            category: this.config.categories.SECURITY,
            severity: 'CRITICAL',
            threshold: 1, // Any security breach attempt
            window: 1, // 1 minute
            description: 'Potential security breach detected',
            channels: ['IN_APP', 'EMAIL', 'SMS', 'SLACK'],
            escalationPath: ['security-team', 'ops-team', 'management'],
            immediate: true
        });

        this.registerAlert('booking_conversion_drop', {
            name: 'Booking Conversion Drop',
            category: this.config.categories.BUSINESS,
            severity: 'HIGH',
            threshold: 20, // 20% drop in conversion
            window: 60, // 60 minutes
            description: 'Significant drop in booking conversion rate',
            channels: ['IN_APP', 'EMAIL', 'SLACK'],
            escalationPath: ['product-team', 'business-team']
        });

        this.registerAlert('payment_failures', {
            name: 'Payment Processing Failures',
            category: this.config.categories.BUSINESS,
            severity: 'CRITICAL',
            threshold: 5, // 5% payment failure rate
            window: 15, // 15 minutes
            description: 'High rate of payment processing failures',
            channels: ['IN_APP', 'EMAIL', 'SMS'],
            escalationPath: ['payments-team', 'ops-team', 'management']
        });

        this.registerAlert('data_sync_failure', {
            name: 'Data Synchronization Failure',
            category: this.config.categories.DATA_INTEGRITY,
            severity: 'HIGH',
            threshold: 1, // Any sync failure
            window: 5, // 5 minutes
            description: 'Data synchronization between systems failed',
            channels: ['IN_APP', 'EMAIL'],
            escalationPath: ['data-team', 'ops-team']
        });
    }

    /**
     * Register new alert configuration
     */
    registerAlert(alertId, config) {
        this.subscriptions.set(alertId, {
            ...config,
            id: alertId,
            active: true,
            lastTriggered: null,
            triggerCount: 0
        });
    }

    /**
     * Trigger an alert
     */
    async triggerAlert(alertId, data = {}, context = {}) {
        const alertConfig = this.subscriptions.get(alertId);
        if (!alertConfig || !alertConfig.active) {
            return;
        }

        const alertKey = `${alertId}_${JSON.stringify(context)}`;
        
        // Check if alert is suppressed
        if (this.isAlertSuppressed(alertKey)) {
            return;
        }

        // Create alert instance
        const alert = this.createAlert(alertId, alertConfig, data, context);
        
        // Check if this is a duplicate alert
        if (this.isDuplicateAlert(alert)) {
            this.updateExistingAlert(alert);
            return;
        }

        // Add to active alerts
        this.alerts.set(alertKey, alert);
        
        // Process alert
        await this.processAlert(alert);
        
        // Setup escalation if needed
        if (alertConfig.escalationPath && alertConfig.escalationPath.length > 0) {
            this.setupEscalation(alert);
        }
        
        // Add to history
        this.alertHistory.push({
            ...alert,
            timestamp: Date.now()
        });
        
        // Suppress similar alerts
        this.suppressAlert(alertKey, alertConfig.severity);
        
        // Update configuration
        alertConfig.lastTriggered = Date.now();
        alertConfig.triggerCount++;
    }

    /**
     * Create alert instance
     */
    createAlert(alertId, config, data, context) {
        return {
            id: this.generateAlertId(),
            alertId,
            name: config.name,
            category: config.category,
            severity: config.severity,
            description: config.description,
            threshold: config.threshold,
            actualValue: data.value,
            context: {
                ...context,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                userId: data.userId,
                sessionId: data.sessionId
            },
            data,
            channels: config.channels || ['IN_APP'],
            escalationPath: config.escalationPath || [],
            escalationLevel: 0,
            status: 'ACTIVE',
            acknowledged: false,
            acknowledgedBy: null,
            acknowledgedAt: null,
            resolved: false,
            resolvedBy: null,
            resolvedAt: null,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    /**
     * Process alert through notification channels
     */
    async processAlert(alert) {
        const promises = alert.channels.map(channel => 
            this.sendNotification(alert, channel)
        );
        
        await Promise.allSettled(promises);
        
        // Log alert processing
        console.log(`Alert processed: ${alert.name} (${alert.severity})`, alert);
        
        // Emit alert event for UI components
        this.emitAlertEvent('alert.triggered', alert);
    }

    /**
     * Send notification through specific channel
     */
    async sendNotification(alert, channel) {
        const channelMethod = {
            IN_APP: this.sendInAppNotification,
            EMAIL: this.sendEmailNotification,
            SMS: this.sendSMSNotification,
            SLACK: this.sendSlackNotification,
            WEBHOOK: this.sendWebhookNotification,
            PUSH: this.sendPushNotification
        }[channel];

        if (!channelMethod) {
            console.warn(`Unknown notification channel: ${channel}`);
            return;
        }

        try {
            await channelMethod.call(this, alert);
        } catch (error) {
            console.error(`Failed to send ${channel} notification:`, error);
            // Fallback to in-app notification
            if (channel !== 'IN_APP') {
                await this.sendInAppNotification(alert);
            }
        }
    }

    /**
     * Send in-app notification
     */
    async sendInAppNotification(alert) {
        const notification = {
            id: alert.id,
            title: alert.name,
            message: this.formatAlertMessage(alert),
            severity: alert.severity,
            category: alert.category,
            timestamp: alert.createdAt,
            actions: [
                { id: 'acknowledge', label: 'Acknowledge', action: () => this.acknowledgeAlert(alert.id) },
                { id: 'resolve', label: 'Resolve', action: () => this.resolveAlert(alert.id) },
                { id: 'details', label: 'View Details', action: () => this.showAlertDetails(alert.id) }
            ]
        };

        // Show toast notification
        if (window.showToast) {
            window.showToast(notification.message, {
                type: alert.severity.toLowerCase(),
                duration: alert.severity === 'CRITICAL' ? 0 : 5000, // Critical alerts don't auto-dismiss
                actions: notification.actions
            });
        }

        // Add to notification center
        this.addToNotificationCenter(notification);
    }

    /**
     * Send email notification
     */
    async sendEmailNotification(alert) {
        const emailData = {
            to: this.getRecipients(alert.escalationPath[alert.escalationLevel] || 'default'),
            subject: `[${alert.severity}] ${alert.name}`,
            template: 'alert_notification',
            data: {
                alert,
                dashboardUrl: `${window.location.origin}/dashboard/alerts/${alert.id}`,
                acknowledgeUrl: `${window.location.origin}/api/alerts/${alert.id}/acknowledge`,
                resolveUrl: `${window.location.origin}/api/alerts/${alert.id}/resolve`
            }
        };

        await fetch('/api/notifications/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(emailData)
        });
    }

    /**
     * Send SMS notification
     */
    async sendSMSNotification(alert) {
        const smsData = {
            to: this.getRecipients(alert.escalationPath[alert.escalationLevel] || 'default', 'sms'),
            message: `[${alert.severity}] ${alert.name}: ${alert.description}. View details: ${window.location.origin}/dashboard/alerts/${alert.id}`
        };

        await fetch('/api/notifications/sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(smsData)
        });
    }

    /**
     * Send Slack notification
     */
    async sendSlackNotification(alert) {
        const slackData = {
            channel: this.getSlackChannel(alert.category),
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: `${this.config.severity[alert.severity].icon} ${alert.name}`
                    }
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*Severity:* ${alert.severity}` },
                        { type: 'mrkdwn', text: `*Category:* ${alert.category}` },
                        { type: 'mrkdwn', text: `*Threshold:* ${alert.threshold}` },
                        { type: 'mrkdwn', text: `*Actual:* ${alert.actualValue}` }
                    ]
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: alert.description
                    }
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            text: { type: 'plain_text', text: 'Acknowledge' },
                            value: alert.id,
                            action_id: 'acknowledge_alert'
                        },
                        {
                            type: 'button',
                            text: { type: 'plain_text', text: 'View Dashboard' },
                            url: `${window.location.origin}/dashboard/alerts/${alert.id}`
                        }
                    ]
                }
            ]
        };

        await fetch('/api/notifications/slack', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(slackData)
        });
    }

    /**
     * Send webhook notification
     */
    async sendWebhookNotification(alert) {
        const webhookData = {
            event: 'alert.triggered',
            alert,
            timestamp: Date.now()
        };

        const webhookUrl = process.env.REACT_APP_ALERT_WEBHOOK_URL;
        if (!webhookUrl) return;

        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Alert-Signature': this.generateWebhookSignature(webhookData)
            },
            body: JSON.stringify(webhookData)
        });
    }

    /**
     * Send push notification
     */
    async sendPushNotification(alert) {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) return;

        const pushData = {
            subscription,
            payload: {
                title: `[${alert.severity}] ${alert.name}`,
                body: alert.description,
                icon: '/icons/alert-icon.png',
                badge: '/icons/badge-icon.png',
                data: { alertId: alert.id },
                actions: [
                    { action: 'acknowledge', title: 'Acknowledge' },
                    { action: 'view', title: 'View Details' }
                ]
            }
        };

        await fetch('/api/notifications/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(pushData)
        });
    }

    /**
     * Setup alert escalation
     */
    setupEscalation(alert) {
        const timeout = this.config.escalationTimeouts[alert.severity] * 60 * 1000; // Convert to milliseconds
        
        const escalationTimer = setTimeout(async () => {
            if (!this.alerts.has(alert.id) || alert.acknowledged || alert.resolved) {
                return;
            }

            alert.escalationLevel++;
            if (alert.escalationLevel < alert.escalationPath.length) {
                alert.updatedAt = Date.now();
                await this.processAlert(alert);
                this.setupEscalation(alert); // Setup next escalation
                
                this.emitAlertEvent('alert.escalated', alert);
            }
        }, timeout);
        
        this.escalationTimers.set(alert.id, escalationTimer);
    }

    /**
     * Acknowledge alert
     */
    async acknowledgeAlert(alertId, userId = 'system', reason = '') {
        const alertKey = this.findAlertKey(alertId);
        const alert = this.alerts.get(alertKey);
        
        if (!alert || alert.acknowledged) {
            return;
        }

        alert.acknowledged = true;
        alert.acknowledgedBy = userId;
        alert.acknowledgedAt = Date.now();
        alert.updatedAt = Date.now();

        // Clear escalation timer
        const timer = this.escalationTimers.get(alertId);
        if (timer) {
            clearTimeout(timer);
            this.escalationTimers.delete(alertId);
        }

        // Send acknowledgment notification
        await this.sendAcknowledgmentNotification(alert, userId, reason);
        
        this.emitAlertEvent('alert.acknowledged', alert);
        
        return alert;
    }

    /**
     * Resolve alert
     */
    async resolveAlert(alertId, userId = 'system', resolution = '') {
        const alertKey = this.findAlertKey(alertId);
        const alert = this.alerts.get(alertKey);
        
        if (!alert || alert.resolved) {
            return;
        }

        alert.resolved = true;
        alert.resolvedBy = userId;
        alert.resolvedAt = Date.now();
        alert.updatedAt = Date.now();
        alert.status = 'RESOLVED';

        // Clear escalation timer
        const timer = this.escalationTimers.get(alertId);
        if (timer) {
            clearTimeout(timer);
            this.escalationTimers.delete(alertId);
        }

        // Remove from active alerts
        this.alerts.delete(alertKey);

        // Send resolution notification
        await this.sendResolutionNotification(alert, userId, resolution);
        
        this.emitAlertEvent('alert.resolved', alert);
        
        return alert;
    }

    /**
     * Check if alert is suppressed
     */
    isAlertSuppressed(alertKey) {
        const suppressedUntil = this.suppressedAlerts.get(alertKey);
        if (!suppressedUntil) return false;
        
        if (Date.now() > suppressedUntil) {
            this.suppressedAlerts.delete(alertKey);
            return false;
        }
        
        return true;
    }

    /**
     * Suppress alert for a duration
     */
    suppressAlert(alertKey, severity) {
        const suppressionWindow = this.config.suppressionWindows[severity] * 60 * 1000; // Convert to milliseconds
        this.suppressedAlerts.set(alertKey, Date.now() + suppressionWindow);
    }

    /**
     * Check if alert is duplicate
     */
    isDuplicateAlert(alert) {
        for (const [key, existingAlert] of this.alerts.entries()) {
            if (existingAlert.alertId === alert.alertId &&
                JSON.stringify(existingAlert.context) === JSON.stringify(alert.context)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Update existing alert
     */
    updateExistingAlert(alert) {
        for (const [key, existingAlert] of this.alerts.entries()) {
            if (existingAlert.alertId === alert.alertId &&
                JSON.stringify(existingAlert.context) === JSON.stringify(alert.context)) {
                existingAlert.updatedAt = Date.now();
                existingAlert.data = { ...existingAlert.data, ...alert.data };
                break;
            }
        }
    }

    /**
     * Get active alerts
     */
    getActiveAlerts(category = null, severity = null) {
        let alerts = Array.from(this.alerts.values());
        
        if (category) {
            alerts = alerts.filter(alert => alert.category === category);
        }
        
        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }
        
        return alerts.sort((a, b) => 
            this.config.severity[a.severity].level - this.config.severity[b.severity].level
        );
    }

    /**
     * Get alert history
     */
    getAlertHistory(limit = 100, category = null, severity = null) {
        let history = [...this.alertHistory];
        
        if (category) {
            history = history.filter(alert => alert.category === category);
        }
        
        if (severity) {
            history = history.filter(alert => alert.severity === severity);
        }
        
        return history
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Generate alert statistics
     */
    getAlertStatistics(timeRange = 24 * 60 * 60 * 1000) { // Default 24 hours
        const now = Date.now();
        const startTime = now - timeRange;
        
        const recentAlerts = this.alertHistory.filter(alert => 
            alert.timestamp >= startTime
        );
        
        const stats = {
            total: recentAlerts.length,
            bySeverity: {},
            byCategory: {},
            acknowledged: recentAlerts.filter(alert => alert.acknowledged).length,
            resolved: recentAlerts.filter(alert => alert.resolved).length,
            avgResolutionTime: 0,
            topAlerts: {}
        };
        
        // Count by severity
        Object.keys(this.config.severity).forEach(severity => {
            stats.bySeverity[severity] = recentAlerts.filter(alert => 
                alert.severity === severity
            ).length;
        });
        
        // Count by category
        Object.values(this.config.categories).forEach(category => {
            stats.byCategory[category] = recentAlerts.filter(alert => 
                alert.category === category
            ).length;
        });
        
        // Calculate average resolution time
        const resolvedAlerts = recentAlerts.filter(alert => 
            alert.resolved && alert.resolvedAt
        );
        
        if (resolvedAlerts.length > 0) {
            const totalResolutionTime = resolvedAlerts.reduce((sum, alert) => 
                sum + (alert.resolvedAt - alert.createdAt), 0
            );
            stats.avgResolutionTime = totalResolutionTime / resolvedAlerts.length;
        }
        
        // Top alerts by frequency
        const alertCounts = {};
        recentAlerts.forEach(alert => {
            alertCounts[alert.alertId] = (alertCounts[alert.alertId] || 0) + 1;
        });
        
        stats.topAlerts = Object.entries(alertCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [alertId, count]) => {
                obj[alertId] = count;
                return obj;
            }, {});
        
        return stats;
    }

    /**
     * Utility methods
     */
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    findAlertKey(alertId) {
        for (const [key, alert] of this.alerts.entries()) {
            if (alert.id === alertId) {
                return key;
            }
        }
        return null;
    }

    formatAlertMessage(alert) {
        return `${alert.description}. Current value: ${alert.actualValue}, Threshold: ${alert.threshold}`;
    }

    getRecipients(group, type = 'email') {
        // This would typically come from a configuration service
        const recipients = {
            'dev-team': {
                email: ['dev-team@prescripto.com'],
                sms: ['+1234567890']
            },
            'ops-team': {
                email: ['ops-team@prescripto.com'],
                sms: ['+1234567891']
            },
            'security-team': {
                email: ['security@prescripto.com'],
                sms: ['+1234567892']
            }
        };
        
        return recipients[group]?.[type] || [];
    }

    getSlackChannel(category) {
        const channels = {
            system: '#alerts-system',
            security: '#alerts-security',
            business: '#alerts-business',
            performance: '#alerts-performance',
            user_experience: '#alerts-ux',
            data_integrity: '#alerts-data'
        };
        
        return channels[category] || '#alerts-general';
    }

    getAuthToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }

    generateWebhookSignature(data) {
        // Implement webhook signature generation for security
        return 'signature';
    }

    emitAlertEvent(eventName, alert) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent(eventName, { detail: alert }));
        }
    }

    addToNotificationCenter(notification) {
        // Add to notification center if it exists
        if (window.notificationCenter) {
            window.notificationCenter.add(notification);
        }
    }

    async sendAcknowledgmentNotification(alert, userId, reason) {
        // Implementation for acknowledgment notifications
    }

    async sendResolutionNotification(alert, userId, resolution) {
        // Implementation for resolution notifications
    }

    setupAlertProcessing() {
        // Setup periodic cleanup of old alerts
        setInterval(() => {
            this.cleanupOldAlerts();
        }, 60 * 60 * 1000); // Every hour
    }

    cleanupOldAlerts() {
        const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
        
        this.alertHistory = this.alertHistory.filter(alert => 
            alert.timestamp > cutoffTime
        );
    }
}

// Create singleton instance
const alertingService = new AlertingService();

export default alertingService;