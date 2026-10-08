package models

import "time"

// User represents an application user.
type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Vehicle represents a listed vehicle in the marketplace.
type Vehicle struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Status      string    `json:"status"`
	OwnerID     string    `json:"owner_id"`
	CreatedAt   time.Time `json:"created_at"`
}

// FinanceQuoteRequest represents an amortized finance request.
type FinanceQuoteRequest struct {
	Price        float64 `json:"price" binding:"required,min=1"`
	DownPayment  float64 `json:"down_payment"`
	TermMonths   int     `json:"term_months" binding:"required,min=1"`
	APR         float64 `json:"apr" binding:"required,min=0"`
	Insurance   float64 `json:"insurance"`
	Processing  float64 `json:"processing"`
}

// FinanceQuoteResponse represents a finance estimate.
type FinanceQuoteResponse struct {
	MonthlyInstallment float64 `json:"monthly_installment"`
	TotalFinanced      float64 `json:"total_financed"`
	TotalInterest      float64 `json:"total_interest"`
	TotalCost          float64 `json:"total_cost"`
}

// Payout represents a payout record.
type Payout struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Amount    float64   `json:"amount"`
	Status    string    `json:"status"`
	Method    string    `json:"method"`
	CreatedAt time.Time `json:"created_at"`
}
