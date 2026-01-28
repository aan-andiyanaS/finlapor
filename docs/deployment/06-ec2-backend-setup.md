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
| **Install Packages** | `apt install` langsung | Transfer via Bastion |
| **Keamanan** | ⚠️ Terekspos internet | ✅ Tersembunyi |
| **Biaya** | Lebih murah | +$3.80 (Bastion) |

### Metode Deploy Backend

| Metode | Kelebihan | Kekurangan | Recommended |
|--------|-----------|------------|-------------|
| **Go Binary** | Ringan, cepat start | Build manual | ✅ Simple |
| **Docker Container** | Konsisten, portable | Butuh resource lebih | ✅ Production |

### 🧭 Quick Navigation Guide

Pilih kombinasi yang sesuai dengan kebutuhan Anda:

| Jika Anda Pilih... | Ikuti Section Ini |
|--------------------|-------------------|
| **Opsi A + Docker Compose** | Section 1 (skip) → 2 → 3 → 4 |
| **Opsi A + Backend-Only** | Section 1 (skip) → 2 → 3 → 4B |
| **Opsi B + Docker Compose** | Section 1 → 2 → 3B → 4 |
| **Opsi B + Backend-Only** | Section 1 → 2 → 3B → 4B |
| **Tanpa Docker (Binary)** | Ikuti sampai Section 3/3B, lalu Section 5 |

> **📝 Catatan Penting:**
> - **Section 3** = Install Dependencies untuk **Opsi A** (Public Subnet dengan internet)
> - **Section 3B** = Install Dependencies untuk **Opsi B** (Private Subnet via Bastion)
> - **Section 4** = Deploy dengan Docker Compose (Backend + Redis container)
> - **Section 4B** = Backend-Only Docker (pakai AWS RDS + S3, tanpa Redis lokal)

---

## 1. Setup Bastion Host (Opsi B Only)

> **📝 Skip section ini jika menggunakan Opsi A (Public Subnet)**

### Step 1.1: Launch Bastion EC2

1. EC2 Console → **Launch Instance**
2. Konfigurasi:

```
Name: finlapor-bastion
AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
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
│ SSH      │ 22       │ Private IP Backend  │ Gate SSH IP Backend │
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
ssh -i finlapor-key.pem ubuntu@[BASTION_PUBLIC_IP]
```

---

## 2. Launch EC2 Backend

### Step 2.1: Launch Instance

1. EC2 Console → **Launch Instance**
2. Konfigurasi:

**Opsi A (Public Subnet):**
```
Name: finlapor-backend
AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
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
AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
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


## 3. Install Dependencies (Opsi A: Public Subnet)

> **📝 Section ini untuk Opsi A (Public Subnet dengan akses internet).**
> Untuk **Opsi B (Private Subnet)**, lompat ke [Section 3B](#3b-install-dependencies-opsi-b---private-subnet).

### Step 3.1: Connect ke EC2
```
Dari laptop local:
```bash
ssh -i finlapor-key.pem ubuntu@[EC2_PUBLIC_IP]
```

### Step 3.2: Update System (Ubuntu)

```bash
# Update package list
sudo apt update

# Upgrade packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip gnupg lsb-release ca-certificates
```

### Step 3.3: Install Docker (Ubuntu)

```bash
# 1. Remove old Docker versions (if any)
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# 2. Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 3. Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# 6. Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER

# 7. Verify installation
docker --version
# Output: Docker version 24.x.x

# 8. IMPORTANT: Logout dan login lagi agar group berlaku
exit
```

> **📝 Penting:** Setelah `exit`, SSH kembali ke EC2 agar docker group berlaku.

### Step 3.4: Install Docker Compose (Ubuntu)

Docker Compose plugin sudah ter-install di Step 3.3. Verifikasi:

```bash
# Cek docker compose
docker compose version
# Output: Docker Compose version v2.x.x

# Atau buat symlink untuk kompatibilitas (opsional)
sudo ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
docker-compose --version
```

