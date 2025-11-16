// SignalR connection manager for real-time updates

import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { isMockMode } from './index';
import { logger } from '../utils/logger';
import {
  instrumentSignalRConnection,
  traceSignalRConnect,
  traceSignalRDisconnect,
  traceTeamJoin,
  traceTeamLeave,
  recordUpdateCreatedMessage,
} from '../telemetry';

const SIGNALR_HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL || '/hubs/updates';
const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

type UpdateCreatedHandler = (update: unknown) => void;

class SignalRConnection {
  private connection: HubConnection | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers: Set<UpdateCreatedHandler> = new Set();
  private connectionPromise: Promise<void> | null = null;
  private isIntentionallyDisconnected = false;

  constructor() {
    // Don't connect in mock mode
    if (isMockMode()) {
      logger.info('SignalR: Mock mode detected, skipping connection');
      return;
    }

    this.initializeConnection();
  }

  private initializeConnection() {
    const url = new URL(SIGNALR_HUB_URL, window.location.origin).toString();
    
    this.connection = new HubConnectionBuilder()
      .withUrl(url, {
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s, then 60s
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          if (retryContext.previousRetryCount === 3) return 30000;
          return 60000;
        },
      })
      .configureLogging(LogLevel.Information)
      .build();

    // Instrument connection with telemetry
    instrumentSignalRConnection(this.connection);

    // Set up event handlers
    this.connection.on('UpdateCreated', (update: unknown) => {
      logger.signalR('UpdateCreated event received', { update });
      
      // Record telemetry for SignalR message
      const teamUpdate = update as { teamId?: string; id?: string };
      if (teamUpdate.teamId && teamUpdate.id) {
        recordUpdateCreatedMessage(teamUpdate.teamId, teamUpdate.id);
      }
      
      this.handlers.forEach((handler) => handler(update));
    });

    this.connection.onreconnecting((error) => {
      logger.signalR('Reconnecting...', { error: error?.message });
    });

    this.connection.onreconnected((connectionId) => {
      logger.signalR('Reconnected successfully', { connectionId });
      this.reconnectAttempts = 0;
    });

    this.connection.onclose((error) => {
      logger.signalR('Connection closed', { error: error?.message });
      if (!this.isIntentionallyDisconnected) {
        this.scheduleReconnect();
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('SignalR: Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(RECONNECT_DELAY_MS * this.reconnectAttempts, 60000);
    
    logger.debug(`SignalR: Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  async connect(): Promise<void> {
    if (isMockMode() || !this.connection) {
      return;
    }

    // Return existing promise if connection is in progress
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Already connected
    if (this.connection.state === HubConnectionState.Connected) {
      return;
    }

    // Already connecting
    if (this.connection.state === HubConnectionState.Connecting) {
      return;
    }

    this.isIntentionallyDisconnected = false;
    this.connectionPromise = traceSignalRConnect(async () => {
      if (!this.connection) return;
      
      await this.connection.start();
      console.log('SignalR: Connected');
      this.reconnectAttempts = 0;
      this.connectionPromise = null;
    }).catch((error) => {
      console.error('SignalR: Connection failed', error);
      this.connectionPromise = null;
      this.scheduleReconnect();
      throw error;
    });

    return this.connectionPromise;
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }

    this.isIntentionallyDisconnected = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connection.state !== HubConnectionState.Disconnected) {
      await traceSignalRDisconnect(async () => {
        await this.connection!.stop();
      });
    }
  }

  async joinTeam(teamId: string): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      console.warn('SignalR: Cannot join team, not connected');
      return;
    }

    await traceTeamJoin(teamId, async () => {
      await this.connection!.invoke('JoinTeam', teamId);
      console.log(`SignalR: Joined team ${teamId}`);
    }).catch((error) => {
      console.error('SignalR: Failed to join team', error);
    });
  }

  async leaveTeam(teamId: string): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return;
    }

    await traceTeamLeave(teamId, async () => {
      await this.connection!.invoke('LeaveTeam', teamId);
      console.log(`SignalR: Left team ${teamId}`);
    }).catch((error) => {
      console.error('SignalR: Failed to leave team', error);
    });
  }

  onUpdateCreated(handler: UpdateCreatedHandler): () => void {
    // Only add if not already present (handles React Strict Mode double-mount)
    if (!this.handlers.has(handler)) {
      this.handlers.add(handler);
    }
    
    // Return unsubscribe function
    return () => {
      this.handlers.delete(handler);
    };
  }

  getConnectionState(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected;
  }

  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}

// Singleton instance
let signalRInstance: SignalRConnection | null = null;

export function getSignalRConnection(): SignalRConnection {
  if (!signalRInstance) {
    signalRInstance = new SignalRConnection();
  }
  return signalRInstance;
}

export { HubConnectionState };
