import * as fs from 'fs';
import * as path from 'path';

// Configuration interfaces
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

// Traffic data interface
interface TrafficData {
  timestamp: Date;
  value: number;
  sourceIp: string;
  destinationIp: string;
  protocol: string;
  port: number;
  bytesSent: number;
  bytesReceived: number;
  packetsSent: number;
  packetsReceived: number;
}

// Features interface
interface Features {
  mean: number;
  std: number;
  max: number;
  min: number;
  median: number;
  q25: number;
  q75: number;
  rateOfChange: number;
}

// Pattern interface
interface Pattern {
  type: string;
  count: number;
  maxValue: number;
  timestamps: Date[];
  slope: number;
}

// Threat level enum
enum ThreatLevel {
  NORMAL = 'NORMAL',
  NOTICE = 'NOTICE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY'
}

// ML model interface
interface MLModel {
  contaminationScores: number[];
  sensitivity: number;
  trained: boolean;
}

// Traffic Analyzer class
export class TrafficAnalyzer {
  private analysisConfig: AnalysisConfig;
  private thresholdsConfig: ThresholdsConfig;
  private mlModelConfig: MLModelConfig;
  private trafficHistory: TrafficData[] = [];
  private modelData: number[] = [];
  private scalerData: number[] = [];
  private mlModel: MLModel;
  private logWriter: fs.WriteStream | null = null;
  private rulesDir: string;
  private modelLoaded: boolean = false;

  constructor() {
    this.analysisConfig = {
      enabled: true,
      mlEnabled: true,
      sensitivity: 0.1,
      timeWindow: 300,
      minDataPoints: 10,
      maxDataPoints: 10000,
      updateInterval: 60,
      batchSize: 100,
      confidenceThreshold: 0.8
    };

    this.thresholdsConfig = {
      normal: 50,
      warning: 100,
      critical: 200,
      emergency: 500,
      baseline: 30,
      spikeThreshold: 2.0,
      trendThreshold: 0.1
    };

    this.mlModelConfig = {
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
    };

    this.mlModel = {
      contaminationScores: new Array(1000).fill(0),
      sensitivity: this.analysisConfig.sensitivity,
      trained: false
    };

    this.initialize();
  }

  private initialize(): void {
    // Create rules directory
    this.rulesDir = 'rules';
    if (!fs.existsSync(this.rulesDir)) {
      fs.mkdirSync(this.rulesDir, { recursive: true });
    }

    // Initialize logging
    const logPath = path.join(this.rulesDir, 'traffic_analyzer.log');
    this.logWriter = fs.createWriteStream(logPath, { flags: 'a' });

    // Load or create ML model
    this.loadModel();

    // Initialize ML model
    this.mlModel.sensitivity = this.analysisConfig.sensitivity;

    this.log('TrafficAnalyzer initialized successfully');
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    if (this.logWriter) {
      this.logWriter.write(logMessage);
    }

    console.log(logMessage.trim());
  }

  private loadModel(): void {
    const modelPath = path.join(this.rulesDir, 'traffic_model.bin');

    if (fs.existsSync(modelPath)) {
      try {
        const modelBytes = fs.readFileSync(modelPath);
        this.modelData = [];

        // Read model data (simplified binary format)
        for (let i = 0; i < modelBytes.length; i += 8) {
          if (i + 8 <= modelBytes.length) {
            const value = modelBytes.readDoubleLE(i);
            this.modelData.push(value);
          }
        }

        this.modelLoaded = true;
        this.log('ML model loaded successfully');
      } catch (error) {
        this.log(`Error loading ML model: ${error}`);
        this.createNewModel();
      }
    } else {
      this.createNewModel();
    }
  }

  private createNewModel(): void {
    this.modelData = [];
    for (let i = 0; i < 1000; i++) {
      this.modelData.push(Math.random());
    }

    this.modelLoaded = true;
    this.log('New ML model created');
  }

  private saveModel(): void {
    try {
      const modelPath = path.join(this.rulesDir, 'traffic_model.bin');
      const buffer = Buffer.alloc(this.modelData.length * 8);

      for (let i = 0; i < this.modelData.length; i++) {
        buffer.writeDoubleLE(this.modelData[i], i * 8);
      }

      fs.writeFileSync(modelPath, buffer);
      this.log('ML model saved successfully');
    } catch (error) {
      this.log(`Error saving ML model: ${error}`);
    }
  }

