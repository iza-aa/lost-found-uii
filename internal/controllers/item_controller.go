package controllers

import (
	"campus-lost-and-found/internal/dto"
	"campus-lost-and-found/internal/middleware"
	"campus-lost-and-found/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ItemController struct {
	Service *services.ItemService
}

func NewItemController(service *services.ItemService) *ItemController {
	return &ItemController{Service: service}
}

// ReportFoundItem godoc
// @Summary Report a found item (Finder First)
// @Description Report an item found without QR code
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateFoundItemRequest true "Create Found Item Request"
// @Success 200 {object} dto.ItemResponse
// @Failure 400 {object} map[string]string
// @Router /items/found [post]
func (ctrl *ItemController) ReportFoundItem(c *gin.Context) {
	var req dto.CreateFoundItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	res, err := ctrl.Service.ReportFoundItem(req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// ReportLostItem godoc
// @Summary Report a lost item (Ad-Hoc)
// @Description Report a lost item without QR code
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateLostItemRequest true "Create Lost Item Request"
// @Success 200 {object} dto.ItemResponse
// @Failure 400 {object} map[string]string
// @Router /items/lost [post]
func (ctrl *ItemController) ReportLostItem(c *gin.Context) {
	var req dto.CreateLostItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	res, err := ctrl.Service.ReportLostItem(req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// GetAllItems godoc
// @Summary Get all items
// @Description Get a list of all items (Lost & Found) with optional filters
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param status query string false "Filter by status (e.g., OPEN, CLAIMED)"
// @Param type query string false "Filter by type (LOST, FOUND)"
// @Success 200 {object} []dto.ItemResponse
// @Failure 500 {object} map[string]string
// @Router /items [get]
func (ctrl *ItemController) GetAllItems(c *gin.Context) {
	status := c.Query("status")
	itemType := c.Query("type")

	items, err := ctrl.Service.GetAllItems(status, itemType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

// SubmitClaim godoc
// @Summary Submit a claim for an item
// @Description Claim a found item
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Item ID"
// @Param request body dto.CreateClaimRequest true "Create Claim Request"
// @Success 200 {object} dto.ClaimResponse
// @Failure 400 {object} map[string]string
// @Router /items/{id}/claim [post]
func (ctrl *ItemController) SubmitClaim(c *gin.Context) {
	id := c.Param("id")
	var req dto.CreateClaimRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	res, err := ctrl.Service.SubmitClaim(id, req, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// GetClaims godoc
// @Summary Get claims for an item
// @Description Get all claims for an item (Finder only)
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Item ID"
// @Success 200 {object} []models.Claim
// @Failure 403 {object} map[string]string
// @Router /items/{id}/claims [get]
func (ctrl *ItemController) GetClaims(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)
	claims, err := ctrl.Service.GetClaims(id, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, claims)
}

// DecideClaim godoc
// @Summary Approve or Reject a claim
// @Description Decide on a claim (Finder only)
// @Tags claims
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Claim ID"
// @Param request body dto.DecideClaimRequest true "Decide Claim Request"
// @Success 200 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /claims/{id}/decide [put]
func (ctrl *ItemController) DecideClaim(c *gin.Context) {
	id := c.Param("id")
	var req dto.DecideClaimRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	err := ctrl.Service.DecideClaim(id, req.Status, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Claim status updated"})
}
