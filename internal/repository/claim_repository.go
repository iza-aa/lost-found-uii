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
	err := r.DB.Preload("Item").Preload("Item.Owner").Preload("Finder").Preload("Questions").Preload("Contacts").First(&claim, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &claim, nil
}

func (r *ClaimRepository) FindByItemID(itemID string) ([]models.Claim, error) {
	var claims []models.Claim
	err := r.DB.Preload("Finder").Preload("Questions").Preload("Contacts").Where("item_id = ?", itemID).Order("created_at DESC").Find(&claims).Error
	return claims, err
}

func (r *ClaimRepository) Update(claim *models.Claim) error {
	return r.DB.Save(claim).Error
}

func (r *ClaimRepository) UpdateQuestions(questions []models.ClaimQuestion) error {
	for _, q := range questions {
		if err := r.DB.Save(&q).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *ClaimRepository) DeleteByItemID(itemID string) error {
	// First, get all claim IDs for this item
	var claims []models.Claim
	if err := r.DB.Where("item_id = ?", itemID).Find(&claims).Error; err != nil {
		return err
	}

	// Delete associated data for each claim
	for _, claim := range claims {
		claimID := claim.ID.String()
		// Delete claim contacts
		if err := r.DB.Where("claim_id = ?", claimID).Delete(&models.ClaimContact{}).Error; err != nil {
			return err
		}
		// Delete claim questions
		if err := r.DB.Where("claim_id = ?", claimID).Delete(&models.ClaimQuestion{}).Error; err != nil {
			return err
		}
	}

	// Delete the claims themselves
	return r.DB.Where("item_id = ?", itemID).Delete(&models.Claim{}).Error
}

func (r *ClaimRepository) FindPendingClaimByUserAndItem(userID, itemID string) (*models.Claim, error) {
	var claim models.Claim
	err := r.DB.Preload("Questions").Preload("Contacts").Where("finder_id = ? AND item_id = ? AND status IN ?", userID, itemID, []models.ClaimStatus{models.ClaimStatusPending, models.ClaimStatusPendingApproval}).First(&claim).Error
	if err != nil {
		return nil, err
	}
	return &claim, nil
}

func (r *ClaimRepository) FindClaimByUserAndItem(userID, itemID string) (*models.Claim, error) {
	var claim models.Claim
	err := r.DB.Preload("Questions").Preload("Contacts").Preload("Finder").Where("finder_id = ? AND item_id = ?", userID, itemID).First(&claim).Error
	if err != nil {
		return nil, err
	}
	return &claim, nil
}

func (r *ClaimRepository) FindApprovedClaimByItemID(itemID string) (*models.Claim, error) {
	var claim models.Claim
	err := r.DB.Preload("Finder").Preload("Questions").Preload("Contacts").Where("item_id = ? AND status = ?", itemID, models.ClaimStatusApproved).First(&claim).Error
	if err != nil {
		return nil, err
	}
	return &claim, nil
}
