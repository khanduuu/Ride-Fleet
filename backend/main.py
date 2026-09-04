from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Security,
)
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import SessionLocal
from models import User, Booking, Payment , Maintenance, Favorite, Review
from schemas import UserCreate, BookingCreate,  ReviewCreate
from jose import jwt
from vehicle_model import Vehicle
from vehicle_schema import VehicleCreate
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, func
from fastapi import Query
from typing import List, Optional
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from imagekitio import ImageKit

load_dotenv()

imagekit = ImageKit(
    private_key=os.getenv("IMAGEKIT_PRIVATE_KEY")
)
SECRET_KEY = "ridefleet-secret-key"
ALGORITHM = "HS256"

import razorpay
import os
from dotenv import load_dotenv

load_dotenv()

razorpay_client = razorpay.Client(
    auth=(
        os.getenv("RAZORPAY_KEY_ID"),
        os.getenv("RAZORPAY_KEY_SECRET")
    )
)

security = HTTPBearer()

app = FastAPI(title="RideFleet API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        return payload

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )        


@app.get("/")
def home():
    return {"message": "RideFleet API is running"}


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    # Don't allow public admin registration
    if user.role not in ["customer", "vendor"]:
        raise HTTPException(
            status_code=403,
            detail="Admin registration is not allowed"
        )

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = pwd_context.hash(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        status="active"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.id
    }
    
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return payload
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


def require_role(required_role: str):
            def role_checker(
                current_user: dict = Depends(get_current_user)
            ):
                if current_user.get("role") != required_role:
                    raise HTTPException(
                         status_code=403,
                         detail="Access denied"
            )
                return current_user

            return role_checker    


