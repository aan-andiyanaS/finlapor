# FinLapor 💰

> **AI-Powered Financial Management Platform for Individuals & SMEs**

FinLapor adalah aplikasi pengelolaan keuangan berbasis AI yang mendukung **SDG 8** (Decent Work and Economic Growth) dan **SDG 12** (Responsible Consumption and Production).

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![Go](https://img.shields.io/badge/Go-1.21-00ADD8?style=flat&logo=go)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)
![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20Lambda%20%7C%20S3-FF9900?style=flat&logo=amazon-aws)
![CloudFlare](https://img.shields.io/badge/CloudFlare-Pages-F38020?style=flat&logo=cloudflare)

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 📊 **Dashboard Interaktif** | Visualisasi keuangan dengan grafik dan statistik real-time |
| 📷 **Scan Struk Otomatis** | OCR dengan AI untuk ekstraksi data dari foto struk |
| 💬 **Asisten AI Cerdas** | Chatbot untuk analisis keuangan dan saran personal |
| 📈 **Laporan Komprehensif** | Generate laporan PDF/Excel dengan satu klik |
| 🏷️ **Kategorisasi Otomatis** | AI kategorisasi transaksi berdasarkan deskripsi |
| 🔔 **Budget Alert** | Notifikasi saat pengeluaran melebihi budget |
| 🌙 **Dark/Light Mode** | Tema yang nyaman untuk mata |
| 📱 **Responsive Design** | Optimal di desktop, tablet, dan mobile |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (TypeScript, Static Export)
- **Styling**: Tailwind CSS + Custom Design System
- **State**: Zustand + React Query
- **UI Components**: shadcn/ui

### Backend
- **Language**: Go 1.21
- **Framework**: Fiber v2
- **ORM**: GORM
- **Auth**: JWT

### Database & Cache
- **Database**: PostgreSQL 16
- **Cache**: Redis 7

### AI & ML
- **Runtime**: AWS Lambda (Python)
- **OCR Model**: Donut (HuggingFace)
- **LLM**: Mistral 7B Instruct

### Infrastructure
- **Frontend Hosting**: CloudFlare Pages
- **Backend Hosting**: AWS EC2
- **Object Storage**: AWS S3
- **CDN & Security**: CloudFlare

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
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
docker-compose up -d postgres redis
```

### 3. Run Backend

```bash
cd backend
cp ../.env.example .env
# Edit .env sesuaikan database credentials
go run cmd/server/main.go
```

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Open App

```
Frontend: http://localhost:3000
Backend:  http://localhost:8080
```

---

## 📁 Project Structure

```
finlapor/
├── frontend/                 # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── login/       # Login page
│   │   │   ├── register/    # Registration page
│   │   │   └── dashboard/   # Dashboard & features
│   │   └── components/      # Reusable components
│   └── package.json
│
├── backend/                  # Go Backend
│   ├── cmd/server/          # Main entry point
│   └── internal/
│       ├── config/          # Configuration
│       ├── handlers/        # HTTP handlers
│       ├── middleware/      # Auth middleware
│       ├── models/          # Database models
│       ├── repository/      # Data access layer
│       └── services/        # Business logic
│
├── ai-service/              # Python Lambda Functions
│   ├── lambda_function.py   # Main handler
│   └── serverless.yml       # Deployment config
│
├── database/                # Database files
│   ├── migrations/          # SQL migrations
│   └── seeds/               # Sample data
│
├── docs/                    # Documentation
│   ├── getting-started.md   # Setup guide
│   ├── architecture.md      # System design
│   ├── api-reference.md     # API documentation
│   ├── deployment.md        # Production deployment
│   └── user-manual.md       # End user guide
│
├── docker-compose.yml       # Docker configuration
├── Makefile                 # Automation scripts
└── README.md                # This file
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](./docs/getting-started.md) | Panduan lengkap setup development |
| [Architecture](./docs/architecture.md) | Diagram sistem dan tech stack |
| [API Reference](./docs/api-reference.md) | Dokumentasi semua endpoints |
| [Deployment](./docs/deployment.md) | Setup AWS, CloudFlare, production |
| [User Manual](./docs/user-manual.md) | Panduan penggunaan aplikasi |

---

## 🔧 Available Commands

### Using Makefile

```bash
make dev          # Start all services
make stop         # Stop all services
make build        # Build for production
make test         # Run tests
make logs         # View logs
make migrate-up   # Run database migrations
make seed         # Load sample data
```

### Manual Commands

```bash
# Database
docker-compose up -d postgres redis
docker-compose down

# Backend
cd backend && go run cmd/server/main.go
cd backend && go build -o main cmd/server/main.go

# Frontend
cd frontend && npm run dev
cd frontend && npm run build
```

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ocr/scan` | Scan receipt with OCR |
| POST | `/api/chat` | AI chat assistant |

[Full API Reference →](./docs/api-reference.md)

---

## 💰 Cost Estimation

| Service | Monthly Cost |
|---------|-------------|
| AWS EC2 t3.micro | ~$8.50 |
| AWS S3 (5GB) | ~$0.12 |
| AWS Lambda | Free tier |
| CloudFlare Pages | Free |
| **Total** | **~$9-10/month** |

---

## 🎯 SDG Alignment

### SDG 8: Decent Work and Economic Growth
- Membantu UMKM mengelola keuangan dengan efisien
- Menyediakan insight bisnis untuk pertumbuhan

### SDG 12: Responsible Consumption and Production
- Tracking pengeluaran untuk konsumsi yang bertanggung jawab
- Analisis pola konsumsi dengan AI

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 👥 Team

**FinLapor** - Semester 7 UAS Project

---

## 📞 Support

- 📧 Email: support@finlapor.com
- 🐛 Issues: [GitHub Issues](https://github.com/aan-andiyanaS/finlapor/issues)
- 📖 Docs: [Documentation](./docs/)
