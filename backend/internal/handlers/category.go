package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/yourusername/finlapor/backend/internal/models"
	"github.com/yourusername/finlapor/backend/internal/services"
)

type CategoryHandler struct {
	catService *services.CategoryService
}

func NewCategoryHandler(catService *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{catService: catService}
}

func (h *CategoryHandler) List(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, _ := uuid.Parse(userIDStr)

	categories, err := h.catService.List(&userID)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return SuccessResponse(c, categories)
}

func (h *CategoryHandler) Create(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, _ := uuid.Parse(userIDStr)

	var req struct {
		Name  string `json:"name"`
		Type  string `json:"type"`
		Icon  string `json:"icon"`
		Color string `json:"color"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	category := &models.Category{
		UserID: &userID,
		Name:   req.Name,
		Type:   req.Type,
		Icon:   &req.Icon,
		Color:  &req.Color,
	}

	if err := h.catService.Create(category); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return CreatedResponse(c, category)
}

func (h *CategoryHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid ID")
	}

	var req struct {
		Name  string `json:"name"`
		Icon  string `json:"icon"`
		Color string `json:"color"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	category := &models.Category{
		ID:    id,
		Name:  req.Name,
		Icon:  &req.Icon,
		Color: &req.Color,
	}

	if err := h.catService.Update(category); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return SuccessResponse(c, category)
}

func (h *CategoryHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid ID")
	}

	if err := h.catService.Delete(id); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return c.SendStatus(fiber.StatusNoContent)
}
