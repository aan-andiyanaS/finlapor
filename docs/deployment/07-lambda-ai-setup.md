# 🤖 Setup AWS Lambda (AI Service)

Deploy Python AI service ke AWS Lambda untuk OCR dan chat functionality.

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Persiapan](#1-persiapan)
3. [Create Lambda Function](#2-create-lambda-function)
4. [Deploy Code](#3-deploy-code)
5. [Konfigurasi Function URL](#4-konfigurasi-function-url)
6. [Connect ke Backend](#5-connect-ke-backend)
7. [Troubleshooting](#6-troubleshooting)

---

## Overview

### Mengapa Lambda untuk AI?

| Aspek | AI di EC2 | AWS Lambda |
|-------|-----------|------------|
| **Biaya** | Bayar 24/7 | Pay per request |
| **Scaling** | Manual | ✅ Auto-scaling |
| **Cold Start** | Tidak ada | ⚠️ 1-3 detik |
| **Maintenance** | Manual | ✅ Managed |
| **Max Runtime** | Unlimited | 15 menit |
| **Memory** | EC2 limit | 128MB - 10GB |

**Kesimpulan:** Lambda cocok untuk AI inference yang bersifat on-demand.

### Arsitektur AI Service

```
Frontend ──► Backend (Go) ──► AWS Lambda ──► HuggingFace API
                                   │
                                   ├── OCR (Donut model)
                                   ├── Categorize (Classification)
                                   └── Chat (Mistral-7B)
```

---

## 1. Persiapan

### Step 1.1: Pastikan AI Service Ready

Cek folder `ai-service/`:
```bash
ls ai-service/
# handlers/
# lambda_function.py
# requirements.txt
```

### Step 1.2: HuggingFace Token

1. Login ke [huggingface.co](https://huggingface.co)
2. Profile → Settings → Access Tokens
3. Create new token (Read permission)
4. Copy token: `hf_xxxxxxxx`

---

## 2. Create Lambda Function

### Step 2.1: Buka Lambda Console

AWS Console → Search **Lambda** → Click

### Step 2.2: Create Function

1. Click **Create function**
2. Pilih **Author from scratch**
3. Konfigurasi:

```
Function name: finlapor-ai
Runtime: Python 3.11
Architecture: x86_64

Permissions:
  Execution role: Create a new role with basic Lambda permissions
```

4. Click **Create function**

### Step 2.3: Konfigurasi Umum

1. Tab **Configuration**
2. **General configuration** → Edit:

```
Memory: 512 MB (atau lebih untuk model besar)
Timeout: 30 seconds (OCR bisa lambat)
```

3. Save

### Step 2.4: Environment Variables

1. **Configuration** → **Environment variables** → Edit
2. Tambahkan:

| Key | Value | Keterangan |
|-----|-------|------------|
| `HF_TOKEN` | `hf_xxxxxxxx` | HuggingFace API token |
| `HF_API_URL` | `https://api-inference.huggingface.co` | HF Inference API |
| `LOG_LEVEL` | `INFO` | Logging level |

3. Save

---

## 3. Deploy Code

### Metode 1: Upload ZIP (Simple)

**Step 3.1: Buat deployment package di local:**

```bash
cd ai-service

# Create package directory
mkdir -p package

# Install dependencies
pip install -r requirements.txt -t package/

# Copy source code
cp lambda_function.py package/
cp -r handlers package/

# Create ZIP
cd package
zip -r ../deployment.zip .
cd ..
```

**Step 3.2: Upload ke Lambda:**

1. Lambda Console → Function `finlapor-ai`
2. **Code** tab
3. **Upload from** → **.zip file**
4. Upload `deployment.zip`
5. Save

### Metode 2: Container Image (Advanced)

Untuk dependencies besar, gunakan container:

**Dockerfile:**
```dockerfile
FROM public.ecr.aws/lambda/python:3.11

COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install -r requirements.txt

COPY lambda_function.py ${LAMBDA_TASK_ROOT}
COPY handlers/ ${LAMBDA_TASK_ROOT}/handlers/

CMD ["lambda_function.handler"]
```

**Build dan push ke ECR:**
```bash
# Login ke ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin [ACCOUNT_ID].dkr.ecr.ap-southeast-1.amazonaws.com

# Create repository
aws ecr create-repository --repository-name finlapor-ai

# Build
docker build -t finlapor-ai .

# Tag dan push
docker tag finlapor-ai:latest [ACCOUNT_ID].dkr.ecr.ap-southeast-1.amazonaws.com/finlapor-ai:latest
docker push [ACCOUNT_ID].dkr.ecr.ap-southeast-1.amazonaws.com/finlapor-ai:latest
```

---

## 4. Konfigurasi Function URL

Lambda Function URL memungkinkan akses langsung via HTTPS tanpa API Gateway.

### Step 4.1: Create Function URL

1. Lambda Console → Function `finlapor-ai`
2. **Configuration** → **Function URL**
3. Click **Create function URL**
4. Konfigurasi:

```
Auth type: NONE (untuk testing) atau IAM (production)
CORS:
  Allow origin: https://finlapor.airi.click, http://localhost:3000
  Allow methods: POST, OPTIONS
  Allow headers: content-type
```

5. Save

### Step 4.2: Copy Function URL

URL format: `https://xxxxxx.lambda-url.ap-southeast-1.on.aws/`

---

## 5. Connect ke Backend

### Step 5.1: Update Backend Environment

Di EC2, update `.env`:

```bash
# Lambda Function URL
LAMBDA_FUNCTION_URL=https://xxxxxx.lambda-url.ap-southeast-1.on.aws
```

### Step 5.2: Backend Code (Reference)

Backend akan call Lambda seperti ini:

```go
// internal/services/lambda.go
func (s *LambdaService) CallAI(ctx context.Context, action string, payload interface{}) ([]byte, error) {
    url := os.Getenv("LAMBDA_FUNCTION_URL")
    
    body, _ := json.Marshal(map[string]interface{}{
        "action":  action,
        "payload": payload,
    })
    
    resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
    // ...
}
```

### Step 5.3: Test Endpoint

```bash
# Test OCR
curl -X POST https://xxxxxx.lambda-url.ap-southeast-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"action": "health"}'

# Expected:
{"status": "ok", "message": "AI Service is running"}
```

---

## 6. Troubleshooting

### Error: Task timed out

**Gejala:**
```
Task timed out after 3.00 seconds
```

**Solusi:**
1. Lambda Console → Configuration → General configuration
2. Increase timeout (coba 30s atau 60s)
3. Untuk model besar, tingkatkan memory juga

### Error: Module not found

**Gejala:**
```
Unable to import module 'lambda_function': No module named 'xxx'
```

**Solusi:**
1. Pastikan semua dependencies ada di `requirements.txt`
2. Rebuild deployment package
3. Reupload ZIP

### Error: Out of memory

**Gejala:**
```
Runtime exited with error: signal: killed
```

**Solusi:**
1. Lambda Console → Configuration → General configuration
2. Increase memory (coba 1024 MB atau lebih)

### Error: HuggingFace rate limit

**Gejala:**
```
Rate limit reached
```

**Solusi:**
1. Upgrade HuggingFace plan (Pro)
2. Atau implement caching di backend
3. Atau reduce request frequency

### CORS Error

**Gejala:**
```
Access-Control-Allow-Origin header missing
```

**Solusi:**
1. Lambda console → Function URL → CORS configuration
2. Pastikan Allow Origin include frontend domain
3. Atau handle CORS di Lambda code:

```python
def handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps(result)
    }
```

### Cold Start lambat

**Gejala:** Response pertama lambat (5-10 detik)

**Mitigasi:**
1. Provisioned Concurrency (berbayar)
2. Atau keep Lambda warm dengan scheduled event
3. Atau reduce package size

---

## Advanced: API Gateway (Opsional)

Untuk production dengan rate limiting dan auth:

### Step: Create HTTP API

1. API Gateway Console → **Create API**
2. Pilih **HTTP API**
3. Integrations: **Add integration** → Lambda
4. Function: `finlapor-ai`
5. Create

### Benefits API Gateway:
- Rate limiting
- API Keys
- Usage plans
- Custom domain
- Request/Response transformation

---

## ✅ Checklist

- [ ] Lambda function `finlapor-ai` dibuat
- [ ] Python 3.11 runtime
- [ ] Memory: 512 MB+
- [ ] Timeout: 30 seconds+
- [ ] HF_TOKEN environment variable set
- [ ] Code deployed (ZIP atau Container)
- [ ] Function URL created
- [ ] CORS configured
- [ ] Test endpoint working
- [ ] Backend .env updated dengan Lambda URL

---

## Next Step

Lanjut ke → [08. CloudFlare Setup](./08-cloudflare-setup.md)
