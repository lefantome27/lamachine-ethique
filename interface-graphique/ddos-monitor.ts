import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

// Interfaces
interface PacketData {
  timestamp: Date;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  size: number;
  flags: string;
}

interface ConnectionData {
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  startTime: Date;
  lastSeen: Date;
  packetCount: number;
  byteCount: number;
  isActive: boolean;
}

interface AttackPattern {
  type: string;
  sourceIp: string;
  startTime: Date;
  endTime: Date;
  packetCount: number;
  byteCount: number;
  intensity: number;
  status: string;
}

interface DDoSConfig {
  enabled: boolean;
  detectionWindow: number;
  thresholdPackets: number;
  thresholdBytes: number;
  thresholdConnections: number;
  blockDuration: number;
  whitelistIps: string[];
  blacklistIps: string[];
  alertThreshold: number;
  autoBlock: boolean;
}

interface Thresholds {
  normal: number;
  warning: number;
  critical: number;
  emergency: number;
}

// Threat level enum
enum ThreatLevel {
  NORMAL = 'NORMAL',
  NOTICE = 'NOTICE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY'
}

// DDoS Monitor class
export class DDoSMonitor extends EventEmitter {
  private config: DDoSConfig;
  private thresholds: Thresholds;
  private connections: Map<string, ConnectionData>;
  private attackPatterns: AttackPattern[];
  private packetHistory: PacketData[];
  private blockedIps: Set<string>;
  private whitelistedIps: Set<string>;
  private isRunning: boolean;
  private logWriter: fs.WriteStream | null;
  private stats: {
    totalPackets: number;
    totalConnections: number;
    attacksDetected: number;
    ipsBlocked: number;
    lastUpdateTime: Date;
  };

  constructor(config?: Partial<DDoSConfig>) {
    super();

    this.config = {
      enabled: true,
      detectionWindow: 60, // seconds
      thresholdPackets: 1000,
      thresholdBytes: 1000000, // 1MB
      thresholdConnections: 100,
      blockDuration: 3600, // 1 hour
      whitelistIps: [],
      blacklistIps: [],
      alertThreshold: 0.8,
      autoBlock: true,
      ...config
    };

    this.thresholds = {
      normal: 50,
      warning: 100,
      critical: 200,
      emergency: 500
    };

    this.connections = new Map();
    this.attackPatterns = [];
    this.packetHistory = [];
    this.blockedIps = new Set();
    this.whitelistedIps = new Set(this.config.whitelistIps);

    this.isRunning = false;
    this.logWriter = null;

    this.stats = {
      totalPackets: 0,
      totalConnections: 0,
      attacksDetected: 0,
      ipsBlocked: 0,
      lastUpdateTime: new Date()
    };

    this.initialize();
  }

  private initialize(): void {
    // Create logs directory
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Initialize log writer
    const logPath = path.join(logsDir, 'ddos_monitor.log');
    this.logWriter = fs.createWriteStream(logPath, { flags: 'a' });

    this.log('DDoS Monitor initialized');
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    if (this.logWriter) {
      this.logWriter.write(logMessage);
    }

    console.log(logMessage.trim());
  }

  public start(): void {
    if (this.isRunning) {
      this.log('DDoS Monitor is already running');
      return;
    }

    this.isRunning = true;
    this.log('DDoS Monitor started');

    // Start monitoring loop
    this.monitoringLoop();

    this.emit('started');
  }

  public stop(): void {
    if (!this.isRunning) {
      this.log('DDoS Monitor is not running');
      return;
    }

    this.isRunning = false;
    this.log('DDoS Monitor stopped');

    this.emit('stopped');
  }

  private monitoringLoop(): void {
    if (!this.isRunning) return;

    // Clean up old data
    this.cleanupOldData();

    // Analyze current traffic
    this.analyzeTraffic();

    // Schedule next check
    setTimeout(() => this.monitoringLoop(), 1000);
  }

  private cleanupOldData(): void {
    const cutoffTime = new Date(Date.now() - this.config.detectionWindow * 1000);

    // Clean packet history
    this.packetHistory = this.packetHistory.filter(
      packet => packet.timestamp > cutoffTime
    );

    // Clean inactive connections
    for (const [key, connection] of this.connections.entries()) {
      if (connection.lastSeen < cutoffTime) {
        this.connections.delete(key);
      }
    }

    // Clean old attack patterns
    this.attackPatterns = this.attackPatterns.filter(
      pattern => pattern.endTime > cutoffTime
    );
  }

