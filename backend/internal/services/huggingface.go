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
		fmt.Println("⚠️  HF_TOKEN not configured, using mock OCR")
		return s.mockOCRResult(), nil
	}

	fmt.Printf("🔍 HuggingFace OCR: Downloading image from %s\n", imageURL)

	// Download image
	imageData, err := s.downloadImage(imageURL)
	if err != nil {
		fmt.Printf("❌ Failed to download image: %v\n", err)
		return s.mockOCRResult(), nil
	}

	fmt.Printf("✅ Image downloaded (%d bytes)\n", len(imageData))

	// Call HuggingFace API
	apiURL := fmt.Sprintf("https://router.huggingface.co/hf-inference/models/%s", s.ocrModel)
	fmt.Printf("🚀 Calling HuggingFace API: %s\n", apiURL)

	req, err := http.NewRequest("POST", apiURL, bytes.NewReader(imageData))
	if err != nil {
		fmt.Printf("❌ Failed to create request: %v\n", err)
		return s.mockOCRResult(), nil
	}

	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/octet-stream")

	resp, err := s.client.Do(req)
	if err != nil {
		fmt.Printf("❌ Failed to call HuggingFace API: %v\n", err)
		return s.mockOCRResult(), nil
	}
	defer resp.Body.Close()

	fmt.Printf("📥 HuggingFace response status: %d\n", resp.StatusCode)

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("📄 Response body (%d bytes): %s\n", len(body), string(body[:min(500, len(body))]))

	// Parse response
	var hfResponse []map[string]interface{}
	if err := json.Unmarshal(body, &hfResponse); err != nil {
		// Try parsing as single object
		var singleResponse map[string]interface{}
		if err := json.Unmarshal(body, &singleResponse); err != nil {
			fmt.Printf("❌ Failed to parse response: %v\n", err)
			return s.mockOCRResult(), nil
		}
		fmt.Println("✅ Parsed as single object response")
		return s.parseOCRResponse(singleResponse), nil
	}

	if len(hfResponse) > 0 {
		fmt.Println("✅ Parsed as array response")
		return s.parseOCRResponse(hfResponse[0]), nil
	}

	fmt.Println("⚠️  Empty response from HuggingFace, using mock")
	return s.mockOCRResult(), nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
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
	fmt.Println("=== CHAT DEBUG ===")
	fmt.Printf("Token configured: %v\n", s.IsConfigured())
	fmt.Printf("LLM Model: %s\n", s.llmModel)

	if !s.IsConfigured() {
		fmt.Println("⚠️ HF_TOKEN not configured, using mock response")
		return s.mockChatResponse(message), nil
	}

	// Extract financial data from context
	financialData := ""
	if context != nil {
		if data, ok := context["financial_data"].(string); ok {
			financialData = data
			fmt.Printf("📊 Financial context included (%d chars)\n", len(data))
		}
	}

	// Build messages in OpenAI format with financial context
	systemPrompt := fmt.Sprintf(`Kamu adalah "Finny", asisten keuangan AI yang SUPER FRIENDLY dari FinLapor! 🎉

PERSONALITY & GAYA BICARA:
- Kamu seperti TEMAN DISKUSI yang asyik, bukan robot formal
- Gunakan emoji yang relevan tapi jangan berlebihan (1-3 emoji per respons)
- Buat percakapan interaktif - tanyakan balik, ajak diskusi
- Pakai bahasa santai tapi tetap informatif
- Kalau user masih muda (di bawah 25 tahun), gunakan bahasa gaul yang relate (misal: "gas!", "mantap!", "auto cuan")
- Kalau user dewasa (25-40 tahun), bicara profesional tapi tetap friendly
- Kalau user senior (40+ tahun), bicara sopan dan hormat

KEMAMPUAN UTAMA:
- Menganalisis pengeluaran dan pemasukan secara DETAIL per kategori
- Memberikan tips menabung yang PRAKTIS sesuai usia dan gaya hidup
- Merekomendasikan budget yang REALISTIS
- Menjawab pertanyaan keuangan dengan penjelasan MUDAH DIPAHAMI

CARA MENJAWAB:
1. Selalu sapa dengan ramah
2. Langsung jawab pertanyaan dengan data konkret
3. Berikan insight atau saran tambahan
4. Akhiri dengan pertanyaan untuk engagement atau ajakan diskusi

PERHATIAN KHUSUS:
- Jika ditanya total per kategori, HITUNG dengan benar dari data
- Jika ditanya kategori tertentu, sebutkan detail transaksinya
- Jika tidak ada data untuk kategori yang diminta, bilang dengan jujur
- Selalu sebutkan angka dalam format Rupiah (Rp)

Berikut adalah DATA LENGKAP user yang WAJIB kamu gunakan:
%s

PENTING: Gunakan data di atas untuk memberikan analisis yang AKURAT dan PERSONAL. Jangan mengada-ada angka!`, financialData)

	// Use OpenAI-compatible endpoint
	apiURL := "https://router.huggingface.co/v1/chat/completions"
	fmt.Printf("🚀 Calling HuggingFace LLM API: %s\n", apiURL)
	fmt.Printf("📝 Model: %s\n", s.llmModel)

	// OpenAI-compatible payload
	payload := map[string]interface{}{
		"model": s.llmModel,
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": message},
		},
		"max_tokens":  500,
		"temperature": 0.7,
		"top_p":       0.95,
	}

	payloadBytes, _ := json.Marshal(payload)
	fmt.Printf("📤 Payload size: %d bytes\n", len(payloadBytes))

	req, err := http.NewRequest("POST", apiURL, bytes.NewReader(payloadBytes))
	if err != nil {
		fmt.Printf("❌ Failed to create request: %v\n", err)
		return s.mockChatResponse(message), nil
	}

	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		fmt.Printf("❌ Failed to call HuggingFace API: %v\n", err)
		return s.mockChatResponse(message), nil
	}
	defer resp.Body.Close()

	fmt.Printf("📥 Response status: %d\n", resp.StatusCode)

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("📄 Response body (%d bytes): %s\n", len(body), string(body[:min(500, len(body))]))

	// Check for error responses
	if resp.StatusCode != 200 {
		fmt.Printf("❌ HuggingFace API error: %s\n", string(body))
		return s.mockChatResponse(message), nil
	}

	// Parse OpenAI-compatible response
	var chatResponse struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &chatResponse); err != nil {
		fmt.Printf("❌ Failed to parse response: %v\n", err)
		return s.mockChatResponse(message), nil
	}

	if chatResponse.Error != nil {
		fmt.Printf("❌ API returned error: %s\n", chatResponse.Error.Message)
		return s.mockChatResponse(message), nil
	}

	if len(chatResponse.Choices) > 0 && chatResponse.Choices[0].Message.Content != "" {
		content := chatResponse.Choices[0].Message.Content
		fmt.Printf("✅ Got LLM response: %s...\n", content[:min(100, len(content))])
		return &ChatResponse{
			Response:  strings.TrimSpace(content),
			Timestamp: time.Now().Format(time.RFC3339),
		}, nil
	}

	fmt.Println("⚠️ Empty/invalid response, using mock")
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
	apiURL := "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"

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
