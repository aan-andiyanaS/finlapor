package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load .env
	godotenv.Load()

	// Connect to database
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_USER", "finlapor"),
		getEnv("DB_PASSWORD", "finlapor123"),
		getEnv("DB_NAME", "finlapor"),
		getEnv("DB_PORT", "5432"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	sqlDB, _ := db.DB()
	defer sqlDB.Close()

	log.Println("✅ Connected to PostgreSQL")

	// Run migration SQL
	migrations := []string{
		// Create category_groups table
		`CREATE TABLE IF NOT EXISTS category_groups (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID REFERENCES users(id) ON DELETE CASCADE,
			name VARCHAR(100) NOT NULL,
			icon VARCHAR(50),
			color VARCHAR(20) DEFAULT '#6366f1',
			sort_order INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Create index
		`CREATE INDEX IF NOT EXISTS idx_category_groups_user_id ON category_groups(user_id)`,

		// Add group_id to categories
		`ALTER TABLE categories ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES category_groups(id) ON DELETE SET NULL`,

		// Create transaction_items table
		`CREATE TABLE IF NOT EXISTS transaction_items (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
			category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
			amount DECIMAL(15,2) NOT NULL,
			note TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Create indexes for transaction_items
		`CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id)`,
		`CREATE INDEX IF NOT EXISTS idx_transaction_items_category_id ON transaction_items(category_id)`,

		// Add total_amount to transactions
		`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2)`,
	}

	for i, sql := range migrations {
		log.Printf("Running migration %d/%d...", i+1, len(migrations))
		if err := db.Exec(sql).Error; err != nil {
			log.Printf("Warning on migration %d: %v", i+1, err)
		}
	}

	// Insert default category groups
	log.Println("Inserting default category groups...")
	db.Exec(`
		INSERT INTO category_groups (id, user_id, name, icon, color, sort_order)
		SELECT uuid_generate_v4(), NULL, name, icon, color, sort_order
		FROM (VALUES
			('Pemasukan', '💰', '#22c55e', 1),
			('Pengeluaran Harian', '🛒', '#f97316', 2),
			('Tagihan & Utilitas', '📄', '#ef4444', 3),
			('Gaya Hidup', '🎮', '#8b5cf6', 4),
			('Lainnya', '📦', '#6b7280', 5)
		) AS v(name, icon, color, sort_order)
		WHERE NOT EXISTS (SELECT 1 FROM category_groups WHERE user_id IS NULL LIMIT 1)
	`)

	// Migrate existing transactions
	log.Println("Migrating existing transactions...")
	db.Exec(`
		INSERT INTO transaction_items (id, transaction_id, category_id, amount, note)
		SELECT uuid_generate_v4(), t.id, t.category_id, t.amount, NULL
		FROM transactions t
		WHERE t.category_id IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM transaction_items ti WHERE ti.transaction_id = t.id)
	`)

	// Update total_amount
	db.Exec(`UPDATE transactions SET total_amount = amount WHERE total_amount IS NULL`)

	log.Println("✅ Migration completed successfully!")
	log.Println("You can now restart the backend server.")
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