  public processPacket(packet: PacketData): void {
    if (!this.isRunning || !this.config.enabled) {
      return;
    }

    // Skip whitelisted IPs
    if (this.whitelistedIps.has(packet.sourceIp)) {
      return;
    }

    // Add to packet history
    this.packetHistory.push(packet);
    this.stats.totalPackets++;

    // Update connection data
    this.updateConnection(packet);

    // Check for attacks
    this.checkForAttacks(packet);
  }

  private updateConnection(packet: PacketData): void {
    const connectionKey = `${packet.sourceIp}:${packet.sourcePort}-${packet.destinationIp}:${packet.destinationPort}-${packet.protocol}`;

    if (this.connections.has(connectionKey)) {
      const connection = this.connections.get(connectionKey)!;
      connection.lastSeen = packet.timestamp;
      connection.packetCount++;
      connection.byteCount += packet.size;
    } else {
      const newConnection: ConnectionData = {
        sourceIp: packet.sourceIp,
        destinationIp: packet.destinationIp,
        sourcePort: packet.sourcePort,
        destinationPort: packet.destinationPort,
        protocol: packet.protocol,
        startTime: packet.timestamp,
        lastSeen: packet.timestamp,
        packetCount: 1,
        byteCount: packet.size,
        isActive: true
      };

      this.connections.set(connectionKey, newConnection);
      this.stats.totalConnections++;
    }
  }

  private checkForAttacks(packet: PacketData): void {
    // Check packet rate
    this.checkPacketRate(packet.sourceIp);

    // Check connection rate
    this.checkConnectionRate(packet.sourceIp);

    // Check byte rate
    this.checkByteRate(packet.sourceIp);

    // Check for SYN flood
    this.checkSynFlood(packet);

    // Check for UDP flood
    this.checkUdpFlood(packet);

    // Check for ICMP flood
    this.checkIcmpFlood(packet);
  }

  private checkPacketRate(sourceIp: string): void {
    const recentPackets = this.packetHistory.filter(
      packet => packet.sourceIp === sourceIp &&
                packet.timestamp > new Date(Date.now() - this.config.detectionWindow * 1000)
    );

    if (recentPackets.length > this.config.thresholdPackets) {
      this.detectAttack(sourceIp, 'PACKET_FLOOD', recentPackets.length);
    }
  }

  private checkConnectionRate(sourceIp: string): void {
    const recentConnections = Array.from(this.connections.values()).filter(
      conn => conn.sourceIp === sourceIp &&
              conn.startTime > new Date(Date.now() - this.config.detectionWindow * 1000)
    );

    if (recentConnections.length > this.config.thresholdConnections) {
      this.detectAttack(sourceIp, 'CONNECTION_FLOOD', recentConnections.length);
    }
  }

  private checkByteRate(sourceIp: string): void {
    const recentPackets = this.packetHistory.filter(
      packet => packet.sourceIp === sourceIp &&
                packet.timestamp > new Date(Date.now() - this.config.detectionWindow * 1000)
    );

    const totalBytes = recentPackets.reduce((sum, packet) => sum + packet.size, 0);

    if (totalBytes > this.config.thresholdBytes) {
      this.detectAttack(sourceIp, 'BYTE_FLOOD', totalBytes);
    }
  }

  private checkSynFlood(packet: PacketData): void {
    if (packet.protocol === 'TCP' && packet.flags.includes('SYN')) {
      const synPackets = this.packetHistory.filter(
        p => p.sourceIp === packet.sourceIp &&
             p.protocol === 'TCP' &&
             p.flags.includes('SYN') &&
             p.timestamp > new Date(Date.now() - 10 * 1000) // 10 seconds
      );

      if (synPackets.length > 50) {
        this.detectAttack(packet.sourceIp, 'SYN_FLOOD', synPackets.length);
      }
    }
  }

  private checkUdpFlood(packet: PacketData): void {
    if (packet.protocol === 'UDP') {
      const udpPackets = this.packetHistory.filter(
        p => p.sourceIp === packet.sourceIp &&
             p.protocol === 'UDP' &&
             p.timestamp > new Date(Date.now() - this.config.detectionWindow * 1000)
      );

      if (udpPackets.length > this.config.thresholdPackets * 0.8) {
        this.detectAttack(packet.sourceIp, 'UDP_FLOOD', udpPackets.length);
      }
    }
  }

