"""
Product management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/", response_model=schemas.Product, status_code=201)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    """Create a new product"""
    db_product = db.query(models.Product).filter(
        models.Product.product_code == product.product_code
    ).first()
    if db_product:
        raise HTTPException(status_code=400, detail="Product code already exists")
    
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/", response_model=List[schemas.Product])
def get_products(
    skip: int = 0, 
    limit: int = 100, 
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all products with optional category filter"""
    query = db.query(models.Product)
    if category:
        query = query.filter(models.Product.category == category)
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/{product_code}", response_model=schemas.Product)
def get_product(product_code: str, db: Session = Depends(get_db)):
    """Get a specific product by code"""
    product = db.query(models.Product).filter(
        models.Product.product_code == product_code
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/{product_code}/substitutes", response_model=List[schemas.Product])
def get_substitute_products(
    product_code: str,
    db: Session = Depends(get_db)
):
    """Get potential substitute products (simplified - can be enhanced with ML)"""
    product = db.query(models.Product).filter(
        models.Product.product_code == product_code
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Simple substitution logic: same category and temperature zone
    substitutes = db.query(models.Product).filter(
        models.Product.product_code != product_code,
        models.Product.category == product.category,
        models.Product.temperature_zone == product.temperature_zone
    ).limit(10).all()
    
    return substitutes

