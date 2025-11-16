"""
Script to update inventory table schema from Float to Integer
This script alters the inventory table columns to use Integer instead of Float
"""
from app.database import SessionLocal, engine
from sqlalchemy import text

def update_inventory_schema():
    """
    Update inventory table columns from Float to Integer
    """
    db = SessionLocal()
    
    try:
        print("Updating inventory table schema...")
        print("Changing quantity, reserved_quantity, and available_quantity from Float to Integer")
        
        # SQLite doesn't support ALTER COLUMN directly, so we need to:
        # 1. Create a new table with the correct schema
        # 2. Copy data (converting floats to integers)
        # 3. Drop old table
        # 4. Rename new table
        
        # For SQLite, we'll use a different approach - recreate the table
        with engine.connect() as conn:
            # Check if we're using SQLite
            if 'sqlite' in str(engine.url):
                print("Detected SQLite database. Recreating inventory table...")
                
                # Step 1: Create new table with Integer columns
                conn.execute(text("""
                    CREATE TABLE inventory_new (
                        inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        product_code VARCHAR NOT NULL UNIQUE,
                        quantity INTEGER NOT NULL DEFAULT 0,
                        reserved_quantity INTEGER DEFAULT 0,
                        available_quantity INTEGER DEFAULT 0,
                        last_updated DATETIME,
                        updated_by VARCHAR,
                        FOREIGN KEY (product_code) REFERENCES products(product_code)
                    )
                """))
                
                # Step 2: Copy data, converting floats to integers
                conn.execute(text("""
                    INSERT INTO inventory_new 
                    (inventory_id, product_code, quantity, reserved_quantity, 
                     available_quantity, last_updated, updated_by)
                    SELECT 
                        inventory_id,
                        product_code,
                        CAST(quantity AS INTEGER),
                        CAST(reserved_quantity AS INTEGER),
                        CAST(available_quantity AS INTEGER),
                        last_updated,
                        updated_by
                    FROM inventory
                """))
                
                # Step 3: Drop old table
                conn.execute(text("DROP TABLE inventory"))
                
                # Step 4: Rename new table
                conn.execute(text("ALTER TABLE inventory_new RENAME TO inventory"))
                
                conn.commit()
                print("Inventory table schema updated successfully!")
            else:
                # For other databases (PostgreSQL, MySQL), use ALTER COLUMN
                print("Detected non-SQLite database. Using ALTER COLUMN...")
                
                # For PostgreSQL
                if 'postgresql' in str(engine.url):
                    conn.execute(text("ALTER TABLE inventory ALTER COLUMN quantity TYPE INTEGER USING quantity::integer"))
                    conn.execute(text("ALTER TABLE inventory ALTER COLUMN reserved_quantity TYPE INTEGER USING reserved_quantity::integer"))
                    conn.execute(text("ALTER TABLE inventory ALTER COLUMN available_quantity TYPE INTEGER USING available_quantity::integer"))
                # For MySQL
                elif 'mysql' in str(engine.url):
                    conn.execute(text("ALTER TABLE inventory MODIFY COLUMN quantity INTEGER NOT NULL DEFAULT 0"))
                    conn.execute(text("ALTER TABLE inventory MODIFY COLUMN reserved_quantity INTEGER DEFAULT 0"))
                    conn.execute(text("ALTER TABLE inventory MODIFY COLUMN available_quantity INTEGER DEFAULT 0"))
                
                conn.commit()
                print("Inventory table schema updated successfully!")
        
        print("\nSchema update complete!")
        print("All inventory quantities are now stored as integers.")
        
    except Exception as e:
        print(f"Error updating schema: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    
    print("="*60)
    print("Inventory Schema Migration Script")
    print("="*60)
    print("\nThis script will update the inventory table to use Integer")
    print("instead of Float for quantity fields.")
    print("\nWARNING: This will modify your database schema.")
    
    response = input("\nDo you want to continue? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("Migration cancelled.")
        sys.exit(0)
    
    update_inventory_schema()

