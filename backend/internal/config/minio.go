package config

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func InitMinIO(cfg *Config) (*minio.Client, error) {
	// Read from config (environment variables)
	endpoint := cfg.S3Endpoint
	accessKeyID := cfg.S3AccessKey
	secretAccessKey := cfg.S3SecretKey
	bucketName := cfg.S3Bucket

	// Remove protocol prefix for MinIO client
	endpoint = strings.TrimPrefix(endpoint, "https://")
	endpoint = strings.TrimPrefix(endpoint, "http://")

	// Determine SSL based on original endpoint
	useSSL := strings.HasPrefix(cfg.S3Endpoint, "https://")

	log.Printf("📦 Connecting to S3/MinIO: %s (SSL: %v)", endpoint, useSSL)

	// Initialize MinIO client
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create MinIO client: %w", err)
	}

	// Ensure bucket exists
	ctx := context.Background()

	exists, err := minioClient.BucketExists(ctx, bucketName)
	if err != nil {
		return nil, fmt.Errorf("failed to check bucket: %w", err)
	}

	if !exists {
		err = minioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to create bucket: %w", err)
		}
		log.Printf("✅ Created MinIO bucket: %s", bucketName)
	}

	log.Println("✅ Connected to MinIO")
	return minioClient, nil
}
