package services

import (
	"bytes"
	"campus-lost-and-found/config"
	"fmt"
	"io"
	"mime/multipart"
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
