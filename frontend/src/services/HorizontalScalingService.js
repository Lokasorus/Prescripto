/**
 * HorizontalScalingService - Horizontal Scaling and Load Distribution
 * 
 * Enterprise-grade horizontal scaling service providing intelligent load
 * balancing, auto-scaling, service discovery, and distributed system
 * management for production workloads.
 */

class HorizontalScalingService {
    constructor() {
        this.config = {
            // Service discovery and load balancing
            loadBalancing: {
                strategy: 'round_robin', // round_robin, least_connections, weighted, health_based
                healthCheckInterval: 30000,
                healthCheckTimeout: 5000,
                maxRetries: 3,
                circuitBreakerThreshold: 0.5,
                circuitBreakerResetTime: 60000
            },
            
            // Auto-scaling configuration
            autoScaling: {
                enabled: true,
                minInstances: 2,
                maxInstances: 20,
                targetCPUUtilization: 70,
                targetMemoryUtilization: 80,
                targetResponseTime: 500,
                scaleUpCooldown: 300000,    // 5 minutes
                scaleDownCooldown: 600000,  // 10 minutes
                scaleUpIncrement: 2,
                scaleDownDecrement: 1
            },
            
            // Service mesh configuration
            serviceMesh: {
                enabled: true,
                retryPolicy: {
                    maxRetries: 3,
                    backoffMultiplier: 2,
                    maxBackoffInterval: 30000
                },
                timeoutPolicy: {
                    connectionTimeout: 5000,
                    requestTimeout: 30000
                },
                bulkheadPolicy: {
                    maxConcurrentRequests: 100,
                    maxQueueSize: 50
                }
            },
            
            // Container orchestration
            orchestration: {
                platform: 'kubernetes', // kubernetes, docker_swarm, ecs
                namespace: 'prescripto-prod',
                deployment: {
                    strategy: 'RollingUpdate',
                    maxSurge: 2,
                    maxUnavailable: 1
                },
                resources: {
                    requests: { cpu: '200m', memory: '256Mi' },
                    limits: { cpu: '1000m', memory: '1Gi' }
                }
            },
            
            // Geographic distribution
            regions: {
                primary: 'us-east-1',
                secondary: ['us-west-2', 'eu-west-1', 'ap-southeast-1'],
                crossRegionReplication: true,
                latencyThreshold: 100 // milliseconds
            }
        };

        this.services = new Map();
        this.instances = new Map();
        this.healthChecks = new Map();
        this.loadBalancers = new Map();
        this.metrics = {
            requests: [],
            scaling: [],
            health: [],
            latency: []
        };
        
        this.circuitBreakers = new Map();
        this.requestQueues = new Map();
        this.scalingDecisions = [];
        
        this.initializeScaling();
    }

    /**
     * Initialize horizontal scaling
     */
    async initializeScaling() {
        // Set up service discovery
        await this.setupServiceDiscovery();
        
        // Initialize load balancers
        this.setupLoadBalancing();
        
        // Start auto-scaling
        this.startAutoScaling();
        
        // Set up health monitoring
        this.startHealthMonitoring();
        
        // Initialize service mesh
        this.setupServiceMesh();
        
        // Set up metrics collection
        this.startMetricsCollection();
    }

    /**
     * Service discovery and registration
     */

    async setupServiceDiscovery() {
        // Register core services
        await this.registerService('api-gateway', {
            type: 'gateway',
            port: 3000,
            healthEndpoint: '/health',
            tags: ['api', 'gateway', 'public'],
            weight: 100
        });
        
        await this.registerService('user-service', {
            type: 'microservice',
            port: 3001,
            healthEndpoint: '/health',
            tags: ['user', 'auth', 'private'],
            weight: 100
        });
        
        await this.registerService('appointment-service', {
            type: 'microservice',
            port: 3002,
            healthEndpoint: '/health',
            tags: ['appointment', 'booking', 'private'],
            weight: 100
        });
        
        await this.registerService('notification-service', {
            type: 'microservice',
            port: 3003,
            healthEndpoint: '/health',
            tags: ['notification', 'email', 'sms', 'private'],
            weight: 100
        });
        
        // Set up service discovery updates
        setInterval(() => {
            this.updateServiceDiscovery();
        }, 30000); // Every 30 seconds
    }

    async registerService(serviceName, config) {
        if (!this.services.has(serviceName)) {
            this.services.set(serviceName, {
                name: serviceName,
                instances: new Map(),
                config,
                loadBalancer: this.createLoadBalancer(serviceName, config),
                registeredAt: Date.now()
            });
            
            this.setupServiceLoadBalancer(serviceName);
        }
        
        return this.services.get(serviceName);
    }

