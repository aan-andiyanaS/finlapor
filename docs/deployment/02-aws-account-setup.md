# 🔐 AWS Account Setup

Konfigurasi AWS account, IAM user, dan AWS CLI untuk deployment FinLapor.

---

## 📑 Daftar Isi

1. [Membuat IAM User](#1-membuat-iam-user)
2. [Konfigurasi AWS CLI](#2-konfigurasi-aws-cli)
3. [Verifikasi Setup](#3-verifikasi-setup)
4. [Troubleshooting](#4-troubleshooting)

---

## 1. Membuat IAM User

### Mengapa IAM User?

| Aspek | Root Account | IAM User |
|-------|--------------|----------|
| **Akses** | Full access ke semua | Bisa dibatasi per service |
| **Keamanan** | ❌ Sangat bahaya jika bocor | ✅ Bisa dibatasi dan dirotasi |
| **Best Practice** | ❌ Jangan pakai untuk daily use | ✅ Recommended |
| **MFA** | Wajib enable | Wajib enable |

> **⚠️ PENTING:** JANGAN gunakan Root Account untuk deployment! Jika credentials bocor, seluruh akun AWS Anda bisa dikuasai.

### Step 1.1: Buka IAM Console

1. Login ke [AWS Console](https://console.aws.amazon.com)
2. Search "IAM" di search bar
3. Klik **IAM** (Identity and Access Management)

### Step 1.2: Create User

1. Sidebar → **Users** → **Create user**
2. User details:
   - **User name:** `finlapor-admin`
   - ✅ Provide user access to the AWS Management Console (opsional)
3. Klik **Next**

### Step 1.3: Attach Permissions

Pilih **Attach policies directly**, lalu centang:

| Policy | Fungsi |
|--------|--------|
| `AmazonEC2FullAccess` | Manage EC2 instances |
| `AmazonS3FullAccess` | Manage S3 buckets |
| `AWSLambda_FullAccess` | Deploy Lambda functions |
| `AmazonAPIGatewayAdministrator` | Setup API Gateway |
| `AmazonRDSFullAccess` | Manage RDS databases |
| `AmazonVPCFullAccess` | Configure VPC, subnets |
| `IAMFullAccess` | Manage IAM (untuk buat role Lambda) |

> **💡 Tips:** Untuk production, buat custom policy dengan permission minimal (Principle of Least Privilege).

### Step 1.4: Create Access Key

Setelah user dibuat:

1. Klik user `finlapor-admin`
2. Tab **Security credentials**
3. Scroll ke **Access keys** → **Create access key**
4. Use case: **Command Line Interface (CLI)**
5. ✅ Centang "I understand the above recommendation..."
6. Klik **Next** → **Create access key**
7. **SIMPAN dengan aman:**
   - Access Key ID: `AKIA...`
   - Secret Access Key: `...`

> **⚠️ PENTING:** Secret Access Key hanya ditampilkan SEKALI! Simpan di password manager atau tempat aman.

---

## 2. Konfigurasi AWS CLI

### Step 2.1: Configure Profile

```bash
aws configure
```

Masukkan:
```
AWS Access Key ID [None]: AKIAXXXXXXXXXXXXXXXXXX
AWS Secret Access Key [None]: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Default region name [None]: ap-southeast-1
Default output format [None]: json
```

### Step 2.2: Verifikasi Konfigurasi

```bash
# Cek file credentials
cat ~/.aws/credentials

# Output expected:
# [default]
# aws_access_key_id = AKIA...
# aws_secret_access_key = ...
```

### Step 2.3: Multiple Profiles (Opsional)

Jika punya beberapa AWS account:

```bash
# Buat profile khusus finlapor
aws configure --profile finlapor

# Gunakan profile saat menjalankan command
aws s3 ls --profile finlapor

# Atau set environment variable
export AWS_PROFILE=finlapor
```

---

## 3. Verifikasi Setup

### Test AWS CLI

```bash
# Cek identity
aws sts get-caller-identity

# Expected output:
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/finlapor-admin"
}
```

### Test Permission

```bash
# Test EC2 access
aws ec2 describe-regions --query "Regions[?RegionName=='ap-southeast-1']"

# Test S3 access
aws s3 ls

# Test VPC access
aws ec2 describe-vpcs
```

---

## 4. Troubleshooting

### Error: Unable to locate credentials

**Gejala:**
```
Unable to locate credentials. You can configure credentials by running "aws configure".
```

**Solusi:**
1. Jalankan `aws configure` dan masukkan credentials
2. Atau set environment variables:
   ```bash
   export AWS_ACCESS_KEY_ID=AKIA...
   export AWS_SECRET_ACCESS_KEY=...
   export AWS_DEFAULT_REGION=ap-southeast-1
   ```

### Error: Access Denied

**Gejala:**
```
An error occurred (AccessDenied) when calling the XXX operation
```

**Solusi:**
1. Buka IAM Console
2. Cek user `finlapor-admin` memiliki policy yang diperlukan
3. Pastikan policy sudah attach:
   - Buka user → Permissions
   - Klik "Add permissions" jika kurang

### Error: Invalid Access Key

**Gejala:**
```
The security token included in the request is invalid
```

**Solusi:**
1. Cek typo di credentials
2. Atau buat Access Key baru:
   - IAM → Users → finlapor-admin
   - Security credentials → Create access key
3. Update `~/.aws/credentials` dengan key baru

### Error: Region not found

**Gejala:**
```
Could not connect to the endpoint URL
```

**Solusi:**
```bash
# Set region yang benar
aws configure set region ap-southeast-1

# Atau gunakan flag --region
aws ec2 describe-instances --region ap-southeast-1
```

---

## 🔒 Best Practices Keamanan

1. **Enable MFA pada IAM User**
   - IAM → Users → finlapor-admin
   - Security credentials → Assign MFA device

2. **Rotate Access Keys secara berkala**
   - Minimal setiap 90 hari
   - Buat key baru sebelum delete yang lama

3. **Jangan commit credentials ke Git**
   - Tambahkan ke `.gitignore`:
     ```
     .aws/
     *.pem
     .env
     ```

4. **Gunakan IAM Roles untuk EC2**
   - Lebih aman dari hardcoded credentials
   - Akan dijelaskan di [EC2 Setup](./06-ec2-backend-setup.md)

---

## ✅ Checklist

- [ ] IAM user `finlapor-admin` dibuat
- [ ] Policies sudah di-attach
- [ ] Access Key ID dan Secret disimpan dengan aman
- [ ] AWS CLI configured (`aws configure`)
- [ ] `aws sts get-caller-identity` berhasil
- [ ] MFA enabled (recommended)

---

## Next Step

Lanjut ke → [03. VPC Setup](./03-vpc-setup.md)
