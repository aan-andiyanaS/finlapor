package handlers

import (
	"math/rand"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/finlapor/backend/internal/services"
)

// UploadHandler handles file uploads
type UploadHandler struct {
	uploadService *services.UploadService
}

func NewUploadHandler(uploadService *services.UploadService) *UploadHandler {
	return &UploadHandler{uploadService: uploadService}
}

func (h *UploadHandler) GetPresignedURL(c *fiber.Ctx) error {
	var req struct {
		Filename    string `json:"filename"`
		ContentType string `json:"content_type"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	result, err := h.uploadService.GetPresignedURL(req.Filename, req.ContentType)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return SuccessResponse(c, result)
}

// OCRHandler handles receipt scanning
type OCRHandler struct{}

func NewOCRHandler() *OCRHandler {
	return &OCRHandler{}
}

func (h *OCRHandler) ScanReceipt(c *fiber.Ctx) error {
	var req struct {
		ImageURL string `json:"image_url"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	if req.ImageURL == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "EMPTY_IMAGE", "Image URL is required")
	}

	// Simulate processing time
	time.Sleep(time.Duration(rand.Intn(500)+200) * time.Millisecond)

	// Generate mock OCR result
	result := generateMockOCRResult()

	return SuccessResponse(c, result)
}

func (h *OCRHandler) Categorize(c *fiber.Ctx) error {
	var req struct {
		Description string `json:"description"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	category, confidence := categorizeDescription(req.Description)

	return SuccessResponse(c, fiber.Map{
		"category":   category,
		"confidence": confidence,
	})
}

func generateMockOCRResult() fiber.Map {
	vendors := []string{"Indomaret", "Alfamart", "Giant", "GoFood", "GrabFood", "McDonald's", "KFC"}
	vendor := vendors[rand.Intn(len(vendors))]

	items := []fiber.Map{
		{"name": "Item 1", "qty": 1, "price": 25000},
		{"name": "Item 2", "qty": 2, "price": 15000},
		{"name": "Item 3", "qty": 1, "price": 35000},
	}

	total := 90000
	date := time.Now().AddDate(0, 0, -rand.Intn(7)).Format("2006-01-02")

	return fiber.Map{
		"vendor":     vendor,
		"date":       date,
		"total":      total,
		"items":      items,
		"category":   "Belanja",
		"confidence": 0.85 + rand.Float64()*0.14,
	}
}

func categorizeDescription(desc string) (string, float64) {
	descLower := strings.ToLower(desc)

	keywords := map[string][]string{
		"Makanan":   {"makan", "resto", "food", "kfc", "mcd"},
		"Transport": {"bensin", "parkir", "grab", "gojek"},
		"Belanja":   {"indomaret", "alfamart", "toko"},
		"Tagihan":   {"listrik", "pln", "internet", "pulsa"},
	}

	for category, kws := range keywords {
		for _, kw := range kws {
			if strings.Contains(descLower, kw) {
				return category, 0.85 + rand.Float64()*0.14
			}
		}
	}

	return "Lainnya", 0.5 + rand.Float64()*0.2
}

// ChatHandler handles AI chat
type ChatHandler struct{}

func NewChatHandler() *ChatHandler {
	return &ChatHandler{}
}

func (h *ChatHandler) Chat(c *fiber.Ctx) error {
	var req struct {
		Message string              `json:"message"`
		History []map[string]string `json:"history"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	if req.Message == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "EMPTY_MESSAGE", "Message cannot be empty")
	}

	response := generateChatResponse(req.Message)

	return SuccessResponse(c, fiber.Map{
		"response":  response,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func generateChatResponse(message string) string {
	msg := strings.ToLower(message)

	if containsAny(msg, []string{"halo", "hi", "hello", "hai"}) {
		return "Halo! 👋 Saya FinLapor AI Assistant. Saya bisa membantu Anda menganalisis keuangan. Ada yang bisa saya bantu?"
	}

	if containsAny(msg, []string{"pengeluaran", "expense", "belanja"}) {
		return "📊 Total Pengeluaran Bulan Ini: Rp 9.250.000\n\nTop Kategori:\n1. Makanan: Rp 2.500.000 (27%)\n2. Belanja: Rp 2.000.000 (22%)\n3. Transport: Rp 1.500.000 (16%)"
	}

	if containsAny(msg, []string{"pemasukan", "income", "gaji"}) {
		return "💰 Total Pemasukan Bulan Ini: Rp 25.000.000\n\nSumber:\n- Gaji: Rp 20.000.000\n- Freelance: Rp 3.500.000\n- Investasi: Rp 1.500.000"
	}

	if containsAny(msg, []string{"menabung", "nabung", "tips", "hemat"}) {
		return "💡 Tips Menabung:\n\n1. Aturan 50/30/20\n2. Otomatis tabungan setiap gajian\n3. Lacak pengeluaran kecil\n4. Gunakan FinLapor untuk tracking!"
	}

	return "Saya bisa membantu dengan:\n- 📊 Analisis pengeluaran\n- 💰 Tips menabung\n- 🏷️ Kategori pengeluaran\n- 📋 Laporan keuangan\n\nCoba tanyakan: \"Berapa pengeluaran bulan ini?\""
}

func containsAny(s string, substrs []string) bool {
	for _, substr := range substrs {
		if strings.Contains(s, substr) {
			return true
		}
	}
	return false
}

// DashboardHandler handles dashboard data
type DashboardHandler struct{}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{}
}

func (h *DashboardHandler) GetSummary(c *fiber.Ctx) error {
	summary := fiber.Map{
		"total_balance":  15750000,
		"total_income":   25000000,
		"total_expense":  9250000,
		"savings_rate":   63,
		"monthly_change": 12.5,
		"recent_transactions": []fiber.Map{
			{"id": "1", "type": "expense", "category": "Makanan", "amount": 85000, "description": "Makan siang", "date": "2026-01-22"},
			{"id": "2", "type": "income", "category": "Gaji", "amount": 15000000, "description": "Gaji Januari", "date": "2026-01-01"},
			{"id": "3", "type": "expense", "category": "Transport", "amount": 150000, "description": "Bensin", "date": "2026-01-20"},
		},
		"category_breakdown": []fiber.Map{
			{"name": "Makanan", "amount": 2500000, "percentage": 27},
			{"name": "Transport", "amount": 1500000, "percentage": 16},
			{"name": "Belanja", "amount": 2000000, "percentage": 22},
			{"name": "Hiburan", "amount": 1000000, "percentage": 11},
			{"name": "Tagihan", "amount": 1500000, "percentage": 16},
			{"name": "Lainnya", "amount": 750000, "percentage": 8},
		},
	}

	return SuccessResponse(c, summary)
}

func (h *DashboardHandler) GetInsights(c *fiber.Ctx) error {
	insights := []fiber.Map{
		{"type": "warning", "title": "Pengeluaran Makanan Tinggi", "message": "15% lebih tinggi dari rata-rata"},
		{"type": "success", "title": "Target Tabungan Tercapai", "message": "63% dari target bulanan"},
		{"type": "info", "title": "Tagihan Akan Jatuh Tempo", "message": "Listrik dalam 5 hari"},
	}

	return SuccessResponse(c, insights)
}
