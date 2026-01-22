# 🚀 Getting Started

Panduan lengkap untuk memulai development FinLapor. Ikuti langkah-langkah berikut dengan teliti.

---

## 📋 Prerequisites

Pastikan Anda sudah menginstall:

| Software | Versi Minimum | Cek Versi |
|----------|---------------|-----------|
| Node.js | 18.0+ | `node --version` |
| npm | 9.0+ | `npm --version` |
| Go | 1.21+ | `go version` |
| Docker | 24.0+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| Git | 2.0+ | `git --version` |

---

## 📥 Step 1: Clone Repository

```bash
# Clone repository
git clone https://github.com/yourusername/finlapor.git

# Masuk ke direktori project
cd finlapor
```

---

## ⚙️ Step 2: Setup Environment Variables

### 2.1 Copy file environment template

```bash
# Di root project
cp .env.example .env
```

### 2.2 Edit file .env

Buka file `.env` dan sesuaikan nilai-nilai berikut:

```env
# Database
DATABASE_URL=postgres://postgres:password@localhost:5432/finlapor

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secret (generate random string)
JWT_SECRET=your-super-secret-key-change-this

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=finlapor

# Hugging Face (dapatkan di https://huggingface.co/settings/tokens)
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxx

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> 💡 **Tips**: Untuk mendapatkan HF_TOKEN:
> 1. Daftar di [huggingface.co](https://huggingface.co)
> 2. Buka Settings → Access Tokens
> 3. Create new token (read access)

---

## 🐳 Step 3: Jalankan dengan Docker (Recommended)

Cara termudah untuk menjalankan semua services:

```bash
# Jalankan semua services
docker compose up -d

# Cek status
docker compose ps

# Lihat logs
docker compose logs -f
```

### Services yang berjalan:

| Service | URL | Deskripsi |
|---------|-----|-----------|
| Frontend | http://localhost:3000 | Web application |
| Backend | http://localhost:8080 | REST API |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |
| MinIO | http://localhost:9000 | Object storage |
| MinIO Console | http://localhost:9001 | Storage admin |

### Stop semua services:

```bash
docker compose down
```

---

## 💻 Step 4: Development Mode (Tanpa Docker)

Jika Anda ingin mengembangkan dengan hot-reload:

### 4.1 Jalankan Database & Redis (Docker)

```bash
# Hanya jalankan infrastructure
docker compose up -d postgres redis minio
```

### 4.2 Jalankan Backend

```bash
# Masuk ke folder backend
cd backend

# Download dependencies
go mod download

# Jalankan migrations
go run cmd/migrate/main.go up

# Jalankan server
go run cmd/server/main.go
```

Backend akan berjalan di http://localhost:8080

### 4.3 Jalankan Frontend (Terminal baru)

```bash
# Masuk ke folder frontend
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend akan berjalan di http://localhost:3000

---

## ✅ Step 5: Verifikasi Instalasi

### 5.1 Cek Backend Health

```bash
curl http://localhost:8080/health
```

Response yang diharapkan:
```json
{
  "status": "ok",
  "timestamp": "2026-01-22T12:00:00Z"
}
```

### 5.2 Buka Frontend

Buka browser dan akses http://localhost:3000

Anda akan melihat halaman login FinLapor.

### 5.3 Cek MinIO

1. Buka http://localhost:9001
2. Login dengan `minioadmin` / `minioadmin`
3. Pastikan bucket `finlapor` sudah ada

---

## 🧪 Step 6: Jalankan Tests

### Frontend Tests

```bash
cd frontend
npm run test
```

### Backend Tests

```bash
cd backend
go test ./...
```

---

## 🔧 Troubleshooting

### Error: Port already in use

```bash
# Cek proses yang menggunakan port
netstat -ano | findstr :3000

# Kill proses (Windows)
taskkill /PID <PID> /F
```

### Error: Database connection refused

Pastikan PostgreSQL sudah berjalan:
```bash
docker compose ps postgres
```

### Error: Permission denied (Docker)

Jalankan terminal sebagai Administrator atau gunakan sudo (Linux/Mac).

---

## 📚 Langkah Selanjutnya

- [Architecture](architecture.md) - Pelajari arsitektur sistem
- [API Reference](api-reference.md) - Lihat dokumentasi API
- [User Manual](user-manual.md) - Pelajari cara menggunakan aplikasi

---

**Selamat! Anda sudah siap mengembangkan FinLapor! 🎉**
