package services

import (
	"campus-lost-and-found/internal/dto"
	"campus-lost-and-found/internal/matching"
	"campus-lost-and-found/internal/models"
	"campus-lost-and-found/internal/repository"
	"errors"
	"log"
	"sort"
	"time"

	"github.com/google/uuid"
)

type ItemService struct {
	ItemRepo       *repository.ItemRepository
	AssetRepo      *repository.AssetRepository
	ClaimRepo      *repository.ClaimRepository
	UserRepo       *repository.UserRepository
	MatchingEngine *matching.MatchingEngine
	NotifService   *NotificationService
}

func NewItemService(itemRepo *repository.ItemRepository, assetRepo *repository.AssetRepository, claimRepo *repository.ClaimRepository, userRepo *repository.UserRepository, matchingEngine *matching.MatchingEngine, notifService *NotificationService) *ItemService {
	return &ItemService{
		ItemRepo:       itemRepo,
		AssetRepo:      assetRepo,
		ClaimRepo:      claimRepo,
		UserRepo:       userRepo,
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
		Description:   req.Description,
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
		AttachedQR:    req.AttachedQR, // QR code from scanned item
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
		Description:   item.Description,
		Type:          string(item.Type),
		CategoryID:    item.CategoryID,
		LocationID:    *item.LocationID,
		ImageURL:      item.ImageURL,
		Verifications: verifResponses,
		ShowPhone:     item.ShowPhone,
		Contacts:      contactResponses,
		Status:        string(item.Status),
		CreatedAt:     item.CreatedAt,
		AttachedQR:    item.AttachedQR,
	}, nil
}

