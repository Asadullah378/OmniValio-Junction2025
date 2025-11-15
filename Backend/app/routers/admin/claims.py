"""
Admin claims management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import uuid
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.auth import get_current_admin

router = APIRouter(prefix="/admin/claims", tags=["admin-claims"])


@router.get("/", response_model=List[schemas.ClaimWithDetails])
def get_all_claims(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    requires_manual_review: Optional[bool] = None,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all claims with optional filters and attachments"""
    query = db.query(models.Claim).options(
        joinedload(models.Claim.claim_lines),
        joinedload(models.Claim.claim_attachments),
        joinedload(models.Claim.messages),
        joinedload(models.Claim.processing)
    )
    
    if status:
        try:
            claim_status = models.ClaimStatus(status.lower())
            query = query.filter(models.Claim.status == claim_status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status: {status}. Valid values are: {', '.join([s.value for s in models.ClaimStatus])}"
            )
    
    if requires_manual_review:
        query = query.join(models.ClaimProcessing).filter(
            models.ClaimProcessing.requires_manual_review == True
        )
    
    claims = query.order_by(models.Claim.created_at.desc()).offset(skip).limit(limit).all()
    return claims


@router.get("/manual-review", response_model=List[schemas.ClaimWithDetails])
def get_claims_requiring_manual_review(
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get claims that require manual review with attachments"""
    # Return claims where status is manual_review OR requires_manual_review is true
    claims = db.query(models.Claim).options(
        joinedload(models.Claim.claim_lines),
        joinedload(models.Claim.claim_attachments),
        joinedload(models.Claim.messages),
        joinedload(models.Claim.processing)
    ).join(models.ClaimProcessing).filter(
        (models.Claim.status == models.ClaimStatus.MANUAL_REVIEW) |
        (models.ClaimProcessing.requires_manual_review == True)
    ).order_by(models.Claim.created_at.desc()).all()
    
    return claims


@router.get("/{claim_id}", response_model=schemas.ClaimWithDetails)
def get_claim(
    claim_id: str,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get specific claim details with attachments"""
    claim = db.query(models.Claim).options(
        joinedload(models.Claim.claim_lines),
        joinedload(models.Claim.claim_attachments),
        joinedload(models.Claim.messages),
        joinedload(models.Claim.processing)
    ).filter(
        models.Claim.claim_id == claim_id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    return claim


@router.post("/{claim_id}/approve", response_model=schemas.Claim)
def approve_claim(
    claim_id: str,
    refund_amount: Optional[float] = None,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve a claim and generate refund"""
    claim = db.query(models.Claim).filter(
        models.Claim.claim_id == claim_id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    claim.status = models.ClaimStatus.APPROVED
    claim.handled_by = current_user.user_id
    
    # Update processing
    processing = db.query(models.ClaimProcessing).filter(
        models.ClaimProcessing.claim_id == claim_id
    ).first()
    
    if processing:
        processing.reviewed_by = current_user.user_id
        processing.reviewed_at = datetime.utcnow()
        processing.requires_manual_review = False
    
    # Calculate refund amount if not provided
    if refund_amount is None:
        # Calculate from order with proper eager loading
        from sqlalchemy.orm import joinedload
        order = db.query(models.Order).options(
            joinedload(models.Order.order_lines).joinedload(models.OrderLine.product)
        ).filter(
            models.Order.order_id == claim.order_id
        ).first()
        if order:
            # Simple calculation - can be enhanced
            refund_amount = sum(
                line.ordered_qty * (line.product.price if line.product and line.product.price else 0)
                for line in order.order_lines
            ) * 0.1  # 10% default
            
            # Ensure minimum refund amount
            if refund_amount < 1.0:
                refund_amount = 1.0
        else:
            # Default minimum refund if order not found
            refund_amount = 1.0
    
    claim.credit_amount = refund_amount
    
    # Check if refund invoice already exists for this claim
    existing_invoice = db.query(models.Invoice).filter(
        models.Invoice.claim_id == claim_id,
        models.Invoice.invoice_type == models.InvoiceType.REFUND
    ).first()
    
    if not existing_invoice:
        # Create refund invoice
        invoice = models.Invoice(
            invoice_id=f"INV-{uuid.uuid4().hex[:8].upper()}",
            claim_id=claim_id,
            customer_id=claim.customer_id,
            invoice_type=models.InvoiceType.REFUND,
            status=models.InvoiceStatus.PENDING,
            total_amount=refund_amount,
            tax_amount=0.0,
            notes=f"Refund for approved claim {claim_id}"
        )
        db.add(invoice)
        
        invoice_item = models.InvoiceItem(
            invoice_id=invoice.invoice_id,
            description=f"Refund for claim: {claim.claim_type.value}",
            quantity=1,
            unit_price=refund_amount,
            total_price=refund_amount
        )
        db.add(invoice_item)
    else:
        # Update existing invoice amount if different
        if existing_invoice.total_amount != refund_amount:
            existing_invoice.total_amount = refund_amount
            # Update invoice item
            invoice_item = db.query(models.InvoiceItem).filter(
                models.InvoiceItem.invoice_id == existing_invoice.invoice_id
            ).first()
            if invoice_item:
                invoice_item.unit_price = refund_amount
                invoice_item.total_price = refund_amount
    
    # Send message to customer
    message = models.Message(
        claim_id=claim_id,
        sender_type=models.MessageSenderType.ADMIN,
        sender_id=current_user.user_id,
        content=f"Your claim has been approved. A refund of €{refund_amount:.2f} has been issued."
    )
    db.add(message)
    
    db.commit()
    db.refresh(claim)
    return claim


@router.post("/{claim_id}/reject", response_model=schemas.Claim)
def reject_claim(
    claim_id: str,
    reason: str,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Reject a claim with required reason"""
    if not reason or not reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is required")
    
    claim = db.query(models.Claim).filter(
        models.Claim.claim_id == claim_id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    claim.status = models.ClaimStatus.REJECTED
    claim.handled_by = current_user.user_id
    claim.rejection_reason = reason  # Store rejection reason
    
    # Update processing
    processing = db.query(models.ClaimProcessing).filter(
        models.ClaimProcessing.claim_id == claim_id
    ).first()
    
    if processing:
        processing.reviewed_by = current_user.user_id
        processing.reviewed_at = datetime.utcnow()
        processing.requires_manual_review = False
    
    # Send message to customer
    message = models.Message(
        claim_id=claim_id,
        sender_type=models.MessageSenderType.ADMIN,
        sender_id=current_user.user_id,
        content=f"Your claim has been rejected. Reason: {reason}"
    )
    db.add(message)
    
    db.commit()
    db.refresh(claim)
    return claim


@router.get("/{claim_id}/messages", response_model=List[schemas.Message])
def get_claim_messages(
    claim_id: str,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get messages for a claim"""
    claim = db.query(models.Claim).filter(
        models.Claim.claim_id == claim_id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    messages = db.query(models.Message).filter(
        models.Message.claim_id == claim_id
    ).order_by(models.Message.created_at.asc()).all()
    
    return messages


@router.post("/{claim_id}/messages", response_model=schemas.Message)
def send_claim_message(
    claim_id: str,
    message: schemas.MessageCreate,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Send message for a claim"""
    claim = db.query(models.Claim).filter(
        models.Claim.claim_id == claim_id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    db_message = models.Message(
        claim_id=claim_id,
        sender_type=models.MessageSenderType.ADMIN,
        sender_id=current_user.user_id,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message

