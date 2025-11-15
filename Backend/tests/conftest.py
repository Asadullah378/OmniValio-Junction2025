"""
Pytest configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

from app.database import Base, get_db
from app.main import app
from app import models
from app.auth import get_password_hash

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database override"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    user = models.User(
        user_id="ADMIN-TEST",
        username="admin_test",
        email="admin@test.com",
        hashed_password=get_password_hash("admin123"),
        role=models.UserRole.ADMIN,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def customer(db):
    """Create a customer"""
    customer = models.Customer(
        customer_id="CUST-TEST",
        name="Test Restaurant",
        segment="restaurant",
        location="Helsinki"
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@pytest.fixture
def customer_user(db, customer):
    """Create a customer user"""
    user = models.User(
        user_id="USER-TEST",
        username="customer_test",
        email="customer@test.com",
        hashed_password=get_password_hash("customer123"),
        role=models.UserRole.CUSTOMER,
        customer_id=customer.customer_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def products(db):
    """Create sample products"""
    products_list = [
        models.Product(
            product_code="SKU-001",
            product_name="Milk 1L",
            category="Dairy",
            temperature_zone="chilled",
            price=1.50
        ),
        models.Product(
            product_code="SKU-002",
            product_name="Oat Drink 1L",
            category="Dairy",
            temperature_zone="chilled",
            price=2.00
        ),
        models.Product(
            product_code="SKU-003",
            product_name="Bread Loaf",
            category="Bakery",
            temperature_zone="ambient",
            price=3.50
        ),
    ]
    
    for product in products_list:
        db.add(product)
        # Create inventory
        inventory = models.Inventory(
            product_code=product.product_code,
            quantity=100.0,
            available_quantity=100.0,
            updated_by="ADMIN-TEST"
        )
        db.add(inventory)
    
    db.commit()
    return products_list


@pytest.fixture
def admin_token(client, admin_user):
    """Get admin authentication token"""
    response = client.post(
        "/auth/login",
        json={"username": "admin_test", "password": "admin123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def customer_token(client, customer_user):
    """Get customer authentication token"""
    response = client.post(
        "/auth/login",
        json={"username": "customer_test", "password": "customer123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]

