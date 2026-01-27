# Panduan Development Lokal (Local Development Guide)

Panduan lengkap untuk berbagai skenario development FinLapor.

---

## Daftar Isi

1. [Overview Skenario](#1-overview-skenario)
2. [Skenario 1: Full Docker](#2-skenario-1-full-docker)
3. [Skenario 2: Backend Docker + Frontend Local](#3-skenario-2-backend-docker--frontend-local)
4. [Skenario 3: Full Local (Recommended for Dev)](#4-skenario-3-full-local)
5. [Setup Database](#5-setup-database)
6. [Setup MinIO (S3)](#6-setup-minio-s3)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Overview Skenario

| Skenario | Frontend | Backend | Database/Redis/MinIO | Use Case |
|----------|----------|---------|---------------------|----------|
| Full Docker | Docker | Docker | Docker | Demo, Testing |
| Backend Docker | Local | Docker | Docker | Frontend Development |
| Full Local | Local | Local | Docker | **Best for Development** |

> **Catatan**: Database, Redis, dan MinIO selalu berjalan di Docker untuk konsistensi.

---

## 2. Skenario 1: Full Docker

Semua komponen berjalan di Docker. Cocok untuk demo atau testing environment.

### Langkah:

```bash
# Start semua services
docker-compose up -d

# Verifikasi
docker ps

# Akses
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
# MinIO:    http://localhost:9001 (minioadmin/minioadmin)
```

### Stop:

```bash
docker-compose down
```

---

## 3. Skenario 2: Backend Docker + Frontend Local

Backend dan infrastructure berjalan di Docker, Frontend berjalan lokal. Cocok untuk **frontend development** dengan hot-reload.

### Langkah:

```bash
# Terminal 1: Start Backend + Infra
docker-compose -f docker-compose.backend.yml up -d

# Terminal 2: Start Frontend lokal
cd frontend
npm install  # jika belum
npm run dev

# Akses
# Frontend: http://localhost:3000 (hot-reload enabled)
# Backend:  http://localhost:8080
```

### Stop:

```bash
# Stop Docker
docker-compose -f docker-compose.backend.yml down

# Stop Frontend: Ctrl+C di terminal
```

---

## 4. Skenario 3: Full Local (Recommended)

Backend dan Frontend berjalan lokal, hanya infrastructure (DB, Redis, MinIO) di Docker. **Recommended untuk development** karena:
- Hot-reload untuk backend (dengan `air` atau manual restart)
- Hot-reload untuk frontend
- Lebih cepat untuk debugging

### Langkah:

```bash
# Terminal 1: Start Infrastructure
docker-compose -f docker-compose.infra.yml up -d

# Terminal 2: Start Backend lokal
cd backend
go run cmd/server/main.go

# Terminal 3: Start Frontend lokal
cd frontend
npm run dev

# Akses
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
```

### Environment Files

**backend/.env** (untuk local backend):
```env
DATABASE_URL=postgres://postgres:password@localhost:5432/finlapor?sslmode=disable
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=finlapor
HF_TOKEN=your_huggingface_token
HF_LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2
JWT_SECRET=super-secret-jwt-key
PORT=8080
```

**frontend/.env.local** (untuk local frontend):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 5. Setup Database

### 5.1 Otomatis (via Docker)

Database akan otomatis ter-setup saat container pertama kali jalan karena folder `database/migrations/` di-mount ke `/docker-entrypoint-initdb.d/`.

```bash
# Verifikasi database sudah ter-create
docker exec -it finlapor-postgres-1 psql -U postgres -d finlapor -c "\dt"

# Output yang diharapkan:
#              List of relations
#  Schema |      Name       | Type  |  Owner
# --------+-----------------+-------+----------
#  public | categories      | table | postgres
#  public | chat_messages   | table | postgres
#  public | transactions    | table | postgres
#  public | users           | table | postgres
```

### 5.2 Manual (jika perlu reset)

```bash
# Windows PowerShell
Get-Content database\migrations\001_initial.sql | docker exec -i finlapor-postgres-1 psql -U postgres -d finlapor

# Linux/macOS
docker exec -i finlapor-postgres-1 psql -U postgres -d finlapor < database/migrations/001_initial.sql
```

### 5.3 Akses Database Langsung

```bash
# Masuk ke PostgreSQL CLI
docker exec -it finlapor-postgres-1 psql -U postgres -d finlapor

# Query contoh
SELECT * FROM users;
SELECT * FROM transactions LIMIT 5;

# Keluar
\q
```

---

## 6. Setup MinIO (S3)

### 6.1 Akses MinIO Console

1. Buka http://localhost:9001
2. Login dengan `minioadmin` / `minioadmin`
3. Bucket `finlapor` sudah otomatis dibuat oleh `minio-setup` service

### 6.2 Verifikasi Bucket

```bash
# Cek bucket via CLI
docker exec finlapor-minio-1 mc ls myminio/

# Output: finlapor/
```

### 6.3 Upload Test File

Via Console:
1. Buka http://localhost:9001
2. Navigate ke bucket `finlapor`
3. Klik "Upload" dan pilih file

Via Backend API:
```bash
# Upload via API (membutuhkan auth token)
curl -X POST http://localhost:8080/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg"
```

---

## 7. Troubleshooting

### Port Already in Use

```bash
# Windows - cari proses
netstat -ano | findstr :3000
netstat -ano | findstr :8080

# Kill proses
taskkill /PID [PID] /F

# Linux/macOS
lsof -i :3000
kill -9 [PID]
```

### Database Connection Refused

1. Pastikan Docker Desktop running
2. Cek container: `docker ps`
3. Cek logs: `docker logs finlapor-postgres-1`
4. Restart: `docker-compose -f docker-compose.infra.yml restart postgres`

### Frontend Tidak Bisa Akses Backend

1. Pastikan backend running di port 8080
2. Cek `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8080`
3. Cek browser console untuk CORS errors
4. Restart frontend: `npm run dev`

### Chatbot Returns Mock Response

1. Cek `HF_TOKEN` di `.env` atau environment
2. Cek model: Gunakan `mistralai/Mistral-7B-Instruct-v0.2` (verified working)
3. Cek logs backend: `docker logs finlapor-backend-1`
4. Pastikan koneksi internet aktif

### Reset Semua Data

```bash
# HATI-HATI: Ini akan menghapus SEMUA data!
docker-compose down -v

# Start fresh
docker-compose -f docker-compose.infra.yml up -d
```

---

## Quick Reference

| Command | Deskripsi |
|---------|-----------|
| `docker-compose up -d` | Full Docker |
| `docker-compose -f docker-compose.backend.yml up -d` | Backend + Infra Docker |
| `docker-compose -f docker-compose.infra.yml up -d` | Infra only Docker |
| `docker-compose down` | Stop semua containers |
| `docker-compose down -v` | Stop + hapus volumes (data) |
| `docker logs [container]` | Lihat logs container |
| `docker exec -it [container] sh` | Masuk ke container |
