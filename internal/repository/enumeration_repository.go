package repository

import (
	"campus-lost-and-found/internal/models"

	"gorm.io/gorm"
)

type EnumerationRepository struct {
	DB *gorm.DB
}

func NewEnumerationRepository(db *gorm.DB) *EnumerationRepository {
	return &EnumerationRepository{DB: db}
}

func (r *EnumerationRepository) GetCategories() ([]models.ItemCategory, error) {
	var categories []models.ItemCategory
	err := r.DB.Find(&categories).Error
	return categories, err
}

func (r *EnumerationRepository) GetLocations() ([]models.CampusLocation, error) {
	var locations []models.CampusLocation
	err := r.DB.Find(&locations).Error
	return locations, err
}

func (r *EnumerationRepository) CreateCategory(name string) (*models.ItemCategory, error) {
	category := &models.ItemCategory{Name: name}
	err := r.DB.Create(category).Error
	if err != nil {
		return nil, err
	}
	return category, nil
}

func (r *EnumerationRepository) CreateLocation(name string, lat, long float64) (*models.CampusLocation, error) {
	location := &models.CampusLocation{
		Name:      name,
		Latitude:  lat,
		Longitude: long,
	}
	err := r.DB.Create(location).Error
	if err != nil {
		return nil, err
	}
	return location, nil
}

func (r *EnumerationRepository) Seed() {
	// Simple seed check
	var count int64
	r.DB.Model(&models.ItemCategory{}).Count(&count)
	if count == 0 {
		categories := []models.ItemCategory{
			{Name: "Electronics"},
			{Name: "Clothing"},
			{Name: "Books"},
			{Name: "Keys"},
			{Name: "Others"},
		}
		r.DB.Create(&categories)
	}

	r.DB.Model(&models.CampusLocation{}).Count(&count)
	if count == 0 {
		locations := []models.CampusLocation{
			{Name: "Library", Latitude: -6.200000, Longitude: 106.816666},
			{Name: "Canteen", Latitude: -6.201000, Longitude: 106.817000},
			{Name: "Main Hall", Latitude: -6.202000, Longitude: 106.818000},
			{Name: "Security Post 1", Latitude: -6.203000, Longitude: 106.819000},
		}
		r.DB.Create(&locations)
	}
}
