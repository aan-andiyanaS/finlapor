package main

import (
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"github.com/yourusername/finlapor/backend/internal/config"
	"github.com/yourusername/finlapor/backend/internal/handlers"
	"github.com/yourusername/finlapor/backend/internal/middleware"
	"github.com/yourusername/finlapor/backend/internal/repository"
	"github.com/yourusername/finlapor/backend/internal/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize config
	cfg := config.New()

	// Initialize database
	db, err := config.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Redis
	rdb := config.InitRedis(cfg.RedisURL)

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	reportRepo := repository.NewReportRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo, rdb, cfg.JWTSecret)
	userService := services.NewUserService(userRepo)
	transactionService := services.NewTransactionService(transactionRepo, categoryRepo)
	categoryService := services.NewCategoryService(categoryRepo)
	reportService := services.NewReportService(reportRepo, transactionRepo)
	uploadService := services.NewUploadService(cfg)
	aiService := services.NewAIService(cfg)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService)
	transactionHandler := handlers.NewTransactionHandler(transactionService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	reportHandler := handlers.NewReportHandler(reportService)
	uploadHandler := handlers.NewUploadHandler(uploadService)
	ocrHandler := handlers.NewOCRHandler(aiService, uploadService)
	chatHandler := handlers.NewChatHandler(aiService)
	dashboardHandler := handlers.NewDashboardHandler(transactionService)

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "FinLapor API",
		ErrorHandler: handlers.ErrorHandler,
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// API routes
	api := app.Group("/api/v1")

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.Refresh)

	// Protected routes
	protected := api.Group("", middleware.AuthMiddleware(cfg.JWTSecret))

	// User routes
	user := protected.Group("/user")
	user.Get("/profile", userHandler.GetProfile)
	user.Put("/profile", userHandler.UpdateProfile)

	// Transaction routes
	transactions := protected.Group("/transactions")
	transactions.Get("", transactionHandler.List)
	transactions.Post("", transactionHandler.Create)
	transactions.Get("/:id", transactionHandler.Get)
	transactions.Put("/:id", transactionHandler.Update)
	transactions.Delete("/:id", transactionHandler.Delete)

	// Category routes
	categories := protected.Group("/categories")
	categories.Get("", categoryHandler.List)
	categories.Post("", categoryHandler.Create)
	categories.Put("/:id", categoryHandler.Update)
	categories.Delete("/:id", categoryHandler.Delete)

	// Report routes
	reports := protected.Group("/reports")
	reports.Get("", reportHandler.List)
	reports.Post("/generate", reportHandler.Generate)
	reports.Get("/:id", reportHandler.Get)

	// Upload routes
	protected.Post("/upload/presign", uploadHandler.GetPresignedURL)

	// OCR routes
	protected.Post("/ocr/scan", ocrHandler.Scan)

	// Chat routes
	protected.Post("/chat", chatHandler.Send)

	// Dashboard routes
	protected.Get("/dashboard/summary", dashboardHandler.GetSummary)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 FinLapor API running on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
