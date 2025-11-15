"""
Test complete customer flow: browse products -> add to cart -> place order -> create claim
"""
import pytest


def test_customer_browse_products(client, customer_token, products):
    """Test customer browsing products"""
    response = client.get(
        "/customer/products/",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert any(p["product_code"] == "SKU-001" for p in data)


def test_customer_get_product_details(client, customer_token, products):
    """Test getting product details"""
    response = client.get(
        "/customer/products/SKU-001",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["product_code"] == "SKU-001"
    assert data["product_name"] == "Milk 1L"


def test_customer_get_product_risk(client, customer_token, products):
    """Test getting product risk evaluation"""
    response = client.get(
        "/customer/products/SKU-001/risk",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert "risk_level" in data


def test_customer_get_similar_products(client, customer_token, products):
    """Test getting similar products"""
    response = client.get(
        "/customer/products/SKU-001/similar",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    # Should return products in same category
    assert all(p["category"] == "Dairy" for p in data)


def test_customer_add_to_cart(client, customer_token, products):
    """Test adding items to cart with substitutes"""
    response = client.post(
        "/customer/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "product_code": "SKU-001",
            "quantity": 10,
            "substitutes": [
                {"substitute_product_code": "SKU-002", "priority": 1}
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["product_code"] == "SKU-001"
    assert data["quantity"] == 10


def test_customer_get_cart(client, customer_token, products):
    """Test getting cart"""
    # First add item
    client.post(
        "/customer/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"product_code": "SKU-001", "quantity": 10, "substitutes": []}
    )
    
    response = client.get(
        "/customer/cart/",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["product_code"] == "SKU-001"


def test_customer_place_order(client, customer_token, products):
    """Test placing order from cart"""
    # Add items to cart
    client.post(
        "/customer/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "product_code": "SKU-001",
            "quantity": 10,
            "substitutes": [
                {"substitute_product_code": "SKU-002", "priority": 1}
            ]
        }
    )
    client.post(
        "/customer/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"product_code": "SKU-003", "quantity": 5, "substitutes": []}
    )
    
    # Place order
    response = client.post(
        "/customer/orders/",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "delivery_date": "2025-12-01",
            "delivery_window_start": "08:00",
            "delivery_window_end": "12:00"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "order_id" in data
    assert data["status"] == "placed"
    assert data["customer_id"] == "CUST-TEST"
    
    # Verify cart is cleared
    cart_response = client.get(
        "/customer/cart/",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert len(cart_response.json()["items"]) == 0


def test_customer_view_orders(client, customer_token, products):
    """Test viewing customer orders"""
    # Place an order first
    client.post(
        "/customer/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"product_code": "SKU-001", "quantity": 5, "substitutes": []}
    )
    order_response = client.post(
        "/customer/orders/",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "delivery_date": "2025-12-01",
            "delivery_window_start": "08:00",
            "delivery_window_end": "12:00"
        }
    )
    order_id = order_response.json()["order_id"]
    
    # Get orders
    response = client.get(
        "/customer/orders/",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert any(o["order_id"] == order_id for o in data)


def test_customer_get_order_details(client, customer_token, products):
    """Test getting order details"""
    # Place order
    client.post(
        "/customer/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"product_code": "SKU-001", "quantity": 5, "substitutes": []}
    )
    order_response = client.post(
        "/customer/orders/",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "delivery_date": "2025-12-01",
            "delivery_window_start": "08:00",
            "delivery_window_end": "12:00"
        }
    )
    order_id = order_response.json()["order_id"]
    
    # Get order details
    response = client.get(
        f"/customer/orders/{order_id}",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["order_id"] == order_id
    assert len(data["order_lines"]) > 0


def test_customer_order_messages(client, customer_token, products):
    """Test order communication"""
    # Place order
    client.post(
        "/customer/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"product_code": "SKU-001", "quantity": 5, "substitutes": []}
    )
    order_response = client.post(
        "/customer/orders/",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "delivery_date": "2025-12-01",
            "delivery_window_start": "08:00",
            "delivery_window_end": "12:00"
        }
    )
    order_id = order_response.json()["order_id"]
    
    # Send message
    response = client.post(
        f"/customer/orders/{order_id}/messages",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"content": "When will this be delivered?"}
    )
    assert response.status_code == 200
    
    # Get messages
    messages_response = client.get(
        f"/customer/orders/{order_id}/messages",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert messages_response.status_code == 200
    assert len(messages_response.json()) == 1


def test_customer_dashboard(client, customer_token, products):
    """Test customer dashboard"""
    # Place an order first
    client.post(
        "/customer/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"product_code": "SKU-001", "quantity": 5, "substitutes": []}
    )
    client.post(
        "/customer/orders/",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "delivery_date": "2025-12-01",
            "delivery_window_start": "08:00",
            "delivery_window_end": "12:00"
        }
    )
    
    response = client.get(
        "/customer/dashboard/",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "customer" in data
    assert "stats" in data
    assert "recent_orders" in data
    assert data["stats"]["total_orders"] >= 1


def test_customer_create_claim(client, customer_token, products, db):
    """Test creating a claim for delivered order"""
    # Place order
    client.post(
        "/customer/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"product_code": "SKU-001", "quantity": 5, "substitutes": []}
    )
    order_response = client.post(
        "/customer/orders/",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "delivery_date": "2025-12-01",
            "delivery_window_start": "08:00",
            "delivery_window_end": "12:00"
        }
    )
    order_id = order_response.json()["order_id"]
    
    # Mark order as delivered - need to use admin token for this
    # For this test, we'll use the db fixture to update directly
    from app import models
    # Get order from the test database session
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if order:
        order.status = models.OrderStatus.DELIVERED
        db.commit()
    
    # Create claim
    response = client.post(
        "/customer/claims/",
        headers={"Authorization": f"Bearer {customer_token}"},
        params={
            "order_id": order_id,
            "claim_type": "MISSING_ITEM",
            "description": "Missing 2 items"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["claim_type"] == "MISSING_ITEM"
    assert data["status"] == "ai_processing"


def test_customer_view_invoices(client, customer_token, products):
    """Test viewing invoices"""
    # Place order (creates invoice)
    client.post(
        "/customer/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"product_code": "SKU-001", "quantity": 5, "substitutes": []}
    )
    client.post(
        "/customer/orders/",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "delivery_date": "2025-12-01",
            "delivery_window_start": "08:00",
            "delivery_window_end": "12:00"
        }
    )
    
    response = client.get(
        "/customer/payments/invoices",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["invoice_type"] == "order"

