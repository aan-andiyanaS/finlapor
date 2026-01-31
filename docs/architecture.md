# 🏗️ Architecture

Dokumentasi lengkap arsitektur sistem FinLapor.

---

## 📊 High-Level Architecture

```mermaid
flowchart TB
    subgraph CICD["🔄 CI/CD"]
        GitHub["🐙 GitHub Actions<br/>Build + Deploy"]
    end

    subgraph User["👤 USER"]
        Browser["Browser/App"]
    end

    subgraph CloudFlare["☁️ CLOUDFLARE"]
        CFPages["📍 finlapor.airi.click<br/>CloudFlare Pages<br/>Next.js Static Export"]
        CFProxy["📍 api.finlapor.airi.click<br/>CloudFlare Proxy<br/>DDoS + SSL + Caching"]
    end

    subgraph AWS["🔶 AWS VPC"]
        APIGateway["API Gateway HTTP<br/>~$1/million requests"]
        
        subgraph PublicSubnet["Public Subnet"]
            Bastion["🔐 Bastion Host<br/>t3.nano ~$3.80/mo"]
        end
        
        subgraph PrivateSubnet["Private Subnet"]
            Backend["🖥️ Backend Go Fiber<br/>EC2 t3.micro ~$8.50/mo"]
            RDS["🗄️ AWS RDS<br/>PostgreSQL + Redis"]
        end
        
        Lambda["⚡ AWS Lambda<br/>AI Service Python 3.11"]
        S3["📦 AWS S3<br/>File Storage ~$0.10/mo"]
    end

    subgraph External["🌐 External"]
        HuggingFace["🤗 HuggingFace API<br/>OCR + LLM Models<br/>FREE 30k req/mo"]
    end

    %% User Flow
    Browser --> CFPages
    Browser --> CFProxy
    CFProxy --> APIGateway
    APIGateway --> Backend
    
    %% CI/CD Flow
    GitHub -.->|Deploy Frontend| CFPages
    GitHub -.->|SSH ProxyJump| Bastion
    Bastion -.->|Deploy Backend| Backend
    
    %% Internal connections
    Backend <--> RDS
    Backend --> Lambda
    Backend -->|VPC Endpoint FREE| S3
    Lambda --> HuggingFace
```

**🔐 Architecture Highlights:**
- **Bastion Host**: SSH jump host in public subnet for secure access
- **VPC Endpoint S3**: FREE gateway endpoint (saves $32/month by replacing NAT Gateway)
- **Private Subnet**: Backend isolated from internet, only accessible via API Gateway
- **Total Cost**: ~$13/month (EC2 $8.50 + Bastion $3.80 + API Gateway $1)

---

## 🔄 CI/CD Pipeline Architecture

### Opsi A: Public Subnet Deployment

```mermaid
flowchart LR
    subgraph GitHub["GitHub"]
        Push["git push / tag v*"]
        Actions["🔧 GitHub Actions"]
    end

    subgraph Build["Build Phase"]
        Checkout["Checkout Code"]
        BuildDocker["Build Docker Image"]
        SaveTar["Save to tar.gz"]
    end

    subgraph Deploy["Deploy Phase"]
        SSH["SSH Direct"]
        Transfer["Transfer Image"]
        Load["docker load"]
        Run["docker compose up"]
    end

    subgraph AWS["AWS Public Subnet"]
        EC2["🖥️ EC2 Backend<br/>Public IP"]
    end

    Push --> Actions
    Actions --> Checkout --> BuildDocker --> SaveTar
    SaveTar --> SSH --> Transfer --> Load --> Run
    Run --> EC2
```

### Opsi B: Private Subnet Deployment (via Bastion)

```mermaid
flowchart LR
    subgraph GitHub["GitHub"]
        Push["git push / tag v*"]
        Actions["🔧 GitHub Actions"]
    end

    subgraph Build["Build Phase"]
        Checkout["Checkout Code"]
        BuildDocker["Build Docker<br/>+ Pull Redis"]
        SaveTar["Save all-images.tar.gz"]
    end

    subgraph Deploy["Deploy via Bastion"]
        ProxyJump["SSH ProxyJump"]
        Tunnel["🔐 Bastion Tunnel"]
        Transfer["Transfer Images"]
    end

    subgraph AWS["AWS VPC"]
        Bastion["Bastion Host<br/>Public Subnet"]
        EC2["🖥️ EC2 Backend<br/>Private Subnet"]
    end

    Push --> Actions
    Actions --> Checkout --> BuildDocker --> SaveTar
    SaveTar --> ProxyJump --> Tunnel
    Tunnel --> Bastion
    Bastion -.->|Tunnel| EC2
    Transfer --> EC2
```

