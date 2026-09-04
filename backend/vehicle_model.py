from sqlalchemy import Column, Integer, String, Numeric, Enum, TIMESTAMP
from sqlalchemy.sql import func

from database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, nullable=False)
    brand = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    vehicle_type = Column(String(50), nullable=False)
    registration_number = Column(String(50), unique=True, nullable=False)
    price_per_day = Column(Numeric(10, 2), nullable=False)
    fuel_type = Column(String(30))
    transmission = Column(String(30))
    seats = Column(Integer)
    location = Column(String(150))

    # ImageKit image URL
    image_url = Column(String(500), nullable=True)

    status = Column(
        Enum("available", "booked", "maintenance", "unavailable"),
        default="available"
    )

    created_at = Column(TIMESTAMP, server_default=func.now())