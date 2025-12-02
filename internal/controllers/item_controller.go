package controllers

import (
	"campus-lost-and-found/internal/dto"
	"campus-lost-and-found/internal/middleware"
	"campus-lost-and-found/internal/services"
	"log"
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

// GetItemByID godoc
// @Summary Get item by ID
// @Description Get detailed information about a specific item
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Item ID"
// @Success 200 {object} dto.ItemResponse
// @Failure 404 {object} map[string]string
// @Router /items/{id} [get]
func (ctrl *ItemController) GetItemByID(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	res, err := ctrl.Service.GetItemByID(id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
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

	// Validate query parameters
	if itemType != "" && itemType != "FOUND" && itemType != "LOST" {
		c.JSON(400, gin.H{"error": "invalid type: must be FOUND or LOST"})
		return
	}
	if status != "" && status != "OPEN" && status != "CLAIMED" && status != "RESOLVED" {
		c.JSON(400, gin.H{"error": "invalid status: must be OPEN, CLAIMED, or RESOLVED"})
		return
	}

	items, err := ctrl.Service.GetAllItems(status, itemType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

// GetMyItems godoc
// @Summary Get my items
// @Description Get all items reported by the authenticated user (as finder or owner)
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} []dto.ItemResponse
// @Failure 500 {object} map[string]string
// @Router /items/my [get]
func (ctrl *ItemController) GetMyItems(c *gin.Context) {
	userID := middleware.GetUserID(c)

	items, err := ctrl.Service.GetMyItems(userID)
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
// @Description Get all claims for an item (Owner only for LOST items)
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Item ID"
// @Success 200 {object} []dto.ClaimResponse
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

// GetUserClaim godoc
// @Summary Get current user's claim for an item
// @Description Get the claim submitted by the current user for a specific item
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Item ID"
// @Success 200 {object} dto.ClaimResponse
// @Failure 404 {object} map[string]string
// @Router /items/{id}/my-claim [get]
func (ctrl *ItemController) GetUserClaim(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)
	claim, err := ctrl.Service.GetUserClaimForItem(id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if claim == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no claim found"})
		return
	}
	c.JSON(http.StatusOK, claim)
}

// AnswerClaim godoc
// @Summary Answer verification questions for a claim
// @Description Owner answers the questions from finder (Owner only)
// @Tags claims
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Claim ID"
// @Param request body dto.AnswerClaimRequest true "Answer Claim Request"
// @Success 200 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /claims/{id}/answer [put]
func (ctrl *ItemController) AnswerClaim(c *gin.Context) {
	id := c.Param("id")
	var req dto.AnswerClaimRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	err := ctrl.Service.AnswerClaim(id, req, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Questions answered successfully"})
}

// DecideClaim godoc
// @Summary Approve or Reject a claim
// @Description Decide on a claim (Finder only - the one who submitted the claim)
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

// GetItem godoc
// @Summary Get item by ID
// @Description Get detailed information about a specific item
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Item ID"
// @Success 200 {object} models.Item
// @Failure 404 {object} map[string]string
// @Router /items/{id} [get]
func (ctrl *ItemController) GetItem(c *gin.Context) {
	id := c.Param("id")
	item, err := ctrl.Service.GetItem(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// UpdateItem godoc
// @Summary Update an item
// @Description Update an item's details (Finder or Owner only)
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Item ID"
// @Param request body dto.UpdateItemRequest true "Update data"
// @Success 200 {object} dto.ItemResponse
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /items/{id} [put]
func (ctrl *ItemController) UpdateItem(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	var req dto.UpdateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("UpdateItem controller received - id: %s, req.CategoryID: '%s', req.Title: '%s'", id, req.CategoryID, req.Title)

	item, err := ctrl.Service.UpdateItem(id, userID, req)
	if err != nil {
		if err.Error() == "item not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, item)
}

// DeleteItem godoc
// @Summary Delete an item
// @Description Delete an item (Finder or Owner only)
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Item ID"
// @Success 200 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /items/{id} [delete]
func (ctrl *ItemController) DeleteItem(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)
	err := ctrl.Service.DeleteItem(id, userID)
	if err != nil {
		if err.Error() == "item not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item deleted successfully"})
}

// VerifyQR godoc
// @Summary Verify if item's QR belongs to user
// @Description Check if the attached QR code on a found item matches the requesting user's QR
// @Tags items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Item ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /items/{id}/verify-qr [post]
func (ctrl *ItemController) VerifyQR(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	isMatch, err := ctrl.Service.VerifyQR(id, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if isMatch {
		c.JSON(http.StatusOK, gin.H{
			"match":   true,
			"message": "QR ini milik Anda! Barang telah diklaim.",
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"match":   false,
			"message": "Maaf, QR di postingan ini bukan milik Anda.",
		})
	}
}
