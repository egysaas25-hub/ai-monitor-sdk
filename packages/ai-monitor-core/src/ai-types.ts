/**
 * AI Analysis types
 */

export interface IAIConfig {
  /**
   * AI provider API key (OpenAI, Anthropic, etc.)
   */
  apiKey?: string;

  /**
   * AI API endpoint
   */
  apiUrl?: string;

  /**
   * AI model to use
   */
  model?: string;

  /**
   * Enable AI analysis
   */
  enabled?: boolean;

  /**
   * AI analysis features
   */
  features?: {
    anomalyDetection?: boolean;
    rootCauseAnalysis?: boolean;
    autoHealing?: boolean;
    patternRecognition?: boolean;
  };
}

/**
 * AI Analysis result
 */
export interface IAIAnalysis {
  /**
   * Detected severity level
   */
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  /**
   * AI-generated summary
   */
  summary: string;

  /**
   * Root cause analysis
   */
  rootCause?: string;

  /**
   * Suggested fixes
   */
  suggestions?: string[];

  /**
   * Is this an anomaly?
   */
  isAnomaly?: boolean;

  /**
   * Confidence score (0-1)
   */
  confidence?: number;

  /**
   * Related patterns found
   */
  relatedPatterns?: string[];

  /**
   * Auto-healing command (if applicable)
   */
  autoHealCommand?: string;
}

/**
 * Log entry for AI analysis
 */
export interface ILogEntry {
  timestamp: Date;
  level: string;
  message: string;
  context?: string;
  stack?: string;
  metadata?: Record<string, any>;
}

/**
 * Metric data for AI analysis
 */
export interface IMetricData {
  name: string;
  value: number;
  timestamp: Date;
  unit?: string;
  tags?: Record<string, string>;
}

/**
 * AI Service interface
 */
export interface IAIService {
  /**
   * Analyze a log entry
   */
  analyzeLog(log: ILogEntry): Promise<IAIAnalysis>;

  /**
   * Analyze multiple logs for patterns
   */
  analyzeLogs(logs: ILogEntry[]): Promise<IAIAnalysis>;

  /**
   * Analyze metrics for anomalies
   */
  analyzeMetrics(metrics: IMetricData[]): Promise<IAIAnalysis>;

  /**
   * Analyze an error and suggest fixes
   */
  analyzeError(error: Error, context?: Record<string, any>): Promise<IAIAnalysis>;

  /**
   * Detect anomalies in data
   */
  detectAnomalies(data: any[]): Promise<IAIAnalysis>;

  /**
   * Get auto-healing suggestion
   */
  suggestAutoHeal(issue: string, context?: Record<string, any>): Promise<IAIAnalysis>;
}
