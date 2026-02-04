package handlers

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/yourusername/finlapor/backend/internal/models"
	"github.com/yourusername/finlapor/backend/internal/services"
)

// UploadHandler handles file uploads
type UploadHandler struct {
	uploadService *services.UploadService
}

func NewUploadHandler(uploadService *services.UploadService) *UploadHandler {
	return &UploadHandler{uploadService: uploadService}
}

func (h *UploadHandler) Upload(c *fiber.Ctx) error {
	// Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		log.Printf("⚠️ Upload: No file in form - %v", err)
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "No file uploaded")
	}

	log.Printf("📤 Upload: Received file '%s' (%d bytes, type: %s)", file.Filename, file.Size, file.Header.Get("Content-Type"))

	// Validate file size (max 10MB)
	if file.Size > 10*1024*1024 {
		log.Printf("⚠️ Upload: File too large (%d bytes)", file.Size)
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "File too large (max 10MB)")
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		log.Printf("⚠️ Upload: Failed to open file - %v", err)
		return ErrorResponse(c, fiber.StatusInternalServerError, "UPLOAD_ERROR", "Failed to read file")
	}
	defer src.Close()

	// Upload to service
	result, err := h.uploadService.Upload(
		c.Context(),
		file.Filename,
		file.Size,
		file.Header.Get("Content-Type"),
		src,
	)

	if err != nil {
		log.Printf("❌ Upload: Failed to upload to storage - %v", err)
		return ErrorResponse(c, fiber.StatusInternalServerError, "UPLOAD_ERROR", err.Error())
	}

	log.Printf("✅ Upload: Success - URL: %s", result.URL)
	return SuccessResponse(c, result)
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

// OCRHandler handles receipt scanning with HuggingFace or Lambda fallback
type OCRHandler struct {
	hfService     *services.HuggingFaceService
	lambdaService *services.LambdaService
}

func NewOCRHandler() *OCRHandler {
	return &OCRHandler{
		hfService:     services.NewHuggingFaceService(),
		lambdaService: services.NewLambdaService(),
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

	var result *services.OCRResult
	var err error
	aiProvider := "mock"

	// Priority: HuggingFace → Lambda → Mock
	if h.hfService.IsConfigured() {
		aiProvider = "huggingface"
		result, err = h.hfService.ScanReceipt(req.ImageURL)
	} else if h.lambdaService.IsConfigured() {
		aiProvider = "lambda"
		result, err = h.lambdaService.ScanReceipt(req.ImageURL)
	} else {
		// Fallback to mock via HuggingFace (which returns mock when not configured)
		result, err = h.hfService.ScanReceipt(req.ImageURL)
	}

	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "OCR_ERROR", err.Error())
	}

	return SuccessResponse(c, fiber.Map{
		"vendor":      result.Vendor,
		"date":        result.Date,
		"total":       result.Total,
		"items":       result.Items,
		"category":    result.Category,
		"confidence":  result.Confidence,
		"raw_text":    result.RawText,
		"ai_enabled":  h.hfService.IsConfigured() || h.lambdaService.IsConfigured(),
		"ai_provider": aiProvider,
	})
}

func (h *OCRHandler) Categorize(c *fiber.Ctx) error {
	var req struct {
		Description string `json:"description"`
	}

	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}

	var category string
	var confidence float64
	aiProvider := "mock"

	// Priority: HuggingFace → Lambda → Mock
	if h.hfService.IsConfigured() {
		aiProvider = "huggingface"
		category, confidence = h.hfService.Categorize(req.Description)
	} else if h.lambdaService.IsConfigured() {
		aiProvider = "lambda"
		var err error
		category, confidence, err = h.lambdaService.Categorize(req.Description)
		if err != nil {
			// Fallback to mock
			category, confidence = h.hfService.Categorize(req.Description)
			aiProvider = "mock"
		}
	} else {
		category, confidence = h.hfService.Categorize(req.Description)
	}

	return SuccessResponse(c, fiber.Map{
		"category":    category,
		"confidence":  confidence,
		"ai_enabled":  h.hfService.IsConfigured() || h.lambdaService.IsConfigured(),
		"ai_provider": aiProvider,
	})
}

// ChatHandler handles AI chat with HuggingFace or Lambda fallback
type ChatHandler struct {
	hfService     *services.HuggingFaceService
	lambdaService *services.LambdaService
	txService     *services.TransactionService
	userService   *services.UserService
}

