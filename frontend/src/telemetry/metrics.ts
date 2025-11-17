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

/**
 * Record media captured (photo, video, or audio)
 */
export function recordMediaCaptured(type: 'photo' | 'video' | 'audio', durationMs?: number): void {
  if (!isTelemetryEnabled()) return;

  const mediaCapturedCounter = getMeter().createCounter('media.captured', {
    description: 'Count of media captures by type',
    valueType: ValueType.INT,
  });
  mediaCapturedCounter.add(1, { 'media.type': type });

  if (durationMs && type !== 'photo') {
    const mediaDurationHistogram = getMeter().createHistogram('media.duration', {
      description: 'Duration of audio/video captures in milliseconds',
      unit: 'ms',
      valueType: ValueType.DOUBLE,
    });
    mediaDurationHistogram.record(durationMs, { 'media.type': type });
  }
}

/**
 * Record geolocation request result
 */
export function recordGeolocationRequest(success: boolean, latencyMs: number, errorCode?: number): void {
  if (!isTelemetryEnabled()) return;

  const geoCounter = getMeter().createCounter('geolocation.requests', {
    description: 'Geolocation API requests',
    valueType: ValueType.INT,
  });
  geoCounter.add(1, { 'success': success, 'error_code': errorCode || 0 });

  if (success) {
    const geoLatencyHistogram = getMeter().createHistogram('geolocation.latency', {
      description: 'Geolocation request latency in milliseconds',
      unit: 'ms',
      valueType: ValueType.DOUBLE,
    });
    geoLatencyHistogram.record(latencyMs);
  }
}

/**
 * Record SignalR real-time update received
 */
export function recordSignalRUpdateReceived(teamId: string): void {
  if (!isTelemetryEnabled()) return;

  const signalrUpdatesCounter = getMeter().createCounter('signalr.updates_received', {
    description: 'Real-time updates received via SignalR',
    valueType: ValueType.INT,
  });
  signalrUpdatesCounter.add(1, { 'team.id': teamId });
}

/**
 * Record page view
 */
export function recordPageView(pageName: string): void {
  if (!isTelemetryEnabled()) return;

  const pageViewCounter = getMeter().createCounter('page.views', {
    description: 'Page views by route',
    valueType: ValueType.INT,
  });
  pageViewCounter.add(1, { 'page': pageName });
}

/**
 * Record team operation (join, leave, create)
 */
export function recordTeamOperation(operation: 'join' | 'leave' | 'create', success: boolean): void {
  if (!isTelemetryEnabled()) return;

  const teamOpsCounter = getMeter().createCounter('team.operations', {
    description: 'Team operations (join/leave/create)',
    valueType: ValueType.INT,
  });
  teamOpsCounter.add(1, { 'operation': operation, 'success': success });
}

/**
 * Record profile update latency
 */
export function recordProfileUpdate(latencyMs: number): void {
  if (!isTelemetryEnabled()) return;

  const profileLatencyHistogram = getMeter().createHistogram('profile.update.latency', {
    description: 'Profile update latency in milliseconds',
    unit: 'ms',
    valueType: ValueType.DOUBLE,
  });
  profileLatencyHistogram.record(latencyMs);
}
