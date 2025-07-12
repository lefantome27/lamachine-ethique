import { TrafficAnalyzer } from './analysis';
import { Config } from './config';
import { CounterAttacksGui } from './counter-attacks-gui';
import { DDoSMonitor } from './ddos-monitor';
import { Firewall } from './firewall';
import { EventEmitter } from 'events';

// System state interface
interface SystemState {
  isRunning: boolean;
  startTime: Date;
  uptime: number;
  components: {
    analyzer: boolean;
    ddosMonitor: boolean;
    firewall: boolean;
    gui: boolean;
  };
  statistics: {
    totalPackets: number;
    attacksDetected: number;
    ipsBlocked: number;
    connectionsTracked: number;
  };
}

// Main system class
export class TrafficSecuritySystem extends EventEmitter {
  private config: Config;
  private analyzer: TrafficAnalyzer;
  private ddosMonitor: DDoSMonitor;
  private firewall: Firewall;
  private gui: CounterAttacksGui;
  private systemState: SystemState;
  private isShuttingDown: boolean;
  private healthCheckInterval: NodeJS.Timeout | null;
  private statsInterval: NodeJS.Timeout | null;

  constructor() {
    super();

    this.systemState = {
      isRunning: false,
      startTime: new Date(),
      uptime: 0,
      components: {
        analyzer: false,
        ddosMonitor: false,
        firewall: false,
        gui: false
      },
      statistics: {
        totalPackets: 0,
        attacksDetected: 0,
        ipsBlocked: 0,
        connectionsTracked: 0
      }
    };

    this.isShuttingDown = false;
    this.healthCheckInterval = null;
    this.statsInterval = null;

    this.initialize();
  }

