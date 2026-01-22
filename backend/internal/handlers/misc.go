package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
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

// DashboardHandler handles dashboard data from real database
type DashboardHandler struct {
	txService *services.TransactionService
}

func NewDashboardHandler(txService *services.TransactionService) *DashboardHandler {
	return &DashboardHandler{txService: txService}
}

func (h *DashboardHandler) GetSummary(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "INVALID_USER", "Invalid user ID")
	}

	// Get real summary from database
	summary, err := h.txService.GetSummary(userID)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	// Get recent transactions
	recentTx, err := h.txService.List(userID, 1, 5)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	summary["recent_transactions"] = recentTx

	return SuccessResponse(c, summary)
}

func (h *DashboardHandler) GetInsights(c *fiber.Ctx) error {
	// TODO: Generate AI insights from transaction data
	insights := []fiber.Map{
		{"type": "info", "title": "Selamat Datang", "message": "Mulai catat transaksi Anda untuk mendapatkan insights keuangan!"},
	}

	return SuccessResponse(c, insights)
}