  private checkIcmpFlood(packet: PacketData): void {
    if (packet.protocol === 'ICMP') {
      const icmpPackets = this.packetHistory.filter(
        p => p.sourceIp === packet.sourceIp &&
             p.protocol === 'ICMP' &&
             p.timestamp > new Date(Date.now() - this.config.detectionWindow * 1000)
      );

      if (icmpPackets.length > 100) {
        this.detectAttack(packet.sourceIp, 'ICMP_FLOOD', icmpPackets.length);
      }
    }
  }

  private detectAttack(sourceIp: string, attackType: string, intensity: number): void {
    // Check if IP is already blocked
    if (this.blockedIps.has(sourceIp)) {
      return;
    }

    // Check if attack is already detected
    const existingAttack = this.attackPatterns.find(
      pattern => pattern.sourceIp === sourceIp && 
                 pattern.type === attackType &&
                 pattern.status === 'ACTIVE'
    );

    if (existingAttack) {
      // Update existing attack
      existingAttack.packetCount++;
      existingAttack.byteCount += intensity;
      existingAttack.intensity = Math.max(existingAttack.intensity, intensity);
      existingAttack.endTime = new Date();
    } else {
      // Create new attack pattern
      const newAttack: AttackPattern = {
        type: attackType,
        sourceIp: sourceIp,
        startTime: new Date(),
        endTime: new Date(),
        packetCount: 1,
        byteCount: intensity,
        intensity: intensity,
        status: 'ACTIVE'
      };

      this.attackPatterns.push(newAttack);
      this.stats.attacksDetected++;

      this.log(`DDoS attack detected: ${attackType} from ${sourceIp} (intensity: ${intensity})`);

      // Emit attack event
      this.emit('attack-detected', newAttack);

      // Auto-block if enabled
      if (this.config.autoBlock) {
        this.blockIp(sourceIp);
      }
    }
  }

  public blockIp(ip: string): boolean {
    if (this.whitelistedIps.has(ip)) {
      this.log(`Cannot block whitelisted IP: ${ip}`);
      return false;
    }

    if (this.blockedIps.has(ip)) {
      this.log(`IP already blocked: ${ip}`);
      return false;
    }

    this.blockedIps.add(ip);
    this.stats.ipsBlocked++;

    this.log(`IP blocked: ${ip}`);

    // Emit block event
    this.emit('ip-blocked', ip);

    // Schedule unblock
    setTimeout(() => {
      this.unblockIp(ip);
    }, this.config.blockDuration * 1000);

    return true;
  }

  public unblockIp(ip: string): boolean {
    if (!this.blockedIps.has(ip)) {
      return false;
    }

    this.blockedIps.delete(ip);
    this.log(`IP unblocked: ${ip}`);

    // Emit unblock event
    this.emit('ip-unblocked', ip);

    return true;
  }

  public isIpBlocked(ip: string): boolean {
    return this.blockedIps.has(ip);
  }

  public isIpWhitelisted(ip: string): boolean {
    return this.whitelistedIps.has(ip);
  }

  public addToWhitelist(ip: string): void {
    this.whitelistedIps.add(ip);
    this.log(`IP added to whitelist: ${ip}`);
  }

  public removeFromWhitelist(ip: string): void {
    this.whitelistedIps.delete(ip);
    this.log(`IP removed from whitelist: ${ip}`);
  }

  public getThreatLevel(): ThreatLevel {
    const activeAttacks = this.attackPatterns.filter(
      pattern => pattern.status === 'ACTIVE'
    );

    if (activeAttacks.length === 0) {
      return ThreatLevel.NORMAL;
    }

    const maxIntensity = Math.max(...activeAttacks.map(a => a.intensity));

    if (maxIntensity > this.thresholds.emergency) {
      return ThreatLevel.EMERGENCY;
    } else if (maxIntensity > this.thresholds.critical) {
      return ThreatLevel.CRITICAL;
    } else if (maxIntensity > this.thresholds.warning) {
      return ThreatLevel.WARNING;
    } else {
      return ThreatLevel.NOTICE;
    }
  }

