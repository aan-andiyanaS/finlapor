# 🔧 Troubleshooting Guide

Panduan mengatasi masalah umum saat deployment dan operasional FinLapor.

---

## 📑 Daftar Isi

1. [AWS Issues](#aws-issues)
2. [CloudFlare Issues](#cloudflare-issues)
3. [Database Issues](#database-issues)
4. [Backend Issues](#backend-issues)
5. [Frontend Issues](#frontend-issues)
6. [Docker Issues](#docker-issues)

---

## AWS Issues

### EC2: Cannot SSH

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Connection timeout | Security Group | Buka port 22, source: My IP |
| Connection refused | SSH not running | Cek instance status di console |
| Permission denied | Key permission | `chmod 400 finlapor-key.pem` |
| Host key changed | IP berubah | `ssh-keygen -R [IP]` |

**Debug:**
```bash
# Verbose SSH
ssh -v -i finlapor-key.pem ubuntu@[IP]

# Check Security Group via CLI
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

### EC2: Cannot access from internet

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Port 8080 timeout | Security Group | Buka port 8080 |
| No public IP | Auto-assign disabled | Allocate Elastic IP |
| Service not running | Backend down | Start service |

### RDS: Cannot connect

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Connection refused | SG not allowing | Edit RDS SG, allow from backend SG |
| Connection timeout | VPC mismatch | Pastikan EC2 dan RDS di VPC sama |
| Auth failed | Password wrong | Reset password di RDS console |
| Database not exist | Initial DB empty | Create database manually |

**Debug:**
```bash
# Test dari EC2
nc -zv [RDS_ENDPOINT] 5432

# Connect manual
psql -h [RDS_ENDPOINT] -U postgres -d finlapor
```

### Lambda: Timeout

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Task timed out | Timeout terlalu kecil | Increase timeout (maks 15 menit) |
| Memory exceeded | Memory terlalu kecil | Increase memory |
| Cold start lambat | Package besar | Optimize dependencies |

### S3: Access Denied

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Access Denied | IAM policy salah | Cek ARN bucket di policy |
| SignatureDoesNotMatch | Secret key salah | Regenerate access key |
| NoSuchBucket | Bucket name typo | Verifikasi nama bucket |

---

## CloudFlare Issues

### Error 522: Connection Timed Out

```
CloudFlare cannot reach origin server
```

**Checklist:**
1. [ ] EC2 running?
2. [ ] Backend service running?
3. [ ] Port 8080 open in Security Group?
4. [ ] Backend listening on 0.0.0.0 (bukan 127.0.0.1)?
5. [ ] DNS record pointing to correct IP?

**Debug:**
```bash
# Direct access bypass CloudFlare
curl http://[EC2_IP]:8080/health

# Dari dalam EC2
curl http://localhost:8080/health
```

### Error 524: Timeout Occurred

```
Origin server took too long to respond
```

**Penyebab:** Request > 100 detik

**Solusi:**
1. Optimize slow endpoints
2. Implement async processing
3. CloudFlare Enterprise untuk longer timeout

### Error 521: Web Server Down

```
Origin server refused connection
```

**Penyebab:** Backend tidak listen atau reject connection

**Solusi:**
1. Pastikan backend running
2. Check firewall di EC2: `sudo iptables -L`
3. Backend harus bind ke `0.0.0.0:8080`

### Error 526: Invalid SSL

```
CloudFlare cannot validate SSL certificate
```

**Solusi:**
1. SSL/TLS → Set mode ke **Full** (bukan Full Strict)
2. Atau install valid SSL di origin

### DNS Not Resolving

**Debug:**
```bash
# Check nameservers
nslookup -type=NS airi.click

# Check A record
nslookup api.finlapor.airi.click

# Flush local DNS cache
# Windows
ipconfig /flushdns
# macOS
sudo dscacheutil -flushcache
```

### Pages Build Failed

**Common errors:**

| Error | Solusi |
|-------|--------|
| `npm ERR! missing script: build` | Cek `package.json` ada script `build` |
| `Module not found` | Run `npm install` locally dulu |
| `next export` error | Pastikan semua pages static |

**Debug:**
```bash
# Test build locally
cd frontend
npm install
npm run build
```

---

## Database Issues

### Migrations Failed

| Error | Solusi |
|-------|--------|
| Syntax error | Cek SQL file untuk typo |
| Relation exists | Migration sudah pernah run |
| Permission denied | User tidak punya privilege |

**Reset dan retry:**
```bash
# Drop dan recreate database
psql "$DATABASE_URL" -c "DROP DATABASE finlapor;"
psql "$DATABASE_URL" -c "CREATE DATABASE finlapor;"

# Run migrations ulang
psql "$DATABASE_URL" -f database/migrations/001_initial.sql
```

### Connection Pool Exhausted

```
too many connections
```

**Solusi:**
1. Increase `max_connections` di RDS parameter group
2. Implement connection pooling di backend
3. Close idle connections

### Query Slow

**Diagnose:**
```bash
# Check slow queries
psql "$DATABASE_URL" -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check missing indexes
psql "$DATABASE_URL" -c "EXPLAIN ANALYZE SELECT * FROM transactions WHERE user_id = 'xxx';"
```

---

## Backend Issues

### Backend Won't Start

| Error | Solusi |
|-------|--------|
| Port already in use | `sudo lsof -i :8080` → kill process |
| Missing env var | Cek `.env` lengkap |
| Database connection failed | Cek DATABASE_URL |
| Module not found | `go mod download` |

**Debug:**
```bash
# Run dengan verbose
cd backend
go run cmd/server/main.go 2>&1 | tee debug.log

# Check env loaded
env | grep DATABASE
```

### 500 Internal Server Error

**Debug:**
```bash
# Check backend logs
docker logs finlapor-backend

# Atau
journalctl -u finlapor -f

# Test specific endpoint
curl -v http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

### CORS Error

```
Access-Control-Allow-Origin header missing
```

**Solusi di backend (Go Fiber):**
```go
app.Use(cors.New(cors.Config{
    AllowOrigins: "https://finlapor.pages.dev, https://finlapor.airi.click",
    AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
    AllowHeaders: "Origin, Content-Type, Accept, Authorization",
}))
```

### JWT Token Invalid

| Error | Penyebab | Solusi |
|-------|----------|--------|
| Token expired | TTL habis | Refresh token |
| Invalid signature | JWT_SECRET berbeda | Pastikan sama di semua instance |
| Malformed token | Token corrupt | Login ulang |

---

## Frontend Issues

### Build Failed

| Error | Solusi |
|-------|--------|
| Type errors | Fix TypeScript errors |
| Missing dependencies | `npm install` |
| Next.js config error | Check `next.config.js` |

### API Calls Failed

**Debug:**
```javascript
// Di browser console
console.log(process.env.NEXT_PUBLIC_API_URL);
```

**Common issues:**
1. `NEXT_PUBLIC_API_URL` tidak diset di CloudFlare Pages
2. CORS tidak configured di backend
3. SSL mismatch (mixed content)

### Page Not Found (404)

**Untuk static export:**
1. Pastikan semua routes ada file-nya
2. Check `next.config.js` untuk `trailingSlash`
3. CloudFlare Pages: Check _redirects file

---

## Docker Issues

### Container Won't Start

```bash
# Check logs
docker logs finlapor-backend

# Common fixes:
# 1. Port conflict
docker ps -a  # cari container lama
docker rm -f [container_id]

# 2. Network issue
docker network ls
docker network create finlapor-network
```

### Image Pull Failed

```bash
# Login ke registry
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin [ACCOUNT].dkr.ecr.ap-southeast-1.amazonaws.com

# Atau untuk Docker Hub
docker login
```

### Container Health Check Failed

```bash
# Check health status
docker inspect --format='{{.State.Health}}' finlapor-backend

# Manual health check
docker exec finlapor-backend curl -f http://localhost:8080/health
```

### Disk Space Full

```bash
# Check disk
df -h

# Clean Docker
docker system prune -a
docker volume prune
```

---

## Quick Reference Commands

### Status Checks

```bash
# EC2 instance status
aws ec2 describe-instance-status --instance-ids i-xxxxx

# RDS status
aws rds describe-db-instances --db-instance-identifier finlapor-db

# Docker status
docker ps
docker-compose ps

# Service status
systemctl status finlapor
```

### Logs

```bash
# Docker logs
docker logs -f --tail=100 finlapor-backend

# System logs
journalctl -u finlapor -f

# CloudWatch logs
aws logs tail /aws/lambda/finlapor-ai --follow
```

### Restart Services

```bash
# Docker
docker-compose restart backend

# Systemd
sudo systemctl restart finlapor

# EC2
aws ec2 reboot-instances --instance-ids i-xxxxx
```

---

## Contact & Resources

- [AWS Documentation](https://docs.aws.amazon.com/)
- [CloudFlare Docs](https://developers.cloudflare.com/)
- [Go Fiber Docs](https://docs.gofiber.io/)
- [Next.js Docs](https://nextjs.org/docs)
- [GitHub Issues](https://github.com/aan-andiyanaS/finlapor/issues)
