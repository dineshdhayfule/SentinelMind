from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.events import router
from app.routes.ws import router as ws_router

app = FastAPI(title="SentinelMind Lite")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(ws_router)

@app.get("/")
def home():
    return {"message": "SentinelMind API Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
