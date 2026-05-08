# Dockploy Configuration for Private PI

## Domain Setup
Domain: `privatepi.shopsync.studio`

## Service URLs

### Frontend
- **URL**: https://privatepi.shopsync.studio
- **Port** (internal): 3000
- **Served via**: nginx reverse proxy

### Backend API
- **URL**: https://privatepi.shopsync.studio/api/backend
- **Port** (internal): 8000
- **WebSocket**: wss://privatepi.shopsync.studio/ws

### Database
- **Host**: db (internal Docker network)
- **Port**: 5432
- **Name**: private_pi
- **User**: (from .env)
- **Password**: (from .env)

### Redis
- **Host**: redis (internal Docker network)
- **Port**: 6379

---

## 🚀 Deployment Steps for Dockploy

### 1. Prepare Environment Variables

Create `.env.production` on your server:

```bash
# Application
ENVIRONMENT=production
SECRET_KEY=your-very-long-random-secret-key-here-min-32-chars

# Database
POSTGRES_USER=private_pi_user
POSTGRES_PASSWORD=your-strong-db-password-here
POSTGRES_DB=private_pi

# Security
DOMAIN=privatepi.shopsync.studio

# Redis (use defaults in compose)
# REDIS_HOST=redis
# REDIS_PORT=6379
```

### 2. Use Correct Docker Compose File

For **development** (localhost):
```bash
docker-compose up -d
```

For **production** with Dockploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Update Dockploy Compose File

If using `docker-compose.prod.yml`, update it to include:

```yaml
version: '3.8'
services:
  web:
    build: .
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    # ... rest of config
```

### 4. SSL/HTTPS Certificate

If using Let's Encrypt (recommended):

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d privatepi.shopsync.studio -d www.privatepi.shopsync.studio

# Certificates will be at:
# /etc/letsencrypt/live/privatepi.shopsync.studio/fullchain.pem
# /etc/letsencrypt/live/privatepi.shopsync.studio/privkey.pem
```

### 5. Update nginx.conf for HTTPS

Uncomment and update in `nginx/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name privatepi.shopsync.studio www.privatepi.shopsync.studio;

    ssl_certificate /etc/letsencrypt/live/privatepi.shopsync.studio/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/privatepi.shopsync.studio/privkey.pem;
    
    # Rest of config...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name privatepi.shopsync.studio www.privatepi.shopsync.studio;
    return 301 https://$server_name$request_uri;
}
```

### 6. Volume Mounts for Dockploy

If using Dockploy with volumes:

```yaml
volumes:
  - /etc/letsencrypt:/etc/nginx/ssl:ro  # SSL certificates
  - postgres_data:/var/lib/postgresql/data
  - redis_data:/data
  - scan_data:/app/scans
```

---

## 📋 Dockploy Labels (Optional)

Add to docker-compose for service discovery:

```yaml
services:
  web:
    labels:
      traefik.enable: "true"
      traefik.http.routers.privatepi.rule: "Host(`privatepi.shopsync.studio`)"
      traefik.http.routers.privatepi.entrypoints: "websecure"
      traefik.http.routers.privatepi.tls.certresolver: "letsencrypt"
      traefik.http.services.privatepi.loadbalancer.server.port: "8000"
```

---

## 🔧 Health Checks

Services have health checks configured:

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]  # Redis
  interval: 10s
  timeout: 5s
  retries: 5
```

Monitor with:
```bash
docker-compose ps  # Shows health status
docker stats       # Shows resource usage
```

---

## 📊 Port Mapping

| Service | Internal Port | Mapped Port | Notes |
|---------|---------------|-------------|-------|
| Frontend | 3000 | - | Behind nginx only |
| Backend | 8000 | - | Behind nginx only |
| nginx | 80, 443 | 80, 443 | Public facing |
| PostgreSQL | 5432 | - | Internal network only |
| Redis | 6379 | - | Internal network only |

---

## 🔐 Security Checklist

- [ ] Set strong `SECRET_KEY` (min 32 chars)
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Update `ENVIRONMENT=production`
- [ ] Install SSL certificate (Let's Encrypt)
- [ ] Configure firewall (only 80, 443 open)
- [ ] Enable nginx security headers
- [ ] Set up automated certificate renewal
- [ ] Configure database backups
- [ ] Set up monitoring/alerting
- [ ] Enable log rotation

---

## 🔄 Continuous Deployment with Dockploy

### Watchtower (Auto-update)
If using watchtower in compose:

```yaml
watchtower:
  image: containrrr/watchtower
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  command: --interval 3600 --cleanup  # Check every hour
```

### Manual Updates
```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose build

# Restart services
docker-compose up -d
```

---

## 📝 Environment Variables Reference

### Backend Environment
```
ENVIRONMENT=production              # or development
SECRET_KEY=<strong-random-key>
DATABASE_URL=postgresql://...
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

### Frontend Environment
```
VITE_API_URL=/api/backend           # Relative path (behind nginx)
```

### Database Environment
```
POSTGRES_USER=<username>
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=private_pi
```

---

## 🚨 Troubleshooting

### "Connection Refused"
- Check if all services are running: `docker-compose ps`
- Check logs: `docker-compose logs nginx`
- Verify network: `docker network ls`

### "CORS Error"
- Backend CORS is set to domain in production
- Check `ENVIRONMENT` is set to `production`
- Verify domain matches exactly

### "SSL Certificate Error"
- Ensure certificate files are mounted correctly
- Check certificate validity: `openssl x509 -in cert.pem -text -noout`
- Renew if expired: `sudo certbot renew`

### "Database Connection Failed"
- Check database is running: `docker-compose ps db`
- Verify credentials in `.env.production`
- Check logs: `docker-compose logs db`

---

## 📚 Useful Commands

```bash
# View logs
docker-compose logs -f nginx
docker-compose logs -f web
docker-compose logs -f db

# Execute command in container
docker-compose exec web bash
docker-compose exec db psql -U user -d private_pi

# Restart service
docker-compose restart nginx

# Remove and recreate
docker-compose up -d --force-recreate

# Clean up everything
docker-compose down -v  # -v removes volumes too
```

---

## ✅ Verification Checklist

After deployment:

```bash
# 1. Check all services are running
docker-compose ps

# 2. Test frontend
curl https://privatepi.shopsync.studio

# 3. Test API
curl https://privatepi.shopsync.studio/api/backend/

# 4. Check SSL certificate
curl -vI https://privatepi.shopsync.studio

# 5. View logs for errors
docker-compose logs

# 6. Test auth endpoints
curl -X POST https://privatepi.shopsync.studio/api/backend/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

**Your deployment is ready for Dockploy!** 🎉