func NewChatHandler(txService *services.TransactionService, userService *services.UserService) *ChatHandler {
	return &ChatHandler{
		hfService:     services.NewHuggingFaceService(),
		lambdaService: services.NewLambdaService(),
		txService:     txService,
		userService:   userService,
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

	// Get user ID from context
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "INVALID_USER", "Invalid user ID")
	}

	// Fetch user info including age
	user, _ := h.userService.GetByID(userID)

	// Fetch user's financial data
	financialContext := h.buildFinancialContext(userID, user)

	// Merge with request context
	if req.Context == nil {
		req.Context = make(map[string]interface{})
	}
	req.Context["financial_data"] = financialContext

	var result *services.ChatResponse
	var chatErr error
	aiProvider := "mock"
	userAge := 0
	if user != nil && user.Age != nil {
		userAge = *user.Age
	}

	// Priority: HuggingFace → Lambda → Mock
	if h.hfService.IsConfigured() {
		aiProvider = "huggingface"
		result, chatErr = h.hfService.Chat(req.Message, req.Context)
	} else if h.lambdaService.IsConfigured() {
		aiProvider = "lambda"
		result, chatErr = h.lambdaService.Chat(req.Message, req.Context, userAge)
		if chatErr != nil {
			// Fallback to mock
			result, chatErr = h.hfService.Chat(req.Message, req.Context)
			aiProvider = "mock"
		}
	} else {
		// Use mock via HuggingFace
		result, chatErr = h.hfService.Chat(req.Message, req.Context)
	}

	if chatErr != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "CHAT_ERROR", chatErr.Error())
	}

	return SuccessResponse(c, fiber.Map{
		"response":    result.Response,
		"timestamp":   result.Timestamp,
		"ai_enabled":  h.hfService.IsConfigured() || h.lambdaService.IsConfigured(),
		"ai_provider": aiProvider,
	})
}

// buildFinancialContext creates a summary of user's financial data for AI context
func (h *ChatHandler) buildFinancialContext(userID uuid.UUID, user *models.User) string {
	// Build user profile info
	userInfo := ""
	if user != nil {
		userInfo = fmt.Sprintf("Nama User: %s\n", user.Name)
		if user.Age != nil {
			userInfo += fmt.Sprintf("Usia: %d tahun\n", *user.Age)
		}
		userInfo += fmt.Sprintf("Mode: %s\n", user.Mode)
	}

	// Get summary
	summary, err := h.txService.GetSummary(userID)
	if err != nil {
		return userInfo + "Tidak ada data keuangan tersedia."
	}

	// Get recent transactions (last 100 for better analysis)
	transactions, err := h.txService.List(userID, 1, 100)
	if err != nil {
		transactions = []models.Transaction{}
	}

	// Build context string
	totalIncome := summary["total_income"]
	totalExpense := summary["total_expense"]
	balance := summary["balance"]

	// Calculate category breakdown from transactions
	expenseByCategory := make(map[string]float64)
	incomeByCategory := make(map[string]float64)

	for _, tx := range transactions {
		categoryName := "Lainnya"
		if tx.Category != nil {
			categoryName = tx.Category.Name
		} else if len(tx.Items) > 0 && tx.Items[0].Category != nil {
			categoryName = tx.Items[0].Category.Name
		}

		if tx.Type == "expense" {
			expenseByCategory[categoryName] += tx.Amount
		} else if tx.Type == "income" {
			incomeByCategory[categoryName] += tx.Amount
		}
	}

	// Format category breakdown
	expenseCategoryStr := ""
	totalExpenseFromCat := 0.0
	for cat, amount := range expenseByCategory {
		expenseCategoryStr += fmt.Sprintf("  - %s: Rp %.0f\n", cat, amount)
		totalExpenseFromCat += amount
	}
	if expenseCategoryStr == "" {
		expenseCategoryStr = "  (belum ada data)\n"
	}

	incomeCategoryStr := ""
	totalIncomeFromCat := 0.0
	for cat, amount := range incomeByCategory {
		incomeCategoryStr += fmt.Sprintf("  - %s: Rp %.0f\n", cat, amount)
		totalIncomeFromCat += amount
	}
	if incomeCategoryStr == "" {
		incomeCategoryStr = "  (belum ada data)\n"
	}

	// Build transaction list summary
	txSummary := ""
	if len(transactions) > 0 {
		txSummary = fmt.Sprintf("Total transaksi tercatat: %d transaksi\n", len(transactions))

		// Get latest 15 for details
		count := 15
		if len(transactions) < 15 {
			count = len(transactions)
		}
		txSummary += "Transaksi terbaru:\n"
		for i := 0; i < count; i++ {
			tx := transactions[i]
			desc := "(tanpa deskripsi)"
			if tx.Description != nil && *tx.Description != "" {
				desc = *tx.Description
			}
			categoryName := "Lainnya"
			if tx.Category != nil {
				categoryName = tx.Category.Name
			} else if len(tx.Items) > 0 && tx.Items[0].Category != nil {
				categoryName = tx.Items[0].Category.Name
			}
			txSummary += fmt.Sprintf("  - %s [%s] (%s): Rp %.0f pada %s\n", desc, categoryName, tx.Type, tx.Amount, tx.Date.Format("2006-01-02"))
		}
	}

	context := fmt.Sprintf(`=== PROFIL USER ===
%s
=== DATA KEUANGAN USER ===
Total Pemasukan: Rp %.0f
Total Pengeluaran: Rp %.0f
Saldo/Balance: Rp %.0f

PEMASUKAN per Kategori:
%s
PENGELUARAN per Kategori:
%s
DETAIL TRANSAKSI:
%s
===========================`, userInfo, totalIncome, totalExpense, balance, incomeCategoryStr, expenseCategoryStr, txSummary)

	return context
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
