"""
Customer product browsing endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth import get_current_customer
from app.AI_Services.risk_prediction import predict_risk_batch

router = APIRouter(prefix="/customer/products", tags=["customer-products"])


@router.get("/", response_model=schemas.PaginatedResponse[schemas.Product])
def browse_products(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    search: Optional[str] = None,
    temperature_zone: Optional[str] = None,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Browse products with pagination and filters
    
    - **skip**: Number of items to skip (for pagination)
    - **limit**: Maximum number of items to return (default: 20)
    - **category**: Filter by category name
    - **sub_category**: Filter by subcategory name
    - **search**: Search in product names, codes, and GTIN
    - **temperature_zone**: Filter by temperature zone (frozen, chilled, ambient)
    """
    # Build base query
    query = db.query(models.Product)
    
    # Apply filters
    if category:
        query = query.filter(models.Product.category == category)
    
    if sub_category:
        query = query.filter(models.Product.sub_category == sub_category)
    
    if temperature_zone:
        query = query.filter(models.Product.temperature_zone == temperature_zone)
    
    if search:
        search_term = f"%{search}%"
        # Build search conditions
        search_conditions = [
            models.Product.product_name.ilike(search_term),
            models.Product.product_name_en.ilike(search_term),
            models.Product.product_name_fi.ilike(search_term),
            models.Product.product_code.ilike(search_term),
            models.Product.gtin.ilike(search_term),
        ]
        # Add ingredients search if the column exists and is not None
        # Note: We'll search ingredients as text, but need to handle NULL values
        search_conditions.append(
            models.Product.ingredients.ilike(search_term)
        )
        query = query.filter(or_(*search_conditions))
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    products = query.order_by(models.Product.product_name).offset(skip).limit(limit).all()
    
    # Calculate if there are more items
    has_more = (skip + limit) < total
    
    return schemas.PaginatedResponse(
        items=products,
        total=total,
        skip=skip,
        limit=limit,
        has_more=has_more
    )


@router.get("/categories", response_model=List[schemas.Category])
def get_categories(
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get all product categories with their subcategories
    
    Returns a list of categories, each containing:
    - category: The main category name
    - sub_categories: List of subcategory names under this category
    """
    # Get all distinct category-subcategory pairs
    category_pairs = db.query(
        models.Product.category,
        models.Product.sub_category
    ).filter(
        models.Product.category.isnot(None)
    ).distinct().all()
    
    # Group subcategories by category
    category_dict = {}
    for cat, sub_cat in category_pairs:
        if cat:  # Only process non-null categories
            if cat not in category_dict:
                category_dict[cat] = set()
            if sub_cat:  # Only add non-null subcategories
                category_dict[cat].add(sub_cat)
    
    # Format response
    result = []
    for category in sorted(category_dict.keys()):
        sub_categories = sorted(list(category_dict[category]))
        result.append(schemas.Category(
            category=category,
            sub_categories=sub_categories
        ))
    
    return result


@router.get("/{product_code}", response_model=schemas.Product)
def get_product(
    product_code: str,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get product details"""
    product = db.query(models.Product).filter(
        models.Product.product_code == product_code
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@router.post("/risk/batch", response_model=schemas.BatchRiskAssessmentResponse)
def assess_products_risk(
    request: schemas.BatchRiskAssessmentRequest,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Assess risk for multiple products using the risk prediction API
    
    Returns shortage_probability (0-1) for each product
    """
    if not current_user.customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get customer to retrieve customer_number
    customer = db.query(models.Customer).filter(
        models.Customer.customer_id == current_user.customer_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Use customer_id as customer_number (or you can add a customer_number field if needed)
    customer_number = current_user.customer_id
    
    # Prepare products list for batch prediction
    products_for_prediction = []
    for product_req in request.products:
        # Verify product exists
        product = db.query(models.Product).filter(
            models.Product.product_code == product_req.product_code
        ).first()
        
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product not found: {product_req.product_code}"
            )
        
        products_for_prediction.append({
            "product_code": product_req.product_code,
            "customer_number": customer_number,
            "order_qty": product_req.order_qty,
            "order_created_date": product_req.order_created_date,
            "requested_delivery_date": product_req.requested_delivery_date
        })
    
    # Call risk prediction API
    try:
        
        result = predict_risk_batch(products_for_prediction)
        
        # Transform response to match our schema
        predictions = []
        high_risk_count = 0
        
        for prediction in result["predictions"]:
            shortage_probability = prediction.get("shortage_probability", 0.0)
            
            predictions.append(schemas.ProductRiskResponse(
                product_code=prediction["product_code"],
                shortage_probability=round(shortage_probability*10, 4)
            ))
            
            if shortage_probability > 0.5:
                high_risk_count += 1
        
        print(predictions)
        return schemas.BatchRiskAssessmentResponse(
            predictions=predictions,
            total_products=len(predictions),
            high_risk_count=high_risk_count
        )
        
    except Exception as e:
        print(f"Error during risk prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during risk prediction: {str(e)}")


@router.get("/{product_code}/similar", response_model=List[schemas.Product])
def get_similar_products(
    product_code: str,
    limit: int = 10,
    current_user: models.User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get similar products using AI-based semantic search"""
    product = db.query(models.Product).filter(
        models.Product.product_code == product_code
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Try to use AI recommendation service
    try:
        from app.AI_Services.product_recommender import get_recommender
        
        recommender = get_recommender()
        if recommender.available:
            # Build search text from product
            search_text = recommender.build_search_text(product)
            
            # Get recommendations by text (using product embedding)
            recommended_gtins = recommender.get_recommendations_by_text(search_text, top_k=limit)
            
            if recommended_gtins:
                # Find products by GTIN (handle .0 suffix)
                similar_products = []
                for gtin in recommended_gtins:
                    # Try exact match
                    db_product = db.query(models.Product).filter(
                        models.Product.gtin == gtin
                    ).first()
                    
                    # Try with .0 suffix
                    if not db_product and gtin.endswith('.0'):
                        gtin_clean = gtin[:-2]
                        db_product = db.query(models.Product).filter(
                            models.Product.gtin == gtin_clean
                        ).first()
                    
                    # Try without .0 if it doesn't have it
                    if not db_product and not gtin.endswith('.0'):
                        gtin_with_suffix = f"{gtin}.0"
                        db_product = db.query(models.Product).filter(
                            models.Product.gtin == gtin_with_suffix
                        ).first()
                    
                    if db_product and db_product.product_code != product_code:
                        similar_products.append(db_product)
                        if len(similar_products) >= limit:
                            break
                
                if similar_products:
                    return similar_products
    except Exception as e:
        # Fall back to simple logic if AI service fails
        print(f"AI recommendation service error: {e}")
    
    # Fallback: Simple similarity - same category and temperature zone
    similar = db.query(models.Product).filter(
        models.Product.product_code != product_code,
        models.Product.category == product.category,
        models.Product.temperature_zone == product.temperature_zone
    ).limit(limit).all()
    
    return similar

