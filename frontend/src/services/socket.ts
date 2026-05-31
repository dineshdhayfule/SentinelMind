import type { Incident } from "../components/IncidentModal";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "";

function buildWebSocketUrl(): string {
  if (API_BASE) {
    try {
      const url = new URL(API_BASE);
      if (url.protocol === "https:") return `wss://${url.host}/ws/events`;
      if (url.protocol === "http:") return `ws://${url.host}/ws/events`;
    } catch {
      // fall through
    }
  }
  // Default to relative path which will use same host/protocol.
  return `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws/events`;
}

export function connectToEventStream(onIncident: (incident: Incident) => void) {
  const wsUrl = buildWebSocketUrl();

  let socket: WebSocket | null = null;
  try {
    socket = new WebSocket(wsUrl);
  } catch (e) {
    // Opening a ws:// URL from an https page would throw — degrade gracefully.
    // Return a no-op cleanup function.
    // eslint-disable-next-line no-console
    console.warn("WebSocket unavailable for:", wsUrl, e);
    return () => {};
  }

  socket.onmessage = (event) => {
    try {
      const incident = JSON.parse(event.data) as Incident;
      onIncident(incident);
    } catch {
      // Ignore malformed updates.
    }
  };

  return () => {
    try {
      socket?.close();
    } catch {}
  };
}