  public extractFeatures(trafficData: number[]): Features {
    const features: Features = {
      mean: 0,
      std: 0,
      max: 0,
      min: 0,
      median: 0,
      q25: 0,
      q75: 0,
      rateOfChange: 0
    };

    if (trafficData.length === 0) {
      return features;
    }

    // Calculate basic statistics
    const sum = trafficData.reduce((acc, val) => acc + val, 0);
    features.mean = sum / trafficData.length;
    features.min = Math.min(...trafficData);
    features.max = Math.max(...trafficData);

    // Calculate standard deviation
    const sumSq = trafficData.reduce((acc, val) => acc + val * val, 0);
    const variance = (sumSq / trafficData.length) - (features.mean * features.mean);
    features.std = Math.sqrt(Math.max(0, variance));

    // Calculate percentiles
    const sortedData = [...trafficData].sort((a, b) => a - b);
    features.median = sortedData[Math.floor(sortedData.length / 2)];
    features.q25 = sortedData[Math.floor(sortedData.length / 4)];
    features.q75 = sortedData[Math.floor(3 * sortedData.length / 4)];

    // Calculate rate of change
    if (trafficData.length > 1) {
      let totalChange = 0;
      for (let i = 1; i < trafficData.length; i++) {
        totalChange += trafficData[i] - trafficData[i - 1];
      }
      features.rateOfChange = totalChange / (trafficData.length - 1);
    }

    return features;
  }

  public analyzeTraffic(currentTraffic: number): { isAnomaly: boolean; score: number } {
    // Add current traffic to history
    const data: TrafficData = {
      timestamp: new Date(),
      value: currentTraffic,
      sourceIp: '',
      destinationIp: '',
      protocol: '',
      port: 0,
      bytesSent: 0,
      bytesReceived: 0,
      packetsSent: 0,
      packetsReceived: 0
    };

    this.trafficHistory.push(data);

    // Clean old data
    const cutoffTime = new Date(Date.now() - this.analysisConfig.timeWindow * 1000);
    this.trafficHistory = this.trafficHistory.filter(entry => entry.timestamp > cutoffTime);

    // Extract traffic values
    const trafficValues = this.trafficHistory.map(entry => entry.value);

    // Extract features
    const features = this.extractFeatures(trafficValues);

    // Predict anomaly
    if (this.analysisConfig.mlEnabled) {
      return this.predictAnomalyML(features);
    } else {
      return this.predictAnomalyBasic(features);
    }
  }

  private predictAnomalyML(features: Features): { isAnomaly: boolean; score: number } {
    // Simulate ML prediction
    const score = this.calculateAnomalyScore(features);
    const isAnomaly = score < -this.analysisConfig.sensitivity;

    return { isAnomaly, score: Math.abs(score) };
  }

  private predictAnomalyBasic(features: Features): { isAnomaly: boolean; score: number } {
    const isAnomaly = features.mean > this.thresholdsConfig.warning ||
                     features.max > this.thresholdsConfig.critical;

    const score = features.mean / this.thresholdsConfig.warning;

    return { isAnomaly, score };
  }

  private calculateAnomalyScore(features: Features): number {
    // Simulate isolation forest scoring
    let score = 0.0;

    // Combine features with weights
    score += features.mean * 0.3;
    score += features.std * 0.2;
    score += features.max * 0.2;
    score += features.rateOfChange * 0.3;

    // Normalize score
    score = (score - 50.0) / 25.0; // Assuming normal range

    return -score; // Negative for anomalies
  }

  public detectPatterns(trafficHistory: TrafficData[]): Pattern[] {
    const patterns: Pattern[] = [];

    if (trafficHistory.length < 10) {
      return patterns;
    }

    // Extract values
    const values = trafficHistory.map(entry => entry.value);
    const timestamps = trafficHistory.map(entry => entry.timestamp);

    // Detect spikes
    this.detectSpikes(values, timestamps, patterns);

    // Detect trends
    this.detectTrends(values, timestamps, patterns);

    return patterns;
  }

