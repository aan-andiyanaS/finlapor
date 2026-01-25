# 🌐 VPC Setup

Konfigurasi Virtual Private Cloud (VPC) untuk isolasi dan keamanan infrastruktur FinLapor.

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Perbandingan Opsi](#perbandingan-opsi)
3. [Opsi A: Public Subnet Only](#opsi-a-public-subnet-only)
4. [Opsi B: Public + Private Subnet (Recommended)](#opsi-b-public--private-subnet-recommended)
5. [Troubleshooting](#troubleshooting)

---

## Overview

### Apa itu VPC?

VPC (Virtual Private Cloud) adalah jaringan virtual terisolasi di AWS tempat Anda menjalankan resources (EC2, RDS, dll).

```
┌─────────────────────────────────────────────────────────────────┐
│                           AWS VPC                               │
│                      (10.0.0.0/16)                              │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │     Public Subnet       │  │     Private Subnet          │   │
│  │     (10.0.1.0/24)       │  │     (10.0.2.0/24)           │   │
│  │                         │  │                             │   │
│  │  - Internet Gateway ✓   │  │  - No direct internet       │   │
│  │  - Public IP            │  │  - Internal only            │   │
│  │  - Bastion Host         │  │  - Backend, RDS, Redis      │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Mengapa VPC Penting?

| Tanpa VPC | Dengan VPC |
|-----------|------------|
| Resources terekspos internet | Resources terisolasi |
| Sulit kontrol traffic | Full control via Security Groups |
| Risiko keamanan tinggi | Defense in depth |

---

## Perbandingan Opsi

| Aspek | Opsi A: Public Only | Opsi B: Public + Private |
|-------|---------------------|--------------------------|
| **Struktur** | 1 tier (Public) | 2 tier (Public + Private) |
| **Backend Location** | Public Subnet | Private Subnet |
| **RDS Location** | Public Subnet* | Private Subnet |
| **SSH Access** | Langsung | Via Bastion Host |
| **Keamanan** | ⚠️ Standar | ✅ Tinggi |
| **Kompleksitas** | 🟢 Mudah | 🟡 Menengah |
| **Biaya** | Lebih murah | +$3.80 (Bastion) |
| **Sesuai Diagram** | ❌ Tidak | ✅ Ya |

> *) RDS di Public Subnet tetap aman jika `Public Access: No`

### Rekomendasi

- **Opsi A:** Quick demo, MVP, budget sangat terbatas
- **Opsi B:** Production, UAS, sesuai arsitektur diagram ✅

---

## Opsi A: Public Subnet Only

### Step A.1: Create VPC

1. AWS Console → **VPC** → **Create VPC**
2. Pilih **VPC and more** (wizard)
3. Konfigurasi:

```
┌─────────────────────────────────────────────────────┐
│ VPC Settings                                        │
├─────────────────────────────────────────────────────┤
│ Name tag auto-generation: finlapor-vpc              │
│ IPv4 CIDR block: 10.0.0.0/16                        │
│                                                     │
│ Number of Availability Zones: 2                     │
│ Number of public subnets: 2                         │
│ Number of private subnets: 0   ← Tidak ada private  │
│                                                     │
│ NAT gateways: None                                  │
│ VPC endpoints: None (atau S3 Gateway)               │
└─────────────────────────────────────────────────────┘
```

4. Klik **Create VPC**

### Step A.2: Hasil yang Dibuat

| Resource | Name | Keterangan |
|----------|------|------------|
| VPC | finlapor-vpc | 10.0.0.0/16 |
| Public Subnet 1 | finlapor-vpc-subnet-public1-ap-southeast-1a | AZ 1 |
| Public Subnet 2 | finlapor-vpc-subnet-public2-ap-southeast-1b | AZ 2 |
| Internet Gateway | finlapor-vpc-igw | Akses internet |
| Route Table | finlapor-vpc-rtb-public | Route ke IGW |

### Step A.3: Lanjut ke Tahap Berikutnya

Dengan Opsi A, lanjut ke:
- [04. RDS Setup](./04-rds-setup.md) - Pilih public subnet
- [06. EC2 Backend](./06-ec2-backend-setup.md) - Deploy di public subnet

---

## Opsi B: Public + Private Subnet (Recommended)

### Step B.1: Create VPC

1. AWS Console → **VPC** → **Create VPC**
2. Pilih **VPC and more** (wizard)
3. Konfigurasi:

```
┌─────────────────────────────────────────────────────┐
│ VPC Settings                                        │
├─────────────────────────────────────────────────────┤
│ Name tag auto-generation: finlapor-vpc-secure       │
│ IPv4 CIDR block: 10.0.0.0/16                        │
│                                                     │
│ Number of Availability Zones: 2   ← WAJIB 2!        │
│ Number of public subnets: 2                         │
│ Number of private subnets: 2      ← Ada private     │
│                                                     │
│ NAT gateways: None (hemat biaya)                    │
│ VPC endpoints: S3 Gateway         ← PENTING!        │
└─────────────────────────────────────────────────────┘
```

> **⚠️ PENTING:** Harus pilih **2 Availability Zones** karena RDS membutuhkan subnet di minimal 2 AZ berbeda!

4. Klik **Create VPC**

### Step B.2: Hasil yang Dibuat

```
finlapor-vpc-secure (10.0.0.0/16)
│
├── Public Subnets (Internet Access via IGW)
│   ├── finlapor-vpc-secure-subnet-public1-ap-southeast-1a (10.0.0.0/24)
│   └── finlapor-vpc-secure-subnet-public2-ap-southeast-1b (10.0.1.0/24)
│
├── Private Subnets (No Internet Access)
│   ├── finlapor-vpc-secure-subnet-private1-ap-southeast-1a (10.0.2.0/24)
│   └── finlapor-vpc-secure-subnet-private2-ap-southeast-1b (10.0.3.0/24)
│
├── Internet Gateway: finlapor-vpc-secure-igw
├── Route Tables:
│   ├── finlapor-vpc-secure-rtb-public (route ke IGW)
│   └── finlapor-vpc-secure-rtb-private (local only)
│
└── VPC Endpoint: finlapor-vpc-secure-vpce-s3 (Gateway ke S3)
```

### Step B.3: Verifikasi Setup

1. VPC Console → **Your VPCs** → Klik VPC
2. Tab **Resource map** → Pastikan ada:
   - 4 subnets (2 public, 2 private)
   - 1 Internet Gateway
   - Route tables terkoneksi benar
   - S3 Endpoint (jika dipilih)

### Step B.4: Mengapa 2 Availability Zones?

```
                    Region: ap-southeast-1 (Singapore)
        ┌─────────────────────────────────────────────────────┐
        │                                                     │
        │   ┌─────────────────┐    ┌─────────────────┐        │
        │   │      AZ 1a      │    │      AZ 1b      │        │
        │   │  (Data Center A)│    │  (Data Center B)│        │
        │   │                 │    │                 │        │
        │   │  ┌───────────┐  │    │  ┌───────────┐  │        │
        │   │  │ Subnet 1a │  │    │  │ Subnet 1b │  │        │
        │   │  └───────────┘  │    │  └───────────┘  │        │
        │   │                 │    │                 │        │
        │   └─────────────────┘    └─────────────────┘        │
        │                                                     │
        └─────────────────────────────────────────────────────┘
```

**Alasan:**
- RDS **WAJIB** punya subnet group dengan 2+ AZ
- High Availability: jika 1 AZ down, masih ada backup
- AWS requirement, bukan pilihan

**Jika hanya 1 AZ:**
```
❌ Error: DB Subnet Group doesn't meet availability zone coverage requirement.
   Current coverage: 1, required: 2
```

### Step B.5: VPC Endpoint untuk S3' (Mengapa Penting?)

```
TANPA VPC Endpoint:
Private Subnet ──► NAT Gateway ($32/bulan) ──► Internet ──► S3

DENGAN VPC Endpoint (Gateway):
Private Subnet ──► VPC Endpoint (GRATIS!) ──► S3
```

| Aspek | NAT Gateway | VPC Endpoint S3 |
|-------|-------------|-----------------|
| Biaya | ~$32/bulan | $0 |
| Data Transfer | $0.045/GB | $0 |
| Latency | Higher | Lower |
| Setup | Otomatis | Perlu enable |

> ✅ **Selalu gunakan VPC Endpoint untuk S3** - Gratis dan lebih cepat!

---

## Security Groups

### Bastion Host SG

Buat Security Group untuk Bastion Host:

1. EC2 Console → **Security Groups** → **Create security group**
2. Konfigurasi:

```
Name: finlapor-bastion-sg
VPC: finlapor-vpc-secure

Inbound Rules:
┌──────────┬──────────┬─────────────────┬─────────────────────┐
│ Type     │ Port     │ Source          │ Description         │
├──────────┼──────────┼─────────────────┼─────────────────────┤
│ SSH      │ 22       │ My IP           │ SSH from your IP    │
└──────────┴──────────┴─────────────────┴─────────────────────┘

Outbound Rules:
All traffic allowed (default)
```

### Backend SG (Private Subnet)

```
Name: finlapor-backend-private-sg
VPC: finlapor-vpc-secure

Inbound Rules:
┌──────────────┬──────────┬──────────────────────┬───────────────────┐
│ Type         │ Port     │ Source               │ Description       │
├──────────────┼──────────┼──────────────────────┼───────────────────┤
│ SSH          │ 22       │ finlapor-bastion-sg  │ SSH via Bastion   │
│ Custom TCP   │ 8080     │ 0.0.0.0/0            │ API (via API GW)  │
└──────────────┴──────────┴──────────────────────┴───────────────────┘
```

### RDS SG

```
Name: finlapor-rds-sg
VPC: finlapor-vpc-secure

Inbound Rules:
┌──────────────┬──────────┬────────────────────────────┬─────────────┐
│ Type         │ Port     │ Source                     │ Description │
├──────────────┼──────────┼────────────────────────────┼─────────────┤
│ PostgreSQL   │ 5432     │ finlapor-backend-private-sg│ From Backend│
└──────────────┴──────────┴────────────────────────────┴─────────────┘
```

---

## Troubleshooting

### RDS Error: Subnet group coverage

**Gejala:**
```
DB Subnet Group doesn't meet availability zone coverage requirement
```

**Penyebab:** VPC hanya punya subnet di 1 AZ.

**Solusi:** 
1. Buat subnet di AZ kedua
2. Atau buat ulang VPC dengan 2 AZ

### EC2 tidak bisa akses internet (Private Subnet)

**Gejala:** `yum install` atau `docker pull` timeout

**Penyebab:** Private Subnet tidak punya route ke internet.

**Solusi:**
- Gunakan NAT Gateway ($32/bulan), ATAU
- Transfer file via Bastion (lihat [06. EC2 Setup](./06-ec2-backend-setup.md))

### SSH timeout ke EC2 di Private Subnet

**Gejala:** SSH langsung ke private IP timeout

**Solusi:** SSH harus via Bastion Host:
```bash
ssh -J ec2-user@[BASTION_PUBLIC_IP] ec2-user@[BACKEND_PRIVATE_IP] -i key.pem
```

### VPC Endpoint S3 tidak bekerja

**Gejala:** S3 operations timeout dari private subnet

**Cek:**
1. VPC Console → Endpoints → Pastikan ada S3 Gateway
2. Route Tables → Private subnet route table harus include endpoint

**Solusi:**
```
# Di Route Table private subnet, pastikan ada:
Destination: pl-xxxxx (S3 prefix list)
Target: vpce-xxxxx (S3 endpoint)
```

---

## ✅ Checklist

### Opsi A (Public Only)
- [ ] VPC dibuat dengan 2 public subnets
- [ ] Internet Gateway attached
- [ ] Route table mengarah ke IGW

### Opsi B (Recommended)
- [ ] VPC dibuat dengan 2 AZ
- [ ] 2 Public Subnets (untuk Bastion, NAT jika perlu)
- [ ] 2 Private Subnets (untuk Backend, RDS)
- [ ] Internet Gateway untuk public subnets
- [ ] VPC Endpoint S3 (Gateway type)
- [ ] Security Groups: Bastion, Backend, RDS

---

## Next Step

Lanjut ke → [04. RDS Setup](./04-rds-setup.md)
