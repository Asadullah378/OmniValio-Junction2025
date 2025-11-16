"""
Voice Agent (Bot) endpoints
Unauthenticated endpoints for voice agent interactions
Designed for voice-to-text input and clear, concise responses
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel
from app.database import get_db
from app import models, schemas
import uuid
import json

router = APIRouter(prefix="/voice", tags=["voice-agent"])


# Voice-friendly response schemas
class VoiceProductSearchResult(BaseModel):
    """Simplified product result for voice responses"""
    product_code: str
    product_name: str
    price: Optional[float]
    category: Optional[str]
    available: bool = True


class VoiceProductSearchResponse(BaseModel):
    """Voice-friendly product search response"""
    query: str
    results_count: int
    products: List[VoiceProductSearchResult]
    message: str  # Voice-friendly message


class VoiceOrderItem(BaseModel):
    """Order item for voice order placement"""
    product_code: str
    quantity: float


class VoiceOrderRequest(BaseModel):
    """Voice order placement request"""
    email: str  # Customer email address
    items: str  # JSON string of order items: [{"product_code": "...", "quantity": 1.0}, ...]
    delivery_date: str  # YYYY-MM-DD format
    delivery_window_start: Optional[str] = None  # HH:MM format
    delivery_window_end: Optional[str] = None  # HH:MM format


class VoiceOrderResponse(BaseModel):
    """Voice-friendly order response"""
    order_id: str
    customer_name: str
    total_amount: float
    item_count: int
    delivery_date: str
    status: str
    message: str  # Voice-friendly confirmation message


class VoiceOrderStatusResponse(BaseModel):
    """Voice-friendly order status response"""
    order_id: str
    status: str
    status_description: str  # Human-readable status
    delivery_date: str
    item_count: int
    total_amount: float
    message: str  # Voice-friendly status message


class VoiceClaimStatusResponse(BaseModel):
    """Voice-friendly claim status response"""
    claim_id: str
    order_id: str
    claim_type: str
    status: str
    status_description: str  # Human-readable status
    created_date: str
    message: str  # Voice-friendly status message


def find_customer_by_email(email: str, db: Session) -> Optional[models.Customer]:
    """
    Find customer by email address
    
    Looks up the user by email, then retrieves the associated customer
    """
    # Find user by email
    user = db.query(models.User).filter(
        models.User.email == email
    ).first()
    
    if not user or not user.customer_id:
        return None
    
    # Find customer by customer_id from user
    customer = db.query(models.Customer).filter(
        models.Customer.customer_id == user.customer_id
    ).first()
    
    return customer


def get_status_description(status: str) -> str:
    """Convert status enum to human-readable description for voice"""
    status_descriptions = {
        "placed": "Order has been placed and is awaiting processing",
        "under_risk": "Order is being reviewed for potential shortages",
        "waiting_for_customer_action": "We need your response to proceed",
        "picking": "Order is currently being picked in the warehouse",
        "delivering": "Order is out for delivery",
        "delivered": "Order has been delivered",
        "cancelled": "Order has been cancelled",
        "open": "Claim has been submitted and is being reviewed",
        "ai_processing": "Claim is being processed by AI",
        "manual_review": "Claim requires manual review by our team",
        "approved": "Claim has been approved",
        "rejected": "Claim has been rejected",
        "resolved": "Claim has been resolved"
    }
    return status_descriptions.get(status.lower(), status.replace("_", " ").title())


@router.get("/products/search", response_model=VoiceProductSearchResponse)
def search_products_voice(
    query: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Search for products - voice-friendly endpoint
    
    Designed for voice input where query might be natural language.
    Breaks query into words and searches for products containing any of the words
    in their textual fields (names, categories, subcategories, etc.).
    Uses OR conditions if both query and category are provided.
    
    Returns simplified product information suitable for voice responses
    """
    # Build base query
    db_query = db.query(models.Product)
    
    # Build list of OR conditions
    or_conditions = []
    
    # Process query if provided - break into words and search for any word match
    if query:
        # Split query into words (handle multiple spaces, punctuation, etc.)
        query_words = [word.strip() for word in query.split() if word.strip()]
        
        if query_words:
            # For each word, create conditions that match any textual field
            word_conditions = []
            for word in query_words:
                word_pattern = f"%{word}%"
                word_conditions.append(
                    or_(
                        models.Product.product_name.ilike(word_pattern),
                        models.Product.product_name_en.ilike(word_pattern),
                        models.Product.product_name_fi.ilike(word_pattern),
                        models.Product.product_code.ilike(word_pattern),
                        models.Product.gtin.ilike(word_pattern),
                        models.Product.category.ilike(word_pattern),
                        models.Product.sub_category.ilike(word_pattern),
                        models.Product.ingredients.ilike(word_pattern),
                        models.Product.vendor_name.ilike(word_pattern),
                    )
                )
            # Product matches if ANY word matches (OR between words)
            or_conditions.append(or_(*word_conditions))
    
    # Process category if provided
    if category:
        category_pattern = f"%{category}%"
        or_conditions.append(
            or_(
                models.Product.category.ilike(category_pattern),
                models.Product.sub_category.ilike(category_pattern)
            )
        )
    
    # Apply OR conditions - product matches if query matches OR category matches
    if or_conditions:
        db_query = db_query.filter(or_(*or_conditions))
    
    # Get products
    products = db_query.order_by(models.Product.product_name).limit(limit).all()
    
    # Convert to voice-friendly format
    results = []
    for product in products:
        # Check if product has inventory
        inventory = db.query(models.Inventory).filter(
            models.Inventory.product_code == product.product_code
        ).first()
        available = inventory is not None and inventory.available_quantity > 0 if inventory else False
        
        results.append(VoiceProductSearchResult(
            product_code=product.product_code,
            product_name=product.product_name or product.product_name_en or "Unknown Product",
            price=product.price,
            category=product.category,
            available=available
        ))
    
    # Generate voice-friendly message
    if not results:
        message = f"No products found matching your search."
        if query:
            message += f" Try searching for '{query}' with different terms."
    elif len(results) == 1:
        message = f"Found 1 product: {results[0].product_name}"
        if results[0].price:
            message += f", priced at {results[0].price:.2f} euros"
    else:
        message = f"Found {len(results)} products matching your search."
    
    return VoiceProductSearchResponse(
        query=query or "",
        results_count=len(results),
        products=results,
        message=message
    )


