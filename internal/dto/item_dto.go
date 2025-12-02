package dto

import (
	"time"

	"github.com/google/uuid"
)

type CreateFoundItemRequest struct {
	Title         string                `json:"title" binding:"required" example:"Blue Wallet"`
	Description   string                `json:"description" example:"Dompet warna biru dengan beberapa kartu"`
	CategoryID    uuid.UUID             `json:"category_id" binding:"required" example:"1bd43cf7-fc4f-4968-bd4f-c45699b03c18"`
	LocationID    uuid.UUID             `json:"location_id" binding:"required" example:"e9464495-bfe5-4ed0-8ea4-a2d69afa0b39"`
	ImageURL      string                `json:"image_url" example:"http://example.com/image.jpg"`
	Verifications []VerificationRequest `json:"verifications" binding:"required,dive"`
	DateFound     string                `json:"date_found" binding:"required" example:"2023-10-27"` // Format YYYY-MM-DD or RFC3339
	ReturnMethod  string                `json:"return_method" binding:"required,oneof=BRING_BY_FINDER HANDED_TO_SECURITY" example:"BRING_BY_FINDER"`
	COD           bool                  `json:"cod" example:"false"`
	ShowPhone     bool                  `json:"show_phone" example:"false"`
	Contacts      []ContactRequest      `json:"contacts" binding:"dive"`
	AttachedQR    string                `json:"attached_qr" example:"user-uuid-from-qr"` // QR code scanned from found item
}

type CreateLostItemRequest struct {
	Title             string           `json:"title" binding:"required" example:"iPhone 13"`
	CategoryID        uuid.UUID        `json:"category_id" binding:"required" example:"1bd43cf7-fc4f-4968-bd4f-c45699b03c18"`
	Description       string           `json:"description" example:"Black case with a sticker"`
	LocationLastSeen  string           `json:"location_last_seen" binding:"required" example:"Canteen"`
	LocationLatitude  float64          `json:"location_latitude" example:"-7.7734"`
	LocationLongitude float64          `json:"location_longitude" example:"110.3781"`
	DateLost          string           `json:"date_lost" binding:"required" example:"2023-10-26"` // Format YYYY-MM-DD
	ImageURL          string           `json:"image_url" example:"http://example.com/iphone.jpg"`
	Urgency           string           `json:"urgency" binding:"oneof=NORMAL HIGH CRITICAL" example:"HIGH"`
	OfferReward       bool             `json:"offer_reward" example:"true"`
	COD               bool             `json:"cod" example:"false"` // Owner willing to COD
	ShowPhone         bool             `json:"show_phone" example:"false"`
	Contacts          []ContactRequest `json:"contacts" binding:"dive"`
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
	ID                uuid.UUID              `json:"id"`
	Title             string                 `json:"title"`
	Description       string                 `json:"description,omitempty"`
	Type              string                 `json:"type,omitempty"`
	CategoryID        uuid.UUID              `json:"category_id"`
	CategoryName      string                 `json:"category_name,omitempty"`
	LocationID        uuid.UUID              `json:"location_id"`
	LocationName      string                 `json:"location_name,omitempty"`
	LocationLatitude  float64                `json:"location_latitude,omitempty"`
	LocationLongitude float64                `json:"location_longitude,omitempty"`
	ImageURL          string                 `json:"image_url"`
	Verifications     []VerificationResponse `json:"verifications,omitempty"` // For found items
	Status            string                 `json:"status"`
	CreatedAt         time.Time              `json:"created_at"`
	Urgency           string                 `json:"urgency,omitempty"`           // For lost items
	OfferReward       bool                   `json:"offer_reward,omitempty"`      // For lost items
	COD               bool                   `json:"cod,omitempty"`               // For both item types
	ShowPhone         bool                   `json:"show_phone"`                  // For both item types
	Contacts          []ContactResponse      `json:"contacts,omitempty"`          // For both item types
	Finder            *ItemUserResponse      `json:"finder,omitempty"`            // For found items
	Owner             *ItemUserResponse      `json:"owner,omitempty"`             // For lost items
	ApprovedClaim     *ClaimResponse         `json:"approved_claim,omitempty"`    // Claim yang sudah approved
	UserClaimStatus   string                 `json:"user_claim_status,omitempty"` // Status claim user saat ini (PENDING/APPROVED/REJECTED)
	AttachedQR        string                 `json:"attached_qr,omitempty"`       // QR code attached to found item
}

