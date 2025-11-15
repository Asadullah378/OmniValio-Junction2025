"""
Admin customer management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.database import get_db
from app import models, schemas
from app.auth import get_current_admin, get_password_hash

router = APIRouter(prefix="/admin/customers", tags=["admin-customers"])


@router.post("/", response_model=schemas.Customer)
def create_customer(
    customer: schemas.CustomerCreate,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new customer"""
    # Check if customer already exists
    db_customer = db.query(models.Customer).filter(
        models.Customer.customer_id == customer.customer_id
    ).first()
    if db_customer:
        raise HTTPException(status_code=400, detail="Customer ID already exists")
    
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.post("/{customer_id}/user", response_model=schemas.User)
def create_customer_user(
    customer_id: str,
    username: str,
    email: str,
    password: str,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create user account for a customer"""
    # Verify customer exists
    customer = db.query(models.Customer).filter(
        models.Customer.customer_id == customer_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        (models.User.username == username) | (models.User.email == email)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    user_id = f"USER-{uuid.uuid4().hex[:8].upper()}"
    user = models.User(
        user_id=user_id,
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        role=models.UserRole.CUSTOMER,
        customer_id=customer_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=List[schemas.Customer])
def get_customers(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all customers"""
    customers = db.query(models.Customer).offset(skip).limit(limit).all()
    return customers


@router.get("/{customer_id}", response_model=schemas.Customer)
def get_customer(
    customer_id: str,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get specific customer"""
    customer = db.query(models.Customer).filter(
        models.Customer.customer_id == customer_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return customer

