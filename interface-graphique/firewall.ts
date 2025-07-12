import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

// Interfaces
interface FirewallRule {
  id: string;
  name: string;
  action: 'ALLOW' | 'DENY' | 'DROP';
  protocol: string;
  sourceIp: string;
  sourcePort: string;
  destinationIp: string;
  destinationPort: string;
  direction: 'INBOUND' | 'OUTBOUND' | 'BOTH';
  priority: number;
  enabled: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Connection {
  id: string;
  sourceIp: string;
  sourcePort: number;
  destinationIp: string;
  destinationPort: number;
  protocol: string;
  state: 'ESTABLISHED' | 'SYN_SENT' | 'SYN_RECV' | 'FIN_WAIT' | 'CLOSE_WAIT' | 'CLOSED';
  startTime: Date;
  lastSeen: Date;
  packetCount: number;
  byteCount: number;
}

interface Packet {
  timestamp: Date;
  sourceIp: string;
  sourcePort: number;
  destinationIp: string;
  destinationPort: number;
  protocol: string;
  size: number;
  flags: string;
  payload?: Buffer;
}

interface FirewallConfig {
  enabled: boolean;
  defaultPolicy: 'ALLOW' | 'DENY';
  logLevel: 'NONE' | 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';
  maxConnections: number;
  connectionTimeout: number;
  rateLimitEnabled: boolean;
  rateLimitPackets: number;
  rateLimitWindow: number;
  autoBlockDuration: number;
  whitelistIps: string[];
  blacklistIps: string[];
}

interface FirewallStats {
  totalPackets: number;
  allowedPackets: number;
  deniedPackets: number;
  droppedPackets: number;
  activeConnections: number;
  totalConnections: number;
  rulesEvaluated: number;
  lastUpdateTime: Date;
}

// Firewall class
export class Firewall extends EventEmitter {
  private config: FirewallConfig;
  private rules: Map<string, FirewallRule>;
  private connections: Map<string, Connection>;
  private blockedIps: Set<string>;
  private whitelistedIps: Set<string>;
  private isRunning: boolean;
  private logWriter: fs.WriteStream | null;
  private stats: FirewallStats;
  private rulesFile: string;

  constructor(config?: Partial<FirewallConfig>) {
    super();

    this.config = {
      enabled: true,
      defaultPolicy: 'DENY',
      logLevel: 'INFO',
      maxConnections: 10000,
      connectionTimeout: 3600,
      rateLimitEnabled: true,
      rateLimitPackets: 1000,
      rateLimitWindow: 60,
      autoBlockDuration: 3600,
      whitelistIps: [],
      blacklistIps: [],
      ...config
    };

    this.rules = new Map();
    this.connections = new Map();
    this.blockedIps = new Set(this.config.blacklistIps);
    this.whitelistedIps = new Set(this.config.whitelistIps);
    this.isRunning = false;
    this.logWriter = null;

    this.stats = {
      totalPackets: 0,
      allowedPackets: 0,
      deniedPackets: 0,
      droppedPackets: 0,
      activeConnections: 0,
      totalConnections: 0,
      rulesEvaluated: 0,
      lastUpdateTime: new Date()
    };

    this.rulesFile = path.join(process.cwd(), 'rules', 'firewall_rules.json');

    this.initialize();
  }

  private initialize(): void {
    // Create rules directory
    const rulesDir = path.dirname(this.rulesFile);
    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir, { recursive: true });
    }

    // Create logs directory
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Initialize log writer
    const logPath = path.join(logsDir, 'firewall.log');
    this.logWriter = fs.createWriteStream(logPath, { flags: 'a' });

    // Load rules
    this.loadRules();

    // Add default rules
    this.addDefaultRules();

