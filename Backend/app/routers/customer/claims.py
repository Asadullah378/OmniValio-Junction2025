"""
Customer claims endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import uuid
import os
import json
import random
import asyncio
from datetime import datetime
from app.database import get_db, SessionLocal
from app import models, schemas
from app.auth import get_current_customer

router = APIRouter(prefix="/customer/claims", tags=["customer-claims"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads/claims"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def process_claim_ai(claim_id: str):
    """Background task to process claim with AI (dummy implementation)"""
    import time
    
    # Simulate AI processing time (2-5 seconds)
    processing_time = random.uniform(2.0, 5.0)
    time.sleep(processing_time)
    
    # Get database session
    db = SessionLocal()
    try:
        # Get claim and processing record
        claim = db.query(models.Claim).filter(
            models.Claim.claim_id == claim_id
        ).first()
        
        if not claim:
            return
        
        processing = db.query(models.ClaimProcessing).filter(
            models.ClaimProcessing.claim_id == claim_id
        ).first()
        
        if not processing:
            return
        
        # Generate AI result (dummy implementation)
        # In real implementation, this would call ML model
        ai_confidence = round(random.uniform(0.6, 0.95), 2)
        
        # Generate AI decision (weighted towards manual review for demo)
        decision_weights = {
            "approved": 0.2,
            "rejected": 0.2,
            "manual_review_needed": 0.6
        }
        ai_decision = random.choices(
            list(decision_weights.keys()),
            weights=list(decision_weights.values())
        )[0]
        
        # Generate AI summary based on claim type
        claim_type_summaries = {
            models.ClaimType.MISSING_ITEM: "AI analysis indicates missing items based on order comparison. Images show incomplete delivery.",
            models.ClaimType.DAMAGED_ITEM: "AI analysis detected potential damage in uploaded images. Product condition assessment required.",
            models.ClaimType.WRONG_ITEM: "AI analysis suggests incorrect product was delivered. Product code mismatch detected.",
            models.ClaimType.QUALITY_ISSUE: "AI analysis indicates potential quality concerns. Visual inspection of images shows anomalies."
        }
        
        ai_summary = claim_type_summaries.get(
            claim.claim_type,
            "AI analysis completed. Review of claim details and attachments indicates need for further assessment."
        )
        
        # Create AI result as JSON
        ai_result = {
            "summary": ai_summary,
            "decision": ai_decision
        }
        
        # Update processing record
        processing.ai_processed = True
        processing.ai_confidence = ai_confidence
        processing.ai_result = json.dumps(ai_result)
        
        # Set requires_manual_review based on decision
        if ai_decision == "manual_review_needed":
            processing.requires_manual_review = True
            claim.status = models.ClaimStatus.MANUAL_REVIEW
        elif ai_decision == "approved":
            processing.requires_manual_review = False
            claim.status = models.ClaimStatus.APPROVED
            claim.handled_by = "AI_AGENT"
        elif ai_decision == "rejected":
            processing.requires_manual_review = False
            claim.status = models.ClaimStatus.REJECTED
            claim.handled_by = "AI_AGENT"
            claim.rejection_reason = "AI analysis determined claim does not meet approval criteria."
        
        # Send AI processing complete message
        message_content = f"AI processing complete. Decision: {ai_decision.replace('_', ' ').title()}. Confidence: {ai_confidence:.0%}."
        if ai_decision == "manual_review_needed":
            message_content += " Your claim has been flagged for manual review by our team."
        
        message = models.Message(
            claim_id=claim_id,
            sender_type=models.MessageSenderType.AI,
            sender_id="ai_agent",
            content=message_content
        )
        db.add(message)
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"Error processing claim AI: {e}")
    finally:
        db.close()


@router.post("/", response_model=schemas.ClaimWithDetails)
async def create_claim(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Create a claim for a delivered order with multiple file uploads"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Parse multipart form data
    form = await request.form()
    
    # Extract form fields
    order_id = form.get("order_id")
    claim_type_str = form.get("claim_type")
    description = form.get("description")
    
    if not order_id or not claim_type_str or not description:
        raise HTTPException(
            status_code=422,
            detail="Missing required fields: order_id, claim_type, or description"
        )
    
    # Parse claim type
    try:
        claim_type = models.ClaimType(claim_type_str)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid claim_type: {claim_type_str}"
        )
    
    # Verify order exists and is delivered
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id,
        models.Order.customer_id == current_user.customer_id,
        models.Order.status == models.OrderStatus.DELIVERED
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=404, 
            detail="Order not found or not delivered"
        )
    
    claim_id = f"CLM-{uuid.uuid4().hex[:8].upper()}"
    
    # Create claim
    db_claim = models.Claim(
        claim_id=claim_id,
        order_id=order_id,
        customer_id=current_user.customer_id,
        claim_type=claim_type,
        status=models.ClaimStatus.OPEN,
        channel="WEB"
    )
    db.add(db_claim)
    db.flush()
    
    # Create claim line with description
    claim_line = models.ClaimLine(
        claim_id=claim_id,
        product_code="",  # Can be updated if specific product
        reported_issue=description
    )
    db.add(claim_line)
    
    # Handle multiple file uploads
    # In FastAPI Request.form(), files are stored as UploadFile objects
    uploaded_files = []
    
    # Try to get files - Starlette's FormData stores files differently
    # Method 1: form.getlist("files") - this should work for multiple files with same name
    try:
        files_list = form.getlist("files")
        for item in files_list:
            # In Starlette, form.getlist returns the actual values
            if hasattr(item, 'read') or isinstance(item, UploadFile):
                uploaded_files.append(item)
    except Exception as e:
        print(f"DEBUG: Error getting files from form.getlist: {e}")
    
    # Method 2: Iterate through all form items and find UploadFile objects
    try:
        for key, value in form.multi_items():
            if key == "files" and (hasattr(value, 'read') or isinstance(value, UploadFile)):
                if value not in uploaded_files:
                    uploaded_files.append(value)
    except Exception as e:
        print(f"DEBUG: Error iterating form.multi_items: {e}")
    
    # Method 3: Direct access - sometimes files are stored directly
    try:
        if "files" in form:
            file_value = form["files"]
            if isinstance(file_value, list):
                uploaded_files.extend([f for f in file_value if hasattr(f, 'read') or isinstance(f, UploadFile)])
            elif hasattr(file_value, 'read') or isinstance(file_value, UploadFile):
                uploaded_files.append(file_value)
    except Exception as e:
        print(f"DEBUG: Error accessing form['files']: {e}")
    
    print(f"DEBUG: Total files found: {len(uploaded_files)}")
    
    # Process each uploaded file
    for file in uploaded_files:
        if file and hasattr(file, 'filename') and file.filename:
            try:
                # Ensure filename is a string
                filename = str(file.filename) if file.filename else f"file_{uuid.uuid4().hex[:8]}"
                
                # Save file with absolute path
                file_path = os.path.abspath(os.path.join(UPLOAD_DIR, f"{claim_id}_{filename}"))
                # Ensure directory exists
                os.makedirs(UPLOAD_DIR, exist_ok=True)
                
                # Read and save file content
                content = await file.read()
                print(f"DEBUG: Read {len(content)} bytes from file {filename}")
                if content:
                    with open(file_path, "wb") as f:
                        f.write(content)
                    
                    # Verify file was written
                    if os.path.exists(file_path):
                        file_size = os.path.getsize(file_path)
                        print(f"DEBUG: File saved successfully: {file_path} ({file_size} bytes)")
                    else:
                        print(f"ERROR: File was not saved to {file_path}")
                    
                    # Determine file type
                    content_type = getattr(file, 'content_type', '') or ''
                    file_type = "IMAGE" if content_type and "image" in content_type.lower() else "VIDEO"
                    
                    # Use relative path for database storage
                    relative_path = os.path.join(UPLOAD_DIR, f"{claim_id}_{filename}")
                    
                    attachment = models.ClaimAttachment(
                        claim_id=claim_id,
                        file_path=relative_path,
                        file_type=file_type
                    )
                    db.add(attachment)
                    print(f"Successfully saved attachment: {filename} to {file_path}")
                else:
                    print(f"Warning: File {filename} has no content")
            except Exception as e:
                # Log error but don't fail the entire claim creation
                import traceback
                print(f"Error saving attachment {getattr(file, 'filename', 'unknown')}: {e}")
                print(traceback.format_exc())
                # Continue with other files
    
    # Create claim processing record
    processing = models.ClaimProcessing(
        claim_id=claim_id,
        ai_processed=False,
        requires_manual_review=False
    )
    db.add(processing)
    
    # Set status to AI_PROCESSING
    db_claim.status = models.ClaimStatus.AI_PROCESSING
    
    db.commit()
    
    # Reload claim with all relationships for response
    db.refresh(db_claim)
    claim_with_details = db.query(models.Claim).options(
        joinedload(models.Claim.claim_lines),
        joinedload(models.Claim.claim_attachments),
        joinedload(models.Claim.messages),
        joinedload(models.Claim.processing)
    ).filter(
        models.Claim.claim_id == claim_id
    ).first()
    
    # Trigger AI processing in background
    background_tasks.add_task(process_claim_ai, claim_id)
    
    return claim_with_details




@router.get("/", response_model=List[schemas.ClaimWithDetails])
def get_claims(
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get all customer claims with attachments"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    claims = db.query(models.Claim).options(
        joinedload(models.Claim.claim_lines),
        joinedload(models.Claim.claim_attachments),
        joinedload(models.Claim.messages),
        joinedload(models.Claim.processing)
    ).filter(
        models.Claim.customer_id == current_user.customer_id
    ).order_by(models.Claim.created_at.desc()).all()
    
    return claims


@router.get("/{claim_id}", response_model=schemas.ClaimWithDetails)
def get_claim(
    claim_id: str,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get specific claim details with attachments"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    claim = db.query(models.Claim).options(
        joinedload(models.Claim.claim_lines),
        joinedload(models.Claim.claim_attachments),
        joinedload(models.Claim.messages),
        joinedload(models.Claim.processing)
    ).filter(
        models.Claim.claim_id == claim_id,
        models.Claim.customer_id == current_user.customer_id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    return claim


@router.get("/{claim_id}/messages", response_model=List[schemas.Message])
def get_claim_messages(
    claim_id: str,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get messages for a claim"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Verify claim belongs to customer
    claim = db.query(models.Claim).filter(
        models.Claim.claim_id == claim_id,
        models.Claim.customer_id == current_user.customer_id
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
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Send message for a claim"""
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Verify claim belongs to customer
    claim = db.query(models.Claim).filter(
        models.Claim.claim_id == claim_id,
        models.Claim.customer_id == current_user.customer_id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    db_message = models.Message(
        claim_id=claim_id,
        sender_type=models.MessageSenderType.CUSTOMER,
        sender_id=current_user.user_id,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message

