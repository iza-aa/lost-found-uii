package dto

import (
	"time"

	"github.com/google/uuid"
)

type CreateFoundItemRequest struct {
	Title         string                `json:"title" binding:"required" example:"Blue Wallet"`
	CategoryID    uuid.UUID             `json:"category_id" binding:"required" example:"1bd43cf7-fc4f-4968-bd4f-c45699b03c18"`
	LocationID    uuid.UUID             `json:"location_id" binding:"required" example:"e9464495-bfe5-4ed0-8ea4-a2d69afa0b39"`
	ImageURL      string                `json:"image_url" example:"http://example.com/image.jpg"`
	Verifications []VerificationRequest `json:"verifications" binding:"required,dive"`
	DateFound     string                `json:"date_found" binding:"required" example:"2023-10-27"` // Format YYYY-MM-DD or RFC3339
	ReturnMethod  string                `json:"return_method" binding:"required,oneof=BRING_BY_FINDER HANDED_TO_SECURITY" example:"BRING_BY_FINDER"`
	COD           bool                  `json:"cod" example:"false"`
}

type CreateLostItemRequest struct {
	Title            string           `json:"title" binding:"required" example:"iPhone 13"`
	CategoryID       uuid.UUID        `json:"category_id" binding:"required" example:"1bd43cf7-fc4f-4968-bd4f-c45699b03c18"`
	Description      string           `json:"description" example:"Black case with a sticker"`
	LocationLastSeen string           `json:"location_last_seen" binding:"required" example:"Canteen"`
	DateLost         string           `json:"date_lost" binding:"required" example:"2023-10-26"` // Format YYYY-MM-DD
	ImageURL         string           `json:"image_url" example:"http://example.com/iphone.jpg"`
	Urgency          string           `json:"urgency" binding:"oneof=NORMAL HIGH CRITICAL" example:"HIGH"`
	OfferReward      bool             `json:"offer_reward" example:"true"`
	ShowPhone        bool             `json:"show_phone" example:"false"`
	Contacts         []ContactRequest `json:"contacts" binding:"dive"`
}

type VerificationRequest struct {
	Question string `json:"question" binding:"required" example:"What is the color?"`
	Answer   string `json:"answer" binding:"required" example:"Blue"`
}

type ContactRequest struct {
	Platform string `json:"platform" binding:"required" example:"WHATSAPP"`
	Value    string `json:"value" binding:"required" example:"08123456789"`
}

type ItemResponse struct {
	ID            uuid.UUID              `json:"id"`
	Title         string                 `json:"title"`
	CategoryID    uuid.UUID              `json:"category_id"`
	CategoryName  string                 `json:"category_name,omitempty"`
	LocationID    uuid.UUID              `json:"location_id"`
	LocationName  string                 `json:"location_name,omitempty"`
	ImageURL      string                 `json:"image_url"`
	Verifications []VerificationResponse `json:"verifications,omitempty"`
	Status        string                 `json:"status"`
	CreatedAt     time.Time              `json:"created_at"`
	Urgency       string                 `json:"urgency,omitempty"`
	OfferReward   bool                   `json:"offer_reward"`
	Contacts      []ContactResponse      `json:"contacts,omitempty"`
}

type VerificationResponse struct {
	Question string `json:"question"`
	// Answer hidden
}

type ContactResponse struct {
	Platform string `json:"platform"`
	Value    string `json:"value"`
}

type CreateClaimRequest struct {
	AnswerInput string `json:"answer_input" binding:"required"`
}

type ClaimResponse struct {
	ID          uuid.UUID `json:"id"`
	ItemID      uuid.UUID `json:"item_id"`
	OwnerID     uuid.UUID `json:"owner_id"`
	AnswerInput string    `json:"answer_input"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

type DecideClaimRequest struct {
	Status string `json:"status" binding:"required,oneof=APPROVED REJECTED"`
}
