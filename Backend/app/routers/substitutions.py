"""
Substitution and pre-order optimization endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/substitutions", tags=["substitutions"])


@router.post("/pre-order-optimization/{order_id}", response_model=schemas.PreOrderOptimizationResponse)
def get_pre_order_optimization(order_id: str, db: Session = Depends(get_db)):
    """
    Get pre-order optimization suggestions for low-priority items with high risk
    """
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Score risk if not already done
    if order.status == models.OrderStatus.CREATED:
        # Trigger risk scoring (simplified - in production would call ML service)
        pass
    
    suggestions = []
    
    for line in order.order_lines:
        # Only suggest for FLEXIBLE items with high risk
        if (line.item_priority == models.PriorityLevel.FLEXIBLE and 
            line.risk_score and line.risk_score > 0.5):
            
            # Get substitute products
            product = db.query(models.Product).filter(
                models.Product.product_code == line.product_code
            ).first()
            
            if product:
                # Find alternatives (same category, same temperature zone)
                alternatives = db.query(models.Product).filter(
                    models.Product.product_code != line.product_code,
                    models.Product.category == product.category,
                    models.Product.temperature_zone == product.temperature_zone
                ).limit(3).all()
                
                suggested_alts = []
                for idx, alt in enumerate(alternatives):
                    quality = models.SubstitutionQuality.GOOD
                    if idx == 0:
                        quality = models.SubstitutionQuality.BEST
                    elif idx == 1:
                        quality = models.SubstitutionQuality.BETTER
                    
                    suggested_alts.append(schemas.SubstitutionAlternative(
                        alt_product_code=alt.product_code,
                        alt_product_name=alt.product_name,
                        substitution_quality=quality,
                        reason=f"Same category ({alt.category}), lower risk",
                        availability_status="AVAILABLE"
                    ))
                
                if suggested_alts:
                    suggestions.append(schemas.PreOrderAlternativeSuggestion(
                        line_id=line.line_id,
                        product_code=line.product_code,
                        shortage_probability=line.risk_score,
                        item_priority=line.item_priority,
                        suggested_alternatives=suggested_alts
                    ))
    
    return schemas.PreOrderOptimizationResponse(
        order_id=order_id,
        suggestions=suggestions
    )


@router.post("/suggest", response_model=List[schemas.SubstitutionSuggestion])
def create_substitution_suggestions(
    suggestion: schemas.SubstitutionSuggestionCreate,
    db: Session = Depends(get_db)
):
    """Create substitution suggestions for an order line"""
    order = db.query(models.Order).filter(
        models.Order.order_id == suggestion.order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    line = db.query(models.OrderLine).filter(
        models.OrderLine.line_id == suggestion.line_id,
        models.OrderLine.order_id == suggestion.order_id
    ).first()
    if not line:
        raise HTTPException(status_code=404, detail="Order line not found")
    
    # Create suggestion records
    created_suggestions = []
    for alt in suggestion.alternatives:
        db_suggestion = models.SubstitutionSuggestion(
            order_id=suggestion.order_id,
            line_id=suggestion.line_id,
            original_product_code=suggestion.original_product_code,
            alt_product_code=alt.alt_product_code,
            substitution_quality=alt.substitution_quality,
            reason=alt.reason,
            availability_status=alt.availability_status,
            context=suggestion.context
        )
        db.add(db_suggestion)
        created_suggestions.append(db_suggestion)
    
    db.commit()
    
    # Refresh to get IDs
    for suggestion in created_suggestions:
        db.refresh(suggestion)
    
    return created_suggestions


@router.post("/decide", response_model=schemas.OrderChange)
def decide_substitution(
    decision: schemas.SubstitutionDecision,
    db: Session = Depends(get_db)
):
    """Customer decides on substitution - accept alternative or keep original"""
    order = db.query(models.Order).filter(
        models.Order.order_id == decision.order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    line = db.query(models.OrderLine).filter(
        models.OrderLine.line_id == decision.line_id,
        models.OrderLine.order_id == decision.order_id
    ).first()
    if not line:
        raise HTTPException(status_code=404, detail="Order line not found")
    
    # Verify chosen product exists
    product = db.query(models.Product).filter(
        models.Product.product_code == decision.chosen_product_code
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Chosen product not found")
    
    # Create order change record
    order_change = models.OrderChange(
        order_id=decision.order_id,
        line_id=decision.line_id,
        old_product_code=line.product_code,
        new_product_code=decision.chosen_product_code,
        change_reason="substitution",
        confirmed_by="customer"
    )
    db.add(order_change)
    
    # Update order line if substitution accepted
    if decision.decision == "ACCEPTED_ALT":
        line.product_code = decision.chosen_product_code
        line.line_status = models.LineStatus.REPLACED
    elif decision.decision == "CANCEL_LINE":
        line.line_status = models.LineStatus.ZERO
        line.delivered_qty = 0
        line.shortage_flag = True
    
    db.commit()
    db.refresh(order_change)
    
    return order_change


@router.get("/{order_id}/suggestions", response_model=List[schemas.SubstitutionSuggestion])
def get_substitution_suggestions(order_id: str, db: Session = Depends(get_db)):
    """Get all substitution suggestions for an order"""
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    suggestions = db.query(models.SubstitutionSuggestion).filter(
        models.SubstitutionSuggestion.order_id == order_id
    ).all()
    
    return suggestions

