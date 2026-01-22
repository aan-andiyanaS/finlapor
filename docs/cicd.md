# 🔄 CI/CD Pipeline - FinLapor

Dokumentasi lengkap tahapan CI/CD (Continuous Integration / Continuous Deployment) untuk FinLapor.

---

## 📋 Overview

CI/CD Pipeline FinLapor menggunakan **GitHub Actions** untuk automasi testing, build, dan deployment.

```
Code Push → CI (Test & Build) → Deploy Staging → Testing → Deploy Production → Monitor
```

---

## 🎯 Workflow Summary

| Workflow | Trigger | Target | Durasi | Status Check |
|----------|---------|--------|--------|--------------|
| **Backend CI** | Push/PR ke main/develop | Test & Build | ~3-5 min | Required |
| **Frontend CI** | Push/PR ke main/develop | Lint & Build | ~2-4 min | Required |
| **Deploy Staging** | Push ke `develop` | EC2 Staging + CF Pages | ~5-8 min | Optional |
| **Deploy Production** | Tag `v*` | EC2 Production + CF Pages | ~10-15 min | Manual |

---

## 🔥 Pipeline Flow Diagram

### 1. Development Flow

```
Developer
   ↓
Create Feature Branch (feature/login)
   ↓
Write Code + Tests
   ↓
Git Push → Triggers Backend CI + Frontend CI
   ↓
✅ Tests Pass? → Create Pull Request
   ↓
Code Review + Approval
   ↓
Merge to develop
   ↓
🚀 Auto Deploy to Staging
```

### 2. Production Flow

```
Staging Tested & Approved
   ↓
Create Version Tag (v1.0.0)
   ↓
git tag v1.0.0
git push origin v1.0.0
   ↓
Triggers Production Pipeline:
   ├─ 1. Backup Database ✅
   ├─ 2. Build Backend & Frontend
   ├─ 3. Deploy Backend to EC2
   ├─ 4. Health Check (10 retries)
   ├─ 5. Monitor (2 minutes)
   ├─ 6. Deploy Frontend to CloudFlare
   └─ 7. Send Notification
   ↓
✅ Success → Production Live
❌ Failure → Auto Rollback
```

---

## 📊 Tahapan Detail

### Stage 1: Backend CI (backend-ci.yml)

**Trigger:** Push atau Pull Request ke `main` atau `develop` yang mengubah folder `backend/**`

**Tahapan:**

```mermaid
graph LR
    A[Checkout Code] --> B[Setup Go 1.21]
    B --> C[Cache Dependencies]
    C --> D[Install Dependencies]
    D --> E[Run Tests]
    E --> F[Build Binary]
    F --> G[Upload Artifact]
```

**Detail Tahapan:**

| # | Tahap | Aksi | Jika Gagal | Durasi |
|---|-------|------|------------|--------|
| 1 | **Checkout** | Clone repository | ❌ Pipeline stop | ~10s |
| 2 | **Setup Go** | Install Go 1.21 | ❌ Pipeline stop | ~15s |
| 3 | **Cache** | Restore Go modules dari cache | ⚠️ Download ulang (lebih lama) | ~5s |
| 4 | **Install Deps** | `go mod download` | ❌ Build akan gagal | ~30s |
| 5 | **Run Tests** | Execute semua unit tests dengan PostgreSQL & Redis | ❌ Merge blocked | ~60s |
| 6 | **golangci-lint** | Code quality & security check | ⚠️ Warning (bisa dikonfigurasi) | ~45s |
| 7 | **Build** | Compile binary `go build` | ❌ Can't deploy | ~30s |
| 8 | **Upload** | Simpan binary untuk deploy | ⚠️ Rebuild di deploy stage | ~10s |

**Environment Variables (Test):**
```yaml
DATABASE_URL: postgres://postgres:password@localhost:5432/finlapor_test
REDIS_URL: redis://localhost:6379
JWT_SECRET: test-secret-key-for-ci-only-min-32-chars
APP_ENV: test
```

**Success Criteria:** ✅ Semua tests pass + Build sukses

---

### Stage 2: Frontend CI (frontend-ci.yml)

**Trigger:** Push atau Pull Request ke `main` atau `develop` yang mengubah folder `frontend/**`

**Tahapan:**

