package services

import (
	"time"

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

type TransactionListResult struct {
	Transactions []models.Transaction `json:"transactions"`
	Pagination   Pagination           `json:"pagination"`
}

type Pagination struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

func (s *TransactionService) List(userID uuid.UUID, page, limit int) (*TransactionListResult, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	transactions, total, err := s.txRepo.FindByUserID(userID, limit, offset)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	return &TransactionListResult{
		Transactions: transactions,
		Pagination: Pagination{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	}, nil
}

func (s *TransactionService) Create(tx *models.Transaction) error {
	return s.txRepo.Create(tx)
}

func (s *TransactionService) GetByID(id uuid.UUID) (*models.Transaction, error) {
	return s.txRepo.FindByID(id)
}

func (s *TransactionService) Update(tx *models.Transaction) error {
	return s.txRepo.Update(tx)
}

func (s *TransactionService) Delete(id uuid.UUID) error {
	return s.txRepo.Delete(id)
}

func (s *TransactionService) GetSummary(userID uuid.UUID, period string) (map[string]interface{}, error) {
	now := time.Now()
	var start, end time.Time

	switch period {
	case "week":
		start = now.AddDate(0, 0, -7)
		end = now
	case "year":
		start = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
		end = now
	default: // month
		start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		end = now
	}

	income, expense, err := s.txRepo.GetSummary(userID, start, end)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_income":  income,
		"total_expense": expense,
		"balance":       income - expense,
	}, nil
}