    this.log('Firewall initialized');
  }

  private log(message: string, level: string = 'INFO'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;

    if (this.logWriter) {
      this.logWriter.write(logMessage);
    }

    if (this.shouldLog(level)) {
      console.log(logMessage.trim());
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['NONE', 'ERROR', 'WARNING', 'INFO', 'DEBUG'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel <= configLevel;
  }

  private loadRules(): void {
    try {
      if (fs.existsSync(this.rulesFile)) {
        const data = fs.readFileSync(this.rulesFile, 'utf8');
        const rulesData = JSON.parse(data);

        for (const ruleData of rulesData) {
          const rule: FirewallRule = {
            ...ruleData,
            createdAt: new Date(ruleData.createdAt),
            updatedAt: new Date(ruleData.updatedAt)
          };
          this.rules.set(rule.id, rule);
        }

        this.log(`Loaded ${this.rules.size} firewall rules`);
      }
    } catch (error) {
      this.log(`Error loading rules: ${error}`, 'ERROR');
    }
  }

  private saveRules(): void {
    try {
      const rulesData = Array.from(this.rules.values());
      fs.writeFileSync(this.rulesFile, JSON.stringify(rulesData, null, 2));
      this.log('Firewall rules saved');
    } catch (error) {
      this.log(`Error saving rules: ${error}`, 'ERROR');
    }
  }

  private addDefaultRules(): void {
    // Allow localhost
    this.addRule({
      name: 'Allow Localhost',
      action: 'ALLOW',
      protocol: 'ANY',
      sourceIp: '127.0.0.1',
      sourcePort: 'ANY',
      destinationIp: 'ANY',
      destinationPort: 'ANY',
      direction: 'BOTH',
      priority: 1000,
      description: 'Allow all traffic from localhost'
    });

    // Allow established connections
    this.addRule({
      name: 'Allow Established',
      action: 'ALLOW',
      protocol: 'ANY',
      sourceIp: 'ANY',
      sourcePort: 'ANY',
      destinationIp: 'ANY',
      destinationPort: 'ANY',
      direction: 'BOTH',
      priority: 900,
      description: 'Allow established connections'
    });

    // Deny invalid packets
    this.addRule({
      name: 'Deny Invalid',
      action: 'DENY',
      protocol: 'ANY',
      sourceIp: '0.0.0.0',
      sourcePort: 'ANY',
      destinationIp: 'ANY',
      destinationPort: 'ANY',
      direction: 'INBOUND',
      priority: 100,
      description: 'Deny packets from invalid source IPs'
    });
  }

  public start(): void {
    if (this.isRunning) {
      this.log('Firewall is already running');
      return;
    }

    this.isRunning = true;
    this.log('Firewall started');

    // Start cleanup loop
    this.cleanupLoop();

    this.emit('started');
  }

  public stop(): void {
    if (!this.isRunning) {
      this.log('Firewall is not running');
      return;
    }

    this.isRunning = false;
    this.log('Firewall stopped');

    this.emit('stopped');
  }

  private cleanupLoop(): void {
    if (!this.isRunning) return;

    // Clean up old connections
    this.cleanupConnections();

    // Schedule next cleanup
    setTimeout(() => this.cleanupLoop(), 30000); // Every 30 seconds
  }

  private cleanupConnections(): void {
    const cutoffTime = new Date(Date.now() - this.config.connectionTimeout * 1000);
    let cleanedCount = 0;

    for (const [key, connection] of this.connections.entries()) {
      if (connection.lastSeen < cutoffTime) {
        this.connections.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.log(`Cleaned up ${cleanedCount} old connections`);
    }
  }

  public processPacket(packet: Packet): 'ALLOW' | 'DENY' | 'DROP' {
    if (!this.isRunning || !this.config.enabled) {
      return 'ALLOW';
    }

    this.stats.totalPackets++;
    this.stats.lastUpdateTime = new Date();

    // Check if IP is blocked
    if (this.blockedIps.has(packet.sourceIp)) {
      this.stats.droppedPackets++;
      this.log(`Packet dropped from blocked IP: ${packet.sourceIp}`, 'WARNING');
      this.emit('packet-dropped', packet, 'BLOCKED_IP');
      return 'DROP';
    }

    // Check if IP is whitelisted
    if (this.whitelistedIps.has(packet.sourceIp)) {
      this.stats.allowedPackets++;
      this.updateConnection(packet);
      this.emit('packet-allowed', packet, 'WHITELISTED_IP');
      return 'ALLOW';
    }

    // Evaluate rules
    const decision = this.evaluateRules(packet);

    // Update statistics
    if (decision === 'ALLOW') {
      this.stats.allowedPackets++;
      this.updateConnection(packet);
      this.emit('packet-allowed', packet, 'RULE_MATCH');
    } else if (decision === 'DENY') {
      this.stats.deniedPackets++;
      this.emit('packet-denied', packet, 'RULE_MATCH');
    } else {
      this.stats.droppedPackets++;
      this.emit('packet-dropped', packet, 'RULE_MATCH');
    }

    return decision;
  }

  private evaluateRules(packet: Packet): 'ALLOW' | 'DENY' | 'DROP' {
    // Sort rules by priority (highest first)
    const sortedRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      this.stats.rulesEvaluated++;

      if (this.ruleMatches(rule, packet)) {
        this.log(`Rule matched: ${rule.name} (${rule.action})`, 'DEBUG');
        return rule.action;
      }
    }

    // No rule matched, use default policy
    this.log(`No rule matched, using default policy: ${this.config.defaultPolicy}`, 'DEBUG');
    return this.config.defaultPolicy;
  }

  private ruleMatches(rule: FirewallRule, packet: Packet): boolean {
    // Check protocol
    if (rule.protocol !== 'ANY' && rule.protocol !== packet.protocol) {
      return false;
    }

    // Check source IP
    if (!this.ipMatches(rule.sourceIp, packet.sourceIp)) {
      return false;
    }

    // Check source port
    if (!this.portMatches(rule.sourcePort, packet.sourcePort)) {
      return false;
    }

    // Check destination IP
    if (!this.ipMatches(rule.destinationIp, packet.destinationIp)) {
      return false;
    }

    // Check destination port
    if (!this.portMatches(rule.destinationPort, packet.destinationPort)) {
      return false;
    }

    return true;
  }

  private ipMatches(ruleIp: string, packetIp: string): boolean {
    if (ruleIp === 'ANY') return true;
    if (ruleIp === packetIp) return true;

    // Check for CIDR notation
    if (ruleIp.includes('/')) {
      return this.ipInCidr(packetIp, ruleIp);
    }

    return false;
  }

  private portMatches(rulePort: string, packetPort: number): boolean {
    if (rulePort === 'ANY') return true;
    if (rulePort === packetPort.toString()) return true;

    // Check for port ranges (e.g., "80-90")
    if (rulePort.includes('-')) {
      const [start, end] = rulePort.split('-').map(p => parseInt(p));
      return packetPort >= start && packetPort <= end;
    }

    return false;
  }

  private ipInCidr(ip: string, cidr: string): boolean {
    // Simplified CIDR check
    const [network, bits] = cidr.split('/');
    const mask = parseInt(bits);
    
    // Convert IPs to numbers for comparison
    const ipNum = this.ipToNumber(ip);
    const networkNum = this.ipToNumber(network);
    
    const maskNum = mask === 32 ? 0xFFFFFFFF : (0xFFFFFFFF << (32 - mask));
    
    return (ipNum & maskNum) === (networkNum & maskNum);
  }

  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  private updateConnection(packet: Packet): void {
    const connectionKey = `${packet.sourceIp}:${packet.sourcePort}-${packet.destinationIp}:${packet.destinationPort}-${packet.protocol}`;

    if (this.connections.has(connectionKey)) {
      const connection = this.connections.get(connectionKey)!;
      connection.lastSeen = packet.timestamp;
      connection.packetCount++;
      connection.byteCount += packet.size;
    } else {
      const newConnection: Connection = {
        id: connectionKey,
        sourceIp: packet.sourceIp,
        sourcePort: packet.sourcePort,
        destinationIp: packet.destinationIp,
        destinationPort: packet.destinationPort,
        protocol: packet.protocol,
        state: 'ESTABLISHED',
        startTime: packet.timestamp,
        lastSeen: packet.timestamp,
        packetCount: 1,
        byteCount: packet.size
      };

      this.connections.set(connectionKey, newConnection);
      this.stats.totalConnections++;
    }

    this.stats.activeConnections = this.connections.size;
  }

  public addRule(ruleData: Omit<FirewallRule, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const rule: FirewallRule = {
      ...ruleData,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.rules.set(id, rule);
    this.saveRules();

    this.log(`Rule added: ${rule.name} (${rule.action})`);
    this.emit('rule-added', rule);

    return id;
  }

  public updateRule(id: string, updates: Partial<FirewallRule>): boolean {
    if (!this.rules.has(id)) {
      return false;
    }

    const rule = this.rules.get(id)!;
    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date()
    };

    this.rules.set(id, updatedRule);
    this.saveRules();

    this.log(`Rule updated: ${updatedRule.name}`);
    this.emit('rule-updated', updatedRule);

    return true;
  }

  public deleteRule(id: string): boolean {
    if (!this.rules.has(id)) {
      return false;
    }

    const rule = this.rules.get(id)!;
    this.rules.delete(id);
    this.saveRules();

    this.log(`Rule deleted: ${rule.name}`);
    this.emit('rule-deleted', rule);

    return true;
  }

  public getRule(id: string): FirewallRule | undefined {
    return this.rules.get(id);
  }

  public getAllRules(): FirewallRule[] {
    return Array.from(this.rules.values());
  }

  public getActiveConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  public getStatistics(): FirewallStats {
    return { ...this.stats };
  }

  public blockIp(ip: string): void {
    this.blockedIps.add(ip);
    this.log(`IP blocked: ${ip}`, 'WARNING');
    this.emit('ip-blocked', ip);
  }

  public unblockIp(ip: string): void {
    this.blockedIps.delete(ip);
    this.log(`IP unblocked: ${ip}`);
    this.emit('ip-unblocked', ip);
  }

  public isIpBlocked(ip: string): boolean {
    return this.blockedIps.has(ip);
  }

  public addToWhitelist(ip: string): void {
    this.whitelistedIps.add(ip);
    this.log(`IP added to whitelist: ${ip}`);
    this.emit('ip-whitelisted', ip);
  }

  public removeFromWhitelist(ip: string): void {
    this.whitelistedIps.delete(ip);
    this.log(`IP removed from whitelist: ${ip}`);
    this.emit('ip-whitelist-removed', ip);
  }

  public isIpWhitelisted(ip: string): boolean {
    return this.whitelistedIps.has(ip);
  }

  public getBlockedIps(): string[] {
    return Array.from(this.blockedIps);
  }

  public getWhitelistedIps(): string[] {
    return Array.from(this.whitelistedIps);
  }

  public updateConfig(newConfig: Partial<FirewallConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('Configuration updated');
    this.emit('config-updated', this.config);
  }

  public getConfig(): FirewallConfig {
    return { ...this.config };
  }

  public clearStatistics(): void {
    this.stats = {
      totalPackets: 0,
      allowedPackets: 0,
      deniedPackets: 0,
      droppedPackets: 0,
      activeConnections: 0,
      totalConnections: 0,
      rulesEvaluated: 0,
      lastUpdateTime: new Date()
    };

    this.log('Statistics cleared');
  }

  public exportRules(): string {
    return JSON.stringify(Array.from(this.rules.values()), null, 2);
  }

  public importRules(rulesJson: string): boolean {
    try {
      const rulesData = JSON.parse(rulesJson);
      
      for (const ruleData of rulesData) {
        const rule: FirewallRule = {
          ...ruleData,
          createdAt: new Date(ruleData.createdAt),
          updatedAt: new Date(ruleData.updatedAt)
        };
        this.rules.set(rule.id, rule);
      }

      this.saveRules();
      this.log(`Imported ${rulesData.length} rules`);
      return true;
    } catch (error) {
      this.log(`Error importing rules: ${error}`, 'ERROR');
      return false;
    }
  }

  public dispose(): void {
    this.stop();

    if (this.logWriter) {
      this.logWriter.end();
    }

    this.log('Firewall disposed');
  }
}

// Main function for testing
export async function main(): Promise<void> {
  const firewall = new Firewall();

  // Set up event listeners
  firewall.on('packet-allowed', (packet: Packet, reason: string) => {
    console.log(`✅ Packet allowed: ${packet.sourceIp} -> ${packet.destinationIp} (${reason})`);
  });

  firewall.on('packet-denied', (packet: Packet, reason: string) => {
    console.log(`❌ Packet denied: ${packet.sourceIp} -> ${packet.destinationIp} (${reason})`);
  });

  firewall.on('packet-dropped', (packet: Packet, reason: string) => {
    console.log(`🚫 Packet dropped: ${packet.sourceIp} -> ${packet.destinationIp} (${reason})`);
  });

  // Start firewall
  firewall.start();

  // Test packets
  const testPackets: Packet[] = [
    {
      timestamp: new Date(),
      sourceIp: '127.0.0.1',
      sourcePort: 12345,
      destinationIp: '192.168.1.1',
      destinationPort: 80,
      protocol: 'TCP',
      size: 1000,
      flags: 'SYN'
    },
    {
      timestamp: new Date(),
      sourceIp: '192.168.1.100',
      sourcePort: 54321,
      destinationIp: '192.168.1.1',
      destinationPort: 443,
      protocol: 'TCP',
      size: 1500,
      flags: 'ACK'
    },
    {
      timestamp: new Date(),
      sourceIp: '0.0.0.0',
      sourcePort: 1234,
      destinationIp: '192.168.1.1',
      destinationPort: 80,
      protocol: 'TCP',
      size: 500,
      flags: 'SYN'
    }
  ];

  // Process test packets
  for (const packet of testPackets) {
    const decision = firewall.processPacket(packet);
    console.log(`Packet decision: ${decision}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Get statistics
  console.log('\nFirewall Statistics:');
  console.log(JSON.stringify(firewall.getStatistics(), null, 2));

  // Get rules
  console.log('\nFirewall Rules:');
  firewall.getAllRules().forEach(rule => {
    console.log(`- ${rule.name}: ${rule.action} ${rule.protocol} ${rule.sourceIp}:${rule.sourcePort} -> ${rule.destinationIp}:${rule.destinationPort}`);
  });

  // Stop firewall
  firewall.stop();
  firewall.dispose();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 