package services

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/yourusername/finlapor/backend/internal/config"
)

type UploadService struct {
	cfg         *config.Config
	minioClient *minio.Client
}

func NewUploadService(cfg *config.Config, minioClient *minio.Client) *UploadService {
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
	objectName := fmt.Sprintf("uploads/%s", uniqueFilename)

	// Upload to MinIO
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
	url := fmt.Sprintf("%s/%s/%s", s.cfg.S3Endpoint, s.cfg.S3Bucket, objectName)

	return &UploadResult{
		URL:      url,
		Filename: uniqueFilename,
	}, nil
}

func (s *UploadService) GetPresignedURL(filename, contentType string) (*PresignedURLResult, error) {
	// Generate unique filename
	ext := filepath.Ext(filename)
	uniqueFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	objectName := fmt.Sprintf("uploads/%s", uniqueFilename)

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

	return &PresignedURLResult{
		UploadURL: presignedURL.String(),
		FileURL:   fmt.Sprintf("%s/%s/%s", s.cfg.S3Endpoint, s.cfg.S3Bucket, objectName),
		ExpiresIn: 900, // 15 minutes in seconds
	}, nil
}
