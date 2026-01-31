# 🔀 Setup AWS API Gateway

Panduan membuat API Gateway untuk menghubungkan **CloudFlare Pages** ke **Backend di Private Subnet**.

> **📌 Penting:** API Gateway ini **hanya** untuk akses ke Backend. Lambda dipanggil langsung dari Backend via AWS SDK.

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Pilih Arsitektur](#-pilih-arsitektur)
   - [Opsi A: API Gateway → Backend + Lambda](#opsi-a-api-gateway--backend--lambda)
   - [Opsi B: API Gateway → Backend saja](#opsi-b-api-gateway--backend-saja-recommended)
3. [Perbandingan](#perbandingan)
4. [Panduan Setup Opsi A](#panduan-setup-opsi-a-backend--lambda)
5. [Panduan Setup Opsi B](#panduan-setup-opsi-b-backend-saja)
6. [Create HTTP API](#1-create-http-api)
7. [Setup NLB](#2-setup-nlb-network-load-balancer)
8. [VPC Link Setup](#3-vpc-link-setup)
9. [Integrasi dengan Backend](#4-integrasi-dengan-backend)
10. [Custom Domain](#5-custom-domain)
11. [CORS Configuration](#6-cors-configuration)
12. [Authentication](#7-authentication)
13. [Monitoring & Logging](#8-monitoring--logging)
14. [Troubleshooting](#9-troubleshooting)

---

## Overview

Backend di **Private Subnet** BUTUH "entry point" untuk bisa diakses dari internet. Pilihannya:

| Metode | Biaya | Keterangan |
|--------|-------|------------|
| **API Gateway + VPC Link** | ~$1-3/bulan | ✅ Recommended |
| Application Load Balancer | ~$16/bulan | Mahal |
| CloudFlare Tunnel | $0 | Perlu install agent |

---

## 🎯 Pilih Arsitektur

### Opsi A: API Gateway → Backend + Lambda

Frontend bisa akses Backend **dan** Lambda langsung via API Gateway.

```mermaid
flowchart TB
    subgraph CloudFlare["☁️ CloudFlare"]
        Frontend["📱 Frontend"]
    end

    subgraph AWS["🔶 AWS"]
        APIGateway["🔀 API Gateway"]
        
        subgraph VPC["🌐 VPC - Private Subnet"]
            Backend["🐳 Backend<br/>Docker + Go"]
        end
        
        Lambda["⚡ Lambda<br/>AI Service"]
    end

    Frontend -->|/api/*| APIGateway
    Frontend -->|/ai/*| APIGateway
    APIGateway -->|VPC Link| Backend
    APIGateway -->|Direct| Lambda
```

| Route | Target |
|-------|--------|
| `/api/*` | Backend (via VPC Link) |
| `/ai/*` | Lambda (langsung) |

**Keuntungan:**
- ✅ Frontend bisa akses Lambda tanpa melalui Backend
- ✅ Latency lebih rendah untuk AI calls
- ✅ Backend tidak perlu VPC Endpoint Lambda

**Kekurangan:**
- ⚠️ Setup lebih kompleks (2 integrations)

---

### Opsi B: API Gateway → Backend saja (Recommended)

API Gateway hanya ke Backend. Lambda dipanggil dari Backend via AWS SDK.

```mermaid
flowchart TB
    subgraph CloudFlare["☁️ CloudFlare"]
        Frontend["📱 Frontend"]
    end

    subgraph AWS["🔶 AWS"]
        APIGateway["🔀 API Gateway"]
        
        subgraph VPC["🌐 VPC - Private Subnet"]
            Backend["🐳 Backend<br/>Docker + Go"]
            VPCEndpoint["VPC Endpoint"]
        end
        
        Lambda["⚡ Lambda<br/>AI Service"]
    end

    Frontend -->|/api/*| APIGateway
    APIGateway -->|VPC Link| Backend
    Backend -->|AWS SDK| VPCEndpoint
    VPCEndpoint --> Lambda
```

| Route | Target |
|-------|--------|
| `/api/*` | Backend (via VPC Link) |
| AI calls | Backend → Lambda (AWS SDK) |

**Keuntungan:**
- ✅ Setup lebih simple (1 integration)
- ✅ Auth terpusat di Backend
- ✅ Logging terpusat

**Kekurangan:**
- ⚠️ Butuh VPC Endpoint untuk Lambda (~$7.5/bulan)

---

## Perbandingan

| Aspek | Opsi A (Backend + Lambda) | Opsi B (Backend saja) |
|-------|--------------------------|----------------------|
| **API Gateway routes** | 2 (Backend + Lambda) | 1 (Backend) |
| **Lambda access** | Via API Gateway | Via AWS SDK |
| **VPC Endpoint Lambda** | ❌ Tidak perlu | ✅ Diperlukan |
| **Setup** | Lebih kompleks | Lebih simple |
| **Biaya** | API GW ~$1-3 | API GW + VPC Endpoint ~$9 |
| **Latency AI** | Lebih rendah | Sedikit lebih tinggi |

> **💡 Rekomendasi:** Gunakan **Opsi B** untuk setup lebih sederhana dan auth terpusat.

---

## Panduan Setup Opsi A (Backend + Lambda)

Setup Opsi A **sama dengan Opsi B**, tapi dengan langkah tambahan untuk Lambda integration.

### Langkah yang Sama:
1. Create HTTP API ✅
2. Setup VPC Link ✅
3. Create Backend integration ✅
4. Create route `/api/{proxy+}` ✅
5. Custom domain ✅
6. CORS ✅

### Langkah Tambahan untuk Opsi A:

#### Tambah Lambda Integration

1. API Gateway → **finlapor-api** → **Integrations**
2. Click **Create**
3. Konfigurasi:

```
Integration type: AWS Lambda
AWS Region: ap-southeast-1
Lambda function: finlapor-ai
Payload format version: 2.0
```

4. Click **Create**

> **📝 Note:** API Gateway akan otomatis request permission untuk invoke Lambda.

#### Tambah Route untuk AI

1. Routes → **Create**
2. Konfigurasi:

```
Method: ANY
Path: /ai/{proxy+}
```

3. Attach integration: **finlapor-ai Lambda**

#### Test Lambda Route

```bash
# Test health
curl -X POST https://api.finlapor.airi.click/ai/health \
  -H "Content-Type: application/json" \
  -d '{"action": "health"}'

# Test chat
curl -X POST https://api.finlapor.airi.click/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"action": "chat", "message": "Halo", "user_age": 25}'
```

---

## Panduan Setup Opsi B (Backend saja)

Panduan ini menggunakan **Opsi B** (API Gateway ke Backend saja).

---

## 1. Create HTTP API

### Step 1.1: Buka API Gateway Console

1. AWS Console → Search **API Gateway** → Click
2. Pilih region: `ap-southeast-1` (Singapore)

### Step 1.2: Create API

1. Click **Create API**
2. Pilih **HTTP API** → **Build**
3. Konfigurasi:

```
API name: finlapor-api
Description: FinLapor Backend API Gateway
```

4. Click **Next**

### Step 1.3: Skip Routes (untuk sekarang)

Click **Next** (kita akan add routes nanti)

### Step 1.4: Configure Stages

```
Stage name: $default
Auto-deploy: ✅ Enable
```

> **📝 Note:** Stage `$default` berarti tidak ada prefix di URL.

5. Click **Next** → **Create**

### Step 1.5: Catat API Endpoint

Setelah dibuat, catat URL:
```
https://abc123xyz.execute-api.ap-southeast-1.amazonaws.com
```

---

## 2. Setup NLB (Network Load Balancer)

> **⚠️ Penting:** HTTP API VPC Link membutuhkan **ALB/NLB** atau **Cloud Map**. Tidak bisa langsung ke EC2!

Kita akan buat **NLB** (lebih murah dari ALB, ~$6/bulan).

### Step 2.1: Create Target Group

1. EC2 Console → **Target Groups** (sidebar bawah)
2. Click **Create target group**
3. Konfigurasi:

```
Target type: Instances
Target group name: finlapor-backend-tg
Protocol: TCP
Port: 8080
VPC: finlapor-vpc
Health check protocol: HTTP
Health check path: /api/health
```

4. Click **Next**
5. Register targets:
   - Pilih EC2 backend instance
   - Port: 8080
   - Click **Include as pending below**
6. Click **Create target group**

### Step 2.2: Create NLB

1. EC2 Console → **Load Balancers** → **Create Load Balancer**
2. Pilih **Network Load Balancer** → **Create**
3. Konfigurasi:

```
Load balancer name: finlapor-nlb
Scheme: Internal  ← PENTING! Karena di Private Subnet
IP address type: IPv4

Network mapping:
  VPC: finlapor-vpc
  Availability Zones: 
    - ap-southeast-1a → Private Subnet
    - ap-southeast-1b → Private Subnet
```

4. **Listeners and routing**:

```
Protocol: TCP
Port: 80
Default action: Forward to → finlapor-backend-tg
```

5. Click **Create load balancer**
6. Tunggu status: **Active** (~2-3 menit)
7. **Catat DNS name NLB**:
```
finlapor-nlb-xxxx.elb.ap-southeast-1.amazonaws.com
```

---

## 3. VPC Link Setup

### Step 3.1: Create VPC Link

1. API Gateway Console → **VPC links** (sidebar)
2. Click **Create**
3. Pilih **VPC link for HTTP APIs**
4. Konfigurasi:

```
Name: finlapor-vpc-link
VPC: finlapor-vpc
Subnets: 
  - Private Subnet AZ-a
  - Private Subnet AZ-b
Security groups: default atau buat baru
```

5. Click **Create**
6. Tunggu status: **Available** (~3-5 menit)

---

## 4. Integrasi dengan Backend

### Step 4.1: Create Integration

1. API Gateway → **finlapor-api** → **Integrations**
2. Click **Create**
3. Konfigurasi:

**Integration target:**
```
Integration type: Private resource
```

**Integration details:**
```
Selection method: Select manually
Target service: ALB/NLB  ← Pilih ini!
Load balancer: finlapor-nlb
Listener: 80 (TCP)
```

**VPC link:**
```
VPC link: finlapor-vpc-link
```

4. Click **Create**

### Step 4.2: Create Route

1. Sidebar: **Routes** → **Create**
2. Konfigurasi:

```
Method: ANY
Path: /api/{proxy+}
```

3. Click **Create**

### Step 4.3: Attach Integration ke Route

1. Click route `/api/{proxy+}`
2. **Attach integration** → Pilih integration NLB
3. Click **Attach integration**

### Step 4.4: Test

```bash
curl https://[API_GATEWAY_URL]/api/health

# Expected:
{
  "status": "ok",
  "service": "finlapor-backend"
}
```

---

## 5. Custom Domain

### Step 4.1: Request Certificate di ACM

1. AWS Console → **Certificate Manager** (ACM)
2. Region: **ap-southeast-1**
3. Click **Request certificate** → **Request a public certificate**
4. Domain: `api.finlapor.airi.click`
5. Validation method: **DNS validation**
6. Click **Request**

### Step 4.2: DNS Validation

1. Lihat **Domains** section pada certificate
2. Copy CNAME record ke CloudFlare DNS:

```
Name: _abc123.api.finlapor
Type: CNAME
Value: _xyz789.acm-validations.aws.
```

3. Tunggu status certificate: **Issued** (~5-30 menit)

### Step 4.3: Setup Custom Domain di API Gateway

1. API Gateway → **Custom domain names** (sidebar)
2. Click **Create**
3. Konfigurasi:

```
Domain name: api.finlapor.airi.click
Endpoint type: Regional
Certificate: Pilih certificate dari ACM

API mapping:
  - API: finlapor-api
  - Stage: $default
  - Path: (kosong)
```

4. Click **Create**

### Step 4.4: Update DNS di CloudFlare

Setelah domain dibuat, catat **API Gateway domain name**:
```
d-abc123xyz.execute-api.ap-southeast-1.amazonaws.com
```

Di CloudFlare DNS, buat CNAME record:

```
Type: CNAME
Name: api
Target: d-abc123xyz.execute-api.ap-southeast-1.amazonaws.com
Proxy status: DNS Only (gray cloud) ← PENTING!
```

> **⚠️ Penting:** Gunakan **DNS Only** (gray cloud), bukan Proxied, karena AWS ACM sudah handle SSL.

### Step 4.5: Test Custom Domain

```bash
curl https://api.finlapor.airi.click/api/health
```

---

## 5. CORS Configuration

### Step 5.1: Enable CORS

1. API Gateway → **finlapor-api** → **CORS** (sidebar)
2. Click **Configure**
3. Konfigurasi:

```
Access-Control-Allow-Origin:
  - https://finlapor.pages.dev
  - https://finlapor.airi.click
  - http://localhost:3000

Access-Control-Allow-Headers:
  - content-type
  - authorization
  - x-requested-with

Access-Control-Allow-Methods:
  - GET
  - POST
  - PUT
  - DELETE
  - OPTIONS

Access-Control-Max-Age: 300

Access-Control-Allow-Credentials: true
```

4. Click **Save**

### Step 5.2: Verify CORS

```bash
curl -X OPTIONS https://api.finlapor.airi.click/api/auth/login \
  -H "Origin: https://finlapor.airi.click" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Lihat response headers:
# Access-Control-Allow-Origin: https://finlapor.airi.click
```

---

## 6. Authentication

### Opsi: Pass-through ke Backend

Untuk FinLapor, autentikasi dihandle oleh **Backend** (JWT):

1. Frontend kirim `Authorization: Bearer <token>` header
2. API Gateway forward header ke Backend
3. Backend validate JWT

**Tidak perlu setup authorizer di API Gateway** - cukup pastikan header di-forward.

### Verifikasi Header Forward

```bash
# Test dengan token
curl https://api.finlapor.airi.click/api/transactions \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 7. Monitoring & Logging

### Step 7.1: Enable Access Logging

1. API Gateway → **finlapor-api** → **Stages**
2. Click **$default**
3. **Logs and tracing** → Edit
4. Enable **Access logging**
5. Destination ARN: Buat CloudWatch log group

```
Log group: /aws/apigateway/finlapor-api
```

6. Log format (JSON):
```json
{
  "requestId": "$context.requestId",
  "ip": "$context.identity.sourceIp",
  "requestTime": "$context.requestTime",
  "httpMethod": "$context.httpMethod",
  "path": "$context.path",
  "status": "$context.status",
  "responseLatency": "$context.responseLatency"
}
```

### Step 7.2: View Metrics

CloudWatch → Metrics → **ApiGateway**:
- **Count** - Total requests
- **Latency** - Response time
- **4XXError** - Client errors
- **5XXError** - Server errors

---

## 8. Troubleshooting

### Error: 502 Bad Gateway

**Penyebab:**
- VPC Link tidak configured dengan benar
- Backend tidak running
- Security Group blocking traffic

**Solusi:**
1. Cek VPC Link status: Harus **Available**
2. SSH ke EC2 via Bastion, cek: `docker ps`
3. Verify Security Group inbound rules

### Error: 504 Gateway Timeout

**Penyebab:**
- Backend terlalu lambat merespon
- Network connectivity issue

**Solusi:**
1. API Gateway default timeout: 29 detik
2. Check Backend logs: `docker logs finlapor-backend`
3. Verify VPC Link subnets match EC2 subnet

### CORS Error di Browser

**Penyebab:**
- Origin tidak ada di allow list
- Preflight (OPTIONS) gagal

**Solusi:**
1. Tambah origin ke CORS config
2. Verify dengan `curl -X OPTIONS`

### Error: 403 Forbidden

**Penyebab:**
- Route tidak match
- Integration tidak attached

**Solusi:**
1. Check Routes → pastikan `/api/{proxy+}` ada
2. Verify integration attached ke route

---

## Ringkasan Konfigurasi

| Komponen | Value |
|----------|-------|
| API Type | HTTP API |
| Endpoint | `https://api.finlapor.airi.click` |
| Route | `ANY /api/{proxy+}` → Backend:8080 |
| VPC Link | Required (Private Subnet) |
| CORS | Enabled untuk frontend origins |
| Auth | Pass-through ke Backend (JWT) |

---

## Koneksi Backend → Lambda

> **📖 Untuk setup koneksi Backend ke Lambda**, lihat:
> 
> **[07-lambda-ai-setup.md](./07-lambda-ai-setup.md)** - Section 5 & 6:
> - Setup VPC Endpoint untuk Lambda
> - Backend environment variables
> - AWS SDK configuration

Lambda **TIDAK** menggunakan API Gateway. Backend memanggil Lambda langsung via AWS SDK.

---

## Next Steps

Setelah API Gateway selesai:

- → [CloudFlare Setup](./08-cloudflare-setup.md) - Update `NEXT_PUBLIC_API_URL`
- → [Domain & SSL Setup](./09-domain-ssl-setup.md) - Custom domain
- → [Monitoring](./10-monitoring.md) - Setup alerts

---

> **📌 Tips:**
> - Gunakan **HTTP API** untuk menghemat biaya (~$1/juta requests)
> - VPC Link **WAJIB** untuk Private Subnet
> - Enable **access logging** untuk debugging
> - Lambda dipanggil dari Backend, bukan dari API Gateway
