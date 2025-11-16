// Telemetry module exports
// Central export point for all telemetry functionality

export { initializeTelemetry, isTelemetryEnabled } from './config';
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
