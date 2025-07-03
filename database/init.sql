-- Database Schema สำหรับ Performance Test
-- ใช้สำหรับเปรียบเทียบ Golang, NestJS, Python

-- สร้าง Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    age INTEGER,
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง Indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Insert sample data
-- Users
INSERT INTO users (name, email, age, city) VALUES 
('John Doe', 'john@example.com', 25, 'Bangkok'),
('Jane Smith', 'jane@example.com', 30, 'Chiang Mai'),
('Bob Johnson', 'bob@example.com', 35, 'Phuket'),
('Alice Brown', 'alice@example.com', 28, 'Pattaya'),
('Charlie Wilson', 'charlie@example.com', 32, 'Khon Kaen'),
('Diana Davis', 'diana@example.com', 27, 'Udon Thani'),
('Edward Miller', 'edward@example.com', 31, 'Nakhon Ratchasima'),
('Fiona Garcia', 'fiona@example.com', 29, 'Hat Yai'),
('George Rodriguez', 'george@example.com', 33, 'Rayong'),
('Hannah Martinez', 'hannah@example.com', 26, 'Hua Hin');

-- Products
INSERT INTO products (name, price, category, stock, description) VALUES 
('Laptop', 25000.00, 'electronics', 50, 'High-performance laptop'),
('Smartphone', 15000.00, 'electronics', 100, 'Latest smartphone'),
('Headphones', 2500.00, 'electronics', 200, 'Wireless headphones'),
('Book', 300.00, 'books', 500, 'Programming book'),
('Tablet', 12000.00, 'electronics', 75, 'Android tablet'),
('Mouse', 800.00, 'electronics', 300, 'Wireless mouse'),
('Keyboard', 1500.00, 'electronics', 150, 'Mechanical keyboard'),
('Monitor', 8000.00, 'electronics', 80, '24-inch monitor'),
('Webcam', 3000.00, 'electronics', 120, 'HD webcam'),
('Speakers', 4500.00, 'electronics', 90, 'Bluetooth speakers');

-- Orders
INSERT INTO orders (user_id, total_amount, status) VALUES 
(1, 27500.00, 'completed'),
(2, 15800.00, 'completed'),
(3, 12300.00, 'pending'),
(4, 8000.00, 'completed'),
(5, 3500.00, 'shipped'),
(6, 25000.00, 'completed'),
(7, 18000.00, 'pending'),
(8, 7000.00, 'completed'),
(9, 15000.00, 'shipped'),
(10, 5000.00, 'completed');

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES 
(1, 1, 1, 25000.00),
(1, 3, 1, 2500.00),
(2, 2, 1, 15000.00),
(2, 6, 1, 800.00),
(3, 5, 1, 12000.00),
(3, 4, 1, 300.00),
(4, 8, 1, 8000.00),
(5, 7, 1, 1500.00),
(5, 9, 1, 2000.00),
(6, 1, 1, 25000.00),
(7, 2, 1, 15000.00),
(7, 10, 1, 3000.00),
(8, 3, 2, 2500.00),
(8, 6, 2, 800.00),
(9, 2, 1, 15000.00),
(10, 10, 1, 4500.00),
(10, 4, 1, 500.00);

-- สร้าง function สำหรับ update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language plpgsql;

-- สร้าง triggers สำหรับ auto-update timestamp
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 