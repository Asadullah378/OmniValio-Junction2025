"""
Dashboard and statistics endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/customer/{customer_id}", response_model=schemas.CustomerDashboard)
def get_customer_dashboard(customer_id: str, db: Session = Depends(get_db)):
    """Get customer dashboard with orders, claims, and stats"""
    customer = db.query(models.Customer).filter(
        models.Customer.customer_id == customer_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get recent orders (last 10)
    recent_orders = db.query(models.Order).filter(
        models.Order.customer_id == customer_id
    ).order_by(models.Order.order_datetime.desc()).limit(10).all()
    
    # Get open claims
    open_claims = db.query(models.Claim).filter(
        models.Claim.customer_id == customer_id,
        models.Claim.status != models.ClaimStatus.RESOLVED
    ).all()
    
    # Calculate stats
    total_orders = db.query(func.count(models.Order.order_id)).filter(
        models.Order.customer_id == customer_id
    ).scalar()
    
    orders_at_risk = db.query(func.count(models.Order.order_id)).filter(
        models.Order.customer_id == customer_id,
        models.Order.overall_order_risk > 0.5
    ).scalar()
    
    orders_in_picking = db.query(func.count(models.Order.order_id)).filter(
        models.Order.customer_id == customer_id,
        models.Order.status == models.OrderStatus.PICKING
    ).scalar()
    
    today = date.today().isoformat()
    orders_delivered_today = db.query(func.count(models.Order.order_id)).filter(
        models.Order.customer_id == customer_id,
        models.Order.status == models.OrderStatus.DELIVERED,
        func.date(models.Order.updated_at) == today
    ).scalar()
    
    stats = schemas.OrderStats(
        total_orders=total_orders or 0,
        orders_at_risk=orders_at_risk or 0,
        orders_in_picking=orders_in_picking or 0,
        orders_delivered_today=orders_delivered_today or 0
    )
    
    return schemas.CustomerDashboard(
        customer=customer,
        recent_orders=recent_orders,
        open_claims=open_claims,
        stats=stats
    )


@router.get("/stats/orders", response_model=schemas.OrderStats)
def get_order_stats(db: Session = Depends(get_db)):
    """Get overall order statistics"""
    total_orders = db.query(func.count(models.Order.order_id)).scalar()
    
    orders_at_risk = db.query(func.count(models.Order.order_id)).filter(
        models.Order.overall_order_risk > 0.5
    ).scalar()
    
    orders_in_picking = db.query(func.count(models.Order.order_id)).filter(
        models.Order.status == models.OrderStatus.PICKING
    ).scalar()
    
    today = date.today().isoformat()
    orders_delivered_today = db.query(func.count(models.Order.order_id)).filter(
        models.Order.status == models.OrderStatus.DELIVERED,
        func.date(models.Order.updated_at) == today
    ).scalar()
    
    return schemas.OrderStats(
        total_orders=total_orders or 0,
        orders_at_risk=orders_at_risk or 0,
        orders_in_picking=orders_in_picking or 0,
        orders_delivered_today=orders_delivered_today or 0
    )