func (s *ItemService) ReportLostItem(req dto.CreateLostItemRequest, ownerID uuid.UUID) (*dto.ItemResponse, error) {
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

	// Default urgency if empty
	urgency := models.UrgencyNormal
	if req.Urgency != "" {
		urgency = models.ItemUrgency(req.Urgency)
	}

	item := &models.Item{
		Title:               req.Title,
		Description:         req.Description,
		Type:                models.ItemTypeLost,
		CategoryID:          req.CategoryID,
		LocationDescription: req.LocationLastSeen,
		LocationLatitude:    req.LocationLatitude,
		LocationLongitude:   req.LocationLongitude,
		ImageURL:            req.ImageURL,
		OwnerID:             &ownerID,
		DateLost:            &dateLost,
		Status:              models.ItemStatusOpen,
		Urgency:             urgency,
		OfferReward:         req.OfferReward,
		COD:                 req.COD,
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
		Description:  item.Description,
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

func (s *ItemService) GetItemByID(id string, userID uuid.UUID) (*dto.ItemResponse, error) {
	item, err := s.ItemRepo.FindByIDWithDetails(id)
	if err != nil {
		return nil, err
	}

	// Map verifications (hide answers)
	var verifResponses []dto.VerificationResponse
	for _, v := range item.Verifications {
		verifResponses = append(verifResponses, dto.VerificationResponse{
			Question: v.Question,
		})
	}

	// Map contacts
	var contactResponses []dto.ContactResponse
	for _, c := range item.Contacts {
		contactResponses = append(contactResponses, dto.ContactResponse{
			Platform: string(c.Platform),
			Value:    c.Value,
		})
	}

	resp := &dto.ItemResponse{
		ID:            item.ID,
		Title:         item.Title,
		Description:   item.Description,
		Type:          string(item.Type),
		CategoryID:    item.CategoryID,
		ImageURL:      item.ImageURL,
		Verifications: verifResponses,
		Status:        string(item.Status),
		CreatedAt:     item.CreatedAt,
		Urgency:       string(item.Urgency),
		OfferReward:   item.OfferReward,
		COD:           item.COD,
		ShowPhone:     item.ShowPhone,
		Contacts:      contactResponses,
		AttachedQR:    item.AttachedQR,
	}

	// Add category name
	if item.Category.Name != "" {
		resp.CategoryName = item.Category.Name
	}

	// Add location
	if item.LocationID != nil {
		resp.LocationID = *item.LocationID
	}
	if item.Location != nil {
		resp.LocationName = item.Location.Name
		resp.LocationLatitude = item.Location.Latitude
		resp.LocationLongitude = item.Location.Longitude
	} else if item.LocationDescription != "" {
		resp.LocationName = item.LocationDescription
		// Use custom coordinates if available
		if item.LocationLatitude != 0 || item.LocationLongitude != 0 {
			resp.LocationLatitude = item.LocationLatitude
			resp.LocationLongitude = item.LocationLongitude
		}
	}

	// Add finder info (for found items)
	if item.Finder != nil {
		resp.Finder = &dto.ItemUserResponse{
			ID:   item.Finder.ID,
			Name: item.Finder.Name,
			Role: string(item.Finder.Role),
		}
		// Show phone if show_phone is true or user is the finder
		if item.ShowPhone || (item.FinderID != nil && *item.FinderID == userID) {
			resp.Finder.Phone = item.Finder.Phone
		}
	}

	// Add owner info (for lost items)
	if item.Owner != nil {
		resp.Owner = &dto.ItemUserResponse{
			ID:   item.Owner.ID,
			Name: item.Owner.Name,
			Role: string(item.Owner.Role),
		}
		// Show phone if show_phone is true or user is the owner
		if item.ShowPhone || (item.OwnerID != nil && *item.OwnerID == userID) {
			resp.Owner.Phone = item.Owner.Phone
		}
	}

	// Check for claims (for LOST items)
	if item.Type == models.ItemTypeLost {
		claims, _ := s.ClaimRepo.FindByItemID(id)

		// Check if current user has a claim (as finder)
		for _, claim := range claims {
			if claim.FinderID == userID {
				resp.UserClaimStatus = string(claim.Status)
				break
			}
		}

		// If there's an approved claim, include it and show contacts
		for _, claim := range claims {
			if claim.Status == models.ClaimStatusApproved {
				resp.ApprovedClaim = s.mapClaimToResponse(&claim, true)

				// Show owner's contact to finder
				if userID == claim.FinderID && resp.Owner != nil {
					resp.Owner.Phone = item.Owner.Phone
				}

				break
			}
		}
	}

	return resp, nil
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
			Description:   item.Description,
			Type:          string(item.Type),
			CategoryID:    item.CategoryID,
			ImageURL:      item.ImageURL,
			Status:        string(item.Status),
			CreatedAt:     item.CreatedAt,
			Verifications: verifResponses,
			AttachedQR:    item.AttachedQR,
		}

		// Add category name
		if item.Category.Name != "" {
			resp.CategoryName = item.Category.Name
		}

		if item.LocationID != nil {
			resp.LocationID = *item.LocationID
		}
		if item.Location != nil {
			resp.LocationName = item.Location.Name
			resp.LocationLatitude = item.Location.Latitude
			resp.LocationLongitude = item.Location.Longitude
		} else if item.LocationDescription != "" {
			resp.LocationName = item.LocationDescription
			// Use custom coordinates if available
			if item.LocationLatitude != 0 || item.LocationLongitude != 0 {
				resp.LocationLatitude = item.LocationLatitude
				resp.LocationLongitude = item.LocationLongitude
			}
		}

		// Add finder info (for found items)
		if item.Finder != nil {
			resp.Finder = &dto.ItemUserResponse{
				ID:   item.Finder.ID,
				Name: item.Finder.Name,
				Role: string(item.Finder.Role),
			}
		}

		// Add owner info (for lost items)
		if item.Owner != nil {
			resp.Owner = &dto.ItemUserResponse{
				ID:   item.Owner.ID,
				Name: item.Owner.Name,
				Role: string(item.Owner.Role),
			}
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

// GetMyItems returns all items reported by the user (as finder or owner)
func (s *ItemService) GetMyItems(userID uuid.UUID) ([]dto.ItemResponse, error) {
	items, err := s.ItemRepo.FindByUserID(userID.String())
	if err != nil {
		return nil, err
	}

	var itemResponses []dto.ItemResponse
	for _, item := range items {
		// Map verifications (hide answers)
		var verifResponses []dto.VerificationResponse
		for _, v := range item.Verifications {
			verifResponses = append(verifResponses, dto.VerificationResponse{
				Question: v.Question,
			})
		}

		resp := dto.ItemResponse{
			ID:            item.ID,
			Title:         item.Title,
			Description:   item.Description,
			Type:          string(item.Type),
			CategoryID:    item.CategoryID,
			ImageURL:      item.ImageURL,
			Status:        string(item.Status),
			CreatedAt:     item.CreatedAt,
			Verifications: verifResponses,
			AttachedQR:    item.AttachedQR,
		}

		// Add category name
		if item.Category.Name != "" {
			resp.CategoryName = item.Category.Name
		}

		if item.LocationID != nil {
			resp.LocationID = *item.LocationID
		}
		if item.Location != nil {
			resp.LocationName = item.Location.Name
			resp.LocationLatitude = item.Location.Latitude
			resp.LocationLongitude = item.Location.Longitude
		} else if item.LocationDescription != "" {
			resp.LocationName = item.LocationDescription
		}

		// Add owner/finder info
		if item.Owner != nil {
			resp.Owner = &dto.ItemUserResponse{
				ID:   item.Owner.ID,
				Name: item.Owner.Name,
				Role: string(item.Owner.Role),
			}
		}
		if item.Finder != nil {
			resp.Finder = &dto.ItemUserResponse{
				ID:   item.Finder.ID,
				Name: item.Finder.Name,
				Role: string(item.Finder.Role),
			}
		}

		itemResponses = append(itemResponses, resp)
	}

	return itemResponses, nil
}

func (s *ItemService) SubmitClaim(itemID string, req dto.CreateClaimRequest, claimerID uuid.UUID) (*dto.ClaimResponse, error) {
	item, err := s.ItemRepo.FindByID(itemID)
	if err != nil {
		return nil, err
	}

	if item.Status != models.ItemStatusOpen {
		return nil, errors.New("item is not open for claims")
	}

	// Handle based on item type
	if item.Type == models.ItemTypeLost {
		return s.submitClaimForLostItem(item, req, claimerID)
	} else if item.Type == models.ItemTypeFound {
		return s.submitClaimForFoundItem(item, req, claimerID)
	}

	return nil, errors.New("invalid item type")
}

// submitClaimForLostItem - Finder claims a lost item with verification questions
func (s *ItemService) submitClaimForLostItem(item *models.Item, req dto.CreateClaimRequest, finderID uuid.UUID) (*dto.ClaimResponse, error) {
	// Can't claim your own item
	if item.OwnerID != nil && *item.OwnerID == finderID {
		return nil, errors.New("you cannot claim your own item")
	}

	// Check for existing claim
	existingClaim, _ := s.ClaimRepo.FindClaimByUserAndItem(finderID.String(), item.ID.String())
	if existingClaim != nil {
		return nil, errors.New("you have already submitted a claim for this item")
	}

	// Questions are required for LOST items
	if len(req.Questions) == 0 {
		return nil, errors.New("questions are required for claiming lost items")
	}

	// Create questions
	var questions []models.ClaimQuestion
	for _, q := range req.Questions {
		questions = append(questions, models.ClaimQuestion{
			Question: q.Question,
		})
	}

	// Create contacts
	var contacts []models.ClaimContact
	for _, c := range req.Contacts {
		contacts = append(contacts, models.ClaimContact{
			Platform: models.PlatformType(c.Platform),
			Value:    c.Value,
		})
	}

	claim := &models.Claim{
		ItemID:    item.ID,
		FinderID:  finderID,
		Questions: questions,
		Contacts:  contacts,
		ShowPhone: req.ShowPhone,
		Note:      req.Note,
		Status:    models.ClaimStatusPending,
	}

	if err := s.ClaimRepo.Create(claim); err != nil {
		return nil, err
	}

	// Reload claim with Finder data
	claimWithFinder, err := s.ClaimRepo.FindByID(claim.ID.String())
	if err != nil {
		return nil, err
	}

	// Notify the owner
	if item.OwnerID != nil {
		s.NotifService.CreateNotification(
			*item.OwnerID,
			"Seseorang Menemukan Barangmu!",
			"Ada yang mengaku menemukan barangmu. Jawab pertanyaan mereka untuk memverifikasi.",
			"CLAIM_NEW",
			claimWithFinder.ID,
		)
	}

	return s.mapClaimToResponse(claimWithFinder, false), nil
}

// submitClaimForFoundItem - Owner claims a found item with answers to verification questions
func (s *ItemService) submitClaimForFoundItem(item *models.Item, req dto.CreateClaimRequest, ownerID uuid.UUID) (*dto.ClaimResponse, error) {
	// Can't claim item you found
	if item.FinderID != nil && *item.FinderID == ownerID {
		return nil, errors.New("you cannot claim an item you found")
	}

	// Check for existing claim
	existingClaim, _ := s.ClaimRepo.FindClaimByUserAndItem(ownerID.String(), item.ID.String())
	if existingClaim != nil {
		return nil, errors.New("you have already submitted a claim for this item")
	}

	// Answers are required for FOUND items
	if len(req.Answers) == 0 {
		return nil, errors.New("answers are required for claiming found items")
	}

	// Create questions with answers (from the owner claiming the item)
	var questions []models.ClaimQuestion
	for _, a := range req.Answers {
		questions = append(questions, models.ClaimQuestion{
			Question: a.Question,
			Answer:   a.Answer, // Owner provides the answer
		})
	}

	// Create contacts
	var contacts []models.ClaimContact
	for _, c := range req.Contacts {
		contacts = append(contacts, models.ClaimContact{
			Platform: models.PlatformType(c.Platform),
			Value:    c.Value,
		})
	}

	// For FOUND items, the claimer is the potential owner
	// We store FinderID as the claimer (confusing name, but it's the one making the claim)
	claim := &models.Claim{
		ItemID:    item.ID,
		FinderID:  ownerID, // The person claiming (potential owner)
		Questions: questions,
		Contacts:  contacts,
		ShowPhone: req.ShowPhone,
		Note:      req.Note,
		Status:    models.ClaimStatusPending,
	}

	if err := s.ClaimRepo.Create(claim); err != nil {
		return nil, err
	}

	// Reload claim with Finder (claimer) data
	claimWithFinder, err := s.ClaimRepo.FindByID(claim.ID.String())
	if err != nil {
		return nil, err
	}

	// Notify the finder (who posted the found item)
	if item.FinderID != nil {
		s.NotifService.CreateNotification(
			*item.FinderID,
			"Seseorang Mengklaim Barang yang Kamu Temukan!",
			"Ada yang mengaku sebagai pemilik barang yang kamu temukan. Periksa jawaban mereka.",
			"CLAIM_NEW",
			claimWithFinder.ID,
		)
	}

	return s.mapClaimToResponse(claimWithFinder, true), nil // Show answers for FOUND items
}

func (s *ItemService) GetClaims(itemID string, userID uuid.UUID) ([]dto.ClaimResponse, error) {
	item, err := s.ItemRepo.FindByID(itemID)
	if err != nil {
		return nil, err
	}

	// Authorization depends on item type
	// For LOST items: only owner can view claims
	// For FOUND items: only finder can view claims
	isAuthorized := false
	if item.Type == models.ItemTypeLost {
		isAuthorized = item.OwnerID != nil && *item.OwnerID == userID
	} else if item.Type == models.ItemTypeFound {
		isAuthorized = item.FinderID != nil && *item.FinderID == userID
	}

	if !isAuthorized {
		return nil, errors.New("unauthorized")
	}

	claims, err := s.ClaimRepo.FindByItemID(itemID)
	if err != nil {
		return nil, err
	}

	var responses []dto.ClaimResponse
	for _, claim := range claims {
		// Item creator can see questions and answers
		responses = append(responses, *s.mapClaimToResponse(&claim, true))
	}

	return responses, nil
}

func (s *ItemService) GetUserClaimForItem(itemID string, userID uuid.UUID) (*dto.ClaimResponse, error) {
	claim, err := s.ClaimRepo.FindClaimByUserAndItem(userID.String(), itemID)
	if err != nil {
		return nil, nil // No claim found, not an error
	}

	// Finder can see their own claim with answers if status is PENDING_APPROVAL
	showAnswers := claim.Status == models.ClaimStatusPendingApproval || claim.Status == models.ClaimStatusApproved
	return s.mapClaimToResponse(claim, showAnswers), nil
}

func (s *ItemService) AnswerClaim(claimID string, req dto.AnswerClaimRequest, ownerID uuid.UUID) error {
	claim, err := s.ClaimRepo.FindByID(claimID)
	if err != nil {
		return errors.New("claim not found")
	}

	// Verify owner
	item, err := s.ItemRepo.FindByID(claim.ItemID.String())
	if err != nil {
		return err
	}

	if item.OwnerID == nil || *item.OwnerID != ownerID {
		return errors.New("unauthorized: only item owner can answer questions")
	}

	if claim.Status != models.ClaimStatusPending {
		return errors.New("claim is not in pending status")
	}

	// Update answers
	for _, ans := range req.Answers {
		for i := range claim.Questions {
			if claim.Questions[i].ID == ans.QuestionID {
				claim.Questions[i].Answer = ans.Answer
				break
			}
		}
	}

	if err := s.ClaimRepo.UpdateQuestions(claim.Questions); err != nil {
		return err
	}

	// Update status to PENDING_APPROVAL
	claim.Status = models.ClaimStatusPendingApproval
	if err := s.ClaimRepo.Update(claim); err != nil {
		return err
	}

	// Notify finder
	s.NotifService.CreateNotification(
		claim.FinderID,
		"Jawaban Telah Diberikan!",
		"Pemilik barang sudah menjawab pertanyaanmu. Silakan verifikasi jawabannya.",
		"CLAIM_ANSWERED",
		claim.ID,
	)

	return nil
}

func (s *ItemService) DecideClaim(claimID string, status string, deciderID uuid.UUID) error {
	claim, err := s.ClaimRepo.FindByID(claimID)
	if err != nil {
		return errors.New("claim not found")
	}

	item, err := s.ItemRepo.FindByID(claim.ItemID.String())
	if err != nil {
		return err
	}

	// Authorization depends on item type
	// For LOST items: the finder (claim.FinderID) submitted the claim, owner decides
	// For FOUND items: the potential owner (claim.FinderID) submitted the claim, item finder decides
	isAuthorized := false
	if item.Type == models.ItemTypeLost {
		// For LOST items, the finder who submitted claim decides (after owner answered)
		isAuthorized = claim.FinderID == deciderID
	} else if item.Type == models.ItemTypeFound {
		// For FOUND items, the item finder (who posted the found item) decides
		isAuthorized = item.FinderID != nil && *item.FinderID == deciderID
	}

	if !isAuthorized {
		return errors.New("unauthorized: only the finder can decide on this claim")
	}

	// For LOST items, claim must be in PENDING_APPROVAL (owner has answered)
	// For FOUND items, claim is in PENDING (potential owner has submitted answers)
	validStatus := false
	if item.Type == models.ItemTypeLost {
		validStatus = claim.Status == models.ClaimStatusPendingApproval
	} else if item.Type == models.ItemTypeFound {
		// For FOUND items, allow both PENDING and PENDING_APPROVAL
		validStatus = claim.Status == models.ClaimStatusPending || claim.Status == models.ClaimStatusPendingApproval
	}

	if !validStatus {
		log.Printf("DecideClaim: Invalid status. ItemType=%s, ClaimStatus=%s", item.Type, claim.Status)
		return errors.New("claim is not ready for decision")
	}

	claim.Status = models.ClaimStatus(status)
	if err := s.ClaimRepo.Update(claim); err != nil {
		return err
	}

	if status == "APPROVED" {
		item.Status = models.ItemStatusClaimed
		s.ItemRepo.Update(item)

		// Notify the claimer (potential owner for FOUND items, finder for LOST items)
		s.NotifService.CreateNotification(
			claim.FinderID, // This is the claimer
			"Klaim Disetujui!",
			"Klaimmu telah disetujui. Silakan hubungi untuk mengambil barangmu.",
			"CLAIM_APPROVED",
			claim.ID,
		)
	} else {
		// Notify claimer about rejection
		s.NotifService.CreateNotification(
			claim.FinderID,
			"Klaim Ditolak",
			"Maaf, klaimmu belum dapat diverifikasi.",
			"CLAIM_REJECTED",
			claim.ID,
		)
	}

	return nil
}

// mapClaimToResponse converts Claim model to ClaimResponse DTO
func (s *ItemService) mapClaimToResponse(claim *models.Claim, showAnswers bool) *dto.ClaimResponse {
	resp := &dto.ClaimResponse{
		ID:        claim.ID,
		ItemID:    claim.ItemID,
		FinderID:  claim.FinderID,
		ShowPhone: claim.ShowPhone,
		Note:      claim.Note,
		Status:    string(claim.Status),
		CreatedAt: claim.CreatedAt,
	}

	// Add finder info
	if claim.Finder.ID != uuid.Nil {
		resp.Finder = &dto.ItemUserResponse{
			ID:   claim.Finder.ID,
			Name: claim.Finder.Name,
			Role: string(claim.Finder.Role),
		}
		// Show phone only if approved and show_phone is true
		if claim.Status == models.ClaimStatusApproved && claim.ShowPhone {
			resp.Finder.Phone = claim.Finder.Phone
		}
	}

	// Add questions
	for _, q := range claim.Questions {
		qResp := dto.ClaimQuestionResponse{
			ID:       q.ID,
			Question: q.Question,
		}
		if showAnswers {
			qResp.Answer = q.Answer
		}
		resp.Questions = append(resp.Questions, qResp)
	}

	// Add contacts (only visible to owner after approved)
	if claim.Status == models.ClaimStatusApproved {
		for _, c := range claim.Contacts {
			resp.Contacts = append(resp.Contacts, dto.ContactResponse{
				Platform: string(c.Platform),
				Value:    c.Value,
			})
		}
	}

	return resp
}

// DeleteItem deletes an item if the user is the owner or finder
func (s *ItemService) DeleteItem(itemID string, userID uuid.UUID) error {
	item, err := s.ItemRepo.FindByID(itemID)
	if err != nil {
		return errors.New("item not found")
	}

	// Check if user is owner or finder
	isOwner := item.OwnerID != nil && *item.OwnerID == userID
	isFinder := item.FinderID != nil && *item.FinderID == userID

	if !isOwner && !isFinder {
		return errors.New("unauthorized: only owner or finder can delete this item")
	}

	// Delete associated claims first
	if err := s.ClaimRepo.DeleteByItemID(itemID); err != nil {
		// Log but don't fail - claims might not exist
	}

	// Delete the item
	if err := s.ItemRepo.Delete(itemID); err != nil {
		return errors.New("failed to delete item")
	}

	return nil
}

// UpdateItem updates an item if the user is the owner or finder
func (s *ItemService) UpdateItem(itemID string, userID uuid.UUID, req dto.UpdateItemRequest) (*dto.ItemResponse, error) {
	log.Printf("UpdateItem called with itemID: %s, req: %+v", itemID, req)

	item, err := s.ItemRepo.FindByID(itemID)
	if err != nil {
		return nil, errors.New("item not found")
	}

	log.Printf("Current item CategoryID: %s", item.CategoryID)

	// Check if user is owner or finder
	isOwner := item.OwnerID != nil && *item.OwnerID == userID
	isFinder := item.FinderID != nil && *item.FinderID == userID

	if !isOwner && !isFinder {
		return nil, errors.New("unauthorized: only owner or finder can update this item")
	}

	// Update fields if provided
	if req.Title != "" {
		item.Title = req.Title
	}
	if req.Description != "" {
		item.Description = req.Description
	}
	if req.ImageURL != "" {
		item.ImageURL = req.ImageURL
	}
	if req.CategoryID != "" {
		log.Printf("Parsing CategoryID: %s", req.CategoryID)
		catID, err := uuid.Parse(req.CategoryID)
		if err == nil {
			log.Printf("Setting CategoryID to: %s", catID)
			item.CategoryID = catID
		} else {
			log.Printf("Error parsing CategoryID: %v", err)
		}
	}
	if req.LocationID != "" {
		locID, err := uuid.Parse(req.LocationID)
		if err == nil {
			item.LocationID = &locID
		}
	}
	if req.LocationLatitude != nil {
		item.LocationLatitude = *req.LocationLatitude
	}
	if req.LocationLongitude != nil {
		item.LocationLongitude = *req.LocationLongitude
	}
	if req.DateLost != "" {
		dateLost, err := time.Parse("2006-01-02", req.DateLost)
		if err == nil {
			item.DateLost = &dateLost
		} else {
			// Try RFC3339
			dateLost, err = time.Parse(time.RFC3339, req.DateLost)
			if err == nil {
				item.DateLost = &dateLost
			}
		}
	}
	if req.Urgency != "" {
		item.Urgency = models.ItemUrgency(req.Urgency)
	}
	if req.OfferReward != nil {
		item.OfferReward = *req.OfferReward
	}
	if req.COD != nil {
		item.COD = *req.COD
	}

	// Clear associations to ensure CategoryID is used directly
	item.Category = models.ItemCategory{}
	item.Location = nil
	item.Finder = nil
	item.Owner = nil

	log.Printf("Before save - item.CategoryID: %s", item.CategoryID)

	// Save changes
	if err := s.ItemRepo.Update(item); err != nil {
		return nil, errors.New("failed to update item")
	}

	// Return updated item (using system UUID for full access)
	return s.GetItemByID(itemID, userID)
}

// VerifyQR checks if the item's attached QR belongs to the requesting user
func (s *ItemService) VerifyQR(itemID string, userID uuid.UUID) (bool, error) {
	item, err := s.ItemRepo.FindByID(itemID)
	if err != nil {
		return false, errors.New("item not found")
	}

	// Check if item has attached QR
	if item.AttachedQR == "" {
		return false, errors.New("this item doesn't have an attached QR code")
	}

	// Check if item is FOUND type
	if item.Type != models.ItemTypeFound {
		return false, errors.New("QR verification is only for found items")
	}

	// Check if item is still open
	if item.Status != models.ItemStatusOpen {
		return false, errors.New("this item has already been claimed")
	}

	// Compare attached QR with user ID
	isMatch := item.AttachedQR == userID.String()

	if isMatch {
		// Auto-claim the item for the QR owner
		item.OwnerID = &userID
		item.Status = models.ItemStatusClaimed
		if err := s.ItemRepo.Update(item); err != nil {
			return false, errors.New("failed to claim item")
		}

		// Notify the finder
		if item.FinderID != nil {
			s.NotifService.CreateNotification(
				*item.FinderID,
				"Pemilik Barang Ditemukan!",
				"Barang yang kamu temukan telah diklaim oleh pemiliknya melalui verifikasi QR.",
				"QR_VERIFIED",
				item.ID,
			)
		}
	}

	return isMatch, nil
}