### Step 3.5: Install Go (Opsional - Jika tidak pakai Docker)

```bash
# 1. Download Go 1.21
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz

# 2. Extract ke /usr/local
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz

# 3. Setup PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# 4. Verify
go version
# Output: go version go1.21.6 linux/amd64

# 5. Cleanup
rm go1.21.6.linux-amd64.tar.gz
```

### Step 3.6: Install PostgreSQL Client (untuk migrasi)

```bash
# Install psql client
sudo apt install -y postgresql-client

# Verify
psql --version
# Output: psql (PostgreSQL) 14.x
```

### Step 3.7: Clone Repository

```bash
# Clone project
git clone https://github.com/aan-andiyanaS/finlapor.git
cd finlapor

# Verify struktur folder
ls -la
# Harus ada: backend/, frontend/, ai-service/, database/, docs/
```

### Step 3.8: Konfigurasi Environment

```bash
# Buat file .env
nano backend/.env
```

Isi dengan:
```env
# === DATABASE (AWS RDS) ===
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@finlapor-db.xxxxx.rds.amazonaws.com:5432/finlapor?sslmode=require

# === REDIS ===
REDIS_URL=redis://localhost:6379

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

# === AI (HuggingFace) ===
HF_TOKEN=hf_xxxxxxxx
HF_LLM_MODEL=Qwen/Qwen2.5-72B-Instruct
HF_OCR_MODEL=naver-clova-ix/donut-base-finetuned-cord-v2
```

Simpan dengan `Ctrl+X`, `Y`, `Enter`.

---

### 📍 Cara Mendapatkan Setiap Environment Variable

#### 1. DATABASE_URL (AWS RDS)

**Format:** `postgres://USER:PASSWORD@ENDPOINT:PORT/DATABASE?sslmode=require`

**Langkah mendapatkan:**
1. AWS Console → **RDS** → **Databases**
2. Klik database `finlapor-db`
3. Tab **Connectivity & security**
4. Copy **Endpoint**: `finlapor-db.xxxxxxxx.ap-southeast-1.rds.amazonaws.com`

```
┌─────────────────────────────────────────────────────────────────┐
│  RDS Console → finlapor-db                                      │
├─────────────────────────────────────────────────────────────────┤
│  Endpoint: finlapor-db.xxxxxxxx.ap-southeast-1.rds.amazonaws.com│
│  Port: 5432                                                     │
│  Master username: postgres                                      │
│  Database name: finlapor                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Contoh hasil:**
```
DATABASE_URL=postgres://postgres:MySecurePass123@finlapor-db.abc123xyz.ap-southeast-1.rds.amazonaws.com:5432/finlapor?sslmode=require
```

---

#### 2. S3 Variables (AWS S3 + IAM)

**S3_ENDPOINT:**
- Format: `https://s3.[REGION].amazonaws.com`
- Singapore: `https://s3.ap-southeast-1.amazonaws.com`

**S3_BUCKET:**
1. AWS Console → **S3** → **Buckets**
2. Copy nama bucket: `finlapor-storage-abc123`

**S3_REGION:**
- Lihat di S3 Console → kolom **AWS Region**
- Singapore: `ap-southeast-1`

**S3_ACCESS_KEY & S3_SECRET_KEY:**
1. AWS Console → **IAM** → **Users**
2. Klik user `finlapor-s3-user`
3. Tab **Security credentials**
4. **Access keys** → **Create access key**
5. Pilih **Application running outside AWS**
6. ⚠️ **SIMPAN KEDUA KEY!** (Secret hanya ditampilkan sekali)

```
┌─────────────────────────────────────────────────────────────────┐
│  IAM → Users → finlapor-s3-user → Security credentials          │
├─────────────────────────────────────────────────────────────────┤
│  Access key ID:     AKIAIOSFODNN7EXAMPLE                        │
│  Secret access key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY    │
└─────────────────────────────────────────────────────────────────┘
```

