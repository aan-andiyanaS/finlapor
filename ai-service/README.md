# FinLapor AI Service

AWS Lambda function untuk AI features FinLapor.

## Features

| Action | Description | Model |
|--------|-------------|-------|
| `health` | Health check | - |
| `ocr` | Receipt scanning | Donut (CORD) |
| `chat` | Financial assistant chatbot | Mistral-7B |
| `categorize` | Auto-categorize transactions | BART (zero-shot) |
| `insight` | Generate spending insights | - |

## Architecture

```
Backend (Go) ──→ HuggingFace API  (current, for demo)
     │
     └──→ AWS Lambda (optional, for production scale)
```

## Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export HF_TOKEN=hf_your_token_here

# Run test
python lambda_function.py
```

## Deploy to AWS Lambda

```bash
# Install Serverless Framework
npm install -g serverless
npm install --save-dev serverless-python-requirements

# Deploy
serverless deploy

# Set environment variables in AWS Console
# or use AWS SSM Parameter Store
```

## API Usage

### Health Check
```bash
curl https://your-api-gateway/ai/health
```

### OCR
```json
{
  "action": "ocr",
  "image_url": "https://example.com/receipt.jpg"
}
```

### Chat
```json
{
  "action": "chat",
  "message": "Berapa total pengeluaran saya bulan ini?",
  "user_age": 25,
  "context": {
    "financial_data": "Total income: Rp 10.000.000..."
  }
}
```

### Categorize
```json
{
  "action": "categorize",
  "description": "Makan siang di KFC"
}
```

### Insight
```json
{
  "action": "insight",
  "transactions": [
    {"type": "expense", "amount": 50000, "category": "Makanan"},
    {"type": "income", "amount": 5000000, "category": "Gaji"}
  ]
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HF_TOKEN` | HuggingFace API token | Required |
| `HF_OCR_MODEL` | OCR model | `naver-clova-ix/donut-base-finetuned-cord-v2` |
| `HF_LLM_MODEL` | LLM model | `mistralai/Mistral-7B-Instruct-v0.2` |
