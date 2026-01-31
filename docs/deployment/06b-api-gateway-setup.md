# 🔀 Setup AWS API Gateway

Panduan lengkap membuat dan konfigurasi AWS API Gateway untuk menghubungkan frontend ke backend dan AI service.

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Kapan Butuh API Gateway?](#kapan-butuh-api-gateway)
3. [Create HTTP API](#1-create-http-api)
4. [Integrasi dengan EC2 Backend](#2-integrasi-dengan-ec2-backend)
5. [Integrasi dengan Lambda](#3-integrasi-dengan-lambda)
6. [Custom Domain](#4-custom-domain)
7. [CORS Configuration](#5-cors-configuration)
8. [Authentication](#6-authentication)
9. [Monitoring & Logging](#7-monitoring--logging)
10. [Troubleshooting](#8-troubleshooting)

---

## Overview

### Arsitektur dengan API Gateway

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLOUDFLARE                                       │
│  ┌────────────────┐                                                          │
│  │  finlapor.     │ (Frontend)                                               │
│  │  pages.dev     │                                                          │
│  └───────┬────────┘                                                          │
└──────────┼───────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              AWS                                              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        API Gateway                                    │    │
│  │                                                                       │    │
│  │  📍 api.finlapor.airi.click                                          │    │
│  │                                                                       │    │
│  │  ┌─────────────────────┐    ┌─────────────────────┐                  │    │
│  │  │   /api/*            │    │   /ai/*             │                  │    │
│  │  │   (Backend routes)  │    │   (AI routes)       │                  │    │
│  │  └─────────┬───────────┘    └─────────┬───────────┘                  │    │
│  └────────────┼──────────────────────────┼──────────────────────────────┘    │
│               │                          │                                    │
│               ▼                          ▼                                    │
│  ┌────────────────────┐     ┌─────────────────────────┐                      │
│  │   EC2 Backend      │     │     AWS Lambda          │                      │
│  │   (Go API)         │     │     (AI Service)        │                      │
│  │   :8080            │     │     finlapor-ai         │                      │
│  └────────────────────┘     └─────────────────────────┘                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Jenis API Gateway

| Tipe | Keterangan | Biaya | Use Case |
|------|-----------|-------|----------|
| **HTTP API** | Simple, low-latency | $1/juta requests | ✅ **Recommended** untuk FinLapor |
| **REST API** | Feature-rich | $3.5/juta requests | Enterprise dengan fitur advanced |
| **WebSocket API** | Real-time | $1/juta messages | Chat, gaming |

> **💡 Rekomendasi:** Gunakan **HTTP API** karena lebih murah dan cukup untuk kebutuhan FinLapor.

---

## Kapan Butuh API Gateway?

### Opsi A: Tanpa API Gateway (CloudFlare Proxy)

```
CloudFlare → EC2 langsung
```

**Kelebihan:**
- Simple setup
- Gratis (CloudFlare free tier)
- Sudah termasuk DDoS protection

**Kekurangan:**
- Tidak bisa routing ke multiple backends
- Throttling harus dihandle sendiri

### Opsi B: Dengan API Gateway

```
CloudFlare → API Gateway → EC2 / Lambda
```

**Kelebihan:**
- ✅ Unified endpoint untuk semua services
- ✅ Built-in throttling & rate limiting
- ✅ Mudah routing ke Lambda atau EC2
- ✅ Request/response transformation
- ✅ Authentication (JWT, API Key)

**Kekurangan:**
- Biaya tambahan (minimal ~$1/bulan untuk traffic rendah)

> **📌 Untuk UAS:** Opsi A sudah cukup. API Gateway untuk production skala besar.

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
Description: FinLapor Backend & AI API Gateway
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
> Format URL: `https://xxxxxx.execute-api.ap-southeast-1.amazonaws.com/`

5. Click **Next** → **Create**

### Step 1.5: Catat API Endpoint

Setelah dibuat, catat URL:
```
https://abc123xyz.execute-api.ap-southeast-1.amazonaws.com
```

---

## 2. Integrasi dengan EC2 Backend

### Step 2.1: Create Integration

1. API Gateway → Pilih **finlapor-api**
2. Sidebar: **Develop** → **Integrations**
3. Click **Create**

Konfigurasi:

```
Integration type: HTTP URI
Method: ANY
URL: http://[EC2_PRIVATE_IP]:8080/{proxy}
     atau
     http://[EC2_PUBLIC_IP]:8080/{proxy}

Connection type: Internet (jika EC2 punya public IP)
                 VPC Link (jika EC2 di private subnet)
```

> **⚠️ Important:** Jika EC2 di **Private Subnet**, Anda perlu buat VPC Link (lihat langkah 2.4)

4. Click **Create**

### Step 2.2: Create Route untuk Backend

1. Sidebar: **Routes**
2. Click **Create**
3. Konfigurasi:

```
Method: ANY
Path: /api/{proxy+}
```

> **📝 `{proxy+}` adalah greedy parameter yang menangkap semua sub-path:**
> - `/api/auth/login` → `{proxy}` = `auth/login`
> - `/api/transactions` → `{proxy}` = `transactions`

4. Click **Create**

### Step 2.3: Attach Integration ke Route

1. Click route `/api/{proxy+}`
2. **Attach integration** → Pilih integration yang dibuat
3. Click **Attach integration**

### Step 2.4: Setup VPC Link (Jika EC2 di Private Subnet)

Jika EC2 backend ada di **Private Subnet**, butuh VPC Link:

1. API Gateway → **VPC links** (sidebar bawah)
2. Click **Create**
3. Konfigurasi:

```
Name: finlapor-vpc-link
VPC: finlapor-vpc
Subnets: Pilih private subnets
Security groups: finlapor-backend-sg (atau yang mengizinkan traffic dari API Gateway)
```

4. Click **Create** → Tunggu status "Available" (~5 menit)

5. Update integration untuk menggunakan VPC Link:
   - Integrations → Edit
   - Connection type: **VPC Link**
   - VPC Link: **finlapor-vpc-link**
   - URL: `http://[EC2_PRIVATE_IP]:8080/{proxy}`

### Step 2.5: Test Route Backend

```bash
# Test health endpoint
curl https://abc123xyz.execute-api.ap-southeast-1.amazonaws.com/api/health

# Expected:
{
  "status": "ok",
  "service": "finlapor-backend",
  "version": "1.0.0"
}
```

---

## 3. Integrasi dengan Lambda

### Step 3.1: Create Lambda Integration

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

### Step 3.2: Create Routes untuk AI

Buat route untuk setiap AI endpoint:

| Route | Method | Purpose |
|-------|--------|---------|
| `/ai/health` | GET, POST | Status check |
| `/ai/chat` | POST | AI Chat assistant |
| `/ai/ocr` | POST | Receipt OCR |
| `/ai/categorize` | POST | Transaction categorization |
| `/ai/insight` | POST | Spending insights |

**Cara buat (ulangi untuk setiap route):**

1. Routes → **Create**
2. Method: **POST** (atau ANY)
3. Path: `/ai/chat`
4. Attach integration: **finlapor-ai Lambda**

**Atau buat catch-all route:**

```
Method: ANY
Path: /ai/{proxy+}
Integration: finlapor-ai Lambda
```

### Step 3.3: Test Lambda Route

```bash
# Test health
curl -X POST https://abc123xyz.execute-api.ap-southeast-1.amazonaws.com/ai/health \
  -H "Content-Type: application/json" \
  -d '{"action": "health"}'

# Expected:
{
  "statusCode": 200,
  "body": "{\"status\":\"ok\",\"service\":\"finlapor-ai\"...}"
}

# Test chat
curl -X POST https://abc123xyz.execute-api.ap-southeast-1.amazonaws.com/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"action": "chat", "message": "Halo", "user_age": 25}'
```

---

## 4. Custom Domain

### Step 4.1: Request Certificate di ACM

1. AWS Console → **Certificate Manager** (ACM)
2. Region: **us-east-1** (untuk API Gateway Edge) atau **ap-southeast-1** (untuk Regional)
3. Click **Request certificate** → **Request a public certificate**
4. Domain: `api.finlapor.airi.click`
5. Validation method: **DNS validation**
6. Click **Request**

### Step 4.2: DNS Validation

1. Setelah certificate dibuat, lihat **Domains** section
2. Click **Create records in Route 53** (otomatis) atau
3. Copy CNAME record ke DNS provider (CloudFlare):

```
Name: _abc123.api.finlapor
Type: CNAME
Value: _xyz789.acm-validations.aws.
```

4. Tunggu status certificate: **Issued** (~5-30 menit)

### Step 4.3: Setup Custom Domain di API Gateway

1. API Gateway → **Custom domain names** (sidebar)
2. Click **Create**
3. Konfigurasi:

```
Domain name: api.finlapor.airi.click
API mapping:
  - API: finlapor-api
  - Stage: $default
  - Path: (kosong)

Endpoint type: Regional
Certificate: Pilih certificate dari ACM
```

4. Click **Create**

### Step 4.4: Update DNS

Setelah domain dibuat, catat **API Gateway domain name**:
```
d-abc123xyz.execute-api.ap-southeast-1.amazonaws.com
```

Di CloudFlare DNS, buat CNAME record:

```
Type: CNAME
Name: api
Target: d-abc123xyz.execute-api.ap-southeast-1.amazonaws.com
Proxy status: Proxied (orange) atau DNS Only (gray)
```

> **💡 Tip:** Jika menggunakan CloudFlare Proxy (orange), SSL mode harus **Full** atau **Full (Strict)**.

### Step 4.5: Test Custom Domain

```bash
curl https://api.finlapor.airi.click/api/health
curl https://api.finlapor.airi.click/ai/health
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
# Test preflight request
curl -X OPTIONS https://api.finlapor.airi.click/api/auth/login \
  -H "Origin: https://finlapor.airi.click" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Lihat response headers:
# Access-Control-Allow-Origin: https://finlapor.airi.click
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## 6. Authentication

### Opsi A: JWT Authorizer (Recommended)

Gunakan JWT token dari backend untuk autentikasi.

1. API Gateway → **finlapor-api** → **Authorization** (sidebar)
2. Click **Create authorizer**
3. Konfigurasi:

```
Authorizer type: JWT
Name: finlapor-jwt-auth
Identity source: $request.header.Authorization
Issuer: https://api.finlapor.airi.click (atau URL backend Anda)
Audience: finlapor-app
```

4. Click **Create**

**Attach ke routes yang perlu auth:**
1. Routes → Pilih route (misal `/api/transactions`)
2. Authorization → Attach authorizer → **finlapor-jwt-auth**

### Opsi B: API Key

Untuk testing atau rate limiting per client:

1. API Gateway → **finlapor-api** → **API keys**
2. Create API key → Copy key
3. Routes → Pilih route → Settings → **API key required: true**

**Usage:**
```bash
curl https://api.finlapor.airi.click/api/health \
  -H "x-api-key: YOUR_API_KEY"
```

### Opsi C: IAM Authorization

Untuk service-to-service communication:

1. Routes → Authorization → **IAM**
2. Caller harus sign request dengan AWS SigV4

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
  "responseLatency": "$context.responseLatency",
  "integrationLatency": "$context.integrationLatency"
}
```

### Step 7.2: View Metrics

1. CloudWatch → Metrics → **ApiGateway**
2. Metrics yang berguna:
   - **Count** - Total requests
   - **Latency** - Response time
   - **4XXError** - Client errors
   - **5XXError** - Server errors

### Step 7.3: Create Alarms

```
Alarm: High Error Rate
Metric: 5XXError
Threshold: > 10 in 5 minutes
Action: SNS notification
```

---

## 8. Troubleshooting

### Error: 403 Forbidden

**Penyebab:**
- API key missing
- JWT invalid
- CORS blocking

**Solusi:**
```bash
# Cek apakah perlu API key
curl -H "x-api-key: YOUR_KEY" https://api.finlapor.airi.click/...

# Cek CORS headers di response
```

### Error: 502 Bad Gateway

**Penyebab:**
- Backend tidak merespon
- Lambda timeout
- VPC Link tidak configured

**Solusi:**
1. Cek backend running: `docker ps`
2. Cek Lambda logs di CloudWatch
3. Verify VPC Link status: "Available"

### Error: 504 Gateway Timeout

**Penyebab:**
- Backend terlalu lambat merespon
- Lambda timeout

**Solusi:**
1. API Gateway default timeout: 29 detik
2. Optimize backend/Lambda performance
3. Increase Lambda timeout (max 15 menit)

### CORS Error di Browser

**Penyebab:**
- Origin tidak ada di allow list
- Preflight (OPTIONS) gagal

**Solusi:**
1. Tambah origin ke CORS config
2. Pastikan OPTIONS method di-handle

### Request Body Kosong di Backend

**Penyebab:**
- Payload format version mismatch

**Solusi:**
- Untuk Lambda: Gunakan Payload format version 2.0
- Untuk HTTP integration: Pastikan Content-Type header forward

---

## Ringkasan Konfigurasi

| Komponen | Value |
|----------|-------|
| API Type | HTTP API |
| Endpoint | `https://api.finlapor.airi.click` |
| Backend Route | `ANY /api/{proxy+}` → EC2:8080 |
| AI Route | `ANY /ai/{proxy+}` → Lambda finlapor-ai |
| CORS | Enabled untuk frontend origins |
| Auth | JWT (recommended) atau API Key |

---

## Next Steps

Setelah API Gateway selesai dikonfigurasi:

- → [CloudFlare Setup](./08-cloudflare-setup.md) - Update frontend API URL
- → [Domain & SSL Setup](./09-domain-ssl-setup.md) - Custom domain
- → [Monitoring](./10-monitoring.md) - Setup alerts

---

> **📌 Tips:**
> - Gunakan **HTTP API** untuk menghemat biaya
> - Enable **access logging** untuk debugging
> - Set **throttling** untuk mencegah abuse
> - Test CORS dengan browser DevTools sebelum production
