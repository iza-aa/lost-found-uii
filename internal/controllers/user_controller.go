package controllers

import (
	"campus-lost-and-found/internal/dto"
	"campus-lost-and-found/internal/middleware"
	"campus-lost-and-found/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserController struct {
	Service *services.UserService
}

func NewUserController(service *services.UserService) *UserController {
	return &UserController{Service: service}
}

// GetAllUsers godoc
// @Summary Get all users
// @Description Get a list of all users
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} []dto.UserDetailResponse
// @Failure 500 {object} map[string]string
// @Router /users [get]
func (ctrl *UserController) GetAllUsers(c *gin.Context) {
	users, err := ctrl.Service.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

// GetUser godoc
// @Summary Get user by ID
// @Description Get a specific user by their ID
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "User ID"
// @Success 200 {object} dto.UserDetailResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /users/{id} [get]
func (ctrl *UserController) GetUser(c *gin.Context) {
	userID := c.Param("id")
	user, err := ctrl.Service.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, user)
}

// UpdateUser godoc
// @Summary Update user profile
// @Description Update authenticated user's name and/or phone
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.UpdateUserRequest true "Update User Request"
// @Success 200 {object} dto.UserDetailResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /users/me [put]
func (ctrl *UserController) UpdateUser(c *gin.Context) {
	var req dto.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	user, err := ctrl.Service.UpdateUser(userID.String(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}
