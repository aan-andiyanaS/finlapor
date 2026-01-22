package services

import (
	"github.com/google/uuid"
	"github.com/yourusername/finlapor/backend/internal/models"
	"github.com/yourusername/finlapor/backend/internal/repository"
)

type ReportService struct {
	reportRepo *repository.ReportRepository
	txRepo     *repository.TransactionRepository
}

func NewReportService(reportRepo *repository.ReportRepository, txRepo *repository.TransactionRepository) *ReportService {
	return &ReportService{
		reportRepo: reportRepo,
		txRepo:     txRepo,
	}
}

func (s *ReportService) List(userID uuid.UUID) ([]models.Report, error) {
	return s.reportRepo.FindByUserID(userID)
}

func (s *ReportService) GetByID(id uuid.UUID) (*models.Report, error) {
	return s.reportRepo.FindByID(id)
}

func (s *ReportService) Generate(report *models.Report) error {
	// TODO: Implement report generation logic
	// This would:
	// 1. Fetch transactions for the period
	// 2. Generate PDF/Excel
	// 3. Upload to S3
	// 4. Save report metadata
	return s.reportRepo.Create(report)
}
