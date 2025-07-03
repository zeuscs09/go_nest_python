package main

import (
	"fmt"
	"log"
	"os"

	"golang-api/handlers"
	"golang-api/models"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	// Database connection
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "performance_test"
	}

	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "postgres"
	}

	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "password"
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	if err := models.InitDB(dsn); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Gin setup
	r := gin.Default()

	// Routes
	api := r.Group("/api/v1")
	{
		// Health check
		api.GET("/health", handlers.HealthCheck)

		// Users
		api.GET("/users", handlers.GetUsers)
		api.GET("/users/:id", handlers.GetUser)
		api.POST("/users", handlers.CreateUser)
		api.PUT("/users/:id", handlers.UpdateUser)
		api.DELETE("/users/:id", handlers.DeleteUser)

		// Products
		api.GET("/products", handlers.GetProducts)
		api.POST("/products", handlers.CreateProduct)

		// Orders
		api.GET("/orders", handlers.GetOrders)
		api.POST("/orders", handlers.CreateOrder)

		// Complex queries
		api.GET("/orders-with-users", handlers.GetOrdersWithUsers)
		api.GET("/user-order-summary", handlers.GetUserOrderSummary)
		api.GET("/analytics", handlers.GetComplexAnalytics)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}
