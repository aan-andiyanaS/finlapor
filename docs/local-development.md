# Panduan Development Lokal (Local Development Guide)

Panduan lengkap untuk berbagai skenario development FinLapor.

---

## Daftar Isi

1. [Overview Skenario](#1-overview-skenario)
2. [Skenario 1: Full Docker](#2-skenario-1-full-docker)
3. [Skenario 2: Backend Docker + Frontend Local](#3-skenario-2-backend-docker--frontend-local)
4. [Skenario 3: Full Local (Recommended for Dev)](#4-skenario-3-full-local)
5. [Setup Database](#5-setup-database)
6. [File Storage](#6-file-storage)
7. [Environment Variables](#7-environment-variables)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Overview Skenario

| Skenario | Frontend | Backend | Database/Redis | File Storage | Use Case |
|----------|----------|---------|----------------|--------------|----------|
| Full Docker | Docker | Docker | Docker | Folder `./uploads` | Demo, Testing |
| Backend Docker | Local | Docker | Docker | Folder `./uploads` | **Recommended** |
| Full Local | Local | Local | Docker | Folder `./uploads` | Debugging |

> **Catatan**: 
> - Database dan Redis selalu berjalan di Docker untuk konsistensi.
> - File upload disimpan di folder lokal `./backend/uploads/` (tanpa MinIO).

---

## 2. Skenario 1: Full Docker

Semua komponen (Frontend + Backend + Database + Redis) berjalan di Docker.

### Langkah:

```bash
# Start semua services termasuk frontend
docker compose -f docker-compose.full.yml up -d

# Verifikasi
docker ps

# Akses
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
```

### Stop:

```bash
docker compose -f docker-compose.full.yml down
```

---

## 3. Skenario 2: Backend Docker + Frontend Local (Recommended)

Backend dan infrastructure di Docker, Frontend lokal dengan hot-reload. **Cocok untuk frontend development.**

### Langkah:

```bash
# Terminal 1: Start Backend + Infra
docker compose up -d

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
docker compose down

# Stop Frontend: Ctrl+C di terminal
```

---

## 4. Skenario 3: Full Local

Backend dan Frontend lokal, hanya infrastructure di Docker. **Untuk debugging backend tanpa rebuild Docker.**

### Langkah:

```bash
# Terminal 1: Start Infrastructure only (DB + Redis)
docker compose up -d postgres redis

# Terminal 2: Start Backend lokal
cd backend
# Edit .env - ubah postgres menjadi localhost
# DATABASE_URL=postgres://postgres:password@localhost:5432/finlapor?sslmode=disable
go run cmd/server/main.go

# Terminal 3: Start Frontend lokal
cd frontend
npm run dev
```

### Environment untuk Full Local:

Buat file `backend/.env.local`:
```env
DATABASE_URL=postgres://postgres:password@localhost:5432/finlapor?sslmode=disable
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-jwt-key-change-in-production
PORT=8080
APP_ENV=development
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
BASE_URL=http://localhost:8080
HF_TOKEN=your_huggingface_token
HF_OCR_MODEL=Salesforce/blip-image-captioning-base
HF_LLM_MODEL=Qwen/Qwen2.5-72B-Instruct
USE_LAMBDA=false
FRONTEND_URL=http://localhost:3000
```

---

## 5. Setup Database

### 5.1 Otomatis (via Docker)

Database otomatis ter-setup saat container pertama kali jalan karena folder `database/migrations/` di-mount ke `/docker-entrypoint-initdb.d/`.

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

## 6. File Storage

### Local Development (Default)

File upload disimpan ke folder lokal, **tanpa memerlukan MinIO atau S3**.

**Konfigurasi di `backend/.env`:**
```env
STORAGE_TYPE=local
UPLOAD_DIR=/app/uploads
BASE_URL=http://localhost:8080
```

**Cara kerja:**
1. User upload file via frontend
2. Backend menyimpan ke folder `./backend/uploads/`
3. File dapat diakses via URL: `http://localhost:8080/uploads/namafile.jpg`

### Verifikasi Upload

```bash
# Cek file yang sudah diupload
ls backend/uploads/

# Akses file langsung di browser
# http://localhost:8080/uploads/uuid-filename.jpg
```

### Production (AWS S3)

Untuk production, ubah konfigurasi di `backend/.env.production`:
```env
STORAGE_TYPE=s3
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
S3_PUBLIC_ENDPOINT=https://your-bucket.s3.ap-southeast-1.amazonaws.com
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET=your-bucket-name
S3_REGION=ap-southeast-1
```

---

## 7. Environment Variables

### File yang Digunakan

| Environment | Env File | Docker Compose | Keterangan |
|-------------|----------|----------------|------------|
| **Local Dev** | `backend/.env` | `docker-compose.yml` | Default untuk development |
| **Full Docker** | `backend/.env` | `docker-compose.full.yml` | Termasuk frontend |
| **Production** | `backend/.env.production` | `docker-compose.production.yml` | AWS RDS + S3 |

### Variabel Penting

| Variabel | Local | Production | Keterangan |
|----------|-------|------------|------------|
| `DATABASE_URL` | postgres://...@postgres:5432 | postgres://...@rds-endpoint | Container vs RDS |
| `STORAGE_TYPE` | `local` | `s3` | Folder vs AWS S3 |
| `APP_ENV` | `development` | `production` | Environment flag |
| `BASE_URL` | http://localhost:8080 | https://api.domain.com | Backend URL |

---

## 8. Troubleshooting

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
4. Restart: `docker compose restart postgres`

### File Upload Tidak Tampil

1. Pastikan folder `backend/uploads/` ada
2. Cek `STORAGE_TYPE=local` di `.env`
3. Cek URL file di database: 
   ```sql
   SELECT receipt_url FROM transactions WHERE receipt_url IS NOT NULL;
   ```
4. Akses URL langsung di browser untuk verifikasi

### Frontend Tidak Bisa Akses Backend

1. Pastikan backend running di port 8080
2. Cek `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8080`
3. Cek browser console untuk CORS errors
4. Restart frontend: `npm run dev`

### Chatbot Returns Mock Response

1. Cek `HF_TOKEN` di `.env`
2. Cek model: Gunakan `Qwen/Qwen2.5-72B-Instruct`
3. Cek logs backend: `docker logs finlapor-backend-1`
4. Pastikan koneksi internet aktif

### Reset Semua Data

```bash
# HATI-HATI: Ini akan menghapus SEMUA data!
docker compose down -v

# Start fresh
docker compose up -d
```

---

## Quick Reference

| Command | Deskripsi |
|---------|-----------|
| `docker compose up -d` | Backend + DB + Redis (Recommended) |
| `docker compose -f docker-compose.full.yml up -d` | Full Docker (termasuk Frontend) |
| `docker compose down` | Stop containers |
| `docker compose down -v` | Stop + hapus volumes (data) |
| `docker logs [container]` | Lihat logs container |
| `docker exec -it [container] sh` | Masuk ke container |

---

## Docker Compose Files

| File | Services | Env File | Use Case |
|------|----------|----------|----------|
| `docker-compose.yml` | Backend + PostgreSQL + Redis | `backend/.env` | **Development (Default)** |
| `docker-compose.full.yml` | Frontend + Backend + PostgreSQL + Redis | `backend/.env` | Demo/Testing |
| `docker-compose.production.yml` | Backend + Redis | `backend/.env.production` | Production Deployment |
