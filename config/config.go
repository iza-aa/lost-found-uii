package config

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Config struct {
	DB             *gorm.DB
	JWTExpiry      time.Duration
	AllowedOrigins []string
	MaxUploadSize  int64
	UploadPath     string
}

var AppConfig *Config

func InitConfig() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, relying on environment variables")
	}

	var dsn string
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		dsn = dbURL
	} else {
		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
			os.Getenv("DB_HOST"),
			os.Getenv("DB_USER"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_NAME"),
			os.Getenv("DB_PORT"),
		)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connection established")

	// JWT Expiry
	jwtExpiryStr := os.Getenv("JWT_EXPIRY")
	jwtExpiry, err := time.ParseDuration(jwtExpiryStr)
	if err != nil {
		jwtExpiry = 24 * time.Hour // Default
	}

	// Allowed Origins
	allowedOriginsStr := os.Getenv("ALLOWED_ORIGINS")
	var allowedOrigins []string
	if allowedOriginsStr != "" {
		allowedOrigins = strings.Split(allowedOriginsStr, ",")
	} else {
		allowedOrigins = []string{"*"}
	}

	// Max Upload Size
	maxUploadSizeStr := os.Getenv("MAX_UPLOAD_SIZE")
	var maxUploadSize int64
	if maxUploadSizeStr != "" {
		fmt.Sscanf(maxUploadSizeStr, "%d", &maxUploadSize)
	} else {
		maxUploadSize = 10 * 1024 * 1024 // 10MB Default
	}

	// Upload Path
	uploadPath := os.Getenv("UPLOAD_PATH")
	if uploadPath == "" {
		uploadPath = "./uploads"
	}

	AppConfig = &Config{
		DB:             db,
		JWTExpiry:      jwtExpiry,
		AllowedOrigins: allowedOrigins,
		MaxUploadSize:  maxUploadSize,
		UploadPath:     uploadPath,
	}
}

func GetDB() *gorm.DB {
	return AppConfig.DB
}
