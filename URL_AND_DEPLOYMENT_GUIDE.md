# 🌐 Private PI - URL Configuration & Deployment Guide

**Domain**: `privatepi.shopsync.studio`
**Deployment**: Dockploy with Docker Compose
**Date**: May 9, 2026

---

## 📍 Service URLs

### **Production (Dockploy)**

| Service | URL | Protocol | Notes |
|---------|-----|----------|-------|
| **Frontend** | https://privatepi.shopsync.studio | HTTPS | Main UI |
| **Backend API** | https://privatepi.shopsync.studio/api/backend | HTTPS | All API calls |
| **WebSocket** | wss://privatepi.shopsync.studio/ws | WSS | Real-time updates |
| **Swagger Docs** | https://privatepi.shopsync.studio/api/backend/docs | HTTPS | API documentation |

### **Development (localhost)**

| Service | URL | Protocol | Notes |
|---------|-----|----------|-------|
| **Frontend** | http://localhost:3000 | HTTP | Dev server |
| **Backend API** | http://localhost:8000 | HTTP | Direct FastAPI |
| **API via nginx** | http://localhost/api/backend | HTTP | Through proxy |
| **WebSocket** | ws://localhost/ws | WS | Via nginx |
| **Swagger Docs** | http://localhost:8000/docs | HTTP | API documentation |

---

## 🔧 Configuration Files

### Development Setup
```bash
# Use default .env
docker-compose up -d

# Frontend env variables:
# - VITE_API_URL=/api/backend (relative path)
# - CHOKIDAR_USEPOLLING=true (for Docker)

# Backend env variables:
# - ENVIRONMENT=development
# - CORS allows all origins (*)
```

### Production Setup (Dockploy)
```bash
# Copy environment file
cp .env.production .env.production.local
# Edit with your actual values:
# - SECRET_KEY (strong random)
# - POSTGRES_PASSWORD (strong)
# - DOMAIN (your domain)

# Start with production compose
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# Or use environment variables directly
export ENVIRONMENT=production
export SECRET_KEY=your-strong-key
export POSTGRES_PASSWORD=strong-password
docker-compose up -d
```

---

## 🚀 Deployment to Dockploy

### **Step 1: Prepare Your Server**

```bash
# SSH into your server
ssh your-server

# Create app directory
mkdir -p /opt/private-pi
cd /opt/private-pi

# Clone or upload your code
git clone <your-repo> .
# OR
# scp -r ./private_pi/* user@server:/opt/private-pi/
```

### **Step 2: Set Up Environment Variables**

```bash
# Create production env file
cat > .env.production << EOF
ENVIRONMENT=production
DOMAIN=privatepi.shopsync.studio
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
POSTGRES_USER=private_pi_user
POSTGRES_PASSWORD=$(openssl rand -base64 24)
POSTGRES_DB=private_pi
VITE_API_URL=/api/backend
EOF

# Secure the file
chmod 600 .env.production
```

### **Step 3: Configure SSL Certificate**

```bash
# Using Let's Encrypt (recommended)
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot certonly --standalone \
  -d privatepi.shopsync.studio \
  -d www.privatepi.shopsync.studio \
  --email your-email@example.com \
  --agree-tos

# Copy certificates to app directory
sudo cp /etc/letsencrypt/live/privatepi.shopsync.studio/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/privatepi.shopsync.studio/privkey.pem ./nginx/ssl/key.pem
sudo chown $(whoami):$(whoami) ./nginx/ssl/*
```

### **Step 4: Configure nginx for HTTPS**

Update `nginx/nginx.conf`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name privatepi.shopsync.studio www.privatepi.shopsync.studio;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name privatepi.shopsync.studio www.privatepi.shopsync.studio;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Rest of server block...
```

### **Step 5: Update CORS in Backend**

The backend (`app/main.py`) automatically configures CORS based on `ENVIRONMENT`:

```python
# In production mode (ENVIRONMENT=production):
allowed_origins = [
    "https://privatepi.shopsync.studio",
    "https://www.privatepi.shopsync.studio",
]

# In development mode:
allowed_origins = ["*"]
```

### **Step 6: Start Services with Dockploy**

```bash
# Using Dockploy's Docker Compose integration
dockploy compose up -d

# Or manually with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Verify all services are running
docker-compose ps

# Check logs
docker-compose logs -f nginx
docker-compose logs -f web
```

### **Step 7: Verify Deployment**

```bash
# 1. Check frontend is accessible
curl -I https://privatepi.shopsync.studio

# 2. Check API is accessible
curl -I https://privatepi.shopsync.studio/api/backend/

# 3. Test API endpoint
curl https://privatepi.shopsync.studio/api/backend/

# 4. Check SSL certificate
openssl s_client -connect privatepi.shopsync.studio:443

