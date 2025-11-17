// OpenTelemetry SDK initialization for browser
// Configures tracing and metrics with OTLP protobuf exporters

import { WebTracerProvider, BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { context, trace, metrics } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';

const ENABLE_TELEMETRY = import.meta.env.VITE_ENABLE_TELEMETRY === 'true';
const OTLP_ENDPOINT = import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
const OTLP_HEADERS = import.meta.env.VITE_OTEL_EXPORTER_OTLP_HEADERS || '';
const RESOURCE_ATTRIBUTES = import.meta.env.VITE_OTEL_RESOURCE_ATTRIBUTES || '';
const SERVICE_NAME = import.meta.env.VITE_OTEL_SERVICE_NAME || 'frontend';
const TRACE_SAMPLE_RATE = parseFloat(import.meta.env.VITE_OTEL_TRACE_SAMPLE_RATE || '0.1');

/**
 * Parse delimited key=value pairs from environment variable
 * Format: "key1=value1,key2=value2"
 */
function parseDelimitedValues(s: string): Record<string, string> {
  if (!s) return {};
  
  const pairs = s.split(',');
  const result: Record<string, string> = {};
  
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      result[key.trim()] = value.trim();
    }
  });
  
  return result;
}

let isInitialized = false;

/**
 * Initialize OpenTelemetry SDK for browser
 * Sets up tracing and metrics with OTLP HTTP exporters
 * Configures auto-instrumentation for fetch, document load, and user interactions
 */
