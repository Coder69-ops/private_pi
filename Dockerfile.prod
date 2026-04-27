# Stage 1: Build Frontend
FROM node:18-alpine AS builder

WORKDIR /app/frontend

# Copy package.json and lockfile
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY frontend/ .

# Build for production
RUN npm run build

# Stage 2: Setup Backend
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY app/ ./app/

# Copy Built Frontend from Stage 1 to /app/static
COPY --from=builder /app/frontend/dist /app/static

# Expose port
EXPOSE 8000

# Run Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
