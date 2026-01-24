# Panduan Memulai (Getting Started)

Panduan lengkap untuk setup environment development FinLapor di komputer lokal Anda.

---

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Instalasi Tools](#2-instalasi-tools)
3. [Clone Repository](#3-clone-repository)
4. [Setup Database](#4-setup-database)
5. [Setup Backend](#5-setup-backend)
6. [Setup Frontend](#6-setup-frontend)
7. [Menjalankan Aplikasi](#7-menjalankan-aplikasi)
8. [Testing](#8-testing)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prasyarat

### Spesifikasi Minimum

| Komponen | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 4 GB | 8 GB+ |
| Storage | 10 GB | 20 GB+ |
| OS | Windows 10/11, macOS, Linux | - |

### Software yang Dibutuhkan

| Software | Versi | Fungsi |
|----------|-------|--------|
| Node.js | 18+ | Frontend runtime |
| Go | 1.21+ | Backend runtime |
| Docker | 20+ | Database containerization |
| Git | Latest | Version control |
| VS Code | Latest | Code editor (opsional) |

---

## 2. Instalasi Tools

### 2.1 Windows

#### Install Node.js

1. **Buka** https://nodejs.org/
2. **Download** versi LTS (20.x)
3. **Jalankan** installer
4. **Centang** semua opsi default
5. **Verify**:
   ```powershell
   node --version
   # Output: v20.x.x
   
   npm --version
   # Output: 10.x.x
   ```

#### Install Go

1. **Buka** https://go.dev/dl/
2. **Download** `go1.21.x.windows-amd64.msi`
3. **Jalankan** installer
4. **Restart** terminal/PowerShell
5. **Verify**:
   ```powershell
   go version
   # Output: go version go1.21.x windows/amd64
   ```

#### Install Docker Desktop

1. **Buka** https://www.docker.com/products/docker-desktop/
2. **Download** Docker Desktop for Windows
3. **Jalankan** installer
4. **Restart** komputer jika diminta
5. **Buka** Docker Desktop
6. **Tunggu** sampai Docker engine running (icon hijau)
7. **Verify**:
   ```powershell
   docker --version
   # Output: Docker version 24.x.x
   
   docker-compose --version
   # Output: Docker Compose version v2.x.x
   ```

#### Install Git

1. **Buka** https://git-scm.com/download/win
2. **Download** 64-bit installer
3. **Jalankan** installer
4. **Pilih** opsi default (Next terus)
5. **Verify**:
   ```powershell
   git --version
   # Output: git version 2.x.x
   ```

### 2.2 macOS

```bash
# Install Homebrew (jika belum ada)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20

# Install Go
brew install go

# Install Docker Desktop
brew install --cask docker

# Install Git
brew install git

# Verify semua
node --version && npm --version && go version && docker --version && git --version
```

### 2.3 Linux (Ubuntu/Debian)

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Go
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Install Git
sudo apt install git -y

# Verify semua
node --version && npm --version && go version && docker --version && git --version
```

---

## 3. Clone Repository

### 3.1 Via HTTPS

```bash
git clone https://github.com/aan-andiyanaS/finlapor.git
cd finlapor
```

### 3.2 Via SSH (jika sudah setup SSH key)

```bash
git clone git@github.com:aan-andiyanaS/finlapor.git
cd finlapor
```

### 3.3 Struktur Folder

```
finlapor/
├── frontend/          # Next.js frontend
├── backend/           # Go backend
├── ai-service/        # Python Lambda functions
├── database/          # SQL migrations (no seeds - production ready)
├── docs/              # Dokumentasi
├── docker-compose.yml # Docker configuration
├── Makefile           # Automation scripts
└── README.md          # Overview project
```

---

## 4. Setup Database

### 4.1 Menggunakan Docker (Recommended)

```bash
# Pastikan Docker Desktop sudah running

# Start PostgreSQL, Redis, dan MinIO
docker-compose up -d postgres redis minio

# Verifikasi container berjalan
docker ps

# Output yang diharapkan:
# CONTAINER ID   IMAGE              STATUS         PORTS
# xxxx           postgres:16-alpine Up xx seconds  0.0.0.0:5432->5432/tcp
# xxxx           redis:7-alpine     Up xx seconds  0.0.0.0:6379->6379/tcp
# xxxx           minio/minio        Up xx seconds  0.0.0.0:9000-9001->9000-9001/tcp
```

### 4.2 Setup Database

```bash
# Windows PowerShell
Get-Content database\migrations\001_initial.sql | docker exec -i finlapor-postgres-1 psql -U postgres -d finlapor

# Linux/macOS  
docker exec -i finlapor-postgres-1 psql -U postgres -d finlapor < database/migrations/001_initial.sql

# Jika install lokal
psql -U postgres -d finlapor -f database/migrations/001_initial.sql
```

> **Note**: Database akan di-setup dengan schema production-ready **tanpa demo data**. User pertama yang register akan menjadi user baru di sistem. Tidak ada lagi demo user `demo@finlapor.airi.click`.

---

## 5. Setup Backend

### 5.1 Install Dependencies

```bash
cd backend

# Download Go modules
go mod download

# Atau
go mod tidy
```

### 5.2 Konfigurasi Environment

```bash
# Copy template
cp ../.env.example .env

# Edit .env (sesuaikan dengan setup Anda)
# Bisa pakai notepad, VS Code, atau nano
```

**Isi file `.env`:**

```env
# Database
DATABASE_URL=postgres://postgres:password@localhost:5432/finlapor?sslmode=disable
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=finlapor

# Redis
REDIS_URL=redis://localhost:6379

# JWT (ganti dengan string random)
JWT_SECRET=super-secret-jwt-key-change-this-in-production

# Server
PORT=8080
APP_ENV=development

# S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=finlapor

# AI Service (optional - kosongkan untuk mode fallback)
HF_TOKEN=
HF_OCR_MODEL=naver-clova-ix/donut-base-finetuned-cord-v2
HF_LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 5.3 Build Backend

```bash
# Build
go build -o main cmd/server/main.go

# Atau run langsung
go run cmd/server/main.go
```

---

## 6. Setup Frontend

### 6.1 Install Dependencies

```bash
cd frontend

# Install semua packages
npm install

# Ini akan memakan waktu beberapa menit tergantung koneksi internet
```

### 6.2 Konfigurasi Environment

Buat file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 6.3 Build Frontend (Opsional)

```bash
# Untuk production build
npm run build

# Output di folder: out/
```

---

## 7. Menjalankan Aplikasi

### 7.1 Metode 1: Manual (Development)

Buka **3 terminal** terpisah:

**Terminal 1 - Database:**
```bash
cd finlapor
docker-compose up postgres redis minio
```

**Terminal 2 - Backend:**
```bash
cd finlapor/backend
go run cmd/server/main.go

# Output:
# ✅ Connected to PostgreSQL
# ✅ Connected to Redis  
# 🚀 FinLapor API running on port 8080
```

**Terminal 3 - Frontend:**
```bash
cd finlapor/frontend
npm run dev

# Output:
# ▲ Next.js 14.1.0
# - Local: http://localhost:3000
```

### 7.2 Metode 2: Menggunakan Makefile

```bash
# Start semua services
make dev

# Stop semua services
make stop

# Lihat logs
make logs
```

### 7.3 Akses Aplikasi

| Service | URL | Keterangan |
|---------|-----|------------|
| Frontend | http://localhost:3000 | Web application |
| Backend API | http://localhost:8080 | REST API |
| API Health | http://localhost:8080/health | Health check |
| MinIO Console | http://localhost:9001 | File storage (minioadmin/minioadmin) |

---

## 8. Testing

### 8.1 Test Backend API

```bash
# Health check
curl http://localhost:8080/health

# Response:
# {"status":"ok","timestamp":"2026-01-22T..."}

# Register user BARU (tidak ada demo user lagi)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### 8.2 Test Frontend

1. Buka http://localhost:3000
2. Klik **"Daftar"** untuk membuat akun baru
3. Isi form registrasi dengan data valid
4. Setelah register, Anda akan langsung login dan masuk ke dashboard

> **Note**: Tidak ada demo user lagi. Anda harus **register** untuk membuat akun pertama. Ini adalah prodction-ready setup!

### 8.3 Unit Tests

```bash
# Backend tests
cd backend
go test ./...

# Frontend tests
cd frontend
npm test
```

---

## 9. Troubleshooting

### Port sudah digunakan

```bash
# Windows - cari proses yang menggunakan port
netstat -ano | findstr :3000
netstat -ano | findstr :8080

# Kill proses
taskkill /PID [PID_NUMBER] /F

# Linux/macOS
lsof -i :3000
kill -9 [PID]
```

### Docker container tidak start

```bash
# Lihat logs
docker logs finlapor-postgres-1
docker logs finlapor-redis-1

# Restart Docker Desktop

# Hapus dan buat ulang
docker-compose down -v
docker-compose up -d postgres redis minio
```

### Go modules error

```bash
# Clear cache
go clean -modcache

# Re-download
go mod download
```

### npm install error

```bash
# Clear cache
npm cache clean --force

# Hapus node_modules
rm -rf node_modules
rm package-lock.json

# Install ulang
npm install
```

### Database connection refused

1. Pastikan Docker Desktop running
2. Pastikan container postgres running: `docker ps`
3. Cek credentials di `.env`
4. Test koneksi:
   ```bash
   docker exec -it finlapor-postgres-1 psql -U postgres -d finlapor
   ```

### Frontend tidak bisa akses API

1. Pastikan backend running di port 8080
2. Cek CORS di backend
3. Pastikan `NEXT_PUBLIC_API_URL` benar di `.env.local`

---

## Quick Start Commands

```bash
# Clone & setup
git clone https://github.com/aan-andiyanaS/finlapor.git
cd finlapor

# Start database
docker-compose up -d postgres redis minio

# Run migration
Get-Content database\migrations\001_initial.sql | docker exec -i finlapor-postgres-1 psql -U postgres -d finlapor

# Start backend (terminal 1)
cd backend && go run cmd/server/main.go

# Start frontend (terminal 2)
cd frontend && npm install && npm run dev

# Buka browser: http://localhost:3000
# Register user baru - tidak ada demo user!
```

---

## Langkah Selanjutnya

1. 📖 Baca [Architecture](./architecture.md) untuk memahami sistem
2. 📚 Lihat [API Reference](./api-reference.md) untuk endpoints
3. 🚀 Ikuti [Deployment](./deployment.md) untuk deploy ke production
4. 📱 Baca [User Manual](./user-manual.md) untuk cara penggunaan
