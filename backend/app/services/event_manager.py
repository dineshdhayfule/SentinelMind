import json

from fastapi import WebSocket


class EventManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict[str, object]) -> None:
        disconnected: list[WebSocket] = []
        payload = json.dumps(message)

        for websocket in self.active_connections:
            try:
                await websocket.send_text(payload)
            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(websocket)


event_manager = EventManager()