@app.post("/login")
def login(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    print("LOGIN EMAIL:", email)
    print("LOGIN PASSWORD:", password)

    user = db.query(User).filter(
        User.email == email.strip()
    ).first()

    if not user:
        print("USER NOT FOUND")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    print("USER FOUND:", user.id, user.email)
    print("USER ROLE:", user.role)
    print("USER STATUS:", user.status)

    password_correct = pwd_context.verify(
        password,
        user.password_hash
    )

    print("PASSWORD CORRECT:", password_correct)

    if not password_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = jwt.encode(
        {
            "user_id": user.id,
            "role": user.role,
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
    }
    
@app.get("/platform/overview")
def platform_overview(db: Session = Depends(get_db)):

    total_vehicles = db.query(Vehicle).count()

    active_bookings = db.query(Booking).filter(
        Booking.status == "confirmed",
        Booking.start_date <= date.today(),
        Booking.end_date >= date.today()
    ).count()

    revenue = (
    db.query(func.sum(Payment.amount))
    .join(Booking, Payment.booking_id == Booking.id)
    .filter(
        Payment.payment_status == "completed",
        Booking.status != "cancelled"
    )
    .scalar() or 0
    )

    return {
        "totalVehicles": total_vehicles,
        "activeBookings": active_bookings,
        "revenue": float(revenue),
        "currency": "INR"
    }
    
@app.post("/vehicles")
def add_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    new_vehicle = Vehicle(
        vendor_id=current_user["user_id"],
        brand=vehicle.brand,
        model=vehicle.model,
        vehicle_type=vehicle.vehicle_type,
        registration_number=vehicle.registration_number,
        price_per_day=vehicle.price_per_day,
        fuel_type=vehicle.fuel_type,
        transmission=vehicle.transmission,
        seats=vehicle.seats,
        location=vehicle.location,

        # ImageKit URL
        image_url=vehicle.image_url
    )

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    return {
        "message": "Vehicle added successfully",
        "vehicle_id": new_vehicle.id,
        "image_url": new_vehicle.image_url
    }
    

@app.get("/vehicles")
def get_vehicles(
    db: Session = Depends(get_db),

    types: Optional[List[str]] = Query(None),
    fuels: Optional[List[str]] = Query(None),
    transmissions: Optional[List[str]] = Query(None),
    seats: Optional[List[int]] = Query(None),

    minPrice: float = 500,
    maxPrice: float = 10000,

    location: Optional[str] = None,

    sort: str = "recommended",

    page: int = 1,
    pageSize: int = 6,
):
    query = db.query(Vehicle)

    # Vehicle type filter
    if types:
        query = query.filter(
            Vehicle.vehicle_type.in_(types)
        )

    # Fuel filter
    if fuels:
        query = query.filter(
            Vehicle.fuel_type.in_(fuels)
        )

    # Transmission filter
    if transmissions:
        query = query.filter(
            Vehicle.transmission.in_(transmissions)
        )

    # Price filter
    query = query.filter(
        Vehicle.price_per_day >= minPrice,
        Vehicle.price_per_day <= maxPrice
    )

    # Location filter
    if location and location.strip():
        query = query.filter(
            Vehicle.location.ilike(f"%{location.strip()}%")
        )

    # Seats filter
    if seats:
        from sqlalchemy import or_

        seat_conditions = []

        for seat in seats:
            if seat == 7:
                seat_conditions.append(Vehicle.seats >= 7)
            else:
                seat_conditions.append(Vehicle.seats == seat)

        query = query.filter(or_(*seat_conditions))

    # Sorting
    if sort == "price_asc":
        query = query.order_by(Vehicle.price_per_day.asc())

    elif sort == "price_desc":
        query = query.order_by(Vehicle.price_per_day.desc())

    else:
        # Recommended
        query = query.order_by(Vehicle.id.desc())

    # Total before pagination
    total = query.count()

    # Pagination
    offset = (page - 1) * pageSize

    vehicles = query.offset(offset).limit(pageSize).all()

    items = []

    for vehicle in vehicles:

        vendor = db.query(User).filter(
            User.id == vehicle.vendor_id,
            User.role == "vendor"
        ).first()

        items.append({
            "id": str(vehicle.id),
            "name": f"{vehicle.brand} {vehicle.model}",
            "type": vehicle.vehicle_type,
            "pricePerDay": float(vehicle.price_per_day),
            "currency": "INR",
            "rating": 0,
            "reviewCount": 0,
            "location": vehicle.location or "",
            "availability": vehicle.status,
            "maintenanceStatus": "good",
            "imageUrl": vehicle.image_url or "",
            "gallery": (
                [vehicle.image_url]
                if vehicle.image_url
                else []
            ),
            "description": "",
            "features": [],

            "specs": {
                "seats": vehicle.seats or 0,
                "doors": 4,
                "fuel": vehicle.fuel_type or "Petrol",
                "transmission": vehicle.transmission or "Manual",
                "rangeKm": 0,
                "luggage": 0,
                "year": 2025
            },

            "vendor": {
                "id": str(vehicle.vendor_id),
                "name": vendor.name if vendor else "Unknown Vendor",
                "rating": 0,
                "tripsCompleted": 0,
                "memberSince": "",
                "responseTimeMinutes": 0,
                "verified": False
            }
        })

    total_pages = (
        (total + pageSize - 1) // pageSize
        if pageSize > 0
        else 1
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "totalPages": total_pages
    }

@app.get("/vendor/vehicles")
def get_vendor_vehicles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    vehicles = db.query(Vehicle).filter(
        Vehicle.vendor_id == current_user["user_id"]
    ).all()

    return [
        {
            "id": str(vehicle.id),
            "name": f"{vehicle.brand} {vehicle.model}",
            "type": vehicle.vehicle_type,
            "pricePerDay": float(vehicle.price_per_day),
            "currency": "INR",
            "rating": 0,
            "reviewCount": 0,
            "location": vehicle.location or "",
            "availability": vehicle.status,
            "maintenanceStatus": "good",
            "imageUrl": vehicle.image_url or "",
            "gallery": [],
            "description": "",
            "features": [],
            "specs": {
                "seats": vehicle.seats or 0,
                "doors": 4,
                "fuel": vehicle.fuel_type or "Petrol",
                "transmission": vehicle.transmission or "Manual",
                "rangeKm": 0,
                "luggage": 0,
                "year": 2025
            },
            "vendor": {
                "id": str(vehicle.vendor_id),
                "name": "Vendor",
                "rating": 0,
                "tripsCompleted": 0,
                "memberSince": "",
                "responseTimeMinutes": 0,
                "verified": False
            }
        }
        for vehicle in vehicles
    ]    
    
from datetime import date
from sqlalchemy import func


@app.get("/vendor/overview")
def vendor_overview(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    vendor_id = current_user["user_id"]

    # --------------------------------
    # Vendor's vehicles
    # --------------------------------
    vehicles = (
        db.query(Vehicle)
        .filter(Vehicle.vendor_id == vendor_id)
        .all()
    )

    vehicle_ids = [vehicle.id for vehicle in vehicles]

    total_vehicles = len(vehicle_ids)

    # --------------------------------
    # Vendor's bookings
    # --------------------------------
    bookings = []

    if vehicle_ids:
        bookings = (
            db.query(Booking)
            .filter(Booking.vehicle_id.in_(vehicle_ids))
            .all()
        )

    # --------------------------------
    # Active bookings
    # --------------------------------
    active_bookings = sum(
        1
        for booking in bookings
        if booking.status == "confirmed"
        and booking.start_date <= date.today()
        and booking.end_date > date.today()
    )

    # --------------------------------
    # Upcoming bookings
    # --------------------------------
    upcoming_bookings = sum(
        1
        for booking in bookings
        if booking.status in ["pending", "confirmed"]
        and booking.start_date > date.today()
    )

    # --------------------------------
    # Paid payments only
    # --------------------------------
    paid_payments = []

    for booking in bookings:

        payment = (
            db.query(Payment)
            .filter(Payment.booking_id == booking.id)
            .first()
        )

        if (
            payment
            and payment.payment_status == "completed"
            and booking.status != "cancelled"
        ):
            paid_payments.append(payment)

    # --------------------------------
    # Gross revenue
    # --------------------------------
    revenue = sum(
        float(payment.amount or 0)
        for payment in paid_payments
    )

    # --------------------------------
    # Revenue by month
    # --------------------------------
    monthly_revenue = {}

    for payment in paid_payments:

        booking = (
            db.query(Booking)
            .filter(Booking.id == payment.booking_id)
            .first()
        )

        if not booking or not booking.start_date:
            continue

        month_key = booking.start_date.strftime("%Y-%m")

        monthly_revenue[month_key] = (
            monthly_revenue.get(month_key, 0)
            + float(payment.amount or 0)
        )

    revenue_series = [
        {
            "label": month,
            "value": amount,
        }
        for month, amount in sorted(monthly_revenue.items())
    ]

    # --------------------------------
    # Vehicle utilisation
    # --------------------------------
    utilisation_series = []

    for vehicle in vehicles:

        vehicle_booking_count = sum(
            1
            for booking in bookings
            if booking.vehicle_id == vehicle.id
            and booking.status != "cancelled"
        )

        utilisation_series.append({
            "label": f"{vehicle.brand} {vehicle.model}",
            "value": vehicle_booking_count,
        })

    # --------------------------------
    # Response
    # --------------------------------
    return {
        "totalVehicles": total_vehicles,
        "activeBookings": active_bookings,
        "upcomingBookings": upcoming_bookings,
        "revenue": revenue,
        "currency": "INR",
        "revenueSeries": revenue_series,
        "utilisationSeries": utilisation_series,
    }
    
@app.get("/vendor/bookings")
def get_vendor_bookings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    # Get all vehicles owned by this vendor
    vehicles = db.query(Vehicle).filter(
        Vehicle.vendor_id == current_user["user_id"]
    ).all()

    vehicle_ids = [vehicle.id for vehicle in vehicles]

    if not vehicle_ids:
        return []

    # Get bookings for those vehicles
    bookings = db.query(Booking).filter(
        Booking.vehicle_id.in_(vehicle_ids)
    ).order_by(
        Booking.created_at.desc()
    ).all()

    result = []

    for booking in bookings:

        vehicle = db.query(Vehicle).filter(
            Vehicle.id == booking.vehicle_id
        ).first()

        customer = db.query(User).filter(
            User.id == booking.user_id
        ).first()

        payment = db.query(Payment).filter(
            Payment.booking_id == booking.id
        ).first()

        result.append({
            "id": str(booking.id),
            "reference": f"RF-{booking.id:06d}",

            "vehicleId": str(booking.vehicle_id),

            "vehicleName": (
                f"{vehicle.brand} {vehicle.model}"
                if vehicle else "Unknown Vehicle"
            ),

            # Real ImageKit image
            "vehicleImage": (
                vehicle.image_url
                if vehicle and vehicle.image_url
                else ""
            ),

            "customerName": (
                customer.name
                if customer else "Unknown Customer"
            ),

            "vendorName": (
                current_user.get("name", "Vendor")
            ),

            # Actual pickup selected during booking
            "pickupLocation": booking.pickup_location or "",

            "startDate": booking.start_date.isoformat(),
            "endDate": booking.end_date.isoformat(),

            "status": booking.status,

            # Real payment status
            "paymentStatus": (
                "paid"
                if payment and payment.payment_status == "completed"
                else payment.payment_status
                if payment
                else "pending"
            ),

            "total": float(booking.total_amount),
            "currency": "INR"
        })

    return result

@app.get("/platform/maintenance")
def platform_maintenance(db: Session = Depends(get_db)):
    records = db.query(Maintenance).order_by(
        Maintenance.maintenance_date.desc()
    ).all()

    result = []

    for record in records:
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == record.vehicle_id
        ).first()

        result.append({
            "id": str(record.id),
            "vehicleName": (
                f"{vehicle.brand} {vehicle.model}"
                if vehicle
                else "Unknown Vehicle"
            ),
            "maintenanceType": record.maintenance_type,
            "description": record.description,
            "maintenanceDate": record.maintenance_date.isoformat(),
            "cost": float(record.cost or 0),
            "status": record.status,
        })

    return result

@app.get("/vendor/maintenance")
def get_vendor_maintenance(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    # Get vehicles owned by this vendor
    vehicles = db.query(Vehicle).filter(
        Vehicle.vendor_id == current_user["user_id"]
    ).all()

    vehicle_ids = [vehicle.id for vehicle in vehicles]

    if not vehicle_ids:
        return []

    # Get maintenance records for vendor's vehicles
    records = db.query(Maintenance).filter(
        Maintenance.vehicle_id.in_(vehicle_ids)
    ).order_by(
        Maintenance.maintenance_date.desc()
    ).all()

    result = []

    for record in records:
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == record.vehicle_id
        ).first()

        result.append({
            "id": str(record.id),
            "vehicleId": str(record.vehicle_id),

            "vehicleName": (
                f"{vehicle.brand} {vehicle.model}"
                if vehicle else "Unknown Vehicle"
            ),

            "maintenanceType": record.maintenance_type,
            "description": record.description or "",

            "maintenanceDate": (
                record.maintenance_date.isoformat()
                if record.maintenance_date
                else ""
            ),

            "cost": float(record.cost or 0),

            "status": record.status
        })

    return result

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    maintenance_type: str
    description: str | None = None
    maintenance_date: str
    cost: float = 0
    status: str = "scheduled"


@app.post("/vendor/maintenance")
def create_vendor_maintenance(
    data: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    # Check that the vehicle belongs to this vendor
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == data.vehicle_id,
        Vehicle.vendor_id == current_user["user_id"]
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this vehicle"
        )

    # Validate status
    if data.status not in ["scheduled", "in_progress", "completed"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid maintenance status"
        )

    from datetime import date

    try:
        maintenance_date = date.fromisoformat(data.maintenance_date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid maintenance date"
        )

    record = Maintenance(
        vehicle_id=data.vehicle_id,
        maintenance_type=data.maintenance_type,
        description=data.description,
        maintenance_date=maintenance_date,
        cost=data.cost,
        status=data.status
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": str(record.id),
        "vehicleId": str(record.vehicle_id),
        "vehicleName": f"{vehicle.brand} {vehicle.model}",
        "maintenanceType": record.maintenance_type,
        "description": record.description or "",
        "maintenanceDate": record.maintenance_date.isoformat(),
        "cost": float(record.cost or 0),
        "status": record.status,
        "message": "Maintenance record created successfully"
    }
    
@app.put("/vendor/maintenance/{maintenance_id}/complete")
def complete_vendor_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    record = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    # Make sure this maintenance belongs to this vendor
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == record.vehicle_id,
        Vehicle.vendor_id == current_user["user_id"]
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this maintenance record"
        )

    record.status = "completed"

    db.commit()
    db.refresh(record)

    return {
        "id": str(record.id),
        "status": record.status,
        "message": "Maintenance marked as completed"
    }
    
@app.get("/vendor/earnings")
def get_vendor_earnings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    vendor_id = current_user["user_id"]

    # Get vendor's vehicles
    vehicles = db.query(Vehicle).filter(
        Vehicle.vendor_id == vendor_id
    ).all()

    vehicle_ids = [vehicle.id for vehicle in vehicles]

    if not vehicle_ids:
        return []

    # Get all bookings for vendor's vehicles
    bookings = db.query(Booking).filter(
        Booking.vehicle_id.in_(vehicle_ids)
    ).order_by(
        Booking.created_at.desc()
    ).all()

    result = []

    for booking in bookings:

        # Get payment for this booking
        payment = db.query(Payment).filter(
            Payment.booking_id == booking.id
        ).first()

        # Skip bookings without a payment record
        if not payment:
            continue

        # Get customer
        customer = db.query(User).filter(
            User.id == booking.user_id
        ).first()

        # Convert backend payment status to frontend status
        if payment.payment_status == "completed":
            frontend_status = "paid"
        elif payment.payment_status == "refunded":
            frontend_status = "refunded"
        elif payment.payment_status == "failed":
            frontend_status = "failed"
        else:
            frontend_status = "pending"

        result.append({
            "id": str(payment.id),

            "bookingRef": f"RF-{booking.id:06d}",

            "payer": (
                customer.name
                if customer
                else "Unknown Customer"
            ),

            "method": (
                payment.payment_method
                if payment.payment_method
                else "—"
            ),

            "amount": float(payment.amount or 0),

            "currency": "INR",

            "status": frontend_status,

            "date": (
                payment.created_at.isoformat()
                if payment.created_at
                else ""
            )
        })

    return result
        
@app.get("/vehicles/{vehicle_id}")
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return {
        "id": str(vehicle.id),
        "name": f"{vehicle.brand} {vehicle.model}",
        "type": vehicle.vehicle_type,
        "pricePerDay": float(vehicle.price_per_day),
        "currency": "INR",
        "rating": 0,
        "reviewCount": 0,
        "location": vehicle.location or "",
        "availability": vehicle.status,
        "maintenanceStatus": "good",
        "imageUrl": vehicle.image_url or "",
        "gallery": [vehicle.image_url] if vehicle.image_url else [],
        "description": "",
        "features": [],
        "specs": {
            "seats": vehicle.seats or 0,
            "doors": 4,
            "fuel": vehicle.fuel_type or "Petrol",
            "transmission": vehicle.transmission or "Manual",
            "rangeKm": 0,
            "luggage": 0,
            "year": 2025
        },
        "vendor": {
            "id": str(vehicle.vendor_id),
            "name": "Vendor",
            "rating": 0,
            "tripsCompleted": 0,
            "memberSince": "",
            "responseTimeMinutes": 0,
            "verified": False
        }
    }
        
@app.put("/vehicles/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    existing_vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not existing_vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    if existing_vehicle.vendor_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own vehicles"
        )

    existing_vehicle.brand = vehicle.brand
    existing_vehicle.model = vehicle.model
    existing_vehicle.vehicle_type = vehicle.vehicle_type
    existing_vehicle.price_per_day = vehicle.price_per_day
    existing_vehicle.fuel_type = vehicle.fuel_type
    existing_vehicle.transmission = vehicle.transmission
    existing_vehicle.seats = vehicle.seats
    existing_vehicle.location = vehicle.location

    db.commit()
    db.refresh(existing_vehicle)

    return {
        "message": "Vehicle updated successfully",
        "vehicle_id": existing_vehicle.id
    }   
@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    if vehicle.vendor_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You can only remove your own vehicles"
        )

    db.delete(vehicle)
    db.commit()

    return {
        "message": "Vehicle removed successfully"
    }    
  
