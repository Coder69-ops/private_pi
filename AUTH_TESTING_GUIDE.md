# 🔐 Custom Auth Testing Guide

## ✅ Fixes Applied
- ✅ FastAPI app instantiation added
- ✅ CORS middleware configured (allows localhost for dev)
- ✅ Database tables auto-initialization on startup
- ✅ JWT token generation & verification ready
- ✅ User registration & login endpoints active
- ✅ Protected endpoints with `get_current_user` dependency

---

## 🚀 Quick Start (Docker Compose)

### 1. Start All Services
```bash
cd private_pi
docker-compose up -d
```

Services will be available at:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 2. Check Logs
```bash
# Backend logs (FastAPI startup)
docker-compose logs web

# Check for migration/DB init messages
docker-compose logs db
```

---

## 🧪 Test Auth Flow

### **Step 1: Register New User**
```bash
curl -X POST "http://localhost:8000/backend/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Save the `access_token` and `user_id` for next steps!**

---

### **Step 2: Get Current User (Protected Endpoint)**
```bash
curl -X GET "http://localhost:8000/backend/user" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "testuser@example.com",
  "created_at": "2026-05-09T10:30:00.000000"
}
```

---

### **Step 3: Login with Credentials**
```bash
curl -X POST "http://localhost:8000/backend/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### **Step 4: Test Token Expiration**
JWTs expire after **30 minutes** (configured in main.py).

To test expired token rejection:
```bash
# Wait 30 minutes or modify ACCESS_TOKEN_EXPIRE_MINUTES in app/main.py to 1 minute
curl -X GET "http://localhost:8000/backend/user" \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

**Expected Error:**
```json
{
  "detail": "Token has expired"
}
```

---

## 🌐 Test via Frontend UI

1. **Open Frontend**: http://localhost:3000
2. **Click "NEW OPERATOR"** (Register tab)
3. **Enter credentials:**
   - Email: `testuser@example.com`
   - Password: `password123`
   - Confirm: `password123`
4. **Click "DEPLOY ACCESS"**
5. **Should redirect to Dashboard** after successful registration

---

## 📊 Test Protected Endpoints

### Create a Scan (Requires Auth)
```bash
curl -X POST "http://localhost:8000/backend/scan" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "example.com",
    "scan_type": "full",
    "has_permission": true
  }'
```

### List User's Scans (Requires Auth)
```bash
curl -X GET "http://localhost:8000/backend/scans" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get User Stats (Requires Auth)
```bash
curl -X GET "http://localhost:8000/backend/stats" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔍 Verify in Database

### Connect to PostgreSQL
```bash
docker-compose exec db psql -U user -d private_pi
```

### Check Users Table
```sql
SELECT id, email, created_at, last_login FROM users;
```

### Check Hashed Passwords
```sql
SELECT id, email, password_hash FROM users LIMIT 1;
```

---

## ⚙️ Configuration

### Change Token Expiration
Edit [app/main.py](app/main.py#L29):
```python
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Change from 30 to 60 minutes
```

### Change SECRET_KEY
Edit [.env](.env):
```bash
SECRET_KEY=your-new-random-secret-key-here
```

### Restrict CORS Origins
Edit [app/main.py](app/main.py#L35):
```python
allow_origins=["http://localhost:3000", "https://yourdomain.com"],
```

---

## ⚠️ Common Issues

### **Issue: "Invalid authentication token"**
- Token is malformed or tampered with
- Token from different SECRET_KEY
- Solution: Register/login again to get new token

### **Issue: "Token has expired"**
- More than 30 minutes have passed
- Solution: Login again to get new token

### **Issue: "Email already registered"**
- Try logging in instead of registering
- Or use a different email address

### **Issue: CORS blocked from frontend**
- Check docker logs: `docker-compose logs web`
- CORS is set to `allow_origins=["*"]` in dev mode
- In production, update to specific origin

### **Issue: Database connection failed**
- Ensure db service is running: `docker-compose logs db`
- Check DATABASE_URL in .env matches service config
- Verify postgres port 5432 is available

---

## 🚀 Ready to Push?

**Checklist:**
- ✅ App starts without import errors
- ✅ User registration works
- ✅ User login works  
- ✅ Protected endpoints require valid token
- ✅ Token expiration works
- ✅ Frontend can authenticate users
- ✅ Database persists user data

**Once all tests pass**, you're good for a git push and deployment test!

---

## 📝 Next Steps
1. Test all endpoints above
2. Verify frontend auth flows
3. Check logs for any warnings
4. Once stable, commit and push
5. Deploy to staging/production
