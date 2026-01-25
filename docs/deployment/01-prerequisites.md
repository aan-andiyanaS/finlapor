# 📦 Prerequisites - Persiapan Deployment

Sebelum memulai deployment, pastikan Anda memiliki semua tools dan akun yang dibutuhkan.

---

## 🛠️ Tools yang Dibutuhkan

### Wajib Install

| Tool | Versi Minimum | Fungsi | Download |
|------|---------------|--------|----------|
| **Node.js** | v18+ | Build frontend Next.js | [nodejs.org](https://nodejs.org/) |
| **Go** | v1.21+ | Backend API | [go.dev](https://go.dev/dl/) |
| **Docker** | v20+ | Container untuk services | [docker.com](https://www.docker.com/) |
| **AWS CLI** | v2+ | Deploy ke AWS | [aws.amazon.com/cli](https://aws.amazon.com/cli/) |
| **Git** | v2+ | Version control | [git-scm.com](https://git-scm.com/) |

### Verifikasi Instalasi

```bash
# Jalankan di terminal
node --version    # Output: v18.x.x atau lebih tinggi
go version        # Output: go1.21.x atau lebih tinggi
docker --version  # Output: Docker version 20.x.x atau lebih tinggi
aws --version     # Output: aws-cli/2.x.x
git --version     # Output: git version 2.x.x
```

### Mengapa Tools Ini?

| Tool | Alasan | Jika Tidak Ada |
|------|--------|----------------|
| **Node.js** | Untuk `npm run build` frontend | ❌ Tidak bisa build frontend |
| **Go** | Compile backend binary | ❌ Backend tidak bisa dijalankan |
| **Docker** | Menjalankan services terisolasi | ⚠️ Harus install manual semua dependencies |
| **AWS CLI** | Deploy dan manage AWS resources | ⚠️ Harus via Console (lebih lambat) |
| **Git** | Clone repository, version control | ❌ Tidak bisa deploy CI/CD |

---

## 🌐 Akun yang Dibutuhkan

| Layanan | URL | Gratis? | Fungsi |
|---------|-----|---------|--------|
| **GitHub** | [github.com](https://github.com) | ✅ Ya | Repository code, CI/CD |
| **AWS** | [aws.amazon.com](https://aws.amazon.com) | ✅ Free tier 12 bulan | Backend infrastructure |
| **CloudFlare** | [cloudflare.com](https://cloudflare.com) | ✅ Ya | Frontend hosting, CDN, SSL |
| **HuggingFace** | [huggingface.co](https://huggingface.co) | ✅ Ya | AI models API |

### Cara Daftar

#### GitHub (jika belum punya)
1. Buka [github.com/signup](https://github.com/signup)
2. Masukkan email, password, username
3. Verifikasi email
4. Fork/clone repository FinLapor

#### AWS Account
1. Buka [aws.amazon.com](https://aws.amazon.com)
2. Klik "Create an AWS Account"
3. Isi informasi:
   - Email
   - Password
   - Account name: `finlapor-production`
4. Pilih "Personal" account type
5. Masukkan kartu kredit (untuk verifikasi, tidak dicharge)
6. Pilih "Basic Support - Free"
7. Verifikasi via SMS

> **⚠️ PENTING:** AWS membutuhkan kartu kredit untuk verifikasi, tapi tidak akan dicharge jika tetap dalam Free Tier.

#### CloudFlare Account
1. Buka [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Masukkan email dan password
3. Verifikasi email
4. Dashboard siap digunakan

#### HuggingFace Account
1. Buka [huggingface.co/join](https://huggingface.co/join)
2. Daftar dengan GitHub atau email
3. Buat Access Token:
   - Profile → Settings → Access Tokens
   - New token → Read permission
   - Copy dan simpan!

---

## 💰 Estimasi Biaya

### Perbandingan per Arsitektur

| Komponen | Opsi A (Public) | Opsi B (Private) | Free Tier? |
|----------|-----------------|------------------|------------|
| EC2 Backend (t3.micro) | $8.50/bulan | $8.50/bulan | ✅ 750 jam/bulan |
| EC2 Bastion (t3.nano) | - | $3.80/bulan | ✅ 750 jam/bulan |
| RDS PostgreSQL | $15-25/bulan | $15-25/bulan | ✅ 750 jam/bulan |
| S3 Storage (5GB) | $0.10/bulan | $0.10/bulan | ✅ 5GB gratis |
| API Gateway | - | $1-3/bulan | ✅ 1M request gratis |
| Lambda | $0 | $0 | ✅ 1M request gratis |
| CloudFlare | $0 | $0 | ✅ Gratis |
| **TOTAL** | **~$24-34** | **~$28-40** | - |

### Tips Menghemat Biaya

1. **Gunakan Free Tier AWS** (12 bulan pertama)
   - EC2 t3.micro: 750 jam/bulan gratis
   - RDS: 750 jam/bulan gratis
   - S3: 5GB gratis
   - Lambda: 1M requests/bulan gratis

2. **Stop EC2 saat tidak dipakai**
   ```bash
   aws ec2 stop-instances --instance-ids i-xxxxx
   ```
   Biaya stop: ~$0.80/bulan (hanya storage)

3. **Alternatif hemat untuk Demo/UAS:**
   - Ganti RDS dengan PostgreSQL di Docker (di EC2)
   - Skip Bastion, pakai Opsi A (Public Subnet)
   - **Total:** ~$9-15/bulan

---

## 📂 Clone Repository

```bash
# Clone repository
git clone https://github.com/aan-andiyanaS/finlapor.git
cd finlapor

# Periksa struktur
ls -la

# Expected output:
# backend/
# frontend/
# ai-service/
# database/
# docs/
# docker-compose.yml
# README.md
```

---

## ✅ Checklist Persiapan

Sebelum lanjut ke tahap berikutnya, pastikan:

- [ ] Node.js v18+ terinstall
- [ ] Go v1.21+ terinstall
- [ ] Docker v20+ terinstall dan running
- [ ] AWS CLI v2 terinstall
- [ ] Git terinstall
- [ ] Akun GitHub aktif
- [ ] Akun AWS terverifikasi (dengan kartu kredit)
- [ ] Akun CloudFlare aktif
- [ ] Akun HuggingFace dengan Access Token
- [ ] Repository FinLapor sudah di-clone

---

## 🔧 Troubleshooting

### Node.js tidak terinstall dengan benar

**Gejala:** `node: command not found`

**Solusi:**
```bash
# Windows (via winget)
winget install OpenJS.NodeJS.LTS

# macOS (via Homebrew)
brew install node@18

# Linux (via nvm - recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Docker tidak bisa start

**Gejala:** Docker daemon not running

**Solusi (Windows):**
1. Buka Docker Desktop
2. Tunggu sampai status "Running"
3. Jika error WSL2, install WSL2:
   ```powershell
   wsl --install
   ```

### AWS CLI credential error

**Gejala:** `unable to locate credentials`

**Solusi:**
```bash
aws configure
# Masukkan:
# AWS Access Key ID: [dari IAM]
# AWS Secret Access Key: [dari IAM]
# Default region: ap-southeast-1
# Output format: json
```

---

## Next Step

Lanjut ke → [02. AWS Account Setup](./02-aws-account-setup.md)
