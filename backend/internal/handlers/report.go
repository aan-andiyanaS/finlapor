package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/yourusername/finlapor/backend/internal/models"
	"github.com/yourusername/finlapor/backend/internal/services"
)

type ReportHandler struct {
	reportService *services.ReportService
}

func NewReportHandler(reportService *services.ReportService) *ReportHandler {
	return &ReportHandler{reportService: reportService}
}

func (h *ReportHandler) List(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, _ := uuid.Parse(userIDStr)

	reports, err := h.reportService.List(userID)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return SuccessResponse(c, reports)
}

func (h *ReportHandler) Generate(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, _ := uuid.Parse(userIDStr)

	var req struct {
		Type        string `json:"type"`
		PeriodStart string `json:"period_start"`
		PeriodEnd   string `json:"period_end"`
		Format      string `json:"format"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	start, _ := time.Parse("2006-01-02", req.PeriodStart)
	end, _ := time.Parse("2006-01-02", req.PeriodEnd)

	report := &models.Report{
		UserID:      userID,
		Type:        req.Type,
		PeriodStart: start,
		PeriodEnd:   end,
		GeneratedAt: time.Now(),
	}

	if err := h.reportService.Generate(report); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return SuccessResponse(c, report)
}

func (h *ReportHandler) Get(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid ID")
	}

	report, err := h.reportService.GetByID(id)
	if err != nil {
		return ErrorResponse(c, fiber.StatusNotFound, "NOT_FOUND", "Report not found")
	}

	return SuccessResponse(c, report)
}
