// Pre-defined business metrics for the application
// Provides counters, histograms, and gauges for key operations

import { metrics, ValueType } from '@opentelemetry/api';
import { isTelemetryEnabled } from './config';

const METER_NAME = 'frontend';

/**
 * Get the global meter instance
 */
function getMeter() {
  return metrics.getMeter(METER_NAME);
}

// Counters
const updatesCreatedCounter = getMeter().createCounter('updates.created', {
  description: 'Number of updates created',
  valueType: ValueType.INT,
});

const apiRequestsCounter = getMeter().createCounter('api.requests', {
  description: 'Number of API requests made',
  valueType: ValueType.INT,
});

const signalrMessagesCounter = getMeter().createCounter('signalr.messages', {
  description: 'Number of SignalR messages received',
  valueType: ValueType.INT,
});

// Histograms
const apiLatencyHistogram = getMeter().createHistogram('api.latency', {
  description: 'API request latency in milliseconds',
  unit: 'ms',
  valueType: ValueType.DOUBLE,
});

const updateCreationLatency = getMeter().createHistogram('update.creation.latency', {
  description: 'Time to create an update in milliseconds',
  unit: 'ms',
  valueType: ValueType.DOUBLE,
});

// Observable Gauge for SignalR connection state
const signalrConnectionState = getMeter().createObservableGauge('signalr.connection.state', {
  description: 'SignalR connection state (0=disconnected, 1=connected)',
  valueType: ValueType.INT,
});

let currentConnectionState = 0;

/**
 * Update SignalR connection state
 */
export function setSignalRConnectionState(connected: boolean): void {
  currentConnectionState = connected ? 1 : 0;
}

// Register callback for connection state
signalrConnectionState.addCallback((result) => {
  result.observe(currentConnectionState);
});

/**
 * Record update created
 */
export function recordUpdateCreated(category: string, hasMedia: boolean): void {
  if (!isTelemetryEnabled()) return;

  updatesCreatedCounter.add(1, {
    'update.category': category,
    'update.has_media': hasMedia,
  });
}

/**
 * Record API request
 */
export function recordApiRequest(endpoint: string, method: string, statusCode: number): void {
  if (!isTelemetryEnabled()) return;

  apiRequestsCounter.add(1, {
    'http.endpoint': endpoint,
    'http.method': method,
    'http.status_code': statusCode,
  });
}

/**
 * Record API latency
 */
export function recordApiLatency(endpoint: string, latencyMs: number): void {
  if (!isTelemetryEnabled()) return;

  apiLatencyHistogram.record(latencyMs, {
    'http.endpoint': endpoint,
  });
}

/**
 * Record update creation latency
 */
export function recordUpdateCreationLatency(latencyMs: number, category: string): void {
  if (!isTelemetryEnabled()) return;

  updateCreationLatency.record(latencyMs, {
    'update.category': category,
  });
}

/**
 * Record SignalR message received
 */
export function recordSignalRMessage(messageType: string): void {
  if (!isTelemetryEnabled()) return;

  signalrMessagesCounter.add(1, {
    'signalr.message_type': messageType,
  });
}