export function initializeTelemetry(): void {
  // Debug: Log all environment variables
  console.log('[Telemetry] Environment variables:', {
    ENABLE_TELEMETRY,
    OTLP_ENDPOINT,
    OTLP_HEADERS: OTLP_HEADERS ? '***SET***' : 'NOT SET',
    RESOURCE_ATTRIBUTES: RESOURCE_ATTRIBUTES || 'NOT SET',
    SERVICE_NAME,
    TRACE_SAMPLE_RATE,
  });

  if (!ENABLE_TELEMETRY) {
    console.log('[Telemetry] Disabled via VITE_ENABLE_TELEMETRY flag');
    return;
  }

  if (isInitialized) {
    console.warn('[Telemetry] Already initialized, skipping');
    return;
  }

  console.log('[Telemetry] Initializing OpenTelemetry SDK');

  // Parse OTLP headers for API key authentication (set by Aspire)
  const otlpHeaders = parseDelimitedValues(OTLP_HEADERS);
  console.log('[Telemetry] Parsed OTLP headers:', Object.keys(otlpHeaders).length > 0 ? Object.keys(otlpHeaders) : 'NONE');
  
  // Parse resource attributes (set by Aspire)
  const resourceAttributes = parseDelimitedValues(RESOURCE_ATTRIBUTES);
  console.log('[Telemetry] Parsed resource attributes:', resourceAttributes);

  // Create resource with service metadata
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: '1.0.0',
    'deployment.environment': import.meta.env.MODE || 'development',
    ...resourceAttributes, // Include Aspire-provided attributes
  });

  // Configure OTLP trace exporter (protobuf encoding)
  const traceExporter = new OTLPTraceExporter({
    url: `${OTLP_ENDPOINT}/v1/traces`,
    headers: otlpHeaders,
  });

  console.log('[Telemetry] Trace exporter configured:', {
    url: `${OTLP_ENDPOINT}/v1/traces`,
    hasHeaders: Object.keys(otlpHeaders).length > 0,
  });

  // Add debug logging to trace exporter (only in development)
  const shouldDebugLog = import.meta.env.MODE === 'development' && import.meta.env.VITE_OTEL_DEBUG === 'true';
  
  if (shouldDebugLog) {
    const originalExport = traceExporter.export.bind(traceExporter);
    traceExporter.export = (spans, resultCallback) => {
      console.log('[Telemetry] 🔵 Exporting', spans.length, 'spans to', `${OTLP_ENDPOINT}/v1/traces`);
      console.log('[Telemetry] 📋 Span details:', spans.map(s => ({
        name: s.name,
        traceId: s.spanContext().traceId,
        spanId: s.spanContext().spanId,
        kind: s.kind,
      })));
      originalExport(spans, (result) => {
        if (result.code !== 0) {
          console.error('[Telemetry] ❌ Trace export failed:', result);
        } else {
          console.log('[Telemetry] ✅ Trace export successful');
        }
        resultCallback(result);
      });
    };
  }

  // Wrap console exporter to see what it's receiving (only in debug mode)
  const consoleExporter = new ConsoleSpanExporter();
  if (shouldDebugLog) {
    const originalConsoleExport = consoleExporter.export.bind(consoleExporter);
    consoleExporter.export = (spans, resultCallback) => {
      console.log('[Telemetry] 🟢 ConsoleSpanExporter received', spans.length, 'spans');
      originalConsoleExport(spans, resultCallback);
    };
  }

  // Initialize tracer provider with processors (SDK 2.x requires passing in constructor)
  const tracerProvider = new WebTracerProvider({
    resource,
    spanProcessors: [
      new BatchSpanProcessor(consoleExporter, {
        maxQueueSize: 100,
        maxExportBatchSize: 30, // Batch up to 30 spans before exporting
        scheduledDelayMillis: 5000, // Export every 5 seconds instead of 500ms
      }),
      new BatchSpanProcessor(traceExporter, {
        maxQueueSize: 100,
        maxExportBatchSize: 30,
        scheduledDelayMillis: 5000,
      }),
    ],
    // Use AlwaysOnSampler for 100% sampling (TRACE_SAMPLE_RATE = 1.0)
    // The custom sampler was being called too frequently and incorrectly
  });



  // Store provider for manual flush operations
  storeTracerProvider(tracerProvider);

  // Register tracer provider
  tracerProvider.register({
    contextManager: new ZoneContextManager(),
  });

  // Configure OTLP metrics exporter (protobuf encoding)
  const metricExporter = new OTLPMetricExporter({
    url: `${OTLP_ENDPOINT}/v1/metrics`,
    headers: otlpHeaders,
  });

  // Initialize meter provider with readers (SDK 2.x requires passing in constructor)
  const meterProvider = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 10000, // Export every 10 seconds
      }),
    ],
  });

  // Register meter provider
  metrics.setGlobalMeterProvider(meterProvider);

  // Configure OTLP logs exporter (protobuf encoding)
  const logExporter = new OTLPLogExporter({
    url: `${OTLP_ENDPOINT}/v1/logs`,
    headers: otlpHeaders,
  });

  console.log('[Telemetry] Log exporter configured:', {
    url: `${OTLP_ENDPOINT}/v1/logs`,
    hasHeaders: Object.keys(otlpHeaders).length > 0,
  });

  // Initialize logger provider with batch processor (SDK 2.x requires passing in constructor)
  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor(logExporter, {
        maxQueueSize: 100,
        maxExportBatchSize: 30,
        scheduledDelayMillis: 5000,
      }),
    ],
  });

  // Register logger provider
  logs.setGlobalLoggerProvider(loggerProvider);

  console.log('[Telemetry] Logger provider initialized');

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
        // Filter out noisy requests
        ignoreUrls: [
          /\/vite\//,  // Vite HMR
          /\/@vite\//,  // Vite dev server
          /\/__vite/,   // Vite internals
          /\.hot-update\./, // HMR updates
          /\/hubs\//,   // SignalR hub connections (use SignalR instrumentation instead)
          /negotiate/,  // SignalR negotiate endpoint
          new RegExp(OTLP_ENDPOINT), // Don't trace the telemetry export itself!
          /\/v1\/traces/, // OTLP trace endpoint
          /\/v1\/metrics/, // OTLP metrics endpoint
        ],
        applyCustomAttributesOnSpan: (span, request) => {
          // Add custom attributes to fetch spans
          if (request instanceof Request) {
            span.setAttribute('http.request.url', request.url);
            // Only capture API calls to our backend
            if (request.url.includes('/api/')) {
              span.setAttribute('app.api_call', true);
            }
          }
        },
      }),
      // Document load performance tracking
      new DocumentLoadInstrumentation(),
      // User interaction tracking disabled - use manual spans for important actions instead
    ],
  });

  isInitialized = true;
  console.log('[Telemetry] ✅ Initialized successfully', {
    endpoint: OTLP_ENDPOINT,
    serviceName: SERVICE_NAME,
    sampleRate: TRACE_SAMPLE_RATE,
    hasHeaders: Object.keys(otlpHeaders).length > 0,
  });
  
  // Test connectivity with a simple trace
  const tracer = trace.getTracer('telemetry-init');
  const span = tracer.startSpan('telemetry.initialized');
  span.setAttribute('test', 'initialization');
  span.end();
  
  // Force flush to ensure test span is exported immediately
  setTimeout(async () => {
    console.log('[Telemetry] Forcing flush of test span...');
    await tracerProvider.forceFlush();
    console.log('[Telemetry] ✅ Test span flushed');
  }, 100);
  
  console.log('[Telemetry] Test span created');
}

/**
 * Check if telemetry is enabled
 */
export function isTelemetryEnabled(): boolean {
  return ENABLE_TELEMETRY && isInitialized;
}

/**
 * Get the tracer provider for manual flush operations
 */
let tracerProviderInstance: WebTracerProvider | null = null;

export function getTracerProvider(): WebTracerProvider | null {
  return tracerProviderInstance;
}

// Store the provider instance
function storeTracerProvider(provider: WebTracerProvider): void {
  tracerProviderInstance = provider;
}

/**
 * Export core APIs for convenience
 */
export { trace, context, metrics };
export { logs } from '@opentelemetry/api-logs';
