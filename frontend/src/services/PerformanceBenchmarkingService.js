/**
 * PerformanceBenchmarkingService - Comprehensive Performance Benchmarking
 * 
 * Enterprise-grade performance benchmarking service providing comprehensive
 * performance testing, bottleneck identification, capacity planning, and
 * optimization recommendations for production systems.
 */

class PerformanceBenchmarkingService {
    constructor() {
        this.config = {
            // Benchmark configuration
            benchmarks: {
                loadTesting: {
                    enabled: true,
                    scenarios: {
                        baseline: { users: 10, duration: 60, rampUp: 10 },
                stress: { users: 100, duration: 300, rampUp: 60 },
                spike: { users: 500, duration: 60, rampUp: 5 },
                endurance: { users: 50, duration: 1800, rampUp: 120 },
                breakpoint: { users: 1000, duration: 600, rampUp: 300 }
                    }
                },
                
                performanceProfiling: {
                    enabled: true,
                    metrics: ['cpu', 'memory', 'network', 'disk', 'database'],
                    samplingInterval: 1000, // milliseconds
                    profilingDuration: 300000 // 5 minutes
                },
                
                webVitals: {
                    enabled: true,
                    metrics: ['LCP', 'FID', 'CLS', 'FCP', 'TTI', 'TTFB'],
                    thresholds: {
                        LCP: { good: 2500, poor: 4000 },
                        FID: { good: 100, poor: 300 },
                        CLS: { good: 0.1, poor: 0.25 },
                        FCP: { good: 1800, poor: 3000 },
                        TTI: { good: 3800, poor: 7300 },
                        TTFB: { good: 800, poor: 1800 }
                    }
                },
                
                apiPerformance: {
                    enabled: true,
                    endpoints: [
                        '/api/auth/login',
                        '/api/users/profile',
                        '/api/doctors',
                        '/api/appointments',
                        '/api/search'
                    ],
                    methods: ['GET', 'POST', 'PUT', 'DELETE'],
                    payloadSizes: ['small', 'medium', 'large'],
                    concurrencyLevels: [1, 5, 10, 25, 50, 100]
                }
            },
            
            // Performance targets
            targets: {
                responseTime: {
                    p50: 200,  // 50th percentile
                    p95: 500,  // 95th percentile
                    p99: 1000  // 99th percentile
                },
                throughput: {
                    min: 100,  // requests per second
                    target: 500,
                    max: 1000
                },
                errorRate: {
                    max: 0.01  // 1%
                },
                availability: {
                    min: 0.999 // 99.9%
                },
                resources: {
                    cpu: { max: 80 },      // percent
                    memory: { max: 85 },   // percent
                    disk: { max: 90 },     // percent
                    network: { max: 75 }   // percent
                }
            },
            
            // Reporting configuration
            reporting: {
                realTime: true,
                intervals: {
                    snapshot: 5000,     // 5 seconds
                    summary: 60000,     // 1 minute
                    detailed: 300000    // 5 minutes
                },
                retention: {
                    raw: 86400000,      // 24 hours
                    aggregated: 2592000000  // 30 days
                }
            }
        };

        this.benchmarkResults = new Map();
        this.activeTests = new Map();
        this.metrics = {
            loadTests: [],
            profiling: [],
            webVitals: [],
            apiTests: []
        };
        
        this.performanceBaseline = null;
        this.bottlenecks = [];
        this.optimizationRecommendations = [];
        
        this.initializeBenchmarking();
    }

    /**
     * Initialize performance benchmarking
     */
    async initializeBenchmarking() {
        // Set up performance observers
        this.setupPerformanceObservers();
        
        // Initialize baseline measurement
        await this.establishBaseline();
        
        // Start continuous monitoring
        this.startContinuousMonitoring();
        
        // Set up automated benchmarks
        this.setupAutomatedBenchmarks();
        
        // Initialize reporting
        this.startPerformanceReporting();
    }

    /**
     * Load testing benchmarks
     */

    async runLoadTest(scenario = 'baseline', options = {}) {
        const testConfig = {
            ...this.config.benchmarks.loadTesting.scenarios[scenario],
            ...options
        };
        
        const testId = this.generateTestId('load', scenario);
        const test = {
            id: testId,
            type: 'load',
            scenario,
            config: testConfig,
            startTime: Date.now(),
            status: 'running',
            metrics: {
                requests: [],
                errors: [],
                resources: [],
                timestamps: []
            }
        };
        
        this.activeTests.set(testId, test);
        
        try {
            console.log(`Starting load test: ${scenario} (${testConfig.users} users, ${testConfig.duration}s)`);
            
            // Ramp up phase
            await this.executeRampUp(test);
            
            // Sustained load phase
            await this.executeSustainedLoad(test);
            
            // Results analysis
            const results = await this.analyzeLoadTestResults(test);
            
            test.status = 'completed';
            test.endTime = Date.now();
            test.results = results;
            
            this.benchmarkResults.set(testId, test);
            this.metrics.loadTests.push(test);
            
            console.log(`Load test completed: ${scenario}`, results.summary);
            return results;
            
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            console.error(`Load test failed: ${scenario}`, error);
            throw error;
        } finally {
            this.activeTests.delete(testId);
        }
    }

    async executeRampUp(test) {
        const { users, rampUp } = test.config;
        const rampUpInterval = (rampUp * 1000) / users;
        
        for (let i = 0; i < users; i++) {
            setTimeout(() => {
                this.startVirtualUser(test, i);
            }, i * rampUpInterval);
        }
        
        // Wait for ramp up to complete
        await new Promise(resolve => setTimeout(resolve, rampUp * 1000));
    }

