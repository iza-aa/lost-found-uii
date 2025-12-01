package repository

import (
	"campus-lost-and-found/internal/models"

	"gorm.io/gorm"
)

type ClaimRepository struct {
	DB *gorm.DB
}

func NewClaimRepository(db *gorm.DB) *ClaimRepository {
	return &ClaimRepository{DB: db}
}

func (r *ClaimRepository) Create(claim *models.Claim) error {
	return r.DB.Create(claim).Error
}

func (r *ClaimRepository) FindByID(id string) (*models.Claim, error) {
	var claim models.Claim
	err := r.DB.Preload("Item").Preload("Owner").First(&claim, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &claim, nil
}

func (r *ClaimRepository) FindByItemID(itemID string) ([]models.Claim, error) {
	var claims []models.Claim
	err := r.DB.Preload("Owner").Where("item_id = ?", itemID).Find(&claims).Error
	return claims, err
}

func (r *ClaimRepository) Update(claim *models.Claim) error {
	return r.DB.Save(claim).Error
}

func (r *ClaimRepository) FindPendingClaimByUserAndItem(userID, itemID string) (*models.Claim, error) {
	var claim models.Claim
	err := r.DB.Where("owner_id = ? AND item_id = ? AND status = ?", userID, itemID, models.ClaimStatusPending).First(&claim).Error
	if err != nil {
		return nil, err
	}
	return &claim, nil
}