```mermaid
graph LR
    A[Checkout Code] --> B[Setup Node 20]
    B --> C[npm ci]
    C --> D[ESLint]
    D --> E[Type Check]
    E --> F[Run Tests]
    F --> G[Build Next.js]
    G --> H[Upload Build]
```

**Detail Tahapan:**

| # | Tahap | Aksi | Jika Gagal | Durasi |
|---|-------|------|------------|--------|
| 1 | **Checkout** | Clone repository | ❌ Pipeline stop | ~10s |
| 2 | **Setup Node** | Install Node.js 20 | ❌ Pipeline stop | ~20s |
| 3 | **npm ci** | Clean install dependencies | ❌ Build akan gagal | ~45s |
| 4 | **Lint** | ESLint check code quality | ⚠️ Fix linting errors | ~30s |
| 5 | **Type Check** | TypeScript validation | ⚠️ Type errors exist | ~25s |
| 6 | **Run Tests** | Execute Jest tests | ❌ Test failures | ~40s |
| 7 | **Build** | `npm run build` (Next.js static export) | ❌ Can't deploy | ~90s |
| 8 | **Upload** | Simpan folder `out/` | ⚠️ Rebuild di deploy | ~15s |

**Success Criteria:** ✅ Lint pass + Type check pass + Tests pass + Build sukses

---

### Stage 3: Deploy Staging (deploy-staging.yml)

**Trigger:** Push ke branch `develop`

**Tahapan:**

```mermaid
graph TD
    A[Trigger: Push to develop] --> B[Build Backend]
    A --> C[Build Frontend]
    B --> D[Deploy to EC2 Staging]
    D --> E[Stop Service]
    E --> F[Backup Current Binary]
    F --> G[Upload New Binary]
    G --> H[Start Service]
    H --> I[Health Check]
    C --> J[Deploy to CloudFlare Pages Staging]
    I --> K{All Healthy?}
    J --> K
    K -->|Yes| L[✅ Staging Live]
    K -->|No| M[❌ Deployment Failed]
```

**Backend Deploy Steps:**

| # | Tahap | Command | Mengapa Penting | Jika Di-skip |
|---|-------|---------|-----------------|--------------|
| 1 | **Setup SSH** | Configure SSH key | Akses ke server | ❌ Can't connect |
| 2 | **Stop Service** | `systemctl stop finlapor` | Prevent port conflict | ⚠️ Port 8080 used |
| 3 | **Backup Binary** | `cp main main.backup-$(date)` | Rollback safety | ❌ Can't rollback |
| 4 | **Upload Binary** | `scp main user@host:/path/` | Deploy new code | ❌ Old code running |
| 5 | **Start Service** | `systemctl start finlapor` | Run new version | ❌ App down |
| 6 | **Health Check** | `curl /health` (5 retries) | Validate deployment | ⚠️ Silent failure |

**Frontend Deploy:**
- Build Next.js dengan `NEXT_PUBLIC_API_URL=staging`
- Deploy ke CloudFlare Pages project `finlapor-staging`
- Branch: `staging`

**Success Criteria:** ✅ Health check returns 200 OK

---

### Stage 4: Deploy Production (deploy-production.yml)

**Trigger:** 
- Git tag dengan pattern `v*` (contoh: `v1.0.0`, `v1.2.3`)
- Manual trigger via GitHub Actions UI

**Tahapan:**

```mermaid
graph TD
    A[Trigger: Tag v1.0.0] --> B[1. Backup Database]
    B --> C{Backup OK?}
    C -->|No| D[❌ Stop Deploy]
    C -->|Yes| E[2. Build Backend]
    E --> F[3. Deploy to Production EC2]
    F --> G[4. Health Check x10]
    G --> H{Healthy?}
    H -->|No| I[🔄 Auto Rollback]
    H -->|Yes| J[5. Monitor 2 min]
    J --> K{Still OK?}
    K -->|No| I
    K -->|Yes| L[6. Deploy Frontend]
    L --> M[7. Send Notification]
    M --> N[✅ Production Live]
    I --> O[❌ Deploy Failed]
```

**Critical Production Steps:**

#### 1️⃣ **Database Backup** (CRITICAL)

```bash
timestamp=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > backup_${timestamp}.sql.gz
aws s3 cp backup_${timestamp}.sql.gz s3://finlapor-backups/production/
```

**Mengapa:** Safety net untuk rollback schema changes

**Jika Di-skip:** ❌ Data loss risk jika migration bermasalah!

