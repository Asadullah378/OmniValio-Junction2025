"""
Test complete admin flow: manage orders, inventory, claims, customers
"""
import pytest


def test_admin_view_all_orders(client, admin_token, customer_token, products):
    """Test admin viewing all orders"""
    # Customer places order
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
    
    # Admin views orders
    response = client.get(
        "/admin/orders/",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0


def test_admin_update_order_status(client, admin_token, customer_token, products):
    """Test admin updating order status"""
    # Customer places order
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
    
    # Admin updates status
    response = client.put(
        f"/admin/orders/{order_id}/status?status=picking&notes=Started+picking",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "picking"


def test_admin_replace_product_with_substitute(client, admin_token, customer_token, products):
    """Test admin replacing product with customer's selected substitute"""
    # Customer adds item with substitute to cart
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
    
    # Customer places order
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
    
    # Get order line ID
    order_details = client.get(
        f"/customer/orders/{order_id}",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    line_id = order_details.json()["order_lines"][0]["line_id"]
    
    # Admin replaces product with substitute
    response = client.post(
        f"/admin/orders/{order_id}/replace-product?line_id={line_id}&substitute_product_code=SKU-002",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["new_product_code"] == "SKU-002"
    assert data["old_product_code"] == "SKU-001"


def test_admin_manage_inventory(client, admin_token, products):
    """Test admin managing inventory"""
    # Get inventory
    response = client.get(
        "/admin/inventory/",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert len(response.json()) == 3
    
    # Update inventory
    response = client.put(
        "/admin/inventory/SKU-001",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"quantity": 150}
    )
    assert response.status_code == 200
    assert response.json()["quantity"] == 150
    assert response.json()["available_quantity"] == 150


def test_admin_create_product(client, admin_token):
    """Test admin creating a product"""
    response = client.post(
        "/admin/products/",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "product_code": "SKU-NEW",
            "product_name": "New Product",
            "category": "Test",
            "temperature_zone": "ambient",
            "price": 5.00
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["product_code"] == "SKU-NEW"
    assert data["product_name"] == "New Product"


def test_admin_create_customer(client, admin_token):
    """Test admin creating a customer"""
    response = client.post(
        "/admin/customers/",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "customer_id": "CUST-NEW",
            "name": "New Restaurant",
            "segment": "restaurant",
            "location": "Tampere"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["customer_id"] == "CUST-NEW"
    assert data["name"] == "New Restaurant"


def test_admin_create_customer_user(client, admin_token):
    """Test admin creating user account for customer"""
    # First create customer
    client.post(
        "/admin/customers/",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "customer_id": "CUST-NEW",
            "name": "New Restaurant",
            "segment": "restaurant"
        }
    )
    
    # Create user
    response = client.post(
        f"/admin/customers/CUST-NEW/user?username=newuser&email=newuser@test.com&password=password123",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "newuser"
    assert data["role"] == "customer"
    assert data["customer_id"] == "CUST-NEW"


def test_admin_view_claims(client, admin_token, customer_token, products, db):
    """Test admin viewing claims"""
    # Customer places and delivers order
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
    
    # Mark as delivered using admin endpoint
    client.put(
        f"/admin/orders/{order_id}/status?status=delivered&notes=Delivered+for+test",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Customer creates claim
    claim_response = client.post(
        "/customer/claims/",
        headers={"Authorization": f"Bearer {customer_token}"},
        params={
            "order_id": order_id,
            "claim_type": "MISSING_ITEM",
            "description": "Missing items"
        }
    )
    claim_id = claim_response.json()["claim_id"]
    
    # Admin views claims
    response = client.get(
        "/admin/claims/",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert any(c["claim_id"] == claim_id for c in data)


def test_admin_approve_claim(client, admin_token, customer_token, products, db):
    """Test admin approving a claim"""
    # Customer places and delivers order
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
    
    # Mark as delivered using admin endpoint
    client.put(
        f"/admin/orders/{order_id}/status?status=delivered&notes=Delivered+for+test",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Customer creates claim
    claim_response = client.post(
        "/customer/claims/",
        headers={"Authorization": f"Bearer {customer_token}"},
        params={
            "order_id": order_id,
            "claim_type": "MISSING_ITEM",
            "description": "Missing items"
        }
    )
    claim_id = claim_response.json()["claim_id"]
    
    # Admin approves claim
    response = client.post(
        f"/admin/claims/{claim_id}/approve?refund_amount=10.0",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    assert data["credit_amount"] == 10.0


def test_admin_send_order_message(client, admin_token, customer_token, products):
    """Test admin sending message for order"""
    # Customer places order
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
    
    # Admin sends message
    response = client.post(
        f"/admin/orders/{order_id}/messages",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"content": "Your order is being processed"}
    )
    assert response.status_code == 200
    assert response.json()["content"] == "Your order is being processed"

