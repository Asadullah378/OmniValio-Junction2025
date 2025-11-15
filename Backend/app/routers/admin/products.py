"""
Admin product management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_admin

router = APIRouter(prefix="/admin/products", tags=["admin-products"])


@router.post("/", response_model=schemas.Product)
def create_product(
    product: schemas.ProductCreate,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new product"""
    db_product = db.query(models.Product).filter(
        models.Product.product_code == product.product_code
    ).first()
    if db_product:
        raise HTTPException(status_code=400, detail="Product code already exists")
    
    db_product = models.Product(**product.dict())
    db.add(db_product)
    
    # Create inventory entry
    inventory = models.Inventory(
        product_code=product.product_code,
        quantity=0.0,
        available_quantity=0.0,
        updated_by=current_user.user_id
    )
    db.add(inventory)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/", response_model=List[schemas.Product])
def get_products(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all products"""
    products = db.query(models.Product).offset(skip).limit(limit).all()
    return products


@router.put("/{product_code}", response_model=schemas.Product)
def update_product(
    product_code: str,
    product_update: schemas.ProductBase,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update product"""
    db_product = db.query(models.Product).filter(
        models.Product.product_code == product_code
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_code}", status_code=204)
def delete_product(
    product_code: str,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete product"""
    db_product = db.query(models.Product).filter(
        models.Product.product_code == product_code
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return None

