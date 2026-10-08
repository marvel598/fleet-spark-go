package config

import (
	"errors"
	"os"
)

// Config holds configuration for the API server.
type Config struct {
	DatabaseURL string
	JWTSecret   string
	JWTTTL      string
	AppEnv      string
	Port        string
}

func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		JWTTTL:      os.Getenv("JWT_TTL"),
		AppEnv:      os.Getenv("APP_ENV"),
		Port:        os.Getenv("PORT"),
	}

	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, errors.New("JWT_SECRET is required")
	}
	if cfg.JWTTTL == "" {
		cfg.JWTTTL = "24h"
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}

	return cfg, nil
}
