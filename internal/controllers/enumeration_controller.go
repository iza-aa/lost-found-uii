package controllers

import (
	"campus-lost-and-found/internal/repository"
	"net/http"

	"github.com/gin-gonic/gin"
)

type EnumerationController struct {
	Repo *repository.EnumerationRepository
}

func NewEnumerationController(repo *repository.EnumerationRepository) *EnumerationController {
	return &EnumerationController{Repo: repo}
}

// GetCategories godoc
// @Summary Get item categories
// @Description Get list of item categories
// @Tags enumerations
// @Accept json
// @Produce json
// @Success 200 {object} []models.ItemCategory
// @Router /enumerations/item-categories [get]
func (ctrl *EnumerationController) GetCategories(c *gin.Context) {
	categories, err := ctrl.Repo.GetCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, categories)
}

// GetLocations godoc
// @Summary Get campus locations
// @Description Get list of campus locations
// @Tags enumerations
// @Accept json
// @Produce json
// @Success 200 {object} []models.CampusLocation
// @Router /enumerations/campus-locations [get]
func (ctrl *EnumerationController) GetLocations(c *gin.Context) {
	locations, err := ctrl.Repo.GetLocations()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, locations)
}

type CreateCategoryRequest struct {
	Name string `json:"name" binding:"required"`
}

// CreateCategory godoc
// @Summary Create item category
// @Description Create a new item category
// @Tags enumerations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body CreateCategoryRequest true "Create Category Request"
// @Success 200 {object} models.ItemCategory
// @Failure 400 {object} map[string]string
// @Router /enumerations/item-categories [post]
func (ctrl *EnumerationController) CreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := ctrl.Repo.CreateCategory(req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, category)
}

type CreateLocationRequest struct {
	Name      string  `json:"name" binding:"required"`
	Latitude  float64 `json:"latitude" binding:"required"`
	Longitude float64 `json:"longitude" binding:"required"`
}

// CreateLocation godoc
// @Summary Create campus location
// @Description Create a new campus location
// @Tags enumerations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body CreateLocationRequest true "Create Location Request"
// @Success 200 {object} models.CampusLocation
// @Failure 400 {object} map[string]string
// @Router /enumerations/campus-locations [post]
func (ctrl *EnumerationController) CreateLocation(c *gin.Context) {
	var req CreateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	location, err := ctrl.Repo.CreateLocation(req.Name, req.Latitude, req.Longitude)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, location)
}
