"""
Admin order management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import uuid
from app.database import get_db
from app import models, schemas
from app.auth import get_current_admin

router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])


@router.get("/", response_model=List[schemas.OrderWithDetails])
def get_all_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all orders with product information"""
    query = db.query(models.Order).options(
        joinedload(models.Order.order_lines).joinedload(models.OrderLine.product),
        joinedload(models.Order.order_lines).joinedload(models.OrderLine.order_changes),
        joinedload(models.Order.order_substitutes).joinedload(models.OrderSubstitute.substitute_product),
        joinedload(models.Order.tracking_history),
        joinedload(models.Order.messages)
    )
    
    if status:
        # Convert string status to OrderStatus enum
        try:
            order_status = models.OrderStatus(status.lower())
            query = query.filter(models.Order.status == order_status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status: {status}. Valid values are: {', '.join([s.value for s in models.OrderStatus])}"
            )
    
    orders = query.order_by(models.Order.order_datetime.desc()).offset(skip).limit(limit).all()
    return orders


@router.get("/{order_id}", response_model=schemas.OrderWithDetails)
def get_order(
    order_id: str,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get specific order details with product information"""
    order = db.query(models.Order).options(
        joinedload(models.Order.order_lines).joinedload(models.OrderLine.product),
        joinedload(models.Order.order_lines).joinedload(models.OrderLine.order_changes),
        joinedload(models.Order.order_substitutes).joinedload(models.OrderSubstitute.substitute_product),
        joinedload(models.Order.tracking_history),
        joinedload(models.Order.messages)
    ).filter(
        models.Order.order_id == order_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


@router.put("/{order_id}/status", response_model=schemas.Order)
def update_order_status(
    order_id: str,
    status: models.OrderStatus,
    notes: Optional[str] = None,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update order status with automatic alerts and invoice management"""
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status
    order.status = status
    
    # Create tracking entry
    tracking = models.OrderTracking(
        order_id=order_id,
        status=status,
        updated_by=current_user.user_id,
        notes=notes or f"Status changed from {old_status} to {status}"
    )
    db.add(tracking)
    
    # Handle status-specific actions
    if status == models.OrderStatus.WAITING_FOR_CUSTOMER_ACTION:
        # Create alert message for customer
        alert_message = models.Message(
            order_id=order_id,
            sender_type=models.MessageSenderType.ADMIN,
            sender_id=current_user.user_id,
            content=notes or f"Your order requires your attention. Please review and take action."
        )
        db.add(alert_message)
    
    elif status == models.OrderStatus.CANCELLED:
        # Void/cancel all invoices for this order
        invoices = db.query(models.Invoice).filter(
            models.Invoice.order_id == order_id,
            models.Invoice.status != models.InvoiceStatus.CANCELLED
        ).all()
        
        for invoice in invoices:
            invoice.status = models.InvoiceStatus.CANCELLED
            invoice.notes = (invoice.notes or "") + f" | Cancelled due to order cancellation on {tracking.created_at}"
    
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/replace-product", response_model=schemas.OrderChange)
def replace_product_with_substitute(
    order_id: str,
    line_id: int,
    substitute_product_code: str,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Replace a product in order with customer's selected substitute"""
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_line = db.query(models.OrderLine).filter(
        models.OrderLine.order_id == order_id,
        models.OrderLine.line_id == line_id
    ).first()
    
    if not order_line:
        raise HTTPException(status_code=404, detail="Order line not found")
    
    # Verify substitute exists in order substitutes
    order_substitute = db.query(models.OrderSubstitute).filter(
        models.OrderSubstitute.order_id == order_id,
        models.OrderSubstitute.line_id == line_id,
        models.OrderSubstitute.substitute_product_code == substitute_product_code
    ).first()
    
    if not order_substitute:
        raise HTTPException(
            status_code=400, 
            detail="Substitute not found in order. Customer must select substitutes during order creation."
        )
    
    # Verify substitute product exists
    substitute_product = db.query(models.Product).filter(
        models.Product.product_code == substitute_product_code
    ).first()
    
    if not substitute_product:
        raise HTTPException(status_code=404, detail="Substitute product not found")
    
    # Create order change
    order_change = models.OrderChange(
        order_id=order_id,
        line_id=line_id,
        old_product_code=order_line.product_code,
        new_product_code=substitute_product_code,
        change_reason="shortage",
        confirmed_by=current_user.user_id
    )
    db.add(order_change)
    
    # Get old product before updating
    old_product = db.query(models.Product).filter(
        models.Product.product_code == order_line.product_code
    ).first()
    
    if not old_product:
        raise HTTPException(status_code=404, detail="Original product not found")
    
    # Calculate price difference before updating
    price_diff = (substitute_product.price - old_product.price) * order_line.ordered_qty
    
    # Update order line
    order_line.product_code = substitute_product_code
    order_line.line_status = models.LineStatus.REPLACED
    
    # Mark substitute as used
    order_substitute.is_used = True
    
    # Regenerate the main order invoice with updated items
    # First, mark old ORDER invoice as cancelled (if exists)
    old_invoice = db.query(models.Invoice).filter(
        models.Invoice.order_id == order_id,
        models.Invoice.invoice_type == models.InvoiceType.ORDER,
        models.Invoice.status != models.InvoiceStatus.CANCELLED
    ).first()
    
    if old_invoice:
        old_invoice.status = models.InvoiceStatus.CANCELLED
        old_invoice.notes = (old_invoice.notes or "") + f" | Replaced due to product substitution"
    
    # Create new ORDER invoice with all current order items
    new_invoice_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
    total_amount = 0.0
    
    # Calculate total from all order lines
    for line in order.order_lines:
        product = db.query(models.Product).filter(
            models.Product.product_code == line.product_code
        ).first()
        if product:
            line_total = line.ordered_qty * product.price
            total_amount += line_total
    
    new_invoice = models.Invoice(
        invoice_id=new_invoice_id,
        order_id=order_id,
        customer_id=order.customer_id,
        invoice_type=models.InvoiceType.ORDER,
        status=models.InvoiceStatus.PENDING,
        total_amount=total_amount,
        tax_amount=total_amount * 0.24,  # 24% VAT
        notes=f"Regenerated invoice after product substitution: {old_product.product_name} -> {substitute_product.product_name}"
    )
    db.add(new_invoice)
    db.flush()
    
    # Add invoice items for all order lines
    for line in order.order_lines:
        product = db.query(models.Product).filter(
            models.Product.product_code == line.product_code
        ).first()
        if product:
            invoice_item = models.InvoiceItem(
                invoice_id=new_invoice_id,
                product_code=line.product_code,
                description=product.product_name,
                quantity=line.ordered_qty,
                unit_price=product.price,
                total_price=line.ordered_qty * product.price
            )
            db.add(invoice_item)
    
    # Create modification invoice for price difference (if any)
    if price_diff != 0:
        mod_invoice = models.Invoice(
            invoice_id=f"INV-{uuid.uuid4().hex[:8].upper()}",
            order_id=order_id,
            customer_id=order.customer_id,
            invoice_type=models.InvoiceType.MODIFICATION,
            status=models.InvoiceStatus.PENDING,
            total_amount=abs(price_diff),
            tax_amount=abs(price_diff) * 0.24,
            notes=f"Price adjustment: {old_product.product_name} -> {substitute_product.product_name}"
        )
        db.add(mod_invoice)
        db.flush()
        
        mod_invoice_item = models.InvoiceItem(
            invoice_id=mod_invoice.invoice_id,
            product_code=substitute_product_code,
            description=f"Price adjustment: {substitute_product.product_name}",
            quantity=order_line.ordered_qty,
            unit_price=substitute_product.price - old_product.price,
            total_price=price_diff
        )
        db.add(mod_invoice_item)
    
    # Send notification message to customer
    message = models.Message(
        order_id=order_id,
        sender_type=models.MessageSenderType.ADMIN,
        sender_id=current_user.user_id,
        content=f"Product {old_product.product_name} has been replaced with {substitute_product.product_name} due to availability. Your invoice has been updated."
    )
    db.add(message)
    
    db.commit()
    db.refresh(order_change)
    return order_change


@router.get("/{order_id}/messages", response_model=List[schemas.Message])
def get_order_messages(
    order_id: str,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get messages for an order"""
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
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
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Send message for an order"""
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db_message = models.Message(
        order_id=order_id,
        sender_type=models.MessageSenderType.ADMIN,
        sender_id=current_user.user_id,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message

