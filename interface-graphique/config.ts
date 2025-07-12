import * as fs from 'fs';
import * as path from 'path';

// Configuration interfaces
interface GeneralConfig {
  debug: boolean;
  logLevel: string;
  maxLogSize: number;
  backupCount: number;
  timezone: string;
}

interface AnalysisConfig {
  enabled: boolean;
  mlEnabled: boolean;
  sensitivity: number;
  timeWindow: number;
  minDataPoints: number;
  maxDataPoints: number;
  updateInterval: number;
  batchSize: number;
  confidenceThreshold: number;
}

interface ThresholdsConfig {
  normal: number;
  warning: number;
  critical: number;
  emergency: number;
  baseline: number;
  spikeThreshold: number;
  trendThreshold: number;
}

interface MLModelConfig {
  type: string;
  contamination: number;
  nEstimators: number;
  maxSamples: string;
  randomState: number;
  nJobs: number;
  maxFeatures: number;
  bootstrap: boolean;
  warmStart: boolean;
  verbose: number;
}

interface PatternsConfig {
  detectSpikes: boolean;
  detectTrends: boolean;
  detectCycles: boolean;
  spikeWindow: number;
  trendWindow: number;
  cycleWindow: number;
  minSpikeHeight: number;
  minTrendSlope: number;
}

interface AlertsConfig {
  enabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  webhookEnabled: boolean;
  notificationInterval: number;
  escalationTime: number;
  maxAlertsPerHour: number;
  alertCooldown: number;
}

interface EmailConfig {
  smtpServer: string;
  smtpPort: number;
  useTls: boolean;
  username: string;
  password: string;
  fromAddress: string;
  toAddresses: string[];
  subjectPrefix: string;
}

interface WebhookConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  timeout: number;
}

interface SlackConfig {
  webhookUrl: string;
  channel: string;
  username: string;
  iconEmoji: string;
}

interface NotificationsConfig {
  email: EmailConfig;
  webhook: WebhookConfig;
  slack: SlackConfig;
}

interface DatabaseConfig {
  type: string;
  path: string;
  host: string;
  port: number;
  name: string;
  username: string;
  password: string;
  poolSize: number;
  maxOverflow: number;
  echo: boolean;
}

interface StorageConfig {
  dataRetentionDays: number;
  backupEnabled: boolean;
  backupInterval: number;
  compressionEnabled: boolean;
  archiveEnabled: boolean;
  archiveAfterDays: number;
}

interface SecurityConfig {
  encryptionEnabled: boolean;
  encryptionKey: string;
  hashAlgorithm: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireSsl: boolean;
  allowedIps: string[];
  blockedIps: string[];
}

interface PerformanceConfig {
  maxThreads: number;
  queueSize: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheSize: number;
  cacheTtl: number;
}

interface ReportsConfig {
  enabled: boolean;
  autoGenerate: boolean;
  schedule: string;
  format: string;
  includeCharts: boolean;
  includeAnomalies: boolean;
  includeStatistics: boolean;
  emailReports: boolean;
}

interface PluginsConfig {
  enabled: boolean;
  pluginDir: string;
  autoLoad: boolean;
  reloadOnChange: boolean;
  pluginTimeout: number;
}

interface MonitoringConfig {
  healthCheckInterval: number;
  metricsEnabled: boolean;
  metricsPort: number;
  prometheusEnabled: boolean;
  grafanaEnabled: boolean;
  dashboardUrl: string;
}

interface PathsConfig {
  baseDir: string;
  rulesDir: string;
  dataDir: string;
  logsDir: string;
  pluginsDir: string;
  reportsDir: string;
  backupDir: string;
  tempDir: string;
}

interface FullConfig {
  general: GeneralConfig;
  analysis: AnalysisConfig;
  thresholds: ThresholdsConfig;
  mlModel: MLModelConfig;
  patterns: PatternsConfig;
  alerts: AlertsConfig;
  notifications: NotificationsConfig;
  database: DatabaseConfig;
  storage: StorageConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
  reports: ReportsConfig;
  plugins: PluginsConfig;
  monitoring: MonitoringConfig;
  paths: PathsConfig;
}

