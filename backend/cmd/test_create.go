package main

import (
	"fmt"
	"log"
	"time"

	"github.com/joho/godotenv"
	"github.com/yourusername/finlapor/backend/internal/config"
	"github.com/yourusername/finlapor/backend/internal/models"
	"github.com/yourusername/finlapor/backend/internal/repository"
)

func main() {
	godotenv.Load()
	cfg := config.New()
	db, err := config.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}

	// Get demo user ID (from previous logins)
	var user models.User
	db.Where("email = ?", "demo@finlapor.airi.click").First(&user)
	if user.ID.String() == "00000000-0000-0000-0000-000000000000" {
		log.Fatal("Demo user not found! Please login first.")
	}
	fmt.Printf("Using user: %s (ID: %s)\n", user.Email, user.ID)

	// Get a category
	var category models.Category
	db.Where("user_id IS NULL AND type = ?", "income").First(&category)
	if category.ID.String() == "00000000-0000-0000-0000-000000000000" {
		log.Fatal("No income category found!")
	}
	fmt.Printf("Using category: %s (Type: %s, ID: %s)\n", category.Name, category.Type, category.ID)

	// Try to create transaction
	repo := repository.NewTransactionRepository(db)

	description := "Test transaction"
	tx := &models.Transaction{
		UserID:      user.ID,
		Type:        "income",
		CategoryID:  &category.ID,
		Amount:      200000,
		Description: &description,
		Date:        time.Now(),
	}

	fmt.Println("\n=== Creating Transaction ===")
	err = repo.Create(tx)
	if err != nil {
		fmt.Printf("❌ ERROR: %v\n", err)
		fmt.Printf("\nTransaction that failed:\n")
		fmt.Printf("  UserID: %s\n", tx.UserID)
		fmt.Printf("  Type: %s\n", tx.Type)
		fmt.Printf("  CategoryID: %v\n", tx.CategoryID)
		fmt.Printf("  Amount: %.2f\n", tx.Amount)
		fmt.Printf("  Date: %s\n", tx.Date)
	} else {
		fmt.Printf("✅ SUCCESS! Transaction created with ID: %s\n", tx.ID)
	}
}
