"""
Customer product browsing endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth import get_current_customer

router = APIRouter(prefix="/customer/products", tags=["customer-products"])


@router.get("/", response_model=List[schemas.Product])
def browse_products(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Browse products with optional filters"""
    query = db.query(models.Product)
    
    if category:
        query = query.filter(models.Product.category == category)
    
    if search:
        query = query.filter(
            models.Product.product_name.contains(search) |
            models.Product.product_code.contains(search)
        )
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/{product_code}", response_model=schemas.Product)
def get_product(
    product_code: str,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get product details"""
    product = db.query(models.Product).filter(
        models.Product.product_code == product_code
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@router.get("/{product_code}/risk")
def get_product_risk(
    product_code: str,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get product risk evaluation (0-1 range)"""
    product = db.query(models.Product).filter(
        models.Product.product_code == product_code
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Dummy risk calculation - replace with actual ML model later
    # Risk score should be 0-1 range
    # Categories: safe (0-0.2), low (0.2-0.4), medium (0.4-0.6), high (0.6-0.8), very high (0.8-1.0)
    import random
    risk_score = round(random.uniform(0.0, 1.0), 2)  # Placeholder - will be replaced with ML model
    
    # Ensure it's in 0-1 range
    risk_score = max(0.0, min(1.0, risk_score))
    
    return {
        "risk_score": risk_score
    }


@router.get("/{product_code}/similar", response_model=List[schemas.Product])
def get_similar_products(
    product_code: str,
    limit: int = 10,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get similar products (dummy endpoint - will use AI later)"""
    product = db.query(models.Product).filter(
        models.Product.product_code == product_code
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Dummy similarity - same category and temperature zone
    # Replace with AI-based similarity later
    similar = db.query(models.Product).filter(
        models.Product.product_code != product_code,
        models.Product.category == product.category,
        models.Product.temperature_zone == product.temperature_zone
    ).limit(limit).all()
    
    return similar

