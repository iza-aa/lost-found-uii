package dto

import "github.com/google/uuid"

type RegisterRequest struct {
	Name           string `json:"name" binding:"required" example:"John Doe"`
	Email          string `json:"email" binding:"required,email" example:"john@students.uii.ac.id"`
	Password       string `json:"password" binding:"required,min=6" example:"password123"`
	Phone          string `json:"phone" binding:"required" example:"08123456789"`
	IdentityNumber string `json:"identity_number" binding:"required" example:"21523001"`
	Role           string `json:"role" binding:"oneof=PUBLIK MAHASISWA STAFF_DOSEN ADMIN SECURITY" example:"MAHASISWA"`
	Faculty        string `json:"faculty" example:"Fakultas Teknologi Industri"` // Optional, empty for Staff/Dosen
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email" example:"john@students.uii.ac.id"`
	Password string `json:"password" binding:"required" example:"password123"`
}

type AuthResponse struct {
	Token        string       `json:"token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type UserResponse struct {
	ID             uuid.UUID `json:"id"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	Phone          string    `json:"phone"`
	IdentityNumber string    `json:"identity_number"`
	Role           string    `json:"role"`
	Faculty        string    `json:"faculty,omitempty"`
	Avatar         string    `json:"avatar,omitempty"`
}
