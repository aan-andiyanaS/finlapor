package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/yourusername/finlapor/backend/internal/services"
)

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

type OCRHandler struct {
	aiService     *services.AIService
	uploadService *services.UploadService
}

func NewOCRHandler(aiService *services.AIService, uploadService *services.UploadService) *OCRHandler {
	return &OCRHandler{
		aiService:     aiService,
		uploadService: uploadService,
	}
}

func (h *OCRHandler) Scan(c *fiber.Ctx) error {
	var req struct {
		ImageURL string `json:"image_url"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	result, err := h.aiService.ScanReceipt(req.ImageURL)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return SuccessResponse(c, result)
}

type ChatHandler struct {
	aiService *services.AIService
}

func NewChatHandler(aiService *services.AIService) *ChatHandler {
	return &ChatHandler{aiService: aiService}
}

func (h *ChatHandler) Send(c *fiber.Ctx) error {
	var req struct {
		Message string                 `json:"message"`
		Context map[string]interface{} `json:"context"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	result, err := h.aiService.Chat(req.Message, req.Context)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return SuccessResponse(c, result)
}

type DashboardHandler struct {
	txService *services.TransactionService
}

func NewDashboardHandler(txService *services.TransactionService) *DashboardHandler {
	return &DashboardHandler{txService: txService}
}

func (h *DashboardHandler) GetSummary(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, _ := uuid.Parse(userIDStr)

	period := c.Query("period", "month")

	summary, err := h.txService.GetSummary(userID, period)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return SuccessResponse(c, summary)
}
