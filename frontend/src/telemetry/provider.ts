/**
 * OpenTelemetry Browser Telemetry Provider
 * 
 * Initializes OpenTelemetry for the browser to send traces to the Aspire dashboard.
 * Based on the Aspire documentation for browser telemetry:
 * https://aspire.dev/dashboard/enable-browser-telemetry/
 */

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import type { TelemetryConfig } from './config';
import { diag, DiagConsoleLogger, DiagLogLevel, trace } from '@opentelemetry/api';

/**
 * Initialize OpenTelemetry browser telemetry
 * 
 * This function sets up:
 * - WebTracerProvider for browser-based tracing
 * - OTLP HTTP exporter for sending traces to Aspire dashboard
 * - Automatic instrumentation for fetch, document load, and user interactions
 * 
 * @param config - Telemetry configuration
 */
export function initializeTelemetry(config: TelemetryConfig): void {
  if (!config.enabled) {
    console.log('[Telemetry] Disabled - not initializing OpenTelemetry');
    return;
  }

  // Enable debug logging if configured
  if (config.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  console.log('[Telemetry] Initializing OpenTelemetry');
  console.log('[Telemetry] Service:', config.serviceName);
  console.log('[Telemetry] OTLP Endpoint:', config.otlpEndpoint);

  // Create resource with service information
  const customResource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName,
    [ATTR_SERVICE_VERSION]: config.serviceVersion,
  });
  
  const resource = defaultResource().merge(customResource);

  // Create OTLP HTTP exporter
  const exporter = new OTLPTraceExporter({
    url: config.otlpEndpoint,
    headers: {},
    // Use batch processor for better performance
    concurrencyLimit: 10,
  });

  // Create span processor
  const spanProcessor = new BatchSpanProcessor(exporter, {
    maxQueueSize: 100,
    maxExportBatchSize: 10,
    scheduledDelayMillis: 500,
  });

  // Create WebTracerProvider with resource and span processor
  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [spanProcessor],
  });

  // Register the provider
  provider.register();

  // Register automatic instrumentations
  registerInstrumentations({
    instrumentations: [
      // Instrument fetch API to trace HTTP requests
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [
          // Allow trace headers to be sent to the backend
          /localhost/,
          /\//,  // Same origin
        ],
        clearTimingResources: true,
        // Filter out telemetry endpoint calls to avoid infinite loops
        ignoreUrls: [new RegExp(config.otlpEndpoint)],
      }),
      // Instrument document load to track page load performance
      new DocumentLoadInstrumentation(),
      // Instrument user interactions to track clicks and other events
      new UserInteractionInstrumentation({
        eventNames: ['click', 'submit'],
      }),
    ],
  });

  console.log('[Telemetry] OpenTelemetry initialized successfully');
}

/**
 * Get the active tracer for manual instrumentation
 * 
 * Use this to create custom spans for specific operations:
 * 
 * @example
 * ```ts
 * const tracer = getTracer();
 * const span = tracer.startSpan('my-operation');
 * try {
 *   // Do work
 *   span.setAttributes({ 'custom.attribute': 'value' });
 * } finally {
 *   span.end();
 * }
 * ```
 */
export function getTracer() {
  return trace.getTracer('app-teamupdates-frontend');
}
