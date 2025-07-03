from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_orders_with_users(self, limit: int = 10, offset: int = 0):
        query = text("""
            SELECT o.id as order_id, o.user_id, u.name as user_name, u.email as user_email, 
                   u.city as user_city, o.total_amount, o.status, o.order_date,
                   COUNT(oi.id) as item_count
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id, o.user_id, u.name, u.email, u.city, o.total_amount, o.status, o.order_date
            ORDER BY o.id
            LIMIT :limit OFFSET :offset
        """)
        
        result = self.db.execute(query, {"limit": limit, "offset": offset})
        return result.fetchall()

    def get_user_order_summary(self, limit: int = 10, offset: int = 0):
        query = text("""
            SELECT u.id as user_id, u.name as user_name, u.email as user_email, 
                   COUNT(o.id) as total_orders,
                   COALESCE(SUM(o.total_amount), 0) as total_amount,
                   COALESCE(AVG(o.total_amount), 0) as average_order,
                   COALESCE(MAX(o.order_date), '1970-01-01'::timestamp) as last_order
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            GROUP BY u.id, u.name, u.email
            ORDER BY total_amount DESC
            LIMIT :limit OFFSET :offset
        """)
        
        result = self.db.execute(query, {"limit": limit, "offset": offset})
        return result.fetchall()

    def get_complex_analytics(self):
        query = text("""
            SELECT 
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
            ORDER BY total_revenue DESC
        """)
        
        result = self.db.execute(query)
        return result.fetchall() 