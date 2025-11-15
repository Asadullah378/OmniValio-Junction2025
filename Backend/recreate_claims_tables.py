"""
Script to drop and recreate claims-related tables
"""
from sqlalchemy import text
from app.database import engine, Base
from app import models

def recreate_claims_tables():
    """Drop and recreate all claims-related tables"""
    print("Dropping claims-related tables...")
    
    with engine.begin() as conn:
        # Drop tables in correct order (respecting foreign keys)
        # Note: SQLite doesn't support DROP CASCADE, so we need to drop in order
        
        # Drop dependent tables first
        try:
            conn.execute(text("DROP TABLE IF EXISTS claim_processing"))
            print("  ✓ Dropped claim_processing table")
        except Exception as e:
            print(f"  ✗ Error dropping claim_processing: {e}")
        
        try:
            conn.execute(text("DROP TABLE IF EXISTS claim_attachments"))
            print("  ✓ Dropped claim_attachments table")
        except Exception as e:
            print(f"  ✗ Error dropping claim_attachments: {e}")
        
        try:
            conn.execute(text("DROP TABLE IF EXISTS claim_lines"))
            print("  ✓ Dropped claim_lines table")
        except Exception as e:
            print(f"  ✗ Error dropping claim_lines: {e}")
        
        # Drop main claims table
        try:
            conn.execute(text("DROP TABLE IF EXISTS claims"))
            print("  ✓ Dropped claims table")
        except Exception as e:
            print(f"  ✗ Error dropping claims: {e}")
    
    print("\nRecreating claims-related tables...")
    
    # Recreate tables using SQLAlchemy models
    Base.metadata.create_all(
        bind=engine,
        tables=[
            models.Claim.__table__,
            models.ClaimLine.__table__,
            models.ClaimAttachment.__table__,
            models.ClaimProcessing.__table__,
        ]
    )
    
    print("  ✓ Created claims table")
    print("  ✓ Created claim_lines table")
    print("  ✓ Created claim_attachments table")
    print("  ✓ Created claim_processing table")
    
    print("\n✅ Claims tables recreated successfully!")
    print("\nNote: Messages and Invoices tables were not dropped as they are shared with orders.")

if __name__ == "__main__":
    recreate_claims_tables()

