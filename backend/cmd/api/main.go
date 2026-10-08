package main

import (
	"fmt"
	"log"
	"os"

	"fleet-spark/internal/auth"
	"fleet-spark/internal/config"
	"fleet-spark/internal/db"
	"fleet-spark/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, continuing with environment variables")
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	conn, err := db.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatal(fmt.Errorf("database connection failed: %w", err))
	}
	defer conn.Close()

	r := gin.Default()

	api := r.Group("/api/v1")
	{
		api.POST("/auth/register", handlers.Register(conn, cfg.JWTSecret))
		api.POST("/auth/login", handlers.Login(conn, cfg.JWTSecret))
		api.GET("/me", auth.RequireAuth(cfg.JWTSecret), handlers.Me(conn))
		api.GET("/vehicles", handlers.ListVehicles(conn))
		api.POST("/vehicles", auth.RequireAuth(cfg.JWTSecret), handlers.CreateVehicle(conn))
		api.GET("/finance/quote", handlers.FinanceQuote)
		api.GET("/payouts", auth.RequireAuth(cfg.JWTSecret), handlers.ListPayouts(conn))
		api.GET("/admin/dashboard", auth.RequireAuth(cfg.JWTSecret), handlers.AdminDashboard(conn))
	}

	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("Fleet Spark Go API listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
