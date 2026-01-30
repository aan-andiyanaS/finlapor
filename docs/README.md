# Dokumentasi FinLapor

Selamat datang di dokumentasi FinLapor! Pilih panduan sesuai kebutuhan Anda.

---

## 📚 Panduan Tersedia

| Dokumen | Untuk Siapa | Isi |
|---------|-------------|-----|
| [🛠️ Local Development](./local-development.md) | Developer | Setup lokal dengan Docker (PostgreSQL, Redis, Local Storage) |
| [🚀 Getting Started](./getting-started.md) | Developer | Setup environment development lengkap |
| [🏗️ Architecture](./architecture.md) | Developer/Architect | Diagram sistem, tech stack, database schema |
| [📡 API Reference](./api-reference.md) | Developer | Dokumentasi lengkap semua endpoints |
| [☁️ Deployment](./deployment.md) | DevOps/Developer | Deploy ke AWS & CloudFlare step-by-step |
| [🔄 CI/CD](./cicd.md) | DevOps | Pipeline GitHub Actions |
| [📱 User Manual](./user-manual.md) | End User | Cara menggunakan aplikasi |

---

## 🗺️ Quick Navigation

### 🆕 Mau Coba Lokal Dulu?

1. **Baca [Local Development Guide](./local-development.md)** - Setup dengan Docker dalam 10 menit
2. Clone repo, jalankan `docker compose up -d`, start frontend
3. Akses http://localhost:3000

### Untuk Developer Baru

1. Baca [Getting Started](./getting-started.md) untuk setup lengkap
2. Pahami [Architecture](./architecture.md) untuk gambaran sistem
3. Lihat [API Reference](./api-reference.md) saat coding

### Untuk Deploy ke Production

1. Ikuti [Deployment](./deployment.md) section by section:
   - **Opsi A**: Public Subnet (Sederhana, ~$25/bulan)
   - **Opsi B**: Private Subnet + API Gateway (Aman, ~$35/bulan)

### Untuk End User

1. Baca [User Manual](./user-manual.md) untuk tutorial penggunaan

---

## 🔧 Tech Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui         │
│                  (CloudFlare Pages)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│         Go + Fiber + GORM + JWT Authentication              │
│                     (AWS EC2)                               │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │PostgreSQL│   │  Redis   │   │   S3     │
        │    16    │   │    7     │   │ Storage  │
        └──────────┘   └──────────┘   └──────────┘
              
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       AI SERVICE                            │
│        Python + HuggingFace (Donut OCR + Mistral LLM)       │
│                     (AWS Lambda)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📞 Butuh Bantuan?

- **Bug/Error**: Buat issue di [GitHub](https://github.com/aan-andiyanaS/finlapor/issues)
- **Questions**: Baca FAQ di [User Manual](./user-manual.md#faq)
- **Contact**: support@finlapor.airi.click
