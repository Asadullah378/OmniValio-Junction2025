"""
Script to update product prices in the database
Since the CSV doesn't contain price data, this script generates reasonable dummy prices
based on product categories and other factors.
"""
import sys
import os
import random

# Add the parent directory to the path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Product

# Price ranges by category (in EUR)
CATEGORY_PRICE_RANGES = {
    "Meat & Poultry": (5.0, 25.0),
    "Dairy & Eggs": (2.0, 8.0),
    "Frozen Foods": (3.0, 15.0),
    "Pantry Staples": (1.0, 12.0),
    "Beverages": (1.5, 6.0),
    "Snacks": (2.0, 10.0),
    "Bakery": (1.5, 8.0),
    "Fresh Produce": (2.0, 15.0),
    "Breakfast Foods": (2.0, 8.0),
}

# Default price range if category not found
DEFAULT_PRICE_RANGE = (1.0, 20.0)


def generate_price(category: str = None, sub_category: str = None) -> float:
    """
    Generate a reasonable price based on category
    Returns price rounded to 2 decimal places
    """
    # Get price range for category
    price_range = CATEGORY_PRICE_RANGES.get(category, DEFAULT_PRICE_RANGE)
    min_price, max_price = price_range
    
    # Generate random price within range
    price = round(random.uniform(min_price, max_price), 2)
    
    return price


def update_product_prices():
    """Update prices for all products that have null prices"""
    db = SessionLocal()
    
    try:
        # Get all products with null prices
        products = db.query(Product).filter(
            Product.price.is_(None)
        ).all()
        
        print(f"Found {len(products)} products with null prices")
        
        updated = 0
        for product in products:
            # Generate price based on category
            new_price = generate_price(
                category=product.category,
                sub_category=product.sub_category
            )
            
            product.price = new_price
            updated += 1
            
            # Commit every 100 products
            if updated % 100 == 0:
                db.commit()
                print(f"Updated {updated} products...")
        
        # Final commit
        db.commit()
        print(f"\nSuccessfully updated prices for {updated} products")
        
        # Show some sample prices
        print("\nSample updated products:")
        sample_products = db.query(Product).filter(
            Product.price.isnot(None)
        ).limit(10).all()
        
        for p in sample_products:
            print(f"  - {p.product_name[:50]}: EUR {p.price:.2f} ({p.category})")
        
    except Exception as e:
        db.rollback()
        print(f"Error updating prices: {e}")
        raise
    finally:
        db.close()


def main():
    """Main function"""
    print("Updating product prices...")
    print("=" * 50)
    update_product_prices()


if __name__ == "__main__":
    main()