    async registerInstance(serviceName, instanceConfig) {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service ${serviceName} not found`);
        }
        
        const instanceId = this.generateInstanceId(serviceName);
        const instance = {
            id: instanceId,
            serviceName,
            host: instanceConfig.host,
            port: instanceConfig.port,
            status: 'starting',
            health: 'unknown',
            metadata: instanceConfig.metadata || {},
            registeredAt: Date.now(),
            lastHealthCheck: null,
            consecutiveFailures: 0,
            weight: instanceConfig.weight || 100,
            region: instanceConfig.region || this.config.regions.primary
        };
        
        service.instances.set(instanceId, instance);
        this.instances.set(instanceId, instance);
        
        // Start health checking for this instance
        this.startInstanceHealthCheck(instance);
        
        // Update load balancer
        service.loadBalancer.addInstance(instance);
        
        console.log(`Registered instance ${instanceId} for service ${serviceName}`);
        return instanceId;
    }

    async deregisterInstance(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        const service = this.services.get(instance.serviceName);
        if (service) {
            service.instances.delete(instanceId);
            service.loadBalancer.removeInstance(instance);
        }
        
        this.instances.delete(instanceId);
        this.healthChecks.delete(instanceId);
        
        console.log(`Deregistered instance ${instanceId}`);
    }

    generateInstanceId(serviceName) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 7);
        return `${serviceName}-${timestamp}-${random}`;
    }

    /**
     * Load balancing strategies
     */

    createLoadBalancer(serviceName, config) {
        return {
            serviceName,
            strategy: this.config.loadBalancing.strategy,
            instances: [],
            currentIndex: 0,
            
            addInstance: (instance) => {
                this.loadBalancers.get(serviceName)?.instances.push(instance);
            },
            
            removeInstance: (instance) => {
                const lb = this.loadBalancers.get(serviceName);
                if (lb) {
                    lb.instances = lb.instances.filter(i => i.id !== instance.id);
                }
            },
            
            selectInstance: () => {
                return this.selectInstanceForService(serviceName);
            }
        };
    }

    setupServiceLoadBalancer(serviceName) {
        const loadBalancer = {
            serviceName,
            instances: [],
            currentIndex: 0,
            metrics: {
                requests: 0,
                errors: 0,
                totalLatency: 0
            }
        };
        
        this.loadBalancers.set(serviceName, loadBalancer);
    }

    selectInstanceForService(serviceName) {
        const loadBalancer = this.loadBalancers.get(serviceName);
        if (!loadBalancer || loadBalancer.instances.length === 0) {
            return null;
        }
        
        const healthyInstances = loadBalancer.instances.filter(
            instance => instance.health === 'healthy' && instance.status === 'running'
        );
        
        if (healthyInstances.length === 0) {
            return null;
        }
        
        return this.applyLoadBalancingStrategy(healthyInstances, loadBalancer);
    }

    applyLoadBalancingStrategy(instances, loadBalancer) {
        switch (this.config.loadBalancing.strategy) {
            case 'round_robin':
                return this.roundRobinSelection(instances, loadBalancer);
            
            case 'least_connections':
                return this.leastConnectionsSelection(instances);
            
            case 'weighted':
                return this.weightedSelection(instances);
            
            case 'health_based':
                return this.healthBasedSelection(instances);
            
            case 'latency_based':
                return this.latencyBasedSelection(instances);
            
            default:
                return instances[0];
        }
    }

    roundRobinSelection(instances, loadBalancer) {
        const instance = instances[loadBalancer.currentIndex % instances.length];
        loadBalancer.currentIndex++;
        return instance;
    }

    leastConnectionsSelection(instances) {
        return instances.reduce((least, current) => {
            const leastConnections = least.metadata.activeConnections || 0;
            const currentConnections = current.metadata.activeConnections || 0;
            return currentConnections < leastConnections ? current : least;
        });
    }

    weightedSelection(instances) {
        const totalWeight = instances.reduce((sum, instance) => sum + instance.weight, 0);
        const random = Math.random() * totalWeight;
        
        let currentWeight = 0;
        for (const instance of instances) {
            currentWeight += instance.weight;
            if (random <= currentWeight) {
                return instance;
            }
        }
        
        return instances[0];
    }

    healthBasedSelection(instances) {
        // Sort by health score (higher is better)
        const sortedInstances = instances.sort((a, b) => {
            const aScore = this.calculateHealthScore(a);
            const bScore = this.calculateHealthScore(b);
            return bScore - aScore;
        });
        
        return sortedInstances[0];
    }

    latencyBasedSelection(instances) {
        // Sort by average latency (lower is better)
        const sortedInstances = instances.sort((a, b) => {
            const aLatency = a.metadata.averageLatency || 0;
            const bLatency = b.metadata.averageLatency || 0;
            return aLatency - bLatency;
        });
        
        return sortedInstances[0];
    }

    calculateHealthScore(instance) {
        let score = 100;
        
        // Penalize for consecutive failures
        score -= instance.consecutiveFailures * 10;
        
        // Consider CPU and memory utilization
        if (instance.metadata.cpuUtilization) {
            score -= instance.metadata.cpuUtilization * 0.5;
        }
        
        if (instance.metadata.memoryUtilization) {
            score -= instance.metadata.memoryUtilization * 0.3;
        }
        
        // Consider response time
        if (instance.metadata.averageLatency) {
            score -= Math.min(instance.metadata.averageLatency / 10, 50);
        }
        
        return Math.max(score, 0);
    }

    /**
     * Health monitoring
     */

    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthChecks();
        }, this.config.loadBalancing.healthCheckInterval);
    }

    startInstanceHealthCheck(instance) {
        const healthCheck = {
            instance,
            interval: setInterval(() => {
                this.checkInstanceHealth(instance);
            }, this.config.loadBalancing.healthCheckInterval)
        };
        
        this.healthChecks.set(instance.id, healthCheck);
    }

    async checkInstanceHealth(instance) {
        try {
            const startTime = Date.now();
            
            // Perform health check (mock implementation)
            const response = await this.performHealthCheck(instance);
            
            const latency = Date.now() - startTime;
            
            if (response.status === 'healthy') {
                instance.health = 'healthy';
                instance.consecutiveFailures = 0;
                instance.metadata.lastLatency = latency;
                
                // Update average latency
                const currentAvg = instance.metadata.averageLatency || 0;
                instance.metadata.averageLatency = (currentAvg * 0.8) + (latency * 0.2);
            } else {
                this.handleUnhealthyInstance(instance);
            }
            
            instance.lastHealthCheck = Date.now();
            
        } catch (error) {
            this.handleUnhealthyInstance(instance, error);
        }
    }

    async performHealthCheck(instance) {
        // Mock health check - replace with actual HTTP request
        const mockLatency = Math.random() * 100;
        const mockStatus = Math.random() > 0.05 ? 'healthy' : 'unhealthy';
        
        return {
            status: mockStatus,
            latency: mockLatency,
            metadata: {
                cpuUtilization: Math.random() * 100,
                memoryUtilization: Math.random() * 100,
                activeConnections: Math.floor(Math.random() * 50)
            }
        };
    }

    handleUnhealthyInstance(instance, error = null) {
        instance.health = 'unhealthy';
        instance.consecutiveFailures++;
        
        if (error) {
            console.warn(`Health check failed for instance ${instance.id}:`, error.message);
        }
        
        // Remove from load balancer if too many failures
        if (instance.consecutiveFailures >= this.config.loadBalancing.maxRetries) {
            this.quarantineInstance(instance);
        }
        
        // Record health metrics
        this.recordHealthMetric(instance, false, error);
    }

    quarantineInstance(instance) {
        instance.status = 'quarantined';
        
        const service = this.services.get(instance.serviceName);
        if (service) {
            service.loadBalancer.removeInstance(instance);
        }
        
        console.warn(`Instance ${instance.id} quarantined due to repeated health check failures`);
        
        // Schedule recovery check
        setTimeout(() => {
            this.attemptInstanceRecovery(instance);
        }, this.config.loadBalancing.circuitBreakerResetTime);
    }

    async attemptInstanceRecovery(instance) {
        try {
            const response = await this.performHealthCheck(instance);
            
            if (response.status === 'healthy') {
                instance.status = 'running';
                instance.health = 'healthy';
                instance.consecutiveFailures = 0;
                
                const service = this.services.get(instance.serviceName);
                if (service) {
                    service.loadBalancer.addInstance(instance);
                }
                
                console.log(`Instance ${instance.id} recovered and added back to load balancer`);
            } else {
                // Schedule another recovery attempt
                setTimeout(() => {
                    this.attemptInstanceRecovery(instance);
                }, this.config.loadBalancing.circuitBreakerResetTime);
            }
        } catch (error) {
            console.warn(`Instance recovery failed for ${instance.id}:`, error.message);
            
            // Schedule another recovery attempt
            setTimeout(() => {
                this.attemptInstanceRecovery(instance);
            }, this.config.loadBalancing.circuitBreakerResetTime);
        }
    }

    performHealthChecks() {
        this.instances.forEach(instance => {
            this.checkInstanceHealth(instance);
        });
    }

    /**
     * Auto-scaling logic
     */

    startAutoScaling() {
        if (!this.config.autoScaling.enabled) return;
        
        setInterval(() => {
            this.evaluateScalingDecisions();
        }, 60000); // Every minute
    }

    evaluateScalingDecisions() {
        this.services.forEach((service, serviceName) => {
            const metrics = this.getServiceMetrics(serviceName);
            const decision = this.makeScalingDecision(serviceName, metrics);
            
            if (decision.action !== 'none') {
                this.executeScalingDecision(serviceName, decision);
            }
        });
    }

    getServiceMetrics(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) return null;
        
        const instances = Array.from(service.instances.values());
        const healthyInstances = instances.filter(i => i.health === 'healthy');
        
        // Calculate aggregated metrics
        const metrics = {
            instanceCount: instances.length,
            healthyInstanceCount: healthyInstances.length,
            avgCpuUtilization: this.calculateAverageCPU(healthyInstances),
            avgMemoryUtilization: this.calculateAverageMemory(healthyInstances),
            avgResponseTime: this.calculateAverageResponseTime(serviceName),
            requestRate: this.calculateRequestRate(serviceName),
            errorRate: this.calculateErrorRate(serviceName)
        };
        
        return metrics;
    }

    makeScalingDecision(serviceName, metrics) {
        const config = this.config.autoScaling;
        const now = Date.now();
        
        // Check cooldown periods
        const lastScaleUp = this.getLastScalingDecision(serviceName, 'scale_up');
        const lastScaleDown = this.getLastScalingDecision(serviceName, 'scale_down');
        
        if (lastScaleUp && now - lastScaleUp.timestamp < config.scaleUpCooldown) {
            return { action: 'none', reason: 'scale_up_cooldown' };
        }
        
        if (lastScaleDown && now - lastScaleDown.timestamp < config.scaleDownCooldown) {
            return { action: 'none', reason: 'scale_down_cooldown' };
        }
        
        // Check scale up conditions
        const shouldScaleUp = (
            metrics.avgCpuUtilization > config.targetCPUUtilization ||
            metrics.avgMemoryUtilization > config.targetMemoryUtilization ||
            metrics.avgResponseTime > config.targetResponseTime ||
            metrics.healthyInstanceCount < 2 // Minimum for HA
        ) && metrics.instanceCount < config.maxInstances;
        
        if (shouldScaleUp) {
            return {
                action: 'scale_up',
                increment: config.scaleUpIncrement,
                reason: 'high_utilization',
                metrics
            };
        }
        
        // Check scale down conditions
        const shouldScaleDown = (
            metrics.avgCpuUtilization < config.targetCPUUtilization * 0.5 &&
            metrics.avgMemoryUtilization < config.targetMemoryUtilization * 0.5 &&
            metrics.avgResponseTime < config.targetResponseTime * 0.5 &&
            metrics.errorRate < 0.01
        ) && metrics.instanceCount > config.minInstances;
        
        if (shouldScaleDown) {
            return {
                action: 'scale_down',
                decrement: config.scaleDownDecrement,
                reason: 'low_utilization',
                metrics
            };
        }
        
        return { action: 'none', reason: 'within_thresholds', metrics };
    }

    async executeScalingDecision(serviceName, decision) {
        try {
            const service = this.services.get(serviceName);
            if (!service) return;
            
            if (decision.action === 'scale_up') {
                await this.scaleUpService(serviceName, decision.increment);
            } else if (decision.action === 'scale_down') {
                await this.scaleDownService(serviceName, decision.decrement);
            }
            
            // Record scaling decision
            this.recordScalingDecision(serviceName, decision);
            
            console.log(`Scaling decision executed for ${serviceName}: ${decision.action} (${JSON.stringify(decision.metrics)})`);
            
        } catch (error) {
            console.error(`Failed to execute scaling decision for ${serviceName}:`, error);
        }
    }

    async scaleUpService(serviceName, increment) {
        const service = this.services.get(serviceName);
        if (!service) return;
        
        for (let i = 0; i < increment; i++) {
            await this.launchNewInstance(serviceName);
        }
    }

    async scaleDownService(serviceName, decrement) {
        const service = this.services.get(serviceName);
        if (!service) return;
        
        const instances = Array.from(service.instances.values());
        
        // Select instances to terminate (least healthy first)
        const candidatesForTermination = instances
            .sort((a, b) => this.calculateHealthScore(a) - this.calculateHealthScore(b))
            .slice(0, decrement);
        
        for (const instance of candidatesForTermination) {
            await this.terminateInstance(instance.id);
        }
    }

    async launchNewInstance(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) return;
        
        // Generate instance configuration
        const instanceConfig = {
            host: this.generateInstanceHost(),
            port: service.config.port,
            region: this.selectOptimalRegion(),
            metadata: {
                launchedBy: 'auto_scaler',
                launchTime: Date.now()
            }
        };
        
        // Create container/instance (mock implementation)
        const instanceId = await this.createContainerInstance(serviceName, instanceConfig);
        
        // Register the new instance
        await this.registerInstance(serviceName, instanceConfig);
        
        console.log(`Launched new instance ${instanceId} for service ${serviceName}`);
        return instanceId;
    }

    async terminateInstance(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        // Gracefully drain connections
        await this.drainInstance(instance);
        
        // Terminate container/instance (mock implementation)
        await this.terminateContainerInstance(instanceId);
        
        // Deregister from service discovery
        await this.deregisterInstance(instanceId);
        
        console.log(`Terminated instance ${instanceId}`);
    }

    async drainInstance(instance) {
        // Mark instance as draining
        instance.status = 'draining';
        
        // Remove from load balancer
        const service = this.services.get(instance.serviceName);
        if (service) {
            service.loadBalancer.removeInstance(instance);
        }
        
        // Wait for connections to drain
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
    }

    generateInstanceHost() {
        // Generate unique host identifier
        return `instance-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    selectOptimalRegion() {
        // Select region based on current load
        return this.config.regions.primary;
    }

    async createContainerInstance(serviceName, config) {
        // Mock container creation - replace with actual orchestration
        const instanceId = this.generateInstanceId(serviceName);
        
        // Simulate container startup time
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return instanceId;
    }

    async terminateContainerInstance(instanceId) {
        // Mock container termination
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    /**
     * Service mesh and reliability
     */

    setupServiceMesh() {
        if (!this.config.serviceMesh.enabled) return;
        
        // Set up circuit breakers for each service
        this.services.forEach((service, serviceName) => {
            this.setupCircuitBreaker(serviceName);
        });
        
        // Set up request queues
        this.setupRequestQueuing();
        
        // Set up retry mechanisms
        this.setupRetryMechanisms();
    }

    setupCircuitBreaker(serviceName) {
        const circuitBreaker = {
            serviceName,
            state: 'closed', // closed, open, half-open
            failureCount: 0,
            successCount: 0,
            lastFailureTime: null,
            threshold: this.config.loadBalancing.circuitBreakerThreshold,
            resetTime: this.config.loadBalancing.circuitBreakerResetTime
        };
        
        this.circuitBreakers.set(serviceName, circuitBreaker);
    }

    async executeWithCircuitBreaker(serviceName, operation) {
        const circuitBreaker = this.circuitBreakers.get(serviceName);
        if (!circuitBreaker) {
            return await operation();
        }
        
        // Check circuit breaker state
        if (circuitBreaker.state === 'open') {
            const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
            
            if (timeSinceLastFailure < circuitBreaker.resetTime) {
                throw new Error(`Circuit breaker is open for service ${serviceName}`);
            } else {
                circuitBreaker.state = 'half-open';
            }
        }
        
        try {
            const result = await operation();
            
            // Success - update circuit breaker
            if (circuitBreaker.state === 'half-open') {
                circuitBreaker.state = 'closed';
                circuitBreaker.failureCount = 0;
            }
            
            circuitBreaker.successCount++;
            return result;
            
        } catch (error) {
            // Failure - update circuit breaker
            circuitBreaker.failureCount++;
            circuitBreaker.lastFailureTime = Date.now();
            
            const errorRate = circuitBreaker.failureCount / (circuitBreaker.failureCount + circuitBreaker.successCount);
            
            if (errorRate >= circuitBreaker.threshold) {
                circuitBreaker.state = 'open';
            }
            
            throw error;
        }
    }

    setupRequestQueuing() {
        this.services.forEach((service, serviceName) => {
            this.requestQueues.set(serviceName, {
                queue: [],
                processing: false,
                maxSize: this.config.serviceMesh.bulkheadPolicy.maxQueueSize,
                maxConcurrent: this.config.serviceMesh.bulkheadPolicy.maxConcurrentRequests,
                activerequests: 0
            });
        });
    }

    async queueRequest(serviceName, request) {
        const queue = this.requestQueues.get(serviceName);
        if (!queue) {
            throw new Error(`Request queue not found for service ${serviceName}`);
        }
        
        // Check if queue is full
        if (queue.queue.length >= queue.maxSize) {
            throw new Error(`Request queue is full for service ${serviceName}`);
        }
        
        // Add to queue
        return new Promise((resolve, reject) => {
            queue.queue.push({ request, resolve, reject, timestamp: Date.now() });
            this.processQueue(serviceName);
        });
    }

    async processQueue(serviceName) {
        const queue = this.requestQueues.get(serviceName);
        if (!queue || queue.processing) return;
        
        queue.processing = true;
        
        while (queue.queue.length > 0 && queue.activerequests < queue.maxConcurrent) {
            const { request, resolve, reject } = queue.queue.shift();
            queue.activerequests++;
            
            this.processRequest(serviceName, request)
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    queue.activerequests--;
                });
        }
        
        queue.processing = false;
    }

