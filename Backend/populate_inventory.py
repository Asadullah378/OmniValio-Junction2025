"""
Script to populate inventory with all current products in the database
Creates inventory entries for products that don't have inventory records
"""
import random
from app.database import SessionLocal
from app import models

def populate_inventory(
    default_quantity: int = 100,
    min_quantity: int = 50,
    max_quantity: int = 500,
    use_random: bool = True,
    update_existing: bool = False
):
    """
    Populate inventory for all products in the database
    
    Args:
        default_quantity: Default quantity to set if use_random is False
        min_quantity: Minimum random quantity
        max_quantity: Maximum random quantity
        use_random: If True, use random quantity between min and max
        update_existing: If True, update existing inventory records
    """
    db = SessionLocal()
    
    try:
        # Get all products from database
        products = db.query(models.Product).all()
        
        if not products:
            print("No products found in database.")
            return
        
        print(f"Found {len(products)} products in database.")
        
        # Get existing inventory product codes
        existing_inventory = db.query(models.Inventory.product_code).all()
        existing_product_codes = {inv.product_code for inv in existing_inventory}
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for product in products:
            # Check if inventory already exists
            existing_inv = db.query(models.Inventory).filter(
                models.Inventory.product_code == product.product_code
            ).first()
            
            if existing_inv:
                if update_existing:
                    # Update existing inventory
                    if use_random:
                        new_quantity = random.randint(min_quantity, max_quantity)
                    else:
                        new_quantity = default_quantity
                    
                    existing_inv.quantity = new_quantity
                    existing_inv.available_quantity = new_quantity - existing_inv.reserved_quantity
                    existing_inv.updated_by = "SYSTEM"
                    
                    updated_count += 1
                    print(f"  Updated: {product.product_code} ({product.product_name}) - Quantity: {existing_inv.quantity}")
                else:
                    skipped_count += 1
                    print(f"  Skipped: {product.product_code} ({product.product_name}) - Inventory already exists")
            else:
                # Create new inventory entry
                if use_random:
                    quantity = random.randint(min_quantity, max_quantity)
                else:
                    quantity = default_quantity
                
                inventory = models.Inventory(
                    product_code=product.product_code,
                    quantity=quantity,
                    reserved_quantity=0,
                    available_quantity=quantity,
                    updated_by="SYSTEM"
                )
                db.add(inventory)
                created_count += 1
                print(f"  Created: {product.product_code} ({product.product_name}) - Quantity: {quantity}")
        
        db.commit()
        
        print("\n" + "="*60)
        print("Inventory Population Summary:")
        print(f"  Total products: {len(products)}")
        print(f"  Created: {created_count}")
        print(f"  Updated: {updated_count}")
        print(f"  Skipped: {skipped_count}")
        print("="*60)
        
    except Exception as e:
        db.rollback()
        print(f"Error populating inventory: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Populate inventory with current products")
    parser.add_argument(
        "--default-quantity",
        type=int,
        default=100,
        help="Default quantity to set (if not using random)"
    )
    parser.add_argument(
        "--min-quantity",
        type=int,
        default=50,
        help="Minimum random quantity"
    )
    parser.add_argument(
        "--max-quantity",
        type=int,
        default=500,
        help="Maximum random quantity"
    )
    parser.add_argument(
        "--fixed",
        action="store_true",
        help="Use fixed default quantity instead of random"
    )
    parser.add_argument(
        "--update-existing",
        action="store_true",
        help="Update existing inventory records"
    )
    
    args = parser.parse_args()
    
    print("Starting inventory population...")
    print(f"Mode: {'Fixed quantity' if args.fixed else 'Random quantity'}")
    if args.fixed:
        print(f"Default quantity: {args.default_quantity}")
    else:
        print(f"Random range: {args.min_quantity} - {args.max_quantity}")
    print(f"Update existing: {args.update_existing}")
    print()
    
    populate_inventory(
        default_quantity=args.default_quantity,
        min_quantity=args.min_quantity,
        max_quantity=args.max_quantity,
        use_random=not args.fixed,
        update_existing=args.update_existing
    )

