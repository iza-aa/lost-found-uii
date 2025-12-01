package repository

import (
	"campus-lost-and-found/internal/models"

	"gorm.io/gorm"
)

type ItemRepository struct {
	DB *gorm.DB
}

func NewItemRepository(db *gorm.DB) *ItemRepository {
	return &ItemRepository{DB: db}
}

func (r *ItemRepository) Create(item *models.Item) error {
	return r.DB.Create(item).Error
}

func (r *ItemRepository) FindByID(id string) (*models.Item, error) {
	var item models.Item
	err := r.DB.Preload("Category").Preload("Location").Preload("Finder").First(&item, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *ItemRepository) FindAll(status string, itemType string) ([]models.Item, error) {
	var items []models.Item
	query := r.DB.Preload("Category").Preload("Location").Preload("Finder").Preload("Owner")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if itemType != "" {
		query = query.Where("type = ?", itemType)
	}
	err := query.Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *ItemRepository) Update(item *models.Item) error {
	return r.DB.Save(item).Error
}

func (r *ItemRepository) Delete(id string) error {
	return r.DB.Delete(&models.Item{}, "id = ?", id).Error
}
