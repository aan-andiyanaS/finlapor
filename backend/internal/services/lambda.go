package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
)

// LambdaService handles AI operations via AWS Lambda
type LambdaService struct {
	client       *lambda.Client
	functionName string
	configured   bool
}

// NewLambdaService creates a new Lambda service
func NewLambdaService() *LambdaService {
	functionName := os.Getenv("LAMBDA_FUNCTION_NAME")
	if functionName == "" {
		functionName = "finlapor-ai-service"
	}

	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "ap-southeast-1"
	}

	accessKeyID := os.Getenv("AWS_ACCESS_KEY_ID")
	secretAccessKey := os.Getenv("AWS_SECRET_ACCESS_KEY")

	// Check if AWS credentials are configured
	if accessKeyID == "" || secretAccessKey == "" {
		fmt.Println("⚠️ AWS credentials not configured, Lambda service disabled")
		return &LambdaService{
			functionName: functionName,
			configured:   false,
		}
	}

	// Create AWS config with credentials
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			accessKeyID,
			secretAccessKey,
			"",
		)),
	)

	if err != nil {
		fmt.Printf("❌ Failed to load AWS config: %v\n", err)
		return &LambdaService{
			functionName: functionName,
			configured:   false,
		}
	}

	client := lambda.NewFromConfig(cfg)

	fmt.Printf("✅ Lambda service initialized: %s (region: %s)\n", functionName, region)

	return &LambdaService{
		client:       client,
		functionName: functionName,
		configured:   true,
	}
}

// IsConfigured returns true if Lambda service is properly configured
func (s *LambdaService) IsConfigured() bool {
	return s.configured && s.client != nil
}

// LambdaRequest represents a request to the Lambda function
type LambdaRequest struct {
	Action       string                   `json:"action"`
	ImageURL     string                   `json:"image_url,omitempty"`
	ImageBase64  string                   `json:"image_base64,omitempty"`
	Message      string                   `json:"message,omitempty"`
	Context      map[string]interface{}   `json:"context,omitempty"`
	UserAge      int                      `json:"user_age,omitempty"`
	Description  string                   `json:"description,omitempty"`
	Transactions []map[string]interface{} `json:"transactions,omitempty"`
}

// LambdaResponse represents a response from the Lambda function
type LambdaResponse struct {
	StatusCode int             `json:"statusCode"`
	Body       json.RawMessage `json:"body"`
}

// Invoke calls the Lambda function with the given request
func (s *LambdaService) Invoke(ctx context.Context, req *LambdaRequest) (*LambdaResponse, error) {
	if !s.IsConfigured() {
		return nil, fmt.Errorf("lambda service not configured")
	}

	// Marshal request
	payload, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	fmt.Printf("🚀 Invoking Lambda: %s (action: %s)\n", s.functionName, req.Action)

	// Create context with timeout
	invokeCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	// Invoke Lambda
	result, err := s.client.Invoke(invokeCtx, &lambda.InvokeInput{
		FunctionName: aws.String(s.functionName),
		Payload:      payload,
	})

	if err != nil {
		return nil, fmt.Errorf("failed to invoke lambda: %v", err)
	}

	fmt.Printf("📥 Lambda response status: %d\n", result.StatusCode)

	// Parse response
	var response LambdaResponse
	if err := json.Unmarshal(result.Payload, &response); err != nil {
		// Try parsing as raw body (some Lambda responses)
		return &LambdaResponse{
			StatusCode: int(result.StatusCode),
			Body:       result.Payload,
		}, nil
	}

	return &response, nil
}

// ScanReceipt performs OCR via Lambda
func (s *LambdaService) ScanReceipt(imageURL string) (*OCRResult, error) {
	if !s.IsConfigured() {
		return nil, fmt.Errorf("lambda service not configured")
	}

	resp, err := s.Invoke(context.Background(), &LambdaRequest{
		Action:   "ocr",
		ImageURL: imageURL,
	})

	if err != nil {
		return nil, err
	}

	var ocrResult OCRResult
	if err := json.Unmarshal(resp.Body, &ocrResult); err != nil {
		return nil, fmt.Errorf("failed to parse OCR result: %v", err)
	}

	return &ocrResult, nil
}

// Chat sends a message to the AI via Lambda
func (s *LambdaService) Chat(message string, chatContext map[string]interface{}, userAge int) (*ChatResponse, error) {
	if !s.IsConfigured() {
		return nil, fmt.Errorf("lambda service not configured")
	}

	resp, err := s.Invoke(context.Background(), &LambdaRequest{
		Action:  "chat",
		Message: message,
		Context: chatContext,
		UserAge: userAge,
	})

	if err != nil {
		return nil, err
	}

	var chatResp struct {
		Reply       string   `json:"reply"`
		Timestamp   string   `json:"timestamp"`
		Suggestions []string `json:"suggestions"`
	}
	if err := json.Unmarshal(resp.Body, &chatResp); err != nil {
		return nil, fmt.Errorf("failed to parse chat result: %v", err)
	}

	return &ChatResponse{
		Response:  chatResp.Reply,
		Timestamp: chatResp.Timestamp,
	}, nil
}

// Categorize auto-categorizes a description via Lambda
func (s *LambdaService) Categorize(description string) (string, float64, error) {
	if !s.IsConfigured() {
		return "", 0, fmt.Errorf("lambda service not configured")
	}

	resp, err := s.Invoke(context.Background(), &LambdaRequest{
		Action:      "categorize",
		Description: description,
	})

	if err != nil {
		return "", 0, err
	}

	var catResult struct {
		Category   string  `json:"category"`
		Confidence float64 `json:"confidence"`
	}
	if err := json.Unmarshal(resp.Body, &catResult); err != nil {
		return "", 0, fmt.Errorf("failed to parse categorize result: %v", err)
	}

	return catResult.Category, catResult.Confidence, nil
}
