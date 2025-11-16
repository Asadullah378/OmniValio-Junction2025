"""
End-to-end test: Complete flow from customer order to claim resolution
"""
import pytest
from app.database import SessionLocal
from app import models


def test_complete_order_to_claim_flow(client, admin_token, customer_token, products):
    """
    Complete end-to-end test:
    1. Customer browses products
    2. Customer adds items to cart with substitutes
    3. Customer places order
    4. Admin updates order status through workflow
    5. Admin replaces product with substitute
    6. Order is delivered
    7. Customer creates claim
    8. Admin processes and approves claim
    9. Customer receives refund invoice
    """
    
    # Step 1: Customer browses products
    products_response = client.get(
        "/customer/products/",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert products_response.status_code == 200
    assert len(products_response.json()) >= 3
    
    # Step 2: Customer adds items to cart with substitutes
    cart_response = client.post(
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
    assert cart_response.status_code == 200
    
    # Step 3: Customer places order
    order_response = client.post(
        "/customer/orders/",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "delivery_date": "2025-12-01",
            "delivery_window_start": "08:00",
            "delivery_window_end": "12:00"
        }
    )
    assert order_response.status_code == 200
    order_data = order_response.json()
    order_id = order_data["order_id"]
    assert order_data["status"] == "placed"
    
    # Verify order has substitutes
    order_details = client.get(
        f"/customer/orders/{order_id}",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert len(order_details.json()["order_substitutes"]) == 1
    
    # Step 4: Admin updates order status to picking
    admin_status_response = client.put(
        f"/admin/orders/{order_id}/status?status=picking&notes=Started+picking",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_status_response.status_code == 200
    assert admin_status_response.json()["status"] == "picking"
    
    # Step 5: Admin replaces product with substitute (simulating shortage)
    line_id = order_details.json()["order_lines"][0]["line_id"]
    replace_response = client.post(
        f"/admin/orders/{order_id}/replace-product?line_id={line_id}&substitute_product_code=SKU-002",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert replace_response.status_code == 200
    assert replace_response.json()["new_product_code"] == "SKU-002"
    
    # Verify modification invoice was created
    invoices = client.get(
        "/customer/payments/invoices",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    invoice_data = invoices.json()
    # Should have at least the original order invoice + modification invoice
    assert len(invoice_data) >= 2, f"Expected at least 2 invoices (order + modification), got {len(invoice_data)}: {[inv.get('invoice_type') for inv in invoice_data]}"
    # Check if modification invoice exists
    modification_invoices = [inv for inv in invoice_data if inv.get("invoice_type") == "modification"]
    assert len(modification_invoices) >= 1, f"Expected modification invoice, got: {[inv.get('invoice_type') for inv in invoice_data]}"
    
    # Step 6: Admin marks order as delivered
    client.put(
        f"/admin/orders/{order_id}/status?status=delivered&notes=Delivered+successfully",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Verify order is delivered
    final_order = client.get(
        f"/customer/orders/{order_id}",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert final_order.json()["status"] == "delivered"
    
    # Step 7: Customer creates claim
    claim_response = client.post(
        "/customer/claims/",
        headers={"Authorization": f"Bearer {customer_token}"},
        params={
            "order_id": order_id,
            "claim_type": "MISSING_ITEM",
            "description": "Received only 8 items instead of 10"
        }
    )
    assert claim_response.status_code == 200
    claim_data = claim_response.json()
    claim_id = claim_data["claim_id"]
    assert claim_data["status"] == "ai_processing"
    
    # Step 8: Admin views claims requiring manual review
    manual_review = client.get(
        "/admin/claims/manual-review",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert manual_review.status_code == 200
    assert len(manual_review.json()) > 0
    
    # Step 9: Admin approves claim
    approve_response = client.post(
        f"/admin/claims/{claim_id}/approve?refund_amount=3.00",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert approve_response.status_code == 200
    assert approve_response.json()["status"] == "approved"
    
    # Step 10: Verify refund invoice was created
    final_invoices = client.get(
        "/customer/payments/invoices",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    invoice_data = final_invoices.json()
    refund_invoices = [inv for inv in invoice_data if inv["invoice_type"] == "refund"]
    assert len(refund_invoices) > 0
    assert refund_invoices[0]["total_amount"] == 3.00
    
    # Step 11: Verify customer can see claim is approved
    claim_details = client.get(
        f"/customer/claims/{claim_id}",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert claim_details.json()["status"] == "approved"
    
    # Step 12: Verify communication messages exist
    claim_messages = client.get(
        f"/customer/claims/{claim_id}/messages",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert len(claim_messages.json()) > 0  # Admin sent approval message


def test_customer_dashboard_with_multiple_orders(client, admin_token, customer_token, products):
    """Test customer dashboard with multiple orders in different states"""
    
    # Place multiple orders
    for i in range(3):
        client.post(
            "/customer/cart/items",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"product_code": "SKU-001", "quantity": 5, "substitutes": []}
        )
        client.post(
            "/customer/orders/",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={
                "delivery_date": f"2025-12-0{i+1}",
                "delivery_window_start": "08:00",
                "delivery_window_end": "12:00"
            }
        )
    
    # Admin updates one to picking
    orders = client.get(
        "/customer/orders/",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    order_id = orders.json()[0]["order_id"]
    
    client.put(
        f"/admin/orders/{order_id}/status?status=picking",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Admin updates another to under_risk
    if len(orders.json()) > 1:
        order_id_2 = orders.json()[1]["order_id"]
        client.put(
            f"/admin/orders/{order_id_2}/status?status=under_risk",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    # Check dashboard
    dashboard = client.get(
        "/customer/dashboard/",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert dashboard.status_code == 200
    data = dashboard.json()
    assert data["stats"]["total_orders"] == 3
    assert data["stats"]["orders_in_picking"] >= 1
    assert data["stats"]["orders_at_risk"] >= 1


def test_inventory_management_flow(client, admin_token, customer_token, products):
    """Test inventory management affecting order placement"""
    
    # Check initial inventory
    inventory = client.get(
        "/admin/inventory/SKU-001",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    initial_qty = inventory.json()["quantity"]
    
    # Customer tries to order more than available
    client.post(
        "/customer/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"product_code": "SKU-001", "quantity": initial_qty + 50, "substitutes": []}
    )
    
    # Order should still be placeable (inventory check would be in frontend/ML)
    order_response = client.post(
        "/customer/orders/",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "delivery_date": "2025-12-01",
            "delivery_window_start": "08:00",
            "delivery_window_end": "12:00"
        }
    )
    assert order_response.status_code == 200
    
    # Admin updates inventory
    client.put(
        "/admin/inventory/SKU-001",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"quantity": 200}
    )
    
    # Verify inventory updated
    updated_inventory = client.get(
        "/admin/inventory/SKU-001",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert updated_inventory.json()["quantity"] == 200

