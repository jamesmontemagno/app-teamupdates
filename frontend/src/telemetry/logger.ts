// Structured logging utility for OpenTelemetry
// Provides convenient methods to emit structured logs to Aspire dashboard

import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const logger = logs.getLogger('app-logger', '1.0.0');

export interface LogAttributes {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Emit a debug log
 */
export function logDebug(message: string, attributes?: LogAttributes): void {
  logger.emit({
    severityNumber: SeverityNumber.DEBUG,
    severityText: 'DEBUG',
    body: message,
    attributes,
  });
}

/**
 * Emit an info log
 */
export function logInfo(message: string, attributes?: LogAttributes): void {
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: message,
    attributes,
  });
}

/**
 * Emit a warning log
 */
export function logWarn(message: string, attributes?: LogAttributes): void {
  logger.emit({
    severityNumber: SeverityNumber.WARN,
    severityText: 'WARN',
    body: message,
    attributes,
  });
  // Also log to console for visibility during development
  console.warn(`[${attributes?.['component'] || 'app'}]`, message, attributes);
}

/**
 * Emit an error log
 */
export function logError(message: string, error?: Error, attributes?: LogAttributes): void {
  const errorAttributes = {
    ...attributes,
    'error.type': error?.name,
    'error.message': error?.message,
    'error.stack': error?.stack,
  };
  
  logger.emit({
    severityNumber: SeverityNumber.ERROR,
    severityText: 'ERROR',
    body: message,
    attributes: errorAttributes,
  });
  
  // Also log to console for visibility during development
  console.error(`[${attributes?.['component'] || 'app'}]`, message, error, attributes);
}

/**
 * Emit a fatal log
 */
export function logFatal(message: string, error?: Error, attributes?: LogAttributes): void {
  const errorAttributes = {
    ...attributes,
    'error.type': error?.name,
    'error.message': error?.message,
    'error.stack': error?.stack,
  };
  
  logger.emit({
    severityNumber: SeverityNumber.FATAL,
    severityText: 'FATAL',
    body: message,
    attributes: errorAttributes,
  });
  
  // Always log fatal errors to console
  console.error(`[FATAL][${attributes?.['component'] || 'app'}]`, message, error, attributes);
}
