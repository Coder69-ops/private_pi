# Deployment Guide for EC2

## Prerequisites
- An EC2 instance running (Ubuntu or Amazon Linux 2 recommended).
- SSH access to the instance (key pair).
- Security Group allowing Inbound traffic on ports 22 (SSH) and 80 (HTTP).

## 1. Copy Files to Server
Run the following command from your local machine (where `docker-compose.prod.yml` and `setup_server.sh` are located). Replace `your-key.pem` and `your-ec2-ip` with your actual details.

```bash
# Copy setup script and compose file
scp -i C:\Users\Avijit\Desktop\key\privatepi.pem setup_server.sh docker-compose.prod.yml ubuntu@ip-51.21.218.169:~
```

*Note: If you are using Amazon Linux, the user might be `ec2-user` instead of `ubuntu`.*

## 2. Connect to Server
```bash
ssh -i C:\Users\Avijit\Desktop\key\privatepi.pem ubuntu@51.21.218.169
```

## 3. Run Setup Script
Once inside the server:

```bash
# Make the script executable
chmod +x setup_server.sh

# Run it
./setup_server.sh
```

**IMPORTANT**: After the script finishes, type `exit` to disconnect, then SSH back in. This is required to update your user permissions for Docker.

## 4. Start the Application
After reconnecting:

```bash
# Start the containers
docker compose -f docker-compose.prod.yml up -d
```

## 5. Verify
Run `docker compose -f docker-compose.prod.yml ps` to see running services.
Visit `http://your-ec2-ip` in your browser.

---

## 🚀 Deployment Guide for Coolify (Easiest Method)

Coolify is an open-source, self-hosted Heroku/Vercel alternative that natively supports Git repositories and Docker Compose deployments. This repository is **100% pre-configured** for Coolify!

### 1. Prerequisites 
- You have a Coolify server running (e.g., on a VPS or cloud provider).
- You have pushed this repository to **GitHub, GitLab, or Gitea**.

### 2. Create the Project in Coolify
1. Go to your Coolify Dashboard.
2. Click **Create New Resource** -> **Project** (or select an existing one).
3. Click **Add new resource** -> **Git Repository**.
4. Select your repository provider (e.g., Github App) and choose this repository.

### 3. Configure the Deployment
1. When asked for the Build Pack, choose **Docker Compose**.
2. **Base Directory**: `/` (Leave default).
3. **Docker Compose File path**: `docker-compose.coolify.yml`. *(This specific file is structured for Coolify's proxy logic, with port binding disabled, watchtower removed, and healthchecks configured!)*
4. Click **Save**.

### 4. Set Environment Variables
Go to the **Environment Variables** tab for your new resource in Coolify and add the following keys. *(Coolify will automatically inject them into the containers securely without hardcoding)*:

- `DATABASE_URL`: `postgresql://user:password@db:5432/private_pi` *(Matching the DB below)*
- `POSTGRES_USER`: `user`
- `POSTGRES_PASSWORD`: `password`
- `POSTGRES_DB`: `private_pi`
- `SECRET_KEY`: `your_random_long_secret_key`
- `CORS_ORIGINS`: `*` *(Or put your domain: `https://your-domain.com`)*

### 5. Expose the Domain
1. In the Coolify service settings, find the **`nginx`** container setup block.
2. Under **Domains**, type your custom domain (e.g., `https://pi.yourdomain.com`).
3. Set the internal mapped port to `80`.
4. Coolify will automatically provision an SSL Certificate via Let's Encrypt and trace external proxy traffic correctly to your Nginx gateway!

### 6. Deploy
Hit the **Deploy** button! Coolify handles the multi-stage Docker builds natively from the source and protects the whole stack via its Traefik proxy. 

*Note: Since the app mounts the Docker socket (`/var/run/docker.sock`) to spawn scan containers via Celery workers, ensure your Coolify server's Docker daemon permits socket mounting (it is allowed by default in standard Coolify setups). Watchtower isn't needed here because Coolify has native webhook pipelines for autodeploys!*

### (Firebase Setup)
Since your React Frontend uses Firebase and compiles it via Docker at build-time, you MUST set the following Environment Variables in the **Environment Variables** tab of your Coolify Project BEFORE you click deploy:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID

You can grab these from your Google/Firebase Console!
