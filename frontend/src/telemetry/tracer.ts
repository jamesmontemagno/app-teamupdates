// Tracer utilities for creating and managing spans
// Provides typed helpers for common tracing patterns

import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import type { Span } from '@opentelemetry/api';
import { isTelemetryEnabled } from './config';

const TRACER_NAME = 'pulseboard-frontend';

/**
 * Get the global tracer instance
 */
function getTracer() {
  return trace.getTracer(TRACER_NAME);
}

/**
 * Span attribute types
 */
export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Create and execute a traced operation
 * @param name - Span name
 * @param attributes - Span attributes
 * @param fn - Function to execute within span
 * @returns Promise with function result
 */
export async function withSpan<T>(
  name: string,
  attributes: SpanAttributes,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  if (!isTelemetryEnabled()) {
    // If telemetry is disabled, just execute the function
    return fn({} as Span);
  }

  const tracer = getTracer();
  const span = tracer.startSpan(name);

  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined) {
      span.setAttribute(key, value);
    }
  });

  try {
    const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Create a synchronous traced operation
 * @param name - Span name
 * @param attributes - Span attributes
 * @param fn - Function to execute within span
 * @returns Function result
 */
export function withSpanSync<T>(
  name: string,
  attributes: SpanAttributes,
  fn: (span: Span) => T
): T {
  if (!isTelemetryEnabled()) {
    return fn({} as Span);
  }

  const tracer = getTracer();
  const span = tracer.startSpan(name);

  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined) {
      span.setAttribute(key, value);
    }
  });

  try {
    const result = context.with(trace.setSpan(context.active(), span), () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Add event to current span
 */
export function addSpanEvent(name: string, attributes?: SpanAttributes): void {
  if (!isTelemetryEnabled()) {
    return;
  }

  const currentSpan = trace.getSpan(context.active());
  if (currentSpan) {
    currentSpan.addEvent(name, attributes);
  }
}

/**
 * Set attribute on current span
 */
export function setSpanAttribute(key: string, value: string | number | boolean): void {
  if (!isTelemetryEnabled()) {
    return;
  }

  const currentSpan = trace.getSpan(context.active());
  if (currentSpan) {
    currentSpan.setAttribute(key, value);
  }
}
