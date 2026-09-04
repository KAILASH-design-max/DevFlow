"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getInMemoryAccessToken } from "./fetch";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: string;
}

export function useRealtime(projectId?: string, onEvent?: (event: RealtimeEvent) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const token = getInMemoryAccessToken();
      const url = new URL(`${API_BASE}/api/realtime/events`);
      if (projectId) url.searchParams.append("projectId", projectId);
      if (token) url.searchParams.append("token", token);

      const es = new EventSource(url.toString(), { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        // Exponential backoff reconnect
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      const handleEvent = (type: string) => (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const ev: RealtimeEvent = {
            type,
            data,
            timestamp: new Date().toISOString(),
          };
          setLastEvent(ev);
          if (onEvent) onEvent(ev);
        } catch (err) {
          console.warn("Failed to parse realtime event:", err);
        }
      };

      es.addEventListener("connected", handleEvent("connected"));
      es.addEventListener("issue.created", handleEvent("issue.created"));
      es.addEventListener("issue.status_changed", handleEvent("issue.status_changed"));
      es.addEventListener("issue.updated", handleEvent("issue.updated"));
      es.addEventListener("webhook.status_transition", handleEvent("webhook.status_transition"));
      es.addEventListener("webhook.pr_processed", handleEvent("webhook.pr_processed"));
      es.addEventListener("comment.created", handleEvent("comment.created"));
    } catch (e) {
      console.warn("SSE Connection failed:", e);
    }
  }, [projectId, onEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastEvent,
  };
}
