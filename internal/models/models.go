package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Base model with UUID
type Base struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type UserRole string

const (
	RoleUser    UserRole = "PUBLIK"
	RoleStudent UserRole = "MAHASISWA"
	RoleStaff   UserRole = "STAFF_DOSEN"
	// Keeping these for backward compatibility or internal use if needed, but primary roles are above
	RoleAdmin    UserRole = "ADMIN"
	RoleSecurity UserRole = "SECURITY"
)

type User struct {
	Base
	Name           string   `json:"name"`
	Email          string   `gorm:"uniqueIndex:idx_users_email" json:"email"`
	PasswordHash   string   `json:"-"`
	Phone          string   `json:"phone"`
	IdentityNumber string   `gorm:"uniqueIndex:idx_users_identity" json:"identity_number"`
	Role           UserRole `gorm:"default:'PUBLIK'" json:"role"`
	Faculty        *string  `json:"faculty,omitempty"` // Nullable, null for Staff/Dosen
	Avatar         string   `json:"avatar,omitempty"`  // Profile avatar URL
}

type ItemCategory struct {
	ID   uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name string    `json:"name"`
}

type CampusLocation struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string    `json:"name"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Description string    `json:"description"`
}

type Asset struct {
	Base
	OwnerID         uuid.UUID    `json:"owner_id"`
	Owner           User         `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	CategoryID      uuid.UUID    `json:"category_id"`
	Category        ItemCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Description     string       `json:"description"`
	PrivateImageURL string       `json:"private_image_url"` // Not shown publicly
	LostMode        bool         `json:"lost_mode"`
	QRCodeURL       string       `json:"qr_code_url"`
}

