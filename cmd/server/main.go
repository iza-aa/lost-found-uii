package main

import (
	"campus-lost-and-found/config"
	"campus-lost-and-found/internal/controllers"
	"campus-lost-and-found/internal/matching"
	"campus-lost-and-found/internal/models"
	"campus-lost-and-found/internal/repository"
	"campus-lost-and-found/internal/router"
	"campus-lost-and-found/internal/services"
	"log"
	"os"

	"github.com/gin-gonic/gin"

	// Swagger docs
	_ "campus-lost-and-found/docs"
)

// @title Campus Lost & Found API
// @version 1.0
// @description API for Campus Lost & Found System
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host 157.10.161.213:3000
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	// 1. Init Config & DB
	config.InitConfig()
	db := config.GetDB()

	// 2. Auto Migrate
	err := db.AutoMigrate(
		&models.User{},
		&models.ItemCategory{},
		&models.CampusLocation{},
		&models.Asset{},
		&models.FoundEvent{},
		&models.Item{},
		&models.ItemVerification{},
		&models.ItemContact{},
		&models.Claim{},
		&models.ClaimQuestion{},
		&models.ClaimContact{},
		&models.Notification{},
	)
	if err != nil {
		log.Fatal("Migration failed:", err)
	}

	// 3. Init Repositories
	userRepo := repository.NewUserRepository(db)
	assetRepo := repository.NewAssetRepository(db)
	itemRepo := repository.NewItemRepository(db)
	claimRepo := repository.NewClaimRepository(db)
	notifRepo := repository.NewNotificationRepository(db)
	enumRepo := repository.NewEnumerationRepository(db)

	// Seed Data
	enumRepo.Seed()

	// 4. Init Services
	notifService := services.NewNotificationService(notifRepo)
	authService := services.NewAuthService(userRepo)
	uploadService := services.NewUploadService()
	assetService := services.NewAssetService(assetRepo, uploadService, notifService)
	matchingEngine := matching.NewMatchingEngine(notifService)
	itemService := services.NewItemService(itemRepo, assetRepo, claimRepo, userRepo, matchingEngine, notifService)

	// 5. Init Controllers
	authController := controllers.NewAuthController(authService)
	assetController := controllers.NewAssetController(assetService)
	itemController := controllers.NewItemController(itemService)
	userController := controllers.NewUserController(services.NewUserService(userRepo))
	enumController := controllers.NewEnumerationController(enumRepo)
	notifController := controllers.NewNotificationController(notifService)
	uploadController := controllers.NewUploadController(uploadService)

	// 6. Init Router
	appRouter := router.NewAppRouter(
		authController,
		assetController,
		itemController,
		userController,
		enumController,
		notifController,
		uploadController,
	)

	r := gin.Default()

	// CORS Middleware
	// CORS Middleware
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			allowed := false
			for _, o := range config.AppConfig.AllowedOrigins {
				if o == "*" || o == origin {
					allowed = true
					break
				}
			}

			if allowed {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
				c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
				c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
			}
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Set Max Multipart Memory
	r.MaxMultipartMemory = config.AppConfig.MaxUploadSize

	appRouter.Setup(r)

	// 7. Run Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Server starting on :" + port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
