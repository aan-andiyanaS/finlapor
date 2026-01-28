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
                                   ├── health   (Status check)
                                   ├── ocr      (Donut model)
                                   ├── chat     (Qwen-72B + Age personalization)
                                   ├── categorize (BART zero-shot)
                                   └── insight  (Spending analysis)
```

### Available Actions

| Action | Description | Input | Output |
|--------|-------------|-------|--------|
| `health` | Status check | - | Service info, model names |
| `ocr` | Extract text from receipt | `image_url` atau `image_base64` | Vendor, date, items, total |
| `chat` | Financial assistant | `message`, `context`, `user_age` | Reply, suggestions |
| `categorize` | Auto-categorize transaction | `description` | Category, confidence |
| `insight` | Spending insights | `transactions` array | Insights, summary |

---

## 1. Persiapan

### Step 1.1: Pastikan AI Service Ready

Cek folder `ai-service/`:
```bash
ls ai-service/
# lambda_function.py   ← Main handler
# requirements.txt     ← Dependencies
# README.md
# serverless.yml       ← Serverless Framework config (optional)
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
| `HF_LLM_MODEL` | `Qwen/Qwen2.5-72B-Instruct` | Model untuk chat |
| `HF_OCR_MODEL` | `naver-clova-ix/donut-base-finetuned-cord-v2` | Model untuk OCR |

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

# Copy source code (hanya lambda_function.py, tidak ada folder handlers)
cp lambda_function.py package/

# Create ZIP
cd package
zip -r ../deployment.zip .
cd ..

# Hasil: deployment.zip (~1 MB karena hanya requests library)
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

CMD ["lambda_function.lambda_handler"]
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

Backend menggunakan **AWS SDK** untuk memanggil Lambda secara langsung (bukan via Function URL).

### Step 5.1: Buat IAM User untuk Lambda Invoke

1. AWS Console → **IAM** → **Users** → **Create user**
2. User name: `finlapor-lambda-invoker`
3. **Attach policies directly** → Create inline policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "lambda:InvokeFunction",
            "Resource": "arn:aws:lambda:ap-southeast-1:*:function:finlapor-ai"
        }
    ]
}
```

4. **Create user** → **Create access key** → **Application running on AWS EC2**
5. Copy **Access Key ID** dan **Secret Access Key**

### Step 5.2: Update Backend Environment

Di EC2, update `backend/.env`:

```bash
# Lambda Configuration (AWS SDK method)
LAMBDA_FUNCTION_NAME=finlapor-ai
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=AKIA...        # dari Step 5.1
AWS_SECRET_ACCESS_KEY=xxxxx...   # dari Step 5.1
```

### Step 5.3: Cara Kerja (Reference)

Backend menggunakan AWS SDK untuk invoke Lambda:

```go
// internal/services/lambda.go
func (s *LambdaService) Invoke(ctx context.Context, req *LambdaRequest) (*LambdaResponse, error) {
    result, err := s.client.Invoke(ctx, &lambda.InvokeInput{
        FunctionName: aws.String(s.functionName),  // "finlapor-ai"
        Payload:      payload,
    })
    // ...
}
```

> **📝 Note:** Function URL tetap berguna untuk testing via curl/Postman, 
> tapi backend production menggunakan AWS SDK karena lebih cepat dan aman.

### Step 5.4: Test Endpoints (via Function URL)

```bash
# 1. Test Health
curl -X POST https://xxxxxx.lambda-url.ap-southeast-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"action": "health"}'

# Expected:
{
  "statusCode": 200,
  "body": "{\"status\":\"ok\",\"service\":\"finlapor-ai\",\"version\":\"2.0\",\"hf_configured\":true,\"models\":{\"ocr\":\"naver-clova-ix/donut-base-finetuned-cord-v2\",\"llm\":\"Qwen/Qwen2.5-72B-Instruct\"}}"
}

# 2. Test Chat
curl -X POST https://xxxxxx.lambda-url.ap-southeast-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"action": "chat", "message": "Halo", "user_age": 25}'

# 3. Test Categorize
curl -X POST https://xxxxxx.lambda-url.ap-southeast-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"action": "categorize", "description": "Makan siang di KFC"}'

# Expected: {"statusCode": 200, "body": "{\"category\":\"Makanan\",\"confidence\":0.85}"}
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
