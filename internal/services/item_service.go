package services

import (
	"campus-lost-and-found/internal/dto"
	"campus-lost-and-found/internal/matching"
	"campus-lost-and-found/internal/models"
	"campus-lost-and-found/internal/repository"
	"errors"
	"sort"
	"time"

	"github.com/google/uuid"
)

type ItemService struct {
	ItemRepo       *repository.ItemRepository
	AssetRepo      *repository.AssetRepository
	ClaimRepo      *repository.ClaimRepository
	EnumRepo       *repository.EnumerationRepository
	MatchingEngine *matching.MatchingEngine
	NotifService   *NotificationService
}

func NewItemService(itemRepo *repository.ItemRepository, assetRepo *repository.AssetRepository, claimRepo *repository.ClaimRepository, enumRepo *repository.EnumerationRepository, matchingEngine *matching.MatchingEngine, notifService *NotificationService) *ItemService {
	return &ItemService{
		ItemRepo:       itemRepo,
		AssetRepo:      assetRepo,
		ClaimRepo:      claimRepo,
		EnumRepo:       enumRepo,
		MatchingEngine: matchingEngine,
		NotifService:   notifService,
	}
}

func (s *ItemService) ReportFoundItem(req dto.CreateFoundItemRequest, finderID uuid.UUID) (*dto.ItemResponse, error) {
	dateFound, err := time.Parse("2006-01-02", req.DateFound)
	if err != nil {
		return nil, errors.New("invalid date format, use YYYY-MM-DD")
	}

	// Map Verifications
	var verifications []models.ItemVerification
	for _, v := range req.Verifications {
		verifications = append(verifications, models.ItemVerification{
			Question: v.Question,
			Answer:   v.Answer,
		})
	}

	// Map Contacts
	var contacts []models.ItemContact
	for _, c := range req.Contacts {
		contacts = append(contacts, models.ItemContact{
			Platform: models.PlatformType(c.Platform),
			Value:    c.Value,
		})
	}

	item := &models.Item{
		Title:         req.Title,
		Type:          models.ItemTypeFound,
		CategoryID:    req.CategoryID,
		LocationID:    &req.LocationID,
		ImageURL:      req.ImageURL,
		Verifications: verifications,
		Contacts:      contacts,
		ShowPhone:     req.ShowPhone,
		FinderID:      &finderID,
		Status:        models.ItemStatusOpen,
		DateFound:     &dateFound,
		ReturnMethod:  models.ReturnMethod(req.ReturnMethod),
		COD:           req.COD,
	}

	if err := s.ItemRepo.Create(item); err != nil {
		return nil, err
	}

	// Run Matching Engine
	go func() {
		lostAssets, err := s.AssetRepo.FindLostAssets()
		if err == nil {
			s.MatchingEngine.RunMatching(item, lostAssets)
		}
	}()

	// Map response verifications
	var verifResponses []dto.VerificationResponse
	for _, v := range item.Verifications {
		verifResponses = append(verifResponses, dto.VerificationResponse{
			Question: v.Question,
		})
	}

	// Map response contacts
	var contactResponses []dto.ContactResponse
	for _, c := range item.Contacts {
		contactResponses = append(contactResponses, dto.ContactResponse{
			Platform: string(c.Platform),
			Value:    c.Value,
		})
	}

	return &dto.ItemResponse{
		ID:            item.ID,
		Title:         item.Title,
		CategoryID:    item.CategoryID,
		LocationID:    *item.LocationID,
		ImageURL:      item.ImageURL,
		Verifications: verifResponses,
		ShowPhone:     item.ShowPhone,
		Contacts:      contactResponses,
		Status:        string(item.Status),
		CreatedAt:     item.CreatedAt,
	}, nil
}

