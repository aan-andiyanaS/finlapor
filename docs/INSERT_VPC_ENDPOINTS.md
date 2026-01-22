# VPC Endpoints Guide - To Insert into deployment.md after Section B.9

Copy konten di bawah ini dan paste secara manual ke deployment.md setelah section B.9 (sebelum section "5. Deploy AI Service")

---

## B.10 Optimasi Biaya: VPC Endpoints untuk S3

> **🤔 Mengapa VPC Endpoints?**
> - **Hemat**: Tidak perlu NAT Gateway ($32/bulan)
> - **Cepat**: Akses langsung ke S3 tanpa internet
> - **Aman**: Traffic tidak keluar dari AWS network

### B.10.1 Setup VPC Endpoint untuk S3

1. **VPC → Endpoints → Create endpoint**
2. Konfigurasi:
   ```
   Name: finlapor-s3-endpoint
   Service category: AWS services
   Service name: com.amazonaws.ap-southeast-1.s3
   VPC: finlapor-vpc-secure
   Route tables: Select PRIVATE subnet route tables
   ```

3. **Policy** (opsional):
   ```json
   {
     "Statement": [{
       "Sid": "AccessToSpecificBucket",
       "Effect": "Allow",
       "Principal": "*",
       "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
       "Resource": ["arn:aws:s3:::finlapor-storage-*", "arn:aws:s3:::finlapor-storage-*/*"]
     }]
   }
   ```

4. **Create endpoint**

### B.10.2 Verifikasi VPC Endpoint

SSH ke backend di private subnet dan test:

```bash
aws s3 ls s3://finlapor-storage-xxxxx
echo "test" > test.txt
aws s3 cp test.txt s3://finlapor-storage-xxxxx/test.txt
```

### B.10.3 Matikan NAT Gateway

1. **VPC → NAT Gateways** → Select → **Actions → Delete**
2. **VPC → Elastic IPs** → Select → **Actions → Release**

> ⚠️ **Warning**: Setelah NAT dihapus, private subnet tidak bisa akses internet kecuali via VPC Endpoints.

### B.10.4 Perbandingan Biaya

| Setup | NAT | VPC Endpoint | Total |
|-------|-----|--------------|-------|
| Dengan NAT | $32 | $0 | ~$45/bulan |
| Dengan VPC Endpoint | $0 | $0 | ~$13/bulan |

💰 **Hemat $32/bulan** ($384/tahun)

---
