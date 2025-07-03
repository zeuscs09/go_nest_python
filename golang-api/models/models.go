package models

import (
	"database/sql"
	"time"
)

// User model
type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Age       int       `json:"age"`
	City      string    `json:"city"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Product model
type Product struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Price       float64   `json:"price"`
	Category    string    `json:"category"`
	Stock       int       `json:"stock"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Order model
type Order struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	TotalAmount float64   `json:"total_amount"`
	Status      string    `json:"status"`
	OrderDate   time.Time `json:"order_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// OrderItem model
type OrderItem struct {
	ID        int       `json:"id"`
	OrderID   int       `json:"order_id"`
	ProductID int       `json:"product_id"`
	Quantity  int       `json:"quantity"`
	Price     float64   `json:"price"`
	CreatedAt time.Time `json:"created_at"`
}

// OrderWithUser complex query result
type OrderWithUser struct {
	OrderID     int       `json:"order_id"`
	UserID      int       `json:"user_id"`
	UserName    string    `json:"user_name"`
	UserEmail   string    `json:"user_email"`
	UserCity    string    `json:"user_city"`
	TotalAmount float64   `json:"total_amount"`
	Status      string    `json:"status"`
	OrderDate   time.Time `json:"order_date"`
	ItemCount   int       `json:"item_count"`
}

// UserOrderSummary for complex aggregation
type UserOrderSummary struct {
	UserID       int       `json:"user_id"`
	UserName     string    `json:"user_name"`
	UserEmail    string    `json:"user_email"`
	TotalOrders  int       `json:"total_orders"`
	TotalAmount  float64   `json:"total_amount"`
	AverageOrder float64   `json:"average_order"`
	LastOrder    time.Time `json:"last_order"`
}

// Database connection
var DB *sql.DB

// Initialize database connection
func InitDB(dataSourceName string) error {
	var err error
	DB, err = sql.Open("postgres", dataSourceName)
	if err != nil {
		return err
	}

	if err = DB.Ping(); err != nil {
		return err
	}

	return nil
}
