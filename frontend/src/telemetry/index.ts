/**
 * OpenTelemetry initialization module
 * 
 * This module provides the main entry point for initializing OpenTelemetry
 * browser telemetry in the application.
 */

export { initializeTelemetry, getTracer } from './provider';
export { getTelemetryConfig } from './config';
export type { TelemetryConfig } from './config';
