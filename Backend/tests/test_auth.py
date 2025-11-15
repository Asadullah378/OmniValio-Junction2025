"""
Test authentication endpoints
"""
import pytest
from app import models
from app.auth import get_password_hash


def test_admin_login(client, admin_user):
    """Test admin login"""
    response = client.post(
        "/auth/login",
        json={"username": "admin_test", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"
    assert data["user_id"] == admin_user.user_id


def test_customer_login(client, customer_user):
    """Test customer login"""
    response = client.post(
        "/auth/login",
        json={"username": "customer_test", "password": "customer123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "customer"


def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post(
        "/auth/login",
        json={"username": "invalid", "password": "wrong"}
    )
    assert response.status_code == 401


def test_get_current_user(client, admin_token):
    """Test getting current user info"""
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin_test"
    assert data["role"] == "admin"


def test_get_current_user_unauthorized(client):
    """Test getting current user without token"""
    response = client.get("/auth/me")
    assert response.status_code == 401

