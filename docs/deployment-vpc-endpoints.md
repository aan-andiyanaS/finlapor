## B.10 Optimasi Biaya: VPC Endpoints untuk S3

> **🤔 Mengapa VPC Endpoints?**
> - **Hemat**: Tidak perlu NAT Gateway (/bulan)
> - **Cepat**: Akses langsung ke S3 tanpa internet
> - **Aman**: Traffic tidak keluar dari AWS network

### B.10.1 Setup VPC Endpoint untuk S3

1. **VPC → Endpoints → Create endpoint**
2. Konfigurasi:
   `
   Name: finlapor-s3-endpoint
   Service category: AWS services
   Service name: com.amazonaws.ap-southeast-1.s3
   VPC: finlapor-vpc-secure
   Route tables: Select PRIVATE subnet route tables
   `

3. **Policy** (opsional - untuk restrict ke bucket tertentu):
   `json
   {
     "Statement": [
       {
         "Sid": "AccessToSpecificBucket",
         "Effect": "Allow",
         "Principal": "*",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::finlapor-storage-*",
           "arn:aws:s3:::finlapor-storage-*/*"
         ]
       }
     ]
   }
   `

4. **Create endpoint**

### B.10.2 Verifikasi VPC Endpoint

SSH ke backend di private subnet dan test:

```bash
# Test S3 access via VPC endpoint
aws s3 ls s3://finlapor-storage-xxxxx

# Upload test file
echo "test" > test.txt
aws s3 cp test.txt s3://finlapor-storage-xxxxx/test.txt

# Download test file  
aws s3 cp s3://finlapor-storage-xxxxx/test.txt downloaded.txt
cat downloaded.txt
```

> **✅ Jika berhasil**, artinya VPC Endpoint sudah berfungsi!

### B.10.3 Matikan NAT Gateway

**Setelah VPC Endpoint berjalan**, NAT Gateway bisa dimatikan untuk hemat biaya:

1. **VPC → NAT Gateways**
2. Pilih NAT Gateway Anda
3. **Actions → Delete NAT gateway**
4. Ketik "delete" untuk confirm
5. **VPC → Elastic IPs**
6. Pilih EIP yang tadinya attached ke NAT Gateway
7. **Actions → Release Elastic IP address**

> **⚠️ Warning**: Setelah NAT Gateway dihapus, instance di private subnet **tidak bisa akses internet** kecuali via VPC Endpoints.

### B.10.4 Tambahan: VPC Endpoint untuk Services Lain (Opsional)

Jika butuh akses ke AWS services lain tanpa NAT Gateway:

| Service | Endpoint Name | Use Case |
|---------|---------------|----------|
| **S3** | com.amazonaws.region.s3 | File storage (sudah disetup di atas) |
| **DynamoDB** | com.amazonaws.region.dynamodb | NoSQL database |
| **ECR** | com.amazonaws.region.ecr.api | Docker registry |
| **ECR Docker** | com.amazonaws.region.ecr.dkr | Pull Docker images |
| **CloudWatch Logs** | com.amazonaws.region.logs | Logging |
| **SSM** | com.amazonaws.region.ssm | Systems Manager |

**Setup sama seperti S3 Endpoint di atas**.

### B.10.5 Checklist Optimasi Biaya

- [ ] VPC Endpoint untuk S3 created
- [ ] Test S3 access dari private subnet (aws s3 ls)
- [ ] Upload/download test berhasil
- [ ] NAT Gateway deleted
- [ ] Elastic IP released
- [ ] (Opsional) Tambah VPC Endpoints lain sesuai kebutuhan
- [ ] Update backend .env jika perlu (S3_ENDPOINT tetap default)

### B.10.6 Perbandingan Biaya

| Setup | NAT Gateway | VPC Endpoint S3 | Total/Bulan |
|-------|-------------|-----------------|-------------|
| **Dengan NAT** | .00 |  | ~/bulan |
| **Dengan VPC Endpoint** |  | .01* | ~/bulan |

\* VPC Endpoint S3 Gateway: **GRATIS** (tidak ada biaya)!

> **💰 Penghematan**: **/bulan** atau **/tahun**

