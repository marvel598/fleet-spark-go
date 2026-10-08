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

func ListPayouts(conn *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := conn.Query(context.Background(), `
			SELECT id, user_id, amount, status, method, created_at
			FROM payouts ORDER BY created_at DESC LIMIT 50
		`)
		if err != nil {
			c.JSON(http.StatusOK, []models.Payout{})
			return
		}
		defer rows.Close()

		var payouts []models.Payout
		for rows.Next() {
			var p models.Payout
			if err := rows.Scan(&p.ID, &p.UserID, &p.Amount, &p.Status, &p.Method, &p.CreatedAt); err != nil {
				continue
			}
			payouts = append(payouts, p)
		}

		c.JSON(http.StatusOK, payouts)
	}
}

func CreatePayout(conn *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payout models.Payout
		if err := c.ShouldBindJSON(&payout); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		payout.ID = uuid.NewString()
		payout.CreatedAt = time.Now().UTC()
		if payout.Status == "" {
			payout.Status = "pending"
		}

		_, err := conn.Exec(context.Background(), `
			INSERT INTO payouts (id, user_id, amount, status, method, created_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, payout.ID, payout.UserID, payout.Amount, payout.Status, payout.Method, payout.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "payout creation failed"})
			return
		}

		c.JSON(http.StatusCreated, payout)
	}
}
