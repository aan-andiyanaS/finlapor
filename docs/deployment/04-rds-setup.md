# 🗄️ Setup AWS RDS (PostgreSQL)

Konfigurasi AWS RDS PostgreSQL sebagai managed database untuk FinLapor.

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Membuat RDS Instance](#1-membuat-rds-instance)
3. [Konfigurasi Security Group](#2-konfigurasi-security-group)
4. [Run Database Migrations](#3-run-database-migrations)
5. [Setup Demo User](#4-setup-demo-user-opsional)
6. [Troubleshooting](#5-troubleshooting)

---

## Overview

### Mengapa RDS vs PostgreSQL di Docker?

| Aspek | PostgreSQL di Docker | AWS RDS |
|-------|---------------------|---------|
| **Biaya** | Termasuk EC2 ($0) | +$15-25/bulan |
| **Backup** | Manual | ✅ Otomatis (7 hari) |
| **Update/Patching** | Manual | ✅ Otomatis |
| **High Availability** | Manual setup | ✅ Multi-AZ available |
| **Scaling** | Manual resize | ✅ Easy via console |
| **Monitoring** | Manual | ✅ CloudWatch built-in |
| **Maintenance** | Anda urus | ✅ AWS urus |
| **Recovery** | Manual restore | ✅ Point-in-time recovery |

**Rekomendasi:**
- **Demo/UAS:** PostgreSQL di Docker (hemat)
- **Production:** AWS RDS (reliable, managed)

---

## 1. Membuat RDS Instance

### Step 1.1: Buka RDS Console

1. AWS Console → Search **RDS** → Click

### Step 1.2: Create Database

1. Click **Create database**
2. Pilih **Standard create**

### Step 1.3: Engine Options

```
Engine type: PostgreSQL
Version: PostgreSQL 16.x (atau 15.x)
```

### Step 1.4: Templates

```
☐ Production
☑ Free tier    ← Pilih ini untuk demo/UAS
☐ Dev/Test
```

> **💡 Free Tier:** 750 jam/bulan gratis selama 12 bulan pertama

### Step 1.5: Settings

```
DB instance identifier: finlapor-db
Master username: postgres
Master password: [PASSWORD_AMAN]  ← Catat dan simpan!
```

> **⚠️ PENTING:** Simpan password dengan aman. Jika lupa, harus reset via console.

### Step 1.6: Instance Configuration

```
DB instance class: db.t3.micro (Free tier eligible)
```

### Step 1.7: Storage

```
Storage type: gp2 (General Purpose SSD)
Allocated storage: 20 GiB
Enable storage autoscaling: ☐ No (untuk kontrol biaya)
```

### Step 1.8: Connectivity

```
┌────────────────────────────────────────────────────────┐
│ Connectivity                                           │
├────────────────────────────────────────────────────────┤
│ Compute resource: Don't connect to EC2 compute         │
│                                                        │
│ VPC: finlapor-vpc-secure (atau finlapor-vpc)           │
│                                                        │
│ DB subnet group: Create new                            │
│   (Akan otomatis include subnet dari VPC)              │
│                                                        │
│ Public access: ☐ No   ← PENTING! Pilih No              │
│                                                        │
│ VPC security group: Create new                         │
│ New VPC SG name: finlapor-rds-sg                       │
│                                                        │
│ Availability Zone: No preference                       │
│ Database port: 5432                                    │
└────────────────────────────────────────────────────────┘
```

> **⚠️ KRITIS:** `Public access: No` membuat database **tidak bisa diakses dari internet**. Hanya EC2 dalam VPC yang sama bisa connect. Ini adalah setting **keamanan penting**.

### Step 1.9: Database Authentication

```
☑ Password authentication   ← Pilih ini
☐ IAM database authentication
```

### Step 1.10: Additional Configuration

Expand **Additional configuration**:

```
Initial database name: finlapor   ← PENTING! Jangan kosong
Enable automated backups: ☑ Yes
Backup retention period: 7 days
Enable encryption: ☑ Yes (recommended)
```

### Step 1.11: Create Database

1. Review semua settings
2. Click **Create database**
3. Tunggu status menjadi **Available** (5-10 menit)

### Step 1.12: Dapatkan Endpoint

Setelah status "Available":

1. Click database `finlapor-db`
2. Tab **Connectivity & security**
3. Copy **Endpoint**: `finlapor-db.xxxxxxxx.ap-southeast-1.rds.amazonaws.com`

---

## 2. Konfigurasi Security Group

RDS Security Group harus mengizinkan koneksi dari EC2 Backend.

### Step 2.1: Edit RDS Security Group

1. RDS Console → Database → `finlapor-db`
2. Tab **Connectivity & security**
3. Click Security Group link (finlapor-rds-sg)

### Step 2.2: Edit Inbound Rules

```
┌──────────────┬──────────┬─────────────────────────────────┬─────────────┐
│ Type         │ Port     │ Source                          │ Description │
├──────────────┼──────────┼─────────────────────────────────┼─────────────┤
│ PostgreSQL   │ 5432     │ finlapor-backend-private-sg     │ From Backend│
│              │          │ (atau 10.0.0.0/16 untuk VPC)    │             │
└──────────────┴──────────┴─────────────────────────────────┴─────────────┘
```

**Cara:**
1. Click **Edit inbound rules**
2. Delete rule yang ada (biasanya default wrong)
3. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Custom → pilih `finlapor-backend-private-sg`
4. Save rules

---

## 3. Run Database Migrations

> **❓ FAQ: Kenapa perlu install PostgreSQL client jika sudah pakai RDS?**
> 
> AWS RDS adalah **PostgreSQL Server** (tempat data disimpan). Tapi Anda tetap butuh 
> **PostgreSQL Client** (`psql`) untuk mengirim perintah SQL ke server tersebut.
> 
> ```
> ┌─────────────────────┐        ┌─────────────────────┐
> │  EC2 Backend        │        │  AWS RDS            │
> │                     │        │                     │
> │  psql (client)      │───────►│  PostgreSQL Server  │
> │  mengirim SQL       │  SQL   │  menyimpan data     │
> └─────────────────────┘        └─────────────────────┘
> ```
> 
> **Ringkasan:**
> - **RDS** = database server (managed, tidak perlu install)
> - **psql** = database client (perlu install untuk menjalankan migration)

### Step 3.1: SSH ke EC2 Backend

**Opsi A (Public Subnet):**
```bash
ssh -i finlapor-key.pem ubuntu@[EC2_PUBLIC_IP]
```

**Opsi B (Private Subnet via Bastion):**
```bash
ssh -J ubuntu@[BASTION_IP] ubuntu@[BACKEND_PRIVATE_IP] -i finlapor-key.pem
```

### Step 3.2: Install PostgreSQL Client

**Ubuntu (Public Subnet - bisa akses internet):**
```bash
sudo apt update && sudo apt install -y postgresql-client
psql --version
```

**Private Subnet (tidak bisa apt install):**

Gunakan salah satu metode berikut:

**Metode A: Docker postgres image (Recommended)**
```bash
# Jika postgres image sudah ada
sudo docker run --rm postgres:15-alpine psql --version

# Jika belum ada, download di Bastion lalu transfer (lihat Step 3B.9 di 06-ec2-backend-setup.md)
```

**Metode B: Transfer deb packages dari Bastion**
```bash
# Di Bastion (punya internet)
mkdir -p ~/psql-debs && cd ~/psql-debs
sudo apt-get download postgresql-client-16 postgresql-client-common libpq5
scp -i ~/.ssh/finlapor-key.pem ~/psql-debs/*.deb ubuntu@[BACKEND_IP]:/home/ubuntu/

# Di Backend
cd ~ && sudo dpkg -i *.deb
psql --version
```

### Step 3.3: Set DATABASE_URL

```bash
export DATABASE_URL="postgres://postgres:YOUR_PASSWORD@finlapor-db.xxxxxxxx.ap-southeast-1.rds.amazonaws.com:5432/finlapor?sslmode=require"
```

> **📝 Format:** `postgres://USER:PASSWORD@ENDPOINT:PORT/DATABASE?sslmode=require`

### Step 3.4: Test Koneksi

```bash
psql "$DATABASE_URL" -c "SELECT version();"

# Expected output:
# PostgreSQL 16.x on ...
```

### Step 3.5: Jalankan Migrations

```bash
cd ~/finlapor

# Migration 1: Initial schema
psql "$DATABASE_URL" -f database/migrations/001_initial.sql

# Migration 2: Multi-category support
psql "$DATABASE_URL" -f database/migrations/002_multi_category.sql

# Migration 3: User age field
psql "$DATABASE_URL" -f database/migrations/003_add_user_age.sql
```

### Step 3.6: Verifikasi Tables

```bash
psql "$DATABASE_URL" -c "\dt"

# Expected output:
#  Schema |      Name       | Type  |  Owner
# --------+-----------------+-------+----------
#  public | categories      | table | postgres
#  public | transactions    | table | postgres
#  public | users           | table | postgres
#  public | budgets         | table | postgres
#  public | chat_history    | table | postgres
#  public | refresh_tokens  | table | postgres
#  public | reports         | table | postgres
```

---

## 4. Setup Demo User (Opsional)

Demo user memudahkan testing dan presentasi.

### Step 4.1: Run Demo Seed

```bash
psql "$DATABASE_URL" -f database/seeds/demo-user.sql
```

### Step 4.2: Credentials Demo

| Field | Value |
|-------|-------|
| Email | `demo@finlapor.airi.click` |
| Password | `demo123` |
| Name | Demo User |

### Step 4.3: Verifikasi

```bash
psql "$DATABASE_URL" -c "SELECT email, name FROM users WHERE email = 'demo@finlapor.airi.click';"

# Output:
#          email            |   name
# --------------------------+-----------
#  demo@finlapor.airi.click | Demo User
```

---

## 5. Troubleshooting

### Error: Connection refused

**Gejala:**
```
could not connect to server: Connection refused
```

**Penyebab & Solusi:**

| Penyebab | Cara Cek | Solusi |
|----------|----------|--------|
| Security Group salah | RDS Console → SG | Edit inbound: allow 5432 dari backend SG |
| RDS belum ready | RDS Console → Status | Tunggu sampai "Available" |
| VPC berbeda | RDS & EC2 VPC IDs | Pastikan sama |
| Subnet berbeda | Network config | Pastikan route table benar |

### Error: Connection timed out

**Gejala:**
```
could not connect to server: Connection timed out
```

**Penyebab:**
- EC2 dan RDS di VPC berbeda
- Security Group tidak mengizinkan

**Debug:**
```bash
# Cek dari EC2, apakah port terbuka
nc -zv finlapor-db.xxx.rds.amazonaws.com 5432

# Jika timeout, masalah di Security Group atau VPC
```

### Error: Database does not exist

**Gejala:**
```
FATAL: database "finlapor" does not exist
```

**Penyebab:** Lupa set "Initial database name" saat create RDS.

**Solusi:**
```bash
# Connect ke postgres default database dulu
psql "postgres://postgres:PASSWORD@ENDPOINT:5432/postgres?sslmode=require"

# Buat database
CREATE DATABASE finlapor;

# Exit dan reconnect ke finlapor
\q
```

### Error: Password authentication failed

**Gejala:**
```
FATAL: password authentication failed for user "postgres"
```

**Solusi:**
1. RDS Console → Database → Modify
2. Set new password
3. Apply immediately

### Error: SSL required

**Gejala:**
```
SSL connection is required
```

**Solusi:** Tambahkan `?sslmode=require` di DATABASE_URL:
```
postgres://...?sslmode=require
```

### Tidak bisa connect dari lokal

**Gejala:** Ingin akses RDS dari laptop/lokal untuk debug

**Penjelasan:** RDS dengan `Public Access: No` **tidak bisa diakses dari internet**. Ini by design untuk keamanan.

**Solusi: SSH Tunnel**
```bash
# Buat tunnel via Bastion
ssh -i finlapor-key.pem -L 5433:finlapor-db.xxx.rds.amazonaws.com:5432 ubuntu@[BASTION_IP]

# Di terminal lain, connect via localhost
psql -h localhost -p 5433 -U postgres -d finlapor
```

---

## Environment Variable untuk Backend

Setelah RDS siap, update `.env` di EC2:

```bash
# File: ~/finlapor/backend/.env

DATABASE_URL=postgres://postgres:YOUR_PASSWORD@finlapor-db.xxxxxxxx.ap-southeast-1.rds.amazonaws.com:5432/finlapor?sslmode=require
```

---

## ✅ Checklist

- [ ] RDS instance `finlapor-db` dibuat
- [ ] Status: Available
- [ ] Public access: No
- [ ] Security Group mengizinkan port 5432 dari backend SG
- [ ] Initial database `finlapor` ada
- [ ] Migrations 001, 002, 003 sudah dijalankan
- [ ] Tables ter-create (users, categories, transactions, dll)
- [ ] Demo user (opsional) sudah dibuat
- [ ] DATABASE_URL sudah di-set di backend .env

---

## Next Step

Lanjut ke → [05. S3 Setup](./05-s3-setup.md)
