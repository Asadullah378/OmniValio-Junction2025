"""
Customer order management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import uuid
from datetime import datetime, date, time
from app.database import get_db
from app import models, schemas
from app.auth import get_current_customer

router = APIRouter(prefix="/customer/orders", tags=["customer-orders"])


@router.post("/", response_model=schemas.Order)
def place_order(
    order_data: schemas.OrderPlaceFromCart,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Place order from cart"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get cart
    cart = db.query(models.Cart).filter(
        models.Cart.customer_id == current_user.customer_id
    ).first()
    
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Validate delivery date - cannot be same day as order placement
    try:
        delivery_date = datetime.strptime(order_data.delivery_date, "%Y-%m-%d").date()
        today = date.today()
        
        if delivery_date <= today:
            raise HTTPException(
                status_code=400,
                detail="Delivery date must be at least one day after order placement"
            )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid delivery_date format. Use YYYY-MM-DD"
        )
    
    # Validate delivery window if provided
    if order_data.delivery_window_start and order_data.delivery_window_end:
        try:
            start_time = datetime.strptime(order_data.delivery_window_start, "%H:%M").time()
            end_time = datetime.strptime(order_data.delivery_window_end, "%H:%M").time()
            
            if start_time >= end_time:
                raise HTTPException(
                    status_code=400,
                    detail="Delivery window start time must be less than end time"
                )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid time format. Use HH:MM"
            )
    
    # Generate order ID
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    
    # Create order with status PLACED
    db_order = models.Order(
        order_id=order_id,
        customer_id=current_user.customer_id,
        delivery_date=order_data.delivery_date,
        delivery_window_start=order_data.delivery_window_start,
        delivery_window_end=order_data.delivery_window_end,
        channel="web",
        status=models.OrderStatus.PLACED
    )
    db.add(db_order)
    db.flush()
    
    # Create order lines from cart items
    total_amount = 0.0
    for cart_item in cart.items:
        product = db.query(models.Product).filter(
            models.Product.product_code == cart_item.product_code
        ).first()
        
        if not product:
            continue
        
        order_line = models.OrderLine(
            order_id=order_id,
            product_code=cart_item.product_code,
            ordered_qty=cart_item.quantity,
            risk_score=cart_item.risk_score,
            line_status=models.LineStatus.OK
        )
        db.add(order_line)
        db.flush()
        
        # Calculate total
        total_amount += cart_item.quantity * product.price
        
        # Add order substitutes from cart item substitutes
        for cart_sub in cart_item.substitutes:
            order_sub = models.OrderSubstitute(
                order_id=order_id,
                line_id=order_line.line_id,
                substitute_product_code=cart_sub.substitute_product_code,
                priority=cart_sub.priority
            )
            db.add(order_sub)
    
    # Create initial tracking entry
    tracking = models.OrderTracking(
        order_id=order_id,
        status=models.OrderStatus.PLACED,
        updated_by="customer",
        notes="Order placed by customer"
    )
    db.add(tracking)
    
    # Create initial invoice
    invoice = models.Invoice(
        invoice_id=f"INV-{uuid.uuid4().hex[:8].upper()}",
        order_id=order_id,
        customer_id=current_user.customer_id,
        invoice_type=models.InvoiceType.ORDER,
        status=models.InvoiceStatus.PENDING,
        total_amount=total_amount,
        tax_amount=total_amount * 0.24  # 24% VAT
    )
    db.add(invoice)
    
    # Add invoice items
    for cart_item in cart.items:
        product = db.query(models.Product).filter(
            models.Product.product_code == cart_item.product_code
        ).first()
        if product:
            invoice_item = models.InvoiceItem(
                invoice_id=invoice.invoice_id,
                product_code=cart_item.product_code,
                description=product.product_name,
                quantity=cart_item.quantity,
                unit_price=product.price,
                total_price=cart_item.quantity * product.price
            )
            db.add(invoice_item)
    
    # Clear cart - delete items individually to trigger cascade delete of substitutes
    cart_items = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.cart_id
    ).all()
    
    for cart_item in cart_items:
        db.delete(cart_item)  # This will cascade delete the substitutes
    
    db.commit()
    
    # Reload order with all relationships for response
    db.refresh(db_order)
    order_with_details = db.query(models.Order).options(
        joinedload(models.Order.order_lines).joinedload(models.OrderLine.product),
        joinedload(models.Order.order_lines).joinedload(models.OrderLine.order_changes),
        joinedload(models.Order.order_substitutes).joinedload(models.OrderSubstitute.substitute_product),
        joinedload(models.Order.tracking_history),
        joinedload(models.Order.messages)
    ).filter(
        models.Order.order_id == order_id
    ).first()
    
    return order_with_details


@router.get("/", response_model=List[schemas.OrderWithDetails])
def get_orders(
    status: Optional[str] = None,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get all customer orders with product information, optionally filtered by status"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Eager load relationships to include product information
    query = db.query(models.Order).options(
        joinedload(models.Order.order_lines).joinedload(models.OrderLine.product),
        joinedload(models.Order.order_lines).joinedload(models.OrderLine.order_changes),
        joinedload(models.Order.order_substitutes).joinedload(models.OrderSubstitute.substitute_product),
        joinedload(models.Order.tracking_history),
        joinedload(models.Order.messages)
    ).filter(
        models.Order.customer_id == current_user.customer_id
    )
    
    # Filter by status if provided
    if status:
        try:
            order_status = models.OrderStatus(status.lower())
            query = query.filter(models.Order.status == order_status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status: {status}. Valid values are: {', '.join([s.value for s in models.OrderStatus])}"
            )
    
    orders = query.order_by(models.Order.order_datetime.desc()).all()
    return orders


@router.get("/{order_id}", response_model=schemas.OrderWithDetails)
def get_order(
    order_id: str,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get specific order details with product information"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Eager load relationships to include product information
    order = db.query(models.Order).options(
        joinedload(models.Order.order_lines).joinedload(models.OrderLine.product),
        joinedload(models.Order.order_lines).joinedload(models.OrderLine.order_changes),
        joinedload(models.Order.order_substitutes).joinedload(models.OrderSubstitute.substitute_product),
        joinedload(models.Order.tracking_history),
        joinedload(models.Order.messages)
    ).filter(
        models.Order.order_id == order_id,
        models.Order.customer_id == current_user.customer_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


@router.get("/{order_id}/messages", response_model=List[schemas.Message])
def get_order_messages(
    order_id: str,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get messages for an order"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Verify order belongs to customer
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id,
        models.Order.customer_id == current_user.customer_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    messages = db.query(models.Message).filter(
        models.Message.order_id == order_id
    ).order_by(models.Message.created_at.asc()).all()
    
    return messages


@router.post("/{order_id}/messages", response_model=schemas.Message)
def send_order_message(
    order_id: str,
    message: schemas.MessageCreate,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Send message for an order"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Verify order belongs to customer
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id,
        models.Order.customer_id == current_user.customer_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db_message = models.Message(
        order_id=order_id,
        sender_type=models.MessageSenderType.CUSTOMER,
        sender_id=current_user.user_id,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message


@router.put("/{order_id}/cancel", response_model=schemas.Order)
def cancel_order(
    order_id: str,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Cancel an order and void all associated invoices"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Verify order belongs to customer
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id,
        models.Order.customer_id == current_user.customer_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if order can be cancelled
    if order.status == models.OrderStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Order is already cancelled")
    
    if order.status == models.OrderStatus.DELIVERED:
        raise HTTPException(status_code=400, detail="Cannot cancel a delivered order")
    
    old_status = order.status
    order.status = models.OrderStatus.CANCELLED
    
    # Create tracking entry
    tracking = models.OrderTracking(
        order_id=order_id,
        status=models.OrderStatus.CANCELLED,
        updated_by=current_user.user_id,
        notes=f"Order cancelled by customer"
    )
    db.add(tracking)
    
    # Cancel all invoices for this order
    invoices = db.query(models.Invoice).filter(
        models.Invoice.order_id == order_id,
        models.Invoice.status != models.InvoiceStatus.CANCELLED
    ).all()
    
    for invoice in invoices:
        invoice.status = models.InvoiceStatus.CANCELLED
        invoice.notes = (invoice.notes or "") + f" | Cancelled due to order cancellation"
    
    # Send notification message
    message = models.Message(
        order_id=order_id,
        sender_type=models.MessageSenderType.CUSTOMER,
        sender_id=current_user.user_id,
        content="Order has been cancelled by customer"
    )
    db.add(message)
    
    db.commit()
    db.refresh(order)
    return order

