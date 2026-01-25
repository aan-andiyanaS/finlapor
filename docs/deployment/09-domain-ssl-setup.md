# 🔗 Setup Domain & SSL

Konfigurasi custom domain dan SSL certificate untuk FinLapor.

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Domain di CloudFlare](#1-domain-di-cloudflare)
3. [SSL Configuration](#2-ssl-configuration)
4. [DNS Records](#3-dns-records)
5. [Troubleshooting](#4-troubleshooting)

---

## Overview

### Struktur Domain FinLapor

| Subdomain | Service | Hosting |
|-----------|---------|---------|
| `finlapor.airi.click` | Frontend | CloudFlare Pages |
| `api.finlapor.airi.click` | Backend API | EC2 via CloudFlare Proxy |
| `www.finlapor.airi.click` | Redirect ke main | CloudFlare Redirect |

### Tanpa Custom Domain

Jika tidak punya domain, bisa menggunakan:
- Frontend: `finlapor.pages.dev` (gratis dari CloudFlare Pages)
- Backend: `[EC2_PUBLIC_IP]:8080` (tidak ideal untuk production)

---

## 1. Domain di CloudFlare

> **📝 Skip jika sudah ada domain di CloudFlare**

### Step 1.1: Beli Domain (Jika Belum Punya)

Opsi registrar:
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) - Recommended
- [Namecheap](https://www.namecheap.com/)
- [Niagahoster](https://www.niagahoster.co.id/)
- [GoDaddy](https://www.godaddy.com/)

### Step 1.2: Add Domain ke CloudFlare

1. CloudFlare Dashboard → **Add a site**
2. Masukkan domain: `airi.click`
3. Pilih plan: **Free**
4. CloudFlare akan scan DNS records existing

### Step 1.3: Update Nameservers

Di registrar domain Anda:
1. Cari setting DNS/Nameservers
2. Ganti ke nameservers CloudFlare:
   ```
   brad.ns.cloudflare.com
   linda.ns.cloudflare.com
   ```
3. Tunggu propagasi (5 menit - 48 jam)

### Step 1.4: Verifikasi

CloudFlare Dashboard → Domain status: **Active** ✅

---

## 2. SSL Configuration

### Step 2.1: SSL/TLS Mode

CloudFlare Dashboard → Domain → **SSL/TLS** → **Overview**

| Mode | Keamanan | Kapan Pakai |
|------|----------|-------------|
| Off | ❌ Tidak aman | Jangan! |
| Flexible | ⚠️ Partial | Frontend HTTPS, backend HTTP |
| **Full** | ✅ Recommended | Backend punya SSL (self-signed OK) |
| Full (Strict) | ✅✅ Terbaik | Backend punya SSL valid |

**Pilih: Full** (atau Full Strict jika backend punya SSL valid)

### Step 2.2: Edge Certificates

SSL/TLS → **Edge Certificates**:

| Setting | Value |
|---------|-------|
| Always Use HTTPS | ✅ On |
| HTTP Strict Transport Security (HSTS) | ✅ Enable |
| Minimum TLS Version | TLS 1.2 |
| Opportunistic Encryption | ✅ On |
| TLS 1.3 | ✅ On |

### Step 2.3: HSTS Configuration

Jika enable HSTS:
```
Max Age: 6 months (15768000)
Include subdomains: Yes
Preload: Yes (opsional, tidak bisa di-undo!)
No-Sniff Header: Yes
```

---

## 3. DNS Records

### Step 3.1: Setup DNS Records

CloudFlare Dashboard → Domain → **DNS** → **Records**

**Tambahkan records berikut:**

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | `api` | `[EC2_PUBLIC_IP]` | ☁️ Proxied | Auto |
| CNAME | `www` | `finlapor.airi.click` | ☁️ Proxied | Auto |
| CNAME | `finlapor` | `finlapor.pages.dev` | ☁️ Proxied | Auto |

> **📝 Note:** Record untuk `finlapor` subdomain mungkin sudah otomatis dibuat saat setup CloudFlare Pages.

### Step 3.2: Apex Domain (opsional)

Jika ingin `airi.click` (tanpa subdomain) mengarah ke app:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | `finlapor.pages.dev` | ☁️ Proxied |

> CloudFlare supports CNAME flattening untuk apex domain.

### Step 3.3: WWW Redirect

Untuk redirect `www` ke non-www:

1. **Rules** → **Redirect Rules** → Create rule
2. Konfigurasi:
   ```
   If: Hostname equals www.finlapor.airi.click
   Then: Dynamic Redirect to
         https://finlapor.airi.click{http.request.uri}
   Status: 301 (Permanent)
   ```

---

## 4. Troubleshooting

### Error: DNS not resolving

**Gejala:** `nslookup finlapor.airi.click` gagal

**Cek:**
1. Nameservers sudah diupdate?
2. Propagasi DNS (tunggu sampai 48 jam)
3. Record sudah ditambah di CloudFlare?

**Debug:**
```bash
# Cek nameservers
nslookup -type=NS airi.click

# Cek record
nslookup finlapor.airi.click
nslookup api.finlapor.airi.click
```

### Error: ERR_SSL_PROTOCOL_ERROR

**Gejala:** Browser error SSL

**Penyebab:** SSL mode tidak sesuai

**Solusi:**
1. SSL/TLS → Set ke **Full** (bukan Flexible)
2. Atau pastikan backend serve HTTPS

### Error: Too many redirects

**Gejala:** Browser infinite redirect loop

**Penyebab:** SSL mode Flexible + backend redirect HTTP to HTTPS

**Solusi:**
1. SSL/TLS → Set ke **Full**
2. Atau disable redirect di backend

### Error: Certificate not valid

**Gejala:** Browser warning "Not Secure"

**Solusi:**
1. Pastikan proxy enabled (orange cloud ☁️)
2. Tunggu certificate provisioning (sampai 15 menit)
3. Clear browser cache

### Mixed Content Warning

**Gejala:** Console error "Mixed Content"

**Penyebab:** HTTPS page loading HTTP resources

**Solusi:**
1. Pastikan semua API calls ke `https://`
2. Update `NEXT_PUBLIC_API_URL` di frontend
3. SSL/TLS → Edge Certificates → Automatic HTTPS Rewrites: On

---

## Custom Domain untuk CloudFlare Pages

### Step: Add Custom Domain to Pages

1. CloudFlare Dashboard → **Pages**
2. Pilih project `finlapor`
3. **Custom domains** → **Set up a custom domain**
4. Masukkan: `finlapor.airi.click`
5. CloudFlare auto-create DNS record dan provision SSL

---

## ✅ Checklist

- [ ] Domain added to CloudFlare
- [ ] Nameservers updated di registrar
- [ ] Domain status: Active
- [ ] SSL mode: Full (atau Full Strict)
- [ ] Always Use HTTPS: On
- [ ] DNS record `api` pointing to EC2
- [ ] DNS record frontend pointing to Pages
- [ ] SSL certificate working (no warnings)
- [ ] WWW redirect configured (opsional)

---

## Result

Setelah konfigurasi selesai:

| URL | Function |
|-----|----------|
| `https://finlapor.airi.click` | Frontend app |
| `https://api.finlapor.airi.click/health` | Backend health check |
| `https://www.finlapor.airi.click` | Redirect ke main |

---

## Next Step

Lanjut ke → [10. Monitoring](./10-monitoring.md)
