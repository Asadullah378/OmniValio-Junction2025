"""
Customer cart management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_customer

router = APIRouter(prefix="/customer/cart", tags=["customer-cart"])


@router.get("/", response_model=schemas.Cart)
def get_cart(
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get customer's cart"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    cart = db.query(models.Cart).filter(
        models.Cart.customer_id == current_user.customer_id
    ).first()
    
    if not cart:
        # Create cart if it doesn't exist
        cart = models.Cart(customer_id=current_user.customer_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    # Load items with products and substitutes
    items = []
    for item in cart.items:
        # Serialize product using Pydantic model
        product_dict = None
        if item.product:
            # Use Pydantic model to ensure proper serialization
            product_schema = schemas.Product.model_validate(item.product)
            product_dict = product_schema.model_dump()
        
        # Serialize substitutes
        substitutes_list = []
        for sub in item.substitutes:
            sub_dict = {
                "substitute_id": sub.substitute_id,
                "substitute_product_code": sub.substitute_product_code,
                "priority": sub.priority
            }
            if sub.substitute_product:
                sub_dict["substitute_product"] = {
                    "product_code": sub.substitute_product.product_code,
                    "product_name": sub.substitute_product.product_name,
                    "category": sub.substitute_product.category,
                    "price": sub.substitute_product.price
                }
            substitutes_list.append(sub_dict)
        
        item_dict = {
            "cart_item_id": item.cart_item_id,
            "product_code": item.product_code,
            "quantity": item.quantity,
            "risk_score": item.risk_score,
            "product": product_dict,
            "substitutes": substitutes_list,
            "created_at": item.created_at
        }
        items.append(item_dict)
    
    return {
        "cart_id": cart.cart_id,
        "customer_id": cart.customer_id,
        "items": items,
        "created_at": cart.created_at,
        "updated_at": cart.updated_at
    }


@router.post("/items")
def add_to_cart(
    item: schemas.CartItemCreate,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Add item to cart"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get or create cart
    cart = db.query(models.Cart).filter(
        models.Cart.customer_id == current_user.customer_id
    ).first()
    
    if not cart:
        cart = models.Cart(customer_id=current_user.customer_id)
        db.add(cart)
        db.flush()
    
    # Verify product exists
    product = db.query(models.Product).filter(
        models.Product.product_code == item.product_code
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if item already in cart
    existing_item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.cart_id,
        models.CartItem.product_code == item.product_code
    ).first()
    
    if existing_item:
        # Increment quantity instead of replacing
        existing_item.quantity += item.quantity
        cart_item = existing_item
        # Preserve existing substitutes - only add new ones if provided
        # If substitutes are provided in the request, they will replace old ones
    else:
        # Create new cart item
        cart_item = models.CartItem(
            cart_id=cart.cart_id,
            product_code=item.product_code,
            quantity=item.quantity
        )
        db.add(cart_item)
        db.flush()
    
    # Handle substitutes (max 2)
    if len(item.substitutes) > 2:
        raise HTTPException(status_code=400, detail="Maximum 2 substitutes allowed")
    
    # Only update substitutes if they are provided in the request
    # If item already exists and no substitutes provided, preserve existing ones
    if item.substitutes:
        # Remove old substitutes
        db.query(models.CartItemSubstitute).filter(
            models.CartItemSubstitute.cart_item_id == cart_item.cart_item_id
        ).delete()
        
        # Add new substitutes
        for sub in item.substitutes:
            if sub.priority not in [1, 2]:
                raise HTTPException(status_code=400, detail="Priority must be 1 or 2")
            
            # Verify substitute product exists
            sub_product = db.query(models.Product).filter(
                models.Product.product_code == sub.substitute_product_code
            ).first()
            if not sub_product:
                raise HTTPException(status_code=404, detail=f"Substitute product {sub.substitute_product_code} not found")
            
            db_substitute = models.CartItemSubstitute(
                cart_item_id=cart_item.cart_item_id,
                substitute_product_code=sub.substitute_product_code,
                priority=sub.priority
            )
            db.add(db_substitute)
    
    # Get risk score for the product
    # TODO: Replace with actual ML model call
    import random
    cart_item.risk_score = round(random.uniform(0.0, 1.0), 2)
    
    db.commit()
    db.refresh(cart_item)
    
    # Reload to get relationships
    db.refresh(cart_item)
    for sub in cart_item.substitutes:
        db.refresh(sub)
        if sub.substitute_product:
            db.refresh(sub.substitute_product)
    
    # Return properly serialized response
    # Serialize product using Pydantic model
    product_dict = None
    if cart_item.product:
        db.refresh(cart_item.product)
        # Use Pydantic model to ensure proper serialization
        product_schema = schemas.Product.model_validate(cart_item.product)
        product_dict = product_schema.model_dump()
    
    substitutes_list = []
    for sub in cart_item.substitutes:
        db.refresh(sub)
        sub_dict = {
            "substitute_id": sub.substitute_id,
            "substitute_product_code": sub.substitute_product_code,
            "priority": sub.priority
        }
        if sub.substitute_product:
            db.refresh(sub.substitute_product)
            sub_dict["substitute_product"] = {
                "product_code": sub.substitute_product.product_code,
                "product_name": sub.substitute_product.product_name,
                "category": sub.substitute_product.category,
                "price": sub.substitute_product.price
            }
        substitutes_list.append(sub_dict)
    
    return {
        "cart_item_id": cart_item.cart_item_id,
        "product_code": cart_item.product_code,
        "quantity": cart_item.quantity,
        "risk_score": cart_item.risk_score,
        "product": product_dict,
        "substitutes": substitutes_list,
        "created_at": cart_item.created_at
    }


@router.patch("/items/{cart_item_id}/quantity")
def update_cart_item_quantity(
    cart_item_id: int,
    quantity_update: schemas.CartItemQuantityUpdate,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Update cart item quantity"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if quantity_update.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    
    cart = db.query(models.Cart).filter(
        models.Cart.customer_id == current_user.customer_id
    ).first()
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart_item = db.query(models.CartItem).filter(
        models.CartItem.cart_item_id == cart_item_id,
        models.CartItem.cart_id == cart.cart_id
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    cart_item.quantity = quantity_update.quantity
    db.commit()
    db.refresh(cart_item)
    
    # Return updated item
    product_dict = None
    if cart_item.product:
        product_schema = schemas.Product.model_validate(cart_item.product)
        product_dict = product_schema.model_dump()
    
    substitutes_list = []
    for sub in cart_item.substitutes:
        sub_dict = {
            "substitute_id": sub.substitute_id,
            "substitute_product_code": sub.substitute_product_code,
            "priority": sub.priority
        }
        if sub.substitute_product:
            sub_dict["substitute_product"] = {
                "product_code": sub.substitute_product.product_code,
                "product_name": sub.substitute_product.product_name,
                "category": sub.substitute_product.category,
                "price": sub.substitute_product.price
            }
        substitutes_list.append(sub_dict)
    
    return {
        "cart_item_id": cart_item.cart_item_id,
        "product_code": cart_item.product_code,
        "quantity": cart_item.quantity,
        "risk_score": cart_item.risk_score,
        "product": product_dict,
        "substitutes": substitutes_list,
        "created_at": cart_item.created_at
    }


@router.delete("/items/{cart_item_id}", status_code=204)
def remove_from_cart(
    cart_item_id: int,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Remove item from cart"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    cart = db.query(models.Cart).filter(
        models.Cart.customer_id == current_user.customer_id
    ).first()
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart_item = db.query(models.CartItem).filter(
        models.CartItem.cart_item_id == cart_item_id,
        models.CartItem.cart_id == cart.cart_id
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    db.delete(cart_item)
    db.commit()
    return None


@router.delete("/", status_code=204)
def clear_cart(
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Clear entire cart"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    cart = db.query(models.Cart).filter(
        models.Cart.customer_id == current_user.customer_id
    ).first()
    
    if cart:
        # Delete items individually to trigger cascade delete of substitutes
        cart_items = db.query(models.CartItem).filter(
            models.CartItem.cart_id == cart.cart_id
        ).all()
        
        for cart_item in cart_items:
            db.delete(cart_item)  # This will cascade delete the substitutes
        
        db.commit()
    
    return None

