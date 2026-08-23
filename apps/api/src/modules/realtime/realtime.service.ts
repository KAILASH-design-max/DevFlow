import { Response } from "express";
import { eventBus } from "../../services/eventEmitter.js";

interface SseClient {
  id: string;
  res: Response;
  projectId?: string;
  userId?: string;
  connectedAt: Date;
}

export class RealtimeService {
  private static clients: Map<string, SseClient> = new Map();
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  private static isSubscribed = false;

  /**
   * Initialize SSE EventBus listeners & Heartbeat
   */
  static init() {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    // Keepalive ping every 25s
    if (!this.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        this.clients.forEach((client) => {
          try {
            client.res.write(": keepalive\n\n");
          } catch (e) {
            this.removeClient(client.id);
          }
        });
      }, 25000);
    }

    // Subscribe to domain events
    eventBus.on("issue.created", (payload) => {
      this.broadcast("issue.created", payload, payload.projectId);
    });

    eventBus.on("issue.status_changed", (payload) => {
      this.broadcast("issue.status_changed", payload, payload.projectId);
    });

    eventBus.on("issue.updated", (payload) => {
      this.broadcast("issue.updated", payload, payload.projectId);
    });

    eventBus.on("webhook.status_transition", (payload) => {
      this.broadcast("webhook.status_transition", payload, payload.projectId);
    });

    eventBus.on("webhook.pr_processed", (payload) => {
      this.broadcast("webhook.pr_processed", payload, payload.projectId);
    });

    eventBus.on("comment.created", (payload) => {
      this.broadcast("comment.created", payload);
    });
  }

  /**
   * Register a new SSE client
   */
  static addClient(id: string, res: Response, projectId?: string, userId?: string) {
    this.init();

    const client: SseClient = {
      id,
      res,
      projectId,
      userId,
      connectedAt: new Date(),
    };

    this.clients.set(id, client);

    // Send initial handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId: id, message: "Connected to DevFlow Real-Time Stream", timestamp: new Date().toISOString() })}\n\n`);

    return client;
  }

  /**
   * Remove a disconnected client
   */
  static removeClient(id: string) {
    const client = this.clients.get(id);
    if (client) {
      try {
        client.res.end();
      } catch (e) {
        // ignore
      }
      this.clients.delete(id);
    }
  }

  /**
   * Broadcast an event to matching clients
   */
  static broadcast(eventName: string, data: any, targetProjectId?: string) {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

    this.clients.forEach((client) => {
      if (targetProjectId && client.projectId && client.projectId !== targetProjectId) {
        return; // Filter by project if specified
      }

      try {
        client.res.write(message);
      } catch (err) {
        this.removeClient(client.id);
      }
    });
  }

  /**
   * Get active connection count
   */
  static getStats() {
    return {
      connectedClients: this.clients.size,
    };
  }
}
