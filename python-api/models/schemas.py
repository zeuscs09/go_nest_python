from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# User schemas
class UserBase(BaseModel):
    name: str
    email: str
    age: Optional[int] = None
    city: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    city: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Product schemas
class ProductBase(BaseModel):
    name: str
    price: Decimal
    category: Optional[str] = None
    stock: Optional[int] = 0
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Order schemas
class OrderBase(BaseModel):
    user_id: int
    total_amount: Decimal
    status: Optional[str] = "pending"

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: int
    order_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Complex query response schemas
class OrderWithUser(BaseModel):
    order_id: int
    user_id: int
    user_name: str
    user_email: str
    user_city: str
    total_amount: Decimal
    status: str
    order_date: datetime
    item_count: int

class UserOrderSummary(BaseModel):
    user_id: int
    user_name: str
    user_email: str
    total_orders: int
    total_amount: Decimal
    average_order: Decimal
    last_order: datetime

class AnalyticsData(BaseModel):
    category: str
    total_orders: int
    total_quantity: int
    total_revenue: Decimal
    avg_price: Decimal
    unique_customers: int
    avg_customer_age: float

class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    service: str 