**Verification:** Check backup file size > 0

---

#### 2️⃣ **Deploy Backend**

**Pre-deployment:**
```bash
# Backup current binary
cp main main.backup-$(date +%Y%m%d-%H%M%S)

# Stop service gracefully
sudo systemctl stop finlapor
```

**Deploy:**
```bash
# Upload new binary (built with -ldflags="-s -w" for smaller size)
scp -i key.pem main ec2-user@prod:/path/

# Start service
sudo systemctl start finlapor
```

**Post-deployment:**
```bash
# Wait for service startup
sleep 15

# Health check (10 attempts, 10s interval)
for i in {1..10}; do
  curl -f https://api.finlapor.com/health && break
  sleep 10
done
```

---

#### 3️⃣ **Monitoring Period** (2 minutes)

**Mengapa:** Detect memory leaks, crashes, or performance degradation

**Apa yang Di-monitor:**
- Health endpoint still responding
- No error spikes
- Service stable

**Jika Gagal:** Automatic rollback triggered

---

#### 4️⃣ **Deploy Frontend**

```bash
# Build dengan production API URL
NEXT_PUBLIC_API_URL=https://api.finlapor.com npm run build

# Deploy ke CloudFlare Pages production
npx wrangler pages deploy out --project-name finlapor --branch production
```

---

#### 5️⃣ **Notification**

Send Slack webhook:
```json
{
  "text": "✅ Production deployment v1.0.0 completed successfully!"
}
```

---

#### 6️⃣ **Automatic Rollback** (On Failure)

```bash
# Get latest backup binary
BACKUP=$(ls -t main.backup-* | head -1)

# Stop service
sudo systemctl stop finlapor

# Restore backup
cp $BACKUP main

# Start service
sudo systemctl start finlapor

# Verify
curl -f https://api.finlapor.com/health
```

**Rollback Database (if needed):**
```bash
# Download latest backup from S3
aws s3 cp s3://finlapor-backups/production/backup_latest.sql.gz -

# Restore
gunzip | psql $DATABASE_URL
```

---

## 🔐 Required GitHub Secrets

Setup di: **Repository Settings → Secrets and variables → Actions**

### AWS Credentials
```
AWS_ACCESS_KEY_ID          # IAM User Access Key
AWS_SECRET_ACCESS_KEY      # IAM User Secret
AWS_REGION                 # ap-southeast-1
```

### SSH Keys
```
SSH_PRIVATE_KEY_STAGING    # Private key untuk staging server
SSH_PRIVATE_KEY_PROD       # Private key untuk production server
```

### Server Hosts
```
EC2_HOST_STAGING          # staging.finlapor.com atau IP
EC2_HOST_PROD             # api.finlapor.com atau IP
```

### API URLs
```
STAGING_API_URL           # https://staging-api.finlapor.com
PROD_API_URL              # https://api.finlapor.com
```

### Database
```
DATABASE_URL_PROD         # postgres://user:pass@host/db?sslmode=require
```

### CloudFlare
```
CLOUDFLARE_API_TOKEN      # Token dengan Pages:Edit permission
CLOUDFLARE_ACCOUNT_ID     # Account ID dari dashboard
```

### Notifications
```
SLACK_WEBHOOK_URL         # https://hooks.slack.com/services/...
```

---

## 🚀 Cara Deploy

### Deploy ke Staging

```bash
# Commit changes
git add .
git commit -m "feature: add login functionality"

# Push ke develop
git push origin develop

# ✅ Auto-deploy to staging triggered!
```

**Monitor:** Check GitHub Actions tab untuk progress

---

### Deploy ke Production

```bash
# Ensure develop is tested & stable
git checkout main
git merge develop

# Create version tag
git tag v1.0.0

# Push tag
git push origin v1.0.0

# ✅ Production deployment triggered!
```

**Semantic Versioning:**
- `v1.0.0` → Major release (breaking changes)
- `v1.1.0` → Minor release (new features)
- `v1.0.1` → Patch release (bug fixes)

---

## 🔍 Monitoring Deployment

### 1. GitHub Actions UI

```
Repository → Actions tab → Select workflow run
```

**What to check:**
- ✅ All jobs green
- ⏱️ Execution time (detect performance issues)
- 📝 Logs untuk troubleshooting

### 2. Server Logs

