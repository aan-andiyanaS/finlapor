package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/yourusername/finlapor/backend/internal/models"
	"github.com/yourusername/finlapor/backend/internal/services"
)

type TransactionHandler struct {
	txService *services.TransactionService
}

func NewTransactionHandler(txService *services.TransactionService) *TransactionHandler {
	return &TransactionHandler{txService: txService}
}

func (h *TransactionHandler) List(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, _ := uuid.Parse(userIDStr)

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	result, err := h.txService.List(userID, page, limit)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return SuccessResponse(c, result)
}

func (h *TransactionHandler) Create(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, _ := uuid.Parse(userIDStr)

	var req struct {
		Type        string  `json:"type"`
		CategoryID  string  `json:"category_id"`
		Amount      float64 `json:"amount"`
		Description string  `json:"description"`
		Date        string  `json:"date"`
		ReceiptURL  string  `json:"receipt_url"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		date = time.Now()
	}

	tx := &models.Transaction{
		UserID:      userID,
		Type:        req.Type,
		Amount:      req.Amount,
		Description: &req.Description,
		Date:        date,
	}

	if req.CategoryID != "" {
		catID, _ := uuid.Parse(req.CategoryID)
		tx.CategoryID = &catID
	}
	if req.ReceiptURL != "" {
		tx.ReceiptURL = &req.ReceiptURL
	}

	if err := h.txService.Create(tx); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return CreatedResponse(c, tx)
}

func (h *TransactionHandler) Get(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid ID")
	}

	tx, err := h.txService.GetByID(id)
	if err != nil {
		return ErrorResponse(c, fiber.StatusNotFound, "NOT_FOUND", "Transaction not found")
	}

	return SuccessResponse(c, tx)
}

func (h *TransactionHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid ID")
	}

	tx, err := h.txService.GetByID(id)
	if err != nil {
		return ErrorResponse(c, fiber.StatusNotFound, "NOT_FOUND", "Transaction not found")
	}

	var req struct {
		Type        string  `json:"type"`
		CategoryID  string  `json:"category_id"`
		Amount      float64 `json:"amount"`
		Description string  `json:"description"`
		Date        string  `json:"date"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	if req.Type != "" {
		tx.Type = req.Type
	}
	if req.Amount > 0 {
		tx.Amount = req.Amount
	}
	if req.Description != "" {
		tx.Description = &req.Description
	}
	if req.Date != "" {
		if date, err := time.Parse("2006-01-02", req.Date); err == nil {
			tx.Date = date
		}
	}
	if req.CategoryID != "" {
		catID, _ := uuid.Parse(req.CategoryID)
		tx.CategoryID = &catID
	}

	if err := h.txService.Update(tx); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return SuccessResponse(c, tx)
}

func (h *TransactionHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid ID")
	}

	if err := h.txService.Delete(id); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return c.SendStatus(fiber.StatusNoContent)
}
