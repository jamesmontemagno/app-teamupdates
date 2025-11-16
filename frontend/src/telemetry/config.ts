// OpenTelemetry SDK initialization for browser
// Configures tracing and metrics with OTLP HTTP exporters

import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { context, trace, metrics } from '@opentelemetry/api';

const ENABLE_TELEMETRY = import.meta.env.VITE_ENABLE_TELEMETRY === 'true';
const OTLP_ENDPOINT = import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
const SERVICE_NAME = import.meta.env.VITE_OTEL_SERVICE_NAME || 'pulseboard-frontend';
const TRACE_SAMPLE_RATE = parseFloat(import.meta.env.VITE_OTEL_TRACE_SAMPLE_RATE || '0.1');

let isInitialized = false;

/**
 * Initialize OpenTelemetry SDK for browser
 * Sets up tracing and metrics with OTLP HTTP exporters
 * Configures auto-instrumentation for fetch, document load, and user interactions
 */
export function initializeTelemetry(): void {
  if (!ENABLE_TELEMETRY) {
    console.log('[Telemetry] Disabled via VITE_ENABLE_TELEMETRY flag');
    return;
  }

  if (isInitialized) {
    console.warn('[Telemetry] Already initialized, skipping');
    return;
  }

  console.log('[Telemetry] Initializing OpenTelemetry SDK');

  // Create resource with service metadata
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: '1.0.0',
    'deployment.environment': import.meta.env.MODE || 'development',
  });

  // Initialize tracer provider
  const tracerProvider = new WebTracerProvider({
    resource,
    sampler: {
      shouldSample: () => {
        // Simple probabilistic sampling
        return Math.random() < TRACE_SAMPLE_RATE
          ? { decision: 1 } // RECORD_AND_SAMPLE
          : { decision: 0 }; // NOT_RECORD
      },
      toString: () => `ProbabilitySampler{${TRACE_SAMPLE_RATE}}`,
    },
  });

  // Configure OTLP trace exporter (HTTP for browser compatibility)
  const traceExporter = new OTLPTraceExporter({
    url: `${OTLP_ENDPOINT}/v1/traces`,
    headers: {},
  });

  // Add batch span processor
  tracerProvider.addSpanProcessor(new BatchSpanProcessor(traceExporter, {
    maxQueueSize: 100,
    scheduledDelayMillis: 500,
  }));

  // Register tracer provider
  tracerProvider.register({
    contextManager: new ZoneContextManager(),
  });

  // Initialize meter provider
  const meterProvider = new MeterProvider({
    resource,
  });

  // Configure OTLP metrics exporter
  const metricExporter = new OTLPMetricExporter({
    url: `${OTLP_ENDPOINT}/v1/metrics`,
    headers: {},
  });

  // Add periodic metric reader
  meterProvider.addMetricReader(new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000, // Export every 10 seconds
  }));

  // Register meter provider
  metrics.setGlobalMeterProvider(meterProvider);

  // Register auto-instrumentations
  registerInstrumentations({
    tracerProvider,
    instrumentations: [
      // Auto-instrument fetch API calls
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [
          /localhost/,
          /\.local/,
          new RegExp(window.location.origin),
        ],
        clearTimingResources: true,
        applyCustomAttributesOnSpan: (span, request) => {
          // Add custom attributes to fetch spans
          if (request instanceof Request) {
            span.setAttribute('http.request.url', request.url);
          }
        },
      }),
      // Document load performance tracking
      new DocumentLoadInstrumentation(),
      // User interaction tracking (clicks)
      new UserInteractionInstrumentation({
        eventNames: ['click', 'submit'],
      }),
    ],
  });

  isInitialized = true;
  console.log('[Telemetry] Initialized successfully', {
    endpoint: OTLP_ENDPOINT,
    serviceName: SERVICE_NAME,
    sampleRate: TRACE_SAMPLE_RATE,
  });
}

/**
 * Check if telemetry is enabled
 */
export function isTelemetryEnabled(): boolean {
  return ENABLE_TELEMETRY && isInitialized;
}

/**
 * Export core APIs for convenience
 */
export { trace, context, metrics };
