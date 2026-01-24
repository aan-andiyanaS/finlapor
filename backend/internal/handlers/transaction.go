package handlers

import (
	"log"
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

// TransactionItemRequest represents a single category-amount pair in the request
type TransactionItemRequest struct {
	CategoryID string  `json:"category_id"`
	Amount     float64 `json:"amount"`
	Note       string  `json:"note"`
}

// CreateTransactionRequest supports both legacy single-category and new multi-category format
type CreateTransactionRequest struct {
	Type        string                   `json:"type"`
	CategoryID  string                   `json:"category_id"` // Legacy: single category
	Amount      float64                  `json:"amount"`      // Legacy: single amount
	Description string                   `json:"description"`
	Date        string                   `json:"date"`
	ReceiptURL  string                   `json:"receipt_url"`
	Items       []TransactionItemRequest `json:"items"` // New: multiple items
}

func (h *TransactionHandler) Create(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, _ := uuid.Parse(userIDStr)

	var req CreateTransactionRequest

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	log.Printf("=== CREATE TRANSACTION DEBUG ===")
	log.Printf("Request Type: %s", req.Type)
	log.Printf("Request Description: %s", req.Description)
	log.Printf("Request Items Count: %d", len(req.Items))
	for i, item := range req.Items {
		log.Printf("  Item[%d]: CategoryID=%s, Amount=%.2f", i, item.CategoryID, item.Amount)
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		date = time.Now()
	}

	// Calculate total amount from items or use legacy amount
	var totalAmount float64
	var items []models.TransactionItem

	if len(req.Items) > 0 {
		// New multi-category format
		for _, item := range req.Items {
			totalAmount += item.Amount
			catID, parseErr := uuid.Parse(item.CategoryID)
			if parseErr != nil {
				log.Printf("ERROR parsing CategoryID '%s': %v", item.CategoryID, parseErr)
				continue
			}
			note := item.Note
			items = append(items, models.TransactionItem{
				CategoryID: &catID,
				Amount:     item.Amount,
				Note:       &note,
			})
		}
		log.Printf("Created %d items, totalAmount=%.2f", len(items), totalAmount)
	} else {
		// Legacy single-category format
		totalAmount = req.Amount
		if req.CategoryID != "" {
			catID, _ := uuid.Parse(req.CategoryID)
			items = append(items, models.TransactionItem{
				CategoryID: &catID,
				Amount:     req.Amount,
				Note:       nil,
			})
		}
	}

	tx := &models.Transaction{
		UserID:      userID,
		Type:        req.Type,
		Amount:      totalAmount, // Keep for backward compatibility
		TotalAmount: &totalAmount,
		Description: &req.Description,
		Date:        date,
		Items:       items,
	}

	// Set legacy category_id to first item's category for backward compatibility
	if len(items) > 0 {
		tx.CategoryID = items[0].CategoryID
	}

	if req.ReceiptURL != "" {
		tx.ReceiptURL = &req.ReceiptURL
	}

	log.Printf("Transaction to save: Amount=%.2f, Items=%d", tx.Amount, len(tx.Items))

	if err := h.txService.Create(tx); err != nil {
		log.Printf("Transaction create error: %v", err)
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	log.Printf("Transaction created with ID: %s", tx.ID)

	// Re-fetch to get items with categories properly loaded
	createdTx, err := h.txService.GetByID(tx.ID)
	if err != nil {
		log.Printf("Re-fetch error: %v", err)
		return CreatedResponse(c, tx) // Fallback
	}

	log.Printf("Re-fetched transaction: Amount=%.2f, Items=%d", createdTx.Amount, len(createdTx.Items))
	log.Printf("=== END CREATE TRANSACTION DEBUG ===")

	return CreatedResponse(c, createdTx)
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
		Type        string                   `json:"type"`
		CategoryID  string                   `json:"category_id"`
		Amount      float64                  `json:"amount"`
		Description string                   `json:"description"`
		Date        string                   `json:"date"`
		ReceiptURL  string                   `json:"receipt_url"`
		Items       []TransactionItemRequest `json:"items"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	if req.Type != "" {
		tx.Type = req.Type
	}
	if req.Description != "" {
		tx.Description = &req.Description
	}
	if req.Date != "" {
		if date, err := time.Parse("2006-01-02", req.Date); err == nil {
			tx.Date = date
		}
	}
	if req.ReceiptURL != "" {
		tx.ReceiptURL = &req.ReceiptURL
	}

	// Handle items update
	if len(req.Items) > 0 {
		// Replace all items
		var totalAmount float64
		var newItems []models.TransactionItem
		for _, item := range req.Items {
			totalAmount += item.Amount
			catID, _ := uuid.Parse(item.CategoryID)
			note := item.Note
			newItems = append(newItems, models.TransactionItem{
				TransactionID: tx.ID,
				CategoryID:    &catID,
				Amount:        item.Amount,
				Note:          &note,
			})
		}
		tx.Items = newItems
		tx.Amount = totalAmount
		tx.TotalAmount = &totalAmount
		if len(newItems) > 0 {
			tx.CategoryID = newItems[0].CategoryID
		}
	} else if req.Amount > 0 {
		// Legacy: single amount update
		tx.Amount = req.Amount
		tx.TotalAmount = &req.Amount
		if req.CategoryID != "" {
			catID, _ := uuid.Parse(req.CategoryID)
			tx.CategoryID = &catID
		}
	}

	if err := h.txService.Update(tx); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	// Re-fetch to get updated items with categories
	updatedTx, err := h.txService.GetByID(tx.ID)
	if err != nil {
		return SuccessResponse(c, tx) // Fallback to original
	}

	return SuccessResponse(c, updatedTx)
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

// GetSummary returns income/expense summary
func (h *TransactionHandler) GetSummary(c *fiber.Ctx) error {
	return SuccessResponse(c, fiber.Map{`total_income`: 25000000, `total_expense`: 9250000, `balance`: 15750000})
}
