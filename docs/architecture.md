# 🏗️ Architecture

Dokumentasi lengkap arsitektur sistem FinLapor.

---

## 📊 High-Level Architecture

```
                                    ┌─────────────────┐
                                    │      USER       │
                                    │  (Browser/App)  │
                                    └────────┬────────┘
                                             │
                           ┌─────────────────┴─────────────────┐
                           │                                   │
                           ▼                                   ▼
              ┌─────────────────────────────┐    ┌─────────────────────────────┐
              │      CLOUDFLARE PAGES       │    │      CLOUDFLARE PROXY       │
              │                             │    │                             │
              │   📍 finlapor.com           │    │   📍 api.finlapor.com       │
              │   Next.js Static Export     │    │   DDoS + SSL + Caching      │
              │   FREE                      │    │   FREE                      │
              └─────────────────────────────┘    └──────────────┬──────────────┘
                                                                │
              ┌─────────────────────────────────────────────────┼──────────────┐
              │                         AWS                     │              │
              │                                                 ▼              │
              │                              ┌──────────────────────────────┐  │
              │                              │      API GATEWAY (HTTP)      │  │
              │                              │      ~$1/1M requests         │  │
              │                              └──────────────┬───────────────┘  │
              │                                             │                  │
              │  ┌──────────────────────────────────────────┼───────────────┐  │
              │  │               PRIVATE SUBNET             │               │  │
              │  │                                          ▼               │  │
              │  │   ┌──────────────────────┐    ┌──────────────────────┐   │  │
              │  │   │   Backend (Go)       │    │   PostgreSQL + Redis │   │  │
              │  │   │   EC2 t3.micro       │◄──►│   (same EC2)         │   │  │
              │  │   │   ~$8/month          │    │                      │   │  │
              │  │   └──────────┬───────────┘    └──────────────────────┘   │  │
              │  │              │                                           │  │
              │  └──────────────┼───────────────────────────────────────────┘  │
              │                 │                                              │
              │                 │  AWS SDK (no internet needed)                │
              │                 ▼                                              │
              │      ┌───────────────────────┐      ┌───────────────────────┐  │
              │      │      AWS LAMBDA       │      │        AWS S3         │  │
              │      │   (AI Service)        │      │   (File Storage)      │  │
              │      │   FREE tier           │──────│   ~$0.10/month        │  │
              │      └───────────┬───────────┘      └───────────────────────┘  │
              │                  │                                             │
              └──────────────────┼─────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────────┐
                    │    🤗 HUGGING FACE API    │
                    │    OCR + LLM Models       │
                    │    FREE (30k req/month)   │
                    └───────────────────────────┘
```

---

## 🔧 Tech Stack Detail

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | UI component library |
| **Zustand** | State management |
| **React Query** | Server state & caching |
| **Recharts** | Data visualization |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |

### Backend

| Technology | Purpose |
|------------|---------|
| **Go 1.21** | Programming language |
| **Fiber v2** | Web framework |
| **GORM** | ORM for database |
| **PostgreSQL 16** | Primary database |
| **Redis 7** | Caching & sessions |
| **JWT** | Authentication |
| **AWS SDK** | S3 & Lambda integration |

### AI Service

| Technology | Purpose |
|------------|---------|
| **Python 3.11** | Programming language |
| **AWS Lambda** | Serverless compute |
| **Hugging Face** | AI model inference |
| **Donut** | OCR for receipts |
| **Mistral-7B** | LLM for chat & categorization |

---

## 📁 Project Structure

