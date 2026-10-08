package handlers

import (
	"context"
	"net/http"
	"time"

	"fleet-spark/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func ListVehicles(conn *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := conn.Query(context.Background(), `
			SELECT id, title, description, price, status, owner_id, created_at
			FROM vehicles ORDER BY created_at DESC LIMIT 50
		`)
		if err != nil {
			c.JSON(http.StatusOK, []models.Vehicle{})
			return
		}
		defer rows.Close()

		var vehicles []models.Vehicle
		for rows.Next() {
			var v models.Vehicle
			if err := rows.Scan(&v.ID, &v.Title, &v.Description, &v.Price, &v.Status, &v.OwnerID, &v.CreatedAt); err != nil {
				continue
			}
			vehicles = append(vehicles, v)
		}

		c.JSON(http.StatusOK, vehicles)
	}
}

func CreateVehicle(conn *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var vehicle models.Vehicle
		if err := c.ShouldBindJSON(&vehicle); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing identity"})
			return
		}

		vehicle.ID = uuid.NewString()
		vehicle.OwnerID = userID.(string)
		vehicle.CreatedAt = time.Now().UTC()
		if vehicle.Status == "" {
			vehicle.Status = "active"
		}

		_, err := conn.Exec(context.Background(), `
			INSERT INTO vehicles (id, title, description, price, status, owner_id, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, vehicle.ID, vehicle.Title, vehicle.Description, vehicle.Price, vehicle.Status, vehicle.OwnerID, vehicle.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "vehicle creation failed"})
			return
		}

		c.JSON(http.StatusCreated, vehicle)
	}
}