// Configuration class
export class Config {
  private configData: FullConfig;
  private configFilePath: string = '';
  private environment: string = 'development';

  // Paths
  public baseDir: string;
  public rulesDir: string;
  public dataDir: string;
  public logsDir: string;
  public pluginsDir: string;
  public reportsDir: string;
  public backupDir: string;
  public tempDir: string;

  constructor(configFile?: string) {
    // Set base directory
    this.baseDir = process.cwd();

    // Set default paths
    this.rulesDir = path.join(this.baseDir, 'rules');
    this.dataDir = path.join(this.baseDir, 'data');
    this.logsDir = path.join(this.baseDir, 'logs');
    this.pluginsDir = path.join(this.baseDir, 'plugins');
    this.reportsDir = path.join(this.baseDir, 'reports');
    this.backupDir = path.join(this.baseDir, 'backups');
    this.tempDir = path.join(this.baseDir, 'temp');

    // Create directories
    this.createDirectories();

    // Load configuration
    if (configFile) {
      this.configFilePath = configFile;
      this.loadFromFile(configFile);
    } else {
      this.loadDefaultConfig();
    }
  }

  private createDirectories(): void {
    const dirs = [
      this.rulesDir, this.dataDir, this.logsDir, this.pluginsDir,
      this.reportsDir, this.backupDir, this.tempDir
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private loadDefaultConfig(): void {
    this.configData = {
      general: {
        debug: true,
        logLevel: 'INFO',
        maxLogSize: 10485760, // 10 MB
        backupCount: 5,
        timezone: 'Europe/Paris'
      },
      analysis: {
        enabled: true,
        mlEnabled: true,
        sensitivity: 0.1,
        timeWindow: 300,
        minDataPoints: 10,
        maxDataPoints: 10000,
        updateInterval: 60,
        batchSize: 100,
        confidenceThreshold: 0.8
      },
      thresholds: {
        normal: 50,
        warning: 100,
        critical: 200,
        emergency: 500,
        baseline: 30,
        spikeThreshold: 2.0,
        trendThreshold: 0.1
      },
      mlModel: {
        type: 'isolation_forest',
        contamination: 0.1,
        nEstimators: 100,
        maxSamples: 'auto',
        randomState: 42,
        nJobs: -1,
        maxFeatures: 1.0,
        bootstrap: false,
        warmStart: false,
        verbose: 0
      },
      patterns: {
        detectSpikes: true,
        detectTrends: true,
        detectCycles: true,
        spikeWindow: 10,
        trendWindow: 30,
        cycleWindow: 1440,
        minSpikeHeight: 1.5,
        minTrendSlope: 0.05
      },
      alerts: {
        enabled: true,
        emailEnabled: false,
        smsEnabled: false,
        webhookEnabled: false,
        notificationInterval: 300,
        escalationTime: 1800,
        maxAlertsPerHour: 10,
        alertCooldown: 600
      },
      notifications: {
        email: {
          smtpServer: 'smtp.gmail.com',
          smtpPort: 587,
          useTls: true,
          username: '',
          password: '',
          fromAddress: '',
          toAddresses: [],
          subjectPrefix: '[TRAFFIC ALERT]'
        },
        webhook: {
          url: '',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': ''
          },
          timeout: 30
        },
        slack: {
          webhookUrl: '',
          channel: '#alerts',
          username: 'Traffic Monitor',
          iconEmoji: ':warning:'
        }
      },
      database: {
        type: 'sqlite',
        path: 'traffic_data.db',
        host: 'localhost',
        port: 5432,
        name: 'traffic_analysis',
        username: '',
        password: '',
        poolSize: 10,
        maxOverflow: 20,
        echo: false
      },
      storage: {
        dataRetentionDays: 30,
        backupEnabled: true,
        backupInterval: 86400,
        compressionEnabled: true,
        archiveEnabled: true,
        archiveAfterDays: 7
      },
      security: {
        encryptionEnabled: true,
        encryptionKey: '',
        hashAlgorithm: 'sha256',
        sessionTimeout: 3600,
        maxLoginAttempts: 3,
        lockoutDuration: 1800,
        requireSsl: true,
        allowedIps: [],
        blockedIps: []
      },
      performance: {
        maxThreads: 4,
        queueSize: 1000,
        timeout: 30,
        retryAttempts: 3,
        retryDelay: 5,
        cacheEnabled: true,
        cacheSize: 1000,
        cacheTtl: 300
      },
      reports: {
        enabled: true,
        autoGenerate: true,
        schedule: '0 0 * * *',
        format: 'pdf',
        includeCharts: true,
        includeAnomalies: true,
        includeStatistics: true,
        emailReports: false
      },
      plugins: {
        enabled: true,
        pluginDir: 'plugins',
        autoLoad: true,
        reloadOnChange: true,
        pluginTimeout: 30
      },
      monitoring: {
        healthCheckInterval: 60,
        metricsEnabled: true,
        metricsPort: 8080,
        prometheusEnabled: false,
        grafanaEnabled: false,
        dashboardUrl: ''
      },
      paths: {
        baseDir: this.baseDir,
        rulesDir: this.rulesDir,
        dataDir: this.dataDir,
        logsDir: this.logsDir,
        pluginsDir: this.pluginsDir,
        reportsDir: this.reportsDir,
        backupDir: this.backupDir,
        tempDir: this.tempDir
      }
    };
  }

  public loadFromFile(filename: string): boolean {
    try {
      if (!fs.existsSync(filename)) {
        console.log(`Error: Config file not found: ${filename}`);
        return false;
      }

      const jsonContent = fs.readFileSync(filename, 'utf8');
      this.configData = JSON.parse(jsonContent);

      console.log(`Configuration loaded from: ${filename}`);
      return true;
    } catch (error) {
      console.log(`Error loading configuration: ${error}`);
      return false;
    }
  }

  public saveToFile(filename: string = ''): boolean {
    try {
      const filePath = filename || path.join(this.baseDir, 'config.json');
      const jsonString = JSON.stringify(this.configData, null, 2);

      fs.writeFileSync(filePath, jsonString);
      console.log(`Configuration saved to: ${filePath}`);
      return true;
    } catch (error) {
      console.log(`Error saving configuration: ${error}`);
      return false;
    }
  }

  public getConfig(env: string = ''): FullConfig {
    const targetEnv = env || this.environment;

    // Apply environment-specific overrides
    const envConfig = { ...this.configData };

    if (targetEnv === 'development') {
      envConfig.general.debug = true;
      envConfig.general.logLevel = 'DEBUG';
      envConfig.database.type = 'sqlite';
      envConfig.notifications.email.enabled = false;
    } else if (targetEnv === 'testing') {
      envConfig.general.debug = true;
      envConfig.general.logLevel = 'INFO';
      envConfig.analysis.mlEnabled = false;
      envConfig.notifications.email.enabled = false;
    } else if (targetEnv === 'production') {
      envConfig.general.debug = false;
      envConfig.general.logLevel = 'WARNING';
      envConfig.security.encryptionEnabled = true;
      envConfig.notifications.email.enabled = true;
    }

    return envConfig;
  }

  public validateConfig(): string[] {
    const errors: string[] = [];

    // Check required paths
    const requiredPaths = ['rulesDir', 'dataDir', 'logsDir'];

    requiredPaths.forEach(pathName => {
      const pathValue = this.configData.paths[pathName as keyof PathsConfig];
      if (!fs.existsSync(pathValue)) {
        errors.push(`Required path missing: ${pathName}`);
      }
    });

    // Check thresholds
    const warning = this.configData.thresholds.warning;
    const normal = this.configData.thresholds.normal;
    if (warning <= normal) {
      errors.push('Warning threshold must be greater than normal threshold');
    }

    const critical = this.configData.thresholds.critical;
    if (critical <= warning) {
      errors.push('Critical threshold must be greater than warning threshold');
    }

    // Check ML model parameters
    const contamination = this.configData.mlModel.contamination;
    if (contamination <= 0.0 || contamination >= 1.0) {
      errors.push('Contamination must be between 0 and 1');
    }

    return errors;
  }

  public setValue(section: keyof FullConfig, key: string, value: any): void {
    const sectionData = this.configData[section] as any;
    if (sectionData && typeof sectionData === 'object') {
      sectionData[key] = value;
    }
  }

  public setEnvironment(env: string): void {
    this.environment = env;
  }

  public getValue(section: keyof FullConfig, key: string): any {
    const sectionData = this.configData[section] as any;
    return sectionData?.[key];
  }

  public getPath(pathName: keyof PathsConfig): string {
    return this.configData.paths[pathName];
  }

  public getBool(section: keyof FullConfig, key: string): boolean {
    return this.getValue(section, key) || false;
  }

  public getInt(section: keyof FullConfig, key: string): number {
    return this.getValue(section, key) || 0;
  }

  public getDouble(section: keyof FullConfig, key: string): number {
    return this.getValue(section, key) || 0.0;
  }

  public getString(section: keyof FullConfig, key: string): string {
    return this.getValue(section, key) || '';
  }

  public getTimestamp(): string {
    return new Date().toISOString();
  }

  public validateIpAddress(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  public validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  public validateUrl(url: string): boolean {
    const urlRegex = /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/;
    return urlRegex.test(url);
  }

  public getDevelopmentConfig(): FullConfig {
    return this.getConfig('development');
  }

  public getTestingConfig(): FullConfig {
    return this.getConfig('testing');
  }

  public getProductionConfig(): FullConfig {
    return this.getConfig('production');
  }

  public reload(): boolean {
    if (this.configFilePath) {
      return this.loadFromFile(this.configFilePath);
    }
    return false;
  }

  public exportToJson(): string {
    return JSON.stringify(this.configData, null, 2);
  }

  public exportToYaml(): string {
    return this.convertToYaml(this.configData, 0);
  }

  private convertToYaml(obj: any, indent: number): string {
    const indentStr = ' '.repeat(indent * 2);
    let yaml = '';

    if (Array.isArray(obj)) {
      obj.forEach(item => {
        yaml += `${indentStr}- `;
        if (typeof item === 'object' && item !== null) {
          yaml += '\n' + this.convertToYaml(item, indent + 1);
        } else {
          yaml += `${item}\n`;
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        yaml += `${indentStr}${key}: `;
        if (typeof value === 'object' && value !== null) {
          yaml += '\n' + this.convertToYaml(value, indent + 1);
        } else {
          yaml += `${value}\n`;
        }
      });
    }

    return yaml;
  }

  // Getter for full config
  public get fullConfig(): FullConfig {
    return this.configData;
  }
}

// Main program for testing
export async function main(): Promise<void> {
  const config = new Config();

  // Validate configuration
  const errors = config.validateConfig();
  if (errors.length > 0) {
    console.log('Configuration errors found:');
    errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  } else {
    console.log('Configuration is valid');
  }

  // Test some getters
  console.log(`Analysis enabled: ${config.getBool('analysis', 'enabled')}`);
  console.log(`Sensitivity: ${config.getDouble('analysis', 'sensitivity')}`);
  console.log(`Rules directory: ${config.getPath('rulesDir')}`);

  // Save configuration
  config.saveToFile();

  // Test environment-specific configs
  console.log('\nDevelopment config debug:', config.getDevelopmentConfig().general.debug);
  console.log('Production config debug:', config.getProductionConfig().general.debug);
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 