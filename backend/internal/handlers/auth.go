package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/finlapor/backend/internal/services"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Age      *int   `json:"age"`
	Mode     string `json:"mode"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	// Validate required fields
	if req.Email == "" || req.Password == "" || req.Name == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Email, password, and name are required")
	}

	// Set default mode
	if req.Mode == "" {
		req.Mode = "personal"
	}

	result, err := h.authService.Register(req.Email, req.Password, req.Name, req.Mode, req.Age)
	if err != nil {
		if err.Error() == "email already exists" {
			return ErrorResponse(c, fiber.StatusConflict, "CONFLICT", "Email already registered")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return CreatedResponse(c, result)
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	if req.Email == "" || req.Password == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Email and password are required")
	}

	result, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Invalid credentials")
	}

	return SuccessResponse(c, result)
}

func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	var req RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	if req.RefreshToken == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Refresh token is required")
	}

	result, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Invalid refresh token")
	}

	return SuccessResponse(c, result)
}
