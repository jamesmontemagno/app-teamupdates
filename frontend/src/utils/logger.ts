// Frontend logging utility for debugging
// Logs are visible in browser console and can be sent to observability platforms

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.isDevelopment && level === 'debug') {
      return; // Skip debug logs in production
    }

    const timestamp = new Date().toISOString();

    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(`[${timestamp}] DEBUG:`, message, context || '');
        break;
      case 'info':
        console.info(`[${timestamp}] INFO:`, message, context || '');
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN:`, message, context || '');
        break;
      case 'error':
        console.error(`[${timestamp}] ERROR:`, message, context || '');
        break;
    }

    // In production, you could send to observability platform
    // if (!this.isDevelopment) {
    //   sendToObservability(logEntry);
    // }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    this.log('error', message, errorContext);
  }

  // API-specific logging helpers
  apiRequest(method: string, url: string, context?: LogContext) {
    this.debug(`API Request: ${method} ${url}`, context);
  }

  apiResponse(method: string, url: string, status: number, context?: LogContext) {
    this.debug(`API Response: ${method} ${url} - ${status}`, context);
  }

  apiError(method: string, url: string, error: Error | unknown, context?: LogContext) {
    this.error(`API Error: ${method} ${url}`, error, context);
  }

  // SignalR-specific logging
  signalR(event: string, context?: LogContext) {
    this.debug(`SignalR: ${event}`, context);
  }

  // User action logging
  userAction(action: string, context?: LogContext) {
    this.info(`User Action: ${action}`, context);
  }
}

export const logger = new Logger();