  private initialize(): void {
    console.log('Initializing Traffic Security System...');

    try {
      // Initialize configuration
      this.config = new Config();
      console.log('✓ Configuration loaded');

      // Initialize components
      this.analyzer = new TrafficAnalyzer();
      this.ddosMonitor = new DDoSMonitor();
      this.firewall = new Firewall();
      this.gui = new CounterAttacksGui();

      // Set up event listeners
      this.setupEventListeners();

      console.log('✓ All components initialized');
    } catch (error) {
      console.error('Failed to initialize system:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Traffic Analyzer events
    this.analyzer.on('anomaly-detected', (data: any) => {
      console.log('🚨 Anomaly detected:', data);
      this.systemState.statistics.attacksDetected++;
      this.emit('anomaly-detected', data);
    });

    // DDoS Monitor events
    this.ddosMonitor.on('attack-detected', (attack: any) => {
      console.log('🚨 DDoS attack detected:', attack);
      this.systemState.statistics.attacksDetected++;
      this.emit('ddos-attack-detected', attack);
    });

    this.ddosMonitor.on('ip-blocked', (ip: string) => {
      console.log('🚫 IP blocked by DDoS monitor:', ip);
      this.systemState.statistics.ipsBlocked++;
      this.emit('ip-blocked', ip);
    });

    // Firewall events
    this.firewall.on('packet-allowed', (packet: any, reason: string) => {
      this.systemState.statistics.totalPackets++;
      this.emit('packet-allowed', packet, reason);
    });

    this.firewall.on('packet-denied', (packet: any, reason: string) => {
      this.systemState.statistics.totalPackets++;
      this.emit('packet-denied', packet, reason);
    });

    this.firewall.on('packet-dropped', (packet: any, reason: string) => {
      this.systemState.statistics.totalPackets++;
      this.emit('packet-dropped', packet, reason);
    });

    this.firewall.on('ip-blocked', (ip: string) => {
      console.log('🚫 IP blocked by firewall:', ip);
      this.systemState.statistics.ipsBlocked++;
      this.emit('ip-blocked', ip);
    });

    // GUI events
    this.gui.on('started', () => {
      console.log('✓ GUI started');
      this.systemState.components.gui = true;
    });

    this.gui.on('stopped', () => {
      console.log('✓ GUI stopped');
      this.systemState.components.gui = false;
    });

    // System shutdown events
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('uncaughtException', (error) => this.handleError(error));
    process.on('unhandledRejection', (reason) => this.handleError(reason));
  }

  public async start(): Promise<void> {
    if (this.systemState.isRunning) {
      console.log('System is already running');
      return;
    }

    console.log('Starting Traffic Security System...');

    try {
      // Start components in order
      await this.startComponents();

      // Update system state
      this.systemState.isRunning = true;
      this.systemState.startTime = new Date();

      // Start monitoring
      this.startMonitoring();

      console.log('✅ Traffic Security System started successfully');
      this.emit('system-started');

    } catch (error) {
      console.error('Failed to start system:', error);
      await this.shutdown();
      throw error;
    }
  }

  private async startComponents(): Promise<void> {
    // Start firewall first
    console.log('Starting firewall...');
    this.firewall.start();
    this.systemState.components.firewall = true;
    await this.wait(1000);

    // Start DDoS monitor
    console.log('Starting DDoS monitor...');
    this.ddosMonitor.start();
    this.systemState.components.ddosMonitor = true;
    await this.wait(1000);

    // Start traffic analyzer
    console.log('Starting traffic analyzer...');
    // The analyzer doesn't have a start method, so we just mark it as ready
    this.systemState.components.analyzer = true;
    await this.wait(1000);

    // Start GUI last
    console.log('Starting GUI...');
    this.gui.run();
    await this.wait(2000);
  }

  private startMonitoring(): void {
    // Health check interval
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds

    // Statistics update interval
    this.statsInterval = setInterval(() => {
      this.updateStatistics();
    }, 5000); // Every 5 seconds
  }

  private performHealthCheck(): void {
    const healthStatus = {
      timestamp: new Date(),
      system: this.systemState.isRunning,
      components: this.systemState.components,
      uptime: this.getUptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    // Check component health
    const allHealthy = Object.values(this.systemState.components).every(component => component);

    if (!allHealthy) {
      console.warn('⚠️ Some components are not healthy:', healthStatus);
      this.emit('health-warning', healthStatus);
    } else {
      this.emit('health-check', healthStatus);
    }
  }

  private updateStatistics(): void {
    // Update uptime
    this.systemState.uptime = this.getUptime();

    // Get component statistics
    const firewallStats = this.firewall.getStatistics();
    const ddosStats = this.ddosMonitor.getStatistics();

    // Update system statistics
    this.systemState.statistics.totalPackets = firewallStats.totalPackets;
    this.systemState.statistics.attacksDetected = ddosStats.attacksDetected;
    this.systemState.statistics.ipsBlocked = firewallStats.deniedPackets + ddosStats.blockedIps;
    this.systemState.statistics.connectionsTracked = firewallStats.activeConnections;

    this.emit('statistics-updated', this.systemState.statistics);
  }

  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log('Shutting down Traffic Security System...');

    try {
      // Stop monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      if (this.statsInterval) {
        clearInterval(this.statsInterval);
        this.statsInterval = null;
      }

      // Stop components in reverse order
      await this.stopComponents();

      // Update system state
      this.systemState.isRunning = false;

      console.log('✅ Traffic Security System shut down successfully');
      this.emit('system-stopped');

    } catch (error) {
      console.error('Error during shutdown:', error);
    } finally {
      process.exit(0);
    }
  }

  private async stopComponents(): Promise<void> {
    // Stop GUI first
    console.log('Stopping GUI...');
    this.gui.dispose();
    this.systemState.components.gui = false;
    await this.wait(1000);

    // Stop DDoS monitor
    console.log('Stopping DDoS monitor...');
    this.ddosMonitor.stop();
    this.ddosMonitor.dispose();
    this.systemState.components.ddosMonitor = false;
    await this.wait(1000);

    // Stop firewall
    console.log('Stopping firewall...');
    this.firewall.stop();
    this.firewall.dispose();
    this.systemState.components.firewall = false;
    await this.wait(1000);

    // Stop traffic analyzer
    console.log('Stopping traffic analyzer...');
    this.analyzer.dispose();
    this.systemState.components.analyzer = false;
    await this.wait(1000);
  }

  private handleError(error: any): void {
    console.error('Unhandled error:', error);
    this.emit('error', error);
    
    // Don't exit immediately, let the shutdown process handle it
    if (!this.isShuttingDown) {
      this.shutdown();
    }
  }

  public getSystemState(): SystemState {
    return { ...this.systemState };
  }

  public getUptime(): number {
    if (!this.systemState.isRunning) {
      return 0;
    }
    return Date.now() - this.systemState.startTime.getTime();
  }

  public getComponentStatus(): any {
    return {
      analyzer: {
        status: this.systemState.components.analyzer ? 'running' : 'stopped',
        historySize: this.analyzer.getHistorySize(),
        mlEnabled: this.analyzer.isMlEnabled(),
        sensitivity: this.analyzer.getSensitivity()
      },
      ddosMonitor: {
        status: this.systemState.components.ddosMonitor ? 'running' : 'stopped',
        statistics: this.ddosMonitor.getStatistics(),
        blockedIps: this.ddosMonitor.getBlockedIps(),
        whitelistedIps: this.ddosMonitor.getWhitelistedIps()
      },
      firewall: {
        status: this.systemState.components.firewall ? 'running' : 'stopped',
        statistics: this.firewall.getStatistics(),
        rules: this.firewall.getAllRules().length,
        blockedIps: this.firewall.getBlockedIps(),
        whitelistedIps: this.firewall.getWhitelistedIps()
      },
      gui: {
        status: this.systemState.components.gui ? 'running' : 'stopped'
      }
    };
  }

  public generateReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      systemState: this.getSystemState(),
      componentStatus: this.getComponentStatus(),
      configuration: this.config.getConfig()
    };

