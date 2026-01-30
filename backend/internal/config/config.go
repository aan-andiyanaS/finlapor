package config

import (
	"os"
)

type Config struct {
	DatabaseURL string
	RedisURL    string
	JWTSecret   string
	// Storage configuration
	StorageType string // "local" or "s3"
	UploadDir   string // Local directory for uploads (when StorageType=local)
	BaseURL     string // Server base URL for local file serving
	// S3 configuration (used when StorageType=s3)
	S3Endpoint       string
	S3PublicEndpoint string // For browser-accessible URLs
	S3AccessKey      string
	S3SecretKey      string
	S3Bucket         string
	S3Region         string
	// AI configuration
	HFToken            string
	LambdaFunctionName string
	AWSRegion          string
	AWSAccessKeyID     string
	AWSSecretAccessKey string
	UseLambda          bool
	Environment        string
}

func New() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/finlapor?sslmode=disable"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:   getEnv("JWT_SECRET", "super-secret-key-change-me"),
		// Storage
		StorageType: getEnv("STORAGE_TYPE", "local"),
		UploadDir:   getEnv("UPLOAD_DIR", "./uploads"),
		BaseURL:     getEnv("BASE_URL", "http://localhost:8080"),
		// S3
		S3Endpoint:       getEnv("S3_ENDPOINT", ""),
		S3PublicEndpoint: getEnv("S3_PUBLIC_ENDPOINT", ""),
		S3AccessKey:      getEnv("S3_ACCESS_KEY", ""),
		S3SecretKey:      getEnv("S3_SECRET_KEY", ""),
		S3Bucket:         getEnv("S3_BUCKET", "finlapor"),
		S3Region:         getEnv("S3_REGION", "ap-southeast-1"),
		// AI
		HFToken:            getEnv("HF_TOKEN", ""),
		LambdaFunctionName: getEnv("LAMBDA_FUNCTION_NAME", "finlapor-ai-service"),
		AWSRegion:          getEnv("AWS_REGION", "ap-southeast-1"),
		AWSAccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		UseLambda:          getEnv("USE_LAMBDA", "false") == "true",
		Environment:        getEnv("APP_ENV", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
