from sqlalchemy.orm import Session
from sqlalchemy import text
from models.models import User
from models.schemas import UserCreate, UserUpdate
from typing import List, Optional

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_users(self, limit: int = 10, offset: int = 0) -> List[User]:
        return self.db.query(User).offset(offset).limit(limit).all()

    def get_user(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user_data: UserCreate) -> User:
        db_user = User(**user_data.dict())
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[User]:
        db_user = self.get_user(user_id)
        if not db_user:
            return None
        
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def delete_user(self, user_id: int) -> bool:
        db_user = self.get_user(user_id)
        if not db_user:
            return False
        
        self.db.delete(db_user)
        self.db.commit()
        return True

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