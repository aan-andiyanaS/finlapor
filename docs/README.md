# Dokumentasi FinLapor

Selamat datang di dokumentasi FinLapor! Pilih panduan sesuai kebutuhan Anda.

---

## 📚 Panduan Tersedia

| Dokumen | Untuk Siapa | Isi |
|---------|-------------|-----|
| [🚀 Getting Started](./getting-started.md) | Developer | Setup environment development dari awal |
| [🏗️ Architecture](./architecture.md) | Developer/Architect | Diagram sistem, tech stack, database schema |
| [📡 API Reference](./api-reference.md) | Developer | Dokumentasi lengkap semua endpoints |
| [☁️ Deployment](./deployment.md) | DevOps/Developer | Deploy ke AWS & CloudFlare step-by-step |
| [📱 User Manual](./user-manual.md) | End User | Cara menggunakan aplikasi |

---

## 🗺️ Quick Navigation

### Untuk Developer Baru

1. Baca [Getting Started](./getting-started.md) untuk setup lokal
2. Pahami [Architecture](./architecture.md) untuk gambaran sistem
3. Lihat [API Reference](./api-reference.md) saat coding

### Untuk Deploy ke Production

1. Ikuti [Deployment](./deployment.md) section by section:
   - Setup AWS Account
   - Setup CloudFlare
   - Deploy Backend ke EC2
   - Deploy AI ke Lambda
   - Deploy Frontend ke CloudFlare Pages

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
- **Contact**: support@finlapor.com