  public getStatistics(): any {
    return {
      ...this.stats,
      activeConnections: this.connections.size,
      activeAttacks: this.attackPatterns.filter(p => p.status === 'ACTIVE').length,
      blockedIps: this.blockedIps.size,
      whitelistedIps: this.whitelistedIps.size,
      threatLevel: this.getThreatLevel()
    };
  }

  public getAttackHistory(): AttackPattern[] {
    return [...this.attackPatterns];
  }

  public getActiveConnections(): ConnectionData[] {
    return Array.from(this.connections.values()).filter(conn => conn.isActive);
  }

  public getBlockedIps(): string[] {
    return Array.from(this.blockedIps);
  }

  public getWhitelistedIps(): string[] {
    return Array.from(this.whitelistedIps);
  }

  public updateConfig(newConfig: Partial<DDoSConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('Configuration updated');
  }

  public getConfig(): DDoSConfig {
    return { ...this.config };
  }

  public clearStatistics(): void {
    this.stats = {
      totalPackets: 0,
      totalConnections: 0,
      attacksDetected: 0,
      ipsBlocked: 0,
      lastUpdateTime: new Date()
    };

    this.log('Statistics cleared');
  }

  public exportReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      statistics: this.getStatistics(),
      attackHistory: this.getAttackHistory(),
      blockedIps: this.getBlockedIps(),
      whitelistedIps: this.getWhitelistedIps(),
      config: this.getConfig()
    };

    return JSON.stringify(report, null, 2);
  }

  public saveReport(filename: string): void {
    const report = this.exportReport();
    fs.writeFileSync(filename, report);
    this.log(`Report saved to: ${filename}`);
  }

  private analyzeTraffic(): void {
    // Update statistics
    this.stats.lastUpdateTime = new Date();

    // Check overall traffic patterns
    const totalPackets = this.packetHistory.length;
    const totalConnections = this.connections.size;
    const activeAttacks = this.attackPatterns.filter(p => p.status === 'ACTIVE').length;

    // Emit traffic analysis event
    this.emit('traffic-analyzed', {
      totalPackets,
      totalConnections,
      activeAttacks,
      threatLevel: this.getThreatLevel()
    });
  }

  public dispose(): void {
    this.stop();

    if (this.logWriter) {
      this.logWriter.end();
    }

    this.log('DDoS Monitor disposed');
  }
}

// Main function for testing
export async function main(): Promise<void> {
  const monitor = new DDoSMonitor();

  // Set up event listeners
  monitor.on('attack-detected', (attack: AttackPattern) => {
    console.log(`🚨 ATTACK DETECTED: ${attack.type} from ${attack.sourceIp}`);
  });

  monitor.on('ip-blocked', (ip: string) => {
    console.log(`🚫 IP BLOCKED: ${ip}`);
  });

  monitor.on('traffic-analyzed', (stats: any) => {
    console.log(`📊 Traffic stats: ${stats.totalPackets} packets, ${stats.activeAttacks} attacks`);
  });

  // Start monitoring
  monitor.start();

  // Simulate traffic
  for (let i = 0; i < 100; i++) {
    const packet: PacketData = {
      timestamp: new Date(),
      sourceIp: `192.168.1.${Math.floor(Math.random() * 255)}`,
      destinationIp: '192.168.1.1',
      sourcePort: Math.floor(Math.random() * 65535),
      destinationPort: 80,
      protocol: ['TCP', 'UDP', 'ICMP'][Math.floor(Math.random() * 3)],
      size: Math.floor(Math.random() * 1500),
      flags: Math.random() > 0.5 ? 'SYN' : 'ACK'
    };

    monitor.processPacket(packet);

    // Simulate attack
    if (i % 20 === 0) {
      for (let j = 0; j < 50; j++) {
        const attackPacket: PacketData = {
          timestamp: new Date(),
          sourceIp: '192.168.1.100',
          destinationIp: '192.168.1.1',
          sourcePort: Math.floor(Math.random() * 65535),
          destinationPort: 80,
          protocol: 'TCP',
          size: 1000,
          flags: 'SYN'
        };
        monitor.processPacket(attackPacket);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Get final statistics
  console.log('\nFinal Statistics:');
  console.log(JSON.stringify(monitor.getStatistics(), null, 2));

  // Stop monitoring
  monitor.stop();
  monitor.dispose();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 