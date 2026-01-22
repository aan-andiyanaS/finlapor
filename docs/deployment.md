# Panduan Deployment FinLapor

Panduan lengkap untuk deploy FinLapor ke production menggunakan CloudFlare Pages dan AWS.

> 📌 **Repository**: https://github.com/aan-andiyanaS/finlapor.git

---

## Daftar Isi

1. [Persiapan Awal](#1-persiapan-awal)
2. [Setup AWS Account](#2-setup-aws-account)
3. [Setup CloudFlare Account](#3-setup-cloudflare-account)
4. [Pilih Arsitektur Deployment](#4-pilih-arsitektur-deployment)
   - [Opsi A: Public Subnet (Sederhana)](#opsi-a-public-subnet-sederhana)
   - [Opsi B: Private Subnet + API Gateway (Advanced)](#opsi-b-private-subnet--api-gateway-advanced)
5. [Deploy AI Service ke AWS Lambda](#5-deploy-ai-service-ke-aws-lambda)
6. [Deploy Frontend ke CloudFlare Pages](#6-deploy-frontend-ke-cloudflare-pages)
7. [Setup Domain & SSL](#7-setup-domain--ssl)
8. [Monitoring & Maintenance](#8-monitoring--maintenance)

---

## 1. Persiapan Awal

### 1.1 Tools yang Dibutuhkan

> **🤔 Mengapa perlu tools ini?**
> - **Node.js**: Untuk build frontend Next.js
> - **Go**: Backend ditulis dalam Go
> - **Docker**: Menjalankan database tanpa install langsung
> - **AWS CLI**: Deploy ke AWS dari terminal
> - **Git**: Version control

```bash
node --version    # minimal v18
go version        # minimal v1.21
docker --version  # minimal v20
aws --version     # AWS CLI v2
git --version
```

### 1.2 Akun yang Dibutuhkan

| Layanan | URL | Gratis? | Fungsi |
|---------|-----|---------|--------|
| GitHub | https://github.com | ✅ Ya | Repository code |
| AWS | https://aws.amazon.com | ✅ Free tier 12 bulan | Backend & infrastructure |
| CloudFlare | https://cloudflare.com | ✅ Ya | Frontend hosting & CDN |
| HuggingFace | https://huggingface.co | ✅ Ya | AI models (opsional) |

### 1.3 Perbandingan Biaya

| Arsitektur | Biaya/Bulan | Keamanan | Kompleksitas |
|------------|-------------|----------|--------------|
| **Public Subnet** | ~$9-10 | Standar | Mudah |
| **Private Subnet** | ~$13-45 | Tinggi | Kompleks |

---

## 2. Setup AWS Account

### 2.1 Membuat Akun AWS

> **🤔 Mengapa perlu akun sendiri?**
> Setiap akun mendapat free tier terpisah: 750 jam EC2, 5GB S3, 1M Lambda requests.

1. Buka https://aws.amazon.com
2. Klik "Create an AWS Account"
3. Isi email, password, nama akun: `finlapor-production`
4. Verifikasi email
5. Pilih "Personal" account
6. Masukkan kartu kredit (untuk verifikasi, tidak dicharge)
7. Pilih "Basic Support - Free"

### 2.2 Setup IAM User

> **🤔 Mengapa IAM User?**
> Root account berbahaya jika bocor. IAM User bisa dibatasi aksesnya.

1. AWS Console → IAM → Users → Create user
2. User name: `finlapor-admin`
3. Attach policies:
   - `AmazonEC2FullAccess`
   - `AmazonS3FullAccess`
   - `AWSLambda_FullAccess`
   - `AmazonAPIGatewayAdministrator`
   - `IAMFullAccess`
4. Download credentials (simpan aman!)

### 2.3 Setup AWS CLI

```bash
aws configure
# AWS Access Key ID: [dari IAM]
# AWS Secret Access Key: [dari IAM]
# Default region: ap-southeast-1
# Output format: json
```

### 2.4 Setup S3 Bucket

> **🤔 Mengapa S3?**
> Storage untuk file (foto struk, laporan PDF). Murah: $0.023/GB/bulan.

1. S3 → Create bucket
2. Name: `finlapor-storage-[random]`
3. Region: ap-southeast-1
4. Uncheck "Block all public access"
5. Setup CORS:
```json
[{"AllowedHeaders":["*"],"AllowedMethods":["GET","PUT","POST"],"AllowedOrigins":["https://finlapor.com","http://localhost:3000"]}]
```

---

## 3. Setup CloudFlare Account

> **🤔 Mengapa CloudFlare?**
> Gratis, CDN global, DDoS protection, SSL otomatis.

1. Buka https://dash.cloudflare.com/sign-up
2. Buat akun dan verifikasi email
3. (Opsional) Tambahkan domain → pilih Free plan → update nameservers

---

## 4. Pilih Arsitektur Deployment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PILIH ARSITEKTUR                                 │
├─────────────────────────────────┬───────────────────────────────────┤
│      OPSI A: PUBLIC SUBNET      │   OPSI B: PRIVATE SUBNET + API GW │
├─────────────────────────────────┼───────────────────────────────────┤
│ ✅ Mudah setup                   │ ✅ Lebih aman                      │
│ ✅ Biaya rendah (~$9/bulan)      │ ✅ Enterprise-grade                │
│ ✅ SSH langsung ke server        │ ⚠️ Butuh Bastion Host              │
│ ⚠️ Backend terekspos internet    │ ⚠️ Biaya lebih tinggi (~$13-45)    │
│                                 │                                   │
│ Cocok untuk:                    │ Cocok untuk:                      │
│ - Development                   │ - Production                      │
│ - MVP/Demo                      │ - Enterprise                      │
│ - Proyek UAS                    │ - Compliance (PCI-DSS)            │
└─────────────────────────────────┴───────────────────────────────────┘
```

---

# OPSI A: Public Subnet (Sederhana)

## A.1 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                           AWS VPC                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    PUBLIC SUBNET                          │  │
│  │                                                           │  │
│  │   ┌─────────────────────────────────────────────────┐     │  │
│  │   │              EC2 (t3.micro)                     │     │  │
│  │   │   ┌─────────┐  ┌─────────┐  ┌─────────┐        │     │  │
│  │   │   │ Go API  │  │PostgreSQL│  │  Redis  │        │     │  │
│  │   │   │  :8080  │  │  :5432  │  │  :6379  │        │     │  │
│  │   │   └─────────┘  └─────────┘  └─────────┘        │     │  │
│  │   └─────────────────────────────────────────────────┘     │  │
│  │                          ▲                                │  │
│  │                          │ Port 8080                      │  │
│  └──────────────────────────┼────────────────────────────────┘  │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────┐
                 │   CloudFlare CDN    │──────► User
                 └─────────────────────┘
```

## A.2 Setup VPC

1. VPC → Create VPC → "VPC and more"
2. Konfigurasi:
   ```
   Name: finlapor-vpc
   IPv4 CIDR: 10.0.0.0/16
   Availability Zones: 2
   Public subnets: 2
   Private subnets: 0
   NAT gateways: None
   ```

## A.3 Setup Security Group

1. EC2 → Security Groups → Create
2. Name: `finlapor-backend-sg`
3. Inbound rules:

| Type | Port | Source | Mengapa? |
|------|------|--------|----------|
| SSH | 22 | My IP | Remote access |
| Custom TCP | 8080 | 0.0.0.0/0 | API access |
| PostgreSQL | 5432 | 10.0.0.0/16 | Internal DB |
| Custom TCP | 6379 | 10.0.0.0/16 | Internal Redis |

## A.4 Launch EC2 Instance

1. EC2 → Launch Instance
2. Konfigurasi:
   ```
   Name: finlapor-backend
   AMI: Amazon Linux 2023
   Type: t3.micro (free tier)
   Key pair: Create new → finlapor-key.pem
   VPC: finlapor-vpc
   Subnet: Public subnet
   Auto-assign public IP: Enable
   Security group: finlapor-backend-sg
   Storage: 20GB gp3
   ```

## A.5 Connect & Setup Server

```bash
# Connect
ssh -i finlapor-key.pem ec2-user@[PUBLIC_IP]

# Install dependencies
sudo yum update -y
sudo yum install git docker -y
sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Go
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout & login ulang
exit
```

## A.6 Deploy Application

```bash
# Login ulang
ssh -i finlapor-key.pem ec2-user@[PUBLIC_IP]

# Clone repo
git clone https://github.com/aan-andiyanaS/finlapor.git
cd finlapor

# Setup environment
cat > backend/.env << 'EOF'
DATABASE_URL=postgres://postgres:password@localhost:5432/finlapor?sslmode=disable
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=finlapor-storage-xxxxx
PORT=8080
APP_ENV=production
EOF

# Start database
docker-compose up -d postgres redis
sleep 10

# Run migrations
docker exec -i finlapor-postgres-1 psql -U postgres -d finlapor < database/migrations/001_initial.sql

# Build & run
cd backend
go build -o main cmd/server/main.go
./main
```

## A.7 Setup Systemd Service

```bash
sudo tee /etc/systemd/system/finlapor.service << 'EOF'
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

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable finlapor
sudo systemctl start finlapor
```

## A.8 Update DNS di CloudFlare

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | api | [EC2 Public IP] | ✅ Proxied |

---

# OPSI B: Private Subnet + API Gateway (Advanced)

## B.1 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                           AWS VPC                               │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │  PUBLIC SUBNET   │         │      PRIVATE SUBNET          │  │
│  │                  │         │                              │  │
│  │  ┌────────────┐  │   SSH   │  ┌────────────────────────┐  │  │
│  │  │  Bastion   │──┼────────►│  │      EC2 Backend       │  │  │
│  │  │  (t3.nano) │  │         │  │  ┌────┐ ┌────┐ ┌────┐  │  │  │
│  │  └────────────┘  │         │  │  │ Go │ │ PG │ │Redis│  │  │  │
│  │       ▲          │         │  │  └────┘ └────┘ └────┘  │  │  │
│  │     SSH          │         │  └────────────▲───────────┘  │  │
│  │   (My IP)        │         │               │ Port 8080    │  │
│  └──────────────────┘         └───────────────┼──────────────┘  │
│                                               │ VPC Link       │
│  ┌────────────────────────────────────────────┴──────────────┐  │
│  │                    AWS API Gateway                         │  │
│  │                    api.finlapor.com                        │  │
│  └────────────────────────────┬──────────────────────────────┘  │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
                   ┌─────────────────────┐
                   │   CloudFlare CDN    │──────► User
                   └─────────────────────┘
```

## B.2 Setup VPC dengan Private Subnet

1. VPC → Create VPC → "VPC and more"
2. Konfigurasi:
   ```
   Name: finlapor-vpc-secure
   IPv4 CIDR: 10.0.0.0/16
   Availability Zones: 2
   Public subnets: 2
   Private subnets: 2
   NAT gateways: In 1 AZ (atau None untuk hemat)
   ```

> **🤔 Mengapa NAT Gateway?**
> Instance di private subnet butuh NAT untuk akses internet (download packages).
> Biaya: ~$32/bulan. Bisa dimatikan setelah setup selesai.

## B.3 Security Groups

### Backend Security Group (Private):
```
Name: finlapor-backend-private-sg
```

| Type | Port | Source | Mengapa? |
|------|------|--------|----------|
| Custom TCP | 8080 | API Gateway SG | Hanya dari API Gateway |
| PostgreSQL | 5432 | 10.0.0.0/16 | Internal VPC |
| Custom TCP | 6379 | 10.0.0.0/16 | Internal Redis |
| SSH | 22 | Bastion SG | Via Bastion only |

### Bastion Security Group:
```
Name: finlapor-bastion-sg
```

| Type | Port | Source | Mengapa? |
|------|------|--------|----------|
| SSH | 22 | My IP | Hanya IP Anda |

## B.4 Launch Bastion Host

> **🤔 Mengapa Bastion?**
> Instance di private subnet tidak punya public IP. Bastion = jump server.

1. EC2 → Launch Instance
2. Konfigurasi:
   ```
   Name: finlapor-bastion
   AMI: Amazon Linux 2023
   Type: t3.nano (~$3.80/bulan)
   Subnet: PUBLIC subnet
   Auto-assign public IP: Enable
   Security group: finlapor-bastion-sg
   ```

## B.5 Launch Backend di Private Subnet

1. EC2 → Launch Instance
2. Konfigurasi:
   ```
   Name: finlapor-backend-private
   AMI: Amazon Linux 2023
   Type: t3.micro
   Subnet: PRIVATE subnet
   Auto-assign public IP: Disable
   Security group: finlapor-backend-private-sg
   ```

## B.6 SSH via Bastion

```bash
# Metode 1: SSH Jump
ssh -J ec2-user@[BASTION_PUBLIC_IP] ec2-user@[BACKEND_PRIVATE_IP] -i finlapor-key.pem

# Metode 2: SSH Config
cat >> ~/.ssh/config << 'EOF'
Host bastion
    HostName [BASTION_PUBLIC_IP]
    User ec2-user
    IdentityFile ~/.ssh/finlapor-key.pem

Host finlapor-backend
    HostName [BACKEND_PRIVATE_IP]
    User ec2-user
    IdentityFile ~/.ssh/finlapor-key.pem
    ProxyJump bastion
EOF

# Lalu cukup:
ssh finlapor-backend
```

## B.7 Setup Backend (sama dengan A.5 & A.6)

SSH ke backend via Bastion, lalu lakukan langkah yang sama:
- Install dependencies
- Clone repo
- Setup environment
- Start database
- Build & run
- Setup systemd

## B.8 Setup API Gateway

### B.8.1 Create VPC Link

1. API Gateway → VPC Links → Create
2. Konfigurasi:
   ```
   Name: finlapor-vpc-link
   VPC: finlapor-vpc-secure
   Subnets: Private subnets
   Security groups: finlapor-backend-private-sg
   ```
3. Tunggu status "Available" (5-10 menit)

### B.8.2 Create HTTP API

1. API Gateway → Create API → HTTP API → Build
2. API name: `finlapor-api`

### B.8.3 Create Integration

1. API → Integrations → Create
2. Konfigurasi:
   ```
   Type: Private resource
   VPC link: finlapor-vpc-link
   Method: ANY
   URL: http://[BACKEND_PRIVATE_IP]:8080/{proxy}
   ```

### B.8.4 Create Routes

1. Routes → Create
2. Route: `ANY /{proxy+}`
3. Integration: pilih integration yang baru dibuat

### B.8.5 Deploy

1. Deploy → Create stage
2. Stage name: `production`
3. Copy Invoke URL

### B.8.6 Test

```bash
curl https://[API_GATEWAY_URL]/health
```

## B.9 Custom Domain untuk API Gateway

1. ACM → Request certificate: `api.finlapor.com`
2. Validate via DNS (tambah CNAME di CloudFlare)
3. API Gateway → Custom domain names → Create
4. Domain: `api.finlapor.com`
5. API mappings → Map ke `finlapor-api` stage `production`
6. CloudFlare DNS: CNAME `api` → API Gateway domain

## B.10 Cost Summary (Private Subnet)

| Item | Per Bulan |
|------|-----------|
| EC2 t3.micro (backend) | ~$8.50 |
| EC2 t3.nano (bastion) | ~$3.80 |
| API Gateway (1M req) | ~$1.00 |
| NAT Gateway (opsional) | ~$32.00 |
| **Total (dengan NAT)** | **~$45/bulan** |
| **Total (tanpa NAT)** | **~$13/bulan** |

> 💡 **Tips**: Matikan NAT Gateway setelah setup, gunakan VPC Endpoints untuk S3.

## B.10 Optimasi Biaya: VPC Endpoints untuk S3

> **🤔 Mengapa VPC Endpoints?**
> - **Hemat**: Tidak perlu NAT Gateway (c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor32/bulan)
> - **Cepat**: Akses langsung ke S3 tanpa internet
> - **Aman**: Traffic tidak keluar dari AWS network

### B.10.1 Setup VPC Endpoint untuk S3

1. **VPC → Endpoints → Create endpoint**
2. Konfigurasi:
   ```
   Name: finlapor-s3-endpoint
   Service category: AWS services
   Service name: com.amazonaws.ap-southeast-1.s3
   VPC: finlapor-vpc-secure
   Route tables: Select PRIVATE subnet route tables
   ```

3. **Policy** (opsional - untuk restrict ke bucket tertentu):
   ```json
   {
     "Statement": [
       {
         "Sid": "AccessToSpecificBucket",
         "Effect": "Allow",
         "Principal": "*",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::finlapor-storage-*",
           "arn:aws:s3:::finlapor-storage-*/*"
         ]
       }
     ]
   }
   ```

4. **Create endpoint**

### B.10.2 Verifikasi VPC Endpoint

SSH ke backend di private subnet dan test:

```bash
# Test S3 access via VPC endpoint
aws s3 ls s3://finlapor-storage-xxxxx

# Upload test file
echo "test" > test.txt
aws s3 cp test.txt s3://finlapor-storage-xxxxx/test.txt

# Download test file  
aws s3 cp s3://finlapor-storage-xxxxx/test.txt downloaded.txt
cat downloaded.txt
```

> **✅ Jika berhasil**, artinya VPC Endpoint sudah berfungsi!

### B.10.3 Matikan NAT Gateway

**Setelah VPC Endpoint berjalan**, NAT Gateway bisa dimatikan untuk hemat biaya:

1. **VPC → NAT Gateways**
2. Pilih NAT Gateway Anda
3. **Actions → Delete NAT gateway**
4. Ketik "delete" untuk confirm
5. **VPC → Elastic IPs**
6. Pilih EIP yang tadinya attached ke NAT Gateway
7. **Actions → Release Elastic IP address**

> **⚠️ Warning**: Setelah NAT Gateway dihapus, instance di private subnet **tidak bisa akses internet** kecuali via VPC Endpoints.

### B.10.4 Tambahan: VPC Endpoint untuk Services Lain (Opsional)

Jika butuh akses ke AWS services lain tanpa NAT Gateway:

| Service | Endpoint Name | Use Case |
|---------|---------------|----------|
| **S3** | com.amazonaws.region.s3 | File storage (sudah disetup) |
| **DynamoDB** | com.amazonaws.region.dynamodb | NoSQL database |
| **ECR** | com.amazonaws.region.ecr.api | Docker registry |
| **CloudWatch Logs** | com.amazonaws.region.logs | Logging |
| **SSM** | com.amazonaws.region.ssm | Systems Manager |

**Setup sama seperti S3 Endpoint di atas**.

### B.10.5 Checklist Optimasi Biaya

- [ ] VPC Endpoint untuk S3 created
- [ ] Test S3 access dari private subnet
- [ ] Upload/download test berhasil
- [ ] NAT Gateway deleted
- [ ] Elastic IP released
- [ ] (Opsional) Tambah VPC Endpoints lain sesuai kebutuhan

### B.10.6 Perbandingan Biaya

| Setup | NAT Gateway | VPC Endpoint S3 | Total/Bulan |
|-------|-------------|-----------------|-------------|
| **Dengan NAT** | c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor32.00 | c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor0 | ~c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor45/bulan |
| **Dengan VPC Endpoint** | c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor0 | c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor0* | ~c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor13/bulan |

\* VPC Endpoint S3 Gateway: **GRATIS** (tidak ada biaya)!

> **💰 Penghematan**: **c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor32/bulan** atau **c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor384/tahun**

## B.11 Cost Summary (Private Subnet - Final)

| Item | Per Bulan |
|------|-----------|
| EC2 t3.micro (backend) | ~c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor8.50 |
| EC2 t3.nano (bastion) | ~c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor3.80 |
| API Gateway (1M req) | ~c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor1.00 |
| NAT Gateway (opsional) | ~c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor32.00 |
| VPC Endpoint S3 | **c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor0** (GRATIS) |
| **Total (dengan NAT)** | **~c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor45/bulan** |
| **Total (dengan VPC Endpoint)** | **~c:\Users\NITRO V 15\OneDrive\Documents\kuliah\semester7\UAS\finlapor13/bulan** |


---

## 5. Deploy AI Service ke AWS Lambda

> Berlaku untuk kedua opsi arsitektur.

### 5.1 Setup HuggingFace Token (Opsional)

1. Buka https://huggingface.co/settings/tokens
2. New token → Name: `finlapor` → Role: read
3. Copy token

### 5.2 Install Serverless Framework

```bash
npm install -g serverless
serverless config credentials --provider aws --key [ACCESS_KEY] --secret [SECRET_KEY]
```

### 5.3 Deploy

```bash
cd ai-service
npm init -y
npm install serverless-python-requirements

export HF_TOKEN=hf_xxxxx  # opsional
serverless deploy --stage production
```

---

## 6. Deploy Frontend ke CloudFlare Pages

### 6.1 Setup di CloudFlare

1. Pages → Create project → Connect to Git
2. Select repository: `finlapor`
3. Konfigurasi:
   ```
   Project name: finlapor
   Production branch: main
   Build command: cd frontend && npm run build
   Output directory: frontend/out
   ```
4. Environment variables:
   ```
   NEXT_PUBLIC_API_URL = https://api.finlapor.com
   ```
5. Save and Deploy

### 6.2 Custom Domain

1. Pages → Project → Custom domains
2. Add: `finlapor.com` dan `www.finlapor.com`

---

## 7. Setup Domain & SSL

### 7.1 DNS Records di CloudFlare

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | CloudFlare Pages | Auto |
| CNAME | api | EC2 IP (Opsi A) / API GW (Opsi B) | ✅ |
| CNAME | www | finlapor.com | ✅ |

### 7.2 SSL Settings

1. SSL/TLS → Mode: Full (strict)
2. Enable: Always Use HTTPS, Automatic HTTPS Rewrites

---

## 8. Monitoring & Maintenance

### 8.1 CloudWatch Dashboard

1. CloudWatch → Create Dashboard
2. Add widgets: EC2 CPU, Memory, Network, Lambda Invocations

### 8.2 Backup Database

```bash
# Cron job harian
0 2 * * * docker exec finlapor-postgres-1 pg_dump -U postgres finlapor | gzip > ~/backups/finlapor_$(date +\%Y\%m\%d).sql.gz
```

### 8.3 Auto Update

```bash
cat > ~/update.sh << 'EOF'
#!/bin/bash
cd ~/finlapor && git pull origin main
cd backend && go build -o main cmd/server/main.go
sudo systemctl restart finlapor
EOF
chmod +x ~/update.sh
```

---

## Quick Reference

| Item | Public Subnet | Private Subnet |
|------|---------------|----------------|
| API URL | http://[EC2_IP]:8080 | https://api.finlapor.com |
| SSH | `ssh -i key.pem ec2-user@[IP]` | `ssh -J bastion backend` |
| Biaya | ~$9/bulan | ~$13-45/bulan |
| Keamanan | Standar | Tinggi |

---

## Support

- GitHub Issues: https://github.com/aan-andiyanaS/finlapor/issues
- Email: support@finlapor.com
