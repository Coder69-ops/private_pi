import os
import json
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
try:
    from sqlalchemy.orm import Session # type: ignore
except Exception:
    # Fallback for environments where SQLAlchemy isn't available to the linter
    from typing import Any as Session
from .database import engine, Base, get_db
from .models import ScanTask, ScanResult, Subscription, UserSettings, User
from .schemas import (
    ScanRequest, ScanTaskResponse, SubscriptionRequest, SubscriptionResponse, 
    UserSettingsSchema, TargetSummary, UserRegister, UserLogin, TokenResponse, UserResponse
)
from .tasks import perform_scan
import uuid
import asyncio
try:
    import redis.asyncio as redis # type: ignore
except Exception:
    # Fallback to sync redis if async variant is unavailable in this environment
    try:
        import redis # type: ignore
    except Exception:
        redis = None
from fastapi import WebSocket, WebSocketDisconnect, Header, UploadFile, File
from typing import List, Optional
import jwt
import hashlib
import base64
import hmac
try:
    import bcrypt # type: ignore
except Exception:
    bcrypt = None
from datetime import datetime, timedelta, timezone
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
if SECRET_KEY == "your-secret-key-change-in-production":
    print("⚠️  WARNING: Using default SECRET_KEY. Set SECRET_KEY environment variable in production!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize FastAPI App
app = FastAPI(title="Private PI API", version="1.0.0")


class ApiPathRewriteMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            path = scope.get("path", "")
            if path == "/api/backend":
                scope = dict(scope)
                scope["path"] = "/backend"
            elif path.startswith("/api/backend/"):
                scope = dict(scope)
                scope["path"] = "/backend/" + path[len("/api/backend/"):]

        await self.app(scope, receive, send)


app.add_middleware(ApiPathRewriteMiddleware)

# Determine allowed origins based on environment
environment = os.getenv("ENVIRONMENT", "development")
if environment == "production":
    allowed_origins = [
        "https://privatepi.shopsync.studio",
        "https://www.privatepi.shopsync.studio",
    ]
else:
    # Development - allow localhost and relative paths
    allowed_origins = ["*"]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if environment == "production":
    print(f"⚠️  Running in PRODUCTION mode")
    print(f"✅ CORS allowed for: {', '.join(allowed_origins)}")
else:
    print(f"ℹ️  Running in DEVELOPMENT mode")
    print(f"✅ CORS allows all origins (*)")

# Initialize Database Tables
from sqlalchemy import text # type: ignore
try:
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(text("ALTER TABLE scan_tasks ADD COLUMN IF NOT EXISTS screenshot_paths JSON;"))
            conn.execute(text("ALTER TABLE scan_tasks ADD COLUMN IF NOT EXISTS ai_summary JSON;"))
            conn.execute(text("ALTER TABLE scan_tasks ADD COLUMN IF NOT EXISTS risk_score VARCHAR;"))
            conn.execute(text("ALTER TABLE scan_tasks ADD COLUMN IF NOT EXISTS pdf_report_path VARCHAR;"))
            conn.execute(text("ALTER TABLE scan_tasks ADD COLUMN IF NOT EXISTS user_id VARCHAR;"))
            conn.execute(text("ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS openrouter_api_key VARCHAR;"))
            conn.execute(text("ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS openrouter_model VARCHAR DEFAULT 'google/gemini-pro';"))
            conn.execute(text("ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS auto_pdf_report INTEGER DEFAULT 0;"))
except Exception as e:
    print(f"Migration check: {e}")

Base.metadata.create_all(bind=engine)

security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    if bcrypt:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    # Fallback PBKDF2 (not as strong as bcrypt for this use-case but usable in dev/test)
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return base64.b64encode(salt + dk).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    if bcrypt:
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
    try:
        raw = base64.b64decode(hashed_password.encode())
        salt = raw[:16]
        dk = raw[16:]
        new_dk = hashlib.pbkdf2_hmac('sha256', plain_password.encode(), salt, 100000)
        return hmac.compare_digest(new_dk, dk)
    except Exception:
        return False

def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"sub": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract and verify JWT token from Authorization header"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")


# ===== AUTHENTICATION ENDPOINTS =====

