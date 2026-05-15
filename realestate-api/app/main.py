from contextlib import asynccontextmanager
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routers import auth, users, properties, inquiries, admin, uploads, saved, notifications
from app.core.notifications import manager as notification_manager

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield


app = FastAPI(
    title="NaijaProperty API",
    description="Nigerian Community Real Estate Platform — Properties listed in ₦ Naira",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(properties.router)
app.include_router(inquiries.router)
app.include_router(admin.router)
app.include_router(uploads.router)
app.include_router(saved.router)
app.include_router(notifications.router)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.websocket("/ws/notifications/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    from app.core.security import decode_access_token
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
        await notification_manager.connect(user_id, websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            notification_manager.disconnect(user_id, websocket)
    except Exception:
        await websocket.close(code=1008)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": "NaijaProperty API", "currency": "₦ NGN"}
