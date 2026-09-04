from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "customer"

class BookingCreate(BaseModel):
    vehicle_id: int
    start_date: str
    end_date: str    
    pickup_location: str

class ReviewCreate(BaseModel):
    booking_id: int
    rating: int
    comment: str    

class PricingQuoteRequest(BaseModel):
    vehicleId: int
    startDate: str
    endDate: str    