package repository

import (
	"github.com/google/uuid"
	"github.com/yourusername/finlapor/backend/internal/models"
	"gorm.io/gorm"
)

type ReportRepository struct {
	db *gorm.DB
}

func NewReportRepository(db *gorm.DB) *ReportRepository {
	return &ReportRepository{db: db}
}

func (r *ReportRepository) Create(report *models.Report) error {
	return r.db.Create(report).Error
}

func (r *ReportRepository) FindByUserID(userID uuid.UUID) ([]models.Report, error) {
	var reports []models.Report
	err := r.db.Where("user_id = ?", userID).Order("generated_at DESC").Find(&reports).Error
	return reports, err
}

func (r *ReportRepository) FindByID(id uuid.UUID) (*models.Report, error) {
	var report models.Report
	err := r.db.First(&report, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &report, nil
}
