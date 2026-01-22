# 🚀 Deployment Guide

Panduan lengkap untuk deploy FinLapor ke production.

---

## 📋 Overview

| Component | Platform | Cost |
|-----------|----------|------|
| Frontend | CloudFlare Pages | FREE |
| API Gateway | AWS API Gateway | ~$1-3/mo |
| Backend | AWS EC2 (Private Subnet) | ~$8/mo |
| AI Service | AWS Lambda | FREE tier |
| Database | PostgreSQL (on EC2) | Included |
| Storage | AWS S3 | ~$0.10/mo |

**Total: ~$9-12/month**

---

## 1️⃣ AWS Setup

### 1.1 Create VPC

```bash
# Buat VPC dengan wizard
# AWS Console → VPC → Create VPC

VPC settings:
- Name: finlapor-vpc
- IPv4 CIDR: 10.0.0.0/16
- Number of AZs: 2
- Public subnets: 2
- Private subnets: 2
- NAT gateways: 0 (kita tidak pakai)
```

### 1.2 Create EC2 Instance

```bash
# AWS Console → EC2 → Launch Instance

Settings:
- Name: finlapor-backend
- AMI: Ubuntu 22.04 LTS
- Instance type: t3.micro
- VPC: finlapor-vpc
- Subnet: Private subnet (!)
- Security Group: (buat baru)
- Key pair: Create new

# Security Group rules:
Inbound:
- Port 8080 from API Gateway (akan dikonfigurasi nanti)
- Port 22 from Bastion (untuk SSH)

Outbound:
- All traffic
```

### 1.3 Create S3 Bucket

```bash
# AWS Console → S3 → Create bucket

Settings:
- Name: finlapor-storage-{unique-id}
- Region: ap-southeast-1
- Block all public access: Yes
- Versioning: Enabled
```

### 1.4 Create Lambda Function

```bash
# AWS Console → Lambda → Create function

Settings:
- Name: finlapor-ai-service
- Runtime: Python 3.11
- Architecture: x86_64

# Upload code dari ai-service/
# Atau deploy dengan Serverless Framework:
cd ai-service
npm install -g serverless
serverless deploy
```

### 1.5 Create API Gateway

```bash
# AWS Console → API Gateway → Create API

Type: HTTP API
Name: finlapor-api

# Add integration:
- VPC Link to EC2 Private Subnet

# Routes:
ANY /api/{proxy+} → VPC Link → EC2:8080
```

---

## 2️⃣ EC2 Setup

### 2.1 Connect to EC2

```bash
# Karena EC2 di private subnet, gunakan SSM Session Manager
# Atau setup Bastion Host di public subnet

aws ssm start-session --target i-xxxxxxxxx
```

### 2.2 Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout dan login lagi
exit
```

### 2.3 Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/yourusername/finlapor.git
cd finlapor
```

### 2.4 Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Edit dengan nilai production
nano .env
```

```env
# Production .env
DATABASE_URL=postgres://postgres:your-secure-password@localhost:5432/finlapor
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-production-jwt-secret-32-chars-min
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
S3_BUCKET=finlapor-storage-xxx
S3_REGION=ap-southeast-1
HF_TOKEN=hf_xxxxxxxxxx
LAMBDA_FUNCTION_NAME=finlapor-ai-service
AWS_REGION=ap-southeast-1
ENVIRONMENT=production
```

### 2.5 Run with Docker Compose

```bash
# Build dan jalankan
docker-compose -f docker-compose.prod.yml up -d

# Cek status
docker-compose ps

# Lihat logs
docker-compose logs -f backend
```

---

## 3️⃣ CloudFlare Pages Setup

### 3.1 Connect Repository

1. Login ke [CloudFlare Dashboard](https://dash.cloudflare.com)
2. Pilih **Pages** di sidebar
3. Klik **Create a project**
4. Klik **Connect to Git**
5. Pilih GitHub dan authorize
6. Pilih repository `finlapor`

### 3.2 Configure Build

```
Project name: finlapor
Production branch: main
Root directory: frontend

Build settings:
- Framework preset: Next.js (Static HTML Export)
- Build command: npm run build
- Build output directory: out
```

### 3.3 Environment Variables

```
NEXT_PUBLIC_API_URL = https://api.finlapor.com
```

### 3.4 Deploy

Klik **Save and Deploy**. CloudFlare akan build dan deploy otomatis.

### 3.5 Custom Domain

1. Di project settings, pilih **Custom domains**
2. Klik **Set up a custom domain**
3. Masukkan `finlapor.com`
4. CloudFlare akan auto-configure DNS

---

## 4️⃣ CloudFlare DNS Setup

```
# Di CloudFlare DNS settings untuk domain Anda:

Type    Name        Content                 Proxy
CNAME   @           finlapor.pages.dev      ☁️ ON
CNAME   www         finlapor.pages.dev      ☁️ ON
CNAME   api         <api-gateway-url>       ☁️ ON
```

---

## 5️⃣ SSL/TLS Configuration

Di CloudFlare SSL/TLS settings:

```
SSL/TLS encryption mode: Full (strict)
Edge Certificates: 
  - Always Use HTTPS: ON
  - Minimum TLS Version: 1.2
  - Automatic HTTPS Rewrites: ON
```

---

## 6️⃣ Verify Deployment

### Check Backend

```bash
curl https://api.finlapor.com/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Check Frontend

Buka https://finlapor.com di browser.

### Check Lambda

```bash
aws lambda invoke \
  --function-name finlapor-ai-service \
  --payload '{"action":"health"}' \
  response.json

cat response.json
```

---

## 7️⃣ Monitoring & Logs

### CloudFlare Analytics

Dashboard → Analytics → Web Traffic

### EC2 Logs

```bash
# SSH ke EC2
docker-compose logs -f backend

# Atau lihat di CloudWatch (jika dikonfigurasi)
```

### Lambda Logs

AWS Console → CloudWatch → Log Groups → /aws/lambda/finlapor-ai-service

---

## 8️⃣ Backup Strategy

### Database Backup

```bash
# Cron job untuk backup harian
0 2 * * * docker exec finlapor-postgres pg_dump -U postgres finlapor > /backups/db-$(date +\%Y\%m\%d).sql

# Upload ke S3
0 3 * * * aws s3 cp /backups/ s3://finlapor-backups/ --recursive
```

### S3 Versioning

S3 versioning sudah enabled untuk recovery.

---

## 9️⃣ CI/CD with GitHub Actions

### Frontend Auto-Deploy

CloudFlare Pages sudah auto-deploy saat push ke main.

### Backend Deploy

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu/finlapor
            git pull origin main
            docker-compose -f docker-compose.prod.yml up -d --build backend
```

---

## 🔧 Troubleshooting

### Backend tidak bisa diakses

1. Cek Security Group EC2
2. Cek VPC Link di API Gateway
3. Cek logs: `docker-compose logs backend`

### Frontend blank page

1. Cek build logs di CloudFlare Pages
2. Pastikan environment variables benar
3. Cek browser console untuk errors

### Lambda timeout

1. Increase timeout di Lambda settings
2. Cek memory allocation
3. Optimize code

---

## 📚 References

- [CloudFlare Pages Docs](https://developers.cloudflare.com/pages/)
- [AWS API Gateway Docs](https://docs.aws.amazon.com/apigateway/)
- [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)
