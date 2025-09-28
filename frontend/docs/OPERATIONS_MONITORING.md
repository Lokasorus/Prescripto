# Operations & Monitoring Infrastructure

This document provides comprehensive documentation for Prescripto's production-ready operations and monitoring infrastructure. The system includes advanced logging, intelligent alerting, health monitoring, error tracking, and performance monitoring capabilities.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Logging Infrastructure](#logging-infrastructure)
3. [Alerting System](#alerting-system)
4. [Health Monitoring](#health-monitoring)
5. [Error Tracking](#error-tracking)
6. [Performance Monitoring](#performance-monitoring)
7. [Integration Guide](#integration-guide)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

## Architecture Overview

The Operations & Monitoring infrastructure consists of five interconnected services:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   LoggingService    │    │   AlertingService   │    │  HealthCheckService │
│                     │    │                     │    │                     │
│ • Structured logs   │◄──►│ • Intelligent       │◄──►│ • System health     │
│ • Multiple transports│   │   alerting          │    │ • Service status    │
│ • GDPR compliance   │    │ • Multi-channel     │    │ • Auto recovery     │
└─────────────────────┘    │   notifications     │    └─────────────────────┘
           │                └─────────────────────┘               │
           │                           │                          │
           ▼                           ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐
│ ErrorTrackingService│    │ PerformanceMonitor  │
│                     │    │                     │
│ • Error capture     │    │ • Core Web Vitals   │
│ • Smart grouping    │    │ • API monitoring    │
│ • Trend analysis    │    │ • Resource tracking │
└─────────────────────┘    └─────────────────────┘
```

### Key Features

- **Real-time monitoring** with immediate alerts for critical issues
- **Intelligent error grouping** to reduce noise and focus on unique problems
- **Performance optimization** through comprehensive Core Web Vitals tracking
- **Health monitoring** of all system components with automated recovery
- **Privacy compliance** with GDPR-compliant data handling and scrubbing
- **Multi-channel notifications** via email, SMS, Slack, and in-app alerts
- **Comprehensive dashboards** for operations teams and developers

## Logging Infrastructure

### LoggingService

Enterprise-grade logging with structured data, multiple transports, and privacy compliance.

#### Key Features

- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Multiple Transports**: Console, HTTP, and local storage
- **Privacy Protection**: Automatic PII scrubbing
- **Correlation Tracking**: Request tracing across services
- **User Context**: User-specific logging with session tracking
- **Performance**: Buffered logging with batch processing
- **Offline Support**: Local storage fallback for offline scenarios

#### Basic Usage

```javascript
import { log } from '../services/LoggingService';

// Basic logging
log.info('User logged in', { userId: '12345', method: 'social' });
log.error('Payment failed', error, { userId: '12345', amount: 99.99 });
log.warn('Rate limit approaching', { usage: 85, limit: 100 });

// Specialized logging
log.userAction('appointment_booked', {
  appointmentId: 'apt_123',
  doctorId: 'doc_456',
  duration: 30
});

log.performance('api_response_time', 1250, {
  endpoint: '/api/appointments',
  method: 'POST'
});

log.business('subscription_upgraded', {
  userId: '12345',
  plan: 'premium',
  revenue: 29.99
});

log.security('suspicious_login_attempt', {
  ip: '192.168.1.1',
  userAgent: 'suspicious-bot',
  attempts: 5
});
```

#### Advanced Configuration

```javascript
// Set user context
log.setUser('user_12345', {
  type: 'patient',
  subscription: 'premium',
  location: 'US-CA'
});

// Create child logger with default context
const apiLogger = log.child({
  component: 'api',
  service: 'appointments'
});

apiLogger.info('Processing request', { endpoint: '/create' });
```

### Log Levels and Correlation

- **ERROR**: Critical issues requiring immediate attention
- **WARN**: Warning conditions that may indicate problems
- **INFO**: General information about system operations
- **DEBUG**: Detailed information for debugging (development only)
- **TRACE**: Very detailed information (development only)

Each log entry includes:
- Correlation ID for request tracking
- Session ID for user session tracking
- User context and metadata
- Timestamp and environment information
- Stack traces for errors

## Alerting System

### AlertingService

Intelligent alerting with escalation paths, suppression, and multi-channel notifications.

#### Key Features

- **Smart Thresholds**: Configurable thresholds with intelligent suppression
- **Escalation Paths**: Automatic escalation to different teams
- **Multi-Channel**: Email, SMS, Slack, push notifications, webhooks
- **Alert Suppression**: Prevent alert fatigue with intelligent grouping
- **Acknowledgment**: Alert acknowledgment and resolution tracking
- **Statistics**: Comprehensive alert analytics and reporting

#### Pre-configured Alerts

1. **High Error Rate**: >5% error rate triggers team notification
2. **API Response Time**: >2s API response triggers performance alert
3. **User Session Errors**: >3 errors per session triggers UX alert
4. **Security Breach**: Any security breach attempt triggers immediate alert
5. **Payment Failures**: >5% payment failure rate triggers critical alert
6. **Data Sync Failure**: Any sync failure triggers data team alert
7. **Booking Conversion Drop**: >20% conversion drop triggers business alert

#### Usage Examples

```javascript
import alertingService from '../services/AlertingService';

// Trigger an alert
await alertingService.triggerAlert('high_error_rate', {
  value: 0.08, // 8% error rate
  userId: 'user_123'
}, {
  service: 'api',
  endpoint: '/appointments'
});

// Register custom alert
alertingService.registerAlert('custom_metric', {
  name: 'Custom Business Metric',
  category: 'business',
  severity: 'HIGH',
  threshold: 50,
  window: 30,
  description: 'Custom metric exceeded threshold',
  channels: ['IN_APP', 'EMAIL'],
  escalationPath: ['team-lead', 'management']
});

// Get active alerts
const activeAlerts = alertingService.getActiveAlerts('system', 'HIGH');

// Acknowledge alert
await alertingService.acknowledgeAlert('alert_123', 'user_456', 'Investigating issue');

// Resolve alert
await alertingService.resolveAlert('alert_123', 'user_456', 'Fixed database connection');
```

#### Alert Configuration

```javascript
{
  severity: 'HIGH',           // CRITICAL, HIGH, MEDIUM, LOW, INFO
  threshold: 5,               // Threshold value
  window: 5,                  // Time window in minutes
  channels: ['EMAIL', 'SLACK'], // Notification channels
  escalationPath: ['dev-team', 'ops-team'], // Escalation hierarchy
  suppressionWindow: 15       // Suppression window in minutes
}
```

## Health Monitoring

### HealthCheckService

Comprehensive system health monitoring with automated checks and recovery.

#### Key Features

- **Multi-Component Monitoring**: Frontend, API, database, external services
- **Automated Recovery**: Self-healing capabilities for common issues
- **Priority-Based Checking**: Different intervals for critical vs. background checks
- **Comprehensive Coverage**: 15+ health checks across all system components
- **Real-time Status**: Live health dashboard with detailed diagnostics
- **Historical Tracking**: Health history and trend analysis

#### Health Check Categories

1. **Critical** (30s intervals):
   - Frontend Application Health
   - API Connectivity
   - Database Connectivity
   - Authentication Service
   - Security Status

2. **Important** (1 min intervals):
   - Payment Gateway
   - WebSocket Connection
   - File Storage Service
   - Error Rate Monitor

3. **Normal** (5 min intervals):
   - Email Service
   - SMS Service
   - CDN Health
   - Memory Usage
   - Performance Metrics

4. **Background** (15 min intervals):
   - Browser Compatibility

#### Usage Examples

```javascript
import healthCheckService from '../services/HealthCheckService';

// Get system status
const systemStatus = healthCheckService.getSystemStatus();
console.log(systemStatus);
// {
//   status: 'HEALTHY',
//   lastCheck: 1640995200000,
//   summary: { total: 15, healthy: 13, degraded: 1, unhealthy: 1 }
// }

// Get all health checks
const allChecks = healthCheckService.getAllHealthChecks();

// Get specific health check
const apiHealth = healthCheckService.getHealthCheck('api_connectivity');

// Force health check
await healthCheckService.forceHealthCheck('database_connectivity');

// Enable/disable health check
healthCheckService.disableHealthCheck('browser_compatibility');
healthCheckService.enableHealthCheck('browser_compatibility');
```

#### Health Check Results

```javascript
{
  id: 'api_connectivity',
  name: 'API Connectivity',
  status: 'HEALTHY',           // HEALTHY, DEGRADED, UNHEALTHY, CRITICAL
  message: 'API connection healthy',
  responseTime: 234,           // Response time in ms
  timestamp: 1640995200000,
  metadata: {
    status: 200,
    serverData: { ... }
  }
}
```

## Error Tracking

### ErrorTrackingService

Comprehensive error monitoring with intelligent grouping and analysis.

#### Key Features

- **Automatic Error Capture**: Global error handlers for all error types
- **Smart Grouping**: Intelligent error grouping by stack trace and context
- **Privacy Protection**: Automatic PII scrubbing and data anonymization
- **Performance Context**: Error correlation with performance metrics
- **User Journey Tracking**: Breadcrumb trails leading to errors
- **Trend Analysis**: Error frequency and pattern analysis
- **Integration**: Seamless integration with alerting and logging systems

#### Error Categories

- **JavaScript**: Runtime errors, type errors, reference errors
- **Network**: API failures, timeout errors, connection issues
- **Authentication**: Login failures, token expiration, permission errors
- **Validation**: Form validation, data validation errors
- **Business Logic**: Application-specific business rule violations
- **Performance**: Long tasks, memory issues, slow operations
- **Security**: XSS attempts, CSRF violations, unauthorized access

#### Usage Examples

```javascript
import { captureError, captureException, captureMessage, setUser, setContext } from '../services/ErrorTrackingService';

// Set user context
setUser('user_123', {
  email: 'user@example.com',
  subscription: 'premium',
  location: 'US-CA'
});

// Set additional context
setContext({
  feature: 'appointment_booking',
  experiment: 'new_ui_v2'
});

// Capture exception
try {
  // Some operation
} catch (error) {
  captureException(error, {
    component: 'AppointmentBooking',
    action: 'submit_form'
  });
}

// Capture custom message
captureMessage('User performed unusual action', 'WARNING', {
  action: 'bulk_cancel_appointments',
  count: 15
});

// Manual error capture
captureError(new Error('Custom error'), {
  category: 'business_logic',
  severity: 'HIGH',
  userId: 'user_123'
});
```

#### Error Data Structure

```javascript
{
  id: 'error_1640995200000_abc123',
  timestamp: 1640995200000,
  name: 'TypeError',
  message: 'Cannot read property of undefined',
  stack: '...',
  category: 'javascript',
  severity: 'HIGH',
  url: '/appointments/book',
  userId: 'user_123',
  sessionId: 'session_456',
  browserContext: { ... },
  appContext: { ... },
  signature: 'abc123def456',      // For grouping
  fingerprint: 'def456ghi789',    // For deduplication
  tags: ['browser:chrome', 'url:/appointments'],
  breadcrumbs: [...],
  performance: { ... }
}
```

## Performance Monitoring

### PerformanceMonitoringService

Comprehensive performance monitoring with Core Web Vitals and custom metrics.

#### Key Features

- **Core Web Vitals**: FCP, LCP, FID, CLS, TTFB tracking
- **API Performance**: Response time monitoring and analysis
- **Resource Monitoring**: Asset loading and caching analysis
- **User Experience**: Interaction tracking and performance correlation
- **Memory Monitoring**: JavaScript heap usage and leak detection
- **Custom Metrics**: Application-specific performance tracking
- **Performance Budgets**: Threshold-based alerting for performance regressions

#### Core Web Vitals Monitoring

```javascript
import performanceMonitor from '../services/PerformanceMonitoringService';

// Get Core Web Vitals
const vitals = performanceMonitor.getCoreWebVitals();
console.log(vitals);
// {
//   fcp: { value: 1200, rating: 'good' },
//   lcp: { value: 1800, rating: 'good' },
//   fid: { value: 45, rating: 'good' },
//   cls: { value: 0.05, rating: 'good' },
//   tbt: { value: 120, rating: 'needs-improvement' }
// }

// Set user context
performanceMonitor.setUser('user_123');

// Custom timing marks
performanceMonitor.mark('appointment-form-start');
performanceMonitor.mark('appointment-form-end');
performanceMonitor.measure('appointment-form-duration', 
  'appointment-form-start', 'appointment-form-end');

// Get performance summary
const summary = performanceMonitor.getPerformanceSummary();
```

#### Performance Thresholds

```javascript
{
  pageLoad: 3000,              // 3 seconds
  firstContentfulPaint: 2000,  // 2 seconds  
  largestContentfulPaint: 2500, // 2.5 seconds
  firstInputDelay: 100,        // 100ms
  cumulativeLayoutShift: 0.1,  // 0.1 CLS score
  apiResponse: 1000,           // 1 second
  longTask: 50,                // 50ms
  memoryUsage: 0.8             // 80% of available
}
```

#### Performance Metrics

The service automatically collects:

1. **Navigation Timing**: DNS, connect, request, response times
2. **Paint Timing**: First paint, first contentful paint
3. **Layout Stability**: Cumulative layout shift measurements
4. **Input Responsiveness**: First input delay, long task detection
5. **Resource Timing**: Asset loading performance
6. **Memory Usage**: JavaScript heap size monitoring
7. **API Performance**: Request/response timing for all API calls

## Integration Guide

### Service Integration

All monitoring services are designed to work together seamlessly:

```javascript
// App.jsx - Initialize all monitoring services
import { useEffect } from 'react';
import { log } from './services/LoggingService';
import alertingService from './services/AlertingService';
import healthCheckService from './services/HealthCheckService';
import errorTracker from './services/ErrorTrackingService';
import performanceMonitor from './services/PerformanceMonitoringService';

function App() {
  useEffect(() => {
    // Set user context across all services
    const userId = getCurrentUserId();
    const userProfile = getCurrentUserProfile();
    
    log.setUser(userId, userProfile);
    errorTracker.setUser(userId, userProfile);
    performanceMonitor.setUser(userId);
    
    // Set up event listeners for cross-service communication
    window.addEventListener('error.captured', (event) => {
      const error = event.detail;
      
      // Trigger alert for critical errors
      if (error.severity === 'CRITICAL') {
        alertingService.triggerAlert('critical_error', {
          errorId: error.id,
          message: error.message
        });
      }
    });
    
    window.addEventListener('performance.alert', (event) => {
      const { alertType, ...data } = event.detail;
      
      // Log performance issues
      log.warn(`Performance issue: ${alertType}`, data);
      
      // Trigger performance alert
      alertingService.triggerAlert('performance_issue', data);
    });
    
    window.addEventListener('health.system_status_updated', (event) => {
      const { status } = event.detail;
      
      // Log system status changes
      log.info(`System status changed: ${status}`);
      
      // Trigger alert for unhealthy systems
      if (['UNHEALTHY', 'CRITICAL'].includes(status)) {
        alertingService.triggerAlert('system_unhealthy', { status });
      }
    });
    
  }, []);
  
  return (
    <div className="App">
      {/* Your app content */}
    </div>
  );
}
```

### Error Boundary Integration

```javascript
// ErrorBoundary.jsx
import React from 'react';
import { captureException } from './services/ErrorTrackingService';
import { log } from './services/LoggingService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Capture error with React-specific context
    captureException(error, {
      type: 'react_error_boundary',
      component: this.props.component || 'Unknown',
      errorInfo: errorInfo.componentStack
    });
    
    // Log error
    log.error('React Error Boundary triggered', error, {
      component: this.props.component,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>We've been notified and are working to fix this issue.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Request Monitoring

```javascript
// api.js - Enhanced API client with monitoring
import { log } from './services/LoggingService';
import { captureException } from './services/ErrorTrackingService';

class APIClient {
  async request(endpoint, options = {}) {
    const startTime = performance.now();
    const requestId = this.generateRequestId();
    
    try {
      // Log API request
      log.debug('API request started', {
        requestId,
        endpoint,
        method: options.method || 'GET'
      });
      
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          ...options.headers,
          'X-Request-ID': requestId
        }
      });
      
      const responseTime = performance.now() - startTime;
      
      if (!response.ok) {
        const error = new Error(`API Error: ${response.status}`);
        
        // Log API error
        log.error('API request failed', error, {
          requestId,
          endpoint,
          status: response.status,
          responseTime
        });
        
        // Capture error
        captureException(error, {
          category: 'network',
          type: 'api_error',
          endpoint,
          status: response.status,
          responseTime
        });
        
        throw error;
      }
      
      // Log successful API request
      log.info('API request completed', {
        requestId,
        endpoint,
        status: response.status,
        responseTime,
        rating: this.getPerformanceRating(responseTime)
      });
      
      return await response.json();
      
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      // Log and capture network errors
      log.error('API request error', error, {
        requestId,
        endpoint,
        responseTime
      });
      
      captureException(error, {
        category: 'network',
        type: 'api_network_error',
        endpoint,
        responseTime
      });
      
      throw error;
    }
  }
  
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getPerformanceRating(responseTime) {
    if (responseTime < 200) return 'excellent';
    if (responseTime < 500) return 'good';
    if (responseTime < 1000) return 'fair';
    return 'poor';
  }
}
```

## Production Deployment

### Environment Configuration

```javascript
// .env.production
REACT_APP_LOGS_ENDPOINT=https://api.prescripto.com/api/logs
REACT_APP_ERRORS_ENDPOINT=https://api.prescripto.com/api/errors
REACT_APP_METRICS_ENDPOINT=https://api.prescripto.com/api/metrics
REACT_APP_ALERT_WEBHOOK_URL=https://hooks.prescripto.com/alerts
REACT_APP_WS_URL=wss://api.prescripto.com
REACT_APP_CDN_URL=https://cdn.prescripto.com
REACT_APP_VERSION=1.0.0
REACT_APP_BUILD_TIME=2024-01-01T00:00:00Z
```

### Backend Integration

The monitoring services require corresponding backend endpoints:

1. **POST /api/logs** - Receive batched log entries
2. **POST /api/errors** - Receive error reports
3. **POST /api/errors/alert** - Immediate error alerts
4. **POST /api/performance/metrics** - Performance metrics
5. **GET /api/health** - Health check endpoint
6. **POST /api/notifications/{email|sms|slack}** - Send notifications

### Infrastructure Requirements

- **Log Storage**: Elasticsearch or similar for log aggregation
- **Metrics Storage**: InfluxDB or Prometheus for metrics
- **Alert Manager**: PagerDuty, Opsgenie, or custom solution
- **Dashboard**: Grafana, Kibana, or custom dashboard
- **Notification Services**: Email, SMS, and Slack integrations

### Monitoring Dashboard

Create comprehensive dashboards showing:

1. **System Health Overview**
   - Overall system status
   - Active alerts count
   - Health check results
   - Error rate trends

2. **Performance Metrics**
   - Core Web Vitals over time
   - API response times
   - Resource loading performance
   - User experience scores

3. **Error Analysis**
   - Error frequency and trends
   - Top error categories
   - Error impact analysis
   - Resolution status

4. **Operational Metrics**
   - Alert statistics
   - Mean time to resolution
   - System availability
   - Performance budgets

## Troubleshooting

### Common Issues

#### High Memory Usage
```javascript
// Check memory usage
const memoryInfo = performanceMonitor.getMetrics('resource')
  .filter(m => m.name === 'memory_usage');

// Analyze memory trends
if (memoryInfo.some(info => info.usage > 0.8)) {
  log.warn('High memory usage detected', { memoryInfo });
  
  // Trigger garbage collection (if available)
  if (window.gc) {
    window.gc();
  }
}
```

#### API Performance Issues
```javascript
// Analyze API performance
const apiMetrics = performanceMonitor.getAPIMetrics();
const slowCalls = apiMetrics.filter(call => call.duration > 1000);

if (slowCalls.length > 0) {
  log.warn('Slow API calls detected', {
    count: slowCalls.length,
    averageTime: slowCalls.reduce((sum, call) => sum + call.duration, 0) / slowCalls.length
  });
}
```

#### Health Check Failures
```javascript
// Handle health check failures
window.addEventListener('health.status_updated', (event) => {
  const { checkId, status } = event.detail;
  
  if (status.status === 'UNHEALTHY') {
    log.error(`Health check failed: ${checkId}`, status);
    
    // Attempt automatic recovery
    if (checkId === 'websocket_connection') {
      // Reconnect WebSocket
      reconnectWebSocket();
    }
  }
});
```

### Debug Mode

Enable debug mode for additional logging:

```javascript
// Enable debug mode
localStorage.setItem('prescripto_debug', 'true');

// This will:
// - Enable trace level logging
// - Show console logs in production
// - Disable sampling for all events
// - Add debug information to UI
```

### Performance Debugging

```javascript
// Performance debugging helpers
window.prescriptoDebug = {
  // Get all performance metrics
  getMetrics: () => performanceMonitor.getMetrics(),
  
  // Get Core Web Vitals
  getVitals: () => performanceMonitor.getCoreWebVitals(),
  
  // Get error statistics
  getErrors: () => errorTracker.getErrorStats(),
  
  // Get system health
  getHealth: () => healthCheckService.getSystemStatus(),
  
  // Export logs
  exportLogs: () => log.export()
};
```

## API Reference

### LoggingService

```javascript
// Basic logging methods
log.error(message, error, context)
log.warn(message, context)
log.info(message, context)
log.debug(message, context)
log.trace(message, context)

// Specialized logging
log.userAction(action, context)
log.performance(metric, value, context)
log.business(event, data)
log.security(event, context)

// Configuration
log.setUser(userId, profile)
log.child(context)
log.flush()
log.export()
```

### AlertingService

```javascript
// Alert management
alertingService.triggerAlert(alertId, data, context)
alertingService.acknowledgeAlert(alertId, userId, reason)
alertingService.resolveAlert(alertId, userId, resolution)

// Configuration
alertingService.registerAlert(alertId, config)
alertingService.getActiveAlerts(category, severity)
alertingService.getAlertHistory(limit, category, severity)
alertingService.getAlertStatistics(timeRange)
```

### HealthCheckService

```javascript
// Health monitoring
healthCheckService.getSystemStatus()
healthCheckService.getAllHealthChecks()
healthCheckService.getHealthCheck(checkId)
healthCheckService.forceHealthCheck(checkId)

// Configuration
healthCheckService.enableHealthCheck(checkId)
healthCheckService.disableHealthCheck(checkId)
healthCheckService.getHealthHistory(checkId, limit)
```

### ErrorTrackingService

```javascript
// Error capture
captureError(error, context)
captureException(error, context)
captureMessage(message, level, context)

// Configuration
setUser(userId, userContext)
setContext(context)

// Data access
errorTracker.getErrorStats()
errorTracker.getErrorGroups()
errorTracker.getRecentErrors(limit)
```

### PerformanceMonitoringService

```javascript
// Performance monitoring
performanceMonitor.setUser(userId)
performanceMonitor.mark(name)
performanceMonitor.measure(name, startMark, endMark)

// Data access
performanceMonitor.getCoreWebVitals()
performanceMonitor.getPerformanceSummary()
performanceMonitor.getAPIMetrics()
performanceMonitor.getResourceMetrics()
```

---

## Implementation Status

✅ **Complete Production-Ready Operations & Monitoring Infrastructure**

- Advanced structured logging with privacy compliance
- Intelligent multi-channel alerting system
- Comprehensive health monitoring (15+ checks)
- Enterprise error tracking with smart grouping
- Performance monitoring with Core Web Vitals
- Full integration capabilities
- Production deployment documentation
- Comprehensive API reference

The Operations & Monitoring infrastructure provides enterprise-grade observability for Prescripto's production deployment with real-time monitoring, intelligent alerting, and comprehensive analytics capabilities.