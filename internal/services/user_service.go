package services

import (
	"campus-lost-and-found/internal/dto"
	"campus-lost-and-found/internal/repository"
	"errors"
	"strings"

	"github.com/google/uuid"
)

type UserService struct {
	UserRepo *repository.UserRepository
}

func NewUserService(userRepo *repository.UserRepository) *UserService {
	return &UserService{UserRepo: userRepo}
}

// GetAllUsers retrieves all users from the database
func (s *UserService) GetAllUsers() ([]dto.UserDetailResponse, error) {
	users, err := s.UserRepo.FindAll()
	if err != nil {
		return nil, err
	}

	var userResponses []dto.UserDetailResponse
	for _, user := range users {
		facultyStr := ""
		if user.Faculty != nil {
			facultyStr = *user.Faculty
		}

		userResponses = append(userResponses, dto.UserDetailResponse{
			ID:             user.ID,
			Name:           user.Name,
			Email:          user.Email,
			Phone:          user.Phone,
			IdentityNumber: user.IdentityNumber,
			Role:           string(user.Role),
			Faculty:        facultyStr,
		})
	}

	return userResponses, nil
}

// GetUserByID retrieves a specific user by ID
func (s *UserService) GetUserByID(userID string) (*dto.UserDetailResponse, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}

	user, err := s.UserRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	facultyStr := ""
	if user.Faculty != nil {
		facultyStr = *user.Faculty
	}

	return &dto.UserDetailResponse{
		ID:             user.ID,
		Name:           user.Name,
		Email:          user.Email,
		Phone:          user.Phone,
		IdentityNumber: user.IdentityNumber,
		Role:           string(user.Role),
		Faculty:        facultyStr,
	}, nil
}

// UpdateUser updates user's Name and/or Phone
func (s *UserService) UpdateUser(userID string, req dto.UpdateUserRequest) (*dto.UserDetailResponse, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}

	user, err := s.UserRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Validate at least one field is provided
	if req.Name == "" && req.Phone == "" {
		return nil, errors.New("at least one field (name or phone) must be provided")
	}

	// Update fields if provided
	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Phone != "" {
		// Validate phone format
		if len(req.Phone) < 10 || len(req.Phone) > 15 {
			return nil, errors.New("invalid phone number format: must be between 10-15 digits")
		}
		if !strings.HasPrefix(req.Phone, "08") && !strings.HasPrefix(req.Phone, "+62") {
			return nil, errors.New("invalid phone number format: must start with 08 or +62")
		}
		user.Phone = req.Phone
	}

	if err := s.UserRepo.Update(user); err != nil {
		return nil, err
	}

	facultyStr := ""
	if user.Faculty != nil {
		facultyStr = *user.Faculty
	}

	return &dto.UserDetailResponse{
		ID:             user.ID,
		Name:           user.Name,
		Email:          user.Email,
		Phone:          user.Phone,
		IdentityNumber: user.IdentityNumber,
		Role:           string(user.Role),
		Faculty:        facultyStr,
	}, nil
}
