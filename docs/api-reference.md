# 📡 API Reference

Dokumentasi lengkap REST API FinLapor.

---

## 🌐 Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8080` |
| Production | `https://api.finlapor.airi.click` |

---

## 🔐 Authentication

Semua endpoint (kecuali auth) memerlukan JWT token di header:

```
Authorization: Bearer <access_token>
```

---

## 📋 Endpoints

### Auth

#### Register
```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "mode": "personal"  // "personal" atau "business"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "mode": "personal"
    },
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG..."
  }
}
```

---

#### Login
```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG..."
  }
}
```

---

#### Refresh Token
```http
POST /api/v1/auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG..."
  }
}
```

---

### User

#### Get Profile
```http
GET /api/v1/user/profile
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "mode": "personal",
    "avatar_url": "https://...",
    "created_at": "2026-01-22T10:00:00Z"
  }
}
```

---

#### Update Profile
```http
PUT /api/v1/user/profile
```

**Request Body:**
```json
{
  "name": "John Updated",
  "avatar_url": "https://..."
}
```

---

### Transactions

#### List Transactions
```http
GET /api/v1/transactions
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20) |
| type | string | Filter by type: "income" or "expense" |
| category | string | Filter by category |
| start_date | string | Filter from date (YYYY-MM-DD) |
| end_date | string | Filter to date (YYYY-MM-DD) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "expense",
        "category": "food",
        "amount": 50000,
        "description": "Makan siang",
        "date": "2026-01-22",
        "receipt_url": "https://...",
        "created_at": "2026-01-22T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

---

#### Create Transaction
```http
POST /api/v1/transactions
```

**Request Body:**
```json
{
  "type": "expense",
  "category": "food",
  "amount": 50000,
  "description": "Makan siang di warteg",
  "date": "2026-01-22",
  "receipt_url": "https://s3.../receipt.jpg"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "expense",
    "category": "food",
    "amount": 50000,
    "description": "Makan siang di warteg",
    "date": "2026-01-22",
    "receipt_url": "https://...",
    "created_at": "2026-01-22T12:00:00Z"
  }
}
```

---

#### Get Transaction
```http
GET /api/v1/transactions/:id
```

---

#### Update Transaction
```http
PUT /api/v1/transactions/:id
```

---

#### Delete Transaction
```http
DELETE /api/v1/transactions/:id
```

---

### OCR (Receipt Scanning)

#### Scan Receipt
```http
POST /api/v1/ocr/scan
```

**Request Body (multipart/form-data):**
| Field | Type | Description |
|-------|------|-------------|
| image | file | Receipt image (JPG, PNG, PDF) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "vendor": "Alfamart",
    "date": "2026-01-22",
    "total": 87500,
    "items": [
      { "name": "Indomie Goreng", "qty": 2, "price": 7000 },
      { "name": "Aqua 600ml", "qty": 1, "price": 5500 }
    ],
    "image_url": "https://s3.../receipt.jpg",
    "suggested_category": "shopping",
    "confidence": 0.92
  }
}
```

---

### AI Chat

#### Send Message
```http
POST /api/v1/chat
```

**Request Body:**
```json
{
  "message": "Berapa total pengeluaran saya bulan ini?"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reply": "Total pengeluaran Anda di bulan Januari 2026 adalah Rp 2.750.000. Kategori terbesar adalah Makan & Minum (Rp 800.000).",
    "suggestions": [
      "Lihat breakdown per kategori",
      "Bandingkan dengan bulan lalu",
      "Saran penghematan"
    ]
  }
}
```

---

### Reports

#### Generate Report
```http
POST /api/v1/reports/generate
```

**Request Body:**
```json
{
  "type": "income_statement",  // "income_statement", "balance_sheet", "cash_flow", "monthly_summary"
  "period_start": "2026-01-01",
  "period_end": "2026-01-31",
  "format": "pdf"  // "pdf" atau "excel"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "income_statement",
    "file_url": "https://s3.../report.pdf",
    "generated_at": "2026-01-22T12:00:00Z"
  }
}
```

---

#### List Reports
```http
GET /api/v1/reports
```

---

### Dashboard

#### Get Summary
```http
GET /api/v1/dashboard/summary
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| period | string | "week", "month", "year" (default: month) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": 5250000,
    "total_income": 8000000,
    "total_expense": 2750000,
    "expense_by_category": [
      { "category": "food", "amount": 800000, "percentage": 29 },
      { "category": "transport", "amount": 500000, "percentage": 18 },
      { "category": "utilities", "amount": 1000000, "percentage": 36 }
    ],
    "trend": [
      { "date": "2026-01-01", "income": 8000000, "expense": 500000 },
      { "date": "2026-01-08", "income": 0, "expense": 750000 }
    ]
  }
}
```

---

### File Upload

#### Get Presigned URL
```http
POST /api/v1/upload/presign
```

**Request Body:**
```json
{
  "filename": "receipt.jpg",
  "content_type": "image/jpeg"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "upload_url": "https://s3.../presigned-url",
    "file_url": "https://s3.../receipts/uuid.jpg",
    "expires_in": 3600
  }
}
```

---

## ❌ Error Responses

Semua error mengikuti format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input |
| UNAUTHORIZED | 401 | Missing/invalid token |
| FORBIDDEN | 403 | Not allowed |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Already exists |
| INTERNAL_ERROR | 500 | Server error |

---

## 📝 Categories

Available transaction categories:

| Code | Display Name |
|------|--------------|
| food | Makan & Minum |
| transport | Transportasi |
| shopping | Belanja |
| utilities | Tagihan & Utilitas |
| entertainment | Hiburan |
| health | Kesehatan |
| education | Pendidikan |
| investment | Investasi |
| salary | Gaji |
| business | Bisnis |
| other | Lainnya |
