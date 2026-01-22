# 💰 FinLapor

<div align="center">

![FinLapor Logo](docs/assets/logo.png)

### Aplikasi Manajemen Keuangan dengan AI

**Scan struk → Otomatis tercatat → Laporan instan**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Go](https://img.shields.io/badge/Go-1.21-00ADD8?logo=go)](https://golang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Demo](https://finlapor.com) • [Dokumentasi](docs/) • [Kontribusi](#kontribusi)

</div>

---

## 🎯 Tentang FinLapor

**FinLapor** adalah aplikasi manajemen keuangan berbasis web yang membantu individu dan UMKM mengelola keuangan dengan mudah. Dilengkapi dengan teknologi **AI** untuk scan struk otomatis dan asisten keuangan cerdas.

### Mendukung SDG (Sustainable Development Goals)

| SDG | Kontribusi |
|-----|-----------|
| 🎯 **SDG 8** - Decent Work and Economic Growth | Membantu UMKM mengelola keuangan dengan lebih baik |
| 🌍 **SDG 12** - Responsible Consumption | Tracking pengeluaran untuk konsumsi yang bertanggung jawab |

---

## ✨ Fitur Utama

### 📷 Scan Struk Otomatis (OCR)
Upload foto struk/kuitansi, AI akan mengekstrak data secara otomatis:
- Tanggal transaksi
- Nama toko/vendor
- Total belanja
- Daftar item

### 🤖 Asisten Keuangan AI
Chatbot cerdas yang bisa:
- Menjawab pertanyaan tentang keuangan Anda
- Memberikan insight pengeluaran
- Saran penghematan personal

### 📊 Dashboard Interaktif
- Visualisasi pemasukan vs pengeluaran
- Breakdown per kategori
- Trend bulanan

### 📈 Laporan Keuangan
- Laporan Laba Rugi
- Neraca (untuk mode bisnis)
- Export ke PDF & Excel

### 🎨 UI Modern
- Dark/Light theme
- Responsive (mobile-friendly)
- Desain profesional namun ramah pengguna

---

## 🏗️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Go, Fiber, PostgreSQL, Redis |
| **AI Service** | AWS Lambda, Hugging Face API |
| **Storage** | AWS S3 |
| **Hosting** | CloudFlare Pages, AWS EC2 |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Go 1.21+
- Docker & Docker Compose
- Git

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/finlapor.git
cd finlapor
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

### 3. Jalankan dengan Docker
```bash
docker-compose up -d
```

### 4. Akses Aplikasi
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- MinIO Console: http://localhost:9001

📖 Untuk panduan lengkap, lihat [Getting Started](docs/getting-started.md)

---

## 📁 Struktur Project

```
finlapor/
├── frontend/          # Next.js application
├── backend/           # Go API server
├── ai-service/        # Python Lambda functions
├── database/          # Migrations & seeds
├── docker/            # Docker configurations
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── docker-compose.yml
```

---

## 📖 Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [Getting Started](docs/getting-started.md) | Panduan instalasi lengkap |
| [Architecture](docs/architecture.md) | Arsitektur sistem |
| [API Reference](docs/api-reference.md) | Dokumentasi API |
| [Deployment](docs/deployment.md) | Panduan deployment |
| [User Manual](docs/user-manual.md) | Panduan pengguna |

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan.

---

## 📄 Lisensi

Project ini dilisensikan di bawah [MIT License](LICENSE).

---

## 👨‍💻 Author

Made with ❤️ for SDGs

---

<div align="center">

**[⬆ Kembali ke atas](#-finlapor)**

</div>
