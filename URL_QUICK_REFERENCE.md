# 🌐 Private PI - URL Quick Reference

**Domain**: `privatepi.shopsync.studio`

---

## ✅ Frontend & Backend URLs (Configured)

### **Production (Dockploy)**
```
Frontend:    https://privatepi.shopsync.studio
Backend API: https://privatepi.shopsync.studio/api/backend
WebSocket:   wss://privatepi.shopsync.studio/ws
```

### **Development (localhost)**
```
Frontend:    http://localhost:3000
Backend API: http://localhost/api/backend
             (or direct: http://localhost:8000)
WebSocket:   ws://localhost/ws
```

---

## 🔄 Request Flow

```
Frontend Request
  ↓
https://privatepi.shopsync.studio/api/backend/scan
  ↓
nginx reverse proxy (port 443)
  ↓
Strips /api and rewrites to /
  ↓
FastAPI backend (port 8000)
  ↓
Response sent back through nginx
```

---

## 📝 Configuration Files Updated

✅ `frontend/.env` - VITE_API_URL set to `/api/backend`  
✅ `frontend/src/context/AuthContext.jsx` - Uses `/api/backend` endpoint  
✅ `frontend/src/App.jsx` - Uses `/api/backend` for API calls  
✅ `app/main.py` - CORS configured for production domain  
✅ `nginx/nginx.conf` - Routes /api/* to backend, /ws to WebSocket  
✅ `docker-compose.yml` - Supports environment variables  
✅ `.env.production` - Template for production deployment  
✅ **New**: `DOCKPLOY_SETUP.md` - Dockploy deployment guide  
✅ **New**: `URL_AND_DEPLOYMENT_GUIDE.md` - Complete deployment steps  

---

## 🚀 Quick Start Commands

### Local Development
```bash
docker-compose up -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API via nginx: http://localhost/api/backend
```

### Production Dockploy
```bash
# 1. Prepare environment
cp .env.production .env.production.local
# Edit with your values: SECRET_KEY, POSTGRES_PASSWORD, etc.

# 2. Start services
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# 3. Verify
docker-compose ps
curl https://privatepi.shopsync.studio
```

---

## 🔐 What's Secured

- ✅ Frontend uses relative paths (no hardcoded URLs)
- ✅ Backend CORS restricted to domain in production
- ✅ All communication via nginx reverse proxy
- ✅ SSL/HTTPS support (with Let's Encrypt)
- ✅ environment variable based configuration
- ✅ Database and Redis on internal Docker network only

---

## 📊 How Routing Works

| Path | Routed To | Purpose |
|------|-----------|---------|
| `/` | Frontend | React app |
| `/api/backend/*` | Backend /API/* | FastAPI endpoints |
| `/ws` | Backend /ws | WebSocket |
| `/scans/*` | Backend /scans/* | Scan results/files |

---

## ✨ Environment Variables

### Frontend
```
VITE_API_URL=/api/backend
```

### Backend
```
ENVIRONMENT=production (or development)
SECRET_KEY=your-strong-random-key
DATABASE_URL=postgresql://...
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

---

## 🎯 Summary

Your Private PI is now configured for:
- ✅ Domain: `privatepi.shopsync.studio`
- ✅ Frontend: Served at domain root
- ✅ Backend API: At `/api/backend/*`
- ✅ WebSocket: At `/wss` (secure)
- ✅ SSL/HTTPS: Ready for Let's Encrypt
- ✅ Dockploy: Fully compatible
- ✅ Docker Compose: Environment variable support

**Ready to deploy!** 🚀