type ItemUserResponse struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Phone string    `json:"phone,omitempty"`
	Role  string    `json:"role"`
}

type VerificationResponse struct {
	Question string `json:"question"`
	// Answer hidden
}

type ContactResponse struct {
	Platform string `json:"platform"`
	Value    string `json:"value"`
}

// ========== CLAIM DTOs ==========

// CreateClaimRequest - For LOST items: Finder submits claim with questions
type CreateClaimRequest struct {
	Questions []ClaimQuestionRequest `json:"questions,omitempty" binding:"dive"`
	ShowPhone bool                   `json:"show_phone" example:"false"`
	Contacts  []ContactRequest       `json:"contacts" binding:"dive"`
	Note      string                 `json:"note" example:"Found near library"`
	// For FOUND items: Owner submits claim with answers to verification questions
	Answers []ClaimAnswerSimple `json:"answers,omitempty" binding:"dive"`
}

// ClaimAnswerSimple - Simple answer without question_id (uses question text)
type ClaimAnswerSimple struct {
	Question string `json:"question" example:"What color is your wallet?"`
	Answer   string `json:"answer" binding:"required" example:"Blue with white stripes"`
}

type ClaimQuestionRequest struct {
	Question string `json:"question" binding:"required" example:"What is the color of your wallet?"`
}

// UpdateItemRequest - For updating item details
type UpdateItemRequest struct {
	Title             string   `json:"title,omitempty" example:"iPhone 13 Pro"`
	Description       string   `json:"description,omitempty" example:"Updated description"`
	ImageURL          string   `json:"image_url,omitempty" example:"http://example.com/new-image.jpg"`
	CategoryID        string   `json:"category_id,omitempty" example:"e9464495-bfe5-4ed0-8ea4-a2d69afa0b39"`
	LocationID        string   `json:"location_id,omitempty" example:"e9464495-bfe5-4ed0-8ea4-a2d69afa0b39"`
	LocationLatitude  *float64 `json:"location_latitude,omitempty" example:"-7.7734"`
	LocationLongitude *float64 `json:"location_longitude,omitempty" example:"110.3781"`
	DateLost          string   `json:"date_lost,omitempty" example:"2023-10-26"`
	Urgency           string   `json:"urgency,omitempty" example:"HIGH"`
	OfferReward       *bool    `json:"offer_reward,omitempty" example:"true"`
	COD               *bool    `json:"cod,omitempty" example:"false"`
}

// AnswerClaimRequest - User 1 (owner) answers the questions
type AnswerClaimRequest struct {
	Answers []ClaimAnswerRequest `json:"answers" binding:"required,min=1,dive"`
}

type ClaimAnswerRequest struct {
	QuestionID uuid.UUID `json:"question_id" binding:"required"`
	Answer     string    `json:"answer" binding:"required" example:"Blue with white stripes"`
}

// DecideClaimRequest - User 2 (finder) approves or rejects
type DecideClaimRequest struct {
	Status string `json:"status" binding:"required,oneof=APPROVED REJECTED"`
}

// ClaimResponse - Full claim info
type ClaimResponse struct {
	ID        uuid.UUID               `json:"id"`
	ItemID    uuid.UUID               `json:"item_id"`
	FinderID  uuid.UUID               `json:"finder_id"`
	Finder    *ItemUserResponse       `json:"finder,omitempty"`
	Questions []ClaimQuestionResponse `json:"questions,omitempty"`
	Contacts  []ContactResponse       `json:"contacts,omitempty"`
	ShowPhone bool                    `json:"show_phone"`
	Note      string                  `json:"note"`
	Status    string                  `json:"status"`
	CreatedAt time.Time               `json:"created_at"`
}

type ClaimQuestionResponse struct {
	ID       uuid.UUID `json:"id"`
	Question string    `json:"question"`
	Answer   string    `json:"answer,omitempty"` // Only shown after answered
}