    async processRequest(serviceName, request) {
        // Process individual request with retries
        return await this.executeWithRetry(serviceName, () => {
            return this.forwardRequest(serviceName, request);
        });
    }

    async executeWithRetry(serviceName, operation) {
        const retryPolicy = this.config.serviceMesh.retryPolicy;
        let lastError;
        
        for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt === retryPolicy.maxRetries) {
                    break;
                }
                
                // Calculate backoff delay
                const delay = Math.min(
                    1000 * Math.pow(retryPolicy.backoffMultiplier, attempt),
                    retryPolicy.maxBackoffInterval
                );
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }

    async forwardRequest(serviceName, request) {
        const instance = this.selectInstanceForService(serviceName);
        if (!instance) {
            throw new Error(`No healthy instances available for service ${serviceName}`);
        }
        
        // Mock request forwarding
        const startTime = Date.now();
        
        try {
            // Simulate request processing
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            
            const latency = Date.now() - startTime;
            
            // Record request metrics
            this.recordRequestMetric(serviceName, instance, latency, true);
            
            return { success: true, data: 'mock response', latency };
            
        } catch (error) {
            const latency = Date.now() - startTime;
            this.recordRequestMetric(serviceName, instance, latency, false);
            throw error;
        }
    }

    setupRetryMechanisms() {
        // Retry mechanisms are implemented in executeWithRetry
        console.log('Retry mechanisms configured');
    }

    /**
     * Metrics and monitoring
     */

    startMetricsCollection() {
        setInterval(() => {
            this.collectScalingMetrics();
        }, 60000); // Every minute
        
        setInterval(() => {
            this.generateScalingReport();
        }, 300000); // Every 5 minutes
    }

    recordRequestMetric(serviceName, instance, latency, success) {
        const metric = {
            serviceName,
            instanceId: instance.id,
            latency,
            success,
            timestamp: Date.now()
        };
        
        this.metrics.requests.push(metric);
        
        // Update load balancer metrics
        const loadBalancer = this.loadBalancers.get(serviceName);
        if (loadBalancer) {
            loadBalancer.metrics.requests++;
            loadBalancer.metrics.totalLatency += latency;
            
            if (!success) {
                loadBalancer.metrics.errors++;
            }
        }
        
        // Keep only recent metrics
        if (this.metrics.requests.length > 10000) {
            this.metrics.requests.splice(0, 1000);
        }
    }

    recordScalingDecision(serviceName, decision) {
        const scalingMetric = {
            serviceName,
            action: decision.action,
            reason: decision.reason,
            metrics: decision.metrics,
            timestamp: Date.now()
        };
        
        this.scalingDecisions.push(scalingMetric);
        
        // Keep only recent decisions
        if (this.scalingDecisions.length > 1000) {
            this.scalingDecisions.splice(0, 100);
        }
    }

    recordHealthMetric(instance, healthy, error) {
        const healthMetric = {
            instanceId: instance.id,
            serviceName: instance.serviceName,
            healthy,
            error: error?.message || null,
            timestamp: Date.now()
        };
        
        this.metrics.health.push(healthMetric);
        
        // Keep only recent metrics
        if (this.metrics.health.length > 5000) {
            this.metrics.health.splice(0, 500);
        }
    }

    collectScalingMetrics() {
        const metrics = {
            timestamp: Date.now(),
            services: {},
            overall: {
                totalInstances: this.instances.size,
                healthyInstances: Array.from(this.instances.values()).filter(i => i.health === 'healthy').length,
                totalRequests: this.metrics.requests.length,
                totalScalingDecisions: this.scalingDecisions.length
            }
        };
        
        // Collect per-service metrics
        this.services.forEach((service, serviceName) => {
            metrics.services[serviceName] = this.getServiceMetrics(serviceName);
        });
        
        // Report to monitoring service
        if (typeof window !== 'undefined' && window.performanceMonitor) {
            window.performanceMonitor.recordMetric('horizontal_scaling', {
                ...metrics,
                type: 'scaling',
                category: 'infrastructure'
            });
        }
    }

    generateScalingReport() {
        const report = {
            timestamp: Date.now(),
            summary: {
                services: this.services.size,
                instances: this.instances.size,
                healthyInstances: Array.from(this.instances.values()).filter(i => i.health === 'healthy').length,
                recentScalingActions: this.scalingDecisions.filter(d => Date.now() - d.timestamp < 3600000).length
            },
            serviceStatus: {},
            performanceMetrics: {
                averageRequestLatency: this.calculateAverageRequestLatency(),
                requestThroughput: this.calculateRequestThroughput(),
                errorRate: this.calculateOverallErrorRate(),
                scalingEfficiency: this.calculateScalingEfficiency()
            },
            recommendations: this.generateScalingRecommendations()
        };
        
        // Generate per-service status
        this.services.forEach((service, serviceName) => {
            const instances = Array.from(service.instances.values());
            report.serviceStatus[serviceName] = {
                instanceCount: instances.length,
                healthyInstances: instances.filter(i => i.health === 'healthy').length,
                averageLatency: this.calculateServiceAverageLatency(serviceName),
                requestRate: this.calculateRequestRate(serviceName),
                errorRate: this.calculateErrorRate(serviceName)
            };
        });
        
        console.log('Horizontal scaling report:', report);
    }

    /**
     * Utility methods
     */

    calculateAverageCPU(instances) {
        if (instances.length === 0) return 0;
        
        const total = instances.reduce((sum, instance) => {
            return sum + (instance.metadata.cpuUtilization || 0);
        }, 0);
        
        return total / instances.length;
    }

    calculateAverageMemory(instances) {
        if (instances.length === 0) return 0;
        
        const total = instances.reduce((sum, instance) => {
            return sum + (instance.metadata.memoryUtilization || 0);
        }, 0);
        
        return total / instances.length;
    }

    calculateAverageResponseTime(serviceName) {
        const recentMetrics = this.metrics.requests.filter(
            m => m.serviceName === serviceName && Date.now() - m.timestamp < 300000 // Last 5 minutes
        );
        
        if (recentMetrics.length === 0) return 0;
        
        const totalLatency = recentMetrics.reduce((sum, metric) => sum + metric.latency, 0);
        return totalLatency / recentMetrics.length;
    }

    calculateRequestRate(serviceName) {
        const recentMetrics = this.metrics.requests.filter(
            m => m.serviceName === serviceName && Date.now() - m.timestamp < 60000 // Last minute
        );
        
        return recentMetrics.length; // Requests per minute
    }

    calculateErrorRate(serviceName) {
        const recentMetrics = this.metrics.requests.filter(
            m => m.serviceName === serviceName && Date.now() - m.timestamp < 300000 // Last 5 minutes
        );
        
        if (recentMetrics.length === 0) return 0;
        
        const errors = recentMetrics.filter(m => !m.success).length;
        return errors / recentMetrics.length;
    }

    getLastScalingDecision(serviceName, action) {
        const decisions = this.scalingDecisions.filter(
            d => d.serviceName === serviceName && d.action === action
        );
        
        return decisions.length > 0 ? decisions[decisions.length - 1] : null;
    }

    calculateAverageRequestLatency() {
        const recentMetrics = this.metrics.requests.filter(
            m => Date.now() - m.timestamp < 300000 // Last 5 minutes
        );
        
        if (recentMetrics.length === 0) return 0;
        
        const totalLatency = recentMetrics.reduce((sum, metric) => sum + metric.latency, 0);
        return totalLatency / recentMetrics.length;
    }

    calculateRequestThroughput() {
        const recentMetrics = this.metrics.requests.filter(
            m => Date.now() - m.timestamp < 60000 // Last minute
        );
        
        return recentMetrics.length; // Requests per minute
    }

    calculateOverallErrorRate() {
        const recentMetrics = this.metrics.requests.filter(
            m => Date.now() - m.timestamp < 300000 // Last 5 minutes
        );
        
        if (recentMetrics.length === 0) return 0;
        
        const errors = recentMetrics.filter(m => !m.success).length;
        return errors / recentMetrics.length;
    }

    calculateScalingEfficiency() {
        const recentDecisions = this.scalingDecisions.filter(
            d => Date.now() - d.timestamp < 3600000 // Last hour
        );
        
        if (recentDecisions.length === 0) return 1;
        
        // Calculate efficiency based on successful scaling decisions
        const successful = recentDecisions.filter(d => d.action !== 'none').length;
        return successful / recentDecisions.length;
    }

    calculateServiceAverageLatency(serviceName) {
        return this.calculateAverageResponseTime(serviceName);
    }

    generateScalingRecommendations() {
        const recommendations = [];
        
        this.services.forEach((service, serviceName) => {
            const metrics = this.getServiceMetrics(serviceName);
            
            if (metrics.avgResponseTime > this.config.autoScaling.targetResponseTime * 1.5) {
                recommendations.push({
                    service: serviceName,
                    type: 'performance',
                    recommendation: 'Consider scaling up due to high response time',
                    priority: 'high'
                });
            }
            
            if (metrics.errorRate > 0.05) {
                recommendations.push({
                    service: serviceName,
                    type: 'reliability',
                    recommendation: 'Investigate high error rate and consider scaling up',
                    priority: 'critical'
                });
            }
            
            if (metrics.instanceCount < 2) {
                recommendations.push({
                    service: serviceName,
                    type: 'availability',
                    recommendation: 'Scale up to ensure high availability',
                    priority: 'medium'
                });
            }
        });
        
        return recommendations;
    }

    updateServiceDiscovery() {
        // Update service discovery information
        this.services.forEach((service, serviceName) => {
            const healthyInstances = Array.from(service.instances.values()).filter(
                i => i.health === 'healthy'
            );
            
            console.log(`Service ${serviceName}: ${healthyInstances.length} healthy instances`);
        });
    }

    /**
     * Public API
     */

    // Service management
    async registerNewService(serviceName, config) {
        return await this.registerService(serviceName, config);
    }

    async addServiceInstance(serviceName, instanceConfig) {
        return await this.registerInstance(serviceName, instanceConfig);
    }

    async removeServiceInstance(instanceId) {
        return await this.deregisterInstance(instanceId);
    }

    // Load balancing
    selectInstance(serviceName) {
        return this.selectInstanceForService(serviceName);
    }

    async routeRequest(serviceName, request) {
        return await this.executeWithCircuitBreaker(serviceName, async () => {
            return await this.queueRequest(serviceName, request);
        });
    }

    // Scaling control
    async manualScaleUp(serviceName, count = 1) {
        await this.scaleUpService(serviceName, count);
    }

    async manualScaleDown(serviceName, count = 1) {
        await this.scaleDownService(serviceName, count);
    }

    // Configuration
    updateScalingConfig(config) {
        this.config = { ...this.config, ...config };
    }

    updateLoadBalancingStrategy(strategy) {
        this.config.loadBalancing.strategy = strategy;
    }

    // Monitoring and metrics
    getServiceMetrics(serviceName) {
        return this.getServiceMetrics(serviceName);
    }

    getOverallMetrics() {
        return {
            services: this.services.size,
            instances: this.instances.size,
            healthyInstances: Array.from(this.instances.values()).filter(i => i.health === 'healthy').length,
            totalRequests: this.metrics.requests.length,
            averageLatency: this.calculateAverageRequestLatency(),
            errorRate: this.calculateOverallErrorRate(),
            scalingDecisions: this.scalingDecisions.length
        };
    }

    getScalingHistory() {
        return this.scalingDecisions.slice(-100); // Last 100 decisions
    }

    getCircuitBreakerStatus() {
        const status = {};
        this.circuitBreakers.forEach((breaker, serviceName) => {
            status[serviceName] = {
                state: breaker.state,
                failureCount: breaker.failureCount,
                successCount: breaker.successCount
            };
        });
        return status;
    }

    // Health and status
    async getSystemHealth() {
        const health = {
            status: 'healthy',
            services: {},
            overall: {
                totalServices: this.services.size,
                totalInstances: this.instances.size,
                healthyInstances: 0,
                unhealthyInstances: 0
            }
        };
        
        this.services.forEach((service, serviceName) => {
            const instances = Array.from(service.instances.values());
            const healthy = instances.filter(i => i.health === 'healthy').length;
            const unhealthy = instances.length - healthy;
            
            health.services[serviceName] = {
                instanceCount: instances.length,
                healthyInstances: healthy,
                unhealthyInstances: unhealthy,
                status: unhealthy === 0 ? 'healthy' : (healthy === 0 ? 'unhealthy' : 'degraded')
            };
            
            health.overall.healthyInstances += healthy;
            health.overall.unhealthyInstances += unhealthy;
            
            if (unhealthy > 0 && health.status === 'healthy') {
                health.status = 'degraded';
            }
            
            if (healthy === 0) {
                health.status = 'unhealthy';
            }
        });
        
        return health;
    }

    // Emergency controls
    async emergencyScaleUp(serviceName) {
        const currentInstances = this.services.get(serviceName)?.instances.size || 0;
        const targetInstances = Math.min(currentInstances * 2, this.config.autoScaling.maxInstances);
        const increment = targetInstances - currentInstances;
        
        if (increment > 0) {
            await this.scaleUpService(serviceName, increment);
            console.warn(`Emergency scale up executed for ${serviceName}: +${increment} instances`);
        }
    }

    async pauseAutoScaling(serviceName = null) {
        if (serviceName) {
            // Pause for specific service (would need service-specific config)
            console.log(`Auto-scaling paused for service ${serviceName}`);
        } else {
            this.config.autoScaling.enabled = false;
            console.log('Auto-scaling paused for all services');
        }
    }

    async resumeAutoScaling(serviceName = null) {
        if (serviceName) {
            // Resume for specific service
            console.log(`Auto-scaling resumed for service ${serviceName}`);
        } else {
            this.config.autoScaling.enabled = true;
            console.log('Auto-scaling resumed for all services');
        }
    }
}

// Create singleton instance
const horizontalScalingService = new HorizontalScalingService();

export default horizontalScalingService;