@app.post("/bookings")
def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == booking.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    if vehicle.status != "available":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is not available"
        )

    from datetime import date

    start_date = date.fromisoformat(booking.start_date)
    end_date = date.fromisoformat(booking.end_date)

    if end_date <= start_date:
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date"
        )
    # Check for overlapping bookings
    existing_booking = db.query(Booking).filter(
        Booking.vehicle_id == booking.vehicle_id,
        Booking.status.in_(["pending", "confirmed"]),
        Booking.start_date < end_date,
        Booking.end_date > start_date
    ).first()

    if existing_booking:
        raise HTTPException(
            status_code=400,
            detail="Vehicle is already booked for the selected dates"
        )
    days = (end_date - start_date).days
    total_amount = days * float(vehicle.price_per_day)

    # Create booking
    new_booking = Booking(
    user_id=current_user["user_id"],
    vehicle_id=vehicle.id,
    start_date=start_date,
    end_date=end_date,
    total_amount=total_amount,
    pickup_location=booking.pickup_location
)
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    # Create payment record
    new_payment = Payment(
        booking_id=new_booking.id,
        amount=total_amount,
        payment_method=None,
        payment_status="pending",
        transaction_id=None
    )

    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    return {
    "id": str(new_booking.id),
    "reference": f"RF-{new_booking.id:06d}",
    "vehicleId": str(vehicle.id),
    "vehicleName": f"{vehicle.brand} {vehicle.model}",
    "vehicleImage": "",
    "customerName": "",
    "vendorName": "Vendor",
    "pickupLocation": vehicle.location or "",
    "startDate": str(new_booking.start_date),
    "endDate": str(new_booking.end_date),
    "status": "upcoming",
    "paymentStatus": "pending",
    "total": float(new_booking.total_amount),
    "currency": "INR",
} 

