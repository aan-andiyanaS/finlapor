# 📊 Monitoring & Maintenance

Panduan monitoring, logging, dan maintenance untuk FinLapor production.

---

## 📑 Daftar Isi

1. [CloudWatch Monitoring](#1-cloudwatch-monitoring)
2. [CloudFlare Analytics](#2-cloudflare-analytics)
3. [Alerts & Notifications](#3-alerts--notifications)
4. [Cost Monitoring](#4-cost-monitoring)
5. [Maintenance Tasks](#5-maintenance-tasks)

---

## 1. CloudWatch Monitoring

### EC2 Metrics

1. AWS Console → **CloudWatch** → **Metrics** → **EC2**
2. Metrics penting:

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPUUtilization | > 80% sustained | Upgrade instance type |
| NetworkIn/Out | Spike unusual | Check for attack/bug |
| StatusCheckFailed | > 0 | Instance health issue |

### RDS Metrics

CloudWatch → Metrics → **RDS**:

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPUUtilization | > 80% | Upgrade DB class |
| FreeStorageSpace | < 2GB | Increase storage |
| DatabaseConnections | Near limit | Optimize connections |
| ReadIOPS/WriteIOPS | High | Consider provisioned IOPS |

### Lambda Metrics

CloudWatch → Metrics → **Lambda**:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Duration | Near timeout | Optimize code atau increase timeout |
| Errors | > 0 | Check logs |
| Throttles | > 0 | Increase concurrency limit |
| ConcurrentExecutions | Near limit | Request limit increase |

---

## 2. CloudFlare Analytics

### Traffic Analytics

CloudFlare Dashboard → Domain → **Analytics**:

- **Requests**: Total requests dan trends
- **Bandwidth**: Data transfer volume
- **Threats**: Blocked attacks
- **Geographic**: User location distribution

### Caching Performance

CloudFlare Dashboard → **Caching** → **Overview**:

| Metric | Good | Action if Low |
|--------|------|---------------|
| Cache Hit Rate | > 70% | Adjust cache rules |
| Bandwidth Saved | > 50% | Enable more caching |

### Pages Deployments

CloudFlare Dashboard → **Pages** → Project:

- Deployment history
- Build logs
- Preview URLs

---

## 3. Alerts & Notifications

### CloudWatch Alarms

**Step 1: Create SNS Topic**
1. AWS Console → **SNS** → **Topics** → **Create topic**
2. Type: Standard
3. Name: `finlapor-alerts`

**Step 2: Create Subscription**
1. Topic → **Create subscription**
2. Protocol: Email
3. Endpoint: your-email@example.com
4. Confirm via email

**Step 3: Create Alarm**

EC2 CPU Alarm:
1. CloudWatch → **Alarms** → **Create alarm**
2. Select metric: EC2 → Per-Instance → CPUUtilization
3. Konfigurasi:
   ```
   Statistic: Average
   Period: 5 minutes
   Threshold: > 80
   Datapoints: 2 out of 3
   ```
4. Actions: Notification → `finlapor-alerts`
5. Name: `FinLapor-EC2-HighCPU`

**Recommended Alarms:**

| Resource | Metric | Condition |
|----------|--------|-----------|
| EC2 | CPUUtilization | > 80% for 10 min |
| EC2 | StatusCheckFailed | >= 1 |
| RDS | FreeStorageSpace | < 2GB |
| RDS | CPUUtilization | > 80% for 10 min |
| Lambda | Errors | > 5 in 5 min |

---

## 4. Cost Monitoring

### AWS Cost Explorer

1. AWS Console → **Billing** → **Cost Explorer**
2. Views:
   - Monthly costs
   - Service breakdown
   - Daily trends

### Budget Alerts

1. **Budgets** → **Create budget**
2. Konfigurasi:
   ```
   Budget type: Cost budget
   Budget amount: $50 (atau sesuai)
   Alerts:
     - 80% threshold: Email warning
     - 100% threshold: Email critical
   ```

### Cost Optimization Tips

| Service | Tip | Savings |
|---------|-----|---------|
| EC2 | Stop saat tidak dipakai | ~60% |
| EC2 | Reserved Instances (1 year) | ~30-40% |
| RDS | Stop development DB | ~60% |
| S3 | Lifecycle rules untuk old objects | Variable |
| Lambda | Optimize memory/duration | Per invocation |

---

## 5. Maintenance Tasks

### Daily (Automated)

- ✅ CloudWatch logs collection
- ✅ RDS automated backups
- ✅ CloudFlare analytics

### Weekly

- [ ] Review CloudWatch alarms
- [ ] Check error logs
- [ ] Review costs

```bash
# Cek disk usage di EC2
ssh finlapor-backend "df -h"

# Cek Docker logs
ssh finlapor-backend "docker-compose logs --tail=100"
```

### Monthly

- [ ] Review and rotate access keys
- [ ] Update dependencies (security patches)
- [ ] Review CloudFlare security events
- [ ] Cost optimization review

```bash
# Update system packages
ssh finlapor-backend "sudo yum update -y"

# Update Docker images
ssh finlapor-backend "docker-compose pull && docker-compose up -d"
```

### Quarterly

- [ ] Security audit
- [ ] Performance review
- [ ] Backup restoration test
- [ ] Disaster recovery drill

---

## Log Management

### View EC2 Logs

```bash
# SSH ke EC2
ssh finlapor-backend

# Docker logs
docker-compose -f docker-compose.production.yml logs -f backend

# Systemd logs (jika pakai Go binary)
journalctl -u finlapor -f

# System logs
sudo tail -f /var/log/messages
```

### CloudWatch Logs

1. Lambda automatic ke CloudWatch Logs
2. EC2: Install CloudWatch Agent untuk custom logs

**Install CloudWatch Agent:**
```bash
# Download
sudo yum install amazon-cloudwatch-agent -y

# Configure (wizard)
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Start
sudo systemctl start amazon-cloudwatch-agent
```

---

## ✅ Checklist

- [ ] CloudWatch metrics reviewed
- [ ] SNS topic created untuk alerts
- [ ] Critical alarms configured (EC2, RDS, Lambda)
- [ ] Budget alerts set
- [ ] Cost Explorer enabled
- [ ] CloudFlare analytics accessible
- [ ] Maintenance schedule documented
- [ ] Log access verified

---

## Quick Reference

### Useful Commands

```bash
# Check EC2 status
aws ec2 describe-instance-status --instance-ids i-xxxxx

# Check RDS status
aws rds describe-db-instances --db-instance-identifier finlapor-db

# Check Lambda invocations (last 1 hour)
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=finlapor-ai \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Sum
```

---

## Next Step

Jika ada masalah → [Troubleshooting Guide](../troubleshooting.md)
