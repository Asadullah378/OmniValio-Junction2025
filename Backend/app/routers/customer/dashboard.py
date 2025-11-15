"""
Customer dashboard endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.database import get_db
from app import models, schemas
from app.auth import get_current_customer

router = APIRouter(prefix="/customer/dashboard", tags=["customer-dashboard"])


@router.get("/", response_model=schemas.CustomerDashboard)
def get_dashboard(
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get customer dashboard with stats and recent activity"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer = db.query(models.Customer).filter(
        models.Customer.customer_id == current_user.customer_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get recent orders (last 10)
    recent_orders = db.query(models.Order).filter(
        models.Order.customer_id == current_user.customer_id
    ).order_by(models.Order.order_datetime.desc()).limit(10).all()
    
    # Get open claims
    open_claims = db.query(models.Claim).filter(
        models.Claim.customer_id == current_user.customer_id,
        models.Claim.status != models.ClaimStatus.RESOLVED
    ).all()
    
    # Calculate stats
    total_orders = db.query(func.count(models.Order.order_id)).filter(
        models.Order.customer_id == current_user.customer_id
    ).scalar() or 0
    
    orders_at_risk = db.query(func.count(models.Order.order_id)).filter(
        models.Order.customer_id == current_user.customer_id,
        models.Order.status == models.OrderStatus.UNDER_RISK
    ).scalar() or 0
    
    orders_in_picking = db.query(func.count(models.Order.order_id)).filter(
        models.Order.customer_id == current_user.customer_id,
        models.Order.status == models.OrderStatus.PICKING
    ).scalar() or 0
    
    today = date.today().isoformat()
    orders_delivered_today = db.query(func.count(models.Order.order_id)).filter(
        models.Order.customer_id == current_user.customer_id,
        models.Order.status == models.OrderStatus.DELIVERED,
        func.date(models.Order.updated_at) == today
    ).scalar() or 0
    
    stats = schemas.OrderStats(
        total_orders=total_orders,
        orders_at_risk=orders_at_risk,
        orders_in_picking=orders_in_picking,
        orders_delivered_today=orders_delivered_today
    )
    
    return schemas.CustomerDashboard(
        customer=customer,
        recent_orders=recent_orders,
        open_claims=open_claims,
        stats=stats
    )


@router.get("/actions-needed", response_model=List[schemas.Order])
def get_actions_needed(
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get orders that need customer action"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    orders = db.query(models.Order).filter(
        models.Order.customer_id == current_user.customer_id,
        models.Order.status == models.OrderStatus.WAITING_FOR_CUSTOMER_ACTION
    ).order_by(models.Order.order_datetime.desc()).all()
    
    return orders

