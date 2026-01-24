package repository

import (
	"log"

	"github.com/google/uuid"
	"github.com/yourusername/finlapor/backend/internal/models"
	"gorm.io/gorm"
)

type TransactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) Create(tx *models.Transaction) error {
	log.Printf("Repository Create - UserID: %s, Type: %s, Amount: %.2f, CategoryID: %v, Date: %s, Items: %d",
		tx.UserID, tx.Type, tx.Amount, tx.CategoryID, tx.Date, len(tx.Items))

	// Use transaction to ensure atomicity
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		// Create the main transaction first
		if err := dbTx.Omit("Items").Create(tx).Error; err != nil {
			log.Printf("Database Create Error: %v", err)
			return err
		}

		// Create items with the transaction ID
		for i := range tx.Items {
			tx.Items[i].TransactionID = tx.ID
			if err := dbTx.Create(&tx.Items[i]).Error; err != nil {
				log.Printf("Database Create Item Error: %v", err)
				return err
			}
		}

		return nil
	})
}

func (r *TransactionRepository) GetByID(id uuid.UUID) (*models.Transaction, error) {
	var tx models.Transaction
	err := r.db.
		Preload("Category").
		Preload("Items").
		Preload("Items.Category").
		First(&tx, "id = ?", id).Error
	return &tx, err
}

func (r *TransactionRepository) GetByUserID(userID uuid.UUID, limit, offset int) ([]models.Transaction, error) {
	var transactions []models.Transaction
	err := r.db.
		Preload("Category").
		Preload("Items").
		Preload("Items.Category").
		Where("user_id = ?", userID).
		Order("date DESC").
		Limit(limit).
		Offset(offset).
		Find(&transactions).Error
	return transactions, err
}

func (r *TransactionRepository) Update(tx *models.Transaction) error {
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		// Delete old items
		if err := dbTx.Where("transaction_id = ?", tx.ID).Delete(&models.TransactionItem{}).Error; err != nil {
			return err
		}

		// Create new items
		for i := range tx.Items {
			tx.Items[i].TransactionID = tx.ID
			if err := dbTx.Create(&tx.Items[i]).Error; err != nil {
				return err
			}
		}

		// Update main transaction (without items to avoid issues)
		return dbTx.Omit("Items").Save(tx).Error
	})
}

func (r *TransactionRepository) Delete(id uuid.UUID) error {
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		// Delete items first (cascade should handle this, but explicit is safer)
		if err := dbTx.Where("transaction_id = ?", id).Delete(&models.TransactionItem{}).Error; err != nil {
			return err
		}
		// Delete transaction
		return dbTx.Delete(&models.Transaction{}, "id = ?", id).Error
	})
}

func (r *TransactionRepository) GetSummary(userID uuid.UUID) (map[string]interface{}, error) {
	var totalIncome, totalExpense float64

	r.db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = ?", userID, "income").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalIncome)

	r.db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = ?", userID, "expense").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalExpense)

	balance := totalIncome - totalExpense
	savingsRatio := 0.0
	if totalIncome > 0 {
		savingsRatio = (balance / totalIncome) * 100
	}

	return map[string]interface{}{
		"totalIncome":  totalIncome,
		"totalExpense": totalExpense,
		"balance":      balance,
		"savingsRatio": savingsRatio,
	}, nil
}

// GetGroupedSummary returns summary grouped by category groups
func (r *TransactionRepository) GetGroupedSummary(userID uuid.UUID) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	// Query to get totals by category group
	rows, err := r.db.Raw(`
		SELECT 
			cg.id as group_id,
			cg.name as group_name,
			cg.icon as group_icon,
			cg.color as group_color,
			COALESCE(SUM(ti.amount), 0) as total_amount,
			COUNT(DISTINCT t.id) as transaction_count
		FROM category_groups cg
		LEFT JOIN categories c ON c.group_id = cg.id
		LEFT JOIN transaction_items ti ON ti.category_id = c.id
		LEFT JOIN transactions t ON t.id = ti.transaction_id AND t.user_id = ?
		WHERE cg.user_id IS NULL OR cg.user_id = ?
		GROUP BY cg.id, cg.name, cg.icon, cg.color
		ORDER BY cg.sort_order
	`, userID, userID).Rows()

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var groupID, groupName, groupIcon, groupColor string
		var totalAmount float64
		var txCount int

		if err := rows.Scan(&groupID, &groupName, &groupIcon, &groupColor, &totalAmount, &txCount); err != nil {
			continue
		}

		results = append(results, map[string]interface{}{
			"group_id":          groupID,
			"group_name":        groupName,
			"group_icon":        groupIcon,
			"group_color":       groupColor,
			"total_amount":      totalAmount,
			"transaction_count": txCount,
		})
	}

	return results, nil
}