@router.post("/orders/place", response_model=VoiceOrderResponse)
def place_order_voice(
    order_request: VoiceOrderRequest,
    db: Session = Depends(get_db)
):
    """
    Place an order via voice agent
    
    Accepts customer email, JSON string of products with quantities, and delivery information
    Returns confirmation with order details
    """
    # Parse items JSON string
    try:
        items_data = json.loads(order_request.items)
        if not isinstance(items_data, list):
            raise HTTPException(
                status_code=400,
                detail="Items must be a JSON array"
            )
        items = [VoiceOrderItem(**item) for item in items_data]
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON format for items: {str(e)}"
        )
    except (KeyError, TypeError, ValueError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid item format: {str(e)}. Each item must have 'product_code' and 'quantity'"
        )
    
    if not items:
        raise HTTPException(
            status_code=400,
            detail="Order must contain at least one item"
        )
    
    # Find customer by email
    customer = find_customer_by_email(order_request.email, db)
    if not customer:
        raise HTTPException(
            status_code=404,
            detail=f"Customer not found with email: {order_request.email}"
        )
    
    # Validate delivery date
    try:
        delivery_date = datetime.strptime(order_request.delivery_date, "%Y-%m-%d").date()
        today = date.today()
        
        if delivery_date <= today:
            raise HTTPException(
                status_code=400,
                detail="Delivery date must be at least one day after today"
            )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid delivery_date format. Use YYYY-MM-DD"
        )
    
    # Validate delivery window if provided
    if order_request.delivery_window_start and order_request.delivery_window_end:
        try:
            start_time = datetime.strptime(order_request.delivery_window_start, "%H:%M").time()
            end_time = datetime.strptime(order_request.delivery_window_end, "%H:%M").time()
            
            if start_time >= end_time:
                raise HTTPException(
                    status_code=400,
                    detail="Delivery window start time must be before end time"
                )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid time format. Use HH:MM"
            )
    
    # Generate order ID
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    
    # Create order
    db_order = models.Order(
        order_id=order_id,
        customer_id=customer.customer_id,
        delivery_date=order_request.delivery_date,
        delivery_window_start=order_request.delivery_window_start,
        delivery_window_end=order_request.delivery_window_end,
        channel="voice",
        status=models.OrderStatus.PLACED
    )
    db.add(db_order)
    db.flush()
    
    # Create order lines and calculate total
    total_amount = 0.0
    item_count = 0
    
    for item in items:
        # Verify product exists
        product = db.query(models.Product).filter(
            models.Product.product_code == item.product_code
        ).first()
        
        if not product:
            db.rollback()
            raise HTTPException(
                status_code=404,
                detail=f"Product not found: {item.product_code}"
            )
        
        if item.quantity <= 0:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Invalid quantity for product {item.product_code}: {item.quantity}"
            )
        
        order_line = models.OrderLine(
            order_id=order_id,
            product_code=item.product_code,
            ordered_qty=item.quantity,
            line_status=models.LineStatus.OK
        )
        db.add(order_line)
        
        # Calculate total
        if product.price:
            total_amount += item.quantity * product.price
        item_count += 1
    
    # Create initial tracking entry
    tracking = models.OrderTracking(
        order_id=order_id,
        status=models.OrderStatus.PLACED,
        updated_by="voice_agent",
        notes="Order placed via voice agent"
    )
    db.add(tracking)
    
    # Create invoice
    invoice = models.Invoice(
        invoice_id=f"INV-{uuid.uuid4().hex[:8].upper()}",
        order_id=order_id,
        customer_id=customer.customer_id,
        invoice_type=models.InvoiceType.ORDER,
        status=models.InvoiceStatus.PENDING,
        total_amount=total_amount,
        tax_amount=total_amount * 0.24  # 24% VAT
    )
    db.add(invoice)
    
    # Add invoice items
    for item in items:
        product = db.query(models.Product).filter(
            models.Product.product_code == item.product_code
        ).first()
        if product and product.price:
            invoice_item = models.InvoiceItem(
                invoice_id=invoice.invoice_id,
                product_code=item.product_code,
                description=product.product_name or product.product_name_en or "Product",
                quantity=item.quantity,
                unit_price=product.price,
                total_price=item.quantity * product.price
            )
            db.add(invoice_item)
    
    db.commit()
    
    # Generate voice-friendly confirmation message
    message = f"Order confirmed. Your order number is {order_id}. "
    message += f"Total amount is {total_amount:.2f} euros. "
    message += f"Delivery scheduled for {order_request.delivery_date}. "
    message += "Thank you for your order."
    
    return VoiceOrderResponse(
        order_id=order_id,
        customer_name=customer.name,
        total_amount=round(total_amount, 2),
        item_count=item_count,
        delivery_date=order_request.delivery_date,
        status="placed",
        message=message
    )


