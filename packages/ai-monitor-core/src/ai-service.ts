import type {
  IAIService,
  IAIConfig,
  IAIAnalysis,
  ILogEntry,
  IMetricData
} from './ai-types';

/**
 * AI-powered monitoring service
 * Uses LLMs to analyze logs, detect anomalies, and provide intelligent insights
 */
export class AIService implements IAIService {
  private config: Required<IAIConfig>;
  private axios: any;
  private enabled: boolean = false;

  constructor(config: IAIConfig = {}) {
    this.config = {
      apiKey: config.apiKey ?? process.env.AI_API_KEY ?? '',
      apiUrl: config.apiUrl ?? process.env.AI_API_URL ?? 'https://api.openai.com/v1',
      model: config.model ?? process.env.AI_MODEL ?? 'gpt-4o-mini',
      enabled: config.enabled ?? true,
      features: {
        anomalyDetection: config.features?.anomalyDetection ?? true,
        rootCauseAnalysis: config.features?.rootCauseAnalysis ?? true,
        autoHealing: config.features?.autoHealing ?? true,
        patternRecognition: config.features?.patternRecognition ?? true,
        ...config.features
      }
    };

    if (!this.config.apiKey) {
      console.warn('AI Service: No API key provided. AI analysis will be disabled.');
      this.config.enabled = false;
    }

    if (this.config.enabled) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.axios = require('axios');
        this.enabled = true;
      } catch (error) {
        console.error('AI Service: Failed to load axios. Install with: npm install axios');
        this.enabled = false;
      }
    }
  }

  async analyzeLog(log: ILogEntry): Promise<IAIAnalysis> {
    if (!this.enabled) {
      return this.getFallbackAnalysis(log.message);
    }

    const prompt = this.buildLogAnalysisPrompt(log);
    return await this.analyze(prompt);
  }

  async analyzeLogs(logs: ILogEntry[]): Promise<IAIAnalysis> {
    if (!this.enabled) {
      return this.getFallbackAnalysis('Multiple logs');
    }

    const prompt = this.buildLogsAnalysisPrompt(logs);
    return await this.analyze(prompt);
  }

  async analyzeMetrics(metrics: IMetricData[]): Promise<IAIAnalysis> {
    if (!this.enabled) {
      return this.getFallbackAnalysis('Metrics analysis');
    }

    const prompt = this.buildMetricsAnalysisPrompt(metrics);
    return await this.analyze(prompt);
  }

  async analyzeError(error: Error, context?: Record<string, any>): Promise<IAIAnalysis> {
    if (!this.enabled) {
      return this.getFallbackAnalysis(error.message);
    }

    const prompt = this.buildErrorAnalysisPrompt(error, context);
    return await this.analyze(prompt);
  }

  async detectAnomalies(data: any[]): Promise<IAIAnalysis> {
    if (!this.enabled || !this.config.features.anomalyDetection) {
      return this.getFallbackAnalysis('Anomaly detection');
    }

    const prompt = this.buildAnomalyDetectionPrompt(data);
    return await this.analyze(prompt);
  }

  async suggestAutoHeal(issue: string, context?: Record<string, any>): Promise<IAIAnalysis> {
    if (!this.enabled || !this.config.features.autoHealing) {
      return this.getFallbackAnalysis(issue);
    }

    const prompt = this.buildAutoHealPrompt(issue, context);
    return await this.analyze(prompt);
  }

  /**
   * Core AI analysis method
   */
  private async analyze(prompt: string): Promise<IAIAnalysis> {
    try {
      const response = await this.axios.post(
        `${this.config.apiUrl}/chat/completions`,
        {
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      return this.parseAIResponse(result);
    } catch (error) {
      console.error('AI Service: Analysis failed:', error);
      return this.getFallbackAnalysis('AI analysis unavailable');
    }
  }

  /**
   * Build prompts for different analysis types
   */
  private buildLogAnalysisPrompt(log: ILogEntry): string {
    return `Analyze this log entry and provide insights:

Timestamp: ${log.timestamp.toISOString()}
Level: ${log.level}
Message: ${log.message}
Context: ${log.context || 'N/A'}
${log.stack ? `Stack Trace:\n${log.stack}` : ''}
${log.metadata ? `Metadata: ${JSON.stringify(log.metadata)}` : ''}

Provide:
1. Severity assessment (LOW/MEDIUM/HIGH/CRITICAL)
2. Root cause analysis
3. Suggested fixes
4. Whether this is anomalous
5. Confidence score (0-1)`;
  }

  private buildLogsAnalysisPrompt(logs: ILogEntry[]): string {
    const logSummary = logs.slice(0, 20).map(l => 
      `[${l.timestamp.toISOString()}] ${l.level}: ${l.message}`
    ).join('\n');

    return `Analyze these log entries for patterns, anomalies, and issues:

Total Logs: ${logs.length}
Recent Logs:
${logSummary}

Identify:
1. Recurring patterns
2. Anomalies or unusual behavior
3. Critical issues
4. Root causes
5. Suggested fixes`;
  }

  private buildMetricsAnalysisPrompt(metrics: IMetricData[]): string {
    const metricSummary = metrics.map(m =>
      `${m.name}: ${m.value}${m.unit || ''} at ${m.timestamp.toISOString()}`
    ).join('\n');

    return `Analyze these metrics for anomalies:

${metricSummary}

Detect:
1. Unusual spikes or drops
2. Trending issues
3. Performance degradation
4. Capacity problems
5. Suggested optimizations`;
  }

  private buildErrorAnalysisPrompt(error: Error, context?: Record<string, any>): string {
    return `Analyze this error and provide actionable insights:

Error: ${error.message}
Stack: ${error.stack || 'N/A'}
${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Provide:
1. Root cause analysis
2. Impact assessment (severity)
3. Step-by-step fix suggestions
4. Prevention strategies
5. Auto-healing command (if applicable)`;
  }

  private buildAnomalyDetectionPrompt(data: any[]): string {
    return `Analyze this data for anomalies:

Data: ${JSON.stringify(data.slice(0, 50), null, 2)}

Detect:
1. Outliers and anomalies
2. Unusual patterns
3. Potential issues
4. Severity of anomalies
5. Recommended actions`;
  }

  private buildAutoHealPrompt(issue: string, context?: Record<string, any>): string {
    return `Suggest auto-healing solutions for this issue:

Issue: ${issue}
${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Provide:
1. Automated fix command/script
2. Safety considerations
3. Rollback plan
4. Success verification steps`;
  }

  /**
   * System prompt for AI
   */
  private getSystemPrompt(): string {
    return `You are an expert DevOps AI assistant specializing in system monitoring, log analysis, and automated problem resolution.

Your role:
- Analyze logs, metrics, and errors
- Detect anomalies and patterns
- Provide root cause analysis
- Suggest actionable fixes
- Recommend auto-healing solutions

Always respond in JSON format with these fields:
{
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "Brief summary of the issue",
  "rootCause": "Root cause analysis",
  "suggestions": ["fix1", "fix2", ...],
  "isAnomaly": true|false,
  "confidence": 0.0-1.0,
  "relatedPatterns": ["pattern1", ...],
  "autoHealCommand": "command if applicable"
}

Be concise, actionable, and practical.`;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(result: any): IAIAnalysis {
    return {
      severity: result.severity || 'MEDIUM',
      summary: result.summary || 'No summary available',
      rootCause: result.rootCause,
      suggestions: result.suggestions || [],
      isAnomaly: result.isAnomaly || false,
      confidence: result.confidence || 0.5,
      relatedPatterns: result.relatedPatterns || [],
      autoHealCommand: result.autoHealCommand
    };
  }

  /**
   * Fallback analysis when AI is disabled
   */
  private getFallbackAnalysis(message: string): IAIAnalysis {
    return {
      severity: 'MEDIUM',
      summary: message,
      rootCause: 'AI analysis not available',
      suggestions: ['Enable AI analysis by providing an API key'],
      isAnomaly: false,
      confidence: 0,
      relatedPatterns: [],
      autoHealCommand: undefined
    };
  }
}
