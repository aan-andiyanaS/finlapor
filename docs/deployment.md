# Panduan Deployment FinLapor

Panduan lengkap untuk deploy FinLapor ke production menggunakan CloudFlare Pages, AWS EC2, dan AWS Lambda.

> 📌 **Repository**: https://github.com/aan-andiyanaS/finlapor.git

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

> **🤔 Mengapa perlu tools ini?**
> - **Node.js**: Untuk build frontend Next.js dan menjalankan npm commands
> - **Go**: Backend FinLapor ditulis dalam Go, perlu compiler untuk build
> - **Docker**: Menjalankan database PostgreSQL tanpa install langsung di sistem
> - **AWS CLI**: Berkomunikasi dengan AWS dari terminal (deploy, configure)
> - **Git**: Version control dan push code ke repository

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

> **🤔 Mengapa perlu akun ini?**
> - **GitHub**: Menyimpan source code dan integrasi CI/CD dengan CloudFlare
> - **AWS**: Menjalankan backend (EC2), database, storage (S3), dan AI (Lambda)
> - **CloudFlare**: Hosting frontend gratis dengan CDN global untuk kecepatan akses
> - **HuggingFace**: Menyediakan AI models gratis untuk OCR dan LLM

| Layanan | URL | Gratis? | Fungsi |
|---------|-----|---------|--------|
| GitHub | https://github.com | ✅ Ya | Repository code |
| AWS | https://aws.amazon.com | ✅ Free tier 12 bulan | Backend & infrastructure |
| CloudFlare | https://cloudflare.com | ✅ Ya (plan gratis) | Frontend hosting & CDN |
| HuggingFace | https://huggingface.co | ✅ Ya | AI models (OCR, LLM) |

### 1.3 Estimasi Biaya Bulanan

> **🤔 Mengapa murah?**
> - Menggunakan **free tier** AWS selama 12 bulan pertama
> - CloudFlare Pages **gratis unlimited** untuk static sites
> - Lambda **gratis** 1 juta requests/bulan
> - Arsitektur dioptimasi untuk **cost-efficiency**

| Layanan | Biaya | Keterangan |
|---------|-------|------------|
| AWS EC2 t3.micro | ~$8.50/bulan | Setelah free tier habis |
| AWS S3 (5GB) | ~$0.12/bulan | Storage file |
| AWS Lambda | Gratis | 1M requests free |
| CloudFlare Pages | Gratis | Unlimited sites |
| **Total** | **~$9-10/bulan** | |

---

## 2. Setup AWS Account

> **🤔 Mengapa AWS?**
> AWS adalah cloud provider terbesar dengan:
> - **Free tier 12 bulan** untuk belajar dan prototype
> - **Layanan lengkap** (compute, storage, serverless, database)
> - **Region Singapore (ap-southeast-1)** dekat dengan Indonesia = latency rendah
> - **Dokumentasi** dan komunitas yang besar

### 2.1 Membuat Akun AWS

> **🤔 Mengapa perlu akun sendiri?**
> Setiap akun AWS mendapat **free tier terpisah**. Dengan akun sendiri, Anda mendapat:
> - 750 jam/bulan EC2 t2.micro/t3.micro gratis
> - 5GB S3 storage gratis
> - 1 juta Lambda requests gratis

1. **Buka** https://aws.amazon.com
2. **Klik** "Create an AWS Account" (pojok kanan atas)
3. **Isi form**:
   - Email address: email aktif Anda
   - Password: minimal 8 karakter
   - AWS account name: `finlapor-production`
4. **Verifikasi email** yang dikirim AWS
5. **Pilih** "Personal" account type
6. **Isi data diri** (nama, alamat, nomor HP)
7. **Masukkan kartu kredit/debit**
   > ⚠️ **Catatan**: Kartu hanya untuk verifikasi, tidak dicharge jika tetap di free tier
8. **Verifikasi** nomor HP via SMS
9. **Pilih** Support Plan: "Basic Support - Free"
10. **Selesai!** Anda akan masuk ke AWS Console

### 2.2 Setup IAM User (Keamanan)

