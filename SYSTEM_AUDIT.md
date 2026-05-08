# 🔍 Private PI - Complete System Audit (May 9, 2026)

## **System Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
    ┌─────▼────────┐            ┌─────▼────────┐
    │  FRONTEND    │            │   BACKEND    │
    │ (React+Vite)│◄──────────►│  (FastAPI)   │
    └─────┬────────┘            └─────┬────────┘
          │                            │
          │ localStorage               │ PostgreSQL
          │ (JWT token)                │ (User data)
          │                            │
          └────────────────┬───────────┘
                           │
                   ┌───────┴────────┐
                   │                │
              ┌────▼───┐       ┌────▼───┐
              │ Redis  │       │Celery  │
              │(PubSub)│       │(Tasks) │
              └────────┘       └────────┘
```

---

## **Authentication Flow**

### **1. User Registration**
```
Frontend (Login.jsx)
    ↓
POST /backend/register {email, password}
    ↓
Backend (main.py)
  • Hash password with bcrypt
  • Create User record in PostgreSQL
  • Generate JWT token (30 min expiry)
    ↓
Response: {access_token, token_type: "bearer", user_id}
    ↓
Frontend (AuthContext.jsx)
  • Store token in localStorage
  • Store user_id in localStorage
  • Set currentUser = {id, email}
```

### **2. User Login**
```
Frontend (Login.jsx)
    ↓
POST /backend/login {email, password}
    ↓
Backend (main.py)
  • Find user by email
  • Verify password with bcrypt
  • Update last_login timestamp
  • Generate JWT token
    ↓
Response: {access_token, token_type: "bearer", user_id}
    ↓
Frontend stores in localStorage
```

### **3. Protected Requests**
```
Frontend (App.jsx via axios)
    ↓
Include header: Authorization: Bearer {access_token}
    ↓
Backend (main.py)
    ↓
get_current_user() dependency:
  • Extract token from Authorization header
  • Decode JWT using SECRET_KEY
  • Validate exp claim
  • Return user_id
    ↓
Endpoint logic executes with user_id
    ↓
Response to authenticated user only
```

### **4. Token Persistence**
```
App startup (App.jsx)
    ↓
AuthContext.useEffect()
    ↓
Read localStorage for access_token & user_id
    ↓
Validate token with GET /backend/user
    ↓
If valid: set currentUser state
If invalid: clear localStorage, redirect to login
```

---

## **Frontend Architecture**

### **File Structure**
```
frontend/
├── src/
│   ├── App.jsx                 # Main router + app state
│   ├── main.jsx               # React DOM entry
│   ├── index.css              # Tailwind styles
│   ├── firebase.js            # ❌ UNUSED - TO BE REMOVED
│   ├── context/
│   │   ├── AuthContext.jsx    # ✅ Custom JWT auth (email/password)
│   │   └── ToastContext.jsx   # Toast notifications
│   ├── components/
│   │   ├── Login.jsx          # Register/Login forms
│   │   ├── Dashboard.jsx      # Main dashboard
│   │   ├── NewScan.jsx        # Scan creation form
│   │   ├── ScanHistory.jsx    # User's past scans
│   │   ├── Targets.jsx        # Target management
│   │   ├── Vulnerabilities.jsx # Vulnerability list
│   │   ├── Settings.jsx       # API key + preferences
│   │   └── legal/             # Privacy, Terms, Ethics docs
│   └── utils/
│       ├── apiClient.js       # Axios instance (interceptors)
│       ├── formatters.js      # Data formatting
│       ├── exporters.js       # PDF/CSV export
│       └── parsers.js         # Response parsing
```

### **Key Files & Responsibilities**

| File | Purpose | Status |
|------|---------|--------|
| `AuthContext.jsx` | Handle JWT auth, token storage, login/signup | ✅ Working |
| `Login.jsx` | Registration + login forms | ✅ Working |
| `App.jsx` | Router, protected routes, WebSocket, app state | ⚠️ Has stale Firebase code |
| `firebase.js` | Firebase initialization | ❌ NOT USED - DEAD CODE |
| `package.json` | Dependencies | ⚠️ Has unused firebase package |

---

## **Backend Architecture**

### **File Structure**
```
app/
├── main.py            # FastAPI app + endpoints
├── models.py          # SQLAlchemy ORM models
├── schemas.py         # Pydantic validation schemas
├── database.py        # Database connection
├── tasks.py           # Celery tasks (scanning)
└── __init__.py        # Package init (just created)
```

### **Key Models**

```python
User
├── id (UUID)
├── email (unique)
├── password_hash (bcrypt)
├── created_at
└── last_login

ScanTask
├── id (UUID)
├── user_id (FK → User) ✅ Multi-tenant
├── target
├── scan_type
├── status (PENDING, RUNNING, COMPLETED, FAILED)
├── results (relationship)
└── created_at

