package config

import (
	"os"
)

type Config struct {
	DatabaseURL        string
	RedisURL           string
	JWTSecret          string
	S3Endpoint         string
	S3AccessKey        string
	S3SecretKey        string
	S3Bucket           string
	S3Region           string
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
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/finlapor?sslmode=disable"),
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:          getEnv("JWT_SECRET", "super-secret-key-change-me"),
		S3Endpoint:         getEnv("S3_ENDPOINT", "http://localhost:9000"),
		S3AccessKey:        getEnv("S3_ACCESS_KEY", "minioadmin"),
		S3SecretKey:        getEnv("S3_SECRET_KEY", "minioadmin"),
		S3Bucket:           getEnv("S3_BUCKET", "finlapor"),
		S3Region:           getEnv("S3_REGION", "us-east-1"),
		HFToken:            getEnv("HF_TOKEN", ""),
		LambdaFunctionName: getEnv("LAMBDA_FUNCTION_NAME", "finlapor-ai-service"),
		AWSRegion:          getEnv("AWS_REGION", "ap-southeast-1"),
		AWSAccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		UseLambda:          getEnv("USE_LAMBDA", "false") == "true",
		Environment:        getEnv("ENVIRONMENT", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