> **🤔 Mengapa perlu IAM User?**
> - **Root account** memiliki akses penuh ke SEMUA hal, sangat berbahaya jika bocor
> - **IAM User** bisa dibatasi aksesnya (least privilege principle)
> - **Best practice** keamanan: jangan gunakan root untuk operasi sehari-hari
> - Jika IAM User bocor, bisa dihapus tanpa kehilangan akun

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
   > **🤔 Mengapa policies ini?**
   > - `AmazonEC2FullAccess`: Untuk membuat dan mengelola server EC2
   > - `AmazonS3FullAccess`: Untuk upload file ke S3
   > - `AWSLambda_FullAccess`: Untuk deploy AI service
   > - `AmazonAPIGatewayAdministrator`: Untuk expose Lambda ke internet
   > - `IAMFullAccess`: Untuk membuat role Lambda
   
   - `AmazonEC2FullAccess`
   - `AmazonS3FullAccess`
   - `AWSLambda_FullAccess`
   - `AmazonAPIGatewayAdministrator`
   - `IAMFullAccess`
8. **Klik** "Next" → "Create user"
9. **Download** credentials (simpan dengan aman!)

### 2.3 Setup AWS CLI

> **🤔 Mengapa perlu AWS CLI?**
> - **Deploy dari terminal** tanpa buka browser
> - **Automasi** dengan scripts
> - **Serverless Framework** membutuhkan CLI untuk deploy Lambda

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

> **🤔 Mengapa region `ap-southeast-1`?**
> - Region **Singapore** paling dekat dengan Indonesia
> - Latency rendah = aplikasi lebih cepat diakses user Indonesia
> - Semua layanan AWS tersedia di region ini

### 2.4 Setup VPC (Virtual Private Cloud)

> **🤔 Mengapa perlu VPC?**
> - **Isolasi jaringan**: Server Anda terpisah dari server orang lain
> - **Keamanan**: Kontrol traffic masuk/keluar dengan Security Groups
> - **Subnet**: Public untuk yang perlu diakses internet, Private untuk database
> - **Best practice**: Semua production workload harus dalam VPC

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
   > **🤔 Mengapa 2 Availability Zones?**
   > - **High availability**: Jika 1 data center down, yang lain masih jalan
   > - **Redundancy**: Data tersebar di 2 lokasi fisik berbeda
5. **Klik** "Create VPC"

### 2.5 Setup Security Groups

> **🤔 Mengapa perlu Security Groups?**
> - **Firewall** untuk EC2 instance
> - **Whitelist** port yang boleh diakses
> - **Default deny**: Semua traffic diblok kecuali yang di-allow
> - **Mencegah** akses tidak sah ke server

#### Security Group untuk EC2 Backend:

1. **Buka** EC2 → Security Groups → "Create security group"
2. **Isi**:
   ```
   Name: finlapor-backend-sg
   Description: Security group for FinLapor backend
   VPC: finlapor-vpc
   ```
3. **Inbound rules** (klik "Add rule"):
   | Type | Port | Source | Mengapa? |
   |------|------|--------|----------|
   | SSH | 22 | My IP | Untuk remote access ke server |
   | Custom TCP | 8080 | 0.0.0.0/0 | API diakses dari mana saja |
   | PostgreSQL | 5432 | 10.0.0.0/16 | Database hanya internal VPC |
   | Custom TCP | 6379 | 10.0.0.0/16 | Redis hanya internal VPC |
4. **Klik** "Create security group"

### 2.6 Setup S3 Bucket

> **🤔 Mengapa perlu S3?**
> - **Object storage** untuk file (foto struk, laporan PDF)
> - **Murah**: $0.023/GB/bulan
> - **Scalable**: Unlimited storage
> - **Durability**: 99.999999999% (11 nines) - hampir tidak mungkin hilang
> - **CDN integration** dengan CloudFlare

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
   > **🤔 Mengapa unblock public access?**
   > - Agar file bisa diakses via URL (foto struk, gambar)
   > - Tetap aman karena menggunakan **presigned URLs** dengan expiry

4. **Klik** "Create bucket"

5. **Setup CORS** (untuk upload dari browser):
   > **🤔 Mengapa perlu CORS?**
   > - Browser memblok request ke domain berbeda (security)
   > - CORS mengizinkan frontend di finlapor.com upload ke S3

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

> **🤔 Mengapa CloudFlare?**
> - **Gratis** untuk hosting static sites (Next.js export)
> - **CDN global**: 300+ data centers, user Indonesia akses dari Singapore/Jakarta
> - **DDoS protection** included
> - **SSL gratis** otomatis
> - **Integrasi GitHub**: Auto deploy saat push
> - **Unlimited bandwidth** di plan gratis

### 3.1 Membuat Akun CloudFlare

1. **Buka** https://dash.cloudflare.com/sign-up
2. **Isi email dan password**
3. **Verifikasi email**
4. **Login** ke dashboard

### 3.2 Menambahkan Domain (Opsional)

