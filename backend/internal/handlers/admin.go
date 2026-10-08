package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func AdminDashboard(conn *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var userCount int
		var vehicleCount int
		var payoutTotal float64

		if err := conn.QueryRow(context.Background(), `SELECT COUNT(*) FROM users`).Scan(&userCount); err != nil {
			userCount = 0
		}
		if err := conn.QueryRow(context.Background(), `SELECT COUNT(*) FROM vehicles`).Scan(&vehicleCount); err != nil {
			vehicleCount = 0
		}
		if err := conn.QueryRow(context.Background(), `SELECT COALESCE(SUM(amount), 0) FROM payouts WHERE status = 'paid'`).Scan(&payoutTotal); err != nil {
			payoutTotal = 0
		}

		c.JSON(http.StatusOK, gin.H{
			"users":        userCount,
			"vehicles":     vehicleCount,
			"payout_total": payoutTotal,
			"status":       "ok",
		})
	}
}
