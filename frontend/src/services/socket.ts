import type { Incident } from "../components/IncidentModal";

const SOCKET_URL = "ws://localhost:8000/ws/events";

export function connectToEventStream(onIncident: (incident: Incident) => void) {
  const socket = new WebSocket(SOCKET_URL);

  socket.onmessage = (event) => {
    try {
      const incident = JSON.parse(event.data) as Incident;
      onIncident(incident);
    } catch {
      // Ignore malformed updates.
    }
  };

  return () => {
    socket.close();
  };
}