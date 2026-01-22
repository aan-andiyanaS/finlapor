package repository

import (
	"time"

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

func (r *TransactionRepository) FindByID(id uuid.UUID) (*models.Transaction, error) {
	var tx models.Transaction
	err := r.db.Preload("Category").First(&tx, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *TransactionRepository) FindByUserID(userID uuid.UUID, limit, offset int) ([]models.Transaction, int64, error) {
	var transactions []models.Transaction
	var total int64

	r.db.Model(&models.Transaction{}).Where("user_id = ?", userID).Count(&total)

	err := r.db.Preload("Category").
		Where("user_id = ?", userID).
		Order("date DESC").
		Limit(limit).
		Offset(offset).
		Find(&transactions).Error

	return transactions, total, err
}

func (r *TransactionRepository) FindByUserIDAndDateRange(userID uuid.UUID, start, end time.Time) ([]models.Transaction, error) {
	var transactions []models.Transaction
	err := r.db.Preload("Category").
		Where("user_id = ? AND date >= ? AND date <= ?", userID, start, end).
		Order("date DESC").
		Find(&transactions).Error
	return transactions, err
}

func (r *TransactionRepository) Update(tx *models.Transaction) error {
	return r.db.Save(tx).Error
}

func (r *TransactionRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Transaction{}, "id = ?", id).Error
}

func (r *TransactionRepository) GetSummary(userID uuid.UUID, start, end time.Time) (float64, float64, error) {
	var income, expense float64

	r.db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = ? AND date >= ? AND date <= ?", userID, "income", start, end).
		Select("COALESCE(SUM(amount), 0)").Scan(&income)

	r.db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = ? AND date >= ? AND date <= ?", userID, "expense", start, end).
		Select("COALESCE(SUM(amount), 0)").Scan(&expense)

	return income, expense, nil
}
