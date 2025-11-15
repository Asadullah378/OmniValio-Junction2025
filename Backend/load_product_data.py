"""
Script to load product data from CSV into the database
"""
import csv
import os
import sys
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, get_db
from app.models import Product
from app.database import engine, SessionLocal

# Temperature condition mapping to temperature zone
# Based on common values: 3.0=frozen, 4.0=chilled, 7.0=frozen, 8.0=ambient
def map_temperature_zone(temperature_condition):
    """Map numeric temperature condition to temperature zone string"""
    if temperature_condition is None:
        return None
    
    try:
        temp = float(temperature_condition)
        if temp <= 3.0:
            return "frozen"
        elif temp <= 6.0:
            return "chilled"
        else:
            return "ambient"
    except (ValueError, TypeError):
        return None


def parse_float(value):
    """Parse float value, handling empty strings and None"""
    if not value or value == '':
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def parse_int(value):
    """Parse int value, handling empty strings and None"""
    if not value or value == '':
        return None
    try:
        return int(float(value))  # Handle cases like "4.0" -> 4
    except (ValueError, TypeError):
        return None


def load_products_from_csv(csv_path: str, db: Session):
    """Load products from CSV file into database"""
    print(f"Loading products from {csv_path}...")
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return
    
    products_loaded = 0
    products_updated = 0
    errors = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 because row 1 is header
            try:
                product_code = row.get('product_code', '').strip()
                if not product_code:
                    print(f"Warning: Row {row_num} has no product_code, skipping...")
                    errors += 1
                    continue
                
                # Check if product already exists
                existing_product = db.query(Product).filter(
                    Product.product_code == product_code
                ).first()
                
                # Use product_name_en as primary product_name, fallback to product_name_fi
                product_name_en = row.get('product_name_en', '').strip()
                product_name_fi = row.get('product_name_fi', '').strip()
                product_name = product_name_en if product_name_en else product_name_fi
                
                if not product_name:
                    print(f"Warning: Row {row_num} (product_code: {product_code}) has no product name, skipping...")
                    errors += 1
                    continue
                
                # Parse temperature condition and map to zone
                temp_condition = parse_float(row.get('temperature_condition'))
                temperature_zone = map_temperature_zone(temp_condition)
                
                # Prepare product data
                product_data = {
                    'product_code': product_code,
                    'gtin': str(row.get('gtin', '')).strip() if row.get('gtin') else None,
                    'product_name': product_name,
                    'product_name_en': product_name_en if product_name_en else None,
                    'product_name_fi': product_name_fi if product_name_fi else None,
                    'category_code': row.get('category', '').strip() if row.get('category') else None,
                    'category': row.get('category_name', '').strip() if row.get('category_name') else None,
                    'sub_category': row.get('subcategory_name', '').strip() if row.get('subcategory_name') else None,
                    'vendor_name': row.get('vendor_name', '').strip() if row.get('vendor_name') else None,
                    'country_of_origin': row.get('country_of_origin', '').strip() if row.get('country_of_origin') else None,
                    'temperature_condition': temp_condition,
                    'temperature_zone': temperature_zone,
                    'sales_unit': row.get('sales_unit', '').strip() if row.get('sales_unit') else None,
                    'base_unit': row.get('base_unit', '').strip() if row.get('base_unit') else None,
                    'allowed_lot_size': parse_float(row.get('allowed_lot_size')),
                    'marketing_text': row.get('marketing_text', '').strip() if row.get('marketing_text') else None,
                    'ingredients': row.get('ingredients', '').strip() if row.get('ingredients') else None,
                    'storage_instructions': row.get('storage_instructions', '').strip() if row.get('storage_instructions') else None,
                    'allergens': row.get('allergens', '').strip() if row.get('allergens') else None,
                    'labels': row.get('labels', '').strip() if row.get('labels') else None,
                    'energy_kj': parse_float(row.get('energy_kj')),
                    'protein': parse_float(row.get('protein')),
                    'carbohydrates': parse_float(row.get('carbohydrates')),
                    'fat': parse_float(row.get('fat')),
                    'sugar': parse_float(row.get('sugar')),
                    'salt': parse_float(row.get('salt')),
                    'shelf_life_days': parse_int(row.get('shelf_life_days')),  # Not in CSV, but keeping for compatibility
                    'unit_size': row.get('unit_size', '').strip() if row.get('unit_size') else None,
                    'unit_type': row.get('unit_type', '').strip() if row.get('unit_type') else None,
                    'price': parse_float(row.get('price')),  # Not in CSV, but keeping for compatibility
                }
                
                if existing_product:
                    # Update existing product
                    for key, value in product_data.items():
                        if key != 'product_code':  # Don't update primary key
                            setattr(existing_product, key, value)
                    products_updated += 1
                else:
                    # Create new product
                    new_product = Product(**product_data)
                    db.add(new_product)
                    products_loaded += 1
                
                # Commit every 100 products to avoid memory issues
                if (products_loaded + products_updated) % 100 == 0:
                    db.commit()
                    print(f"Processed {products_loaded + products_updated} products...")
                    
            except Exception as e:
                print(f"Error processing row {row_num} (product_code: {row.get('product_code', 'unknown')}): {e}")
                errors += 1
                continue
    
    # Final commit
    try:
        db.commit()
        print(f"\n✅ Successfully loaded {products_loaded} new products")
        print(f"✅ Successfully updated {products_updated} existing products")
        if errors > 0:
            print(f"⚠️  {errors} errors encountered")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error committing to database: {e}")
        raise


def main():
    """Main function to load product data"""
    # Get CSV path
    csv_path = os.path.join(os.path.dirname(__file__), 'app', 'data', 'data.csv')
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        print("Please ensure the CSV file is located at app/data/data.csv")
        return
    
    # Create database session
    db = SessionLocal()
    
    try:
        load_products_from_csv(csv_path, db)
    except Exception as e:
        print(f"Error loading products: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

