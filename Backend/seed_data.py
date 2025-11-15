"""
Script to seed sample data for testing
"""
from app.database import SessionLocal, init_db
from app import models
from app.models import PriorityLevel, Language, ContactChannel, OrderStatus, UserRole
from app.auth import get_password_hash

# Initialize database
init_db()

db = SessionLocal()

try:
    # Create admin user
    admin_user = models.User(
        user_id="ADMIN-001",
        username="admin",
        email="admin@valioaimo.fi",
        hashed_password=get_password_hash("admin123"),  # Change in production!
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin_user)
    
    # Create sample customer
    customer = models.Customer(
        customer_id="CUST-001",
        name="Unicafe",
        segment="restaurant",
        language_preference=Language.FI,
        contact_channel=ContactChannel.VOICE_FIRST,
        no_call_before="07:00",
        accept_auto_substitutions_for_flexible_items=True,
        location="Kumpula, Helsinki"
    )
    db.add(customer)
    
    # Create customer user
    customer_user = models.User(
        user_id="USER-001",
        username="unicafe-kumpula",
        email="customer1@test.fi",
        hashed_password=get_password_hash("customer123"),
        role=UserRole.CUSTOMER,
        customer_id="CUST-001",
        is_active=True
    )
    db.add(customer_user)
    
    # Create sample products
    products = [
        models.Product(
            product_code="SKU-10001",
            product_name="Valio Milk 1L",
            category="Dairy",
            sub_category="Milk",
            temperature_zone="chilled",
            shelf_life_days=7,
            unit_size="1L",
            unit_type="bottle",
            price=1.50
        ),
        models.Product(
            product_code="SKU-10002",
            product_name="Valio Oat Drink 1L",
            category="Dairy",
            sub_category="Milk Alternative",
            temperature_zone="chilled",
            shelf_life_days=10,
            unit_size="1L",
            unit_type="carton",
            price=2.00
        ),
        models.Product(
            product_code="SKU-20001",
            product_name="Fresh Bread Loaf",
            category="Bakery",
            sub_category="Bread",
            temperature_zone="ambient",
            shelf_life_days=3,
            unit_size="500g",
            unit_type="loaf",
            price=3.50
        ),
        models.Product(
            product_code="SKU-30001",
            product_name="Frozen Chicken Breast",
            category="Meat",
            sub_category="Poultry",
            temperature_zone="frozen",
            shelf_life_days=365,
            unit_size="1kg",
            unit_type="pack",
            price=8.00
        ),
    ]
    
    for product in products:
        db.add(product)
        # Create inventory entry
        inventory = models.Inventory(
            product_code=product.product_code,
            quantity=100.0,
            available_quantity=100.0,
            updated_by="ADMIN-001"
        )
        db.add(inventory)
    
    db.commit()
    print("✅ Sample data seeded successfully!")
    print(f"   - Admin user: {admin_user.username} (password: admin123)")
    print(f"   - Customer: {customer.customer_id} ({customer.name})")
    print(f"   - Customer user: {customer_user.username} (password: customer123)")
    print(f"   - Products: {len(products)} products created with inventory")
    
except Exception as e:
    db.rollback()
    print(f"❌ Error seeding data: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()