**Contoh hasil:**
```
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=finlapor-storage-abc123
S3_REGION=ap-southeast-1
```

---

#### 3. JWT_SECRET (Generate Sendiri)

**Cara generate secure random string:**

**Opsi 1: Online Generator**
- [https://randomkeygen.com/](https://randomkeygen.com/) → pilih "256-bit WEP Key"

**Opsi 2: Command Line (Linux/macOS)**
```bash
openssl rand -base64 32
# Output: xK7Yz9Qa2Ws4Ed5Rf6Tg7Hy8Ui9Op0Lk1Mj2Nb3Vc=
```

**Opsi 3: Command Line (Windows PowerShell)**
```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

> ⚠️ **PENTING:** 
> - Minimal 32 karakter
> - Jangan gunakan contoh di atas! Generate sendiri
> - Simpan dengan aman, jangan share ke siapapun

**Contoh hasil:**
```
JWT_SECRET=xK7Yz9Qa2Ws4Ed5Rf6Tg7Hy8Ui9Op0Lk1Mj2Nb3Vc4Xd5Ae6Bf7Cg8Dh9
```

---

#### 4. HF_TOKEN (HuggingFace)

**Langkah mendapatkan:**
1. Buka [https://huggingface.co/](https://huggingface.co/)
2. Login / Daftar
3. Klik **Profile** (kanan atas) → **Settings**
4. Menu kiri: **Access Tokens**
5. Klik **New token**
6. Name: `finlapor-production`
7. Role: **Read** (cukup untuk inference)
8. Klik **Generate a token**
9. Copy token yang dimulai dengan `hf_...`

```
┌─────────────────────────────────────────────────────────────────┐
│  HuggingFace → Settings → Access Tokens                         │
├─────────────────────────────────────────────────────────────────┤
│  Token name: finlapor-production                                 │
│  Token:      hf_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890            │
└─────────────────────────────────────────────────────────────────┘
```

**Contoh hasil:**
```
HF_TOKEN=hf_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

---

#### 5. HF_LLM_MODEL & HF_OCR_MODEL (HuggingFace Models)

**Model yang Direkomendasikan:**

| Variable | Model | Fungsi | Free Tier? |
|----------|-------|--------|------------|
| `HF_LLM_MODEL` | `Qwen/Qwen2.5-72B-Instruct` | Chatbot AI | ✅ Ya |
| `HF_OCR_MODEL` | `naver-clova-ix/donut-base-finetuned-cord-v2` | OCR Struk | ✅ Ya |

**Alternatif LLM Models (jika ada masalah):**
- `mistralai/Mistral-7B-Instruct-v0.2` - Lebih ringan
- `meta-llama/Llama-2-7b-chat-hf` - Perlu request access

**Cara menemukan model:**
1. Buka [https://huggingface.co/models](https://huggingface.co/models)
2. Filter: **Text Generation** atau **Image-to-Text**
3. Copy nama model (format: `organization/model-name`)

**Contoh hasil:**
```
HF_LLM_MODEL=Qwen/Qwen2.5-72B-Instruct
HF_OCR_MODEL=naver-clova-ix/donut-base-finetuned-cord-v2
```

---

#### 6. REDIS_URL

**Opsi A: Docker Redis (Local di EC2)**
```
REDIS_URL=redis://localhost:6379
```

**Opsi B: AWS ElastiCache (Managed)**
1. AWS Console → **ElastiCache** → **Redis clusters**
2. Klik cluster → **Cluster details**
3. Copy **Primary endpoint**

```
REDIS_URL=redis://finlapor-cache.xxxxxx.cache.amazonaws.com:6379
```

---

#### 7. PORT & APP_ENV

Ini sudah fixed, tidak perlu cari di AWS:

```
PORT=8080
APP_ENV=production
```

---

### ✅ Checklist Environment Variables

Sebelum lanjut, pastikan Anda sudah punya semua ini:

| Variable | Source | Status |
|----------|--------|--------|
| `DATABASE_URL` | RDS Console → Endpoint | [ ] |
| `S3_ENDPOINT` | `https://s3.[region].amazonaws.com` | [ ] |
| `S3_ACCESS_KEY` | IAM → Users → Access keys | [ ] |
| `S3_SECRET_KEY` | IAM → Users → Access keys | [ ] |
| `S3_BUCKET` | S3 Console → Bucket name | [ ] |
| `S3_REGION` | S3 Console → Region | [ ] |
| `JWT_SECRET` | Generate sendiri (min 32 char) | [ ] |
| `HF_TOKEN` | HuggingFace → Access Tokens | [ ] |
| `HF_LLM_MODEL` | `Qwen/Qwen2.5-72B-Instruct` | [ ] |
| `HF_OCR_MODEL` | `naver-clova-ix/donut-base-finetuned-cord-v2` | [ ] |
| `REDIS_URL` | `redis://localhost:6379` atau ElastiCache | [ ] |
| `PORT` | `8080` (fixed) | [ ] |
| `APP_ENV` | `production` (fixed) | [ ] |

---

### Step 3.9: Run Database Migrations

```bash
# Set DATABASE_URL
export DATABASE_URL="postgres://postgres:YOUR_PASSWORD@finlapor-db.xxxxx.rds.amazonaws.com:5432/finlapor?sslmode=require"

# Run migrations
psql "$DATABASE_URL" -f database/migrations/001_initial.sql
psql "$DATABASE_URL" -f database/migrations/002_multi_category.sql
psql "$DATABASE_URL" -f database/migrations/003_add_user_age.sql

# Verify tables
psql "$DATABASE_URL" -c "\dt"

# Expected output:
#  Schema |      Name       | Type  |  Owner
# --------+-----------------+-------+----------
#  public | categories      | table | postgres
#  public | transactions    | table | postgres
#  public | users           | table | postgres
#  public | ...             | ...   | ...
```

---

## 3B. Install Dependencies (Opsi B - Private Subnet)

> **📝 Section ini untuk Opsi B (Private Subnet dengan Bastion Host).**
> Gunakan jika EC2 backend ada di **Private Subnet** (tidak ada akses internet langsung).
> Lihat [Architecture](../architecture.md) untuk detail arsitektur.

### Arsitektur Private Subnet

```
┌─────────────────────────────────────────────────────────────────┐
│                       AWS VPC                                    │
│  ┌────────────────────┐    ┌────────────────────────────────┐   │
│  │  PUBLIC SUBNET     │    │       PRIVATE SUBNET           │   │
│  │                    │    │                                │   │
│  │  ┌──────────────┐  │    │  ┌──────────────────────────┐  │   │
│  │  │ Bastion Host │──┼────┼─►│   Backend (Go)           │  │   │
│  │  │ (t3.nano)    │  │ SSH│  │   EC2 t3.micro           │  │   │
│  │  │ Ubuntu 22.04 │  │    │  │   Ubuntu 22.04           │  │   │
│  │  └──────────────┘  │    │  └──────────┬───────────────┘  │   │
│  │         ▲          │    │             │                  │   │
│  │       SSH          │    │   ┌─────────▼────────────┐     │   │
│  │     (Your IP)      │    │   │   AWS RDS + Redis    │     │   │
│  └────────────────────┘    │   └──────────────────────┘     │   │
│                            └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Keuntungan:**
- ✅ Backend tidak exposed ke internet
- ✅ Lebih aman untuk production
- ✅ Akses via API Gateway (VPC Link)

### Step 3B.1: Setup Bastion Host

SSH ke Bastion terlebih dahulu:
```bash
ssh -i finlapor-key.pem ubuntu@[BASTION_PUBLIC_IP]
```

Di Bastion, install tools:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install tools
sudo apt install -y curl wget git unzip

# Install Docker (untuk save images)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Logout dan login lagi
exit
```

### Step 3B.2: Download Dependencies di Bastion

SSH kembali ke Bastion:
```bash
ssh -i finlapor-key.pem ubuntu@[BASTION_PUBLIC_IP]
```

Download semua yang diperlukan:
```bash
# 1. Clone repository
git clone https://github.com/aan-andiyanaS/finlapor.git

# 2. Download Go
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz

# 3. Download Docker images (untuk offline install)
docker pull golang:alpine
docker pull alpine:latest
docker pull redis:7-alpine
docker save golang:alpine alpine:latest redis:7-alpine -o docker-images.tar

# 4. Download Docker deb packages untuk Ubuntu (offline install)
mkdir -p docker-debs
cd docker-debs
curl -fsSL https://download.docker.com/linux/ubuntu/dists/jammy/pool/stable/amd64/containerd.io_1.6.28-1_amd64.deb -o containerd.io.deb
curl -fsSL https://download.docker.com/linux/ubuntu/dists/jammy/pool/stable/amd64/docker-ce_24.0.9-1~ubuntu.22.04~jammy_amd64.deb -o docker-ce.deb
curl -fsSL https://download.docker.com/linux/ubuntu/dists/jammy/pool/stable/amd64/docker-ce-cli_24.0.9-1~ubuntu.22.04~jammy_amd64.deb -o docker-ce-cli.deb
curl -fsSL https://download.docker.com/linux/ubuntu/dists/jammy/pool/stable/amd64/docker-compose-plugin_2.24.5-1~ubuntu.22.04~jammy_amd64.deb -o docker-compose-plugin.deb
cd ..

echo "✅ Semua dependencies sudah didownload"
```

### Step 3B.3: Transfer ke Backend (Private Subnet)

Masih di Bastion:
```bash
# Copy finlapor project
scp -i ~/.ssh/finlapor-key.pem -r finlapor/ ubuntu@[BACKEND_PRIVATE_IP]:/home/ubuntu/

# Copy Go installer
scp -i ~/.ssh/finlapor-key.pem go1.21.6.linux-amd64.tar.gz ubuntu@[BACKEND_PRIVATE_IP]:/home/ubuntu/

# Copy Docker images
scp -i ~/.ssh/finlapor-key.pem docker-images.tar ubuntu@[BACKEND_PRIVATE_IP]:/home/ubuntu/

# Copy Docker deb packages
scp -i ~/.ssh/finlapor-key.pem -r docker-debs/ ubuntu@[BACKEND_PRIVATE_IP]:/home/ubuntu/

echo "✅ Transfer selesai"
```

### Step 3B.4: SSH ke Backend via Bastion

Dari laptop local:

##### Metode 1: SSH Jump
```bash
ssh -J ubuntu@[BASTION_PUBLIC_IP] ubuntu@[BACKEND_PRIVATE_IP] -i finlapor-key.pem
```

##### Metode 2: Setup SSH config untuk kemudahan

**Linux/macOS** - Edit file `~/.ssh/config`:
```
Host bastion
    HostName [BASTION_PUBLIC_IP]
    User ubuntu
    IdentityFile ~/.ssh/finlapor-key.pem

Host finlapor-backend
    HostName [BACKEND_PRIVATE_IP]
    User ubuntu
    IdentityFile ~/.ssh/finlapor-key.pem
    ProxyJump bastion
```

**Windows** - Edit file `C:\Users\(UserName)\.ssh\config`:
```
Host bastion
    HostName [BASTION_PUBLIC_IP]
    User ubuntu
    IdentityFile C:\Users\(UserName)\.ssh\finlapor-key.pem

Host finlapor-backend
    HostName [BACKEND_PRIVATE_IP]
    User ubuntu
    IdentityFile C:\Users\(UserName)\.ssh\finlapor-key.pem
    ProxyJump bastion
```

##### Lalu cukup:
```bash
ssh finlapor-backend
```

### Step 3B.5: Install Docker di Backend (Offline)

Di Backend EC2:
```bash
# Install Docker dari deb packages
cd docker-debs
sudo dpkg -i containerd.io.deb docker-ce-cli.deb docker-ce.deb docker-compose-plugin.deb

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user ke docker group
sudo usermod -aG docker $USER

# Verify
docker --version
docker compose version

# Logout dan login lagi
exit
```

SSH kembali:
```bash
ssh finlapor-backend
```

### Step 3B.6: Load Docker Images (Offline)

```bash
# Load pre-downloaded images
docker load -i docker-images.tar

# Verify images
docker images
# Harus ada: golang:alpine, alpine:latest, redis:7-alpine
```

### Step 3B.7: Install Go (Opsional)

```bash
# Extract Go
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz

# Setup PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
go version
```

### Step 3B.8: Configure Environment

```bash
cd ~/finlapor

# Create .env file
nano backend/.env
```

Isi dengan format yang sama seperti [Step 3.8](#step-38-konfigurasi-environment) di atas.

### Step 3B.9: Run Migrations via Bastion Tunnel

Karena di Private Subnet tidak bisa langsung akses RDS dari laptop:

**Di laptop local, buat SSH tunnel:**
```bash
# Buat tunnel melalui Bastion ke RDS (port 5433 local -> RDS 5432)
ssh -i finlapor-key.pem -L 5433:finlapor-db.xxxxx.rds.amazonaws.com:5432 ubuntu@[BASTION_PUBLIC_IP]

# Di terminal lain, jalankan migrations via tunnel
psql -h localhost -p 5433 -U postgres -d finlapor -f database/migrations/001_initial.sql
psql -h localhost -p 5433 -U postgres -d finlapor -f database/migrations/002_multi_category.sql
psql -h localhost -p 5433 -U postgres -d finlapor -f database/migrations/003_add_user_age.sql
```

Atau jalankan langsung dari EC2 Backend jika sudah ada PostgreSQL client.

---

## 4. Deploy dengan Docker

### Step 4.1: Setup Environment File

```bash
cd ~/finlapor

# Gunakan template environment dari Step 3.8
# Atau buat dengan cat:
cat > backend/.env << 'EOF'
# Lihat Step 3.8 untuk template lengkap environment variables
# Copy template dari sana dan sesuaikan dengan nilai AWS Anda
EOF

# Edit file:
nano backend/.env
```

> **📝 Referensi:** Lihat [Step 3.8](#step-38-konfigurasi-environment) untuk template lengkap environment variables.

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

## 4B. Backend-Only Docker (RDS + S3)

> **📝 Section ini untuk setup minimalis dengan AWS Managed Services.**
> Cocok jika Anda menggunakan AWS RDS (PostgreSQL) dan S3, tanpa Redis lokal.

### Arsitektur Backend-Only

```
┌─────────────────────────────────────────────────────────────────┐
│                     Ubuntu EC2                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Docker Container: finlapor-backend                     │    │
│  │  Port: 8080                                             │    │
│  └─────────────────┬───────────────────────────────────────┘    │
└────────────────────┼────────────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┬──────────────┐
      ▼              ▼              ▼              ▼
 ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
 │ AWS RDS │   │ AWS S3  │   │ HF API  │   │ Lambda  │
 │ Postgres│   │ Storage │   │ AI/Chat │   │ AI Svc  │
 └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

**Keuntungan:**
- ✅ Setup paling simpel
- ✅ Tidak perlu `docker-compose`
- ✅ Semua managed by AWS
- ✅ Mudah scale dan maintain

### Step 4B.1: Setup Environment File

```bash
cd ~/finlapor
nano backend/.env
```

Isi dengan (versi **minimalis tanpa Redis**, berbeda dari Step 3.8):
```env
# === DATABASE (AWS RDS) ===
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@finlapor-db.xxxxx.rds.amazonaws.com:5432/finlapor?sslmode=require

# === S3 STORAGE (AWS S3) ===
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
S3_ACCESS_KEY=AKIAXXXXXXXXXXXXXXXXXX
S3_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
S3_BUCKET=finlapor-storage-xxxxx
S3_REGION=ap-southeast-1

# === JWT & SERVER ===
JWT_SECRET=your-super-secret-key-minimum-32-characters
PORT=8080
APP_ENV=production
FRONTEND_URL=https://finlapor.airi.click

# === AI (HuggingFace) ===
HF_TOKEN=hf_xxxxxxxx
HF_LLM_MODEL=Qwen/Qwen2.5-72B-Instruct
HF_OCR_MODEL=naver-clova-ix/donut-base-finetuned-cord-v2

# === REDIS (Opsional - bisa kosongkan jika tidak pakai) ===
# REDIS_URL=redis://localhost:6379
```

Simpan dengan `Ctrl+X`, `Y`, `Enter`.

### Step 4B.2: Build Docker Image

```bash
cd ~/finlapor

# Build backend image
docker build -t finlapor-backend ./backend

# Verify image
docker images | grep finlapor
# Output: finlapor-backend   latest   xxxxx   xx MB
```

### Step 4B.3: Run Backend Container

```bash
# Run container
docker run -d \
  --name finlapor-backend \
  --restart unless-stopped \
  -p 8080:8080 \
  --env-file ./backend/.env \
  finlapor-backend

# Cek status
docker ps

# Output:
# CONTAINER ID   IMAGE              STATUS         PORTS
# xxxxxxxxxxxx   finlapor-backend   Up x minutes   0.0.0.0:8080->8080/tcp
```

### Step 4B.4: Verifikasi

```bash
# Health check lokal
curl http://localhost:8080/health
# Output: {"status":"ok"}

# Health check dari luar (jika Public Subnet)
curl http://[EC2_PUBLIC_IP]:8080/health

# Lihat logs
docker logs finlapor-backend

# Follow logs
docker logs -f finlapor-backend
```

### Step 4B.5: Management Commands

```bash
# Stop container
docker stop finlapor-backend

# Start container
docker start finlapor-backend

# Restart container
docker restart finlapor-backend

# Remove container
docker rm -f finlapor-backend

# Rebuild dan deploy ulang
docker build -t finlapor-backend ./backend
docker rm -f finlapor-backend
docker run -d \
  --name finlapor-backend \
  --restart unless-stopped \
  -p 8080:8080 \
  --env-file ./backend/.env \
  finlapor-backend
```

### Step 4B.6: Auto-start on Boot

Dengan `--restart unless-stopped`, container akan otomatis start saat EC2 reboot.

Untuk memastikan Docker service juga auto-start:
```bash
sudo systemctl enable docker
```

### Step 4B.7: Update Deployment

Saat ada update code:
```bash
cd ~/finlapor

# Pull latest code
git pull origin main

# Rebuild dan deploy
docker build -t finlapor-backend ./backend
docker rm -f finlapor-backend
docker run -d \
  --name finlapor-backend \
  --restart unless-stopped \
  -p 8080:8080 \
  --env-file ./backend/.env \
  finlapor-backend

# Verify
docker logs finlapor-backend
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
User=ubuntu
WorkingDirectory=/home/ubuntu/finlapor/backend
ExecStart=/home/ubuntu/finlapor/backend/finlapor-server
EnvironmentFile=/home/ubuntu/finlapor/backend/.env
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
ssh -J ubuntu@[BASTION_IP] ubuntu@[BACKEND_PRIVATE_IP] -i finlapor-key.pem
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
