// Telemetry module exports
// Central export point for all telemetry functionality

// Re-export telemetry utilities
export { initializeTelemetry, isTelemetryEnabled, trace, context, metrics, getTracerProvider, logs } from './config';
export * from './logger';
export { withSpan, withSpanSync, addSpanEvent, setSpanAttribute } from './tracer';
export {
  recordUpdateCreated,
  recordApiRequest,
  recordApiLatency,
  recordUpdateCreationLatency,
  recordSignalRMessage,
  setSignalRConnectionState,
} from './metrics';
export {
  instrumentSignalRConnection,
  traceSignalRConnect,
  traceSignalRDisconnect,
  traceTeamJoin,
  traceTeamLeave,
  recordUpdateCreatedMessage,
} from './signalr';