    return JSON.stringify(report, null, 2);
  }

  public saveReport(filename: string): void {
    const report = this.generateReport();
    const fs = require('fs');
    const path = require('path');

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, filename);
    fs.writeFileSync(reportPath, report);
    console.log(`Report saved to: ${reportPath}`);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for external control
  public restartComponent(componentName: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        switch (componentName.toLowerCase()) {
          case 'analyzer':
            this.analyzer.dispose();
            this.analyzer = new TrafficAnalyzer();
            this.systemState.components.analyzer = true;
            break;
          case 'ddos':
            this.ddosMonitor.stop();
            this.ddosMonitor.dispose();
            this.ddosMonitor = new DDoSMonitor();
            this.ddosMonitor.start();
            this.systemState.components.ddosMonitor = true;
            break;
          case 'firewall':
            this.firewall.stop();
            this.firewall.dispose();
            this.firewall = new Firewall();
            this.firewall.start();
            this.systemState.components.firewall = true;
            break;
          default:
            throw new Error(`Unknown component: ${componentName}`);
        }
        resolve(true);
      } catch (error) {
        console.error(`Failed to restart ${componentName}:`, error);
        resolve(false);
      }
    });
  }

  public updateConfiguration(section: string, key: string, value: any): void {
    this.config.setValue(section as any, key, value);
    console.log(`Configuration updated: ${section}.${key} = ${value}`);
  }
}

// Main function
async function main(): Promise<void> {
  console.log('🚀 Traffic Security System');
  console.log('==========================');
  console.log('Version: 1.0.0');
  console.log('Platform:', process.platform);
  console.log('Node.js:', process.version);
  console.log('');

  const system = new TrafficSecuritySystem();

  // Set up system event listeners
  system.on('system-started', () => {
    console.log('🎉 System is now running!');
    console.log('Press Ctrl+C to stop the system');
  });

  system.on('system-stopped', () => {
    console.log('👋 System stopped');
  });

  system.on('anomaly-detected', (data) => {
    console.log('🚨 ANOMALY:', data);
  });

  system.on('ddos-attack-detected', (attack) => {
    console.log('🚨 DDoS ATTACK:', attack);
  });

  system.on('ip-blocked', (ip) => {
    console.log('🚫 IP BLOCKED:', ip);
  });

  system.on('health-check', (status) => {
    console.log('💚 Health check passed');
  });

  system.on('health-warning', (status) => {
    console.log('⚠️ Health warning:', status);
  });

  system.on('statistics-updated', (stats) => {
    console.log('📊 Stats:', {
      packets: stats.totalPackets,
      attacks: stats.attacksDetected,
      blocked: stats.ipsBlocked,
      connections: stats.connectionsTracked
    });
  });

  system.on('error', (error) => {
    console.error('💥 System error:', error);
  });

  try {
    await system.start();

    // Keep the process running
    process.stdin.resume();

  } catch (error) {
    console.error('Failed to start system:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 