> 📖 Detail implementasi CI/CD: [CI/CD Guide](./cicd.md)

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
| **AWS RDS PostgreSQL 16** | Primary database (Managed) |
| **Redis 7** | Caching & sessions |
| **JWT** | Authentication |
| **AWS SDK** | S3, Lambda, RDS integration |

### AI Service

| Technology | Purpose |
|------------|---------|
| **Python 3.11** | Programming language |
| **AWS Lambda** | Serverless compute |
| **Hugging Face** | AI model inference |
| **Donut** | OCR for receipts |
| **Qwen 2.5-72B** | LLM for chat & analysis |
| **BART Zero-shot** | Auto-categorization |

---

## 🔄 Application Flows

### User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Frontend (Next.js)
    participant B as Backend (Go Fiber)
    participant DB as PostgreSQL
    participant R as Redis

    Note over U,R: Registration Flow
    U->>F: Buka halaman Register
    F->>B: POST /api/auth/register
    B->>B: Hash password (bcrypt)
    B->>DB: Insert user record
    B->>B: Generate JWT access + refresh token
    B->>R: Store refresh token
    B-->>F: Return tokens + user data
    F->>F: Store tokens in localStorage
    F-->>U: Redirect ke Dashboard

    Note over U,R: Login Flow
    U->>F: Masukkan email/password
    F->>B: POST /api/auth/login
    B->>DB: Fetch user by email
    B->>B: Verify password (bcrypt)
    B->>B: Generate JWT tokens
    B->>R: Store refresh token
    B-->>F: Return tokens + user data
    F-->>U: Redirect ke Dashboard

    Note over U,R: Token Refresh Flow
    U->>F: Access token expired
    F->>B: POST /api/auth/refresh
    B->>R: Validate refresh token
    B->>B: Generate new access token
    B-->>F: Return new access token
    F->>F: Update stored token
```

### Transaction Management Flow

```mermaid
flowchart TB
    A[User Input] --> B{Input Method?}
    
    B -->|Manual| C[Form Input]
    C --> D[Pilih Kategori]
    D --> E[Masukkan Amount & Description]
    
    B -->|Scan Struk| F[Upload Image]
    F --> G[POST /api/ocr/scan]
    G --> H[HuggingFace Donut OCR]
    H --> I[Extract: vendor, date, total, items]
    I --> J[POST /api/ai/categorize]
    J --> K[BART Zero-shot Classification]
    K --> L[Suggest Category]
    L --> E
    
    E --> M[POST /api/transactions]
    M --> N{Multi-category?}
    
    N -->|Single| O[Save to transactions table]
    N -->|Multiple| P[Save transaction + transaction_items]
    
    O --> Q[(PostgreSQL)]
    P --> Q
    
    Q --> R[Update Dashboard]
    R --> S[GET /api/dashboard/summary]
    S --> T[Display Charts & Stats]
```

### AI Service Flow

```mermaid
flowchart LR
    subgraph Frontend
        A[Chat Page]
        B[Scanner Page]
    end
    
    subgraph Backend["Backend (Go Fiber)"]
        C[Chat Handler]
        D[OCR Handler]
        E[HuggingFace Service]
        F[Lambda Service]
    end
    
    subgraph External["External Services"]
        G[AWS Lambda]
        H[HuggingFace API]
    end
    
    subgraph Models["AI Models"]
        I[Donut - OCR]
        J[Qwen 2.5-72B - Chat]
        K[BART - Categorize]
    end
    
    A --> C
    B --> D
    C --> E
    D --> E
    E --> F
    F --> G
    E --> H
    G --> H
    H --> I
    H --> J
    H --> K
```

### AI Chat with Age-Based Personalization

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant HF as HuggingFace API

    U->>F: Ketik pertanyaan
    F->>B: POST /api/chat {message, user_age}
    B->>B: Fetch user's transaction data
    B->>B: Build personalized prompt based on age
    
    Note over B: Age < 25: Casual, friendly tone
    Note over B: Age 25-45: Professional tone
    Note over B: Age > 45: Respectful, clear tone
    
    B->>HF: POST /v1/chat/completions
    HF->>HF: Qwen 2.5-72B inference
    HF-->>B: AI response
    B->>B: Save to chat_history
    B-->>F: Return formatted response
    B-->>F: Return formatted response
    F-->>U: Display AI reply with suggestions
```



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
│   └── migrations/                 # SQL migrations
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