@app.get("/bookings")
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    bookings = db.query(Booking).filter(
        Booking.user_id == current_user["user_id"]
    ).all()

    result = []

    for booking in bookings:
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == booking.vehicle_id
        ).first()

        if not vehicle:
            continue

        if booking.status == "completed":
            frontend_status = "completed"
        elif booking.status == "cancelled":
            frontend_status = "cancelled"
        elif booking.status == "confirmed":
            frontend_status = "confirmed"
        else:
            frontend_status = "upcoming"

        vendor = db.query(User).filter(
            User.id == vehicle.vendor_id,
            User.role == "vendor"
        ).first()
        payment = db.query(Payment).filter(
        Payment.booking_id == booking.id
        ).first()

        result.append({
            "id": str(booking.id),
            "reference": f"RF-{booking.id:06d}",
            "vehicleId": str(vehicle.id),
            "vehicleName": f"{vehicle.brand} {vehicle.model}",

            # Vehicle image from ImageKit
            "vehicleImage": vehicle.image_url or "",

            "customerName": "",
            "vendorName": vendor.name if vendor else "Vendor",

            # Selected pickup location from booking
            "pickupLocation": booking.pickup_location or "",

            "startDate": str(booking.start_date),
            "endDate": str(booking.end_date),
            "status": frontend_status,
            "paymentStatus": (
    "paid"
    if payment and payment.payment_status == "completed"
    else payment.payment_status if payment else "pending"
),
            "total": float(booking.total_amount),
            "currency": "INR"
        })

    return result

