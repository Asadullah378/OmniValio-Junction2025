"""
Product management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/", response_model=schemas.Product, status_code=201)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    """Create a new product"""
    db_product = db.query(models.Product).filter(
        models.Product.product_code == product.product_code
    ).first()
    if db_product:
        raise HTTPException(status_code=400, detail="Product code already exists")
    
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/", response_model=List[schemas.Product])
def get_products(
    skip: int = 0, 
    limit: int = 100, 
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all products with optional category filter"""
    query = db.query(models.Product)
    if category:
        query = query.filter(models.Product.category == category)
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/{product_code}", response_model=schemas.Product)
def get_product(product_code: str, db: Session = Depends(get_db)):
    """Get a specific product by code"""
    product = db.query(models.Product).filter(
        models.Product.product_code == product_code
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/{product_code}/substitutes", response_model=List[schemas.Product])
def get_substitute_products(
    product_code: str,
    db: Session = Depends(get_db)
):
    """Get potential substitute products using AI-based semantic search"""
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
            recommended_gtins = recommender.get_recommendations_by_text(search_text, top_k=10)
            
            if recommended_gtins:
                # Find products by GTIN (handle .0 suffix)
                substitute_products = []
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
                        substitute_products.append(db_product)
                        if len(substitute_products) >= 10:
                            break
                
                if substitute_products:
                    return substitute_products
    except Exception as e:
        # Fall back to simple logic if AI service fails
        print(f"AI recommendation service error: {e}")
    
    # Fallback: Simple substitution logic: same category and temperature zone
    substitutes = db.query(models.Product).filter(
        models.Product.product_code != product_code,
        models.Product.category == product.category,
        models.Product.temperature_zone == product.temperature_zone
    ).limit(10).all()
    
    return substitutes