type FoundEvent struct {
	ID         uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AssetID    uuid.UUID      `json:"asset_id"`
	Asset      Asset          `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
	FinderID   *uuid.UUID     `json:"finder_id"` // Can be nil if anonymous scan? No, prompt says FinderID FK. Assuming authenticated finder or security.
	Finder     *User          `gorm:"foreignKey:FinderID" json:"finder,omitempty"`
	LocationID uuid.UUID      `json:"location_id"`
	Location   CampusLocation `gorm:"foreignKey:LocationID" json:"location,omitempty"`
	Note       string         `json:"note"`
	ImageURL   string         `json:"image_url"`
	CreatedAt  time.Time      `json:"created_at"`
}

type ItemStatus string

const (
	ItemStatusOpen     ItemStatus = "OPEN"
	ItemStatusClaimed  ItemStatus = "CLAIMED"
	ItemStatusResolved ItemStatus = "RESOLVED"
)

type ItemType string

const (
	ItemTypeLost  ItemType = "LOST"
	ItemTypeFound ItemType = "FOUND"
)

type ReturnMethod string

const (
	ReturnMethodBringByFinder    ReturnMethod = "BRING_BY_FINDER"
	ReturnMethodHandedToSecurity ReturnMethod = "HANDED_TO_SECURITY"
)

type PlatformType string

const (
	PlatformInstagram PlatformType = "INSTAGRAM"
	PlatformTelegram  PlatformType = "TELEGRAM"
	PlatformLine      PlatformType = "LINE"
	PlatformTwitter   PlatformType = "TWITTER"
	PlatformEmail     PlatformType = "EMAIL"
	PlatformWhatsapp  PlatformType = "WHATSAPP"
	PlatformOther     PlatformType = "OTHER"
)

type ItemContact struct {
	Base
	ItemID   uuid.UUID    `json:"item_id"`
	Platform PlatformType `gorm:"type:varchar(50)" json:"platform"`
	Value    string       `json:"value"`
}

type ItemVerification struct {
	Base
	ItemID   uuid.UUID `json:"item_id"`
	Question string    `json:"question"`
	Answer   string    `json:"-"` // Hidden from JSON
}

type ItemUrgency string

const (
	UrgencyNormal   ItemUrgency = "NORMAL"
	UrgencyHigh     ItemUrgency = "HIGH"
	UrgencyCritical ItemUrgency = "CRITICAL"
)

// Finder-First Item (and now Owner-First Lost Item)
type Item struct {
	Base
	Title               string             `json:"title"`
	Description         string             `json:"description"` // Description for lost items
	Type                ItemType           `gorm:"default:'FOUND'" json:"type"`
	CategoryID          uuid.UUID          `json:"category_id"`
	Category            ItemCategory       `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	LocationID          *uuid.UUID         `json:"location_id"` // Nullable for Lost items
	Location            *CampusLocation    `gorm:"foreignKey:LocationID" json:"location,omitempty"`
	LocationDescription string             `json:"location_description"` // For Lost items (free text)
	LocationLatitude    float64            `json:"location_latitude"`    // Custom location lat
	LocationLongitude   float64            `json:"location_longitude"`   // Custom location lng
	ImageURL            string             `json:"image_url"`
	Verifications       []ItemVerification `gorm:"foreignKey:ItemID" json:"verifications,omitempty"`
	FinderID            *uuid.UUID         `json:"finder_id"` // Nullable for Lost items
	Finder              *User              `gorm:"foreignKey:FinderID" json:"finder,omitempty"`
	OwnerID             *uuid.UUID         `json:"owner_id"` // Nullable for Found items
	Owner               *User              `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	DateLost            *time.Time         `json:"date_lost"`
	DateFound           *time.Time         `json:"date_found"`
	Status              ItemStatus         `gorm:"default:'OPEN'" json:"status"`
	ReturnMethod        ReturnMethod       `json:"return_method"`
	COD                 bool               `gorm:"default:false" json:"cod"`
	ShowPhone           bool               `gorm:"default:false" json:"show_phone"`
	Contacts            []ItemContact      `gorm:"foreignKey:ItemID" json:"contacts,omitempty"`
	Urgency             ItemUrgency        `gorm:"default:'NORMAL'" json:"urgency"`
	OfferReward         bool               `gorm:"default:false" json:"offer_reward"`
	AttachedQR          string             `json:"attached_qr"` // QR code scanned from found item (user_id of owner)
}

type ClaimStatus string

const (
	ClaimStatusPending         ClaimStatus = "PENDING"          // User 2 submitted, waiting for User 1 to answer
	ClaimStatusPendingApproval ClaimStatus = "PENDING_APPROVAL" // User 1 answered, waiting for User 2 to approve/reject
	ClaimStatusApproved        ClaimStatus = "APPROVED"         // User 2 approved, contacts are visible
	ClaimStatusRejected        ClaimStatus = "REJECTED"         // User 2 rejected
)

// ClaimContact stores finder's contact info
type ClaimContact struct {
	ID        uuid.UUID    `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ClaimID   uuid.UUID    `json:"claim_id"`
	Platform  PlatformType `gorm:"type:varchar(50)" json:"platform"`
	Value     string       `json:"value"`
	CreatedAt time.Time    `json:"created_at"`
}

// ClaimQuestion stores verification questions from finder (User 2)
type ClaimQuestion struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ClaimID   uuid.UUID `json:"claim_id"`
	Question  string    `json:"question"`
	Answer    string    `json:"answer"` // Answer from owner (User 1)
	CreatedAt time.Time `json:"created_at"`
}

// Claim represents a finder claiming to have found a lost item
type Claim struct {
	ID        uuid.UUID       `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ItemID    uuid.UUID       `json:"item_id"`
	Item      Item            `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	FinderID  uuid.UUID       `json:"finder_id"` // User 2 - the one who found the item
	Finder    User            `gorm:"foreignKey:FinderID" json:"finder,omitempty"`
	Questions []ClaimQuestion `gorm:"foreignKey:ClaimID" json:"questions,omitempty"`
	Contacts  []ClaimContact  `gorm:"foreignKey:ClaimID" json:"contacts,omitempty"`
	ShowPhone bool            `gorm:"default:false" json:"show_phone"` // Whether to show WhatsApp
	Note      string          `json:"note"`                            // Optional note from finder
	Status    ClaimStatus     `gorm:"default:'PENDING'" json:"status"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

type Notification struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	RefType   string    `json:"ref_type"` // e.g., "ASSET_FOUND", "CLAIM_UPDATE"
	RefID     uuid.UUID `json:"ref_id"`
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}