> **🤔 Mengapa perlu custom domain?**
> - **Professional**: finlapor.com lebih kredibel dari finlapor.pages.dev
> - **Branding**: Konsisten dengan identitas bisnis
> - **SEO**: Domain sendiri lebih baik untuk ranking

Jika Anda sudah punya domain:

1. **Klik** "Add a Site"
2. **Masukkan** nama domain (contoh: `finlapor.com`)
3. **Pilih** plan "Free"
4. **CloudFlare** akan scan DNS records
5. **Update nameservers** di registrar domain Anda:
   > **🤔 Mengapa ganti nameserver?**
   > - Agar CloudFlare yang mengelola DNS
   > - Mendapat fitur CDN, security, dan caching
   
   ```
   NS1: [nameserver dari CloudFlare]
   NS2: [nameserver dari CloudFlare]
   ```
6. **Tunggu** propagasi (biasanya 5-30 menit)

### 3.3 Setup CloudFlare Pages

> **🤔 Mengapa CloudFlare Pages?**
> - **Build otomatis** saat push ke GitHub
> - **Preview deployments** untuk setiap pull request
> - **Rollback** mudah ke versi sebelumnya
> - **Edge functions** untuk dynamic routing

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
   > **🤔 Mengapa konfigurasi ini?**
   > - `cd frontend`: Karena frontend ada di subfolder
   > - `npm run build`: Build Next.js ke static files
   > - `frontend/out`: Output folder dari next export

7. **Environment variables** (klik "Add variable"):
   ```
   NEXT_PUBLIC_API_URL = https://api.finlapor.com
   ```
   > **🤔 Mengapa environment variable?**
   > - Frontend perlu tahu URL backend
   > - `NEXT_PUBLIC_` prefix agar bisa diakses di client-side

8. **Klik** "Save and Deploy"

### 3.4 Setup Custom Domain di CloudFlare Pages

1. **Buka** Pages → Project → Custom domains
2. **Klik** "Set up a custom domain"
3. **Masukkan**: `finlapor.com`
4. **Klik** "Continue" → "Activate domain"
5. **Tambahkan** juga: `www.finlapor.com`
   > **🤔 Mengapa www juga?**
   > - Beberapa user mengetik dengan www
   > - Redirect ke domain utama

---

## 4. Deploy Backend ke AWS EC2

> **🤔 Mengapa EC2?**
> - **Full control**: Bisa install apapun
> - **Persistent**: Berjalan 24/7
> - **Scalable**: Bisa upgrade instance type
> - **Cost-effective**: t3.micro ~$8.50/bulan (gratis 12 bulan pertama)

### 4.1 Launch EC2 Instance

1. **Buka** AWS Console → EC2 → "Launch Instance"
2. **Konfigurasi**:
   ```
   Name: finlapor-backend
   
   AMI: Amazon Linux 2023 AMI (Free tier eligible)
   ```
   > **🤔 Mengapa Amazon Linux?**
   > - Dioptimasi untuk AWS
   > - Security updates otomatis
   > - Ringan dan cepat
   
   ```
   Instance type: t3.micro (Free tier eligible)
   ```
   > **🤔 Mengapa t3.micro?**
   > - 2 vCPU, 1GB RAM - cukup untuk aplikasi kecil-menengah
   > - **Gratis** 750 jam/bulan selama 12 bulan
   > - Burstable: Bisa pakai extra CPU saat load tinggi
   
   ```
   Key pair: 
   - Klik "Create new key pair"
   - Name: finlapor-key
   - Type: RSA
   - Format: .pem
   - Download dan simpan dengan aman!
   ```
   > **🤔 Mengapa Key Pair?**
   > - Untuk **SSH** ke server dengan aman
   > - Lebih secure daripada password
   > - **Jangan share** file .pem ini!
   
   ```
   Network settings:
   - VPC: finlapor-vpc
   - Subnet: public subnet
   - Auto-assign public IP: Enable
   - Security group: finlapor-backend-sg
   
   Storage: 20 GB gp3
   ```
   > **🤔 Mengapa 20GB?**
   > - Default 8GB terlalu kecil
   > - Space untuk OS, app, logs, database backup
   > - gp3 lebih murah dari gp2
   
3. **Klik** "Launch instance"
4. **Catat** Public IP address

### 4.2 Connect ke EC2

> **🤔 Mengapa SSH?**
> - **Secure Shell**: Koneksi terenkripsi ke server
> - **Remote access**: Kelola server dari laptop

