package handlers

import (
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

// OCRHandler handles receipt scanning with HuggingFace
type OCRHandler struct {
	hfService *services.HuggingFaceService
}

func NewOCRHandler() *OCRHandler {
	return &OCRHandler{
		hfService: services.NewHuggingFaceService(),
	}
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

	result, err := h.hfService.ScanReceipt(req.ImageURL)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "OCR_ERROR", err.Error())
	}

	return SuccessResponse(c, fiber.Map{
		"vendor":     result.Vendor,
		"date":       result.Date,
		"total":      result.Total,
		"items":      result.Items,
		"category":   result.Category,
		"confidence": result.Confidence,
		"raw_text":   result.RawText,
		"ai_enabled": h.hfService.IsConfigured(),
	})
}

func (h *OCRHandler) Categorize(c *fiber.Ctx) error {
	var req struct {
		Description string `json:"description"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	category, confidence := h.hfService.Categorize(req.Description)

	return SuccessResponse(c, fiber.Map{
		"category":   category,
		"confidence": confidence,
		"ai_enabled": h.hfService.IsConfigured(),
	})
}

// ChatHandler handles AI chat with HuggingFace
type ChatHandler struct {
	hfService *services.HuggingFaceService
}

func NewChatHandler() *ChatHandler {
	return &ChatHandler{
		hfService: services.NewHuggingFaceService(),
	}
}

func (h *ChatHandler) Chat(c *fiber.Ctx) error {
	var req struct {
		Message string                 `json:"message"`
		Context map[string]interface{} `json:"context"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	if req.Message == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "EMPTY_MESSAGE", "Message cannot be empty")
	}

	result, err := h.hfService.Chat(req.Message, req.Context)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "CHAT_ERROR", err.Error())
	}

	return SuccessResponse(c, fiber.Map{
		"response":   result.Response,
		"timestamp":  result.Timestamp,
		"ai_enabled": h.hfService.IsConfigured(),
	})
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
