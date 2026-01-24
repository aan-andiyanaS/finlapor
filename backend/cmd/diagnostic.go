package main

import (
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"github.com/yourusername/finlapor/backend/internal/config"
	"github.com/yourusername/finlapor/backend/internal/models"
)

func main() {
	// Load .env
	godotenv.Load()

	// Connect to DB
	cfg := config.New()
	db, err := config.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("=== DATABASE DIAGNOSTIC ===\n")

	// Check categories
	var categories []models.Category
	if err := db.Find(&categories).Error; err != nil {
		log.Printf("ERROR fetching categories: %v", err)
	} else {
		fmt.Printf("Total categories: %d\n", len(categories))
		for i, cat := range categories {
			icon := "nil"
			if cat.Icon != nil {
				icon = *cat.Icon
			}
			fmt.Printf("%d. ID=%s, Name=%s, Type=%s, Icon=%s, UserID=%v\n",
				i+1, cat.ID, cat.Name, cat.Type, icon, cat.UserID)
		}
	}

	fmt.Println("\n=== TEST TRANSACTION CREATE ===")

	// Try to create a test transaction
	var firstCategory models.Category
	db.Where("user_id IS NULL").First(&firstCategory)

	if firstCategory.ID.String() == "00000000-0000-0000-0000-000000000000" {
		fmt.Println("ERROR: No categories found in database!")
		fmt.Println("\nSolution: Run migration to seed default categories")
		return
	}

	fmt.Printf("\nUsing category: %s (Type: %s)\n", firstCategory.Name, firstCategory.Type)
	fmt.Println("\nDiagnostic complete!")
}
