"""
Order management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=schemas.Order, status_code=201)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    """Create a new order"""
    # Verify customer exists
    customer = db.query(models.Customer).filter(
        models.Customer.customer_id == order.customer_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Generate order ID
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    
    # Create order
    db_order = models.Order(
        order_id=order_id,
        customer_id=order.customer_id,
        delivery_date=order.delivery_date,
        delivery_window_start=order.delivery_window_start,
        delivery_window_end=order.delivery_window_end,
        channel=order.channel,
        status=models.OrderStatus.CREATED
    )
    db.add(db_order)
    db.flush()
    
    # Create order lines
    for line_data in order.lines:
        # Verify product exists
        product = db.query(models.Product).filter(
            models.Product.product_code == line_data.product_code
        ).first()
        if not product:
            raise HTTPException(
                status_code=404, 
                detail=f"Product {line_data.product_code} not found"
            )
        
        db_line = models.OrderLine(
            order_id=order_id,
            product_code=line_data.product_code,
            ordered_qty=line_data.ordered_qty,
            item_priority=line_data.item_priority,
            auto_substitution_allowed=line_data.auto_substitution_allowed,
            customer_comments=line_data.customer_comments,
            line_status=models.LineStatus.OK
        )
        db.add(db_line)
    
    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("/", response_model=List[schemas.Order])
def get_orders(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all orders with optional filters"""
    query = db.query(models.Order)
    
    if customer_id:
        query = query.filter(models.Order.customer_id == customer_id)
    if status:
        query = query.filter(models.Order.status == status)
    
    orders = query.order_by(models.Order.order_datetime.desc()).offset(skip).limit(limit).all()
    return orders


@router.get("/{order_id}", response_model=schemas.Order)
def get_order(order_id: str, db: Session = Depends(get_db)):
    """Get a specific order by ID"""
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/{order_id}", response_model=schemas.Order)
def update_order(
    order_id: str,
    order_update: schemas.OrderUpdate,
    db: Session = Depends(get_db)
):
    """Update order status or risk score"""
    db_order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = order_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_order, field, value)
    
    db.commit()
    db.refresh(db_order)
    return db_order


@router.post("/{order_id}/risk-score", response_model=schemas.OrderRiskScore)
def score_order_risk(order_id: str, db: Session = Depends(get_db)):
    """
    Score order risk - placeholder for ML model integration
    In production, this would call the actual risk prediction model
    """
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Placeholder risk scoring logic
    # In production, this would call the ML model with features
    line_risks = []
    overall_risk = 0.0
    
    for line in order.order_lines:
        # Mock risk calculation (replace with actual ML model)
        risk_score = 0.3  # Placeholder
        if line.item_priority == models.PriorityLevel.FLEXIBLE:
            risk_score += 0.1
        if line.ordered_qty > 50:
            risk_score += 0.1
        
        line_risk = schemas.LineRisk(
            line_id=line.line_id,
            product_code=line.product_code,
            shortage_probability=min(risk_score, 1.0),
            expected_shortage_ratio=risk_score * 0.5,
            top_contributors=["sku_shortage_rate_30d", "item_priority_flexible"]
        )
        line_risks.append(line_risk)
        
        # Update line risk score
        line.risk_score = risk_score
        overall_risk = max(overall_risk, risk_score)
    
    # Update order risk
    order.overall_order_risk = overall_risk
    order.status = models.OrderStatus.RISK_SCORED
    
    db.commit()
    
    return schemas.OrderRiskScore(
        order_id=order_id,
        overall_order_risk=overall_risk,
        line_risks=line_risks
    )


@router.get("/{order_id}/lines", response_model=List[schemas.OrderLine])
def get_order_lines(order_id: str, db: Session = Depends(get_db)):
    """Get all lines for an order"""
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order.order_lines

