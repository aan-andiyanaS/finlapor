# Panduan Deployment FinLapor

Panduan lengkap untuk deploy FinLapor ke production menggunakan CloudFlare Pages, AWS EC2, dan AWS Lambda.

---

## Daftar Isi

1. [Persiapan Awal](#1-persiapan-awal)
2. [Setup AWS Account](#2-setup-aws-account)
3. [Setup CloudFlare Account](#3-setup-cloudflare-account)
4. [Deploy Backend ke AWS EC2](#4-deploy-backend-ke-aws-ec2)
5. [Deploy AI Service ke AWS Lambda](#5-deploy-ai-service-ke-aws-lambda)
6. [Deploy Frontend ke CloudFlare Pages](#6-deploy-frontend-ke-cloudflare-pages)
7. [Setup Domain & SSL](#7-setup-domain--ssl)
8. [Monitoring & Maintenance](#8-monitoring--maintenance)

---

## 1. Persiapan Awal

### 1.1 Tools yang Dibutuhkan

Pastikan sudah terinstall di komputer Anda:

```bash
# Check Node.js (minimal v18)
node --version

# Check Go (minimal v1.21)
go version

# Check Docker
docker --version

# Check AWS CLI
aws --version

# Check Git
git --version
```

### 1.2 Akun yang Dibutuhkan

| Layanan | URL | Gratis? |
|---------|-----|---------|
| GitHub | https://github.com | ✅ Ya |
| AWS | https://aws.amazon.com | ✅ Free tier 12 bulan |
| CloudFlare | https://cloudflare.com | ✅ Ya (plan gratis) |
| HuggingFace | https://huggingface.co | ✅ Ya (untuk AI) |

### 1.3 Estimasi Biaya Bulanan

| Layanan | Biaya |
|---------|-------|
| AWS EC2 t3.micro | ~$8.50/bulan |
| AWS S3 (5GB) | ~$0.12/bulan |
| AWS Lambda (1M requests) | Gratis |
| CloudFlare Pages | Gratis |
| **Total** | **~$9-10/bulan** |

---

## 2. Setup AWS Account

### 2.1 Membuat Akun AWS

1. **Buka** https://aws.amazon.com
2. **Klik** "Create an AWS Account" (pojok kanan atas)
3. **Isi form**:
   - Email address: email aktif Anda
   - Password: minimal 8 karakter
   - AWS account name: `finlapor-production`
4. **Verifikasi email** yang dikirim AWS
5. **Pilih** "Personal" account type
6. **Isi data diri** (nama, alamat, nomor HP)
7. **Masukkan kartu kredit/debit** (tidak akan dicharge jika pakai free tier)
8. **Verifikasi** nomor HP via SMS
9. **Pilih** Support Plan: "Basic Support - Free"
10. **Selesai!** Anda akan masuk ke AWS Console

### 2.2 Setup IAM User (Keamanan)

> ⚠️ **PENTING**: Jangan gunakan root account untuk operasi sehari-hari!

1. **Buka** AWS Console → Services → IAM
2. **Klik** "Users" di sidebar kiri
3. **Klik** "Create user"
4. **Isi**:
   - User name: `finlapor-admin`
   - ✅ Check "Provide user access to AWS Management Console"
   - ✅ Check "I want to create an IAM user"
   - Password: buat password baru
5. **Klik** "Next"
6. **Pilih** "Attach policies directly"
7. **Cari dan centang**:
   - `AmazonEC2FullAccess`
   - `AmazonS3FullAccess`
   - `AWSLambda_FullAccess`
   - `AmazonAPIGatewayAdministrator`
   - `IAMFullAccess`
8. **Klik** "Next" → "Create user"
9. **Download** credentials (simpan dengan aman!)

### 2.3 Setup AWS CLI

```bash
# Install AWS CLI (Windows - download dari website)
# https://awscli.amazonaws.com/AWSCLIV2.msi

# Atau via PowerShell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Konfigurasi
aws configure
```

Masukkan saat diminta:
```
AWS Access Key ID: [dari step 2.2]
AWS Secret Access Key: [dari step 2.2]
Default region name: ap-southeast-1
Default output format: json
```

### 2.4 Setup VPC (Virtual Private Cloud)

1. **Buka** AWS Console → VPC
2. **Klik** "Create VPC"
3. **Pilih** "VPC and more" (wizard)
4. **Isi**:
   ```
   Name tag: finlapor-vpc
   IPv4 CIDR block: 10.0.0.0/16
   Number of Availability Zones: 2
   Number of public subnets: 2
   Number of private subnets: 2
   NAT gateways: None (untuk hemat biaya)
   VPC endpoints: None
   ```
5. **Klik** "Create VPC"

### 2.5 Setup Security Groups

#### Security Group untuk EC2 Backend:

1. **Buka** EC2 → Security Groups → "Create security group"
2. **Isi**:
   ```
   Name: finlapor-backend-sg
   Description: Security group for FinLapor backend
   VPC: finlapor-vpc
   ```
3. **Inbound rules** (klik "Add rule"):
   | Type | Port | Source | Description |
   |------|------|--------|-------------|
   | SSH | 22 | My IP | SSH access |
   | Custom TCP | 8080 | 0.0.0.0/0 | API access |
   | PostgreSQL | 5432 | 10.0.0.0/16 | Internal DB |
   | Custom TCP | 6379 | 10.0.0.0/16 | Internal Redis |
4. **Klik** "Create security group"

### 2.6 Setup S3 Bucket

1. **Buka** AWS Console → S3
2. **Klik** "Create bucket"
3. **Isi**:
   ```
   Bucket name: finlapor-storage-[random-id]
   Region: Asia Pacific (Singapore) ap-southeast-1
   Object Ownership: ACLs disabled
   Block Public Access: ❌ Uncheck "Block all public access"
   Bucket Versioning: Disable
   ```
4. **Klik** "Create bucket"

5. **Setup CORS** (untuk upload dari browser):
   - Klik bucket → Permissions → CORS configuration
   - Paste:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://finlapor.com", "http://localhost:3000"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

---

## 3. Setup CloudFlare Account

### 3.1 Membuat Akun CloudFlare

1. **Buka** https://dash.cloudflare.com/sign-up
2. **Isi email dan password**
3. **Verifikasi email**
4. **Login** ke dashboard

### 3.2 Menambahkan Domain (Opsional)

Jika Anda sudah punya domain:

1. **Klik** "Add a Site"
2. **Masukkan** nama domain (contoh: `finlapor.com`)
3. **Pilih** plan "Free"
4. **CloudFlare** akan scan DNS records
5. **Update nameservers** di registrar domain Anda:
   ```
   NS1: [nameserver dari CloudFlare]
   NS2: [nameserver dari CloudFlare]
   ```
6. **Tunggu** propagasi (biasanya 5-30 menit)

### 3.3 Setup CloudFlare Pages

1. **Buka** CloudFlare Dashboard → Pages
2. **Klik** "Create a project"
3. **Pilih** "Connect to Git"
4. **Authorize** GitHub
5. **Pilih repository**: `finlapor`
6. **Konfigurasi build**:
   ```
   Project name: finlapor
   Production branch: main
   Framework preset: Next.js
   Build command: cd frontend && npm run build
   Build output directory: frontend/out
   Root directory: /
   ```
7. **Environment variables** (klik "Add variable"):
   ```
   NEXT_PUBLIC_API_URL = https://api.finlapor.com
   ```
8. **Klik** "Save and Deploy"

### 3.4 Setup Custom Domain di CloudFlare Pages

1. **Buka** Pages → Project → Custom domains
2. **Klik** "Set up a custom domain"
3. **Masukkan**: `finlapor.com`
4. **Klik** "Continue" → "Activate domain"
5. **Tambahkan** juga: `www.finlapor.com`

---

## 4. Deploy Backend ke AWS EC2

### 4.1 Launch EC2 Instance

1. **Buka** AWS Console → EC2 → "Launch Instance"
2. **Konfigurasi**:
   ```
   Name: finlapor-backend
   
   AMI: Amazon Linux 2023 AMI (Free tier eligible)
   
   Instance type: t3.micro (Free tier eligible)
   
   Key pair: 
   - Klik "Create new key pair"
   - Name: finlapor-key
   - Type: RSA
   - Format: .pem
   - Download dan simpan dengan aman!
   
   Network settings:
   - VPC: finlapor-vpc
   - Subnet: public subnet
   - Auto-assign public IP: Enable
   - Security group: finlapor-backend-sg
   
   Storage: 20 GB gp3
   ```
3. **Klik** "Launch instance"
4. **Catat** Public IP address

### 4.2 Connect ke EC2

```bash
# Ubah permission key file
chmod 400 finlapor-key.pem

# Connect via SSH
ssh -i finlapor-key.pem ec2-user@[PUBLIC_IP]
```

### 4.3 Install Dependencies di EC2

```bash
# Update system
sudo yum update -y

# Install Git
sudo yum install git -y

# Install Go 1.21
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
go version

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout dan login ulang untuk apply docker group
exit
```

### 4.4 Clone dan Setup Project

```bash
# Login ulang
ssh -i finlapor-key.pem ec2-user@[PUBLIC_IP]

# Clone repository
git clone https://github.com/[username]/finlapor.git
cd finlapor

# Create .env file
cat > backend/.env << 'EOF'
DATABASE_URL=postgres://postgres:password@localhost:5432/finlapor?sslmode=disable
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
S3_BUCKET=finlapor-storage-xxxxx
PORT=8080
APP_ENV=production
FRONTEND_URL=https://finlapor.com
EOF

# Start database dengan Docker
docker-compose up -d postgres redis

# Tunggu database siap
sleep 10

# Run migrations
docker exec -i finlapor-postgres-1 psql -U postgres -d finlapor < database/migrations/001_initial.sql

# Build backend
cd backend
go build -o main cmd/server/main.go

# Test run
./main
```

### 4.5 Setup Systemd Service

```bash
# Buat service file
sudo cat > /etc/systemd/system/finlapor.service << 'EOF'
[Unit]
Description=FinLapor Backend API
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/finlapor/backend
ExecStart=/home/ec2-user/finlapor/backend/main
Restart=always
RestartSec=5
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
EOF

# Enable dan start service
sudo systemctl daemon-reload
sudo systemctl enable finlapor
sudo systemctl start finlapor

# Check status
sudo systemctl status finlapor

# View logs
sudo journalctl -u finlapor -f
```

### 4.6 Setup Nginx Reverse Proxy (Opsional)

```bash
# Install Nginx
sudo yum install nginx -y

# Konfigurasi
sudo cat > /etc/nginx/conf.d/finlapor.conf << 'EOF'
server {
    listen 80;
    server_name api.finlapor.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 5. Deploy AI Service ke AWS Lambda

### 5.1 Setup HuggingFace Token

1. **Buka** https://huggingface.co/settings/tokens
2. **Klik** "New token"
3. **Isi**:
   - Name: `finlapor-production`
   - Role: `read`
4. **Copy** token yang dihasilkan

### 5.2 Install Serverless Framework

```bash
# Install Node.js jika belum
# Windows: https://nodejs.org/

# Install Serverless
npm install -g serverless

# Verify
serverless --version
```

### 5.3 Configure Serverless

```bash
cd ai-service

# Login ke Serverless (opsional)
serverless login

# Install plugin
npm init -y
npm install serverless-python-requirements

# Set AWS credentials
serverless config credentials --provider aws --key [ACCESS_KEY] --secret [SECRET_KEY]
```

### 5.4 Deploy Lambda

```bash
# Set environment variable
export HF_TOKEN=hf_xxxxxxxxxxxxx

# Deploy
serverless deploy --stage production

# Output akan menampilkan:
# endpoints:
#   POST - https://xxxxxxxx.execute-api.ap-southeast-1.amazonaws.com/production/
```

### 5.5 Test Lambda

```bash
# Test health
curl https://[API_GATEWAY_URL]/health

# Test OCR
curl -X POST https://[API_GATEWAY_URL]/ \
  -H "Content-Type: application/json" \
  -d '{"action": "ocr", "image_url": "https://example.com/receipt.jpg"}'
```

---

## 6. Deploy Frontend ke CloudFlare Pages

### 6.1 Build Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build untuk production
npm run build

# Output di folder: out/
```

### 6.2 Deploy via Git (Otomatis)

Jika sudah setup CloudFlare Pages dengan GitHub:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

CloudFlare akan otomatis build dan deploy.

### 6.3 Deploy via Wrangler (Manual)

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler pages deploy out --project-name=finlapor
```

---

## 7. Setup Domain & SSL

### 7.1 DNS Records di CloudFlare

Buka CloudFlare → DNS → Records, tambahkan:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | [EC2 Public IP] | ❌ DNS only |
| A | api | [EC2 Public IP] | ✅ Proxied |
| CNAME | www | finlapor.com | ✅ Proxied |

### 7.2 SSL/TLS Settings

1. **Buka** CloudFlare → SSL/TLS
2. **Pilih** mode: "Full (strict)"
3. **Enable**:
   - Always Use HTTPS: ✅
   - Automatic HTTPS Rewrites: ✅
   - Minimum TLS Version: 1.2

### 7.3 Setup SSL di EC2 (Let's Encrypt)

```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx -y

# Generate certificate
sudo certbot --nginx -d api.finlapor.com

# Auto-renewal
sudo systemctl enable certbot-renew.timer
```

---

## 8. Monitoring & Maintenance

### 8.1 CloudFlare Analytics

- **Buka** CloudFlare → Analytics
- Monitor: Requests, Bandwidth, Threats blocked

### 8.2 AWS CloudWatch

1. **Buka** AWS Console → CloudWatch
2. **Create Dashboard**: `finlapor-monitoring`
3. **Add widgets**:
   - EC2 CPU Utilization
   - EC2 Network In/Out
   - Lambda Invocations
   - Lambda Errors

### 8.3 Setup Alerts

```bash
# Di EC2, install CloudWatch Agent
sudo yum install amazon-cloudwatch-agent -y

# Konfigurasi
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### 8.4 Backup Database

```bash
# Cron job untuk backup harian
crontab -e

# Tambahkan:
0 2 * * * docker exec finlapor-postgres-1 pg_dump -U postgres finlapor | gzip > /home/ec2-user/backups/finlapor_$(date +\%Y\%m\%d).sql.gz
```

### 8.5 Auto Update dari GitHub

```bash
# Script update.sh
cat > ~/update.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/finlapor
git pull origin main
cd backend
go build -o main cmd/server/main.go
sudo systemctl restart finlapor
EOF

chmod +x ~/update.sh

# Jalankan saat ada update
./update.sh
```

---

## Troubleshooting

### Backend tidak bisa connect ke database

```bash
# Check status PostgreSQL
docker ps

# Check logs
docker logs finlapor-postgres-1

# Restart
docker-compose restart postgres
```

### Frontend tidak bisa akses API

1. Check CORS di backend
2. Check CloudFlare → Firewall → Overview
3. Pastikan URL API benar di environment

### Lambda timeout

1. Increase timeout di serverless.yml:
   ```yaml
   provider:
     timeout: 60
   ```
2. Redeploy: `serverless deploy`

### SSL Certificate Error

```bash
# Renew certificate
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

---

## Quick Reference

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | https://finlapor.com | - |
| API | https://api.finlapor.com | - |
| CloudFlare | https://dash.cloudflare.com | [email] |
| AWS Console | https://console.aws.amazon.com | [email] |
| GitHub | https://github.com/[user]/finlapor | [email] |

---

## Support

Jika ada pertanyaan atau masalah:
- Buat issue di GitHub repository
- Email: support@finlapor.com
