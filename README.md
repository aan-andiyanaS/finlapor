# FinLapor 💰

> **AI-Powered Financial Management Platform for Individuals & SMEs**

FinLapor adalah aplikasi pengelolaan keuangan berbasis AI yang mendukung **SDG 8** (Decent Work and Economic Growth) dan **SDG 12** (Responsible Consumption and Production).

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![Go](https://img.shields.io/badge/Go-1.21-00ADD8?style=flat&logo=go)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)
![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20Lambda%20%7C%20S3-FF9900?style=flat&logo=amazon-aws)
![CloudFlare](https://img.shields.io/badge/CloudFlare-Pages-F38020?style=flat&logo=cloudflare)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat&logo=github-actions)

---

## ✨ Fitur Utama

| Fitur | Deskripsi | Status |
|-------|-----------|--------|
| 📊 **Dashboard Interaktif** | Visualisasi keuangan real-time dari database | ✅ Production |
| 📷 **Scan Struk Otomatis** | OCR dengan AI (HuggingFace Donut) | ✅ Production |
| 💬 **Asisten AI Cerdas** | Chatbot dengan Mistral 7B untuk analisis keuangan | ✅ Production |
| 📈 **Laporan Komprehensif** | Generate laporan PDF/Excel | ✅ Production |
| 🏷️ **Kategorisasi Otomatis** | AI zero-shot classification otomatis | ✅ Production |
| 🔔 **Budget Alert** | Notifikasi saat pengeluaran melebihi budget | ✅ Production |
| 🌙 **Dark/Light Mode** | Tema yang nyaman untuk mata | ✅ Production |
| 📱 **Responsive Design** | Optimal di desktop, tablet, dan mobile | ✅ Production |
| 🔄 **CI/CD Pipeline** | Automated testing & deployment | ✅ Production |

---

## 🏗️ Arsitektur Sistem

### High-Level Architecture

```
┌─────────────┐
│   USER      │
│ (Browser)   │
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
   ▼        ▼
┌──────┐ ┌──────┐
│  CF  │ │  CF  │  CloudFlare Pages (Frontend)
│Pages │ │Proxy │  CloudFlare DDoS Protection
└──────┘ └───┬──┘
             │
    ┌────────┴─────────┐
    │    AWS VPC       │
    │  ┌────────────┐  │
    │  │ Public     │  │  ┌─ Bastion Host (SSH Jump)
    │  │ Subnet     │  │  │
    │  └────────────┘  │  │
    │  ┌────────────┐  │  │
    │  │ Private    │◄─┴──┘
    │  │ Subnet     │  │
    │  │            │  │
    │  │ ┌────────┐ │  │  ┌─ Backend (Go Fiber)
    │  │ │Backend │ │  │  │  + PostgreSQL + Redis
    │  │ │EC2     │◄┼──┼──┤
    │  │ └────┬───┘ │  │  │
    │  │      │     │  │  │
    │  │      │VPC  │  │  └─ VPC Endpoint (S3)
    │  │      │Endpt│  │     FREE! Saves $32/mo
    │  └──────┼─────┘  │
    │         │        │
    │    ┌────┴────┐   │
    │    │ Lambda  │   │  ┌─ AI Service (Python)
    │    │   +     │◄──┼──┤  OCR + Chat
    │    │   S3    │   │  └─ File Storage
    │    └─────────┘   │
    └───────────────────┘
           │
           ▼
    ┌─────────────┐
    │ HuggingFace │  ┌─ OCR: Donut Model
    │     API     │  └─ LLM: Mistral 7B
    └─────────────┘     FREE (30k req/mo)
```

**Key Features:**
- 🔒 **Secure**: Private Subnet + Bastion Host + API Gateway
- 💰 **Cost-Optimized**: VPC Endpoint S3 (FREE) replaces NAT Gateway (saves $32/month)
- 🚀 **Scalable**: CloudFlare CDN + AWS Auto Scaling ready
- 🤖 **AI-Powered**: HuggingFace models with fallback for offline mode

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (TypeScript, Static Export)
- **Styling**: Tailwind CSS + Custom Design System
- **State**: Zustand + React Query
- **UI Components**: shadcn/ui
- **Deployment**: CloudFlare Pages (FREE)

### Backend
- **Language**: Go 1.21
- **Framework**: Fiber v2
- **ORM**: GORM
- **Auth**: JWT with refresh tokens
- **Database**: PostgreSQL 16 + Redis 7
- **Deployment**: AWS EC2 (t3.micro)

### AI & ML
- **OCR Model**: Donut (HuggingFace) - Receipt scanning
- **LLM**: Mistral 7B Instruct - Financial chat assistant
- **Classification**: BART Zero-shot - Auto categorization
- **Deployment**: AWS Lambda (Python 3.11)

### Infrastructure
- **Frontend**: CloudFlare Pages
- **Backend**: AWS EC2 (Private Subnet)
- **Database**: PostgreSQL on EC2
- **Storage**: AWS S3 via VPC Endpoint
- **Monitoring**: CloudWatch + Health Checks
- **CI/CD**: GitHub Actions (automated pipeline)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Go 1.21+
- Docker & Docker Compose
- Git

### 1. Clone Repository

```bash
git clone https://github.com/aan-andiyanaS/finlapor.git
cd finlapor
```

### 2. Start Database (Docker)

```bash
# Start PostgreSQL, Redis, and MinIO
docker-compose up -d postgres redis minio

# Run migrations
Get-Content database\migrations\001_initial.sql | docker exec -i finlapor-postgres-1 psql -U postgres -d finlapor
```

### 3. Run Backend

```bash
cd backend
cp .env.example .env
# Edit .env - adjust database credentials if needed

go run cmd/server/main.go
```

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Open App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Health**: http://localhost:8080/health
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

### 6. First User Registration

**No demo users!** Register your first account:

```bash
# Via API
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"Your Name"}'

# Or via UI
# Open http://localhost:3000 → Click "Daftar"
```

---

## 📁 Project Structure

```
finlapor/
├── frontend/                 # Next.js 14 Frontend
│   ├── src/app/             # App Router pages
│   ├── src/lib/             # API client & utilities
│   └── src/stores/          # Zustand state management
│
├── backend/                  # Go Backend
│   ├── cmd/server/          # Main entry point
│   └── internal/
│       ├── handlers/        # HTTP handlers (real DB, no mock)
│       ├── services/        # Business logic + HuggingFace
│       ├── repository/      # Data access layer
│       └── models/          # Database models
│
├── ai-service/              # Python Lambda Functions
│   ├── lambda_function.py   # Main handler
│   └── serverless.yml       # Deployment config
│
├── database/
│   └── migrations/          # SQL migrations (production-ready)
│
├── docs/                    # Documentation
│   ├── getting-started.md   # Setup guide
│   ├── architecture.md      # System design (detailed)
│   ├── api-reference.md     # API documentation
│   ├── deployment.md        # AWS deployment (2 options)
│   ├── cicd.md              # CI/CD pipeline guide
│   └── user-manual.md       # End user guide
│
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
│       ├── backend-ci.yml   # Backend tests & build
│       ├── frontend-ci.yml  # Frontend lint & build
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── docker-compose.yml       # Local development
└── README.md                # This file
```

---

## 📚 Documentation

| Document | Description | Link |
|----------|-------------|------|
| **Getting Started** | Setup development environment | [docs/getting-started.md](./docs/getting-started.md) |
| **Architecture** | System design & diagrams | [docs/architecture.md](./docs/architecture.md) |
| **API Reference** | Endpoint documentation | [docs/api-reference.md](./docs/api-reference.md) |
| **Deployment Guide** | AWS deployment (2 options) | [docs/deployment.md](./docs/deployment.md) |
| **CI/CD Pipeline** | Automated deployment | [docs/cicd.md](./docs/cicd.md) |
| **User Manual** | End user guide | [docs/user-manual.md](./docs/user-manual.md) |

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List all transactions |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions/:id` | Get transaction detail |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ocr/scan` | Scan receipt with OCR (HuggingFace Donut) |
| POST | `/api/ocr/categorize` | Auto-categorize transaction |
| POST | `/api/chat` | AI chat assistant (Mistral 7B) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Financial summary (real data) |
| GET | `/api/dashboard/insights` | AI-generated insights |

[Full API Reference →](./docs/api-reference.md)

---

## 🚀 CI/CD Pipeline

**Automated with GitHub Actions:**

```
Code Push → Tests → Build → Deploy Staging → Tests → Deploy Production
```

### Workflows

| Workflow | Trigger | Status |
|----------|---------|--------|
| Backend CI | Push/PR to main/develop | ✅ Automated |
| Frontend CI | Push/PR to main/develop | ✅ Automated |
| Deploy Staging | Push to `develop` | ✅ Automated |
| Deploy Production | Tag `v*` (e.g., v1.0.0) | ✅ Automated |

**Features:**
- ✅ Automated testing (PostgreSQL + Redis in CI)
- ✅ Build artifacts caching
- ✅ Database backup before production deploy
- ✅ Health checks after deployment
- ✅ Automatic rollback on failure
- ✅ Slack notifications

[CI/CD Guide →](./docs/cicd.md)

---

## 💰 Cost Estimation

### Development (Local)
- **Cost**: FREE (Docker containers)

### Deployment Options

| Setup | Components | Monthly Cost |
|-------|------------|--------------|
| **Public Subnet** | EC2 t3.micro + CloudFlare | ~$9-10 |
| **Private + NAT** | + Bastion + NAT Gateway + API Gateway | ~$45 |
| **Private + VPC Endpoint** ⭐ | + Bastion + VPC Endpoint + API Gateway | ~$13 |

**Recommendation: Private Subnet + VPC Endpoint**
- 🔒 High security (Private Subnet)
- 💰 Cost-optimized (VPC Endpoint S3 is FREE!)
- 📉 Saves $32/month vs NAT Gateway

**Breakdown (Private + VPC Endpoint):**
- EC2 t3.micro (backend): $8.50
- EC2 t3.nano (bastion): $3.80
- API Gateway: $1.00 (per 1M requests)
- VPC Endpoint S3: **FREE** ✅
- CloudFlare Pages: **FREE** ✅
- **Total: ~$13/month**

[Cost Details →](./docs/deployment.md#cost-summary)

---

## 🎯 SDG Alignment

### SDG 8: Decent Work and Economic Growth
- ✅ Membantu UMKM mengelola keuangan efisien
- ✅ Menyediakan insight bisnis untuk pertumbuhan
- ✅ Automasi pencatatan mengurangi beban administrasi

### SDG 12: Responsible Consumption and Production
- ✅ Tracking pengeluaran untuk konsumsi bertanggung jawab
- ✅ Analisis pola konsumsi dengan AI
- ✅ Budget alerts untuk kontrol pengeluaran

---

## 🔧 Development

### Backend Tests

```bash
cd backend
go test -v ./...
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Build for Production

```bash
# Backend
cd backend
go build -o main cmd/server/main.go

# Frontend
cd frontend
npm run build
```

---

## 🚢 Deployment

### Option 1: Simple (Public Subnet)

**Best for:** MVP, Demo, UAS

```bash
# Deploy to EC2 with public IP
# Follow: docs/deployment.md → Section A
```

**Cost:** ~$9/month

---

### Option 2: Production (Private Subnet + VPC Endpoint)

**Best for:** Production, Real Business

```bash
# Deploy with Private Subnet + Bastion + VPC Endpoint
# Follow: docs/deployment.md → Section B
```

**Cost:** ~$13/month (with high security)

**Features:**
- ✅ Backend isolated in private subnet
- ✅ Bastion host for secure SSH access
- ✅ VPC Endpoint S3 (FREE, replaces NAT Gateway)
- ✅ API Gateway for public access
- ✅ CloudFlare DDoS protection

[Full Deployment Guide →](./docs/deployment.md)

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request
6. Wait for CI/CD to pass ✅
7. Get review & approval
8. Merge to develop → auto-deploy to staging

**Branch Strategy:**
```
main (production)
  ↑ merge from tags only
develop (staging)
  ↑ merge from feature branches
feature/* (development)
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 👥 Team

**FinLapor** - Semester 7 UAS Project

**Tech Stack:**
- Go + Fiber (Backend)
- Next.js 14 + TypeScript (Frontend)
- PostgreSQL + Redis (Database)
- HuggingFace AI (OCR + Chat)
- AWS + CloudFlare (Infrastructure)
- GitHub Actions (CI/CD)

---

## 📞 Support

- 📧 Email: support@finlapor.com
- 🐛 Issues: [GitHub Issues](https://github.com/aan-andiyanaS/finlapor/issues)
- 📖 Docs: [Documentation](./docs/)
- 💬 Discussions: [GitHub Discussions](https://github.com/aan-andiyanaS/finlapor/discussions)

---

## 🎓 For Students/Educators

**FinLapor as Learning Material:**
- ✅ Production-ready architecture
- ✅ Real CI/CD implementation
- ✅ Cost-optimized AWS deployment
- ✅ AI integration (HuggingFace)
- ✅ Modern web development (Next.js 14)
- ✅ RESTful API best practices
- ✅ Database migrations & management
- ✅ Comprehensive documentation

**Topics Covered:**
- Full-stack development (Go + React)
- Cloud deployment (AWS)
- CI/CD automation (GitHub Actions)
- AI/ML integration (HuggingFace)
- Security best practices
- Cost optimization strategies

---

## ⭐ Features Roadmap

- [x] User authentication & authorization
- [x] Transaction CRUD with real database
- [x] AI-powered OCR for receipt scanning
- [x] AI chat assistant for financial advice
- [x] Auto-categorization with AI
- [x] Dashboard with real-time data
- [x] CI/CD pipeline with GitHub Actions
- [x] Production-ready deployment guides
- [ ] Mobile app (React Native)
- [ ] Export to Excel/PDF
- [ ] Multi-currency support
- [ ] Expense splitting for groups
- [ ] Integration with banks API

---

**Made with ❤️ for better financial management**

**Status:** ✅ Production-Ready | 🚀 CI/CD Enabled | 📊 Fully Documented
