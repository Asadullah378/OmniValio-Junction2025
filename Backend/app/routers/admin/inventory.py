"""
Admin inventory management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.auth import get_current_admin

router = APIRouter(prefix="/admin/inventory", tags=["admin-inventory"])


@router.get("/", response_model=schemas.PaginatedResponse[schemas.Inventory])
def get_inventory(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all inventory items with pagination
    
    - **skip**: Number of items to skip (for pagination)
    - **limit**: Maximum number of items to return (default: 20)
    - **search**: Search by product code or product name
    """
    # Build base query with product relationship
    query = db.query(models.Inventory).options(
        joinedload(models.Inventory.product)
    )
    
    # Apply search filter if provided
    if search:
        search_term = f"%{search}%"
        query = query.join(models.Product).filter(
            (models.Inventory.product_code.ilike(search_term)) |
            (models.Product.product_name.ilike(search_term)) |
            (models.Product.product_name_en.ilike(search_term)) |
            (models.Product.product_name_fi.ilike(search_term))
        )
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    inventory_items = query.order_by(models.Inventory.product_code).offset(skip).limit(limit).all()
    
    # Calculate if there are more items
    has_more = (skip + limit) < total
    
    return schemas.PaginatedResponse(
        items=inventory_items,
        total=total,
        skip=skip,
        limit=limit,
        has_more=has_more
    )


@router.get("/{product_code}", response_model=schemas.Inventory)
def get_inventory_item(
    product_code: str,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get inventory for specific product"""
    inventory = db.query(models.Inventory).filter(
        models.Inventory.product_code == product_code
    ).first()
    
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    return inventory


@router.put("/{product_code}", response_model=schemas.Inventory)
def update_inventory(
    product_code: str,
    inventory_update: schemas.InventoryUpdate,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update inventory quantity"""
    # Verify product exists
    product = db.query(models.Product).filter(
        models.Product.product_code == product_code
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    inventory = db.query(models.Inventory).filter(
        models.Inventory.product_code == product_code
    ).first()
    
    if not inventory:
        # Create inventory if it doesn't exist
        inventory = models.Inventory(
            product_code=product_code,
            quantity=inventory_update.quantity,
            available_quantity=inventory_update.quantity,
            updated_by=current_user.user_id
        )
        db.add(inventory)
    else:
        inventory.quantity = inventory_update.quantity
        inventory.available_quantity = inventory_update.quantity - inventory.reserved_quantity
        inventory.updated_by = current_user.user_id
    
    db.commit()
    db.refresh(inventory)
    return inventory


@router.delete("/{product_code}", status_code=204)
def remove_product_from_inventory(
    product_code: str,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Remove product from inventory (set quantity to 0)"""
    inventory = db.query(models.Inventory).filter(
        models.Inventory.product_code == product_code
    ).first()
    
    if inventory:
        inventory.quantity = 0
        inventory.available_quantity = 0
        inventory.updated_by = current_user.user_id
        db.commit()
    
    return None

