from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, Date, Text ,Numeric,DECIMAL
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    role = Column(
        Enum("customer", "vendor", "admin"),
        default="customer"
    )

    status = Column(
        Enum("active", "pending", "suspended"),
        default="active",
        nullable=False
    )

    city = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    vehicle_id = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(
        Enum("pending", "confirmed", "cancelled", "completed"),
        default="pending"
    )
    pickup_location = Column(String(150), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())    

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    payment_method = Column(String(50), nullable=True)
    payment_status = Column(
        Enum("pending", "completed", "failed", "refunded"),
        default="pending"
    )
    transaction_id = Column(String(100), nullable=True)
    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )    

class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, nullable=False)
    maintenance_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    maintenance_date = Column(Date, nullable=False)
    cost = Column(DECIMAL(10, 2), default=0.00)
    status = Column(
        Enum("scheduled", "in_progress", "completed"),
        default="scheduled"
    )    
    
class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    vehicle_id = Column(Integer, nullable=False)
    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )    
        
class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False)
    vehicle_id = Column(Integer, nullable=False)

    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )        
        