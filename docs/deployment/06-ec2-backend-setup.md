# 🖥️ Setup EC2 Backend

Deploy Go backend API ke EC2 dengan Docker container.

---

## 📑 Daftar Isi

1. [Perbandingan Deployment](#perbandingan-deployment)
2. [Setup Bastion Host](#1-setup-bastion-host-opsi-b-only)
3. [Launch EC2 Backend](#2-launch-ec2-backend)
4. [Install Dependencies](#3-install-dependencies)
5. [Deploy dengan Docker](#4-deploy-dengan-docker)
6. [Setup Systemd Service](#5-setup-systemd-service)
7. [Troubleshooting](#6-troubleshooting)

---

## Perbandingan Deployment

### Lokasi EC2

| Aspek | Opsi A: Public Subnet | Opsi B: Private Subnet |
|-------|----------------------|------------------------|
| **SSH Access** | Langsung dari laptop | Via Bastion Host |
| **Internet Access** | ✅ Ya (IGW) | ❌ Tidak langsung |
| **Install Packages** | `yum install` langsung | Transfer via Bastion |
| **Keamanan** | ⚠️ Terekspos internet | ✅ Tersembunyi |
| **Biaya** | Lebih murah | +$3.80 (Bastion) |

### Metode Deploy Backend

| Metode | Kelebihan | Kekurangan | Recommended |
|--------|-----------|------------|-------------|
| **Go Binary** | Ringan, cepat start | Build manual | ✅ Simple |
| **Docker Container** | Konsisten, portable | Butuh resource lebih | ✅ Production |

---

## 1. Setup Bastion Host (Opsi B Only)

> **📝 Skip section ini jika menggunakan Opsi A (Public Subnet)**

### Step 1.1: Launch Bastion EC2

1. EC2 Console → **Launch Instance**
2. Konfigurasi:

```
Name: finlapor-bastion
AMI: Amazon Linux 2023
Instance type: t3.nano (~$3.80/bulan)
Key pair: finlapor-key (buat baru jika belum ada)
Network:
  - VPC: finlapor-vpc-secure
  - Subnet: finlapor-vpc-secure-subnet-public1-...  ← PUBLIC!
  - Auto-assign public IP: Enable
Security group: finlapor-bastion-sg
Storage: 8 GiB gp3
```

### Step 1.2: Security Group Bastion

```
finlapor-bastion-sg:
Inbound
┌──────────┬──────────┬─────────────────┬─────────────────────┐
│ Type     │ Port     │ Source          │ Description         │
├──────────┼──────────┼─────────────────┼─────────────────────┤
│ SSH      │ 22       │ My IP           │ SSH from your IP    │
└──────────┴──────────┴─────────────────┴─────────────────────┘

Outbound
┌──────────┬──────────┬─────────────────────┬─────────────────────┐
│ Type     │ Port     │ Source              │ Description         │
├──────────┼──────────┼─────────────────────┼─────────────────────┤
│ SSH      │ 22       │ Privaate IP Backend │ Gate SSH IP Backend │
├──────────┼──────────┼─────────────────────┼─────────────────────┤
│ HTTP     │ 80       │ 0.0.0.0/0           │ For Internet        │
├──────────┼──────────┼─────────────────────┼─────────────────────┤
│ HTTPs    │ 443      │ 0.0.0.0/0           │ For Internet        │
└──────────┴──────────┴─────────────────────┴─────────────────────┘


```

### Step 1.3: Test SSH ke Bastion

```bash
# Download key terlebih dahulu jika baru buat
chmod 400 finlapor-key.pem

# SSH ke Bastion
ssh -i finlapor-key.pem ec2-user@[BASTION_PUBLIC_IP]
```

---

## 2. Launch EC2 Backend

### Step 2.1: Launch Instance

1. EC2 Console → **Launch Instance**
2. Konfigurasi:

**Opsi A (Public Subnet):**
```
Name: finlapor-backend
AMI: Amazon Linux 2023
Instance type: t3.micro (Free tier)
Key pair: finlapor-key
Network:
  - VPC: finlapor-vpc
  - Subnet: finlapor-vpc-subnet-public1-...  ← PUBLIC
  - Auto-assign public IP: Enable
Security group: finlapor-backend-sg
Storage: 20 GiB gp3
```

**Opsi B (Private Subnet):**
```
Name: finlapor-backend
AMI: Amazon Linux 2023
Instance type: t3.micro (Free tier)
Key pair: finlapor-key
Network:
  - VPC: finlapor-vpc-secure
  - Subnet: finlapor-vpc-secure-subnet-private1-...  ← PRIVATE
  - Auto-assign public IP: Disable  ← PENTING!
Security group: finlapor-backend-private-sg
Storage: 20 GiB gp3
```

### Step 2.2: Security Group Backend

**Opsi A (Public):**
```
finlapor-backend-sg:
┌──────────────┬──────────┬─────────────────────┬─────────────────┐
│ Type         │ Port     │ Source              │ Description     │
├──────────────┼──────────┼─────────────────────┼─────────────────┤
│ SSH          │ 22       │ My IP               │ SSH access      │
│ Custom TCP   │ 8080     │ 0.0.0.0/0           │ API access      │
└──────────────┴──────────┴─────────────────────┴─────────────────┘
```

**Opsi B (Private):**
```
finlapor-backend-private-sg:
┌──────────────┬──────────┬────────────────────────┬─────────────────┐
│ Type         │ Port     │ Source                 │ Description     │
├──────────────┼──────────┼────────────────────────┼─────────────────┤
│ SSH          │ 22       │ Private IP Bastation   │ Via Bastion     │
│ Custom TCP   │ 8080     │ 0.0.0.0/0              │ API (via API GW)│
└──────────────┴──────────┴────────────────────────┴─────────────────┘
```

---

## 3. Install Dependencies

### Step 3.1: Connect ke EC2

**Opsi A:**
```bash
ssh -i finlapor-key.pem ec2-user@[EC2_PUBLIC_IP]
```

**Opsi B (via Bastion):**
```bash
# Metode 1: SSH Jump
ssh -J ec2-user@[BASTION_IP] ec2-user@[BACKEND_PRIVATE_IP] -i finlapor-key.pem

# Metode 2: SSH Config (lebih mudah)
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

### Step 3.2: Install Packages (Opsi A)

Jika EC2 di **Public Subnet** (ada internet):

```bash
# Update system
sudo yum update -y

# Install Git
sudo yum install git -y

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Go (jika tidak pakai Docker)
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Logout dan login ulang untuk Docker group
exit
```

### Step 3.3: Transfer via Bastion (Opsi B)

Jika EC2 di **Private Subnet** (TIDAK ada internet):

**Di Bastion:**
```bash
# SSH ke Bastion
ssh -i finlapor-key.pem ec2-user@[BASTION_IP]

# Clone repository
git clone https://github.com/aan-andiyanaS/finlapor.git

# Download Go
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz

# Download Docker images
sudo yum install docker -y
sudo systemctl start docker
docker pull postgres:16-alpine
docker pull redis:7-alpine
docker save postgres:16-alpine redis:7-alpine -o docker-images.tar

# Copy ke Backend
scp -i ~/.ssh/finlapor-key.pem -r finlapor/ ec2-user@[BACKEND_PRIVATE_IP]:/home/ec2-user/
scp -i ~/.ssh/finlapor-key.pem go1.21.6.linux-amd64.tar.gz ec2-user@[BACKEND_PRIVATE_IP]:/home/ec2-user/
scp -i ~/.ssh/finlapor-key.pem docker-images.tar ec2-user@[BACKEND_PRIVATE_IP]:/home/ec2-user/
```

**Di Backend (via Bastion SSH):**
```bash
# SSH ke Backend
ssh -J ec2-user@[BASTION_IP] ec2-user@[BACKEND_PRIVATE_IP] -i finlapor-key.pem

# Install Docker (tanpa internet)
sudo yum install docker -y --disablerepo=* --enablerepo=amzn2-core
# Atau minta admin install offline

# Load Docker images
docker load -i docker-images.tar

# Install Go
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

---

## 4. Deploy dengan Docker

### Step 4.1: Setup Environment File

```bash
cd ~/finlapor
cat > backend/.env << 'EOF'
# === DATABASE (AWS RDS) ===
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@finlapor-db.xxxxx.rds.amazonaws.com:5432/finlapor?sslmode=require

# === REDIS ===
# Opsi 1: Docker Redis (simple)
REDIS_URL=redis://localhost:6379
# Opsi 2: AWS ElastiCache
# REDIS_URL=finlapor-cache.xxxxx.cache.amazonaws.com:6379

# === S3 STORAGE ===
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=...
S3_BUCKET=finlapor-storage-xxxxx
S3_REGION=ap-southeast-1

# === JWT & SERVER ===
JWT_SECRET=your-super-secret-key-minimum-32-characters
PORT=8080
APP_ENV=production

# === AI (Lambda/HuggingFace) ===
LAMBDA_FUNCTION_URL=https://xxxxx.lambda-url.ap-southeast-1.on.aws
HF_TOKEN=hf_xxxxxxxx
EOF
```

### Step 4.2: Build dan Run dengan Docker Compose

**Buat docker-compose.production.yml:**
```bash
cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: finlapor-backend
    ports:
      - "8080:8080"
    env_file:
      - ./backend/.env
    depends_on:
      - redis
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: finlapor-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: always

volumes:
  redis_data:
EOF
```

### Step 4.3: Start Services

```bash
# Build dan start
docker-compose -f docker-compose.production.yml up -d --build

# Cek status
docker-compose -f docker-compose.production.yml ps

# Lihat logs
docker-compose -f docker-compose.production.yml logs -f backend
```

### Step 4.4: Verifikasi

```bash
# Health check
curl http://localhost:8080/health

# Expected:
{"status":"ok"}

# Dari luar EC2 (Opsi A only)
curl http://[EC2_PUBLIC_IP]:8080/health
```

---

## 5. Setup Systemd Service

> **📝 Section ini untuk Go Binary deployment. Skip jika pakai Docker Compose.**

### Step 5.1: Build Binary

```bash
cd ~/finlapor/backend
go build -o finlapor-server cmd/server/main.go
```

### Step 5.2: Create Service File

```bash
sudo tee /etc/systemd/system/finlapor.service << 'EOF'
[Unit]
Description=FinLapor Backend API
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/finlapor/backend
ExecStart=/home/ec2-user/finlapor/backend/finlapor-server
EnvironmentFile=/home/ec2-user/finlapor/backend/.env
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

### Step 5.3: Enable dan Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable finlapor
sudo systemctl start finlapor

# Cek status
sudo systemctl status finlapor

# Lihat logs
journalctl -u finlapor -f
```

---

## 6. Troubleshooting

### Port 8080 tidak bisa diakses

**Gejala:** `curl http://[IP]:8080` timeout

**Cek & Solusi:**

| Cek | Command | Solusi |
|-----|---------|--------|
| Service running? | `docker ps` atau `systemctl status finlapor` | Start service |
| Port listening? | `netstat -tlnp \| grep 8080` | Pastikan bind ke 0.0.0.0 |
| Security Group? | AWS Console | Buka port 8080 |
| Firewall lokal? | `sudo iptables -L` | Allow port 8080 |

### Docker build gagal

**Gejala:** Build error saat `docker-compose up`

**Solusi:**
```bash
# Lihat error detail
docker-compose -f docker-compose.production.yml build --no-cache

# Cek Dockerfile
cat backend/Dockerfile

# Pastikan multi-stage build benar
```

### Backend crash loop

**Gejala:** Container restart terus

**Debug:**
```bash
# Lihat logs
docker logs finlapor-backend

# Common errors:
# - DATABASE_URL wrong: Cek connection string
# - Redis connection refused: Pastikan redis container running
# - Port already in use: `sudo lsof -i :8080`
```

### SSH timeout ke Private Subnet

**Gejala:** SSH ke backend private IP timeout

**Penyebab:** Tidak bisa SSH langsung ke private subnet

**Solusi:** Gunakan Bastion Jump:
```bash
ssh -J ec2-user@[BASTION_IP] ec2-user@[BACKEND_PRIVATE_IP] -i finlapor-key.pem
```

### Tidak bisa docker pull (Private Subnet)

**Gejala:** `docker pull` timeout

**Penyebab:** Private Subnet tidak punya internet

**Solusi:** Transfer via Bastion (lihat Step 3.3)

---

## ✅ Checklist

### Opsi A (Public Subnet)
- [ ] EC2 di-launch di Public Subnet
- [ ] Auto-assign Public IP: Enable
- [ ] Security Group: SSH (My IP), HTTP 8080 (0.0.0.0/0)
- [ ] Docker dan Docker Compose installed
- [ ] Repository cloned
- [ ] .env configured
- [ ] Docker Compose running
- [ ] Health check: `curl http://[PUBLIC_IP]:8080/health`

### Opsi B (Private Subnet)
- [ ] Bastion Host di Public Subnet
- [ ] Backend EC2 di Private Subnet
- [ ] Auto-assign Public IP: Disable
- [ ] SSH via Bastion working
- [ ] Files transferred via Bastion
- [ ] Docker images loaded
- [ ] .env configured
- [ ] Docker Compose running
- [ ] Health check: `curl http://localhost:8080/health`

---

## Next Step

Lanjut ke → [07. Lambda AI Setup](./07-lambda-ai-setup.md)