# 5. View application logs
docker-compose logs web
docker-compose logs frontend
```

---

## 🔄 Automatic Certificate Renewal

Create a renewal script:

```bash
#!/bin/bash
# /opt/private-pi/renew-certificates.sh

echo "Renewing certificates..."
sudo certbot renew --quiet

# Copy new certificates
sudo cp /etc/letsencrypt/live/privatepi.shopsync.studio/fullchain.pem /opt/private-pi/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/privatepi.shopsync.studio/privkey.pem /opt/private-pi/nginx/ssl/key.pem
sudo chown $(whoami):$(whoami) /opt/private-pi/nginx/ssl/*

# Reload nginx
docker-compose exec nginx nginx -s reload

echo "Certificate renewal complete"
```

Add to crontab:
```bash
crontab -e
# Add line:
0 3 1 * * /opt/private-pi/renew-certificates.sh
```

---

## 📊 Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Users (Internet)                      │
└─────────────────────┬───────────────────────────────────┘
                      │ https://privatepi.shopsync.studio
                      ▼
        ┌─────────────────────────────────┐
        │    Dockploy Reverse Proxy       │
        │  (or standalone nginx:80/443)   │
        └─────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
   ┌─────────┐            ┌──────────────────┐
   │Frontend │            │  Backend API     │
   │ (React) │            │  (FastAPI)       │
   │ :3000   │            │  :8000           │
   └─────────┘            └──────────────────┘
        │                           │
        │                      ┌────┴────┬──────────┐
        │                      │         │          │
        ▼                      ▼         ▼          ▼
    ┌────────┐            ┌────────┬────────┐  ┌────────┐
    │  nginx │            │  DB    │ Redis  │  │ Celery │
    │:80/443 │            │ :5432  │ :6379  │  │ Worker │
    └────────┘            └────────┴────────┘  └────────┘
```

---

## 🔒 Security Configuration

### Frontend (.env)
```bash
VITE_API_URL=/api/backend  # Relative path, no credentials exposure
```

### Backend (app/main.py)
```python
# CORS configured per environment
if environment == "production":
    allowed_origins = ["https://privatepi.shopsync.studio", ...]
else:
    allowed_origins = ["*"]  # Dev only
```

### Docker Compose
```yaml
# All services on internal network (privatepi)
networks:
  privatepi:
    driver: bridge
# Only nginx exposed to public
ports:
  - "80:80"
  - "443:443"
```

---

## 📈 Performance & Monitoring

### Monitor Service Health
```bash
# Check all services
docker-compose ps

# View resource usage
docker stats

# Check specific service logs
docker-compose logs nginx
docker-compose logs web
docker-compose logs db
```

### Database Health
```bash
# Connect to database
docker-compose exec db psql -U private_pi_user -d private_pi

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Verify users table
SELECT id, email, created_at FROM users;
```

---

## 🚨 Troubleshooting

### "502 Bad Gateway"
- Check backend is running: `docker-compose ps web`
- Check logs: `docker-compose logs web`
- Verify database connection

### "CORS Error"
- Verify `ENVIRONMENT=production` is set
- Check domain matches in CORS settings
- Ensure frontend uses `/api/backend` prefix

### "SSL Certificate Error"
- Verify certificate files exist: `ls -la nginx/ssl/`
- Check certificate validity: `openssl x509 -in nginx/ssl/cert.pem -text -noout`
- Renew if needed: `sudo certbot renew --force-renewal`

### "WebSocket Connection Failed"
- Check nginx config has WebSocket headers
- Verify `proxy_set_header Upgrade`
- Check logs: `docker-compose logs nginx`

---

## ✅ Deployment Checklist

- [ ] Domain DNS configured (points to server IP)
- [ ] SSL certificate obtained
- [ ] `.env.production` file created with strong passwords
- [ ] `SECRET_KEY` is random and strong (32+ chars)
- [ ] `ENVIRONMENT=production` set
- [ ] nginx.conf has correct domain name
- [ ] All services start without errors: `docker-compose ps`
- [ ] Frontend loads: `curl https://privatepi.shopsync.studio`
- [ ] API responds: `curl https://privatepi.shopsync.studio/api/backend/`
- [ ] SSL certificate is valid: `openssl s_client -connect privatepi.shopsync.studio:443`
- [ ] Database is initialized: `docker-compose exec db psql -l`
- [ ] Registration works: `curl -X POST https://.../api/backend/register ...`

---

## 📞 Support

**Issue**: Services won't start
```bash
docker-compose logs
docker-compose ps
docker-compose restart
```

**Issue**: Frontend can't reach API
- Check `.env` has `VITE_API_URL=/api/backend`
- Rebuild frontend: `docker-compose build frontend`
- Check nginx logs: `docker-compose logs nginx`

**Issue**: Database connection failed
- Verify credentials in `.env.production`
- Check database is running: `docker-compose ps db`
- View database logs: `docker-compose logs db`

---

**Your Private PI instance is ready for production!** 🚀
