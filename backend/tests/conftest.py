"""Shared fixtures for GymSword Node.js backend tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://premium-fitness-hub-32.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "gymsword2024@gmail.com"
ADMIN_PASSWORD = "#Sword@2024"
CUSTOMER_EMAIL = "customer@gymsword.com"
CUSTOMER_PASSWORD = "Customer@2024"


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/admin-login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def customer_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASSWORD}, timeout=20)
    if r.status_code != 200:
        pytest.skip(f"Customer login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def customer_headers(customer_token):
    return {"Authorization": f"Bearer {customer_token}"}


@pytest.fixture
def fresh_user():
    """Register a fresh user and return (email, password, token, user)."""
    email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    password = "Pass1234!"
    r = requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": password, "name": "Test User"}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "password": password, "token": data["access_token"], "user": data["user"],
            "headers": {"Authorization": f"Bearer {data['access_token']}"}}
