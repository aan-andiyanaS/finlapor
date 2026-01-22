package repository

import (
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
	return r.db.Create(tx).Error
}

func (r *TransactionRepository) GetByID(id uuid.UUID) (*models.Transaction, error) {
	var tx models.Transaction
	err := r.db.Preload("Category").First(&tx, "id = ?", id).Error
	return &tx, err
}

func (r *TransactionRepository) GetByUserID(userID uuid.UUID, limit, offset int) ([]models.Transaction, error) {
	var transactions []models.Transaction
	err := r.db.
		Preload("Category").
		Where("user_id = ?", userID).
		Order("date DESC").
		Limit(limit).
		Offset(offset).
		Find(&transactions).Error
	return transactions, err
}

func (r *TransactionRepository) Update(tx *models.Transaction) error {
	return r.db.Save(tx).Error
}

func (r *TransactionRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Transaction{}, "id = ?", id).Error
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

	return map[string]interface{}{
		"total_income":  totalIncome,
		"total_expense": totalExpense,
		"balance":       totalIncome - totalExpense,
	}, nil
}
