# 🔧 Panduan Troubleshooting FinLapor

Panduan lengkap untuk mengatasi masalah umum saat deployment dan operasional FinLapor.

> **📌 Tips:** Gunakan `Ctrl+F` untuk mencari error message spesifik yang Anda temui.

---

## 📑 Daftar Isi

1. [🔌 Test Koneksi Pre-Deployment](#-test-koneksi-pre-deployment)
2. [🐳 Masalah Docker](#-masalah-docker)
3. [☁️ Masalah AWS](#️-masalah-aws)
4. [🌐 Masalah CloudFlare](#-masalah-cloudflare)
5. [🗄️ Masalah Database](#️-masalah-database)
6. [🖥️ Masalah Backend](#️-masalah-backend)
7. [🎨 Masalah Frontend](#-masalah-frontend)
8. [🤖 Masalah AI/HuggingFace](#-masalah-aihuggingface)
9. [📋 Health Check Script](#-health-check-script)
10. [🔗 Referensi Cepat](#-referensi-cepat)

---

## 🔌 Test Koneksi Pre-Deployment

Sebelum dan sesudah deployment, **WAJIB** test semua koneksi untuk memastikan sistem berfungsi dengan benar.

### 📋 Quick Checklist

| # | Komponen | Command | Hasil yang Diharapkan |
|---|----------|---------|----------------------|
| 1 | Docker Running | `docker ps` | Menampilkan list container |
| 2 | Backend Health | `curl localhost:8080/health` | `{"status":"ok"}` |
| 3 | Redis Connection | `docker exec finlapor-redis redis-cli ping` | `PONG` |
| 4 | RDS Connection | `nc -zv [RDS_ENDPOINT] 5432` | `Connection succeeded` |
| 5 | S3 Access | `aws s3 ls s3://[BUCKET]` | Menampilkan list files |

---

### 1️⃣ Test Docker Containers

**Tujuan:** Memastikan semua container Docker berjalan dengan benar.

```bash
# SSH ke Backend EC2 terlebih dahulu
ssh finlapor-backend   # atau ssh -J bastion backend untuk private subnet

# Cek status semua containers
docker ps
```

**Output yang diharapkan:**
```
CONTAINER ID   IMAGE               STATUS         PORTS
abc123         finlapor-backend    Up 5 minutes   0.0.0.0:8080->8080/tcp
def456         redis:alpine        Up 5 minutes   0.0.0.0:6379->6379/tcp
```

**Jika container TIDAK muncul atau STATUS = Exited:**

```bash
# Lihat semua container termasuk yang berhenti
docker ps -a

# Cek log error container yang gagal
docker logs finlapor-backend --tail 100

# Restart container
docker restart finlapor-backend

# Atau restart semua dengan docker-compose
cd ~/finlapor
docker compose -f docker-compose.production.yml up -d
```

**Masalah umum:**

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Container terus restart | Error di aplikasi | Cek `docker logs` untuk error message |
| `Exited (1)` | Crash saat startup | Periksa environment variables |
| `Exited (137)` | Out of memory | Tambah RAM atau optimasi aplikasi |

---

### 2️⃣ Test Backend Health

**Tujuan:** Memastikan backend API merespons dengan benar.

**Dari dalam EC2:**
```bash
curl http://localhost:8080/health
```

**Output yang diharapkan:**
```json
{"status":"ok"}
```

**Dari Bastion (untuk Private Subnet):**
```bash
ssh finlapor-backend "curl -s http://localhost:8080/health"
```

**Jika TIDAK merespons:**

```bash
# 1. Cek apakah port sedang listening
netstat -tlnp | grep 8080
# atau
ss -tlnp | grep 8080

# 2. Cek log backend untuk error
docker logs finlapor-backend --tail 50

# 3. Cek apakah container running
docker ps | grep backend

# 4. Restart backend
docker restart finlapor-backend
```

**Masalah umum:**

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Connection refused | Backend tidak running | `docker start finlapor-backend` |
| Connection timeout | Port tidak terbuka | Cek Security Group AWS |
| 500 Internal Error | Error di aplikasi | Cek `docker logs` |

---

### 3️⃣ Test Redis Connection

**Tujuan:** Memastikan Redis cache berfungsi untuk session dan caching.

**Test PING:**
```bash
docker exec finlapor-redis redis-cli ping
```
**Expected:** `PONG`

**Test SET/GET (untuk memastikan operasi baca/tulis):**
```bash
# Simpan data test
docker exec finlapor-redis redis-cli SET test_key "hello_finlapor"

# Baca data test
docker exec finlapor-redis redis-cli GET test_key
# Expected: "hello_finlapor"

# Hapus data test
docker exec finlapor-redis redis-cli DEL test_key
```

**Jika GAGAL:**

```bash
# Cek apakah Redis container running
docker ps | grep redis

# Restart Redis
docker restart finlapor-redis

# Cek log Redis
docker logs finlapor-redis
```

**Masalah umum:**

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `Could not connect` | Container tidak running | `docker start finlapor-redis` |
| `WRONGPASS` | Password Redis diperlukan | Cek `REDIS_PASSWORD` di .env |
| Memory error | Redis kehabisan memory | Restart atau tambah memory |

---

### 4️⃣ Test RDS PostgreSQL Connection

**Tujuan:** Memastikan koneksi ke database AWS RDS berhasil.

**Test port 5432 terbuka:**
```bash
nc -zv finlapor-db.xxxxx.ap-southeast-1.rds.amazonaws.com 5432
```
**Expected:** `Connection to finlapor-db... succeeded!`

**Test koneksi database lengkap:**
```bash
# Menggunakan Docker postgres image
docker run --rm --network host postgres:alpine \
  psql "postgres://postgres:YOUR_PASSWORD@finlapor-db.xxxxx.rds.amazonaws.com:5432/finlapor?sslmode=require" \
  -c "SELECT 1 as connection_test;"
```
**Expected:**
```
 connection_test
-----------------
               1
```

**Lihat semua tables:**
```bash
docker run --rm --network host postgres:alpine \
  psql "$DATABASE_URL" -c "\dt"
```
**Expected:** List tables (users, transactions, categories, dll)

**Jika GAGAL:**

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `Connection timed out` | Security Group RDS salah | Tambahkan rule: allow 5432 dari EC2 Security Group |
| `Connection refused` | RDS tidak running | Start RDS di AWS Console |
| `password authentication failed` | Password salah | Reset password di RDS Console |
| `database "finlapor" does not exist` | DB belum dibuat | Buat: `CREATE DATABASE finlapor;` |
| `SSL required` | SSL tidak diaktifkan | Tambahkan `?sslmode=require` di connection string |

**Cara reset password RDS:**
1. AWS Console → RDS → Databases
2. Pilih `finlapor-db`
3. Modify → Set new Master password
4. Apply immediately
5. Update `DATABASE_URL` di EC2

---

### 5️⃣ Test S3 Connection

**Tujuan:** Memastikan aplikasi bisa upload dan download file dari S3.

**Test akses bucket:**
```bash
aws s3 ls s3://finlapor-storage-xxxxx/
```
**Expected:** List of files atau folder (bisa kosong jika baru)

**Test upload file:**
```bash
# Buat file test
echo "Test FinLapor S3 Upload $(date)" > /tmp/test-s3.txt

# Upload ke S3
aws s3 cp /tmp/test-s3.txt s3://finlapor-storage-xxxxx/test-s3.txt

# Verifikasi sudah terupload
aws s3 ls s3://finlapor-storage-xxxxx/test-s3.txt
```
**Expected:** Menampilkan file yang baru diupload

**Test download file:**
```bash
aws s3 cp s3://finlapor-storage-xxxxx/test-s3.txt /tmp/test-download.txt
cat /tmp/test-download.txt
```
**Expected:** Isi file sama dengan yang diupload

**Cleanup:**
```bash
aws s3 rm s3://finlapor-storage-xxxxx/test-s3.txt
rm /tmp/test-s3.txt /tmp/test-download.txt
```

**Jika GAGAL:**

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `Access Denied` | IAM policy salah | Periksa ARN bucket di IAM policy |
| `NoSuchBucket` | Nama bucket salah | Verifikasi nama bucket di S3 Console |
| `SignatureDoesNotMatch` | Secret key salah | Regenerate Access Key di IAM |
| `Unable to locate credentials` | AWS CLI belum dikonfigurasi | Jalankan `aws configure` |

---

### 6️⃣ Test HuggingFace API

**Tujuan:** Memastikan API AI/ML HuggingFace bisa diakses.

**Test akses API:**
```bash
curl -X POST "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct" \
  -H "Authorization: Bearer hf_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inputs": "Jawab singkat: Apa itu FinLapor?"}'
```
**Expected:** JSON response dengan generated text

**Cek model OCR tersedia:**
```bash
curl -s "https://huggingface.co/api/models/naver-clova-ix/donut-base-finetuned-cord-v2" | head -c 300
```
**Expected:** JSON dengan info model

**Jika GAGAL:**

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `401 Unauthorized` | Token salah/expired | Generate token baru di huggingface.co/settings/tokens |
| `Rate limit reached` | Terlalu banyak request | Upgrade ke HuggingFace Pro atau implement caching |
| `Model is loading` | Cold start | Tunggu 30 detik, coba lagi |

---

### 7️⃣ Full System Integration Test

**Tujuan:** Test alur lengkap dari register → login → API calls.

```bash
# ================================
# STEP 1: Register User Test
# ================================
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@finlapor.test",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
# Expected: {"token":"...", "user":{...}}

# ================================
# STEP 2: Login & Get Token
# ================================
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@finlapor.test",
    "password": "TestPassword123!"
  }' | jq -r '.token')

echo "Token: $TOKEN"
# Expected: Token: eyJhbGciOiJIUzI1NiIs...

# ================================
# STEP 3: Test Authenticated API
# ================================
curl -X GET http://localhost:8080/api/transactions \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"transactions":[...]}

# ================================
# STEP 4: Test Dashboard
# ================================
curl -X GET http://localhost:8080/api/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"income":..., "expense":...}

# ================================
# STEP 5: (Opsional) Test AI Chat
# ================================
curl -X POST http://localhost:8080/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Halo, apa saja fitur FinLapor?"}'
# Expected: {"response": "..."}
```

---

## 🐳 Masalah Docker

### Container Tidak Mau Start

```bash
# 1. Cek error logs
docker logs finlapor-backend

# 2. Cek port conflict
docker ps -a
lsof -i :8080

# 3. Hapus container lama dan restart
docker rm -f finlapor-backend
docker compose -f docker-compose.production.yml up -d
```

**Masalah umum:**

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `port is already allocated` | Port 8080 digunakan | `docker stop [container]` yang menggunakan port |
| `network not found` | Network belum dibuat | `docker network create finlapor-network` |
| `image not found` | Image belum di-pull/build | Build ulang: `docker compose build` |

### Image Pull Gagal

```bash
# Untuk AWS ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin [ACCOUNT].dkr.ecr.ap-southeast-1.amazonaws.com

# Untuk Docker Hub
docker login
```

### Disk Space Penuh

```bash
# Cek disk usage
df -h

# Bersihkan Docker (HATI-HATI: menghapus semua yang tidak terpakai)
docker system prune -a
docker volume prune

# Hapus images lama
docker image prune -a
```

---

## ☁️ Masalah AWS

### EC2: Tidak Bisa SSH

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `Connection timeout` | Security Group | Tambah rule SSH (22) dari IP Anda |
| `Connection refused` | Instance mati | Start instance di EC2 Console |
| `Permission denied` | Key file permission | `chmod 400 finlapor-key.pem` |
| `Host key verification failed` | IP berubah | `ssh-keygen -R [OLD_IP]` |

**Debug SSH:**
```bash
# Verbose mode untuk melihat error
ssh -v -i finlapor-key.pem ubuntu@[IP]
```

### RDS: Tidak Bisa Connect

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `Connection timeout` | Security Group | Allow port 5432 dari EC2 Security Group |
| `Connection refused` | RDS stopped | Start di RDS Console |
| `Auth failed` | Password salah | Reset password di RDS Console |
| `Database not exist` | DB belum dibuat | `CREATE DATABASE finlapor;` |

### Lambda: Timeout

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `Task timed out` | Timeout terlalu kecil | Naikkan ke 30-60 detik di Lambda Console |
| `Memory exceeded` | Memory kurang | Naikkan ke 512MB+ |
| Cold start lambat | Package besar | Optimasi dependencies |

---

## 🌐 Masalah CloudFlare

### Error 522: Connection Timed Out

**Artinya:** CloudFlare tidak bisa menghubungi EC2 backend Anda.

**Checklist:**
- [ ] EC2 instance running?
- [ ] Backend service running? (`docker ps`)
- [ ] Port 8080 terbuka di Security Group?
- [ ] Backend bind ke `0.0.0.0:8080` (bukan `127.0.0.1`)?
- [ ] DNS A record mengarah ke IP EC2 yang benar?

**Test bypass CloudFlare:**
```bash
curl http://[EC2_PUBLIC_IP]:8080/health
```

### Error 524: Timeout Occurred

**Artinya:** Request memakan waktu > 100 detik.

**Solusi:**
1. Optimasi endpoint yang lambat
2. Implement async processing untuk task berat
3. Upgrade ke CloudFlare Enterprise (timeout lebih lama)

### Error 521: Web Server Down

**Artinya:** EC2 menolak koneksi dari CloudFlare.

**Solusi:**
1. Pastikan backend bind ke `0.0.0.0:8080`
2. Cek firewall: `sudo iptables -L`

### Error 526: Invalid SSL

**Artinya:** CloudFlare tidak bisa validasi SSL certificate di origin.

**Solusi:**
1. SSL/TLS Settings → Ubah ke **Full** (bukan Full Strict)
2. Atau install CloudFlare Origin Certificate

---

## 🗄️ Masalah Database

### Migration Gagal

```bash
# Lihat error detail
psql "$DATABASE_URL" -f database/migrations/001_initial.sql 2>&1

# Jika perlu reset (HATI-HATI: menghapus semua data!)
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Connection Pool Exhausted

```
too many connections
```

**Solusi:**
1. Restart backend untuk melepas koneksi
2. Naikkan `max_connections` di RDS parameter group
3. Implement connection pooling di backend

### Query Lambat

```sql
-- Lihat query yang sedang berjalan
SELECT pid, query, state, query_start FROM pg_stat_activity WHERE state = 'active';

-- Cek apakah ada missing index
EXPLAIN ANALYZE SELECT * FROM transactions WHERE user_id = 'xxx';
```

---

## 🖥️ Masalah Backend

### Backend Tidak Mau Start

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `Port already in use` | Proses lain menggunakan port | `sudo lsof -i :8080` → kill |
| `Missing env var` | `.env` tidak lengkap | Lengkapi semua env vars |
| `Database connection failed` | DATABASE_URL salah | Cek format dan credentials |

### 500 Internal Server Error

```bash
# 1. Cek log untuk error detail
docker logs finlapor-backend --tail 100

# 2. Test endpoint spesifik
curl -v http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

### CORS Error

```
Access-Control-Allow-Origin header missing
```

**Solusi:** Pastikan backend mengizinkan origin frontend:
```go
app.Use(cors.New(cors.Config{
    AllowOrigins: "https://finlapor.pages.dev, https://finlapor.airi.click, http://localhost:3000",
    AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
    AllowHeaders: "Origin, Content-Type, Accept, Authorization",
}))
```

---

## 🎨 Masalah Frontend

### Build Gagal

```bash
# Test build lokal
cd frontend
npm install
npm run build
```

| Error | Solusi |
|-------|--------|
| Type errors | Fix TypeScript errors |
| `Module not found` | `npm install` |
| `next.config.js error` | Cek syntax di config |

### API Calls Gagal

```javascript
// Di browser console
console.log(process.env.NEXT_PUBLIC_API_URL);
```

**Checklist:**
1. `NEXT_PUBLIC_API_URL` sudah diset di CloudFlare Pages?
2. CORS dikonfigurasi di backend?
3. SSL mode benar? (tidak mixed content)

---

## 🤖 Masalah AI/HuggingFace

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `401 Unauthorized` | Token salah | Generate token baru |
| `Rate limit` | Terlalu banyak request | Implement caching |
| `Model loading` | Cold start | Tunggu 30 detik |

---

## 📋 Health Check Script

Simpan script ini di server untuk pengecekan cepat:

```bash
#!/bin/bash
# File: /home/ubuntu/health-check.sh

echo "🔍 FinLapor Health Check"
echo "========================"
echo ""

# 1. Docker containers
echo "📦 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "   ❌ Docker not running"
echo ""

# 2. Backend health
echo "🖥️ Backend Health:"
HEALTH=$(curl -sf http://localhost:8080/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Backend: $HEALTH"
else
    echo "   ❌ Backend: NOT RESPONDING"
fi
echo ""

# 3. Redis
echo "📮 Redis:"
REDIS=$(docker exec finlapor-redis redis-cli ping 2>/dev/null)
if [ "$REDIS" == "PONG" ]; then
    echo "   ✅ Redis: $REDIS"
else
    echo "   ❌ Redis: NOT RESPONDING"
fi
echo ""

# 4. Disk usage
echo "💾 Disk Usage:"
df -h / | tail -1 | awk '{print "   Used: " $5 " (" $3 " of " $2 ")"}'
echo ""

# 5. Memory
echo "🧠 Memory:"
free -h | grep Mem | awk '{print "   Used: " $3 " of " $2}'
echo ""

echo "========================"
echo "✅ Health check complete"
```

**Cara pakai:**
```bash
chmod +x /home/ubuntu/health-check.sh
./health-check.sh
```

---

## 🔗 Referensi Cepat

### Status Checks

```bash
# EC2 instance
aws ec2 describe-instance-status --instance-ids i-xxxxx

# RDS status
aws rds describe-db-instances --db-instance-identifier finlapor-db

# Docker
docker ps
docker compose ps

# Systemd service
systemctl status finlapor
```

### Logs

```bash
# Docker logs
docker logs -f --tail=100 finlapor-backend

# Systemd logs
journalctl -u finlapor -f

# CloudWatch (Lambda)
aws logs tail /aws/lambda/finlapor-ai --follow
```

### Restart Services

```bash
# Docker
docker compose restart

# Systemd
sudo systemctl restart finlapor

# EC2 (reboot instance)
aws ec2 reboot-instances --instance-ids i-xxxxx
```

---

## 📚 Dokumentasi Terkait

- [Deployment Guide](./deployment/) - Panduan setup lengkap
- [Architecture](./architecture.md) - Arsitektur sistem
- [CI/CD](./cicd.md) - Pipeline CI/CD
- [AWS Documentation](https://docs.aws.amazon.com/)
- [CloudFlare Docs](https://developers.cloudflare.com/)
- [Go Fiber Docs](https://docs.gofiber.io/)
- [Next.js Docs](https://nextjs.org/docs)