@app.put("/bookings/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user["user_id"]
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Booking is already cancelled"
        )

    if booking.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Completed bookings cannot be cancelled"
        )

    payment = db.query(Payment).filter(
        Payment.booking_id == booking.id
    ).first()

    refund_id = None

    # Refund if payment was completed
    if payment and payment.payment_status == "completed":
        if not payment.transaction_id:
            raise HTTPException(
                status_code=400,
                detail="Payment ID not found. Refund cannot be processed."
            )

        try:

            refund = razorpay_client.payment.refund(
            payment.transaction_id
            )

            refund_id = refund["id"]
            payment.payment_status = "refunded"

        except Exception as e:

            raise HTTPException(
                status_code=400,
                detail=f"Refund failed: {str(e)}"
            )

    booking.status = "cancelled"

    db.commit()
    db.refresh(booking)

    return {
        "message": "Booking cancelled successfully",
        "booking_id": booking.id,
        "booking_status": booking.status,
        "payment_status": (
            payment.payment_status
            if payment
            else "pending"
        ),
        "refund_id": refund_id
    }

from collections import defaultdict
from datetime import date, datetime

class CreateOrderRequest(BaseModel):
    booking_id: int


@app.post("/payments/create-order")
def create_payment_order(
    data: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == data.booking_id,
        Booking.user_id == current_user["user_id"]
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cannot pay for a cancelled booking"
        )

    amount_paise = int(float(booking.total_amount) * 100)

    razorpay_order = razorpay_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"RF-{booking.id:06d}",
    })

    return {
        "order_id": razorpay_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": os.getenv("RAZORPAY_KEY_ID"),
        "booking_id": booking.id,
    }

class VerifyPaymentRequest(BaseModel):
    booking_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@app.post("/payments/verify")
