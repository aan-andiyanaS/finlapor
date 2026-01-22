package services

import (
	"github.com/google/uuid"
	"github.com/yourusername/finlapor/backend/internal/models"
	"github.com/yourusername/finlapor/backend/internal/repository"
)

type CategoryService struct {
	catRepo *repository.CategoryRepository
}

func NewCategoryService(catRepo *repository.CategoryRepository) *CategoryService {
	return &CategoryService{catRepo: catRepo}
}

func (s *CategoryService) List(userID *uuid.UUID) ([]models.Category, error) {
	return s.catRepo.FindAll(userID)
}

func (s *CategoryService) Create(category *models.Category) error {
	return s.catRepo.Create(category)
}

func (s *CategoryService) Update(category *models.Category) error {
	return s.catRepo.Update(category)
}

func (s *CategoryService) Delete(id uuid.UUID) error {
	return s.catRepo.Delete(id)
}
