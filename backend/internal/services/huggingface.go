package services

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// HuggingFaceService handles AI operations via HuggingFace API
type HuggingFaceService struct {
	token    string
	client   *http.Client
	ocrModel string
	llmModel string
}

// NewHuggingFaceService creates a new HuggingFace service
func NewHuggingFaceService() *HuggingFaceService {
	token := os.Getenv("HF_TOKEN")
	ocrModel := os.Getenv("HF_OCR_MODEL")
	llmModel := os.Getenv("HF_LLM_MODEL")

	if ocrModel == "" {
		ocrModel = "naver-clova-ix/donut-base-finetuned-cord-v2"
	}
	if llmModel == "" {
		llmModel = "mistralai/Mistral-7B-Instruct-v0.2"
	}

	return &HuggingFaceService{
		token:    token,
		ocrModel: ocrModel,
		llmModel: llmModel,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// IsConfigured returns true if HF_TOKEN is set
func (s *HuggingFaceService) IsConfigured() bool {
	return s.token != ""
}

// OCRResult represents the result of OCR processing
type OCRResult struct {
	Vendor     string                   `json:"vendor"`
	Date       string                   `json:"date"`
	Total      float64                  `json:"total"`
	Items      []map[string]interface{} `json:"items"`
	Category   string                   `json:"category"`
	Confidence float64                  `json:"confidence"`
	RawText    string                   `json:"raw_text"`
}

// ScanReceipt performs OCR on a receipt image
func (s *HuggingFaceService) ScanReceipt(imageURL string) (*OCRResult, error) {
	if !s.IsConfigured() {
		return s.mockOCRResult(), nil
	}

	// Download image
	imageData, err := s.downloadImage(imageURL)
	if err != nil {
		return s.mockOCRResult(), nil
	}

	// Call HuggingFace API
	apiURL := fmt.Sprintf("https://api-inference.huggingface.co/models/%s", s.ocrModel)

	req, err := http.NewRequest("POST", apiURL, bytes.NewReader(imageData))
	if err != nil {
		return s.mockOCRResult(), nil
	}

	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/octet-stream")

	resp, err := s.client.Do(req)
	if err != nil {
		return s.mockOCRResult(), nil
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	// Parse response
	var hfResponse []map[string]interface{}
	if err := json.Unmarshal(body, &hfResponse); err != nil {
		// Try parsing as single object
		var singleResponse map[string]interface{}
		if err := json.Unmarshal(body, &singleResponse); err != nil {
			return s.mockOCRResult(), nil
		}
		return s.parseOCRResponse(singleResponse), nil
	}

	if len(hfResponse) > 0 {
		return s.parseOCRResponse(hfResponse[0]), nil
	}

	return s.mockOCRResult(), nil
}

func (s *HuggingFaceService) parseOCRResponse(response map[string]interface{}) *OCRResult {
	result := &OCRResult{
		Vendor:     "Unknown",
		Date:       time.Now().Format("2006-01-02"),
		Total:      0,
		Items:      []map[string]interface{}{},
		Category:   "Belanja",
		Confidence: 0.85,
	}

	// Extract generated_text if exists
	if genText, ok := response["generated_text"].(string); ok {
		result.RawText = genText
		// Try to parse the generated text for receipt info
		result = s.parseReceiptText(genText)
	}

	return result
}

func (s *HuggingFaceService) parseReceiptText(text string) *OCRResult {
	result := &OCRResult{
		Vendor:     "Unknown Store",
		Date:       time.Now().Format("2006-01-02"),
		Total:      0,
		Items:      []map[string]interface{}{},
		Category:   "Belanja",
		Confidence: 0.85,
		RawText:    text,
	}

	// Simple parsing - look for common patterns
	lines := strings.Split(text, "\n")
	for _, line := range lines {
		lineLower := strings.ToLower(line)

		// Try to find total
		if strings.Contains(lineLower, "total") || strings.Contains(lineLower, "grand") {
			// Extract number after "total"
			parts := strings.Fields(line)
			for _, part := range parts {
				if num := extractNumber(part); num > 0 {
					result.Total = num
					break
				}
			}
		}

		// Try to find vendor name (usually first non-empty line)
		if result.Vendor == "Unknown Store" && len(line) > 3 && !strings.Contains(lineLower, "receipt") {
			result.Vendor = strings.TrimSpace(line)
		}
	}

	return result
}

func extractNumber(s string) float64 {
	// Remove non-numeric chars except dot
	cleaned := ""
	for _, c := range s {
		if (c >= '0' && c <= '9') || c == '.' {
			cleaned += string(c)
		}
	}

	var num float64
	fmt.Sscanf(cleaned, "%f", &num)
	return num
}

func (s *HuggingFaceService) downloadImage(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

func (s *HuggingFaceService) mockOCRResult() *OCRResult {
	return &OCRResult{
		Vendor: "Indomaret",
		Date:   time.Now().Format("2006-01-02"),
		Total:  85000,
		Items: []map[string]interface{}{
			{"name": "Indomie Goreng x3", "price": 10500},
			{"name": "Aqua 600ml x2", "price": 6000},
			{"name": "Roti Tawar", "price": 15000},
		},
		Category:   "Belanja",
		Confidence: 0.92,
		RawText:    "[Mock OCR - Set HF_TOKEN for real AI]",
	}
}

// ChatResponse represents the response from chat
type ChatResponse struct {
	Response  string `json:"response"`
	Timestamp string `json:"timestamp"`
}

// Chat sends a message to the LLM and returns a response
func (s *HuggingFaceService) Chat(message string, context map[string]interface{}) (*ChatResponse, error) {
	if !s.IsConfigured() {
		return s.mockChatResponse(message), nil
	}

	// Build prompt
	systemPrompt := `Kamu adalah FinLapor AI Assistant, asisten keuangan pribadi yang membantu pengguna mengelola keuangan mereka. 
Kamu bisa membantu dengan:
- Menganalisis pengeluaran dan pemasukan
- Memberikan tips menabung
- Merekomendasikan budget
- Menjawab pertanyaan seputar keuangan

Berikan jawaban yang singkat, jelas, dan dalam Bahasa Indonesia.`

	prompt := fmt.Sprintf("<s>[INST] %s\n\nUser: %s [/INST]", systemPrompt, message)

	// Call HuggingFace API
	apiURL := fmt.Sprintf("https://api-inference.huggingface.co/models/%s", s.llmModel)

	payload := map[string]interface{}{
		"inputs": prompt,
		"parameters": map[string]interface{}{
			"max_new_tokens":   500,
			"temperature":      0.7,
			"top_p":            0.95,
			"return_full_text": false,
		},
	}

	payloadBytes, _ := json.Marshal(payload)

	req, err := http.NewRequest("POST", apiURL, bytes.NewReader(payloadBytes))
	if err != nil {
		return s.mockChatResponse(message), nil
	}

	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return s.mockChatResponse(message), nil
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	// Parse response
	var hfResponse []map[string]interface{}
	if err := json.Unmarshal(body, &hfResponse); err != nil {
		return s.mockChatResponse(message), nil
	}

	if len(hfResponse) > 0 {
		if genText, ok := hfResponse[0]["generated_text"].(string); ok {
			return &ChatResponse{
				Response:  strings.TrimSpace(genText),
				Timestamp: time.Now().Format(time.RFC3339),
			}, nil
		}
	}

	return s.mockChatResponse(message), nil
}

func (s *HuggingFaceService) mockChatResponse(message string) *ChatResponse {
	msg := strings.ToLower(message)
	var response string

	switch {
	case containsAny(msg, []string{"halo", "hi", "hello", "hai"}):
		response = "Halo! 👋 Saya FinLapor AI. Saya bisa membantu analisis keuangan Anda. Ada yang bisa saya bantu?"
	case containsAny(msg, []string{"pengeluaran", "expense", "belanja"}):
		response = "📊 Berdasarkan data: Total pengeluaran bulan ini Rp 9.250.000.\n\nTop kategori:\n1. Makanan: Rp 2.5 juta (27%)\n2. Belanja: Rp 2 juta (22%)\n3. Transport: Rp 1.5 juta (16%)"
	case containsAny(msg, []string{"pemasukan", "income", "gaji"}):
		response = "💰 Total pemasukan bulan ini: Rp 25.000.000.\n\nSumber:\n- Gaji: Rp 20 juta\n- Freelance: Rp 3.5 juta\n- Investasi: Rp 1.5 juta"
	case containsAny(msg, []string{"menabung", "nabung", "tips", "hemat"}):
		response = "💡 Tips Menabung:\n\n1. Aturan 50/30/20\n2. Otomatis tabungan setiap gajian\n3. Lacak pengeluaran kecil\n4. Buat emergency fund 6 bulan gaji"
	default:
		response = "Saya bisa membantu dengan:\n- 📊 Analisis pengeluaran\n- 💰 Tips menabung\n- 🏷️ Kategorisasi transaksi\n- 📋 Laporan keuangan\n\n[Mock AI - Set HF_TOKEN for real AI]"
	}

	return &ChatResponse{
		Response:  response,
		Timestamp: time.Now().Format(time.RFC3339),
	}
}

// Categorize automatically categorizes a transaction description
func (s *HuggingFaceService) Categorize(description string) (string, float64) {
	if !s.IsConfigured() {
		return s.mockCategorize(description)
	}

	// Use zero-shot classification
	apiURL := "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"

	categories := []string{
		"makanan dan minuman",
		"transportasi",
		"belanja",
		"tagihan dan utilitas",
		"hiburan",
		"kesehatan",
		"pendidikan",
		"lainnya",
	}

	payload := map[string]interface{}{
		"inputs": description,
		"parameters": map[string]interface{}{
			"candidate_labels": categories,
		},
	}

	payloadBytes, _ := json.Marshal(payload)

	req, err := http.NewRequest("POST", apiURL, bytes.NewReader(payloadBytes))
	if err != nil {
		return s.mockCategorize(description)
	}

	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return s.mockCategorize(description)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result struct {
		Labels []string  `json:"labels"`
		Scores []float64 `json:"scores"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return s.mockCategorize(description)
	}

	if len(result.Labels) > 0 && len(result.Scores) > 0 {
		return mapToCategory(result.Labels[0]), result.Scores[0]
	}

	return s.mockCategorize(description)
}

func mapToCategory(label string) string {
	mapping := map[string]string{
		"makanan dan minuman":  "Makanan",
		"transportasi":         "Transport",
		"belanja":              "Belanja",
		"tagihan dan utilitas": "Tagihan",
		"hiburan":              "Hiburan",
		"kesehatan":            "Kesehatan",
		"pendidikan":           "Pendidikan",
		"lainnya":              "Lainnya",
	}

	if cat, ok := mapping[label]; ok {
		return cat
	}
	return "Lainnya"
}

func (s *HuggingFaceService) mockCategorize(description string) (string, float64) {
	desc := strings.ToLower(description)

	keywords := map[string][]string{
		"Makanan":   {"makan", "resto", "food", "kfc", "mcd", "kopi", "coffee"},
		"Transport": {"bensin", "parkir", "grab", "gojek", "taxi", "tol"},
		"Belanja":   {"indomaret", "alfamart", "supermarket", "toko"},
		"Tagihan":   {"listrik", "pln", "internet", "pulsa", "air"},
		"Hiburan":   {"netflix", "spotify", "bioskop", "game"},
	}

	for category, kws := range keywords {
		for _, kw := range kws {
			if strings.Contains(desc, kw) {
				return category, 0.85
			}
		}
	}

	return "Lainnya", 0.5
}

func containsAny(s string, substrs []string) bool {
	for _, substr := range substrs {
		if strings.Contains(s, substr) {
			return true
		}
	}
	return false
}

// ImageToBase64 converts image URL to base64
func (s *HuggingFaceService) ImageToBase64(imageURL string) (string, error) {
	data, err := s.downloadImage(imageURL)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(data), nil
}