@app.post("/backend/register", response_model=TokenResponse)
def register(request: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password length
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(request.password)
    new_user = User(id=user_id, email=request.email, password_hash=hashed_password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(user_id)
    return TokenResponse(access_token=access_token, token_type="bearer", user_id=user_id)

@app.post("/backend/login", response_model=TokenResponse)
def login(request: UserLogin, db: Session = Depends(get_db)):
    """Login user with email and password"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    # Create access token
    access_token = create_access_token(user.id)
    return TokenResponse(access_token=access_token, token_type="bearer", user_id=user.id)

@app.get("/backend/user", response_model=UserResponse)
def get_user(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user info"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/backend/subscribe", response_model=SubscriptionResponse)
def subscribe(request: SubscriptionRequest, db: Session = Depends(get_db)):
    sub = Subscription(id=str(uuid.uuid4()), target=request.target, email=request.email, frequency=request.frequency)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        # Map user_id -> List[WebSocket]
        self.active_connections: dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
             if websocket in self.active_connections[user_id]:
                 self.active_connections[user_id].remove(websocket)
             if not self.active_connections[user_id]:
                 del self.active_connections[user_id]

    async def broadcast(self, message: str):
        # Dev helper: broadcast to all (Avoid in prod if possible, but keeping for system alerts)
        for user_conns in self.active_connections.values():
            for connection in user_conns:
                try:
                    await connection.send_text(message)
                except:
                    pass

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except:
                    pass

manager = ConnectionManager()

async def redis_connector():
    while True:
        try:
            if redis is not None:
                r = redis.from_url("redis://redis:6379/0", encoding="utf-8", decode_responses=True) # type: ignore
                pubsub = r.pubsub()
            else:
                raise Exception("Redis module is not available")
            await pubsub.subscribe("scan_updates")
            print("Redis subscriber connected.")
            while True:
                try:
                    message = await pubsub.get_message(ignore_subscribe_messages=False, timeout=1.0)
                    if message:
                         print(f"DEBUG: Redis Message: {message}")
                         if message['type'] == 'message':
                            try:
                                data = json.loads(message['data'])
                                user_id = data.get("user_id")
                                print(f"Redis received msg for {user_id}. Active: {list(manager.active_connections.keys())}")
                                await manager.broadcast(message['data'])
                            except Exception as e:
                                print(f"Broadcaster Error: {e}")
                    await asyncio.sleep(0.01) # Prevent CPU spin
                except Exception as inner_e:
                    print(f"Error in redis message loop: {inner_e}")
                    await asyncio.sleep(1)
        except Exception as e:
             print(f"Redis connection failed, retrying in 5s: {e}")
             await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(redis_connector())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, uid: Optional[str] = None):
    # Note: WebSocket handshake doesn't support custom headers easily in browser JS.
    # We rely on query param 'uid' (e.g. /ws?uid=123)
    if not uid:
        await websocket.close(code=4003)
        return
        
    await manager.connect(websocket, uid)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, uid)

@app.post("/backend/scan", response_model=ScanTaskResponse)
def create_scan(request: ScanRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    # Ethical Guardrail
    if not request.has_permission:
        # Check if target is sensitive (Mock check)
        sensitive_domains = ["gov", "mil"]
        if any(d in request.target for d in sensitive_domains):
             raise HTTPException(status_code=403, detail="Scanning government/military targets requires explicit permission.")
    
    # Create Task Record
    task_id = str(uuid.uuid4())
    new_task = ScanTask(id=task_id, user_id=user_id, target=request.target, scan_type=request.scan_type, status="PENDING")
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Dispatch to Celery (if available) or run in background executor
    def _dispatch(func, *fargs):
        if hasattr(func, 'delay'):
            try:
                getattr(func, 'delay')(*fargs) # type: ignore
                return
            except Exception:
                pass
        # Fallback: run sync function in background thread executor
        try:
            loop = asyncio.get_event_loop()
            loop.run_in_executor(None, func, *fargs)
        except Exception:
            # Last resort: call synchronously (blocking)
            try:
                func(*fargs)
            except Exception as e:
                print(f"Failed to dispatch task {func}: {e}")

    _dispatch(perform_scan, task_id, request.target, request.scan_type, request.modules)

    return new_task

@app.get("/backend/scan/{task_id}", response_model=ScanTaskResponse)
def get_scan_status(task_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    task = db.query(ScanTask).filter(ScanTask.id == task_id, ScanTask.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/backend/scan/{task_id}/report")
def trigger_report_generation(task_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    task = db.query(ScanTask).filter(ScanTask.id == task_id, ScanTask.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    from .tasks import generate_report_task
    if hasattr(generate_report_task, 'delay'):
        try:
            generate_report_task.delay(task_id)  # type: ignore
        except Exception:
            # fallback to executor
            asyncio.get_event_loop().run_in_executor(None, generate_report_task, task_id)
    else:
        asyncio.get_event_loop().run_in_executor(None, generate_report_task, task_id)
    return {"message": "Report generation initiated"}

@app.post("/backend/scan/{task_id}/map")
async def upload_map_snapshot(task_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    task = db.query(ScanTask).filter(ScanTask.id == task_id, ScanTask.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    file_location = f"/app/scans/{task_id}_map.png"
    try:
        with open(file_location, "wb+") as file_object:
            file_object.write(await file.read())
            
        # Optional: Trigger report regeneration automatically?
        # Let's leave it to the explicit trigger or do it here.
        # Ideally, uploading the map should imply "I want it in the report".
        from .tasks import generate_report_task
        if hasattr(generate_report_task, 'delay'):
            try:
                getattr(generate_report_task, 'delay')(task_id) # type: ignore
            except Exception:
                asyncio.get_event_loop().run_in_executor(None, generate_report_task, task_id)
        else:
            asyncio.get_event_loop().run_in_executor(None, generate_report_task, task_id)
        
        return {"message": "Map snapshot saved and report regeneration triggered"}
    except Exception as e:
        print(f"Error saving map: {e}")
        raise HTTPException(status_code=500, detail="Failed to save map snapshot")

@app.get("/backend/scans", response_model=List[ScanTaskResponse])
def list_scans(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    scans = db.query(ScanTask).filter(ScanTask.user_id == user_id).order_by(ScanTask.created_at.desc()).offset(skip).limit(limit).all()
    return scans

@app.get("/backend/stats")
def get_stats(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    total_scans = db.query(ScanTask).filter(ScanTask.user_id == user_id).count()
    completed_scans = db.query(ScanTask).filter(ScanTask.user_id == user_id, ScanTask.status == "COMPLETED").count()
    failed_scans = db.query(ScanTask).filter(ScanTask.user_id == user_id, ScanTask.status == "FAILED").count()
    
    # Calculate high risk vulnerability count (Mock logic based on results)
    # real logic would query specific JSON fields in ScanResult
    # Need to join with ScanTask to filter by user
    vuln_count = db.query(ScanResult).join(ScanTask).filter(ScanTask.user_id == user_id, ScanResult.tool_name == "VulnScanner").count()
    
    return {
        "total_scans": total_scans,
        "completed_scans": completed_scans,
        "failed_scans": failed_scans,
        "vulnerabilities_found": vuln_count * 5 # Placeholder multiplier
    }

@app.delete("/backend/scans/{task_id}")
def delete_scan(task_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    task = db.query(ScanTask).filter(ScanTask.id == task_id, ScanTask.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Delete associated results
    db.query(ScanResult).filter(ScanResult.task_id == task_id).delete()
    db.delete(task)
    db.commit()
    
    # Cleanup Files (Optional - Best Effort)
    try:
        import shutil
        scan_dir = f"/app/scans/{task_id}"
        if os.path.exists(scan_dir):
            shutil.rmtree(scan_dir)
        # Also remove PDF if it exists outside specific folder?
        # Usually it's in /app/scans/{id}/{id}_report.pdf or similar
    except Exception as e:
        print(f"Error cleaning up files for {task_id}: {e}")
        
    return {"message": "Scan deleted"}

@app.get("/backend/targets", response_model=List[TargetSummary])
def list_targets(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    # 1. Get distinct targets
    distinct_targets = db.query(ScanTask.target).filter(ScanTask.user_id == user_id).distinct().all()
    target_names = [t[0] for t in distinct_targets]
    
    summaries = []
    for t_name in target_names:
        # 2. Get stats for each target
        # We want the *latest* scan for risk and date, and count for total
        latest_scan = db.query(ScanTask).filter(ScanTask.user_id == user_id, ScanTask.target == t_name).order_by(ScanTask.created_at.desc()).first()
        count = db.query(ScanTask).filter(ScanTask.user_id == user_id, ScanTask.target == t_name).count()
        
        summary = TargetSummary(
            target=t_name,
            last_scan_at=latest_scan.created_at if latest_scan else None,
            risk_score=latest_scan.risk_score if latest_scan and latest_scan.risk_score else "UNKNOWN",
            total_scans=count,
            latest_scan_id=latest_scan.id if latest_scan else None,
            latest_report_path=latest_scan.pdf_report_path if latest_scan else None
        )
        summaries.append(summary)
        
    return summaries

@app.delete("/backend/targets/{target_name}")
def delete_target(target_name: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    # Delete all tasks associated with this target
    tasks = db.query(ScanTask).filter(ScanTask.user_id == user_id, ScanTask.target == target_name).all()
    if not tasks:
        raise HTTPException(status_code=404, detail="Target not found")
        
    for task in tasks:
        # Optional: Delete associated results first if cascade isn't set up, 
        # but usually SQLAlchemy handles this if configured, or we just leave them orphaned/delete them.
        # Ideally we delete results too.
        db.query(ScanResult).filter(ScanResult.task_id == task.id).delete()
        db.delete(task)
        
    db.commit()
    return {"message": f"Target {target_name} and its history deleted."}

@app.get("/backend/vulnerabilities")
def list_vulnerabilities(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    # Join with ScanTask to get the target
    results = db.query(ScanResult, ScanTask.target)\
        .join(ScanTask, ScanResult.task_id == ScanTask.id)\
        .filter(ScanTask.user_id == user_id)\
        .filter(ScanResult.tool_name == "VulnScanner")\
        .order_by(ScanResult.created_at.desc())\
        .offset(skip).limit(limit).all()
    
    # Format response to include target
    formatted = []
    for res, target in results:
        res_dict = {
            "id": res.id,
            "task_id": res.task_id,
            "tool_name": res.tool_name,
            "result": res.result,
            "created_at": res.created_at,
            "target": target
        }
        formatted.append(res_dict)
        
    return formatted

@app.get("/scans/{file_name:path}")
async def serve_scan_files(file_name: str):
    """Serve generated scan reports and map images (Public, capability URLs)"""
    import os
    # Prevent path traversal
    if ".." in file_name or file_name.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid file path")
        
    file_path = f"/app/scans/{file_name}"
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

# Static Files (Frontend)
if os.path.exists("/app/static"):
    app.mount("/assets", StaticFiles(directory="/app/static/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # API routes are prioritized above this due to order of definition
        # If path is a file in static, serve it? No, specific assets mounts handle that.
        # This catch-all returns index.html for React Router
        if full_path.startswith("api/") or full_path.startswith("scans/"):
            raise HTTPException(status_code=404, detail="Not Found")
            
        file_path = f"/app/static/{full_path}"
        if os.path.exists(file_path) and os.path.isfile(file_path):
             return FileResponse(file_path)
             
        return FileResponse("/app/static/index.html")

@app.get("/")
def read_root():
    if os.path.exists("/app/static/index.html"):
        return FileResponse("/app/static/index.html")
    return {"message": "Welcome to Private PI API. Frontend not found in /app/static."}

# Settings Endpoints
@app.get("/backend/settings", response_model=UserSettingsSchema)
def get_settings(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        # Return default if not exists
        return UserSettingsSchema()
    return settings

@app.post("/backend/settings", response_model=UserSettingsSchema)
def update_settings(request: UserSettingsSchema, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
    
    # Update fields
    if request.shodan_api_key is not None:
        settings.shodan_api_key = request.shodan_api_key
    if request.hibp_api_key is not None:
        settings.hibp_api_key = request.hibp_api_key
    if request.openrouter_api_key is not None:
        settings.openrouter_api_key = request.openrouter_api_key
    if request.openrouter_model is not None:
        settings.openrouter_model = request.openrouter_model
    settings.stealth_mode = 1 if request.stealth_mode else 0
    settings.auto_pdf_report = 1 if request.auto_pdf_report else 0
    
    db.commit()
    db.refresh(settings)

    # Manual mapping back to schema because integer/bool mismatch might occur if Pydantic strict
    return UserSettingsSchema(
        shodan_api_key=settings.shodan_api_key,
        hibp_api_key=settings.hibp_api_key,
        openrouter_api_key=settings.openrouter_api_key,
        openrouter_model=settings.openrouter_model or "google/gemini-pro",
        stealth_mode = bool(settings.stealth_mode),
        auto_pdf_report = bool(settings.auto_pdf_report)
    )

