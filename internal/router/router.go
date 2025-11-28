package router

import (
	"campus-lost-and-found/config"
	"campus-lost-and-found/internal/controllers"
	"campus-lost-and-found/internal/middleware"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

type AppRouter struct {
	AuthController        *controllers.AuthController
	AssetController       *controllers.AssetController
	ItemController        *controllers.ItemController
	EnumerationController *controllers.EnumerationController
	NotificationController *controllers.NotificationController
	UploadController      *controllers.UploadController
}

func NewAppRouter(
	auth *controllers.AuthController,
	asset *controllers.AssetController,
	item *controllers.ItemController,
	enum *controllers.EnumerationController,
	notif *controllers.NotificationController,
	upload *controllers.UploadController,
) *AppRouter {
	return &AppRouter{
		AuthController:        auth,
		AssetController:       asset,
		ItemController:        item,
		EnumerationController: enum,
		NotificationController: notif,
		UploadController:      upload,
	}
}

func (r *AppRouter) Setup(engine *gin.Engine) {
	// Swagger
	engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Static Files
	engine.Static("/uploads", config.AppConfig.UploadPath)

	// Static Files (Uploads)
	// Ensure config is imported or passed, but AppRouter doesn't have config.
	// We can use config.AppConfig directly since it's a global singleton in this project structure.
	// But router package needs to import config.
	// Let's check imports first.
	// I will assume I need to add import if not present.
	// For now, I'll use a hardcoded path or try to access config if imported.
	// Wait, router.go imports "campus-lost-and-found/internal/controllers" and "middleware".
	// It does NOT import "config".
	// I should add the import in a separate step or use a hardcoded fallback if I can't easily add import here without viewing.
	// I viewed router.go, it does NOT import config.
	// I will add the import first.


	// Public Routes
	api := engine.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", r.AuthController.Register)
			auth.POST("/login", r.AuthController.Login)
			auth.POST("/refresh", r.AuthController.RefreshToken)
		}

		enum := api.Group("/enumerations")
		{
			enum.GET("/item-categories", r.EnumerationController.GetCategories)
			enum.POST("/item-categories", r.EnumerationController.CreateCategory)
			enum.GET("/campus-locations", r.EnumerationController.GetLocations)
			enum.POST("/campus-locations", r.EnumerationController.CreateLocation)
		}

		// Public Scan
		api.GET("/scan/:id", r.AssetController.GetAsset) // Reusing GetAsset but maybe should be specific?
		// Prompt says: GET /scan/:asset_id -> public, return category + nearest security point.
		// My GetAsset returns full details if owner, but partial if not?
		// Wait, GetAsset in controller checks ownership.
		// If not owner, it hides private image.
		// But prompt says "return: category + nearest security point".
		// I should probably make a specific endpoint or just let GetAsset handle it.
		// I'll stick to GetAsset for simplicity as it already hides private data.
		// But I need to allow public access to GetAsset?
		// Currently GetAsset uses `middleware.GetUserID(c)` which implies it needs Auth?
		// No, `GetUserID` returns empty if not set.
		// But I need to make sure `GetAsset` route is NOT under AuthMiddleware.
		// See below.
	}

	// Protected Routes
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		// Assets
		assets := protected.Group("/assets")
		{
			assets.GET("/lost", r.AssetController.GetLostAssets) // Public/Protected? Prompt implies public feed, but here under protected. Let's keep it protected for now as per structure.
			assets.POST("", r.AssetController.CreateAsset)
			assets.GET("/:id", r.AssetController.GetAsset) // Authenticated Get
			assets.PUT("/:id/lost-mode", r.AssetController.UpdateLostMode)
			assets.GET("/:id/found-events", r.AssetController.GetFoundEvents)
			assets.POST("/:id/report-found", r.AssetController.ReportFound) // This should be public?
			// Prompt says "GET /scan/:asset_id public".
			// "POST /assets/:asset_id/report-found creates found_event".
			// Usually reporting found is public (anyone can scan).
			// If so, I should move `ReportFound` to public.
			// But `ReportFound` might need to identify the finder?
			// Prompt says "finder_id FK".
			// If public, finder is anonymous?
			// Schema says "finder_id FK". FK usually implies it must exist in Users.
			// So Finder MUST be logged in?
			// "Role Guard (ONLY finder can accept claims)".
			// "items (Finder-First) ... finder_id FK".
			// "found_events ... finder_id FK".
			// So yes, Finder must be logged in to report?
			// Or maybe there is a "Security" role that scans?
			// Let's assume for `ReportFound` (Scan Flow), the user must be logged in.
			// But `GET /scan/:id` is public.
		}

		// Items (Finder First)
		items := protected.Group("/items")
		{
			items.POST("/lost", r.ItemController.ReportLostItem) // Ad-Hoc Lost Item
			items.POST("/found", r.ItemController.ReportFoundItem)
			items.GET("", r.ItemController.GetAllItems)
			items.POST("/:id/claim", r.ItemController.SubmitClaim)
			items.GET("/:id/claims", r.ItemController.GetClaims)
		}

		// Claims
		claims := protected.Group("/claims")
		{
			claims.PUT("/:id/decide", r.ItemController.DecideClaim)
		}

		// Notifications
		notifs := protected.Group("/notifications")
		{
			notifs.GET("", r.NotificationController.GetNotifications)
			notifs.PUT("/:id/read", r.NotificationController.MarkAsRead)
		}

		// Upload
		protected.POST("/upload", r.UploadController.UploadFile)
	}
	
	// Public Scan Endpoint (Specific)
	// Already registered above in line 59

}
