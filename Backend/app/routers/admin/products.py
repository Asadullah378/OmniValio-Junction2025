"""
Admin product management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
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
        quantity=0,
        available_quantity=0,
        updated_by=current_user.user_id
    )
    db.add(inventory)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/", response_model=schemas.PaginatedResponse[schemas.Product])
def get_products(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    search: Optional[str] = None,
    temperature_zone: Optional[str] = None,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all products with pagination and filters
    
    - **skip**: Number of items to skip (for pagination)
    - **limit**: Maximum number of items to return (default: 20)
    - **category**: Filter by category name
    - **sub_category**: Filter by subcategory name
    - **search**: Search in product names, codes, and GTIN
    - **temperature_zone**: Filter by temperature zone (frozen, chilled, ambient)
    """
    # Build base query
    query = db.query(models.Product)
    
    # Apply filters
    if category:
        query = query.filter(models.Product.category == category)
    
    if sub_category:
        query = query.filter(models.Product.sub_category == sub_category)
    
    if temperature_zone:
        query = query.filter(models.Product.temperature_zone == temperature_zone)
    
    if search:
        search_term = f"%{search}%"
        # Build search conditions
        search_conditions = [
            models.Product.product_name.ilike(search_term),
            models.Product.product_name_en.ilike(search_term),
            models.Product.product_name_fi.ilike(search_term),
            models.Product.product_code.ilike(search_term),
            models.Product.gtin.ilike(search_term),
        ]
        # Add ingredients search if not None
        search_conditions.append(
            models.Product.ingredients.ilike(search_term)
        )
        query = query.filter(or_(*search_conditions))
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    products = query.order_by(models.Product.product_name).offset(skip).limit(limit).all()
    
    # Calculate if there are more items
    has_more = (skip + limit) < total
    
    return schemas.PaginatedResponse(
        items=products,
        total=total,
        skip=skip,
        limit=limit,
        has_more=has_more
    )


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

