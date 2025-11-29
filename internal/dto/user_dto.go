package dto

import "github.com/google/uuid"

// UpdateUserRequest for updating user profile (Name and/or Phone)
type UpdateUserRequest struct {
	Name  string `json:"name,omitempty" example:"Jane Doe"`
	Phone string `json:"phone,omitempty" example:"08198765432"`
}

// UserDetailResponse for returning user details
type UserDetailResponse struct {
	ID             uuid.UUID `json:"id"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	Phone          string    `json:"phone"`
	IdentityNumber string    `json:"identity_number"`
	Role           string    `json:"role"`
	Faculty        string    `json:"faculty,omitempty"`
}
