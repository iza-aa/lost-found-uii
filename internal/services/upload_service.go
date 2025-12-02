package services

import (
	"bytes"
	"campus-lost-and-found/config"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

type UploadService struct {
	SupabaseURL string
	SupabaseKey string
}

func NewUploadService() *UploadService {
	return &UploadService{
		SupabaseURL: os.Getenv("SUPABASE_URL"),
		SupabaseKey: os.Getenv("SUPABASE_KEY"),
	}
}

func (s *UploadService) UploadFile(file multipart.File, header *multipart.FileHeader) (string, error) {
	// 1. Validate File Size
	if header.Size > config.AppConfig.MaxUploadSize {
		return "", fmt.Errorf("file size exceeds the limit of %d MB", config.AppConfig.MaxUploadSize/(1024*1024))
	}

	// 2. Validate File Type
	// Read first 512 bytes to detect content type
	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		return "", err
	}
	// Reset file pointer to start
	if _, err := file.Seek(0, 0); err != nil {
		return "", err
	}

	contentType := http.DetectContentType(buffer)
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/jpg":  true, // Sometimes detected as this
		"image/webp": true, // WebP format
		"image/gif":  true, // GIF format
	}

	if !allowedTypes[contentType] {
		return "", fmt.Errorf("file type not allowed: %s. Only JPG, PNG, WebP, and GIF are allowed", contentType)
	}

	uploadDir := config.AppConfig.UploadPath
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), header.Filename)
	filepath := filepath.Join(uploadDir, filename)

	dst, err := os.Create(filepath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", err
	}

	return fmt.Sprintf("/uploads/%s", filename), nil
}

func (s *UploadService) UploadBytes(data []byte, filename string) (string, error) {
	uploadDir := config.AppConfig.UploadPath
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	filepath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(filepath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, bytes.NewReader(data)); err != nil {
		return "", err
	}

	return fmt.Sprintf("/uploads/%s", filename), nil
}