func (s *ItemService) ReportLostItem(req dto.CreateLostItemRequest, ownerID uuid.UUID) (*dto.ItemResponse, error) {
	// Validate category exists
	_, err := s.EnumRepo.FindCategoryByID(req.CategoryID.String())
	if err != nil {
		return nil, errors.New("invalid category_id: category does not exist")
	}

	dateLost, err := time.Parse("2006-01-02", req.DateLost)
	if err != nil {
		return nil, errors.New("invalid date format, use YYYY-MM-DD")
	}

	// Map Contacts
	var contacts []models.ItemContact
	for _, c := range req.Contacts {
		contacts = append(contacts, models.ItemContact{
			Platform: models.PlatformType(c.Platform),
			Value:    c.Value,
		})
	}

	// Validate and default urgency
	urgency := models.UrgencyNormal
	if req.Urgency != "" {
		validUrgencies := []models.ItemUrgency{models.UrgencyNormal, models.UrgencyHigh, models.UrgencyCritical}
		requestedUrgency := models.ItemUrgency(req.Urgency)
		valid := false
		for _, validUrg := range validUrgencies {
			if requestedUrgency == validUrg {
				valid = true
				urgency = requestedUrgency
				break
			}
		}
		if !valid {
			return nil, errors.New("invalid urgency: must be NORMAL, HIGH, or CRITICAL")
		}
	}

	item := &models.Item{
		Title:               req.Title,
		Type:                models.ItemTypeLost,
		CategoryID:          req.CategoryID,
		LocationDescription: req.LocationLastSeen,
		ImageURL:            req.ImageURL,
		OwnerID:             &ownerID,
		DateLost:            &dateLost,
		Status:              models.ItemStatusOpen,
		Urgency:             urgency,
		OfferReward:         req.OfferReward,
		ShowPhone:           req.ShowPhone,
		Contacts:            contacts,
	}

	if err := s.ItemRepo.Create(item); err != nil {
		return nil, err
	}

	// Map response contacts
	var contactResponses []dto.ContactResponse
	for _, c := range item.Contacts {
		contactResponses = append(contactResponses, dto.ContactResponse{
			Platform: string(c.Platform),
			Value:    c.Value,
		})
	}

	return &dto.ItemResponse{
		ID:           item.ID,
		Title:        item.Title,
		CategoryID:   item.CategoryID,
		LocationName: item.LocationDescription,
		ImageURL:     item.ImageURL,
		Status:       string(item.Status),
		CreatedAt:    item.CreatedAt,
		Urgency:      string(item.Urgency),
		OfferReward:  item.OfferReward,
		Contacts:     contactResponses,
	}, nil
}

func (s *ItemService) GetItem(id string) (*models.Item, error) {
	return s.ItemRepo.FindByID(id)
}

func (s *ItemService) GetAllItems(status string, itemType string) ([]dto.ItemResponse, error) {
	var itemResponses []dto.ItemResponse

	// 1. Fetch Items (Ad-Hoc)
	items, err := s.ItemRepo.FindAll(status, itemType)
	if err != nil {
		return nil, err
	}

	for _, item := range items {
		// Map verifications
		var verifResponses []dto.VerificationResponse
		for _, v := range item.Verifications {
			verifResponses = append(verifResponses, dto.VerificationResponse{
				Question: v.Question,
			})
		}

		resp := dto.ItemResponse{
			ID:            item.ID,
			Title:         item.Title,
			CategoryID:    item.CategoryID,
			ImageURL:      item.ImageURL,
			Status:        string(item.Status),
			CreatedAt:     item.CreatedAt,
			Verifications: verifResponses,
		}

		if item.LocationID != nil {
			resp.LocationID = *item.LocationID
		}
		if item.Location != nil {
			resp.LocationName = item.Location.Name
		} else if item.LocationDescription != "" {
			resp.LocationName = item.LocationDescription
		}

		itemResponses = append(itemResponses, resp)
	}

	// 2. Fetch Lost Assets (Registered) - Only if we want LOST items or ALL items
	// And only if status is OPEN or empty (assuming lost assets are effectively "OPEN" lost items)
	if (itemType == "" || itemType == "LOST") && (status == "" || status == "OPEN") {
		lostAssets, err := s.AssetRepo.FindLostAssets()
		if err != nil {
			return nil, err
		}

		for _, asset := range lostAssets {
			resp := dto.ItemResponse{
				ID:           asset.ID,
				Title:        asset.Description, // Use description as title for assets
				CategoryID:   asset.CategoryID,
				ImageURL:     asset.PrivateImageURL, // Show private image for lost assets so people can identify
				Status:       "LOST",
				CreatedAt:    asset.UpdatedAt, // Use UpdatedAt as the time it was marked lost
				LocationName: "Registered Asset",
			}
			itemResponses = append(itemResponses, resp)
		}
	}

	// 3. Sort by CreatedAt Descending
	// We need to sort the combined list.
	// Since we appended, it might be out of order.
	// Let's use a simple bubble sort or slice.SortFunc if Go 1.21+ (we are on 1.24)
	// But to avoid importing "sort" or "slices" if not already imported, I'll check imports.
	// "sort" is not imported. I should add it or use a simple loop.
	// Given the list size might be small, I'll add "sort" import.

	// 3. Sort by CreatedAt Descending
	sort.Slice(itemResponses, func(i, j int) bool {
		return itemResponses[i].CreatedAt.After(itemResponses[j].CreatedAt)
	})

	return itemResponses, nil
}

