# CI/CD

FinLapor menggunakan GitHub Actions untuk automasi CI/CD.

## Workflows

| Workflow | Trigger | Fungsi |
|----------|---------|--------|
| `backend-ci.yml` | Push/PR ke main/develop | Test & build backend |
| `frontend-ci.yml` | Push/PR ke main/develop | Lint, test & build frontend |
| `deploy-staging.yml` | Push ke develop | Deploy ke staging |
| `deploy-production.yml` | Version tags (v*) | Deploy ke production |

## Setup

1. **Configure GitHub Secrets:**
   - Copy `.github/secrets.example`
   - Add secrets di: Repository Settings > Secrets and variables > Actions

2. **Required Secrets:**
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - `SSH_PRIVATE_KEY_STAGING`, `SSH_PRIVATE_KEY_PROD`
   - `EC2_HOST_STAGING`, `EC2_HOST_PROD`
   - `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
   - `DATABASE_URL_PROD`

3. **Deploy:**
   ```bash
   # Staging (automatic)
   git push origin develop
   
   # Production (manual)
   git tag v1.0.0
   git push origin v1.0.0
   ```

## Features

- ✅ Automated testing (backend & frontend)
- ✅ Build artifacts
- ✅ Database backup before production deploy
- ✅ Health checks after deployment
- ✅ Automatic rollback on failure
- ✅ Slack notifications

Lihat [cicd-guide.md](../cicd-guide.md) untuk panduan lengkap.
