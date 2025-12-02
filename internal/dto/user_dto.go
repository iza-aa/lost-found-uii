package dto

import "github.com/google/uuid"

// UpdateUserRequest for updating user profile (Name, Phone, and/or Avatar)
type UpdateUserRequest struct {
	Name   string `json:"name,omitempty" example:"Jane Doe"`
	Phone  string `json:"phone,omitempty" example:"08198765432"`
	Avatar string `json:"avatar,omitempty" example:"http://example.com/avatar.jpg"`
}

// ChangePasswordRequest for changing user password
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required" example:"oldPass123"`
	NewPassword     string `json:"new_password" binding:"required,min=6" example:"newPass456"`
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
	Avatar         string    `json:"avatar,omitempty"`
}
