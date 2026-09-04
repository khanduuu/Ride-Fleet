from pydantic import BaseModel
from typing import Optional


class VehicleCreate(BaseModel):
    brand: str
    model: str
    vehicle_type: str
    registration_number: str
    price_per_day: float
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    seats: Optional[int] = None
    location: Optional[str] = None
    image_url: Optional[str] = None