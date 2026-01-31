# ☁️ Setup CloudFlare (Frontend & API Proxy)

Panduan lengkap konfigurasi CloudFlare untuk hosting frontend dan proxy API backend.

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Membuat Akun CloudFlare](#1-membuat-akun-cloudflare)
3. [Menambahkan Domain](#2-menambahkan-domain-opsional)
4. [Setup CloudFlare Pages (Frontend)](#3-setup-cloudflare-pages-frontend)
5. [Setup CloudFlare Proxy (API)](#4-setup-cloudflare-proxy-api)
6. [Konfigurasi SSL/TLS](#5-konfigurasi-ssltls)
7. [Security Settings](#6-security-settings)
8. [Troubleshooting](#7-troubleshooting)

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLOUDFLARE SERVICES                               │
├─────────────────────────────────────┬───────────────────────────────────────┤
│       CLOUDFLARE PAGES              │        CLOUDFLARE PROXY               │
│                                     │                                       │
│  📍 finlapor.airi.click             │  📍 api.finlapor.airi.click           │
│                                     │                                       │
│  ┌─────────────────────────────┐    │  ┌─────────────────────────────┐      │
│  │   Next.js Static Export    │    │  │   DDoS Protection           │      │
│  │   - HTML/CSS/JS files      │    │  │   - Rate Limiting           │      │
│  │   - Global CDN             │    │  │   - WAF (Firewall)          │      │
│  │   - Auto SSL               │    │  │   - SSL Termination         │      │
│  │   - Preview Deployments    │    │  │   - Caching                 │      │
│  └─────────────────────────────┘    │  └──────────────┬──────────────┘      │
│              │                      │                 │                     │
└──────────────┼──────────────────────┴─────────────────┼─────────────────────┘
               │                                        │
               ▼                                        ▼
         User Browser                          AWS API Gateway / EC2
```

### Mengapa CloudFlare?

| Fitur | Keuntungan | Biaya |
|-------|-----------|-------|
| **Pages** | Hosting frontend gratis dengan CI/CD | $0 |
| **CDN** | Konten di-cache di 300+ lokasi global | $0 |
| **DDoS Protection** | Perlindungan otomatis dari serangan | $0 |
| **SSL/TLS** | HTTPS otomatis, sertifikat gratis | $0 |
| **DNS** | DNS tercepat di dunia (1.1.1.1) | $0 |

---

## 1. Membuat Akun CloudFlare

### Step 1.1: Daftar Akun

1. Buka [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Masukkan:
   - **Email**: Email aktif Anda
   - **Password**: Minimal 8 karakter
3. Klik **Create Account**
4. Cek email → Klik link verifikasi

### Step 1.2: Dashboard Overview

Setelah login, Anda akan melihat dashboard:

```
┌─────────────────────────────────────────────────────────────────┐
│  CloudFlare Dashboard                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Websites      │  │   Pages         │  │   Workers       │  │
│  │   (Domains)     │  │   (Frontend)    │  │   (Edge Code)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   R2 Storage    │  │   Stream        │  │   Images        │  │
│  │   (Object)      │  │   (Video)       │  │   (CDN)         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Yang akan kita gunakan:**
- ✅ **Pages** - Untuk hosting frontend Next.js
- ✅ **Websites** - Untuk DNS dan proxy API (jika punya domain)

---

## 2. Menambahkan Domain (Opsional)

> **📝 Catatan:** Jika Anda **TIDAK PUNYA domain sendiri**, bisa langsung ke [Step 3](#3-setup-cloudflare-pages-frontend). CloudFlare Pages memberikan subdomain gratis: `[project-name].pages.dev`

### Step 2.1: Add Site

1. Dashboard → **Add a Site**
2. Masukkan domain Anda: `airi.click` (contoh)
3. Pilih plan: **Free** → Continue

### Step 2.2: Review DNS Records

CloudFlare akan scan DNS records yang ada. Biarkan default atau edit sesuai kebutuhan.

### Step 2.3: Update Nameservers

CloudFlare akan memberikan 2 nameservers:
```
brad.ns.cloudflare.com
linda.ns.cloudflare.com
```

**Update di registrar domain Anda:**
1. Login ke tempat beli domain (Niagahoster, Namecheap, dll)
2. Cari pengaturan **Nameservers** atau **DNS**
3. Ganti ke nameservers CloudFlare
4. Tunggu propagasi (5 menit - 24 jam)

### Step 2.4: Verifikasi Status

Kembali ke CloudFlare → Status domain akan berubah menjadi **Active** (ikon hijau).

> **⚠️ Jika tidak berubah Active:**
> - Pastikan nameservers sudah benar
> - Tunggu hingga 24 jam
> - Klik "Re-check now" di CloudFlare

---

## 3. Setup CloudFlare Pages (Frontend)

### Step 3.1: Create Pages Project

1. Dashboard → **Pages** (sidebar kiri)
2. Klik **Create a project**
3. Pilih **Connect to Git**

### Step 3.2: Connect GitHub Repository

1. Klik **Connect GitHub**
2. Authorize CloudFlare (jika pertama kali)
3. Pilih repository: `aan-andiyanaS/finlapor`
4. Klik **Begin setup**

### Step 3.3: Build Configuration

Isi konfigurasi build:

| Field | Value | Penjelasan |
|-------|-------|------------|
| **Project name** | `finlapor` | Akan jadi URL: `finlapor.pages.dev` |
| **Production branch** | `main` | Branch yang auto-deploy |
| **Framework preset** | `Next.js (Static HTML Export)` | Pilih ini! |
| **Build command** | `npm run build` | Command untuk build |
| **Build output directory** | `out` | Folder hasil build |
| **Root directory** | `frontend` | Karena frontend di subfolder |

### Step 3.4: Environment Variables

Klik **Add variable** untuk menambahkan:

| Variable | Value | Keterangan |
|----------|-------|------------|
| `NEXT_PUBLIC_API_URL` | `https://api.finlapor.airi.click` | URL backend API |
| `NEXT_PUBLIC_APP_NAME` | `FinLapor` | Nama aplikasi |
| `NODE_VERSION` | `18` | Versi Node.js |

> **⚠️ PENTING:** Semua variable yang diakses di client **HARUS** prefix `NEXT_PUBLIC_`

### Step 3.5: Deploy

1. Klik **Save and Deploy**
2. Tunggu build selesai (2-5 menit)
3. Setelah sukses, akses: `https://finlapor.pages.dev`

### Step 3.6: Custom Domain (Opsional)

Jika punya domain sendiri:

1. Pages → Project → **Custom domains**
2. Klik **Set up a custom domain**
3. Masukkan: `finlapor.airi.click`
4. CloudFlare akan otomatis membuat DNS record
5. Tunggu SSL provisioning (beberapa menit)

### Step 3.7: Preview Deployments

Setiap **Pull Request** akan otomatis mendapat preview URL:
- Format: `[commit-hash].finlapor.pages.dev`
- Berguna untuk testing sebelum merge

---

## 4. Setup CloudFlare Proxy (API)

### Apa itu CloudFlare Proxy?

```
Tanpa Proxy:
User ──────────────────────────────────► EC2/API Gateway
         (Langsung, tanpa perlindungan)

Dengan Proxy (Orange Cloud ☁️):
User ───► CloudFlare ───► EC2/API Gateway
          - DDoS protection
          - SSL termination
          - Caching
          - Rate limiting
```

### Step 4.1: Buat DNS Record untuk API

1. Dashboard → Pilih domain → **DNS**
2. Klik **Add record**
3. Isi:

| Field | Value untuk Opsi A | Value untuk Opsi B |
|-------|-------------------|-------------------|
| **Type** | A | CNAME |
| **Name** | api | api |
| **Content** | `[EC2_PUBLIC_IP]` | `[API_GATEWAY_URL]` |
| **Proxy status** | ☁️ Proxied (orange) | ☁️ Proxied (orange) |
| **TTL** | Auto | Auto |

**Contoh:**
```
Type: A
Name: api
Content: 54.123.45.67
Proxy: Proxied ☁️
```

> **📌 Catatan Penting:**
> - **Proxied (Orange Cloud)** = Traffic melewati CloudFlare → Dapat proteksi
> - **DNS Only (Gray Cloud)** = Traffic langsung ke server → Tanpa proteksi

### Step 4.2: Verifikasi DNS

Tunggu beberapa menit, lalu test:

```bash
# Cek DNS resolution
nslookup api.finlapor.airi.click

# Cek API response
curl -I https://api.finlapor.airi.click/health
```

**Response yang diharapkan:**
```
HTTP/2 200
server: cloudflare
cf-ray: xxxxxxxx
```

> Adanya header `server: cloudflare` dan `cf-ray` menandakan traffic melewati CloudFlare.

---

## 5. Konfigurasi SSL/TLS

### Step 5.1: SSL/TLS Mode

1. Dashboard → Domain → **SSL/TLS** → **Overview**
2. Pilih mode:

| Mode | Keamanan | Kapan Pakai |
|------|----------|-------------|
| **Off** | ❌ Tidak aman | Jangan pakai! |
| **Flexible** | ⚠️ Partial | CloudFlare→User HTTPS, CloudFlare→Server HTTP |
| **Full** | ✅ Bagus | Server punya SSL (self-signed OK) |
| **Full (Strict)** | ✅✅ Terbaik | Server punya SSL valid (CA signed) |

**Rekomendasi:**
- Gunakan **Full (Strict)** jika API Gateway/EC2 punya SSL valid
- Gunakan **Full** jika pakai self-signed certificate
- **HINDARI Flexible** karena backend tetap HTTP

### Step 5.2: Edge Certificates

SSL/TLS → **Edge Certificates**:

| Setting | Recommended |
|---------|-------------|
| Always Use HTTPS | ✅ On |
| HTTP Strict Transport Security (HSTS) | ✅ Enable |
| Minimum TLS Version | TLS 1.2 |
| Opportunistic Encryption | ✅ On |
| TLS 1.3 | ✅ On |

### Step 5.3: Origin Certificates (Opsional)

Jika backend butuh SSL certificate gratis dari CloudFlare:

1. SSL/TLS → **Origin Server**
2. **Create Certificate**
3. Copy certificate dan private key
4. Install di server (EC2/Nginx)

---

## 6. Security Settings

### Step 6.1: WAF (Web Application Firewall)

1. **Security** → **WAF**
2. Enable **Managed Rules** (gratis, basic protection)

### Step 6.2: Rate Limiting

1. **Security** → **WAF** → **Rate limiting rules**
2. Klik **Create rule**

**Contoh rule untuk API:**
```
Rule name: API Rate Limit
If: URI Path contains "/api/"
Then: Block
Rate: 100 requests per 1 minute
```

### Step 6.3: Bot Management

1. **Security** → **Bots**
2. Enable **Bot Fight Mode** (gratis)

### Step 6.4: Security Level

1. **Security** → **Settings**
2. Security Level: **Medium** (recommended)

| Level | Keterangan |
|-------|------------|
| Essentially Off | Hampir tidak ada filtering |
| Low | Hanya blokir bot sangat jahat |
| **Medium** | Balanced (recommended) |
| High | Banyak CAPTCHA challenge |
| I'm Under Attack! | Mode darurat, semua kena CAPTCHA |

---

## 7. Troubleshooting

> **📖 Panduan lengkap:** Lihat [Troubleshooting Guide](../troubleshooting.md) untuk detail lengkap error CloudFlare.

### Quick Reference

| Error | Penyebab | Quick Fix |
|-------|----------|-----------|
| **522** Connection Timed Out | EC2/Backend mati | Start instance, cek `docker ps` |
| **524** Timeout Occurred | Request > 100 detik | Optimasi API lambat |
| **521** Web Server Down | Backend reject connection | Pastikan bind ke `0.0.0.0:8080` |
| **526** Invalid SSL | SSL mode salah | Set ke **Full** (bukan Strict) |
| DNS tidak resolve | Nameserver belum update | Tunggu propagasi, flush DNS |
| Pages build failed | Cek build logs | Test `npm run build` lokal |
| CORS error | Origin tidak diizinkan | Update CORS config di backend |

**Lihat detail lengkap di → [troubleshooting.md](../troubleshooting.md)**

---


## Ringkasan Konfigurasi

| Komponen | URL | Konfigurasi |
|----------|-----|-------------|
| Frontend | `finlapor.pages.dev` / `finlapor.airi.click` | CloudFlare Pages, auto-deploy dari `main` |
| API | `api.finlapor.airi.click` | DNS A record → EC2 IP, Proxied ☁️ |
| SSL | - | Full (Strict), TLS 1.2+ |
| Security | - | WAF enabled, Medium security level |

---

## Next Steps

Setelah CloudFlare selesai dikonfigurasi:

- → [Setup Domain & SSL](./09-domain-ssl-setup.md) - Konfigurasi custom domain
- → [Monitoring](./10-monitoring.md) - Setup monitoring dan alerts
- ← [EC2 Backend Setup](./06-ec2-backend-setup.md) - Kembali ke setup backend

---

> **📌 Tips:**
> - Selalu gunakan **Proxied (Orange Cloud)** untuk production
> - Enable **Always Use HTTPS** untuk keamanan
> - Monitor **Analytics** di CloudFlare untuk melihat traffic