  private detectSpikes(values: number[], timestamps: Date[], patterns: Pattern[]): void {
    if (values.length < 5) return;

    // Calculate rolling mean and std
    const rollingMean: number[] = [];
    const rollingStd: number[] = [];
    const window = 5;

    for (let i = window; i < values.length; i++) {
      const windowValues = values.slice(i - window, i);
      const mean = windowValues.reduce((acc, val) => acc + val, 0) / window;
      const variance = windowValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / window;
      const std = Math.sqrt(Math.max(0, variance));

      rollingMean.push(mean);
      rollingStd.push(std);
    }

    // Detect anomalies
    for (let i = 0; i < rollingMean.length; i++) {
      const diff = Math.abs(values[i + window] - rollingMean[i]);
      if (diff > 2 * rollingStd[i]) {
        const pattern: Pattern = {
          type: 'spike',
          count: 1,
          maxValue: values[i + window],
          timestamps: [timestamps[i + window]],
          slope: 0
        };
        patterns.push(pattern);
      }
    }
  }

  private detectTrends(values: number[], timestamps: Date[], patterns: Pattern[]): void {
    if (values.length < 30) return;

    // Calculate trend using linear regression
    let sumX = 0.0, sumY = 0.0, sumXY = 0.0, sumX2 = 0.0;
    const n = values.length;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (Math.abs(slope) > this.thresholdsConfig.trendThreshold) {
      const pattern: Pattern = {
        type: 'trend',
        count: 0,
        maxValue: 0,
        timestamps: [],
        slope
      };
      patterns.push(pattern);
    }
  }

  public saveAnalysis(analysisData: any): string {
    try {
      const filename = `analysis_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(this.rulesDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(analysisData, null, 2));

      this.log(`Analysis saved to ${filepath}`);
      return filepath;
    } catch (error) {
      this.log(`Error saving analysis: ${error}`);
      return '';
    }
  }

  public getThreatLevel(anomalyScore: number): ThreatLevel {
    if (anomalyScore > 0.8) return ThreatLevel.CRITICAL;
    if (anomalyScore > 0.6) return ThreatLevel.WARNING;
    if (anomalyScore > 0.4) return ThreatLevel.NOTICE;
    return ThreatLevel.NORMAL;
  }

  public updateModel(newData: TrafficData[]): boolean {
    if (newData.length < 100) {
      return false;
    }

    try {
      const values = newData.map(entry => entry.value);

      // Update model data (simplified)
      for (let i = 0; i < Math.min(values.length, this.modelData.length); i++) {
        this.modelData[i] = (this.modelData[i] + values[i]) / 2.0;
      }

      this.saveModel();
      this.log('ML model updated successfully');
      return true;
    } catch (error) {
      this.log(`Error updating model: ${error}`);
      return false;
    }
  }

  // Configuration methods
  public setSensitivity(sensitivity: number): void {
    this.analysisConfig.sensitivity = sensitivity;
    this.mlModel.sensitivity = sensitivity;
  }

  public getSensitivity(): number {
    return this.analysisConfig.sensitivity;
  }

  public setMlEnabled(enabled: boolean): void {
    this.analysisConfig.mlEnabled = enabled;
  }

  public isMlEnabled(): boolean {
    return this.analysisConfig.mlEnabled;
  }

  // Statistics methods
  public getHistorySize(): number {
    return this.trafficHistory.length;
  }

  public getRecentTraffic(count: number = 100): TrafficData[] {
    const start = Math.max(0, this.trafficHistory.length - count);
    return this.trafficHistory.slice(start);
  }

  public dispose(): void {
    if (this.logWriter) {
      this.logWriter.end();
    }
  }
}

// Main function for testing
export async function main(): Promise<void> {
  const analyzer = new TrafficAnalyzer();

  // Simulate traffic data
  for (let i = 0; i < 100; i++) {
    let trafficValue: number;

    // Simulate occasional anomalies
    if (i % 20 === 0) {
      trafficValue = Math.random() * 100 + 100; // 100-200
    } else {
      trafficValue = Math.random() * 20 + 40; // 40-60
    }

    const { isAnomaly, score } = analyzer.analyzeTraffic(trafficValue);

    if (isAnomaly) {
      console.log(`ANOMALY DETECTED! Score: ${score}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  analyzer.dispose();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 