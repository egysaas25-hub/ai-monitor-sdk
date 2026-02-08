import type { IMonitorConfig } from './types';

/**
 * Configuration Validator
 *
 * Validates IMonitorConfig at construction time so users get
 * clear, actionable error messages instead of cryptic runtime crashes.
 */

export interface IValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateConfig(config: IMonitorConfig): IValidationResult {
  const errors: string[] = [];

  // Port validation
  if (config.port !== undefined) {
    if (typeof config.port !== 'number' || !Number.isFinite(config.port)) {
      errors.push(`port must be a finite number, got ${typeof config.port}`);
    } else if (config.port < 1 || config.port > 65535) {
      errors.push(`port must be between 1 and 65535, got ${config.port}`);
    }
  }

  // Host validation
  if (config.host !== undefined && typeof config.host !== 'string') {
    errors.push(`host must be a string, got ${typeof config.host}`);
  }

  // Enabled validation
  if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
    errors.push(`enabled must be a boolean, got ${typeof config.enabled}`);
  }

  // Notifiers — duck-type check
  if (config.notifiers !== undefined) {
    const notifiers = Array.isArray(config.notifiers) ? config.notifiers : [config.notifiers];
    notifiers.forEach((n, i) => {
      if (!n || typeof n.sendAlert !== 'function') {
        errors.push(`notifiers[${i}] must implement INotifier (missing sendAlert method)`);
      }
    });
  }

  // AI config — apiKey required when enabled
  if (config.aiConfig?.enabled && !config.aiConfig.apiKey) {
    errors.push('aiConfig.apiKey is required when aiConfig.enabled is true');
  }

  // Deduplication
  if (config.deduplication) {
    if (config.deduplication.cooldownMs !== undefined) {
      if (typeof config.deduplication.cooldownMs !== 'number' || config.deduplication.cooldownMs <= 0) {
        errors.push('deduplication.cooldownMs must be a positive number');
      }
    }
  }

  // Plugins — name check
  if (config.plugins) {
    if (!Array.isArray(config.plugins)) {
      errors.push('plugins must be an array');
    } else {
      config.plugins.forEach((p, i) => {
        if (!p || typeof p.name !== 'string' || p.name.length === 0) {
          errors.push(`plugins[${i}] must have a non-empty name`);
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
