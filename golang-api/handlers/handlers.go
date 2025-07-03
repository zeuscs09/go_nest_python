package handlers

import (
    "database/sql"
    "net/http"
    "strconv"
    "time"
    
    "golang-api/models"
    "github.com/gin-gonic/gin"
)

// User handlers
func GetUsers(c *gin.Context) {
    limit := c.DefaultQuery("limit", "10")
    offset := c.DefaultQuery("offset", "0")
    
    query := `SELECT id, name, email, age, city, created_at, updated_at 
              FROM users ORDER BY id LIMIT $1 OFFSET $2`
    
    rows, err := models.DB.Query(query, limit, offset)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()
    
    var users []models.User
    for rows.Next() {
        var user models.User
        err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Age, &user.City, &user.CreatedAt, &user.UpdatedAt)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        users = append(users, user)
    }
    
    c.JSON(http.StatusOK, users)
}

func GetUser(c *gin.Context) {
    id := c.Param("id")
    
    query := `SELECT id, name, email, age, city, created_at, updated_at 
              FROM users WHERE id = $1`
    
    var user models.User
    err := models.DB.QueryRow(query, id).Scan(&user.ID, &user.Name, &user.Email, &user.Age, &user.City, &user.CreatedAt, &user.UpdatedAt)
    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, user)
}

func CreateUser(c *gin.Context) {
    var user models.User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    query := `INSERT INTO users (name, email, age, city) 
              VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at`
    
    err := models.DB.QueryRow(query, user.Name, user.Email, user.Age, user.City).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, user)
}

func UpdateUser(c *gin.Context) {
    id := c.Param("id")
    var user models.User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    query := `UPDATE users SET name = $1, email = $2, age = $3, city = $4, updated_at = CURRENT_TIMESTAMP 
              WHERE id = $5 RETURNING updated_at`
    
    err := models.DB.QueryRow(query, user.Name, user.Email, user.Age, user.City, id).Scan(&user.UpdatedAt)
    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    user.ID, _ = strconv.Atoi(id)
    c.JSON(http.StatusOK, user)
}

