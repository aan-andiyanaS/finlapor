# Panduan Deployment FinLapor

Panduan lengkap untuk deploy FinLapor ke production menggunakan CloudFlare Pages dan AWS.

> 📌 **Repository**: https://github.com/aan-andiyanaS/finlapor.git

---

## Daftar Isi

1. [Persiapan Awal](#1-persiapan-awal)
2. [Setup AWS Account](#2-setup-aws-account)
   - [Setup S3 Bucket](#24-setup-s3-bucket)
   - [Setup AWS RDS (Opsional)](#25-setup-aws-rds-opsional---database-terkelola)
3. [Setup CloudFlare Account](#3-setup-cloudflare-account)
4. [Pilih Arsitektur Deployment](#4-pilih-arsitektur-deployment)
   - [Opsi A: Public Subnet (Sederhana)](#opsi-a-public-subnet-sederhana)
   - [Opsi B: Private Subnet + API Gateway (Advanced)](#opsi-b-private-subnet--api-gateway-advanced)
5. [Deploy AI Service ke AWS Lambda](#5-deploy-ai-service-ke-aws-lambda)
6. [Deploy Frontend ke CloudFlare Pages](#6-deploy-frontend-ke-cloudflare-pages)
7. [Setup Domain & SSL](#7-setup-domain--ssl)
8. [Monitoring & Maintenance](#8-monitoring--maintenance)
9. [File yang Tidak Ada di GitHub](#9-file-yang-tidak-ada-di-github-sensitif)
10. [Troubleshooting Umum](#10-troubleshooting-umum)

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

### 1.4 Docker vs AWS Managed Services

> 💡 **PENTING**: Di production, kita **TIDAK** menjalankan PostgreSQL dan Redis di Docker. AWS menyediakan layanan terkelola yang lebih reliable.

#### Apa yang Butuh Docker vs Tidak?

| Komponen | Docker? | Penjelasan |
|----------|---------|------------|
| **Go Backend** | ✅ Opsional | Bisa binary langsung atau Docker container |
| **AWS RDS** | ❌ Tidak | Database terkelola, AWS yang maintenance |
| **AWS ElastiCache** | ❌ Tidak | Redis terkelola, AWS yang maintenance |
| **AWS S3** | ❌ Tidak | Object storage, akses via SDK |
| **AWS Lambda** | ❌ Tidak | Serverless, upload code saja |

#### Perbandingan Local vs Production

```
LOCAL (Docker Compose):                    PRODUCTION (AWS Managed):
┌─────────────────────────────┐            ┌─────────────────────────────┐
│      Docker Compose         │            │         AWS Cloud           │
│  ┌────────┐  ┌────────┐    │            │  ┌────────┐  ┌──────────┐   │
│  │Postgres│  │ Redis  │    │            │  │AWS RDS │  │ElastiCache│  │
│  │(docker)│  │(docker)│    │            │  │(managed)│ │ (managed) │  │
│  └────┬───┘  └───┬────┘    │            │  └────┬───┘  └─────┬────┘   │
│       └────┬─────┘          │            │       └─────┬─────┘        │
│            │                │            │             │              │
│       ┌────┴────┐           │            │        ┌────┴────┐         │
│       │Go Binary│           │            │        │   EC2   │         │
│       │ (local) │           │            │        │Go Binary│         │
│       └─────────┘           │            │        └─────────┘         │
└─────────────────────────────┘            └─────────────────────────────┘
```

#### Bagaimana Backend Connect ke Managed Services?

Backend hanya perlu **environment variables** dengan endpoint yang benar:

```bash
# .env di EC2 (Production)
# Database - AWS RDS (BUKAN localhost!)
DATABASE_URL=postgres://postgres:PASSWORD@finlapor-db.xxxxx.rds.amazonaws.com:5432/finlapor?sslmode=require

# Redis - AWS ElastiCache (BUKAN localhost!)
REDIS_URL=finlapor-cache.xxxxx.cache.amazonaws.com:6379

# S3 - AWS S3
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
S3_BUCKET=finlapor-storage-xxxxx
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=...
```

> ✅ **Keuntungan Managed Services:**
> - Backup otomatis (RDS)
> - High availability
> - Auto-patching security
> - Monitoring built-in
> - Tidak perlu maintenance server database

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

#### Langkah-langkah Detail:

1. **Buat Bucket:**
   - S3 → Create bucket
   - Bucket name: `finlapor-storage-[random-string]` (nama harus unik global)
   - Region: ap-southeast-1 (Singapore)
   - Object Ownership: ACLs disabled (recommended)

2. **Block Public Access Settings:**
   - **PENTING**: Jangan uncheck semua! Amankan bucket Anda
   - Untuk akses via backend saja, biarkan semua terblokir
   - Gunakan presigned URLs untuk akses file

3. **Setup CORS Configuration:**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": [
         "https://finlapor.airi.click",
         "https://www.finlapor.airi.click",
         "http://localhost:3000"
       ],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

4. **Buat IAM User untuk S3:**
   - IAM → Users → Create user
   - Name: `finlapor-s3-user`
   - Attach policy: `AmazonS3FullAccess` (atau custom policy untuk bucket spesifik)
   - Create access key → Download credentials

5. **Environment Variables untuk Backend:**
   ```bash
   S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
   S3_ACCESS_KEY=AKIA...
   S3_SECRET_KEY=...
   S3_BUCKET=finlapor-storage-xxxxx
   S3_REGION=ap-southeast-1
   ```

#### 🔧 Troubleshooting S3:

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Access Denied | IAM permissions salah | Periksa policy, pastikan ada `s3:PutObject`, `s3:GetObject` |
| CORS Error | CORS belum dikonfigurasi | Tambahkan CORS configuration di bucket |
| Bucket not found | Region salah | Pastikan region di env sama dengan bucket |
| SignatureDoesNotMatch | Credentials salah | Generate ulang access key |
| File tidak bisa diakses | Block public access | Gunakan presigned URL atau update bucket policy |

---

### 2.5 Setup AWS RDS (Opsional - Database Terkelola)

> **🤔 Mengapa RDS?**
> - Database terkelola: backup otomatis, patching, high availability
> - Lebih mudah di-maintain dibanding PostgreSQL di EC2
> - Biaya: ~$15-25/bulan (db.t3.micro dalam Free Tier 12 bulan pertama)

#### Langkah-langkah Setup RDS:

1. **Buat RDS Instance:**
   - RDS → Create database
   - Engine: PostgreSQL (versi 15 atau 16)
   - Template: **Free tier** (untuk development)
   - DB instance identifier: `finlapor-db`
   - Master username: `postgres`
   - Master password: (catat dengan aman!)

2. **Instance Configuration:**
   ```
   DB instance class: db.t3.micro (Free Tier)
   Storage: 20 GB gp2
   Enable storage autoscaling: No (untuk kontrol biaya)
   ```

3. **Connectivity:**
   ```
   VPC: finlapor-vpc
   Subnet group: Create new
   Public access: No (untuk keamanan)
   VPC security group: Create new → finlapor-rds-sg
   ```

4. **Security Group untuk RDS:**
   | Type | Port | Source | Keterangan |
   |------|------|--------|------------|
   | PostgreSQL | 5432 | finlapor-backend-sg | Hanya dari backend EC2 |

5. **Additional Configuration:**
   ```
   Initial database name: finlapor
   Enable automated backups: Yes
   Backup retention: 7 days
   Enable encryption: Yes (recommended)
   ```

6. **Dapatkan Endpoint:**
   - Setelah status "Available", copy Endpoint
   - Format: `finlapor-db.xxxxx.ap-southeast-1.rds.amazonaws.com`

7. **Update Backend .env:**
   ```bash
   DATABASE_URL=postgres://postgres:YOUR_PASSWORD@finlapor-db.xxxxx.ap-southeast-1.rds.amazonaws.com:5432/finlapor?sslmode=require
   ```

8. **Run Migrations (PENTING!):**

   Migrations harus dijalankan **dari EC2** karena RDS tidak public access.
   
   **Step 1: SSH ke EC2 Backend**
   ```bash
   ssh -i finlapor-key.pem ec2-user@[EC2_PUBLIC_IP]
   cd /home/ec2-user/finlapor/backend
   ```

   **Step 2: Set DATABASE_URL**
   ```bash
   export DATABASE_URL="postgres://postgres:YOUR_PASSWORD@finlapor-db.xxxxx.rds.amazonaws.com:5432/finlapor?sslmode=require"
   ```

   **Step 3: Run Semua Migrations (urutan penting!)**
   ```bash
   # Install psql jika belum ada
   sudo yum install -y postgresql15

   # Jalankan migrations satu per satu
   psql "$DATABASE_URL" -f database/migrations/001_initial.sql
   psql "$DATABASE_URL" -f database/migrations/002_multi_category.sql
   psql "$DATABASE_URL" -f database/migrations/003_add_user_age.sql
   ```

   **Step 4: Verifikasi Tables**
   ```bash
   psql "$DATABASE_URL" -c "\dt"
   
   # Output yang diharapkan:
   #  Schema |     Name      | Type  |  Owner
   # --------+---------------+-------+----------
   #  public | categories    | table | postgres
   #  public | transactions  | table | postgres
   #  public | users         | table | postgres
   ```

9. **Setup Demo User (Opsional tapi Recommended):**

   > 💡 **Demo Account memudahkan testing dan demo ke dosen/reviewer!**

   **Jalankan Demo Seed:**
   ```bash
   psql "$DATABASE_URL" -f database/seeds/demo-user.sql
   ```

   **Credentials Demo:**
   | Field | Value |
   |-------|-------|
   | Email | `demo@finlapor.airi.click` |
   | Password | `demo123` |
   | Nama | Demo User |
   
   **Isi Demo Account:**
   - 1 user demo
   - 10 transaksi sample (income + expense)
   - Kategori: Gaji, Makanan, Transport, Belanja, Tagihan, Hiburan, Kesehatan

   **Verifikasi Demo User:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT email, name FROM users WHERE email = 'demo@finlapor.airi.click';"
   
   # Output:
   #          email            |   name
   # --------------------------+-----------
   #  demo@finlapor.airi.click | Demo User
   ```

#### 🔧 Troubleshooting RDS:

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Connection refused | Security group salah | Pastikan SG backend punya akses ke port 5432 RDS |
| Timeout | RDS di subnet berbeda | Pastikan VPC dan subnet group benar |
| Authentication failed | Password salah | Reset password di RDS console |
| SSL required | sslmode tidak set | Tambahkan `?sslmode=require` di DATABASE_URL |
| Database does not exist | Initial DB tidak dibuat | Buat manual: `CREATE DATABASE finlapor;` |

#### ⚠️ Perbandingan: PostgreSQL di EC2 vs RDS

| Aspek | PostgreSQL di EC2 | AWS RDS |
|-------|-------------------|---------|
| Biaya | Termasuk EC2 (~$8.50) | Tambahan ~$15-25/bulan |
| Maintenance | Manual (update, backup) | Otomatis |
| Backup | Setup manual | Otomatis (7 hari retention) |
| High Availability | Manual setup | Multi-AZ tersedia |
| Scaling | Manual resize | Mudah via console |
| **Rekomendasi** | MVP/Demo/UAS | Production |

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
│ ❌ **TIDAK SESUAI DIAGRAM**      │ ✅ **SESUAI DIAGRAM ARSITEKTUR**    │
│                                 │                                   │
│ Cocok untuk:                    │ Cocok untuk:                      │
│ - Development / Low Budget      │ - Production                      │
│ - MVP/Demo                      │ - Enterprise                      │
│ - Proyek UAS (Hemat)            │ - Compliance (PCI-DSS)            │
└─────────────────────────────────┴───────────────────────────────────┘
```

---

# OPSI A: Public Subnet (Sederhana)

> 💡 **Catatan:** Opsi ini menggunakan **Public Subnet** untuk kemudahan akses, dengan managed services (RDS, ElastiCache) untuk database. Cocok untuk MVP/Demo.

## A.1 Diagram Arsitektur

```
                                    ┌─────────────┐
                                    │ HuggingFace │
                                    │     API     │
                                    └──────▲──────┘
                                           │
┌──────────────────────────────────────────┼────────────────────────────────────┐
│                                AWS VPC   │                                    │
│  ┌───────────────────────────────────────┼─────────────────────────────────┐  │
│  │                    PUBLIC SUBNET      │                                 │  │
│  │                                       │                                 │  │
│  │   ┌─────────────────────┐      ┌──────┴──────┐      ┌─────────────┐     │  │
│  │   │   EC2 (t3.micro)    │      │ AWS Lambda  │      │  S3 Bucket  │     │  │
│  │   │   ┌───────────┐     │      │ (Python AI) │      │  (Storage)  │     │  │
│  │   │   │  Docker   │     │      └─────────────┘      └─────────────┘     │  │
│  │   │   │ ┌───────┐ │     │                                               │  │
│  │   │   │ │Go API │ │     │                                               │  │
│  │   │   │ │ :8080 │ │     │                                               │  │
│  │   │   │ └───────┘ │     │                                               │  │
│  │   │   └───────────┘     │                                               │  │
│  │   └──────────┬──────────┘                                               │  │
│  │              │                                                          │  │
│  └──────────────┼──────────────────────────────────────────────────────────┘  │
│                 │                                                             │
│      ┌──────────┴──────────┬────────────────────┐                             │
│      ▼                     ▼                    ▼                             │
│ ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                        │
│ │   AWS RDS    │   │ ElastiCache  │   │  AWS Lambda  │                        │
│ │ PostgreSQL   │   │    Redis     │   │  (AI OCR)    │                        │
│ │   :5432      │   │    :6379     │   │              │                        │
│ └──────────────┘   └──────────────┘   └──────────────┘                        │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                  ┌─────────────────────┐
                  │   CloudFlare CDN    │──────► User
                  │  (Frontend Hosting) │
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

# OPSI B: Private Subnet + API Gateway (Sesuai Arsitektur)

> ✅ **Catatan:** Opsi ini **SEPENUHNYA SESUAI** dengan diagram `finlapor_aws_architecture.png`. Menggunakan Private Subnet untuk keamanan maksimal.

## B.1 Diagram Arsitektur

```
                                          ┌─────────────┐
                                          │ HuggingFace │
                                          │     API     │
                                          └──────▲──────┘
                                                 │
┌────────────────────────────────────────────────┼────────────────────────────────┐
│                               AWS Cloud        │                                │
│                                                │                                │
│  ┌─────────────────────────────────────────────┼─────────────────────────────┐  │
│  │                           VPC               │                             │  │
│  │                                             │                             │  │
│  │  ┌─────────────────────┐            ┌───────┴───────┐    ┌─────────────┐  │  │
│  │  │   Public Subnet     │            │  AWS Lambda   │    │  S3 Bucket  │  │  │
│  │  │  ┌─────────────┐    │            │  (Python AI)  │    │  (Storage)  │  │  │
│  │  │  │  Bastion    │    │            └───────────────┘    └─────────────┘  │  │
│  │  │  │   Host      │    │                                                  │  │
│  │  │  └──────┬──────┘    │                                                  │  │
│  │  │         │ SSH       │                                                  │  │
│  │  └─────────┼───────────┘                                                  │  │
│  │            │                                                              │  │
│  │            ▼                                                              │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        Private Subnet                               │  │  │
│  │  │                                                                     │  │  │
│  │  │   ┌─────────────────────┐                                           │  │  │
│  │  │   │   EC2 (t3.micro)    │                                           │  │  │
│  │  │   │   ┌───────────┐     │       ┌──────────────┐  ┌──────────────┐  │  │  │
│  │  │   │   │  Docker   │     │       │   AWS RDS    │  │ ElastiCache  │  │  │  │
│  │  │   │   │ ┌───────┐ │─────┼──────►│ PostgreSQL   │  │    Redis     │  │  │  │
│  │  │   │   │ │Backend│ │     │       │              │  │              │  │  │  │
│  │  │   │   │ │(Go)   │ │◄────┼───────│              │  │              │  │  │  │
│  │  │   │   │ └───────┘ │     │       └──────────────┘  └──────────────┘  │  │  │
│  │  │   │   └───────────┘     │                                           │  │  │
│  │  │   └──────────▲──────────┘                                           │  │  │
│  │  │              │ Port 8080                                            │  │  │
│  │  └──────────────┼──────────────────────────────────────────────────────┘  │  │
│  │                 │ VPC Link                                                │  │
│  │  ┌──────────────┴──────────────────────────────────────────────────────┐  │  │
│  │  │                        AWS API Gateway                              │  │  │
│  │  │                       api.finlapor.airi.click                              │  │  │
│  │  └──────────────────────────────┬──────────────────────────────────────┘  │  │
│  └─────────────────────────────────┼─────────────────────────────────────────┘  │
│                                    │                                            │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     │
                                     ▼
                        ┌─────────────────────┐
          User ◄────────│   CloudFlare CDN    │
                        │ (Frontend / Security)│
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

## B.7 Setup Backend di Private Subnet

> ⚠️ **PENTING:** EC2 di Private Subnet **TIDAK PUNYA akses internet langsung**. Anda perlu memilih salah satu dari 3 opsi berikut untuk install dependencies.

### 📊 Perbandingan 3 Opsi Internet Access

| Aspek | Opsi 1: NAT Gateway | Opsi 2: Transfer via Bastion | Opsi 3: Temporary Public |
|-------|---------------------|------------------------------|--------------------------|
| **Biaya** | ~$32/bulan | GRATIS | GRATIS (sementara) |
| **Kecepatan** | Cepat | Lambat (copy file) | Cepat |
| **Keamanan** | ✅ Sangat aman | ✅ Sangat aman | ⚠️ Sementara terbuka |
| **Kompleksitas** | Mudah setup | Manual transfer | Mudah, tapi perlu reconfigure |
| **Recommended** | Production besar | ✅ **Demo/UAS** | Quick testing |

---

### OPSI 1: NAT Gateway (Tidak Direkomendasikan untuk Demo)

**Biaya:** ~$32/bulan + $0.045/GB data

```
Internet ←→ NAT Gateway (Public Subnet) ←→ EC2 Backend (Private Subnet)
```

**Langkah:**
1. VPC → NAT Gateways → Create
2. Subnet: **Public** subnet
3. Allocate Elastic IP
4. Route Tables → Private subnet route table
5. Add route: `0.0.0.0/0 → NAT Gateway`

**Kapan pakai:** Production dengan budget, perlu akses internet terus-menerus.

---

### OPSI 2: Transfer File via Bastion (Recommended untuk Demo/UAS)

**Biaya:** GRATIS

```
Internet → Laptop → Bastion Host → Copy ke Backend
```

**Langkah:**

#### Step 1: Download semua di Bastion (punya internet)
```bash
# SSH ke Bastion
ssh -i finlapor-key.pem ec2-user@[BASTION_PUBLIC_IP]

# Clone repo di Bastion
git clone https://github.com/aan-andiyanaS/finlapor.git

# Download Go
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz

# Download Docker images dan save
docker pull postgres:16-alpine
docker pull redis:alpine
docker save postgres:16-alpine redis:alpine -o docker-images.tar
```

#### Step 2: Copy ke Backend via SCP internal
```bash
# Dari Bastion, copy ke Backend (jaringan internal, gratis)
scp -i ~/.ssh/finlapor-key.pem -r finlapor/ ec2-user@[BACKEND_PRIVATE_IP]:/home/ec2-user/
scp -i ~/.ssh/finlapor-key.pem go1.21.6.linux-amd64.tar.gz ec2-user@[BACKEND_PRIVATE_IP]:/home/ec2-user/
scp -i ~/.ssh/finlapor-key.pem docker-images.tar ec2-user@[BACKEND_PRIVATE_IP]:/home/ec2-user/
```

#### Step 3: Install di Backend
```bash
# SSH ke Backend via Bastion
ssh -J ec2-user@[BASTION_IP] ec2-user@[BACKEND_PRIVATE_IP] -i finlapor-key.pem

# Load Docker images
docker load -i docker-images.tar

# Install Go
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Setup dan jalankan (ikuti A.6)
cd finlapor
# ... (setup .env, docker-compose, build, dll)
```

---

### OPSI 3: Temporary Public Access (Quick Testing)

**Biaya:** GRATIS, tapi **TIDAK AMAN untuk production**

```
Internet ←→ EC2 Backend (sementara di Public Subnet)
```

**Langkah:**

#### Step 1: Pindahkan EC2 ke Public Subnet sementara
```bash
# AWS Console → EC2 → Instance → Stop
# Modify network settings → Change subnet ke PUBLIC
# Start instance
```

#### Step 2: Install semua dependencies
```bash
# SSH langsung ke EC2 (sekarang punya public IP)
ssh -i finlapor-key.pem ec2-user@[NEW_PUBLIC_IP]

# Install seperti biasa (A.5 & A.6)
sudo yum update -y
sudo yum install git docker -y
# ... dst
```

#### Step 3: Kembalikan ke Private Subnet
```bash
# Stop instance
# Modify network settings → Change subnet ke PRIVATE
# Start instance
# Update Route Tables dan Security Groups
```

---

### 🎯 Rekomendasi untuk Demo/UAS

Gunakan **Opsi 2 (Transfer via Bastion)** karena:
- ✅ Gratis
- ✅ Tetap aman
- ✅ Sesuai arsitektur production
- ✅ Bagus untuk presentasi ke dosen

---

## B.7.2 Stop/Start EC2 untuk Hemat Biaya

> 💡 **Tips:** EC2 tidak dipakai? **Stop** untuk hemat biaya. Bayar hanya storage (~$0.80/bulan).

### Cara Menghentikan (Stop)

**Via AWS Console:**
1. EC2 → Instances
2. Select instance (Backend dan/atau Bastion)
3. Instance State → **Stop**

**Via CLI:**
```bash
aws ec2 stop-instances --instance-ids i-xxxxxxxxx
```

### Apa yang Terjadi Saat Stop?

| Komponen | Status | Biaya |
|----------|--------|-------|
| EC2 Compute | ❌ Stop | $0 |
| EBS Storage | ✅ Tetap ada | ~$0.80/bulan (8GB) |
| Elastic IP (jika ada) | ⚠️ Dikenakan biaya jika tidak attached | ~$3.60/bulan |
| RDS | ⚠️ Tetap jalan kecuali di-stop | Tetap bayar |
| S3 | ✅ Tetap ada | ~$0.10/bulan |

### Cara Menjalankan Lagi (Start)

**Via AWS Console:**
1. EC2 → Instances
2. Select instance
3. Instance State → **Start**
4. Tunggu status "Running"

**Via CLI:**
```bash
aws ec2 start-instances --instance-ids i-xxxxxxxxx
```

### Setelah Start, Jalankan Services:

```bash
# SSH ke Backend
ssh finlapor-backend  # atau via Bastion

# Start Docker containers
cd ~/finlapor
docker-compose up -d postgres redis

# Start backend service
sudo systemctl start finlapor

# Verifikasi
sudo systemctl status finlapor
curl localhost:8080/health
```

### ⏰ Tips Scheduling (Opsional)

Untuk otomatis stop/start sesuai jadwal (misalnya stop malam hari):
1. AWS Console → EC2 → Instance Scheduler
2. Atau gunakan EventBridge + Lambda

---

## B.7.3 Langkah Setup Backend (Ringkasan)

Setelah memilih opsi internet access, lakukan langkah berikut:

1. ✅ Install dependencies (Docker, Go)
2. ✅ Clone/Copy repository
3. ✅ Setup `.env` dengan kredensial RDS dan S3
4. ✅ Start database containers
5. ✅ Run migrations
6. ✅ Build backend: `go build -o main cmd/server/main.go`
7. ✅ Setup systemd service (lihat A.7)
8. ✅ Start service: `sudo systemctl start finlapor`

**Detail lengkap:** Lihat section **A.5**, **A.6**, dan **A.7**

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

1. ACM → Request certificate: `api.finlapor.airi.click`
2. Validate via DNS (tambah CNAME di CloudFlare)
3. API Gateway → Custom domain names → Create
4. Domain: `api.finlapor.airi.click`
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
   NEXT_PUBLIC_API_URL = https://api.finlapor.airi.click
   ```
5. Save and Deploy

### 6.2 Custom Domain

1. Pages → Project → Custom domains
2. Add: `finlapor.airi.click` dan `www.finlapor.airi.click`

---

## 7. Setup Domain & SSL

### 7.1 DNS Records di CloudFlare

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | CloudFlare Pages | Auto |
| CNAME | api | EC2 IP (Opsi A) / API GW (Opsi B) | ✅ |
| CNAME | www | finlapor.airi.click | ✅ |

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

## 9. File yang Tidak Ada di GitHub (Sensitif)

> ⚠️ **PENTING**: Beberapa file TIDAK boleh di-upload ke GitHub karena mengandung informasi sensitif (password, API keys, dll).

### 9.1 Daftar File yang Tidak Di-upload

| File | Lokasi | Isi | Contoh |
|------|--------|-----|--------|
| `.env` | `backend/.env` | Database URL, JWT Secret, S3 Keys | Lihat `.env.example` |
| `finlapor-key.pem` | Local machine | SSH private key untuk EC2 | Dari AWS Console |
| `serviceAccountKey.json` | (jika pakai Firebase) | Firebase credentials | Tidak digunakan |

### 9.2 Cara Menangani File Sensitif

#### Opsi A: Manual Copy via SSH
```bash
# Buat file .env di server langsung
ssh -i finlapor-key.pem ec2-user@[IP]
cd ~/finlapor/backend
nano .env  # Edit manual
```

#### Opsi B: Gunakan SCP untuk Transfer
```bash
# Copy file .env dari local ke server
scp -i finlapor-key.pem ./backend/.env ec2-user@[IP]:~/finlapor/backend/.env
```

#### Opsi C: GitHub Secrets (untuk CI/CD)
1. Repository → Settings → Secrets and variables → Actions
2. Tambahkan secrets:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `S3_ACCESS_KEY`
   - `S3_SECRET_KEY`
   - `EC2_SSH_KEY` (isi dengan private key)
3. Workflow akan menggunakan secrets ini saat deploy

### 9.3 Template .env untuk Backend

```bash
# Database
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/finlapor?sslmode=disable

# Untuk RDS (uncomment jika pakai RDS)
# DATABASE_URL=postgres://postgres:YOUR_PASSWORD@finlapor-db.xxxxx.rds.amazonaws.com:5432/finlapor?sslmode=require

# Redis
REDIS_URL=redis://localhost:6379

# JWT (WAJIB GANTI - minimal 32 karakter)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-here

# AWS S3
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=...
S3_BUCKET=finlapor-storage-xxxxx
S3_REGION=ap-southeast-1

# App Config
PORT=8080
APP_ENV=production

# HuggingFace (Opsional - untuk AI features)
HF_TOKEN=hf_xxxxx
```

---

## 10. Troubleshooting Umum

### 10.1 Masalah EC2 & SSH

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Permission denied (publickey) | Key file permissions salah | `chmod 400 finlapor-key.pem` |
| Connection timed out | Security Group salah | Cek inbound rule port 22 ada My IP |
| Host key verification failed | IP berubah setelah stop/start | `ssh-keygen -R [OLD_IP]` |
| No space left on device | Disk penuh | `df -h` untuk cek, hapus log lama |

### 10.2 Masalah Database

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| FATAL: password authentication failed | Password salah | Cek .env, reset password PostgreSQL |
| Connection refused port 5432 | PostgreSQL tidak running | `docker ps` cek container, `docker-compose up -d postgres` |
| Database "finlapor" does not exist | Belum di-migrate | Run migration SQL |
| Too many connections | Connection pool habis | Restart backend, increase max_connections |

### 10.3 Masalah Backend Go

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| go: command not found | Go belum di-install | Install Go sesuai langkah A.5 |
| cannot find package | Dependencies belum di-download | `go mod download` |
| bind: address already in use | Port 8080 sudah dipakai | `lsof -i :8080` lalu kill process |
| panic: runtime error | Bug di code | Cek log, fix code |

### 10.4 Masalah Docker

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Cannot connect to Docker daemon | Docker tidak running | `sudo systemctl start docker` |
| permission denied while connecting | User bukan docker group | `sudo usermod -aG docker ec2-user` lalu logout/login |
| No space left on device | Docker images/volumes penuh | `docker system prune -a` |
| Container keeps restarting | Error di aplikasi | `docker logs [container_name]` |

### 10.5 Masalah Frontend & CloudFlare

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Build failed | Dependencies error | Clear cache: `rm -rf node_modules && npm install` |
| API not reachable | CORS atau URL salah | Cek `NEXT_PUBLIC_API_URL` di CloudFlare env |
| SSL error | Mix content (http/https) | Pastikan semua URL pakai https |
| 522 Connection timed out | Backend down | Cek EC2, restart service |

### 10.6 Checklist Sebelum Deploy

- [ ] `.env` file sudah dikonfigurasi dengan benar
- [ ] Database migrations sudah dijalankan
- [ ] Security Group mengizinkan traffic yang diperlukan
- [ ] Backend bisa terkoneksi ke database (`go run cmd/server/main.go`)
- [ ] S3 bucket sudah dibuat dan CORS dikonfigurasi
- [ ] CloudFlare environment variables sudah di-set
- [ ] Domain DNS sudah pointing ke lokasi yang benar
- [ ] SSL/TLS sudah aktif (Full strict di CloudFlare)

---

## Quick Reference

| Item | Public Subnet | Private Subnet |
|------|---------------|----------------|
| API URL | http://[EC2_IP]:8080 | https://api.finlapor.airi.click |
| SSH | `ssh -i key.pem ec2-user@[IP]` | `ssh -J bastion backend` |
| Biaya | ~$9/bulan | ~$13-45/bulan |
| Keamanan | Standar | Tinggi |

---

## Support

- GitHub Issues: https://github.com/aan-andiyanaS/finlapor/issues
- Email: support@finlapor.airi.click