ScanResult
├── id
├── task_id (FK → ScanTask)
├── tool_name
├── result (JSON)
└── created_at
```

### **Key Endpoints**

#### **Authentication**
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/backend/register` | ❌ None | Create user account |
| POST | `/backend/login` | ❌ None | Get JWT token |
| GET | `/backend/user` | ✅ Required | Get current user info |

#### **Scans (Protected)**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/backend/scan` | Create new scan task |
| GET | `/backend/scans` | List user's scans |
| GET | `/backend/scan/{id}` | Get scan details |
| POST | `/backend/scan/{id}/report` | Generate PDF report |
| DELETE | `/backend/scans/{id}` | Delete scan |

#### **Other (Protected)**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/backend/targets` | Get unique targets |
| GET | `/backend/stats` | Dashboard statistics |
| GET | `/backend/vulnerabilities` | All vulns across scans |
| GET/POST | `/backend/settings` | User API key storage |
| WS | `/ws?uid={user_id}` | Real-time scan updates |

---

## **Security Analysis**

### **✅ Currently Implemented**
- Bcrypt password hashing (salt rounds: bcrypt.gensalt())
- JWT tokens with expiration (30 minutes)
- HTTPBearer token validation
- User isolation (all queries filtered by user_id)
- CORS configured for dev
- Database password stored hashed

### **⚠️ Needs Attention**
- Default SECRET_KEY fallback ("your-secret-key-change-in-production")
- No refresh token mechanism (users lose session after 30 min)
- No email verification for registration
- No password strength validation (only length check: 6+ chars)
- CORS set to `allow_origins=["*"]` in dev (fine for now)
- No rate limiting on auth endpoints

### **❌ Removed/Unused**
- Firebase authentication (no longer needed)
- Google OAuth (currently throws "not available" error)

---

## **Data Flow Examples**

### **Example: Creating a Scan**
```
1. User clicks "New Scan" button in UI
   └─ NewScan.jsx component renders form

2. User submits form with target="example.com"
   └─ Frontend: POST /backend/scan
   └─ Headers: Authorization: Bearer {jwt_token}
   └─ Body: {target, scan_type, has_permission}

3. Backend receives request
   └─ get_current_user() validates JWT
   └─ Returns user_id
   └─ create_scan() function executes
   └─ Creates ScanTask with user_id = request.user
   └─ Sends to Celery queue

4. Celery worker picks up task
   └─ Runs perform_scan.delay()
   └─ Executes security scanning tools
   └─ Publishes updates to Redis: scan_updates channel
   └─ Saves results to ScanResult table

5. Frontend WebSocket listener
   └─ Connected to /ws?uid={user_id}
   └─ Receives real-time messages from Redis
   └─ Updates LiveConsole with progress
   └─ When complete, fetches ScanResult

6. User views results in ScanResults.jsx
   └─ GET /backend/scan/{task_id}
   └─ Backend verifies user_id matches
   └─ Returns scan data with results
```

### **Example: WebSocket Update**
```
1. Celery task updates Redis
   └─ redis_client.publish("scan_updates", json_msg)

2. Redis broadcasts to all subscribers
   └─ App.jsx WebSocket connected to /ws

3. Frontend receives message
   └─ ws.onmessage event fires
   └─ Parses JSON data
   └─ Updates UI with scan progress/results

4. User sees real-time logs in LiveConsole
   └─ "[VulnScanner] Found 5 vulnerabilities"
   └─ "[NetworkMapper] Mapping complete"
```

---

## **Current Issues**

### **Critical** 🔴
- None currently (all auth fixes applied)

### **Medium** ⚠️
1. **Firebase Dead Code**
   - `firebase.js` not imported anywhere
   - `package.json` includes unused firebase package (~100KB)
   - `App.jsx` references `currentUser.uid` (doesn't exist)
   - `App.jsx` sends X-Firebase-UID header (wrong)

2. **Default SECRET_KEY**
   - Falls back to test key if env var not set
   - Will expose security warning on startup

### **Low** ℹ️
1. **PrivacyPolicy outdated**
   - Still mentions Firebase
   - Should reference custom JWT auth

2. **CORS too permissive**
   - Fine for dev, should restrict origins in production

---

## **What's Ready to Test**

✅ User Registration
✅ User Login
✅ JWT Token Validation
✅ Protected Endpoints
✅ Token Expiration (30 min)
✅ Multi-tenant Data Isolation
✅ Real-time WebSocket Updates
✅ Scan Creation & Tracking

---

## **Recommendations**

### **Before Production**
1. ✅ Remove Firebase completely
2. ✅ Fix App.jsx stale code
3. ⚠️ Implement refresh token mechanism
4. ⚠️ Add email verification
5. ⚠️ Improve password strength validation
6. ⚠️ Add auth rate limiting
7. ⚠️ Update PrivacyPolicy documentation

### **In Next Phase**
- [ ] Implement refresh tokens (long-lived auth)
- [ ] Add email verification flow
- [ ] Add password reset functionality
- [ ] Add 2FA/MFA support
- [ ] Implement API key auth (for CLI use)
- [ ] Add audit logging for auth events
