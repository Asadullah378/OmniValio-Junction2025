"""
Claims management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/claims", tags=["claims"])


@router.post("/", response_model=schemas.Claim, status_code=201)
def create_claim(claim: schemas.ClaimCreate, db: Session = Depends(get_db)):
    """Create a new claim"""
    # Verify order exists
    order = db.query(models.Order).filter(
        models.Order.order_id == claim.order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    claim_id = f"CLM-{uuid.uuid4().hex[:8].upper()}"
    
    # Create claim
    db_claim = models.Claim(
        claim_id=claim_id,
        order_id=claim.order_id,
        customer_id=order.customer_id,
        claim_type=claim.claim_type,
        status=models.ClaimStatus.OPEN,
        channel=claim.channel
    )
    db.add(db_claim)
    db.flush()
    
    # Create claim lines
    for line_data in claim.lines:
        db_claim_line = models.ClaimLine(
            claim_id=claim_id,
            line_id=line_data.line_id,
            product_code=line_data.product_code,
            reported_issue=line_data.reported_issue
        )
        db.add(db_claim_line)
    
    # Create attachments
    for attachment_data in claim.attachments:
        db_attachment = models.ClaimAttachment(
            claim_id=claim_id,
            file_path=attachment_data.file_path,
            file_type=attachment_data.file_type
        )
        db.add(db_attachment)
    
    db.commit()
    db.refresh(db_claim)
    return db_claim


@router.get("/", response_model=List[schemas.Claim])
def get_claims(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all claims with optional filters"""
    query = db.query(models.Claim)
    
    if customer_id:
        query = query.filter(models.Claim.customer_id == customer_id)
    if status:
        query = query.filter(models.Claim.status == status)
    
    claims = query.order_by(models.Claim.created_at.desc()).offset(skip).limit(limit).all()
    return claims


@router.get("/{claim_id}", response_model=schemas.Claim)
def get_claim(claim_id: str, db: Session = Depends(get_db)):
    """Get a specific claim by ID"""
    claim = db.query(models.Claim).filter(
        models.Claim.claim_id == claim_id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


@router.post("/{claim_id}/analyze", response_model=schemas.Claim)
def analyze_claim_images(claim_id: str, db: Session = Depends(get_db)):
    """
    Analyze claim images/videos - placeholder for multimodal ML model
    In production, this would call the image analysis model
    """
    claim = db.query(models.Claim).filter(
        models.Claim.claim_id == claim_id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Placeholder for image analysis
    # In production, this would:
    # 1. Load images from claim_attachments
    # 2. Call vision model to detect products
    # 3. Compare with expected items from order
    # 4. Set model_confidence_score
    
    if claim.claim_attachments:
        # Mock confidence score
        claim.model_confidence_score = 0.85
        db.commit()
        db.refresh(claim)
    
    return claim


@router.post("/{claim_id}/resolve", response_model=schemas.Claim)
def resolve_claim(
    claim_id: str,
    resolution: schemas.ClaimResolution,
    db: Session = Depends(get_db)
):
    """Resolve a claim with credit, re-delivery, etc."""
    claim = db.query(models.Claim).filter(
        models.Claim.claim_id == claim_id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    claim.status = models.ClaimStatus.RESOLVED
    claim.resolution_type = resolution.resolution_type
    claim.credit_amount = resolution.credit_amount
    claim.re_delivery_date = resolution.re_delivery_date
    claim.handled_by = resolution.handled_by
    
    db.commit()
    db.refresh(claim)
    return claim


@router.put("/{claim_id}/status", response_model=schemas.Claim)
def update_claim_status(
    claim_id: str,
    status: models.ClaimStatus,
    db: Session = Depends(get_db)
):
    """Update claim status"""
    claim = db.query(models.Claim).filter(
        models.Claim.claim_id == claim_id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    claim.status = status
    db.commit()
    db.refresh(claim)
    return claim