```bash
# Ubah permission key file (Linux/macOS)
chmod 400 finlapor-key.pem

# Windows PowerShell
icacls finlapor-key.pem /inheritance:r
icacls finlapor-key.pem /grant:r "$($env:USERNAME):(R)"

# Connect via SSH
ssh -i finlapor-key.pem ec2-user@[PUBLIC_IP]
```

### 4.3 Install Dependencies di EC2

> **🤔 Mengapa install satu-satu?**
> - Server EC2 fresh, belum ada software apapun
> - Kita install hanya yang dibutuhkan (keep it minimal)

```bash
# Update system
sudo yum update -y
# Mengapa? Security patches dan bug fixes

# Install Git
sudo yum install git -y
# Mengapa? Untuk clone repository dari GitHub

# Install Go 1.21
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
go version
# Mengapa? Backend ditulis dalam Go

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user
# Mengapa? Untuk menjalankan PostgreSQL dan Redis dalam container

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
# Mengapa? Untuk manage multiple containers dengan 1 command

# Logout dan login ulang untuk apply docker group
exit
```

### 4.4 Clone dan Setup Project

```bash
# Login ulang
ssh -i finlapor-key.pem ec2-user@[PUBLIC_IP]

# Clone repository
git clone https://github.com/aan-andiyanaS/finlapor.git
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
# Mengapa Docker? Lebih mudah daripada install PostgreSQL manual

# Tunggu database siap
sleep 10

# Run migrations
docker exec -i finlapor-postgres-1 psql -U postgres -d finlapor < database/migrations/001_initial.sql
# Mengapa? Membuat tables yang dibutuhkan aplikasi

# Build backend
cd backend
go build -o main cmd/server/main.go
# Mengapa build? Binary lebih cepat dari `go run`

# Test run
./main
# Ctrl+C untuk stop setelah verify berjalan
```

### 4.5 Setup Systemd Service

> **🤔 Mengapa Systemd?**
> - **Auto-start**: Aplikasi otomatis jalan saat server reboot
> - **Auto-restart**: Jika crash, otomatis restart
> - **Logging**: Logs tersimpan di journald
> - **Standard**: Cara production-grade menjalankan service di Linux

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
# Mengapa enable? Agar auto-start saat boot

sudo systemctl start finlapor

# Check status
sudo systemctl status finlapor

# View logs
sudo journalctl -u finlapor -f
```

### 4.6 Setup Nginx Reverse Proxy (Opsional)

> **🤔 Mengapa Nginx?**
> - **SSL termination**: Handle HTTPS di Nginx, backend tetap HTTP
> - **Load balancing**: Jika scale ke multiple backends
> - **Static files**: Serve files langsung tanpa hit backend
> - **Buffering**: Protect backend dari slow clients

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

> **🤔 Mengapa Lambda?**
> - **Serverless**: Tidak perlu manage server
> - **Pay per use**: Hanya bayar saat dipanggil
> - **Auto-scale**: Dari 0 ke 1000+ requests otomatis
> - **Free tier**: 1 juta requests/bulan gratis
> - **Python support**: Mudah integrasi dengan HuggingFace

### 5.1 Setup HuggingFace Token

> **🤔 Mengapa HuggingFace?**
> - **Free AI models**: Akses ke ribuan pre-trained models
> - **Donut OCR**: Model khusus untuk membaca receipt/struk
> - **Mistral LLM**: Model bahasa untuk chat assistant
> - **Inference API**: Tidak perlu host model sendiri

1. **Buka** https://huggingface.co/settings/tokens
2. **Klik** "New token"
3. **Isi**:
   - Name: `finlapor-production`
   - Role: `read`
4. **Copy** token yang dihasilkan

### 5.2 Install Serverless Framework

> **🤔 Mengapa Serverless Framework?**
> - **Simplify deployment**: 1 command untuk deploy
> - **Infrastructure as Code**: Konfigurasi dalam YAML
> - **Multi-cloud**: Support AWS, Azure, GCP
> - **Plugins**: Otomatis package Python dependencies

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

# Install plugin
npm init -y
npm install serverless-python-requirements
# Mengapa? Untuk bundle Python packages ke Lambda

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

> **🤔 Apa yang terjadi saat deploy?**
> 1. Serverless package Python code + dependencies
> 2. Upload ke S3
> 3. Create Lambda function
> 4. Create API Gateway
> 5. Configure endpoints

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

> **🤔 Mengapa build?**
> - Next.js perlu di-compile ke static HTML/JS/CSS
> - Optimize untuk production (minify, tree-shaking)
> - Output bisa di-serve dari CDN

```bash
cd frontend

# Install dependencies
npm install

# Build untuk production
npm run build