```bash
# SSH ke server
ssh ec2-user@api.finlapor.com

# Check service status
sudo systemctl status finlapor

# View logs (real-time)
sudo journalctl -u finlapor -f

# View last 100 lines
sudo journalctl -u finlapor -n 100
```

### 3. Health Endpoint

```bash
# Test dari local
curl https://api.finlapor.com/health

# Expected response
{
  "status": "ok",
  "timestamp": "2026-01-22T15:30:00Z"
}
```

### 4. CloudWatch Metrics (AWS)

**Setup CloudWatch Agent:**
- CPU Usage
- Memory Usage
- Disk Space
- Network In/Out

**Alerts:**
- CPU > 80% for 5 min → Email/Slack
- Memory > 90% → Auto-restart
- Disk > 85% → Clean logs

---

## ❌ Troubleshooting

### Issue 1: CI Tests Fail

**Symptom:**
```
FAIL: TestUserLogin
Expected status 200, got 500
```

**Solutions:**
1. Check database service is running
2. Verify environment variables
3. Check test data setup
4. Run locally: `go test ./...`

---

### Issue 2: Deploy Timeout

**Symptom:**
```
ssh: connect to host XX.XX.XX.XX timeout
```

**Solutions:**
1. Check EC2 security group allows GitHub Actions IPs
2. Verify EC2 instance is running
3. Test SSH key: `ssh -i key.pem user@host`

---

### Issue 3: Health Check Fails

**Symptom:**
```
curl: (7) Failed to connect to api.finlapor.com
```

**Solutions:**
1. Check service status: `systemctl status finlapor`
2. Check port 8080 listening: `netstat -tlnp | grep 8080`
3. Check logs: `journalctl -u finlapor -n 50`
4. Verify firewall: `sudo ufw status`

---

### Issue 4: Rollback Needed

**Manual Rollback:**

```bash
# 1. SSH to server
ssh ec2-user@api.finlapor.com

# 2. Stop service
sudo systemctl stop finlapor

# 3. List backups
ls -lht /home/ec2-user/finlapor/backend/main.backup-*

# 4. Restore specific backup
cp main.backup-20260122-140000 main

# 5. Start service
sudo systemctl start finlapor

# 6. Verify
curl localhost:8080/health
```

---

## 📈 Best Practices

### 1. Branch Strategy

```
main (production)
  ↑ merge only from release tags
  
develop (staging)
  ↑ merge from feature branches
  
feature/* (development)
  ↑ branch from develop
```

**Rules:**
- ❌ Never commit directly to `main`
- ✅ Always create PR for `develop`
- ✅ Require 1 approval for `main` merge
- ✅ All tests must pass

---

### 2. Deployment Windows

**Recommended Times:**
- **Staging:** Anytime (non-critical)
- **Production:** Business hours (Mon-Fri, 10AM-4PM)

**Why:** Team available untuk handle issues

**Avoid:**
- Friday afternoon (no weekend firefighting)
- Holidays
- Peak traffic hours

---

### 3. Rollback Strategy

**Always have:**
- ✅ Database backup (verified)
- ✅ Previous binary backup
- ✅ Runbook for manual rollback
- ✅ Tested rollback procedure

**SLA:**
- Detection: < 5 minutes
- Decision: < 2 minutes  
- Rollback execution: < 5 minutes
- **Total downtime: < 12 minutes**

---

### 4. Security

**Secrets Management:**
- ✅ Use GitHub Secrets (never commit)
- ✅ Rotate secrets quarterly
- ✅ Different secrets for staging/prod
- ✅ Limited access (only deploy workflows)

**SSH Keys:**
- ✅ Separate keys per environment
- ✅ Use passphrase
- ✅ Rotate annually

---

## 📚 Additional Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Files](./.github/workflows/)
- [CI/CD Complete Guide](./cicd-guide.md)
- [Deployment Guide](./deployment.md)

---

## 🆘 Emergency Contacts

**Deployment Issues:**
- DevOps: [Your Contact]
- On-Call: [Rotation schedule]

**Infrastructure:**
- AWS Support: Via AWS Console
- CloudFlare Support: Via dashboard

**Critical Incident:**
1. Stop deployment immediately
2. Assess impact
3. Decide: Fix forward vs Rollback
4. Execute & communicate
5. Post-mortem

---

**Last Updated:** 2026-01-22  
**Version:** 1.0.0
