// Custom instrumentation for SignalR operations
// Wraps SignalR connection lifecycle with spans and metrics

import { HubConnection } from '@microsoft/signalr';
import { withSpan, addSpanEvent } from './tracer';
import { recordSignalRMessage, setSignalRConnectionState } from './metrics';
import { isTelemetryEnabled } from './config';

/**
 * Instrument SignalR connection with telemetry
 * @param connection - SignalR hub connection
 * @returns Instrumented connection
 */
export function instrumentSignalRConnection(connection: HubConnection): HubConnection {
  if (!isTelemetryEnabled()) {
    return connection;
  }

  // Track connection state changes
  connection.onreconnecting(() => {
    setSignalRConnectionState(false);
    addSpanEvent('signalr.reconnecting');
  });

  connection.onreconnected(() => {
    setSignalRConnectionState(true);
    addSpanEvent('signalr.reconnected');
  });

  connection.onclose(() => {
    setSignalRConnectionState(false);
    addSpanEvent('signalr.closed');
  });

  return connection;
}

/**
 * Trace SignalR connection start
 */
export async function traceSignalRConnect(fn: () => Promise<void>): Promise<void> {
  return withSpan('signalr.connect', {}, async (span) => {
    await fn();
    setSignalRConnectionState(true);
    span.addEvent('connection.established');
  });
}

/**
 * Trace SignalR disconnection
 */
export async function traceSignalRDisconnect(fn: () => Promise<void>): Promise<void> {
  return withSpan('signalr.disconnect', {}, async (span) => {
    await fn();
    setSignalRConnectionState(false);
    span.addEvent('connection.closed');
  });
}

/**
 * Trace team join operation
 */
export async function traceTeamJoin(teamId: string, fn: () => Promise<void>): Promise<void> {
  return withSpan('signalr.join_team', { 'team.id': teamId }, async (span) => {
    await fn();
    span.addEvent('team.joined', { 'team.id': teamId });
  });
}

/**
 * Trace team leave operation
 */
export async function traceTeamLeave(teamId: string, fn: () => Promise<void>): Promise<void> {
  return withSpan('signalr.leave_team', { 'team.id': teamId }, async (span) => {
    await fn();
    span.addEvent('team.left', { 'team.id': teamId });
  });
}

/**
 * Record SignalR message event
 */
export function recordUpdateCreatedMessage(teamId: string, updateId: string): void {
  if (!isTelemetryEnabled()) return;

  recordSignalRMessage('UpdateCreated');
  addSpanEvent('signalr.message.received', {
    'message.type': 'UpdateCreated',
    'team.id': teamId,
    'update.id': updateId,
  });
}
