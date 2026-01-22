package services

import (
	"github.com/google/uuid"
	"github.com/yourusername/finlapor/backend/internal/models"
	"github.com/yourusername/finlapor/backend/internal/repository"
)

type TransactionService struct {
	txRepo  *repository.TransactionRepository
	catRepo *repository.CategoryRepository
}

func NewTransactionService(txRepo *repository.TransactionRepository, catRepo *repository.CategoryRepository) *TransactionService {
	return &TransactionService{
		txRepo:  txRepo,
		catRepo: catRepo,
	}
}

func (s *TransactionService) Create(tx *models.Transaction) error {
	return s.txRepo.Create(tx)
}

func (s *TransactionService) GetByID(id uuid.UUID) (*models.Transaction, error) {
	return s.txRepo.GetByID(id)
}

func (s *TransactionService) List(userID uuid.UUID, page, limit int) ([]models.Transaction, error) {
	offset := (page - 1) * limit
	return s.txRepo.GetByUserID(userID, limit, offset)
}

func (s *TransactionService) Update(tx *models.Transaction) error {
	return s.txRepo.Update(tx)
}

func (s *TransactionService) Delete(id uuid.UUID) error {
	return s.txRepo.Delete(id)
}

func (s *TransactionService) GetSummary(userID uuid.UUID) (map[string]interface{}, error) {
	return s.txRepo.GetSummary(userID)
}
