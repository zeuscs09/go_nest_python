from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from models.database import get_db
from models.schemas import OrderWithUser, UserOrderSummary, AnalyticsData, HealthCheck
from services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/orders-with-users")
async def get_orders_with_users(limit: int = 10, offset: int = 0, db: Session = Depends(get_db)):
    analytics_service = AnalyticsService(db)
    results = analytics_service.get_orders_with_users(limit=limit, offset=offset)
    
    # Convert results to dict format
    return [
        {
            "order_id": row.order_id,
            "user_id": row.user_id,
            "user_name": row.user_name,
            "user_email": row.user_email,
            "user_city": row.user_city,
            "total_amount": row.total_amount,
            "status": row.status,
            "order_date": row.order_date,
            "item_count": row.item_count
        }
        for row in results
    ]

@router.get("/user-order-summary")
async def get_user_order_summary(limit: int = 10, offset: int = 0, db: Session = Depends(get_db)):
    analytics_service = AnalyticsService(db)
    results = analytics_service.get_user_order_summary(limit=limit, offset=offset)
    
    # Convert results to dict format
    return [
        {
            "user_id": row.user_id,
            "user_name": row.user_name,
            "user_email": row.user_email,
            "total_orders": row.total_orders,
            "total_amount": row.total_amount,
            "average_order": row.average_order,
            "last_order": row.last_order
        }
        for row in results
    ]

@router.get("/analytics")
async def get_complex_analytics(db: Session = Depends(get_db)):
    analytics_service = AnalyticsService(db)
    results = analytics_service.get_complex_analytics()
    
    # Convert results to dict format
    return [
        {
            "category": row.category,
            "total_orders": row.total_orders,
            "total_quantity": row.total_quantity,
            "total_revenue": row.total_revenue,
            "avg_price": row.avg_price,
            "unique_customers": row.unique_customers,
            "avg_customer_age": row.avg_customer_age
        }
        for row in results
    ]

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "service": "python-api"
    } 