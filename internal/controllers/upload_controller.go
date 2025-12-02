package controllers

import (
	"campus-lost-and-found/internal/services"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UploadController struct {
	Service *services.UploadService
}

func NewUploadController(service *services.UploadService) *UploadController {
	return &UploadController{Service: service}
}

// UploadFile godoc
// @Summary Upload a file
// @Description Upload a file to storage
// @Tags upload
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "File to upload"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /upload [post]
func (ctrl *UploadController) UploadFile(c *gin.Context) {
	log.Println("Upload request received")
	log.Printf("Content-Type: %s", c.ContentType())

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		log.Printf("Error getting file from form: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded: " + err.Error()})
		return
	}
	defer file.Close()

	log.Printf("File received: %s, Size: %d", header.Filename, header.Size)

	url, err := ctrl.Service.UploadFile(file, header)
	if err != nil {
		log.Printf("Error uploading file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("File uploaded successfully: %s", url)
	c.JSON(http.StatusOK, gin.H{"url": url})
}
