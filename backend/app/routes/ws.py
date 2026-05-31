from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.event_manager import event_manager

router = APIRouter()


@router.websocket("/ws/events")
async def ws_events(websocket: WebSocket) -> None:
    await event_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        event_manager.disconnect(websocket)