package services

import (
	"github.com/yourusername/finlapor/backend/internal/config"
)

type AIService struct {
	cfg *config.Config
}

func NewAIService(cfg *config.Config) *AIService {
	return &AIService{cfg: cfg}
}

type OCRResult struct {
	Vendor     string    `json:"vendor"`
	Date       string    `json:"date"`
	Total      float64   `json:"total"`
	Items      []OCRItem `json:"items"`
	ImageURL   string    `json:"image_url"`
	Category   string    `json:"suggested_category"`
	Confidence float64   `json:"confidence"`
}

type OCRItem struct {
	Name  string  `json:"name"`
	Qty   int     `json:"qty"`
	Price float64 `json:"price"`
}

type ChatResult struct {
	Reply       string   `json:"reply"`
	Suggestions []string `json:"suggestions"`
}

func (s *AIService) ScanReceipt(imageURL string) (*OCRResult, error) {
	// TODO: Call Lambda function for OCR
	// For now, return a placeholder
	return &OCRResult{
		Vendor:     "Sample Store",
		Date:       "2026-01-22",
		Total:      50000,
		Items:      []OCRItem{{Name: "Item 1", Qty: 1, Price: 50000}},
		ImageURL:   imageURL,
		Category:   "shopping",
		Confidence: 0.9,
	}, nil
}

func (s *AIService) Chat(message string, context map[string]interface{}) (*ChatResult, error) {
	// TODO: Call Lambda function for chat
	// For now, return a placeholder
	return &ChatResult{
		Reply: "Halo! Saya FinLapor AI Assistant. Fitur chat sedang dalam pengembangan.",
		Suggestions: []string{
			"Lihat total pengeluaran",
			"Analisis kategori",
			"Tips menabung",
		},
	}, nil
}

func (s *AIService) Categorize(description string) (string, error) {
	// TODO: Call Lambda function for categorization
	return "lainnya", nil
}
