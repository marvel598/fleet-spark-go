package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"fleet-spark/internal/auth"
	"fleet-spark/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type registerRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	FullName string `json:"full_name" binding:"required,min=2"`
	Role     string `json:"role" binding:"required"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type authResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func Register(conn *pgxpool.Pool, jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req registerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "password hashing failed"})
			return
		}

		userID := uuid.NewString()
		createdAt := time.Now().UTC()

		_, err = conn.Exec(context.Background(), `
			INSERT INTO users (id, email, full_name, password_hash, role, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, userID, req.Email, req.FullName, string(hash), req.Role, createdAt, createdAt)
		if err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
			return
		}

		token, err := auth.GenerateToken(jwtSecret, userID, req.Role, 24*time.Hour)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
			return
		}

		user := models.User{ID: userID, Email: req.Email, FullName: req.FullName, Role: req.Role, CreatedAt: createdAt, UpdatedAt: createdAt}
		c.JSON(http.StatusCreated, authResponse{Token: token, User: user})
	}
}

func Login(conn *pgxpool.Pool, jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req loginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var user models.User
		var passwordHash string
		err := conn.QueryRow(context.Background(), `
			SELECT id, email, full_name, role, password_hash, created_at, updated_at
			FROM users WHERE email = $1
		`, req.Email).Scan(&user.ID, &user.Email, &user.FullName, &user.Role, &passwordHash, &user.CreatedAt, &user.UpdatedAt)
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database lookup failed"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		token, err := auth.GenerateToken(jwtSecret, user.ID, user.Role, 24*time.Hour)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to generate token"})
			return
		}

		c.JSON(http.StatusOK, authResponse{Token: token, User: user})
	}
}

func Me(conn *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user"})
			return
		}

		var user models.User
		err := conn.QueryRow(context.Background(), `
			SELECT id, email, full_name, role, created_at, updated_at
			FROM users WHERE id = $1
		`, userID).Scan(&user.ID, &user.Email, &user.FullName, &user.Role, &user.CreatedAt, &user.UpdatedAt)
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "lookup failed"})
			return
		}

		c.JSON(http.StatusOK, user)
	}
}
