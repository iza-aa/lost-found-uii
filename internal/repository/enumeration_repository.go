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

func (r *EnumerationRepository) FindCategoryByID(id string) (*models.ItemCategory, error) {
	var category models.ItemCategory
	err := r.DB.Where("id = ?", id).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *EnumerationRepository) FindLocationByID(id string) (*models.CampusLocation, error) {
	var location models.CampusLocation
	err := r.DB.Where("id = ?", id).First(&location).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}

func (r *EnumerationRepository) FindCategoryByName(name string) (*models.ItemCategory, error) {
	var category models.ItemCategory
	err := r.DB.Where("name = ?", name).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
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
			{Name: "Gedung FTI (Fakultas Teknologi Industri)", Latitude: -7.686369, Longitude: 110.410806, Description: "Gedung Fakultas Teknologi Industri"},
			{Name: "Gedung Fakultas Hukum", Latitude: -7.689302, Longitude: 110.412969, Description: "Gedung Fakultas Hukum"},
			{Name: "Gedung FIAI", Latitude: -7.688265, Longitude: 110.414749, Description: "Fakultas Ilmu Agama Islam"},
			{Name: "Gedung FPSB", Latitude: -7.687150, Longitude: 110.414422, Description: "Fakultas Psikologi dan Ilmu Sosial Budaya"},
			{Name: "Perpustakaan UII", Latitude: -7.688298, Longitude: 110.415142, Description: "Perpustakaan Pusat UII"},
			{Name: "Masjid Ulil Albab", Latitude: -7.687475, Longitude: 110.415268, Description: "Masjid Kampus UII"},
			{Name: "Gedung Rektorat", Latitude: -7.687939, Longitude: 110.413624, Description: "Gedung Rektorat UII"},
			{Name: "Gedung Kuliah Umum (GKU)", Latitude: -7.688357, Longitude: 110.413558, Description: "Gedung Kuliah Umum"},
			{Name: "Auditorium KH. Abdurrahman Wahid", Latitude: -7.687475, Longitude: 110.415268, Description: "Auditorium Kampus"},
			{Name: "Kantin FTI", Latitude: -7.687475, Longitude: 110.411443, Description: "Kantin FTI"},
			{Name: "Parkiran Motor FTI", Latitude: -7.686937, Longitude: 110.411773, Description: "Area Parkir Motor"},
			{Name: "Parkiran Mobil FTI", Latitude: -7.686968, Longitude: 110.410962, Description: "Area Parkir Mobil"},
			{Name: "GOR UII", Latitude: -7.686763, Longitude: 110.409404, Description: "Gedung Olahraga"},
			{Name: "Asrama Mahasiswa", Latitude: -7.690400, Longitude: 110.413203, Description: "Asrama Mahasiswa UII"},
			{Name: "Lokasi Lainnya", Latitude: -7.687528, Longitude: 110.412678, Description: "Lokasi lain di sekitar kampus"},
		}
		r.DB.Create(&locations)
	}
}