func (s *ItemService) SubmitClaim(itemID string, req dto.CreateClaimRequest, ownerID uuid.UUID) (*dto.ClaimResponse, error) {
	item, err := s.ItemRepo.FindByID(itemID)
	if err != nil {
		return nil, err
	}

	if item.Status != models.ItemStatusOpen {
		return nil, errors.New("item is not open for claims")
	}

	claim := &models.Claim{
		ItemID:      item.ID,
		OwnerID:     ownerID,
		AnswerInput: req.AnswerInput,
		ImageURL:    req.ImageURL,
		Status:      models.ClaimStatusPending,
	}

	if err := s.ClaimRepo.Create(claim); err != nil {
		return nil, err
	}

	// Notify Finder
	if item.FinderID != nil {
		s.NotifService.CreateNotification(
			*item.FinderID,
			"New Claim Received",
			"Someone has claimed an item you found.",
			"CLAIM_NEW",
			claim.ID,
		)
	}

	return &dto.ClaimResponse{
		ID:          claim.ID,
		ItemID:      claim.ItemID,
		OwnerID:     claim.OwnerID,
		AnswerInput: claim.AnswerInput,
		ImageURL:    claim.ImageURL,
		Status:      string(claim.Status),
		CreatedAt:   claim.CreatedAt,
	}, nil
}

func (s *ItemService) GetClaims(itemID string, userID uuid.UUID) ([]models.Claim, error) {
	item, err := s.ItemRepo.FindByID(itemID)
	if err != nil {
		return nil, err
	}

	if item.FinderID == nil || *item.FinderID != userID {
		return nil, errors.New("unauthorized")
	}

	return s.ClaimRepo.FindByItemID(itemID)
}

func (s *ItemService) DecideClaim(claimID string, status string, userID uuid.UUID) error {
	// Validate decision
	if status != "APPROVED" && status != "REJECTED" {
		return errors.New("invalid decision: must be APPROVED or REJECTED")
	}

	claim, err := s.ClaimRepo.FindByID(claimID)
	if err != nil {
		return errors.New("claim not found")
	}

	// Check if claim is already decided
	if claim.Status != models.ClaimStatusPending {
		return errors.New("claim has already been decided")
	}

	// CRITICAL: Verify user is the finder
	item, err := s.ItemRepo.FindByID(claim.ItemID.String())
	if err != nil {
		return errors.New("item not found")
	}

	if item.FinderID == nil || *item.FinderID != userID {
		return errors.New("only the finder can decide on claims")
	}

	claim.Status = models.ClaimStatus(status)
	if err := s.ClaimRepo.Update(claim); err != nil {
		return err
	}

	if status == "APPROVED" {
		item.Status = models.ItemStatusClaimed
		s.ItemRepo.Update(item)

		// Notify Owner
		s.NotifService.CreateNotification(
			claim.OwnerID,
			"Claim Approved!",
			"Your claim has been approved. You can now contact the finder.",
			"CLAIM_APPROVED",
			claim.ID,
		)
	} else {
		s.NotifService.CreateNotification(
			claim.OwnerID,
			"Claim Rejected",
			"Your claim has been rejected.",
			"CLAIM_REJECTED",
			claim.ID,
		)
	}

	return nil
}

func (s *ItemService) DeleteItem(id string, userID uuid.UUID) error {
	item, err := s.ItemRepo.FindByID(id)
	if err != nil {
		return errors.New("item not found")
	}

	// Authorization: Only Finder or Owner can delete
	isFinder := item.FinderID != nil && *item.FinderID == userID
	isOwner := item.OwnerID != nil && *item.OwnerID == userID

	if !isFinder && !isOwner {
		return errors.New("unauthorized: you are not the owner or finder of this item")
	}

	return s.ItemRepo.Delete(id)
}
