"""
Customer payments and invoices endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_customer

router = APIRouter(prefix="/customer/payments", tags=["customer-payments"])


@router.get("/invoices", response_model=List[schemas.Invoice])
def get_invoices(
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get all active invoices for customer (excludes cancelled invoices)"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    invoices = db.query(models.Invoice).filter(
        models.Invoice.customer_id == current_user.customer_id,
        models.Invoice.status != models.InvoiceStatus.CANCELLED
    ).order_by(models.Invoice.created_at.desc()).all()
    
    return invoices


@router.get("/invoices/{invoice_id}", response_model=schemas.Invoice)
def get_invoice(
    invoice_id: str,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get specific invoice details"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    invoice = db.query(models.Invoice).filter(
        models.Invoice.invoice_id == invoice_id,
        models.Invoice.customer_id == current_user.customer_id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice

