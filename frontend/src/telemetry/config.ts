/**
 * OpenTelemetry configuration for browser telemetry
 * 
 * This module provides configurable telemetry settings for sending
 * traces and metrics to the Aspire dashboard.
 */

export interface TelemetryConfig {
  /** Enable or disable telemetry */
  enabled: boolean;
  /** OTLP HTTP endpoint URL (typically the Aspire dashboard endpoint) */
  otlpEndpoint: string;
  /** Service name for identifying the frontend in telemetry */
  serviceName: string;
  /** Service version */
  serviceVersion: string;
  /** Enable console logging of telemetry events (for debugging) */
  debug: boolean;
}

/**
 * Get telemetry configuration from environment variables
 */
export function getTelemetryConfig(): TelemetryConfig {
  const enabled = import.meta.env.VITE_ENABLE_TELEMETRY === 'true';
  const otlpEndpoint = import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:18889/v1/traces';
  const serviceName = import.meta.env.VITE_OTEL_SERVICE_NAME || 'app-teamupdates-frontend';
  const serviceVersion = import.meta.env.VITE_APP_VERSION || '0.0.0';
  const debug = import.meta.env.VITE_OTEL_DEBUG === 'true';

  return {
    enabled,
    otlpEndpoint,
    serviceName,
    serviceVersion,
    debug,
  };
}