func DeleteUser(c *gin.Context) {
    id := c.Param("id")
    
    query := `DELETE FROM users WHERE id = $1`
    
    result, err := models.DB.Exec(query, id)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// Complex query handlers
func GetOrdersWithUsers(c *gin.Context) {
    limit := c.DefaultQuery("limit", "10")
    offset := c.DefaultQuery("offset", "0")
    
    query := `SELECT o.id, o.user_id, u.name, u.email, u.city, o.total_amount, o.status, o.order_date,
              COUNT(oi.id) as item_count
              FROM orders o
              JOIN users u ON o.user_id = u.id
              LEFT JOIN order_items oi ON o.id = oi.order_id
              GROUP BY o.id, o.user_id, u.name, u.email, u.city, o.total_amount, o.status, o.order_date
              ORDER BY o.id LIMIT $1 OFFSET $2`
    
    rows, err := models.DB.Query(query, limit, offset)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()
    
    var orders []models.OrderWithUser
    for rows.Next() {
        var order models.OrderWithUser
        err := rows.Scan(&order.OrderID, &order.UserID, &order.UserName, &order.UserEmail, &order.UserCity, &order.TotalAmount, &order.Status, &order.OrderDate, &order.ItemCount)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        orders = append(orders, order)
    }
    
    c.JSON(http.StatusOK, orders)
}

func GetUserOrderSummary(c *gin.Context) {
    limit := c.DefaultQuery("limit", "10")
    offset := c.DefaultQuery("offset", "0")
    
    query := `SELECT u.id, u.name, u.email, 
              COUNT(o.id) as total_orders,
              COALESCE(SUM(o.total_amount), 0) as total_amount,
              COALESCE(AVG(o.total_amount), 0) as average_order,
              COALESCE(MAX(o.order_date), '1970-01-01'::timestamp) as last_order
              FROM users u
              LEFT JOIN orders o ON u.id = o.user_id
              GROUP BY u.id, u.name, u.email
              ORDER BY total_amount DESC
              LIMIT $1 OFFSET $2`
    
    rows, err := models.DB.Query(query, limit, offset)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()
    
    var summaries []models.UserOrderSummary
    for rows.Next() {
        var summary models.UserOrderSummary
        err := rows.Scan(&summary.UserID, &summary.UserName, &summary.UserEmail, &summary.TotalOrders, &summary.TotalAmount, &summary.AverageOrder, &summary.LastOrder)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        summaries = append(summaries, summary)
    }
    
    c.JSON(http.StatusOK, summaries)
}

func GetComplexAnalytics(c *gin.Context) {
    query := `SELECT 
              p.category,
              COUNT(DISTINCT o.id) as total_orders,
              SUM(oi.quantity) as total_quantity,
              SUM(oi.price * oi.quantity) as total_revenue,
              AVG(oi.price) as avg_price,
              COUNT(DISTINCT u.id) as unique_customers,
              AVG(u.age) as avg_customer_age
              FROM products p
              JOIN order_items oi ON p.id = oi.product_id
              JOIN orders o ON oi.order_id = o.id
              JOIN users u ON o.user_id = u.id
              WHERE o.status = 'completed'
              GROUP BY p.category
              ORDER BY total_revenue DESC`
    
    rows, err := models.DB.Query(query)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()
    
    var analytics []map[string]interface{}
    for rows.Next() {
        var category string
        var totalOrders, totalQuantity, uniqueCustomers int
        var totalRevenue, avgPrice, avgCustomerAge float64
        
        err := rows.Scan(&category, &totalOrders, &totalQuantity, &totalRevenue, &avgPrice, &uniqueCustomers, &avgCustomerAge)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        
        analytics = append(analytics, map[string]interface{}{
            "category": category,
            "total_orders": totalOrders,
            "total_quantity": totalQuantity,
            "total_revenue": totalRevenue,
            "avg_price": avgPrice,
            "unique_customers": uniqueCustomers,
            "avg_customer_age": avgCustomerAge,
        })
    }
    
    c.JSON(http.StatusOK, analytics)
}

func GetProducts(c *gin.Context) {
    limit := c.DefaultQuery("limit", "10")
    offset := c.DefaultQuery("offset", "0")
    category := c.Query("category")
    
    var query string
    var args []interface{}
    
    if category != "" {
        query = `SELECT id, name, price, category, stock, description, created_at, updated_at 
                 FROM products WHERE category = $1 ORDER BY id LIMIT $2 OFFSET $3`
        args = append(args, category, limit, offset)
    } else {
        query = `SELECT id, name, price, category, stock, description, created_at, updated_at 
                 FROM products ORDER BY id LIMIT $1 OFFSET $2`
        args = append(args, limit, offset)
    }
    
    rows, err := models.DB.Query(query, args...)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()
    
    var products []models.Product
    for rows.Next() {
        var product models.Product
        err := rows.Scan(&product.ID, &product.Name, &product.Price, &product.Category, &product.Stock, &product.Description, &product.CreatedAt, &product.UpdatedAt)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        products = append(products, product)
    }
    
    c.JSON(http.StatusOK, products)
}

func CreateProduct(c *gin.Context) {
    var product models.Product
    if err := c.ShouldBindJSON(&product); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    query := `INSERT INTO products (name, price, category, stock, description) 
              VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at, updated_at`
    
    err := models.DB.QueryRow(query, product.Name, product.Price, product.Category, product.Stock, product.Description).Scan(&product.ID, &product.CreatedAt, &product.UpdatedAt)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, product)
}

func GetOrders(c *gin.Context) {
    limit := c.DefaultQuery("limit", "10")
    offset := c.DefaultQuery("offset", "0")
    status := c.Query("status")
    
    var query string
    var args []interface{}
    
    if status != "" {
        query = `SELECT id, user_id, total_amount, status, order_date, created_at, updated_at 
                 FROM orders WHERE status = $1 ORDER BY id LIMIT $2 OFFSET $3`
        args = append(args, status, limit, offset)
    } else {
        query = `SELECT id, user_id, total_amount, status, order_date, created_at, updated_at 
                 FROM orders ORDER BY id LIMIT $1 OFFSET $2`
        args = append(args, limit, offset)
    }
    
    rows, err := models.DB.Query(query, args...)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()
    
    var orders []models.Order
    for rows.Next() {
        var order models.Order
        err := rows.Scan(&order.ID, &order.UserID, &order.TotalAmount, &order.Status, &order.OrderDate, &order.CreatedAt, &order.UpdatedAt)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        orders = append(orders, order)
    }
    
    c.JSON(http.StatusOK, orders)
}

func CreateOrder(c *gin.Context) {
    var order models.Order
    if err := c.ShouldBindJSON(&order); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    query := `INSERT INTO orders (user_id, total_amount, status) 
              VALUES ($1, $2, $3) RETURNING id, order_date, created_at, updated_at`
    
    err := models.DB.QueryRow(query, order.UserID, order.TotalAmount, order.Status).Scan(&order.ID, &order.OrderDate, &order.CreatedAt, &order.UpdatedAt)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, order)
}

func HealthCheck(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "status": "healthy",
        "timestamp": time.Now(),
        "service": "golang-api",
    })
}