```mermaid
erDiagram
    users ||--o{ companies : owns
    users ||--o{ transactions : creates
    users ||--o{ categories : customizes
    users ||--o{ category_groups : creates
    users ||--o{ budgets : sets
    users ||--o{ reports : generates
    users ||--o{ refresh_tokens : has
    users ||--o{ chat_history : chats
    category_groups ||--o{ categories : contains
    categories ||--o{ transactions : categorizes
    categories ||--o{ transaction_items : categorizes
    categories ||--o{ budgets : limits
    transactions ||--o{ transaction_items : contains

    users {
        UUID id PK
        string email UK
        string password_hash
        string name
        int age
        string mode
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }

    companies {
        UUID id PK
        UUID user_id FK
        string name
        string industry
        timestamp created_at
    }

    category_groups {
        UUID id PK
        UUID user_id FK
        string name
        string icon
        string color
        int sort_order
        timestamp created_at
    }

    categories {
        UUID id PK
        UUID user_id FK
        UUID group_id FK
        string name
        string icon
        string color
        string type
        boolean is_default
        timestamp created_at
    }

    transactions {
        UUID id PK
        UUID user_id FK
        UUID category_id FK
        string type
        decimal amount
        decimal total_amount
        text description
        date date
        text receipt_url
        timestamp created_at
        timestamp updated_at
    }

    transaction_items {
        UUID id PK
        UUID transaction_id FK
        UUID category_id FK
        decimal amount
        text note
        timestamp created_at
    }

    budgets {
        UUID id PK
        UUID user_id FK
        UUID category_id FK
        decimal amount
        string period
        date start_date
        date end_date
        timestamp created_at
        timestamp updated_at
    }

    reports {
        UUID id PK
        UUID user_id FK
        string type
        date period_start
        date period_end
        text file_url
        timestamp generated_at
    }

    refresh_tokens {
        UUID id PK
        UUID user_id FK
        text token UK
        timestamp expires_at
        timestamp created_at
    }

    chat_history {
        UUID id PK
        UUID user_id FK
        text message
        string role
        timestamp created_at
    }
```

> **Note:** Fitur Multi-Category Transaction memungkinkan satu transaksi dipecah ke beberapa kategori menggunakan `transaction_items`.

### Tables Overview

| Table | Description | Key Relations |
|-------|-------------|---------------|
| `users` | User accounts with age for AI personalization | Base table |
| `companies` | Business mode companies | → users |
| `category_groups` | Grouping for categories | → users |
| `categories` | Transaction categories (system + custom) | → users, → category_groups |
| `transactions` | Income/expense records | → users, → categories |
| `transaction_items` | Multi-category split items | → transactions, → categories |
| `budgets` | Category spending limits with date range | → users, → categories |
| `reports` | Generated financial reports | → users |
| `refresh_tokens` | JWT refresh tokens | → users |
| `chat_history` | AI chat with role (user/assistant) | → users |

### Key Relationships

| Parent | Child | Relationship | On Delete |
|--------|-------|--------------|-----------|
| users | transactions | 1:N | CASCADE |
| users | categories | 1:N | CASCADE |
| users | companies | 1:N | CASCADE |
| users | budgets | 1:N | CASCADE |
| users | reports | 1:N | CASCADE |
| users | refresh_tokens | 1:N | CASCADE |
| users | chat_history | 1:N | CASCADE |
| categories | transactions | 1:N | SET NULL |
| categories | budgets | 1:N | CASCADE |

### Tables Detail

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INTEGER,  -- untuk personalisasi AI
    mode VARCHAR(20) DEFAULT 'personal', -- 'personal' or 'business'
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### categories
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = system default
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    type VARCHAR(20) NOT NULL, -- 'income', 'expense', or 'both'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### transactions
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### budgets
```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### chat_history
```sql
CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

```sql
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
```

### Default Categories

System menyediakan kategori default (user_id = NULL):

| Name | Icon | Type |
|------|------|------|
| Gaji | 💰 | income |
| Freelance | 💼 | income |
| Investasi | 📈 | income |
| Makanan | 🍔 | expense |
| Transport | 🚗 | expense |
| Belanja | 🛒 | expense |
| Hiburan | 🎮 | expense |
| Tagihan | 📄 | expense |
| Kesehatan | ⚕️ | expense |
| Pendidikan | 📚 | expense |
| Lainnya | 📦 | both |

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