```
finlapor/
│
├── 📂 frontend/                    # Next.js Application
│   ├── src/
│   │   ├── app/                    # App Router pages
│   │   │   ├── (auth)/             # Auth pages (login, register)
│   │   │   ├── (dashboard)/        # Protected pages
│   │   │   │   ├── page.tsx        # Dashboard home
│   │   │   │   ├── transactions/
│   │   │   │   ├── scanner/
│   │   │   │   ├── reports/
│   │   │   │   ├── chat/
│   │   │   │   └── settings/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn components
│   │   │   ├── layout/             # Layout components
│   │   │   ├── charts/             # Chart components
│   │   │   └── forms/              # Form components
│   │   ├── lib/                    # Utilities
│   │   ├── hooks/                  # Custom hooks
│   │   ├── services/               # API services
│   │   └── stores/                 # Zustand stores
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
├── 📂 backend/                     # Go API Server
│   ├── cmd/
│   │   ├── server/
│   │   │   └── main.go             # Entry point
│   │   └── migrate/
│   │       └── main.go             # Migration tool
│   ├── internal/
│   │   ├── config/                 # Configuration
│   │   ├── handlers/               # HTTP handlers
│   │   ├── middleware/             # Middleware
│   │   ├── models/                 # Data models
│   │   ├── repository/             # Database access
│   │   └── services/               # Business logic
│   ├── pkg/                        # Shared packages
│   ├── go.mod
│   └── Dockerfile
│
├── 📂 ai-service/                  # Lambda Functions
│   ├── handlers/
│   │   ├── ocr.py
│   │   ├── categorize.py
│   │   └── chat.py
│   ├── lambda_function.py
│   ├── requirements.txt
│   └── serverless.yml
│
├── 📂 database/
│   ├── migrations/                 # SQL migrations
│   └── migrations/                 # SQL migrations (production-ready)
│
├── 📂 docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── nginx.conf
│
├── 📂 docs/                        # Documentation
│
├── 📂 scripts/                     # Utility scripts
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── Makefile
├── .env.example
└── README.md
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │    companies    │     │    accounts     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │────►│ id (PK)         │────►│ id (PK)         │
│ email           │     │ name            │     │ code            │
│ password_hash   │     │ user_id (FK)    │     │ name            │
│ name            │     │ industry        │     │ type            │
│ mode            │     │ created_at      │     │ company_id (FK) │
│ created_at      │     └─────────────────┘     └─────────────────┘
└─────────────────┘                                      │
         │                                               │
         │         ┌─────────────────────────────────────┘
         │         │
         ▼         ▼
┌─────────────────────────────────────┐
│           transactions              │
├─────────────────────────────────────┤
│ id (PK)                             │
│ user_id (FK)                        │
│ account_id (FK) [nullable]          │
│ type (income/expense)               │
│ category                            │
│ amount                              │
│ description                         │
│ date                                │
│ receipt_url                         │
│ created_at                          │
│ updated_at                          │
└─────────────────────────────────────┘
         │
         │
         ▼
┌─────────────────────────────────────┐
│            reports                  │
├─────────────────────────────────────┤
│ id (PK)                             │
│ user_id (FK)                        │
│ type                                │
│ period_start                        │
│ period_end                          │
│ file_url                            │
│ generated_at                        │
└─────────────────────────────────────┘
```

### Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    mode VARCHAR(20) DEFAULT 'personal', -- 'personal' or 'business'
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### transactions
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Security

### Authentication Flow

```
1. User login dengan email/password
2. Backend verifikasi credentials
3. Generate JWT access token (15 min) + refresh token (7 days)
4. Client simpan tokens di httpOnly cookies
5. Setiap request, sertakan access token di header
6. Jika expired, gunakan refresh token untuk dapat access token baru
```

### Security Measures

| Layer | Protection |
|-------|------------|
| **Network** | CloudFlare DDoS, VPC Private Subnet |
| **Transport** | HTTPS everywhere (TLS 1.3) |
| **Authentication** | JWT with refresh tokens |
| **Authorization** | Role-based access control |
| **Data** | Password hashing (bcrypt), encrypted at rest |
| **Input** | Validation & sanitization |

---


### VPC Endpoints for Cost Optimization

For the Private Subnet deployment, VPC Endpoints can be used instead of NAT Gateway:

- **S3 Gateway Endpoint**: FREE (no data transfer charges)
- **Saves**: ~$32/month (no NAT Gateway needed)
- **Benefits**: Direct, secure access to S3 from private subnet

### Bastion Host for Private Subnet

When using Private Subnet architecture:

- **Bastion Host**: EC2 t3.nano (~$3.80/month) in public subnet
- **Purpose**: SSH access to backend in private subnet via jump host
- **Security**: Only your IP can SSH to bastion


## 💰 Cost Estimation

| Service | Monthly Cost |
|---------|-------------|
| CloudFlare Pages | $0 (free) |
| CloudFlare Proxy | $0 (free) |
| API Gateway | ~$1-3 |
| EC2 t3.micro | ~$8 |
| S3 (5GB) | ~$0.10 |
| Lambda | ~$0 (free tier) |
| Hugging Face | ~$0 (free tier) |
| **Total** | **~$9-12/month** |

---

## 📚 References

- [Next.js Documentation](https://nextjs.org/docs)
- [Go Fiber Documentation](https://docs.gofiber.io/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/)


