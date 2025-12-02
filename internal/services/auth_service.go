package services

import (
	"campus-lost-and-found/internal/dto"
	"campus-lost-and-found/internal/models"
	"campus-lost-and-found/internal/repository"
	"campus-lost-and-found/internal/utils"
	"errors"
	"strings"
)

type AuthService struct {
	UserRepo *repository.UserRepository
}

func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{UserRepo: userRepo}
}

func (s *AuthService) Register(req dto.RegisterRequest) (*dto.AuthResponse, error) {
	// Validate that email starts with identity number
	if !strings.HasPrefix(req.Email, req.IdentityNumber) {
		return nil, errors.New("Email validation failed. Your email must start with your NIM/NIP.")
	}

	// Check if identity number already exists
	existingByIdentity, _ := s.UserRepo.FindByIdentityNumber(req.IdentityNumber)
	if existingByIdentity != nil {
		return nil, errors.New("identity number already registered")
	}

	existingUser, _ := s.UserRepo.FindByEmail(req.Email)
	if existingUser != nil {
		return nil, errors.New("email already registered")
	}

	// Validate phone format (Indonesian phone numbers)
	if len(req.Phone) < 10 || len(req.Phone) > 15 {
		return nil, errors.New("invalid phone number format: must be between 10-15 digits")
	}
	if !strings.HasPrefix(req.Phone, "08") && !strings.HasPrefix(req.Phone, "+62") {
		return nil, errors.New("invalid phone number format: must start with 08 or +62")
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	role := models.RoleUser // Default to PUBLIK
	if req.Role != "" {
		role = models.UserRole(req.Role)
	} else {
		// Auto-assign based on email domain if role not specified (optional logic)
		if strings.HasSuffix(req.Email, "@students.uii.ac.id") {
			role = models.RoleStudent
		} else if strings.HasSuffix(req.Email, "@uii.ac.id") {
			role = models.RoleStaff
		}
	}

	var faculty *string
	if role == models.RoleStudent && req.Faculty != "" {
		f := req.Faculty
		faculty = &f
	} else if role == models.RoleStaff {
		faculty = nil // Explicitly null for Staff/Dosen
	} else if req.Faculty != "" {
		// Allow faculty for others? Prompt says "If User is Staff/Dosen, faculty value is null".
		// Implies others might have it? Or only Student?
		// "For model User... additional field, which is faculty. There's an exception where if the User is Staff/Dosen, the faculty value is null"
		// Let's assume only Students need it, or maybe Publik too?
		// Safest is to allow it if provided, unless it's Staff/Dosen.
		f := req.Faculty
		faculty = &f
	}

	user := &models.User{
		Name:           req.Name,
		Email:          req.Email,
		PasswordHash:   hashedPassword,
		Phone:          req.Phone,
		IdentityNumber: req.IdentityNumber,
		Role:           role,
		Faculty:        faculty,
	}

	if err := s.UserRepo.Create(user); err != nil {
		return nil, err
	}

	token, err := utils.GenerateToken(user.ID, string(user.Role))
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	facultyStr := ""
	if user.Faculty != nil {
		facultyStr = *user.Faculty
	}

	return &dto.AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User: dto.UserResponse{
			ID:             user.ID,
			Name:           user.Name,
			Email:          user.Email,
			Phone:          user.Phone,
			IdentityNumber: user.IdentityNumber,
			Role:           string(user.Role),
			Faculty:        facultyStr,
			Avatar:         user.Avatar,
		},
	}, nil
}

func (s *AuthService) Login(req dto.LoginRequest) (*dto.AuthResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, errors.New("email and password are required")
	}

	user, err := s.UserRepo.FindByEmail(req.Email)
	if err != nil {
		// "Verify login with unregistered username/email" -> "User not found"
		// Or "Invalid Credentials" if we want to be safe, but prompt asked for specific.
		return nil, errors.New("user not found")
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		// "Verify login with valid username and invalid password" -> "Invalid password"
		return nil, errors.New("invalid password")
	}

	token, err := utils.GenerateToken(user.ID, string(user.Role))
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	facultyStr := ""
	if user.Faculty != nil {
		facultyStr = *user.Faculty
	}

	return &dto.AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User: dto.UserResponse{
			ID:             user.ID,
			Name:           user.Name,
			Email:          user.Email,
			Phone:          user.Phone,
			IdentityNumber: user.IdentityNumber,
			Role:           string(user.Role),
			Faculty:        facultyStr,
			Avatar:         user.Avatar,
		},
	}, nil
}

func (s *AuthService) RefreshToken(req dto.RefreshTokenRequest) (*dto.AuthResponse, error) {
	claims, err := utils.ValidateToken(req.RefreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	if claims.Role != "REFRESH" {
		return nil, errors.New("invalid token type")
	}

	user, err := s.UserRepo.FindByID(claims.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	newToken, err := utils.GenerateToken(user.ID, string(user.Role))
	if err != nil {
		return nil, err
	}

	// Optionally rotate refresh token here
	newRefreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	facultyStr := ""
	if user.Faculty != nil {
		facultyStr = *user.Faculty
	}

	return &dto.AuthResponse{
		Token:        newToken,
		RefreshToken: newRefreshToken,
		User: dto.UserResponse{
			ID:             user.ID,
			Name:           user.Name,
			Email:          user.Email,
			Phone:          user.Phone,
			IdentityNumber: user.IdentityNumber,
			Role:           string(user.Role),
			Faculty:        facultyStr,
			Avatar:         user.Avatar,
		},
	}, nil
}