def verify_payment(
    data: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == data.booking_id,
        Booking.user_id == current_user["user_id"]
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature,
        })
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Payment verification failed"
        )

    payment = db.query(Payment).filter(
        Payment.booking_id == booking.id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment record not found"
        )

    payment.payment_status = "completed"
    payment.payment_method = "razorpay"
    payment.transaction_id = data.razorpay_payment_id

    booking.status = "confirmed"

    db.commit()

    return {
        "message": "Payment verified successfully",
        "booking_id": booking.id,
        "payment_status": "completed",
        "booking_status": "confirmed"
    }    

@app.get("/me/overview")
def get_customer_overview(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    customer = db.query(User).filter(
        User.id == user_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Get customer's bookings
    bookings = db.query(Booking).filter(
        Booking.user_id == user_id
    ).all()

    upcoming = []
    previous = []
    active_rental = None

    total_spend = 0

    for booking in bookings:

        vehicle = db.query(Vehicle).filter(
            Vehicle.id == booking.vehicle_id
        ).first()

        if not vehicle:
            continue

        booking_data = {
            "id": str(booking.id),
            "reference": f"RF-{booking.id:06d}",
            "vehicleId": str(vehicle.id),
            "vehicleName": f"{vehicle.brand} {vehicle.model}",
            "vehicleImage": "",
            "customerName": "",
            "vendorName": "Vendor",
            "pickupLocation": vehicle.location or "",
            "startDate": str(booking.start_date),
            "endDate": str(booking.end_date),
            "status": booking.status,
            "paymentStatus": "pending",
            "total": float(booking.total_amount),
            "currency": "INR"
        }

        # Total spending
        if booking.status != "cancelled":
            total_spend += float(booking.total_amount)

        # Categorize booking
        if booking.status == "active":
            active_rental = booking_data

        elif booking.status in ["upcoming", "pending", "confirmed"]:
            upcoming.append(booking_data)

        elif booking.status in ["completed", "cancelled"]:
            previous.append(booking_data)

    return {
    "userName": customer.name,
    "activeRental": active_rental,
    "upcoming": upcoming,
    "previous": previous,
    "favouritesCount": 0,
    "totalSpend": total_spend,
    "currency": "INR"
}
@app.get("/admin/overview")
def admin_overview(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    # -----------------------------
    # Basic counts
    # -----------------------------
    total_users = db.query(User).count()

    total_vendors = db.query(User).filter(
        User.role == "vendor"
    ).count()

    total_vehicles = db.query(Vehicle).count()

    total_bookings = db.query(Booking).count()

    active_rentals = db.query(Booking).filter(
        Booking.status == "active"
    ).count()

    # -----------------------------
    # Total revenue
    # -----------------------------
    total_revenue = db.query(
        func.sum(Booking.total_amount)
    ).scalar() or 0

    # -----------------------------
    # Revenue by month
    # -----------------------------
    bookings = db.query(Booking).all()

    monthly_revenue = defaultdict(float)

    for booking in bookings:
        if not booking.start_date:
            continue

        booking_date = booking.start_date

        # In case the database returns datetime
        if isinstance(booking_date, datetime):
            month_key = booking_date.strftime("%Y-%m")
            month_label = booking_date.strftime("%b %Y")
        else:
            month_key = booking_date.strftime("%Y-%m")
            month_label = booking_date.strftime("%b %Y")

        monthly_revenue[month_key] += float(
            booking.total_amount or 0
        )

    revenue_series = [
        {
            "label": month_key,
            "value": amount,
        }
        for month_key, amount in sorted(monthly_revenue.items())
    ]

    # -----------------------------
    # Bookings by vehicle category
    # -----------------------------
    vehicles = db.query(Vehicle).all()

    vehicle_type_map = {
        str(vehicle.id): vehicle.vehicle_type
        for vehicle in vehicles
    }

    category_counts = defaultdict(int)

    for booking in bookings:
        vehicle_type = vehicle_type_map.get(
            str(booking.vehicle_id),
            "Other"
        )

        category_counts[vehicle_type] += 1

    bookings_by_category = [
        {
            "label": category,
            "value": count,
        }
        for category, count in sorted(category_counts.items())
    ]

    # -----------------------------
    # Final response
    # -----------------------------
    return {
        "totalUsers": total_users,
        "totalVendors": total_vendors,
        "totalVehicles": total_vehicles,
        "activeRentals": active_rentals,
        "totalBookings": total_bookings,
        "revenue": float(total_revenue),
        "currency": "INR",
        "revenueSeries": revenue_series,
        "bookingsByCategory": bookings_by_category,
    }
    
@app.get("/admin/users")
def admin_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    users = db.query(User).all()

    result = []

    for user in users:
        booking_count = db.query(Booking).filter(
            Booking.user_id == user.id
        ).count()

        result.append({
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "joinedAt": (
                user.created_at.isoformat()
                if user.created_at
                else ""
            ),
            "bookings": booking_count,
        })

    return result 

@app.put("/admin/users/{user_id}/status")
def update_user_status(
    user_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if status not in ["active", "pending", "suspended"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    user.status = status

    db.commit()
    db.refresh(user)

    return {
        "message": "User status updated",
        "id": str(user.id),
        "status": user.status
    }
    

@app.get("/admin/vehicles")
def admin_vehicles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    vehicles = db.query(Vehicle).all()

    return [
        {
            "id": str(vehicle.id),
            "name": f"{vehicle.brand} {vehicle.model}",
            "type": vehicle.vehicle_type,
            "pricePerDay": float(vehicle.price_per_day),
            "currency": "INR",
            "location": vehicle.location or "",
            "availability": vehicle.status,
            "vendorId": str(vehicle.vendor_id),
        }
        for vehicle in vehicles
    ]

@app.get("/admin/bookings")
def admin_bookings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    bookings = db.query(Booking).all()

    return [
        {
            "id": str(booking.id),
            "vehicleId": str(booking.vehicle_id),
            "userId": str(booking.user_id),
            "startDate": str(booking.start_date),
            "endDate": str(booking.end_date),
            "totalAmount": float(booking.total_amount),
            "status": booking.status,
        }
        for booking in bookings
    ]        

@app.get("/admin/vendors")
def admin_vendors(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    vendors = db.query(User).filter(
        User.role == "vendor"
    ).all()

    return [
        {
            "id": str(vendor.id),
            "name": vendor.name,
            "email": vendor.email,
            "role": vendor.role,
            "createdAt": (
                vendor.created_at.isoformat()
                if vendor.created_at else ""
            ),

            # Number of vehicles owned by this vendor
            "vehicleCount": (
                db.query(Vehicle)
                .filter(Vehicle.vendor_id == vendor.id)
                .count()
            ),

            # Temporary values until these features are implemented
            "rating": 0,
            "tripsCompleted": 0,
            "memberSince": (
                vendor.created_at.isoformat()
                if vendor.created_at else ""
            ),
            "responseTimeMinutes": 0,
            "verified": False,
            "city": vendor.city,
            "status": vendor.status,
        }
        for vendor in vendors
    ]

@app.get("/admin/payments")
def admin_payments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    payments = db.query(Payment).all()

    return [
        {
            "id": str(payment.id),
            "bookingId": str(payment.booking_id),
            "amount": float(payment.amount),
            "paymentMethod": payment.payment_method or "",
            "paymentStatus": (
    "paid"
    if payment.payment_status == "completed"
    else payment.payment_status or "pending"
),
            "transactionId": payment.transaction_id or "",
            "createdAt": (
                payment.created_at.isoformat()
                if payment.created_at else ""
            ),
        }
        for payment in payments
    ]    

@app.get("/admin/maintenance")
def admin_maintenance(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    records = db.query(Maintenance).all()

    return [
        {
            "id": str(record.id),
            "vehicleId": str(record.vehicle_id),
            "maintenanceType": record.maintenance_type,
            "description": record.description or "",
            "maintenanceDate": record.maintenance_date.isoformat(),
            "cost": float(record.cost or 0),
            "status": record.status,
        }
        for record in records
    ]    

@app.get("/me/favourites")
def get_my_favourites(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    favourites = db.query(Favorite).filter(
        Favorite.user_id == user_id
    ).all()

    result = []

    for favourite in favourites:
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == favourite.vehicle_id
        ).first()

        if not vehicle:
            continue

        vendor = db.query(User).filter(
            User.id == vehicle.vendor_id,
            User.role == "vendor"
        ).first()

        result.append({
            "id": str(vehicle.id),
            "name": f"{vehicle.brand} {vehicle.model}",
            "type": vehicle.vehicle_type,
            "pricePerDay": float(vehicle.price_per_day),
            "currency": "INR",
            "rating": 0,
            "reviewCount": 0,
            "location": vehicle.location or "",
            "availability": vehicle.status,
            "maintenanceStatus": "good",
            "imageUrl": vehicle.image_url or "",
            "gallery": [vehicle.image_url] if vehicle.image_url else [],
            "description": "",
            "features": [],

            "specs": {
                "seats": vehicle.seats or 0,
                "doors": 4,
                "fuel": vehicle.fuel_type or "Petrol",
                "transmission": vehicle.transmission or "Manual",
                "rangeKm": 0,
                "luggage": 0,
                "year": 2025
            },

            "vendor": {
                "id": str(vehicle.vendor_id),
                "name": vendor.name if vendor else "Unknown Vendor",
                "rating": 0,
                "tripsCompleted": 0,
                "memberSince": "",
                "responseTimeMinutes": 0,
                "verified": False
            }
        })

    return result

@app.post("/me/favourites/{vehicle_id}")
def add_favourite(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    existing = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.vehicle_id == vehicle_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already in favourites"
        )

    favourite = Favorite(
        user_id=user_id,
        vehicle_id=vehicle_id
    )

    db.add(favourite)
    db.commit()
    db.refresh(favourite)

    return {
        "message": "Vehicle added to favourites",
        "vehicle_id": vehicle_id
    }

@app.delete("/me/favourites/{vehicle_id}")
def remove_favourite(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    favourite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.vehicle_id == vehicle_id
    ).first()

    if not favourite:
        raise HTTPException(
            status_code=404,
            detail="Vehicle is not in favourites"
        )

    db.delete(favourite)
    db.commit()

    return {
        
        "message": "Vehicle removed from favourites",
        "vehicle_id": vehicle_id
    }        
    
@app.get("/me/payments")
def get_my_payments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    payments = (
        db.query(Payment)
        .join(Booking, Payment.booking_id == Booking.id)
        .filter(Booking.user_id == user_id)
        .all()
    )

    result = []

    for payment in payments:
        booking = db.query(Booking).filter(
            Booking.id == payment.booking_id
        ).first()

        result.append({
            "id": str(payment.id),
            "bookingRef": f"RF-{payment.booking_id:06d}",
            "date": str(payment.created_at),
            "method": payment.payment_method or "Not selected",
            "status": payment.payment_status,
            "amount": float(payment.amount),
            "currency": "INR"
        })

    return result    

@app.get("/me/reviews")
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    reviews = db.query(Review).filter(
        Review.user_id == user_id
    ).all()

    result = []

    for review in reviews:
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == review.vehicle_id
        ).first()

        result.append({
            "id": str(review.id),
            "vehicleName": (
                f"{vehicle.brand} {vehicle.model}"
                if vehicle
                else "Vehicle"
            ),
            "rating": review.rating,
            "comment": review.comment or "",
            "date": str(review.created_at),
        })

    return result

@app.post("/reviews")
def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    # Check booking belongs to logged-in customer
    booking = db.query(Booking).filter(
        Booking.id == review.booking_id,
        Booking.user_id == user_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    # Review only after completed trip
    if booking.status != "completed":
        raise HTTPException(
            status_code=400,
            detail="You can review only completed bookings"
        )

    # Validate rating
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5"
        )

    # Prevent duplicate review
    existing = db.query(Review).filter(
        Review.user_id == user_id,
        Review.vehicle_id == booking.vehicle_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this vehicle"
        )

    new_review = Review(
        user_id=user_id,
        vehicle_id=booking.vehicle_id,
        rating=review.rating,
        comment=review.comment
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return {
        "message": "Review submitted successfully",
        "review_id": new_review.id
    }

@app.get("/imagekit/auth")
def imagekit_auth(
    current_user: dict = Depends(get_current_user)
):
    auth_params = imagekit.helper.get_authentication_parameters()

    return {
        "token": auth_params["token"],
        "expire": auth_params["expire"],
        "signature": auth_params["signature"],
        "publicKey": os.getenv("IMAGEKIT_PUBLIC_KEY"),
    }

class PricingQuoteRequest(BaseModel):
    vehicleId: int
    startDate: str
    endDate: str
    
@app.post("/pricing/quote")
def pricing_quote(
    data: PricingQuoteRequest,
    db: Session = Depends(get_db)
):
    from datetime import date

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == data.vehicleId
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    start = date.fromisoformat(data.startDate)
    end = date.fromisoformat(data.endDate)

    if end <= start:
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date"
        )

    days = (end - start).days
    total = days * float(vehicle.price_per_day)

    return {
    "currency": "INR",
    "basePrice": total,
    "demandAdjustment": 0,
    "discount": 0,
    "taxesAndFees": 0,
    "finalPrice": total,
    "demandLabel": "Demand adjustment",
    "discountLabel": "Discount",
}

@app.get("/vehicles/{vehicle_id}/reviews")
def get_vehicle_reviews(
    vehicle_id: int,
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(
        Review.vehicle_id == vehicle_id
    ).all()

    return [
        {
            "id": review.id,
            "userId": review.user_id,
            "vehicleId": review.vehicle_id,
            "rating": review.rating,
            "comment": review.comment,
            "createdAt": review.created_at
        }
        for review in reviews
    ]    

@app.get("/platform/reviews")
def get_platform_reviews(db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .order_by(Review.created_at.desc())
        .limit(6)
        .all()
    )

    result = []

    for review in reviews:
        user = db.query(User).filter(User.id == review.user_id).first()
        vehicle = db.query(Vehicle).filter(Vehicle.id == review.vehicle_id).first()

        result.append({
            "id": str(review.id),
            "author": user.name if user else "Customer",
            "rating": review.rating,
            "date": review.created_at.isoformat() if review.created_at else "",
            "comment": review.comment or "",
            "vehicleName": (
                f"{vehicle.brand} {vehicle.model}"
                if vehicle else None
            ),
        })

    return result        

@app.put("/vendor/bookings/{booking_id}/approve")
def approve_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == booking.vehicle_id,
        Vehicle.vendor_id == current_user["user_id"]
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=403,
            detail="You do not own this vehicle"
        )

    if booking.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending bookings can be approved"
        )

    booking.status = "confirmed"

    db.commit()
    db.refresh(booking)

    return {
        "message": "Booking approved successfully",
        "booking_id": booking.id,
        "status": booking.status
    }

@app.put("/vendor/bookings/{booking_id}/decline")
def decline_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("vendor"))
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == booking.vehicle_id,
        Vehicle.vendor_id == current_user["user_id"]
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=403,
            detail="You do not own this vehicle"
        )

    if booking.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending bookings can be declined"
        )

    booking.status = "cancelled"

    db.commit()
    db.refresh(booking)

    return {
        "message": "Booking declined successfully",
        "booking_id": booking.id,
        "status": booking.status
    }        