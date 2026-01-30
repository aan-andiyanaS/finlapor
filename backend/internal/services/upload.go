package services

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/yourusername/finlapor/backend/internal/config"
)

type UploadService struct {
	cfg         *config.Config
	minioClient *minio.Client // nil when using local storage
}

func NewUploadService(cfg *config.Config, minioClient *minio.Client) *UploadService {
	// Ensure upload directory exists for local storage
	if cfg.StorageType == "local" {
		if err := os.MkdirAll(cfg.UploadDir, 0755); err != nil {
			fmt.Printf("⚠️ Failed to create upload directory: %v\n", err)
		}
	}

	return &UploadService{
		cfg:         cfg,
		minioClient: minioClient,
	}
}

type UploadResult struct {
	URL      string `json:"url"`
	Filename string `json:"filename"`
}

type PresignedURLResult struct {
	UploadURL string `json:"upload_url"`
	FileURL   string `json:"file_url"`
	ExpiresIn int    `json:"expires_in"`
}

func (s *UploadService) Upload(ctx context.Context, filename string, fileSize int64, contentType string, reader io.Reader) (*UploadResult, error) {
	// Generate unique filename
	ext := filepath.Ext(filename)
	uniqueFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	if s.cfg.StorageType == "local" {
		return s.uploadLocal(uniqueFilename, reader)
	}
	return s.uploadS3(ctx, uniqueFilename, fileSize, contentType, reader)
}

// uploadLocal saves file to local filesystem
func (s *UploadService) uploadLocal(filename string, reader io.Reader) (*UploadResult, error) {
	filePath := filepath.Join(s.cfg.UploadDir, filename)

	// Create file
	file, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	// Copy content
	_, err = io.Copy(file, reader)
	if err != nil {
		return nil, fmt.Errorf("failed to write file: %w", err)
	}

	// Generate URL
	url := fmt.Sprintf("%s/uploads/%s", s.cfg.BaseURL, filename)

	return &UploadResult{
		URL:      url,
		Filename: filename,
	}, nil
}

// uploadS3 uploads file to S3/MinIO
func (s *UploadService) uploadS3(ctx context.Context, filename string, fileSize int64, contentType string, reader io.Reader) (*UploadResult, error) {
	if s.minioClient == nil {
		return nil, fmt.Errorf("S3 client not initialized")
	}

	objectName := fmt.Sprintf("uploads/%s", filename)

	// Upload to S3
	_, err := s.minioClient.PutObject(
		ctx,
		s.cfg.S3Bucket,
		objectName,
		reader,
		fileSize,
		minio.PutObjectOptions{
			ContentType: contentType,
		},
	)

	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	// Generate public URL
	publicEndpoint := s.cfg.S3PublicEndpoint
	if publicEndpoint == "" {
		publicEndpoint = s.cfg.S3Endpoint
	}
	url := fmt.Sprintf("%s/%s/%s", publicEndpoint, s.cfg.S3Bucket, objectName)

	return &UploadResult{
		URL:      url,
		Filename: filename,
	}, nil
}

func (s *UploadService) GetPresignedURL(filename, contentType string) (*PresignedURLResult, error) {
	// Generate unique filename
	ext := filepath.Ext(filename)
	uniqueFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	if s.cfg.StorageType == "local" {
		return s.getLocalUploadURL(uniqueFilename)
	}
	return s.getS3PresignedURL(uniqueFilename)
}

// getLocalUploadURL returns URL for local upload (direct upload to backend)
func (s *UploadService) getLocalUploadURL(filename string) (*PresignedURLResult, error) {
	// For local storage, we use direct upload endpoint
	fileURL := fmt.Sprintf("%s/uploads/%s", s.cfg.BaseURL, filename)

	return &PresignedURLResult{
		UploadURL: fmt.Sprintf("%s/api/upload", s.cfg.BaseURL), // Use direct upload
		FileURL:   fileURL,
		ExpiresIn: 900, // 15 minutes
	}, nil
}

// getS3PresignedURL returns presigned URL for S3 upload
func (s *UploadService) getS3PresignedURL(filename string) (*PresignedURLResult, error) {
	if s.minioClient == nil {
		return nil, fmt.Errorf("S3 client not initialized")
	}

	objectName := fmt.Sprintf("uploads/%s", filename)

	// Generate presigned URL (valid for 15 minutes)
	presignedURL, err := s.minioClient.PresignedPutObject(
		context.Background(),
		s.cfg.S3Bucket,
		objectName,
		time.Minute*15,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	// Use public endpoint for file URL and upload URL
	publicEndpoint := s.cfg.S3PublicEndpoint
	if publicEndpoint == "" {
		publicEndpoint = s.cfg.S3Endpoint
	}

	// Replace internal hostname with public endpoint in presigned URL
	uploadURL := presignedURL.String()
	if s.cfg.S3PublicEndpoint != "" && s.cfg.S3Endpoint != "" {
		internalHost := strings.TrimPrefix(s.cfg.S3Endpoint, "http://")
		internalHost = strings.TrimPrefix(internalHost, "https://")

		publicHost := strings.TrimPrefix(s.cfg.S3PublicEndpoint, "http://")
		publicHost = strings.TrimPrefix(publicHost, "https://")

		uploadURL = strings.Replace(uploadURL, internalHost, publicHost, 1)
	}

	return &PresignedURLResult{
		UploadURL: uploadURL,
		FileURL:   fmt.Sprintf("%s/%s/%s", publicEndpoint, s.cfg.S3Bucket, objectName),
		ExpiresIn: 900, // 15 minutes in seconds
	}, nil
}