# Output di folder: out/
```

### 6.2 Deploy via Git (Otomatis)

> **🤔 Mengapa Git integration?**
> - **CI/CD otomatis**: Push = Deploy
> - **Preview deployments**: Setiap PR dapat URL preview
> - **Rollback mudah**: Kembali ke commit sebelumnya

Jika sudah setup CloudFlare Pages dengan GitHub:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

CloudFlare akan otomatis build dan deploy.

### 6.3 Deploy via Wrangler (Manual)

> **🤔 Kapan pakai manual?**
> - Debugging build issues
> - Deploy dari CI lain (Jenkins, GitLab)
> - Quick test tanpa push ke Git

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

> **🤔 Mengapa DNS penting?**
> - Menghubungkan domain (finlapor.com) ke server (IP address)
> - **A record**: Domain → IP
> - **CNAME**: Alias domain

Buka CloudFlare → DNS → Records, tambahkan:

| Type | Name | Content | Proxy | Mengapa? |
|------|------|---------|-------|----------|
| A | @ | [EC2 Public IP] | ❌ DNS only | Root domain |
| A | api | [EC2 Public IP] | ✅ Proxied | API dengan CDN |
| CNAME | www | finlapor.com | ✅ Proxied | www redirect |

### 7.2 SSL/TLS Settings

> **🤔 Mengapa SSL penting?**
> - **Enkripsi**: Data tidak bisa disadap
> - **Trust**: Browser menampilkan gembok hijau
> - **SEO**: Google prefer HTTPS
> - **Required**: Beberapa fitur browser (geolocation, camera) require HTTPS

1. **Buka** CloudFlare → SSL/TLS
2. **Pilih** mode: "Full (strict)"
   > **🤔 Mengapa Full (strict)?**
   > - Enkripsi penuh dari browser → CloudFlare → server
   > - Validate certificate di server (paling aman)
   
3. **Enable**:
   - Always Use HTTPS: ✅
   - Automatic HTTPS Rewrites: ✅
   - Minimum TLS Version: 1.2

### 7.3 Setup SSL di EC2 (Let's Encrypt)

> **🤔 Mengapa Let's Encrypt?**
> - **Gratis**: SSL certificate gratis
> - **Otomatis**: Auto-renewal
> - **Trusted**: Diterima semua browser

```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx -y

# Generate certificate
sudo certbot --nginx -d api.finlapor.com

# Auto-renewal (sudah di-setup otomatis)
sudo systemctl enable certbot-renew.timer
```

---

## 8. Monitoring & Maintenance

### 8.1 CloudFlare Analytics

> **🤔 Mengapa monitoring?**
> - **Visibility**: Tahu apa yang terjadi di aplikasi
> - **Problem detection**: Detect issues sebelum user komplain
> - **Capacity planning**: Kapan perlu scale

- **Buka** CloudFlare → Analytics
- Monitor: Requests, Bandwidth, Threats blocked

### 8.2 AWS CloudWatch

> **🤔 Mengapa CloudWatch?**
> - **Native AWS**: Terintegrasi dengan semua layanan AWS
> - **Alarms**: Notifikasi saat CPU/Memory tinggi
> - **Logs**: Centralized logging

1. **Buka** AWS Console → CloudWatch
2. **Create Dashboard**: `finlapor-monitoring`
3. **Add widgets**:
   - EC2 CPU Utilization
   - EC2 Network In/Out
   - Lambda Invocations
   - Lambda Errors

### 8.3 Backup Database

> **🤔 Mengapa backup?**
> - **Disaster recovery**: Jika data hilang, bisa restore
> - **Point-in-time recovery**: Kembalikan ke waktu tertentu
> - **Compliance**: Beberapa regulasi require backup

```bash
# Cron job untuk backup harian jam 2 pagi
crontab -e

# Tambahkan:
0 2 * * * docker exec finlapor-postgres-1 pg_dump -U postgres finlapor | gzip > /home/ec2-user/backups/finlapor_$(date +\%Y\%m\%d).sql.gz
```

### 8.4 Auto Update dari GitHub

> **🤔 Mengapa auto-update?**
> - **Continuous deployment**: Push code langsung ke production
> - **Reduce manual work**: Tidak perlu SSH setiap update

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

| Service | URL |
|---------|-----|
| Frontend | https://finlapor.com |
| API | https://api.finlapor.com |
| Repository | https://github.com/aan-andiyanaS/finlapor |

---

## Support

Jika ada pertanyaan atau masalah:
- Buat issue di [GitHub](https://github.com/aan-andiyanaS/finlapor/issues)
- Email: support@finlapor.com
