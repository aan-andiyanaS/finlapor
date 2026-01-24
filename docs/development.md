# Panduan Development Lokal FinLapor

Panduan lengkap untuk menjalankan FinLapor di environment lokal menggunakan Docker.

> 📌 **Perbedaan dengan Production**: Development menggunakan PostgreSQL dan Redis via Docker, sedangkan Production menggunakan AWS RDS dan ElastiCache.

---

## Daftar Isi

1. [Persiapan & Prerequisites](#1-persiapan--prerequisites)
2. [Clone Repository](#2-clone-repository)
3. [Setup Database (Docker)](#3-setup-database-docker)
4. [Setup Backend](#4-setup-backend)
5. [Setup Frontend](#5-setup-frontend)
6. [Verifikasi & Testing](#6-verifikasi--testing)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Persiapan & Prerequisites

### 1.1 Tools yang Dibutuhkan

| Tool | Version | Cara Install | Verifikasi |
|------|---------|--------------|------------|
| **Node.js** | 18+ | https://nodejs.org | `node --version` |
| **Go** | 1.21+ | https://go.dev | `go version` |
| **Docker** | 20+ | https://docker.com | `docker --version` |
| **Docker Compose** | 2.0+ | Termasuk dalam Docker Desktop | `docker compose version` |
| **Git** | 2.0+ | https://git-scm.com | `git --version` |

### 1.2 Verifikasi Semua Tools

```bash
# Jalankan semua perintah ini
node --version    # Output: v18.x.x atau lebih tinggi
go version        # Output: go1.21.x atau lebih tinggi
docker --version  # Output: Docker version 20.x.x
docker compose version  # Output: Docker Compose version v2.x.x
git --version     # Output: git version 2.x.x
```

#### 🔧 Troubleshooting Prerequisites:

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| `node: command not found` | Node.js belum di-install | Download dari nodejs.org |
| `go: command not found` | Go belum di-install | Download dari go.dev |
| `docker: command not found` | Docker belum di-install | Install Docker Desktop |
| Docker error "permission denied" | User bukan docker group | `sudo usermod -aG docker $USER` lalu logout/login |
| Docker error "Cannot connect to daemon" | Docker service tidak jalan | Start Docker Desktop atau `sudo systemctl start docker` |

---

## 2. Clone Repository

```bash
# Clone repository
git clone https://github.com/aan-andiyanaS/finlapor.git
cd finlapor

# Lihat struktur folder
ls -la
```

**Struktur yang diharapkan:**
```
finlapor/
├── frontend/       # Next.js application
├── backend/        # Go Fiber API
├── ai-service/     # Python Lambda (opsional untuk local)
├── database/       # SQL migrations
├── docs/           # Documentation
└── docker-compose.yml
```

#### 🔧 Troubleshooting Clone:

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Permission denied (publickey) | SSH key belum di-setup | Gunakan HTTPS: `git clone https://...` |
| Repository not found | URL salah atau private | Pastikan URL benar dan ada akses |
| SSL certificate problem | Firewall/proxy | `git config --global http.sslVerify false` (sementara) |

---

## 3. Setup Database (Docker)

### 3.1 Start PostgreSQL dan Redis

```bash
# Dari root folder finlapor
docker compose up -d postgres redis

# Tunggu 10 detik untuk startup
sleep 10

# Verifikasi container berjalan
docker ps
```

**Output yang diharapkan:**
```
CONTAINER ID   IMAGE         STATUS          PORTS                    NAMES
xxxx           postgres:16   Up 10 seconds   0.0.0.0:5432->5432/tcp   finlapor-postgres-1
xxxx           redis:7       Up 10 seconds   0.0.0.0:6379->6379/tcp   finlapor-redis-1
```

### 3.2 Run Migration

**Windows (PowerShell):**
```powershell
Get-Content database\migrations\001_initial.sql | docker exec -i finlapor-postgres-1 psql -U postgres -d finlapor
```

**Linux/Mac:**
```bash
cat database/migrations/001_initial.sql | docker exec -i finlapor-postgres-1 psql -U postgres -d finlapor
```

### 3.3 Verifikasi Database

```bash
# Masuk ke PostgreSQL
docker exec -it finlapor-postgres-1 psql -U postgres -d finlapor

# Di dalam psql, jalankan:
\dt

# Output yang diharapkan: list tabel (users, transactions, categories, dll)
# Keluar dengan: \q
```

#### 🔧 Troubleshooting Database:

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Container not running | Docker compose gagal | `docker compose logs postgres` untuk lihat error |
| Connection refused port 5432 | Port sudah dipakai | Matikan PostgreSQL lokal atau ganti port |
| Database "finlapor" does not exist | Database belum dibuat | `docker exec -it finlapor-postgres-1 psql -U postgres -c "CREATE DATABASE finlapor;"` |
| Permission denied | Volume permission | `docker compose down -v` lalu `docker compose up -d` |
| Migration error "table exists" | Sudah pernah di-migrate | Skip atau drop database dan ulang |

---

## 4. Setup Backend

### 4.1 Konfigurasi Environment

```bash
cd backend

# Copy template environment
cp .env.example .env

# Edit file .env (gunakan editor pilihan Anda)
# Windows: notepad .env
# Linux/Mac: nano .env
```

### 4.2 Isi File .env

```bash
# Database (Docker local)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/finlapor?sslmode=disable

# Redis (Docker local)
REDIS_URL=redis://localhost:6379

# JWT Secret (WAJIB GANTI untuk production)
JWT_SECRET=development-secret-key-min-32-chars-here

# App Config
PORT=8080
APP_ENV=development

# S3/MinIO (opsional untuk local - bisa skip dulu)
# S3_ENDPOINT=http://localhost:9000
# S3_ACCESS_KEY=minioadmin
# S3_SECRET_KEY=minioadmin
# S3_BUCKET=finlapor-local
```

### 4.3 Install Dependencies & Run

```bash
# Download Go dependencies
go mod download

# Run backend
go run cmd/server/main.go
```

**Output sukses:**
```
 ┌───────────────────────────────────────────────────┐
 │                   Fiber v2.x.x                    │
 │               http://127.0.0.1:8080               │
 │                                                   │
 │ Handlers ............ xx  Processes ........... 1 │
 │ Prefork ....... Disabled  PID .............. xxxx │
 └───────────────────────────────────────────────────┘
```

### 4.4 Test Backend

```bash
# Buka terminal baru, test health endpoint
curl http://localhost:8080/health

# Output: {"status":"ok"}
```

#### 🔧 Troubleshooting Backend:

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| `go: command not found` | Go tidak di PATH | Restart terminal atau add ke PATH |
| `cannot find package` | Dependencies belum download | `go mod download` |
| `connection refused to postgres` | Database tidak jalan | `docker ps` cek container |
| `address already in use :8080` | Port sudah dipakai | Kill proses: `lsof -i :8080` atau ganti PORT di .env |
| `FATAL: password authentication failed` | Password salah | Cek DATABASE_URL di .env |

---

## 5. Setup Frontend

### 5.1 Install Dependencies

```bash
# Buka terminal baru
cd frontend

# Install npm packages
npm install
```

### 5.2 Konfigurasi Environment (Opsional)

```bash
# Buat file .env.local jika perlu override
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
```

### 5.3 Run Development Server

```bash
npm run dev
```

**Output sukses:**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in x.xs
```

### 5.4 Buka di Browser

Buka http://localhost:3000

#### 🔧 Troubleshooting Frontend:

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| `npm: command not found` | Node.js belum install | Install dari nodejs.org |
| `ENOENT: no such file package.json` | Folder salah | Pastikan di folder `frontend/` |
| `Module not found` | Dependencies corrupt | `rm -rf node_modules && npm install` |
| API not reachable | Backend tidak jalan | Pastikan backend running di :8080 |
| CORS error | Origin tidak diizinkan | Cek backend CORS config |

---

## 6. Verifikasi & Testing

### 6.1 Checklist Development Ready

- [ ] Docker containers running (`docker ps` menunjukkan postgres dan redis)
- [ ] Backend running di http://localhost:8080
- [ ] Health check OK (`curl http://localhost:8080/health`)
- [ ] Frontend running di http://localhost:3000
- [ ] Bisa register user baru
- [ ] Bisa login

### 6.2 Test Full Flow

1. **Buka** http://localhost:3000
2. **Klik** "Daftar" untuk register
3. **Isi** form registrasi (email, password, nama, umur)
4. **Login** dengan credentials yang didaftarkan
5. **Buat** transaksi baru
6. **Verifikasi** transaksi muncul di dashboard

### 6.3 Run Backend Tests

```bash
cd backend
go test -v ./...
```

### 6.4 Run Frontend Tests (jika ada)

```bash
cd frontend
npm test
```

---

## 7. Troubleshooting Umum

### 7.1 Reset Everything (Fresh Start)

```bash
# Stop semua containers
docker compose down -v

# Hapus node_modules
rm -rf frontend/node_modules

# Start ulang
docker compose up -d postgres redis
cd backend && go run cmd/server/main.go &
cd frontend && npm install && npm run dev
```

### 7.2 Port yang Digunakan

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 8080 | http://localhost:8080 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MinIO (opsional) | 9000/9001 | http://localhost:9001 |

### 7.3 Logs & Debugging

```bash
# Lihat logs PostgreSQL
docker compose logs -f postgres

# Lihat logs Redis
docker compose logs -f redis

# Backend logs - sudah di terminal
# Frontend logs - sudah di terminal
```

---

## Quick Commands Reference

| Action | Command |
|--------|---------|
| Start DB | `docker compose up -d postgres redis` |
| Stop DB | `docker compose down` |
| Start Backend | `cd backend && go run cmd/server/main.go` |
| Start Frontend | `cd frontend && npm run dev` |
| Reset DB | `docker compose down -v && docker compose up -d postgres redis` |

---

## Selanjutnya

Setelah development lokal berjalan, lihat:
- [Deployment Guide](./deployment.md) - Deploy ke AWS
- [API Reference](./api-reference.md) - Dokumentasi API
- [Architecture](./architecture.md) - Arsitektur sistem
