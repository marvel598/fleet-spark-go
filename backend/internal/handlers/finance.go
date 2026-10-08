package handlers

import (
	"math"
	"net/http"

	"fleet-spark/internal/models"

	"github.com/gin-gonic/gin"
)

func FinanceQuote(c *gin.Context) {
	var req models.FinanceQuoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	principal := req.Price - req.DownPayment
	if principal < 0 {
		principal = 0
	}

	monthlyRate := (req.APR / 100) / 12
	loanFactor := 0.0
	if monthlyRate > 0 {
		loanFactor = (monthlyRate * math.Pow(1+monthlyRate, float64(req.TermMonths))) / (math.Pow(1+monthlyRate, float64(req.TermMonths)) - 1)
	} else {
		loanFactor = 1 / float64(req.TermMonths)
	}

	monthlyInstallment := (principal * loanFactor) + req.Insurance + req.Processing
	totalPaid := monthlyInstallment * float64(req.TermMonths)
	totalInterest := totalPaid - principal
	if totalInterest < 0 {
		totalInterest = 0
	}

	response := models.FinanceQuoteResponse{
		MonthlyInstallment: monthlyInstallment,
		TotalFinanced:      principal,
		TotalInterest:      totalInterest,
		TotalCost:          totalPaid,
	}

	c.JSON(http.StatusOK, response)
}