@router.get("/orders/{order_id}/status", response_model=VoiceOrderStatusResponse)
def get_order_status_voice(
    order_id: str,
    db: Session = Depends(get_db)
):
    """
    Get order status - voice-friendly endpoint
    
    Returns clear status information suitable for voice responses
    """
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=404,
            detail=f"Order not found: {order_id}"
        )
    
    # Get order details
    order_lines = db.query(models.OrderLine).filter(
        models.OrderLine.order_id == order_id
    ).all()
    
    item_count = len(order_lines)
    
    # Calculate total from invoice if available
    invoice = db.query(models.Invoice).filter(
        models.Invoice.order_id == order_id,
        models.Invoice.invoice_type == models.InvoiceType.ORDER
    ).first()
    
    total_amount = invoice.total_amount if invoice else 0.0
    
    # Generate voice-friendly message
    status_desc = get_status_description(order.status.value)
    message = f"Order {order_id} status: {status_desc}. "
    message += f"Delivery date: {order.delivery_date}. "
    message += f"Total items: {item_count}. "
    if total_amount > 0:
        message += f"Total amount: {total_amount:.2f} euros."
    
    return VoiceOrderStatusResponse(
        order_id=order_id,
        status=order.status.value,
        status_description=status_desc,
        delivery_date=order.delivery_date,
        item_count=item_count,
        total_amount=round(total_amount, 2),
        message=message
    )


@router.get("/orders/{order_id}", response_model=VoiceOrderStatusResponse)
def get_order_details_voice(
    order_id: str,
    db: Session = Depends(get_db)
):
    """
    Get full order details - voice-friendly endpoint
    
    Returns comprehensive order information suitable for voice responses
    """
    # Reuse the status endpoint logic but with more details
    return get_order_status_voice(order_id, db)


@router.get("/claims/{claim_id}/status", response_model=VoiceClaimStatusResponse)
def get_claim_status_voice(
    claim_id: str,
    db: Session = Depends(get_db)
):
    """
    Get claim status - voice-friendly endpoint
    
    Returns clear claim status information suitable for voice responses
    """
    claim = db.query(models.Claim).filter(
        models.Claim.claim_id == claim_id
    ).first()
    
    if not claim:
        raise HTTPException(
            status_code=404,
            detail=f"Claim not found: {claim_id}"
        )
    
    # Get claim processing info if available
    processing = db.query(models.ClaimProcessing).filter(
        models.ClaimProcessing.claim_id == claim_id
    ).first()
    
    # Generate voice-friendly message
    status_desc = get_status_description(claim.status.value)
    message = f"Claim {claim_id} status: {status_desc}. "
    message += f"Claim type: {claim.claim_type.value.replace('_', ' ').title()}. "
    
    if processing and processing.ai_processed:
        if processing.ai_confidence:
            message += f"AI confidence: {processing.ai_confidence:.0%}. "
    
    if claim.status == models.ClaimStatus.APPROVED and claim.credit_amount:
        message += f"Refund amount: {claim.credit_amount:.2f} euros. "
    elif claim.status == models.ClaimStatus.REJECTED and claim.rejection_reason:
        message += f"Reason: {claim.rejection_reason[:100]}. "
    
    created_date = claim.created_at.strftime("%Y-%m-%d") if claim.created_at else "Unknown"
    
    return VoiceClaimStatusResponse(
        claim_id=claim_id,
        order_id=claim.order_id,
        claim_type=claim.claim_type.value,
        status=claim.status.value,
        status_description=status_desc,
        created_date=created_date,
        message=message
    )


@router.get("/claims/{claim_id}", response_model=VoiceClaimStatusResponse)
def get_claim_details_voice(
    claim_id: str,
    db: Session = Depends(get_db)
):
    """
    Get full claim details - voice-friendly endpoint
    
    Returns comprehensive claim information suitable for voice responses
    """
    # Reuse the status endpoint logic
    return get_claim_status_voice(claim_id, db)

