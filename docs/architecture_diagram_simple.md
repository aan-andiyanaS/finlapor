# FinLapor AWS Architecture Diagram (Option A: Simple)

```mermaid
graph TB
    User((User))
    
    subgraph CloudFlare Network
        direction TB
        CF_Pages[CloudFlare Pages<br/>Next.js Frontend]
        CF_Proxy[CloudFlare CDN<br/>Security & Caching]
    end
    
    subgraph AWS_Cloud [AWS Cloud (ap-southeast-1)]
        direction TB
        
        subgraph VPC [VPC 10.0.0.0/16]
            
            subgraph Public_Subnet [Public Subnet]
                
                subgraph EC2_Server [EC2 t3.micro]
                    Backend[Go Fiber Backend]
                    Docker[Docker Runtime]
                    DB[(PostgreSQL 16)]
                    Redis[(Redis 7)]
                end
                
            end
        end
        
        S3[S3 Bucket]
    end
    
    subgraph External_AI [HuggingFace]
        HF[HuggingFace API<br/>Donut OCR + Mistral 7B]
    end

    %% Connections
    User ==>|HTTPS| CF_Pages
    User ==>|HTTPS| CF_Proxy
    CF_Proxy ==>|HTTP :8080| Backend
    
    %% Internal Monolith
    Backend <-->|Localhost| DB
    Backend <-->|Localhost| Redis
    
    %% External Services
    Backend ==>|SDK| S3
    Backend ==>|Invoke| HF

    %% Styling
    classDef aws fill:#FF9900,stroke:#232F3E,color:white;
    classDef db fill:#336791,stroke:#232F3E,color:white;
    classDef cloudflare fill:#F38020,stroke:#232F3E,color:white;
    classDef go fill:#00ADD8,stroke:#232F3E,color:white;
    
    class S3,EC2_Server,Backend aws;
    class DB,Redis db;
    class CF_Pages,CF_Proxy cloudflare;
```
