# 📁 Setup AWS S3 (Object Storage)

Konfigurasi AWS S3 bucket untuk menyimpan file (foto struk, laporan PDF, dll).

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Membuat S3 Bucket](#1-membuat-s3-bucket)
3. [Konfigurasi CORS](#2-konfigurasi-cors)
4. [IAM User untuk S3](#3-iam-user-untuk-s3)
5. [Environment Variables](#4-environment-variables)
6. [Troubleshooting](#5-troubleshooting)

---

## Overview

### Mengapa S3?

| Aspek | Local Storage (EC2) | AWS S3 |
|-------|---------------------|--------|
| **Persistensi** | ❌ Hilang jika EC2 terminate | ✅ Persisten forever |
| **Scalability** | Limited by disk | ✅ Unlimited |
| **Cost** | Termasuk EC2 | ~$0.023/GB/bulan |
| **Backup** | Manual | ✅ 99.999999999% durability |
| **CDN Ready** | Manual setup | ✅ CloudFront compatible |
| **Access Control** | File permissions | ✅ IAM policies, presigned URLs |

**Kesimpulan:** Selalu gunakan S3 untuk file storage di production.

---

## 1. Membuat S3 Bucket

### Step 1.1: Buka S3 Console

AWS Console → Search **S3** → Click

### Step 1.2: Create Bucket

1. Click **Create bucket**
2. Konfigurasi:

```
┌────────────────────────────────────────────────────────────────┐
│ Bucket Configuration                                           │
├────────────────────────────────────────────────────────────────┤
│ Bucket name: finlapor-storage-[RANDOM]                         │
│   Contoh: finlapor-storage-abc123                              │
│   (Nama harus UNIK secara global!)                             │
│                                                                │
│ AWS Region: Asia Pacific (Singapore) ap-southeast-1            │
│                                                                │
│ Object Ownership: ACLs disabled (recommended)                  │
└────────────────────────────────────────────────────────────────┘
```

> **📝 Tips:** Tambahkan random string karena nama bucket harus unik di seluruh AWS.

### Step 1.3: Block Public Access Settings

```
┌────────────────────────────────────────────────────────────────┐
│ Block Public Access settings                                   │
├────────────────────────────────────────────────────────────────┤
│ ☑ Block all public access   ← BIARKAN TERCENTANG!              │
│                                                                │
│   ☑ Block public access to buckets and objects                 │
│     granted through new access control lists (ACLs)            │
│   ☑ Block public access to buckets and objects                 │
│     granted through any access control lists (ACLs)            │
│   ☑ Block public access to buckets and objects                 │
│     granted through new public bucket or access point policies │
│   ☑ Block public access to buckets and objects                 │
│     granted through any public bucket or access point policies │
└────────────────────────────────────────────────────────────────┘
```

> **⚠️ PENTING:** Jangan uncheck! File akan diakses via presigned URLs dari backend, bukan akses publik langsung.

### Step 1.4: Bucket Versioning (Opsional)

```
Bucket Versioning: Disable (untuk demo)
                   Enable (untuk production - bisa recover deleted files)
```

### Step 1.5: Default Encryption

```
Server-side encryption: Enable
Encryption type: SSE-S3 (Server-side encryption with Amazon S3 managed keys)
```

### Step 1.6: Create Bucket

Click **Create bucket**

---

## 2. Konfigurasi CORS

CORS diperlukan agar frontend bisa upload langsung ke S3 (jika menggunakan presigned URLs).

### Step 2.1: Buka Bucket Settings

1. S3 Console → Click bucket name
2. Tab **Permissions**
3. Scroll ke **Cross-origin resource sharing (CORS)**
4. Click **Edit**

### Step 2.2: Tambahkan CORS Configuration

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://finlapor.pages.dev",
            "https://finlapor.airi.click",
            "http://localhost:3000"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-meta-custom-header"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

> **📝 Note:** Update `AllowedOrigins` dengan domain frontend Anda yang sebenarnya.

### Step 2.3: Save Changes

Click **Save changes**

---

## 3. IAM User untuk S3

Buat IAM user khusus dengan akses terbatas hanya ke bucket ini.

### Step 3.1: Create IAM User

1. IAM Console → **Users** → **Create user**
2. User name: `finlapor-s3-user`
3. Click **Next**

### Step 3.2: Create Custom Policy

1. Click **Create policy** (opens new tab)
2. Tab **JSON**
3. Paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowS3BucketAccess",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::finlapor-storage-abc123",
                "arn:aws:s3:::finlapor-storage-abc123/*"
            ]
        }
    ]
}
```

> **⚠️ PENTING:** Ganti `finlapor-storage-abc123` dengan nama bucket Anda.

4. Policy name: `FinLaporS3Policy`
5. Click **Create policy**

### Step 3.3: Attach Policy to User

1. Kembali ke tab create user
2. Refresh policies
3. Search dan centang `FinLaporS3Policy`
4. Click **Next** → **Create user**

### Step 3.4: Create Access Key

1. Click user `finlapor-s3-user`
2. Tab **Security credentials**
3. **Access keys** → **Create access key**
4. Use case: **Application running outside AWS**
5. Click **Next** → **Create access key**
6. **SIMPAN:**
   - Access Key ID: `AKIA...`
   - Secret Access Key: `...`

---

## 4. Environment Variables

Update `.env` di EC2 backend:

```bash
# File: ~/finlapor/backend/.env

# S3 Configuration
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
S3_ACCESS_KEY=AKIAXXXXXXXXXXXXXXXXXX
S3_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
S3_BUCKET=finlapor-storage-abc123
S3_REGION=ap-southeast-1
```

---

## 5. Troubleshooting

### Error: Access Denied

**Gejala:**
```
AccessDenied: Access Denied
```

**Penyebab & Solusi:**

| Penyebab | Solusi |
|----------|--------|
| IAM policy salah | Periksa ARN bucket di policy |
| Credentials salah | Cek Access Key ID dan Secret |
| Bucket name salah | Verifikasi nama bucket di config |
| Policy belum attach | Attach policy ke user |

**Debug:**
```bash
# Test dengan AWS CLI
aws s3 ls s3://finlapor-storage-abc123 --profile finlapor-s3

# Jika error, cek credentials
aws configure list --profile finlapor-s3
```

### Error: CORS

**Gejala (di browser console):**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solusi:**
1. Periksa CORS configuration di bucket
2. Pastikan `AllowedOrigins` include domain frontend
3. Clear browser cache dan retry

### Error: Bucket not found

**Gejala:**
```
NoSuchBucket: The specified bucket does not exist
```

**Solusi:**
1. Verifikasi nama bucket (case-sensitive!)
2. Verifikasi region (bucket ada di ap-southeast-1?)
3. Check di S3 Console apakah bucket ada

### Error: SignatureDoesNotMatch

**Gejala:**
```
SignatureDoesNotMatch: The request signature we calculated does not match
```

**Penyebab:** Secret Access Key salah

**Solusi:**
1. Generate Access Key baru di IAM
2. Update di `.env`
3. Restart backend

### Error: File tidak bisa diakses

**Gejala:** Upload sukses tapi tidak bisa view/download

**Penjelasan:** Bucket dengan `Block Public Access: On` memang tidak bisa diakses langsung via URL publik.

**Solusi yang benar:** Gunakan **presigned URLs**

Backend code (Go):
```go
// Generate presigned URL untuk download
presignedURL, _ := s3Client.Presign(ctx, &s3.GetObjectInput{
    Bucket: aws.String(bucket),
    Key:    aws.String(key),
}, s3.WithPresignExpires(15*time.Minute))
```

Frontend menampilkan image via presigned URL ini.

### Error: Bucket name already exists

**Gejala:**
```
BucketAlreadyExists: The requested bucket name is not available
```

**Solusi:** Bucket names harus unik secara global. Tambahkan random string:
- `finlapor-storage-abc123`
- `finlapor-storage-2024jan`
- `finlapor-storage-[your-aws-account-id]`

---

## Test Upload

### Via AWS CLI

```bash
# Upload test file
echo "Hello FinLapor" > test.txt
aws s3 cp test.txt s3://finlapor-storage-abc123/test.txt

# Verify
aws s3 ls s3://finlapor-storage-abc123/

# Delete test
aws s3 rm s3://finlapor-storage-abc123/test.txt
```

### Via Backend API

Setelah backend running, test upload:
```bash
curl -X POST http://localhost:8080/api/upload \
  -H "Authorization: Bearer [TOKEN]" \
  -F "file=@receipt.jpg"
```

---

## ✅ Checklist

- [ ] S3 bucket dibuat dengan nama unik
- [ ] Block Public Access: Enabled (semua tercentang)
- [ ] CORS configuration sudah ditambahkan
- [ ] IAM user `finlapor-s3-user` dibuat
- [ ] Custom policy dengan akses terbatas ke bucket
- [ ] Access Key ID dan Secret Key disimpan
- [ ] Environment variables sudah di-set di backend
- [ ] Test upload via CLI berhasil

---

## Next Step

Lanjut ke → [06. EC2 Backend Setup](./06-ec2-backend-setup.md)