    async executeSustainedLoad(test) {
        const sustainedDuration = test.config.duration - test.config.rampUp;
        
        // Monitor performance during sustained load
        const monitoringInterval = setInterval(() => {
            this.collectLoadTestMetrics(test);
        }, 1000);
        
        // Wait for sustained load duration
        await new Promise(resolve => setTimeout(resolve, sustainedDuration * 1000));
        
        clearInterval(monitoringInterval);
    }

    startVirtualUser(test, userId) {
        const user = {
            id: userId,
            testId: test.id,
            startTime: Date.now(),
            requests: 0,
            errors: 0,
            totalTime: 0
        };
        
        // Simulate user behavior
        this.simulateUserSession(test, user);
    }

    async simulateUserSession(test, user) {
        const sessionDuration = test.config.duration * 1000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < sessionDuration) {
            try {
                const requestStart = Date.now();
                
                // Simulate API request
                await this.simulateRequest(test, user);
                
                const requestTime = Date.now() - requestStart;
                user.requests++;
                user.totalTime += requestTime;
                
                // Record request metrics
                test.metrics.requests.push({
                    userId: user.id,
                    timestamp: Date.now(),
                    duration: requestTime,
                    success: true
                });
                
                // Think time between requests
                await this.simulateThinkTime();
                
            } catch (error) {
                user.errors++;
                test.metrics.errors.push({
                    userId: user.id,
                    timestamp: Date.now(),
                    error: error.message
                });
            }
        }
    }

    async simulateRequest(test, user) {
        // Simulate various API endpoints
        const endpoints = this.config.benchmarks.apiPerformance.endpoints;
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        
        // Mock request - replace with actual HTTP requests
        const latency = this.generateRealisticLatency();
        
        if (Math.random() < 0.95) { // 95% success rate
            await new Promise(resolve => setTimeout(resolve, latency));
            return { status: 200, data: 'success' };
        } else {
            throw new Error('Request failed');
        }
    }

    generateRealisticLatency() {
        // Generate realistic latency with normal distribution
        const mean = 200;
        const stdDev = 50;
        
        // Box-Muller transformation for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        return Math.max(50, mean + stdDev * z);
    }

    async simulateThinkTime() {
        // Simulate user think time (1-5 seconds)
        const thinkTime = 1000 + Math.random() * 4000;
        await new Promise(resolve => setTimeout(resolve, thinkTime));
    }

    collectLoadTestMetrics(test) {
        // Collect system resource metrics during test
        const metrics = {
            timestamp: Date.now(),
            cpu: Math.random() * 100,      // Mock CPU usage
            memory: Math.random() * 100,   // Mock memory usage
            network: Math.random() * 100,  // Mock network usage
            activeUsers: test.config.users,
            requestRate: this.calculateCurrentRequestRate(test),
            errorRate: this.calculateCurrentErrorRate(test)
        };
        
        test.metrics.resources.push(metrics);
        test.metrics.timestamps.push(metrics.timestamp);
    }

    calculateCurrentRequestRate(test) {
        const lastMinuteRequests = test.metrics.requests.filter(
            r => Date.now() - r.timestamp < 60000
        );
        return lastMinuteRequests.length;
    }

    calculateCurrentErrorRate(test) {
        const lastMinuteRequests = test.metrics.requests.filter(
            r => Date.now() - r.timestamp < 60000
        );
        const lastMinuteErrors = test.metrics.errors.filter(
            e => Date.now() - e.timestamp < 60000
        );
        
        const totalRequests = lastMinuteRequests.length + lastMinuteErrors.length;
        return totalRequests > 0 ? lastMinuteErrors.length / totalRequests : 0;
    }

    async analyzeLoadTestResults(test) {
        const requests = test.metrics.requests;
        const errors = test.metrics.errors;
        const resources = test.metrics.resources;
        
        // Calculate response time percentiles
        const responseTimes = requests.map(r => r.duration).sort((a, b) => a - b);
        const percentiles = this.calculatePercentiles(responseTimes);
        
        // Calculate throughput
        const totalDuration = (test.endTime - test.startTime) / 1000;
        const throughput = requests.length / totalDuration;
        
        // Calculate error rate
        const totalRequests = requests.length + errors.length;
        const errorRate = totalRequests > 0 ? errors.length / totalRequests : 0;
        
        // Calculate resource utilization
        const avgCPU = resources.reduce((sum, r) => sum + r.cpu, 0) / resources.length;
        const avgMemory = resources.reduce((sum, r) => sum + r.memory, 0) / resources.length;
        
        const results = {
            summary: {
                scenario: test.scenario,
                duration: totalDuration,
                totalRequests: requests.length,
                totalErrors: errors.length,
                throughput: Math.round(throughput * 100) / 100,
                errorRate: Math.round(errorRate * 10000) / 100, // percentage
                avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            },
            performance: {
                responseTime: {
                    p50: percentiles.p50,
                    p95: percentiles.p95,
                    p99: percentiles.p99,
                    min: Math.min(...responseTimes),
                    max: Math.max(...responseTimes)
                },
                throughput: {
                    rps: throughput,
                    peak: Math.max(...resources.map(r => r.requestRate))
                },
                errorRate: {
                    overall: errorRate,
                    peak: Math.max(...resources.map(r => r.errorRate))
                }
            },
            resources: {
                cpu: {
                    average: Math.round(avgCPU),
                    peak: Math.max(...resources.map(r => r.cpu))
                },
                memory: {
                    average: Math.round(avgMemory),
                    peak: Math.max(...resources.map(r => r.memory))
                }
            },
            compliance: this.checkPerformanceCompliance(percentiles, throughput, errorRate),
            recommendations: this.generateLoadTestRecommendations(test, percentiles, throughput, errorRate)
        };
        
        return results;
    }

    calculatePercentiles(data) {
        if (data.length === 0) return { p50: 0, p95: 0, p99: 0 };
        
        return {
            p50: data[Math.floor(data.length * 0.5)],
            p95: data[Math.floor(data.length * 0.95)],
            p99: data[Math.floor(data.length * 0.99)]
        };
    }

    checkPerformanceCompliance(percentiles, throughput, errorRate) {
        const targets = this.config.targets;
        
        return {
            responseTime: {
                p50: percentiles.p50 <= targets.responseTime.p50,
                p95: percentiles.p95 <= targets.responseTime.p95,
                p99: percentiles.p99 <= targets.responseTime.p99
            },
            throughput: throughput >= targets.throughput.min,
            errorRate: errorRate <= targets.errorRate.max
        };
    }

    generateLoadTestRecommendations(test, percentiles, throughput, errorRate) {
        const recommendations = [];
        const targets = this.config.targets;
        
        // Response time recommendations
        if (percentiles.p95 > targets.responseTime.p95) {
            recommendations.push({
                category: 'response_time',
                priority: 'high',
                issue: `95th percentile response time (${percentiles.p95}ms) exceeds target (${targets.responseTime.p95}ms)`,
                recommendations: [
                    'Optimize database queries',
                    'Implement caching strategies',
                    'Scale application instances',
                    'Review code for performance bottlenecks'
                ]
            });
        }
        
        // Throughput recommendations
        if (throughput < targets.throughput.min) {
            recommendations.push({
                category: 'throughput',
                priority: 'high',
                issue: `Throughput (${throughput.toFixed(2)} RPS) below minimum target (${targets.throughput.min} RPS)`,
                recommendations: [
                    'Scale horizontally',
                    'Optimize application code',
                    'Implement connection pooling',
                    'Review infrastructure capacity'
                ]
            });
        }
        
        // Error rate recommendations
        if (errorRate > targets.errorRate.max) {
            recommendations.push({
                category: 'reliability',
                priority: 'critical',
                issue: `Error rate (${(errorRate * 100).toFixed(2)}%) exceeds maximum (${(targets.errorRate.max * 100).toFixed(2)}%)`,
                recommendations: [
                    'Investigate error root causes',
                    'Implement circuit breakers',
                    'Add retry mechanisms',
                    'Improve error handling'
                ]
            });
        }
        
        return recommendations;
    }

    /**
     * Performance profiling
     */

    async runPerformanceProfiling(duration = 300000) {
        const profilingId = this.generateTestId('profiling', 'system');
        const profiling = {
            id: profilingId,
            type: 'profiling',
            startTime: Date.now(),
            duration,
            status: 'running',
            metrics: {
                cpu: [],
                memory: [],
                network: [],
                disk: [],
                database: []
            }
        };
        
        this.activeTests.set(profilingId, profiling);
        
        try {
            console.log(`Starting performance profiling for ${duration / 1000}s`);
            
            // Start metric collection
            const interval = setInterval(() => {
                this.collectProfilingMetrics(profiling);
            }, this.config.benchmarks.performanceProfiling.samplingInterval);
            
            // Wait for profiling duration
            await new Promise(resolve => setTimeout(resolve, duration));
            
            clearInterval(interval);
            
            // Analyze profiling results
            const results = this.analyzeProfilingResults(profiling);
            
            profiling.status = 'completed';
            profiling.endTime = Date.now();
            profiling.results = results;
            
            this.benchmarkResults.set(profilingId, profiling);
            this.metrics.profiling.push(profiling);
            
            console.log('Performance profiling completed', results.summary);
            return results;
            
        } catch (error) {
            profiling.status = 'failed';
            profiling.error = error.message;
            throw error;
        } finally {
            this.activeTests.delete(profilingId);
        }
    }

    collectProfilingMetrics(profiling) {
        const timestamp = Date.now();
        
        // Mock system metrics - replace with actual system monitoring
        const metrics = {
            cpu: {
                timestamp,
                usage: Math.random() * 100,
                processes: Math.floor(Math.random() * 200),
                loadAverage: Math.random() * 4
            },
            memory: {
                timestamp,
                usage: Math.random() * 100,
                heap: Math.random() * 1000,
                rss: Math.random() * 2000,
                external: Math.random() * 500
            },
            network: {
                timestamp,
                bytesReceived: Math.random() * 1000000,
                bytesSent: Math.random() * 1000000,
                connections: Math.floor(Math.random() * 100)
            },
            disk: {
                timestamp,
                usage: Math.random() * 100,
                readIops: Math.random() * 1000,
                writeIops: Math.random() * 500,
                readThroughput: Math.random() * 50000000,
                writeThroughput: Math.random() * 25000000
            },
            database: {
                timestamp,
                connections: Math.floor(Math.random() * 50),
                activeQueries: Math.floor(Math.random() * 20),
                cacheHitRate: Math.random(),
                avgQueryTime: Math.random() * 100
            }
        };
        
        // Store metrics
        Object.keys(metrics).forEach(category => {
            profiling.metrics[category].push(metrics[category]);
        });
    }

    analyzeProfilingResults(profiling) {
        const results = {
            summary: {},
            trends: {},
            bottlenecks: [],
            recommendations: []
        };
        
        // Analyze each metric category
        Object.keys(profiling.metrics).forEach(category => {
            const categoryMetrics = profiling.metrics[category];
            const analysis = this.analyzeMetricCategory(category, categoryMetrics);
            
            results.summary[category] = analysis.summary;
            results.trends[category] = analysis.trends;
            
            if (analysis.bottlenecks.length > 0) {
                results.bottlenecks.push(...analysis.bottlenecks);
            }
            
            if (analysis.recommendations.length > 0) {
                results.recommendations.push(...analysis.recommendations);
            }
        });
        
        return results;
    }

    analyzeMetricCategory(category, metrics) {
        if (metrics.length === 0) {
            return { summary: {}, trends: {}, bottlenecks: [], recommendations: [] };
        }
        
        const values = metrics.map(m => this.getMetricValue(category, m));
        const timestamps = metrics.map(m => m.timestamp);
        
        const summary = {
            average: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            samples: values.length
        };
        
        const trends = {
            direction: this.calculateTrend(values),
            volatility: this.calculateVolatility(values),
            growthRate: this.calculateGrowthRate(values)
        };
        
        const bottlenecks = this.identifyBottlenecks(category, summary, values);
        const recommendations = this.generateCategoryRecommendations(category, summary, trends);
        
        return { summary, trends, bottlenecks, recommendations };
    }

    getMetricValue(category, metric) {
        switch (category) {
            case 'cpu':
                return metric.usage;
            case 'memory':
                return metric.usage;
            case 'network':
                return (metric.bytesReceived + metric.bytesSent) / 1000000; // MB
            case 'disk':
                return metric.usage;
            case 'database':
                return metric.avgQueryTime;
            default:
                return 0;
        }
    }

    calculateTrend(values) {
        if (values.length < 2) return 'stable';
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const change = (secondAvg - firstAvg) / firstAvg;
        
        if (change > 0.1) return 'increasing';
        if (change < -0.1) return 'decreasing';
        return 'stable';
    }

    calculateVolatility(values) {
        if (values.length < 2) return 0;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);
        
        return standardDeviation / mean; // Coefficient of variation
    }

    calculateGrowthRate(values) {
        if (values.length < 2) return 0;
        
        const first = values[0];
        const last = values[values.length - 1];
        
        return (last - first) / first;
    }

    identifyBottlenecks(category, summary, values) {
        const bottlenecks = [];
        const thresholds = this.config.targets.resources;
        
        if (category === 'cpu' && summary.average > thresholds.cpu.max) {
            bottlenecks.push({
                type: 'cpu',
                severity: 'high',
                description: `High CPU utilization (${summary.average.toFixed(1)}%)`,
                impact: 'performance_degradation'
            });
        }
        
        if (category === 'memory' && summary.average > thresholds.memory.max) {
            bottlenecks.push({
                type: 'memory',
                severity: 'high',
                description: `High memory utilization (${summary.average.toFixed(1)}%)`,
                impact: 'potential_oom'
            });
        }
        
        return bottlenecks;
    }

    generateCategoryRecommendations(category, summary, trends) {
        const recommendations = [];
        
        if (category === 'cpu' && summary.average > 70) {
            recommendations.push({
                category: 'cpu_optimization',
                priority: trends.direction === 'increasing' ? 'high' : 'medium',
                description: 'CPU usage is high',
                actions: [
                    'Profile application for CPU-intensive operations',
                    'Implement code optimizations',
                    'Consider horizontal scaling',
                    'Review algorithms for efficiency'
                ]
            });
        }
        
        if (category === 'memory' && summary.average > 80) {
            recommendations.push({
                category: 'memory_optimization',
                priority: 'high',
                description: 'Memory usage is approaching limits',
                actions: [
                    'Implement memory profiling',
                    'Check for memory leaks',
                    'Optimize data structures',
                    'Consider increasing memory allocation'
                ]
            });
        }
        
        return recommendations;
    }

    /**
     * Web Vitals benchmarking
     */

    setupPerformanceObservers() {
        if (typeof window === 'undefined') return;
        
        // Largest Contentful Paint (LCP)
        this.observeWebVital('largest-contentful-paint', (entry) => {
            this.recordWebVital('LCP', entry.startTime);
        });
        
        // First Input Delay (FID)
        this.observeWebVital('first-input', (entry) => {
            this.recordWebVital('FID', entry.processingStart - entry.startTime);
        });
        
        // Cumulative Layout Shift (CLS)
        this.observeWebVital('layout-shift', (entry) => {
            if (!entry.hadRecentInput) {
                this.recordWebVital('CLS', entry.value);
            }
        });
        
        // First Contentful Paint (FCP)
        this.observeWebVital('paint', (entry) => {
            if (entry.name === 'first-contentful-paint') {
                this.recordWebVital('FCP', entry.startTime);
            }
        });
        
        // Navigation timing for TTFB
        if ('navigation' in window.performance) {
            const navTiming = window.performance.getEntriesByType('navigation')[0];
            if (navTiming) {
                this.recordWebVital('TTFB', navTiming.responseStart - navTiming.fetchStart);
            }
        }
    }

    observeWebVital(entryType, callback) {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach(callback);
                });
                observer.observe({ entryTypes: [entryType] });
            } catch (error) {
                console.warn(`Failed to observe ${entryType}:`, error);
            }
        }
    }

    recordWebVital(metric, value) {
        const vitals = {
            metric,
            value: Math.round(value),
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.metrics.webVitals.push(vitals);
        
        // Check against thresholds
        const threshold = this.config.benchmarks.webVitals.thresholds[metric];
        if (threshold) {
            vitals.rating = this.rateWebVital(value, threshold);
        }
        
        // Report to monitoring service
        if (window.performanceMonitor) {
            window.performanceMonitor.recordWebVital(vitals);
        }
    }

    rateWebVital(value, threshold) {
        if (value <= threshold.good) return 'good';
        if (value <= threshold.poor) return 'needs-improvement';
        return 'poor';
    }

    async runWebVitalsBenchmark(pages = ['/'], iterations = 5) {
        const benchmarkId = this.generateTestId('webvitals', 'pages');
        const results = [];
        
        console.log(`Starting Web Vitals benchmark for ${pages.length} pages, ${iterations} iterations each`);
        
        for (const page of pages) {
            const pageResults = {
                page,
                iterations: [],
                aggregated: {}
            };
            
            for (let i = 0; i < iterations; i++) {
                const iteration = await this.measurePageWebVitals(page);
                pageResults.iterations.push(iteration);
            }
            
            pageResults.aggregated = this.aggregateWebVitals(pageResults.iterations);
            results.push(pageResults);
        }
        
        const benchmark = {
            id: benchmarkId,
            type: 'webvitals',
            pages,
            iterations,
            timestamp: Date.now(),
            results
        };
        
        this.benchmarkResults.set(benchmarkId, benchmark);
        console.log('Web Vitals benchmark completed', benchmark);
        
        return benchmark;
    }

    async measurePageWebVitals(page) {
        // Mock Web Vitals measurement - replace with actual measurement
        return {
            page,
            timestamp: Date.now(),
            LCP: Math.random() * 3000 + 1000,
            FID: Math.random() * 200 + 50,
            CLS: Math.random() * 0.2,
            FCP: Math.random() * 2000 + 800,
            TTI: Math.random() * 5000 + 2000,
            TTFB: Math.random() * 1000 + 300
        };
    }

    aggregateWebVitals(iterations) {
        const metrics = ['LCP', 'FID', 'CLS', 'FCP', 'TTI', 'TTFB'];
        const aggregated = {};
        
        metrics.forEach(metric => {
            const values = iterations.map(i => i[metric]).filter(v => v != null);
            
            if (values.length > 0) {
                const sorted = values.sort((a, b) => a - b);
                aggregated[metric] = {
                    min: Math.min(...values),
                    max: Math.max(...values),
                    average: values.reduce((a, b) => a + b, 0) / values.length,
                    p50: sorted[Math.floor(sorted.length * 0.5)],
                    p95: sorted[Math.floor(sorted.length * 0.95)],
                    p99: sorted[Math.floor(sorted.length * 0.99)]
                };
                
                // Rate performance
                const threshold = this.config.benchmarks.webVitals.thresholds[metric];
                if (threshold) {
                    aggregated[metric].rating = this.rateWebVital(aggregated[metric].p95, threshold);
                }
            }
        });
        
        return aggregated;
    }

    /**
     * API performance benchmarking
     */

    async runAPIPerformanceBenchmark() {
        const benchmarkId = this.generateTestId('api', 'endpoints');
        const endpoints = this.config.benchmarks.apiPerformance.endpoints;
        const concurrencyLevels = this.config.benchmarks.apiPerformance.concurrencyLevels;
        
        const results = [];
        
        console.log(`Starting API performance benchmark for ${endpoints.length} endpoints`);
        
        for (const endpoint of endpoints) {
            const endpointResults = {
                endpoint,
                methods: {}
            };
            
            for (const method of ['GET', 'POST']) {
                const methodResults = {
                    method,
                    concurrency: {}
                };
                
                for (const concurrency of concurrencyLevels) {
                    const concurrencyResult = await this.benchmarkEndpoint(endpoint, method, concurrency);
                    methodResults.concurrency[concurrency] = concurrencyResult;
                }
                
                endpointResults.methods[method] = methodResults;
            }
            
            results.push(endpointResults);
        }
        
        const benchmark = {
            id: benchmarkId,
            type: 'api',
            timestamp: Date.now(),
            results
        };
        
        this.benchmarkResults.set(benchmarkId, benchmark);
        console.log('API performance benchmark completed', benchmark);
        
        return benchmark;
    }

    async benchmarkEndpoint(endpoint, method, concurrency) {
        const requests = [];
        const duration = 60000; // 1 minute
        const startTime = Date.now();
        
        // Create concurrent requests
        const promises = [];
        for (let i = 0; i < concurrency; i++) {
            promises.push(this.runConcurrentRequests(endpoint, method, duration, requests));
        }
        
        await Promise.all(promises);
        
        // Analyze results
        const responseTimes = requests.map(r => r.responseTime);
        const successfulRequests = requests.filter(r => r.success);
        const errors = requests.filter(r => !r.success);
        
        return {
            concurrency,
            totalRequests: requests.length,
            successfulRequests: successfulRequests.length,
            errors: errors.length,
            errorRate: errors.length / requests.length,
            throughput: requests.length / (duration / 1000),
            responseTime: {
                min: Math.min(...responseTimes),
                max: Math.max(...responseTimes),
                average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
                percentiles: this.calculatePercentiles(responseTimes.sort((a, b) => a - b))
            }
        };
    }

    async runConcurrentRequests(endpoint, method, duration, requests) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < duration) {
            const requestStart = Date.now();
            
            try {
                await this.makeAPIRequest(endpoint, method);
                
                requests.push({
                    endpoint,
                    method,
                    timestamp: requestStart,
                    responseTime: Date.now() - requestStart,
                    success: true
                });
            } catch (error) {
                requests.push({
                    endpoint,
                    method,
                    timestamp: requestStart,
                    responseTime: Date.now() - requestStart,
                    success: false,
                    error: error.message
                });
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    async makeAPIRequest(endpoint, method) {
        // Mock API request - replace with actual HTTP requests
        const latency = this.generateRealisticLatency();
        
        await new Promise(resolve => setTimeout(resolve, latency));
        
        if (Math.random() < 0.95) { // 95% success rate
            return { status: 200, data: 'success' };
        } else {
            throw new Error('API request failed');
        }
    }

    /**
     * Baseline and continuous monitoring
     */

    async establishBaseline() {
        console.log('Establishing performance baseline...');
        
        const baseline = {
            timestamp: Date.now(),
            loadTest: await this.runLoadTest('baseline'),
            profiling: await this.runPerformanceProfiling(60000), // 1 minute
            webVitals: await this.runWebVitalsBenchmark(['/'], 3),
            apiPerformance: await this.runAPIPerformanceBenchmark()
        };
        
        this.performanceBaseline = baseline;
        console.log('Performance baseline established', baseline);
        
        return baseline;
    }

    startContinuousMonitoring() {
        // Monitor Web Vitals continuously
        if (typeof window !== 'undefined') {
            setInterval(() => {
                this.collectCurrentWebVitals();
            }, this.config.reporting.intervals.snapshot);
        }
        
        // Monitor system performance
        setInterval(() => {
            this.collectSystemMetrics();
        }, this.config.reporting.intervals.snapshot);
    }

    collectCurrentWebVitals() {
        // Collect current Web Vitals if available
        if (window.performance) {
            const navigation = window.performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.recordWebVital('TTFB', navigation.responseStart - navigation.fetchStart);
            }
        }
    }

    collectSystemMetrics() {
        // Mock system metrics collection
        const metrics = {
            timestamp: Date.now(),
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            network: Math.random() * 100
        };
        
        // Store for trend analysis
        this.metrics.profiling.push({
            timestamp: metrics.timestamp,
            metrics: { system: metrics }
        });
    }

    /**
     * Automated benchmarks
     */

    setupAutomatedBenchmarks() {
        // Daily performance checks
        setInterval(() => {
            this.runAutomatedBenchmark('daily');
        }, 86400000); // 24 hours
        
        // Weekly comprehensive benchmark
        setInterval(() => {
            this.runAutomatedBenchmark('weekly');
        }, 604800000); // 7 days
    }

    async runAutomatedBenchmark(type) {
        console.log(`Running automated ${type} benchmark...`);
        
        try {
            const benchmark = {
                type: `automated_${type}`,
                timestamp: Date.now(),
                results: {}
            };
            
            if (type === 'daily') {
                benchmark.results.loadTest = await this.runLoadTest('baseline');
                benchmark.results.webVitals = await this.runWebVitalsBenchmark(['/']);
            } else if (type === 'weekly') {
                benchmark.results.loadTest = await this.runLoadTest('stress');
                benchmark.results.profiling = await this.runPerformanceProfiling(300000);
                benchmark.results.webVitals = await this.runWebVitalsBenchmark(['/'], 5);
                benchmark.results.apiPerformance = await this.runAPIPerformanceBenchmark();
            }
            
            // Compare against baseline
            const comparison = this.compareWithBaseline(benchmark);
            benchmark.comparison = comparison;
            
            // Generate recommendations
            const recommendations = this.generateBenchmarkRecommendations(benchmark);
            benchmark.recommendations = recommendations;
            
            // Store results
            const benchmarkId = this.generateTestId('automated', type);
            this.benchmarkResults.set(benchmarkId, benchmark);
            
            console.log(`Automated ${type} benchmark completed`, benchmark);
            
        } catch (error) {
            console.error(`Automated ${type} benchmark failed:`, error);
        }
    }

    compareWithBaseline(benchmark) {
        if (!this.performanceBaseline) return null;
        
        const comparison = {
            loadTest: null,
            webVitals: null,
            overall: 'stable'
        };
        
        // Compare load test results
        if (benchmark.results.loadTest && this.performanceBaseline.loadTest) {
            const current = benchmark.results.loadTest.summary;
            const baseline = this.performanceBaseline.loadTest.summary;
            
            comparison.loadTest = {
                throughput: this.calculateChangePercentage(current.throughput, baseline.throughput),
                responseTime: this.calculateChangePercentage(current.avgResponseTime, baseline.avgResponseTime),
                errorRate: this.calculateChangePercentage(current.errorRate, baseline.errorRate)
            };
        }
        
        return comparison;
    }

    calculateChangePercentage(current, baseline) {
        if (baseline === 0) return 0;
        return ((current - baseline) / baseline) * 100;
    }

    generateBenchmarkRecommendations(benchmark) {
        const recommendations = [];
        
        // Analyze trends and generate recommendations
        if (benchmark.comparison?.loadTest) {
            const lt = benchmark.comparison.loadTest;
            
            if (lt.responseTime > 20) { // 20% increase in response time
                recommendations.push({
                    category: 'performance_degradation',
                    priority: 'high',
                    description: `Response time increased by ${lt.responseTime.toFixed(1)}%`,
                    actions: [
                        'Investigate recent code changes',
                        'Check database performance',
                        'Review infrastructure resources',
                        'Consider performance optimizations'
                    ]
                });
            }
            
            if (lt.throughput < -10) { // 10% decrease in throughput
                recommendations.push({
                    category: 'capacity_issue',
                    priority: 'medium',
                    description: `Throughput decreased by ${Math.abs(lt.throughput).toFixed(1)}%`,
                    actions: [
                        'Monitor resource utilization',
                        'Check for bottlenecks',
                        'Consider scaling up',
                        'Review recent deployments'
                    ]
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Performance reporting
     */

    startPerformanceReporting() {
        // Real-time snapshot reports
        if (this.config.reporting.realTime) {
            setInterval(() => {
                this.generateSnapshotReport();
            }, this.config.reporting.intervals.snapshot);
        }
        
        // Summary reports
        setInterval(() => {
            this.generateSummaryReport();
        }, this.config.reporting.intervals.summary);
        
        // Detailed reports
        setInterval(() => {
            this.generateDetailedReport();
        }, this.config.reporting.intervals.detailed);
    }

    generateSnapshotReport() {
        const report = {
            timestamp: Date.now(),
            type: 'snapshot',
            activeTests: this.activeTests.size,
            recentMetrics: {
                webVitals: this.metrics.webVitals.slice(-10),
                requests: this.metrics.requests?.slice(-10) || []
            }
        };
        
        this.broadcastReport(report);
    }

    generateSummaryReport() {
        const report = {
            timestamp: Date.now(),
            type: 'summary',
            period: '1min',
            metrics: {
                totalTests: this.benchmarkResults.size,
                activeTests: this.activeTests.size,
                webVitals: this.summarizeWebVitals(),
                performance: this.summarizePerformance()
            }
        };
        
        this.broadcastReport(report);
    }

    generateDetailedReport() {
        const report = {
            timestamp: Date.now(),
            type: 'detailed',
            period: '5min',
            summary: this.generatePerformanceSummary(),
            trends: this.analyzePerformanceTrends(),
            recommendations: this.consolidateRecommendations(),
            compliance: this.checkOverallCompliance()
        };
        
        this.broadcastReport(report);
        console.log('Performance detailed report:', report);
    }

    summarizeWebVitals() {
        const recent = this.metrics.webVitals.filter(
            v => Date.now() - v.timestamp < 60000 // Last minute
        );
        
        const summary = {};
        ['LCP', 'FID', 'CLS', 'FCP', 'TTI', 'TTFB'].forEach(metric => {
            const values = recent.filter(v => v.metric === metric).map(v => v.value);
            if (values.length > 0) {
                summary[metric] = {
                    average: values.reduce((a, b) => a + b, 0) / values.length,
                    samples: values.length
                };
            }
        });
        
        return summary;
    }

    summarizePerformance() {
        return {
            benchmarks: this.benchmarkResults.size,
            baseline: this.performanceBaseline ? 'established' : 'pending',
            bottlenecks: this.bottlenecks.length,
            recommendations: this.optimizationRecommendations.length
        };
    }

    generatePerformanceSummary() {
        const recentTests = Array.from(this.benchmarkResults.values()).filter(
            test => Date.now() - test.startTime < 300000 // Last 5 minutes
        );
        
        return {
            testsExecuted: recentTests.length,
            testTypes: recentTests.map(t => t.type),
            averagePerformance: this.calculateAveragePerformance(recentTests),
            issues: this.identifyCurrentIssues()
        };
    }

    analyzePerformanceTrends() {
        const trends = {
            responseTime: this.analyzeTrend('responseTime'),
            throughput: this.analyzeTrend('throughput'),
            errorRate: this.analyzeTrend('errorRate'),
            webVitals: this.analyzeWebVitalsTrends()
        };
        
        return trends;
    }

    analyzeTrend(metric) {
        // Analyze trend over time for specific metric
        const recentTests = Array.from(this.benchmarkResults.values())
            .filter(test => test.results?.summary?.[metric] != null)
            .slice(-10); // Last 10 tests
        
        if (recentTests.length < 2) return 'insufficient_data';
        
        const values = recentTests.map(test => test.results.summary[metric]);
        return this.calculateTrend(values);
    }

    analyzeWebVitalsTrends() {
        const trends = {};
        
        ['LCP', 'FID', 'CLS'].forEach(metric => {
            const recentValues = this.metrics.webVitals
                .filter(v => v.metric === metric && Date.now() - v.timestamp < 3600000) // Last hour
                .map(v => v.value);
            
            if (recentValues.length > 1) {
                trends[metric] = this.calculateTrend(recentValues);
            }
        });
        
        return trends;
    }

    consolidateRecommendations() {
        const all = [...this.optimizationRecommendations];
        
        // Add recommendations from recent benchmarks
        Array.from(this.benchmarkResults.values())
            .filter(b => b.recommendations)
            .forEach(benchmark => {
                all.push(...benchmark.recommendations);
            });
        
        // Deduplicate and prioritize
        const consolidated = this.deduplicateRecommendations(all);
        return consolidated.slice(0, 10); // Top 10
    }

    deduplicateRecommendations(recommendations) {
        const seen = new Set();
        const unique = [];
        
        recommendations.forEach(rec => {
            const key = `${rec.category}_${rec.description}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(rec);
            }
        });
        
        return unique.sort((a, b) => {
            const priorities = { critical: 3, high: 2, medium: 1, low: 0 };
            return priorities[b.priority] - priorities[a.priority];
        });
    }

    checkOverallCompliance() {
        const targets = this.config.targets;
        const recent = this.getRecentPerformanceData();
        
        return {
            responseTime: recent.responseTime <= targets.responseTime.p95,
            throughput: recent.throughput >= targets.throughput.min,
            errorRate: recent.errorRate <= targets.errorRate.max,
            webVitals: this.checkWebVitalsCompliance(),
            overall: this.calculateOverallCompliance()
        };
    }

    getRecentPerformanceData() {
        const recentTests = Array.from(this.benchmarkResults.values())
            .filter(test => test.results?.summary)
            .slice(-5); // Last 5 tests
        
        if (recentTests.length === 0) {
            return { responseTime: 0, throughput: 0, errorRate: 0 };
        }
        
        const summaries = recentTests.map(t => t.results.summary);
        
        return {
            responseTime: summaries.reduce((sum, s) => sum + s.avgResponseTime, 0) / summaries.length,
            throughput: summaries.reduce((sum, s) => sum + s.throughput, 0) / summaries.length,
            errorRate: summaries.reduce((sum, s) => sum + s.errorRate, 0) / summaries.length
        };
    }

    checkWebVitalsCompliance() {
        const thresholds = this.config.benchmarks.webVitals.thresholds;
        const recent = this.metrics.webVitals.filter(
            v => Date.now() - v.timestamp < 300000 // Last 5 minutes
        );
        
        const compliance = {};
        
        Object.keys(thresholds).forEach(metric => {
            const values = recent.filter(v => v.metric === metric).map(v => v.value);
            if (values.length > 0) {
                const p95 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)];
                compliance[metric] = p95 <= thresholds[metric].good;
            }
        });
        
        return compliance;
    }

    calculateOverallCompliance() {
        // Calculate overall compliance score
        const compliance = this.checkOverallCompliance();
        const checks = Object.values(compliance).filter(v => typeof v === 'boolean');
        const passed = checks.filter(v => v).length;
        
        return passed / checks.length;
    }

    calculateAveragePerformance(tests) {
        if (tests.length === 0) return null;
        
        const summaries = tests.filter(t => t.results?.summary).map(t => t.results.summary);
        if (summaries.length === 0) return null;
        
        return {
            avgResponseTime: summaries.reduce((sum, s) => sum + s.avgResponseTime, 0) / summaries.length,
            avgThroughput: summaries.reduce((sum, s) => sum + s.throughput, 0) / summaries.length,
            avgErrorRate: summaries.reduce((sum, s) => sum + s.errorRate, 0) / summaries.length
        };
    }

    identifyCurrentIssues() {
        const issues = [];
        
        // Check recent performance against targets
        const recent = this.getRecentPerformanceData();
        const targets = this.config.targets;
        
        if (recent.responseTime > targets.responseTime.p95) {
            issues.push({
                type: 'performance',
                severity: 'high',
                description: 'Response time exceeds target'
            });
        }
        
        if (recent.errorRate > targets.errorRate.max) {
            issues.push({
                type: 'reliability',
                severity: 'critical',
                description: 'Error rate exceeds maximum threshold'
            });
        }
        
        return issues;
    }

    broadcastReport(report) {
        // Broadcast report to monitoring service
        if (typeof window !== 'undefined' && window.performanceMonitor) {
            window.performanceMonitor.recordMetric('performance_benchmark', {
                ...report,
                type: 'benchmarking',
                category: 'performance'
            });
        }
    }

    generateTestId(type, scenario) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 7);
        return `${type}_${scenario}_${timestamp}_${random}`;
    }

    /**
     * Public API
     */

    // Test execution
    async runLoadTest(scenario, options) {
        return await this.runLoadTest(scenario, options);
    }

    async runPerformanceProfiling(duration) {
        return await this.runPerformanceProfiling(duration);
    }

    async runWebVitalsBenchmark(pages, iterations) {
        return await this.runWebVitalsBenchmark(pages, iterations);
    }

    async runAPIBenchmark() {
        return await this.runAPIPerformanceBenchmark();
    }

    // Results and analysis
    getBenchmarkResults() {
        return Array.from(this.benchmarkResults.values());
    }

    getPerformanceBaseline() {
        return this.performanceBaseline;
    }

    getBottlenecks() {
        return this.bottlenecks;
    }

    getRecommendations() {
        return this.optimizationRecommendations;
    }

    // Configuration
    updateBenchmarkConfig(config) {
        this.config = { ...this.config, ...config };
    }

    updatePerformanceTargets(targets) {
        this.config.targets = { ...this.config.targets, ...targets };
    }

    // Monitoring
    getPerformanceMetrics() {
        return {
            webVitals: this.metrics.webVitals.slice(-100),
            loadTests: this.metrics.loadTests.slice(-10),
            profiling: this.metrics.profiling.slice(-10),
            apiTests: this.metrics.apiTests.slice(-10)
        };
    }

    getSystemHealth() {
        return {
            status: 'healthy', // Implement actual health check
            benchmarking: {
                activeTests: this.activeTests.size,
                completedTests: this.benchmarkResults.size,
                baseline: this.performanceBaseline ? 'established' : 'pending'
            },
            compliance: this.checkOverallCompliance(),
            lastUpdate: Date.now()
        };
    }
}

// Create singleton instance
const benchmarkingService = new PerformanceBenchmarkingService();

export default benchmarkingService;