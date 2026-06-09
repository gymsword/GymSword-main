"""GymSword Node.js + Express backend - End-to-end API tests."""
import io
import time
import uuid
import struct
import zlib
import pytest
import requests

from conftest import BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, CUSTOMER_EMAIL, CUSTOMER_PASSWORD


# ---------------- Health & Node sanity ----------------
class TestHealth:
    def test_root_returns_node_backend(self):
        r = requests.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["app"] == "GymSword"
        assert body["status"] == "online"
        # Confirm Node/Express is serving
        assert r.headers.get("x-powered-by", "").lower() == "express"


# ---------------- Public Settings ----------------
class TestPublicSettings:
    def test_settings_public_shape(self):
        r = requests.get(f"{BASE_URL}/api/settings/public", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("coming_soon", "brand", "tagline", "support_email",
                  "show_prices", "enable_purchases", "currency", "currency_symbol"):
            assert k in d, f"missing key {k} in /api/settings/public"
        assert isinstance(d["coming_soon"], bool)
        assert isinstance(d["show_prices"], bool)
        assert isinstance(d["enable_purchases"], bool)
        assert d["currency"] == "INR"
        assert d["currency_symbol"] == "\u20b9"  # ₹


# ---------------- Products ----------------
class TestProducts:
    def test_list_products_seeded_12(self):
        r = requests.get(f"{BASE_URL}/api/products", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 12
        p = items[0]
        for k in ("id", "name", "price", "images", "category", "slug", "is_active", "created_at"):
            assert k in p, f"missing field {k} in product"

    def test_filter_by_category_men(self):
        r = requests.get(f"{BASE_URL}/api/products?category=men", timeout=20)
        assert r.status_code == 200
        for p in r.json():
            assert p["category"] == "men"

    def test_filter_by_collection_new(self):
        r = requests.get(f"{BASE_URL}/api/products?collection=new", timeout=20)
        assert r.status_code == 200
        for p in r.json():
            assert p.get("collection") == "new"

    def test_filter_by_featured(self):
        r = requests.get(f"{BASE_URL}/api/products?featured=true", timeout=20)
        assert r.status_code == 200
        for p in r.json():
            assert p.get("is_featured") is True

    def test_search_q_tee(self):
        r = requests.get(f"{BASE_URL}/api/products?q=tee", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_single_and_related(self):
        items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        pid = items[0]["id"]
        r = requests.get(f"{BASE_URL}/api/products/{pid}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == pid
        r2 = requests.get(f"{BASE_URL}/api/products/{pid}/related", timeout=15)
        assert r2.status_code == 200
        assert isinstance(r2.json(), list)


# ---------------- Reviews ----------------
class TestReviews:
    def test_list_and_post_review(self, customer_headers):
        items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        pid = items[0]["id"]
        r = requests.get(f"{BASE_URL}/api/products/{pid}/reviews", timeout=15)
        assert r.status_code == 200
        payload = {"rating": 5, "title": "Great", "body": "Loved it"}
        r2 = requests.post(f"{BASE_URL}/api/products/{pid}/reviews",
                           headers=customer_headers, json=payload, timeout=15)
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert body["rating"] == 5
        # Verify product rating/review_count updated
        prod = requests.get(f"{BASE_URL}/api/products/{pid}", timeout=15).json()
        assert prod["review_count"] >= 1
        assert 0 < prod["rating"] <= 5


# ---------------- Auth ----------------
class TestAuth:
    def test_register_returns_user_and_token(self):
        email = f"reg_{uuid.uuid4().hex[:10]}@example.com"
        r = requests.post(f"{BASE_URL}/api/auth/register",
                          json={"email": email, "password": "Pass1234!", "name": "Reg User"}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "access_token" in d and d["user"]["role"] == "user"
        assert d["user"]["email"] == email
        # password_hash must not leak
        assert "password_hash" not in d["user"]

    def test_register_duplicate_rejected(self, fresh_user):
        r = requests.post(f"{BASE_URL}/api/auth/register",
                          json={"email": fresh_user["email"], "password": "Pass1234!", "name": "Dup"},
                          timeout=15)
        assert r.status_code == 400

    def test_register_short_password_rejected(self):
        email = f"short_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{BASE_URL}/api/auth/register",
                          json={"email": email, "password": "123", "name": "X"}, timeout=15)
        assert r.status_code == 400

    def test_login_admin_through_user_login_rejected(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 403

    def test_login_user_through_admin_login_rejected(self):
        r = requests.post(f"{BASE_URL}/api/auth/admin-login",
                          json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASSWORD}, timeout=15)
        assert r.status_code == 403

    def test_me_returns_user_no_hash(self, customer_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=customer_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == CUSTOMER_EMAIL
        assert "password_hash" not in d

    def test_me_no_token_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code in (401, 403)

    def test_forgot_password_unknown_email_no_enum(self):
        r = requests.post(f"{BASE_URL}/api/auth/forgot-password",
                          json={"email": f"nobody_{uuid.uuid4().hex[:8]}@example.com"}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_forgot_then_reset_password(self):
        # Register user
        email = f"fp_{uuid.uuid4().hex[:10]}@example.com"
        pw = "Pass1234!"
        requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": pw, "name": "FP"}, timeout=15)
        # Forgot
        r = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": email}, timeout=15)
        assert r.status_code == 200
        token = r.json().get("dev_reset_token")
        assert token
        # Reset
        new_pw = "NewPass1234!"
        r2 = requests.post(f"{BASE_URL}/api/auth/reset-password",
                           json={"token": token, "new_password": new_pw}, timeout=15)
        assert r2.status_code == 200
        # Reuse should fail
        r3 = requests.post(f"{BASE_URL}/api/auth/reset-password",
                           json={"token": token, "new_password": new_pw}, timeout=15)
        assert r3.status_code == 400
        # Login with new pw
        r4 = requests.post(f"{BASE_URL}/api/auth/login",
                           json={"email": email, "password": new_pw}, timeout=15)
        assert r4.status_code == 200

    def test_reset_invalid_token(self):
        r = requests.post(f"{BASE_URL}/api/auth/reset-password",
                          json={"token": "not-a-real-token", "new_password": "Pass1234!"}, timeout=15)
        assert r.status_code == 400

    def test_profile_patch_and_change_password(self):
        email = f"pp_{uuid.uuid4().hex[:10]}@example.com"
        pw = "Pass1234!"
        r = requests.post(f"{BASE_URL}/api/auth/register",
                         json={"email": email, "password": pw, "name": "PP"}, timeout=15)
        tok = r.json()["access_token"]
        h = {"Authorization": f"Bearer {tok}"}
        r2 = requests.patch(f"{BASE_URL}/api/auth/profile",
                            headers=h, json={"name": "Renamed", "phone": "555-111"}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["name"] == "Renamed"
        # Change password
        r3 = requests.post(f"{BASE_URL}/api/auth/change-password",
                           headers=h, json={"current_password": pw, "new_password": "NewPass1234!"}, timeout=15)
        assert r3.status_code == 200
        # New login
        r4 = requests.post(f"{BASE_URL}/api/auth/login",
                           json={"email": email, "password": "NewPass1234!"}, timeout=15)
        assert r4.status_code == 200


# ---------------- Addresses ----------------
class TestAddresses:
    def test_address_crud(self, fresh_user):
        h = fresh_user["headers"]
        # Create
        body = {"full_name": "Jane", "line1": "1 Test St", "city": "X", "state": "CA", "postal_code": "94000",
                "country": "US", "phone": "5551", "is_default": True}
        r = requests.post(f"{BASE_URL}/api/auth/addresses", headers=h, json=body, timeout=15)
        assert r.status_code == 200, r.text
        addr = r.json()
        assert addr["full_name"] == "Jane"
        # List
        r2 = requests.get(f"{BASE_URL}/api/auth/addresses", headers=h, timeout=15)
        assert r2.status_code == 200
        assert any(a["id"] == addr["id"] for a in r2.json())
        # Patch
        r3 = requests.patch(f"{BASE_URL}/api/auth/addresses/{addr['id']}",
                            headers=h, json={"city": "NewCity"}, timeout=15)
        assert r3.status_code == 200
        # Verify persisted
        items = requests.get(f"{BASE_URL}/api/auth/addresses", headers=h, timeout=15).json()
        found = next(a for a in items if a["id"] == addr["id"])
        assert found["city"] == "NewCity"
        # Delete
        r4 = requests.delete(f"{BASE_URL}/api/auth/addresses/{addr['id']}", headers=h, timeout=15)
        assert r4.status_code == 200


# ---------------- Brute-force ----------------
class TestBruteForce:
    def test_5_fails_then_429(self):
        email = f"bf_{uuid.uuid4().hex[:10]}@example.com"
        # Register so identifier is meaningful (counter actually still applies on wrong password)
        requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": "RealPass1234!", "name": "BF"}, timeout=15)
        s = requests.Session()
        s.headers.update({"X-Forwarded-For": "203.0.113.99"})
        codes = []
        for _ in range(6):
            r = s.post(f"{BASE_URL}/api/auth/login",
                       json={"email": email, "password": "WrongPass!"}, timeout=15)
            codes.append(r.status_code)
        assert codes[:5] == [401, 401, 401, 401, 401], f"Expected 5x 401, got {codes}"
        assert codes[5] == 429, f"Expected 6th to be 429, got {codes}"


# ---------------- Cart / Wishlist / Coupons ----------------
class TestCart:
    def test_cart_flow(self, fresh_user):
        h = fresh_user["headers"]
        items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        pid = items[0]["id"]
        price = items[0]["price"]
        # Add 2 qty
        r = requests.post(f"{BASE_URL}/api/cart", headers=h,
                          json={"product_id": pid, "qty": 2, "size": "M", "color": "Black"}, timeout=15)
        assert r.status_code == 200, r.text
        cart = r.json()
        assert cart["count"] == 2
        assert cart["items"][0]["product"]["id"] == pid
        assert abs(cart["items"][0]["line_total"] - price * 2) < 0.01
        assert abs(cart["subtotal"] - price * 2) < 0.01
        # Patch qty
        item_id = cart["items"][0]["id"]
        r2 = requests.patch(f"{BASE_URL}/api/cart/{item_id}", headers=h, json={"qty": 3}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["count"] == 3
        # Delete
        r3 = requests.delete(f"{BASE_URL}/api/cart/{item_id}", headers=h, timeout=15)
        assert r3.status_code == 200
        assert r3.json()["count"] == 0


class TestWishlist:
    def test_add_idempotent_then_delete(self, fresh_user):
        h = fresh_user["headers"]
        items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        pid = items[1]["id"]
        r1 = requests.post(f"{BASE_URL}/api/wishlist", headers=h, json={"product_id": pid}, timeout=15)
        assert r1.status_code == 200
        r2 = requests.post(f"{BASE_URL}/api/wishlist", headers=h, json={"product_id": pid}, timeout=15)
        assert r2.status_code == 200
        assert r2.json().get("already") is True
        r3 = requests.delete(f"{BASE_URL}/api/wishlist/{pid}", headers=h, timeout=15)
        assert r3.status_code == 200


class TestCoupons:
    def test_apply_welcome10(self):
        r = requests.post(f"{BASE_URL}/api/coupons/apply",
                          json={"code": "WELCOME10", "subtotal": 100.0}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["code"] == "WELCOME10"
        assert abs(d["discount"] - 10.0) < 0.01

    def test_apply_forge20_min_subtotal(self):
        # Below new INR min (12000)
        r1 = requests.post(f"{BASE_URL}/api/coupons/apply",
                           json={"code": "FORGE20", "subtotal": 5000.0}, timeout=15)
        assert r1.status_code == 400, r1.text
        # Above min
        r2 = requests.post(f"{BASE_URL}/api/coupons/apply",
                          json={"code": "FORGE20", "subtotal": 15000.0}, timeout=15)
        assert r2.status_code == 200, r2.text
        assert abs(r2.json()["discount"] - 3000.0) < 0.01  # 20% of 15000

    def test_invalid_coupon(self):
        r = requests.post(f"{BASE_URL}/api/coupons/apply",
                          json={"code": "BOGUS_NO_SUCH", "subtotal": 50.0}, timeout=15)
        assert r.status_code == 404


# ---------------- Checkout & Orders ----------------
class TestCheckout:
    def test_checkout_and_orders(self, fresh_user):
        h = fresh_user["headers"]
        items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        pid = items[0]["id"]
        requests.post(f"{BASE_URL}/api/cart", headers=h,
                      json={"product_id": pid, "qty": 1}, timeout=15)
        addr = {"full_name": "John", "line1": "1 Main", "city": "SF", "state": "CA",
                "postal_code": "94000", "country": "US", "phone": "1"}
        r = requests.post(f"{BASE_URL}/api/orders/checkout", headers=h,
                          json={"address": addr, "payment_method": "card"}, timeout=20)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["order_number"].startswith("GS-")
        assert order["status"] == "confirmed"
        assert order["payment_status"] == "paid"
        # Cart cleared
        cart = requests.get(f"{BASE_URL}/api/cart", headers=h, timeout=15).json()
        assert cart["count"] == 0
        # Orders list
        rl = requests.get(f"{BASE_URL}/api/orders", headers=h, timeout=15)
        assert rl.status_code == 200
        assert any(o["id"] == order["id"] for o in rl.json())
        # Order detail
        rd = requests.get(f"{BASE_URL}/api/orders/{order['id']}", headers=h, timeout=15)
        assert rd.status_code == 200
        # Track (public, no auth)
        rt = requests.get(f"{BASE_URL}/api/orders/track/{order['order_number']}", timeout=15)
        assert rt.status_code == 200
        # Should not leak user_id
        assert "user_id" not in rt.json()

    def test_checkout_stripe_endpoint_exists(self, fresh_user):
        """Stripe key is placeholder; expect 400/500 with Stripe error, NOT 404."""
        h = fresh_user["headers"]
        items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        pid = items[0]["id"]
        requests.post(f"{BASE_URL}/api/cart", headers=h,
                      json={"product_id": pid, "qty": 1}, timeout=15)
        addr = {"full_name": "Jane", "line1": "1 St", "city": "X", "state": "CA",
                "postal_code": "9", "country": "US", "phone": "1"}
        r = requests.post(f"{BASE_URL}/api/orders/checkout-stripe", headers=h,
                          json={"address": addr}, timeout=20)
        assert r.status_code != 404, "Endpoint must exist"
        # Expected: Stripe API error since STRIPE_SECRET_KEY is placeholder 'sk_test_emergent'.
        # Stripe returns 401 "Invalid API Key" - Node Express forwards that status verbatim.
        assert r.status_code in (400, 401, 402, 500, 502), f"Got {r.status_code}: {r.text}"
        # Body must contain Stripe error message (not a routing/404 error)
        assert "api key" in r.text.lower() or "stripe" in r.text.lower() or "invalid" in r.text.lower(), r.text


# ---------------- Admin ----------------
def _make_png_bytes():
    # 1x1 png
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00"
    ihdr_crc = struct.pack(">I", zlib.crc32(b"IHDR" + ihdr))
    ihdr_chunk = struct.pack(">I", 13) + b"IHDR" + ihdr + ihdr_crc
    raw = b"\x00\xff\x00\x00"
    comp = zlib.compress(raw)
    idat_crc = struct.pack(">I", zlib.crc32(b"IDAT" + comp))
    idat_chunk = struct.pack(">I", len(comp)) + b"IDAT" + comp + idat_crc
    iend_crc = struct.pack(">I", zlib.crc32(b"IEND"))
    iend_chunk = struct.pack(">I", 0) + b"IEND" + iend_crc
    return sig + ihdr_chunk + idat_chunk + iend_chunk


class TestAdmin:
    def test_stats_shape(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_orders", "total_users", "total_products", "total_revenue",
                  "recent_orders", "revenue_trend", "top_products"):
            assert k in d

    def test_regular_user_cannot_admin(self, customer_headers):
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=customer_headers, timeout=15)
        assert r.status_code == 403

    def test_admin_product_crud(self, admin_headers):
        body = {"name": "TEST_AdminProduct", "price": 19.99, "category": "men",
                "description": "test", "images": [], "colors": [], "sizes": [], "tags": []}
        r = requests.post(f"{BASE_URL}/api/admin/products", headers=admin_headers, json=body, timeout=15)
        assert r.status_code == 200
        prod = r.json()
        pid = prod["id"]
        assert prod["slug"]
        r2 = requests.patch(f"{BASE_URL}/api/admin/products/{pid}", headers=admin_headers,
                            json={"price": 29.99}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["price"] == 29.99
        r3 = requests.delete(f"{BASE_URL}/api/admin/products/{pid}", headers=admin_headers, timeout=15)
        assert r3.status_code == 200

    def test_admin_regular_user_cant_post_product(self, customer_headers):
        r = requests.post(f"{BASE_URL}/api/admin/products", headers=customer_headers,
                          json={"name": "X", "price": 1, "category": "men"}, timeout=15)
        assert r.status_code == 403

    def test_admin_upload_and_file_serve(self, admin_headers):
        png = _make_png_bytes()
        files = {"file": ("test.png", png, "image/png")}
        r = requests.post(f"{BASE_URL}/api/admin/uploads", headers=admin_headers,
                          files=files, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "path" in d and "url" in d
        assert d["url"] == f"/api/files/{d['path']}"
        # Fetch file (no /api prefix duplication)
        r2 = requests.get(f"{BASE_URL}{d['url']}", timeout=20)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")
        assert r2.content[:8] == b"\x89PNG\r\n\x1a\n"

    def test_admin_coupons_crud(self, admin_headers):
        code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        body = {"code": code, "discount_type": "percent", "discount_value": 5,
                "is_active": True, "min_subtotal": 0}
        r = requests.post(f"{BASE_URL}/api/admin/coupons", headers=admin_headers, json=body, timeout=15)
        assert r.status_code == 200
        cid = r.json()["id"]
        # duplicate rejected
        r_dup = requests.post(f"{BASE_URL}/api/admin/coupons", headers=admin_headers, json=body, timeout=15)
        assert r_dup.status_code == 400
        # list
        rl = requests.get(f"{BASE_URL}/api/admin/coupons", headers=admin_headers, timeout=15)
        assert rl.status_code == 200
        assert any(c["code"] == code for c in rl.json())
        # delete
        rd = requests.delete(f"{BASE_URL}/api/admin/coupons/{cid}", headers=admin_headers, timeout=15)
        assert rd.status_code == 200

    def test_admin_orders_and_status(self, admin_headers, customer_headers):
        # Make customer place an order to ensure something exists
        items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        requests.post(f"{BASE_URL}/api/cart", headers=customer_headers,
                      json={"product_id": items[2]["id"], "qty": 1}, timeout=15)
        addr = {"full_name": "C", "line1": "X", "city": "Y", "state": "Z",
                "postal_code": "1", "country": "US", "phone": "1"}
        cr = requests.post(f"{BASE_URL}/api/orders/checkout", headers=customer_headers,
                           json={"address": addr, "payment_method": "card"}, timeout=20)
        assert cr.status_code == 200
        order_id = cr.json()["id"]
        # admin lists
        rl = requests.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers, timeout=20)
        assert rl.status_code == 200
        assert any(o["id"] == order_id for o in rl.json())
        # update status
        ru = requests.patch(f"{BASE_URL}/api/admin/orders/{order_id}/status",
                            headers=admin_headers, json={"status": "shipped"}, timeout=15)
        assert ru.status_code == 200
        # verify history
        det = requests.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers, timeout=20).json()
        o = next(o for o in det if o["id"] == order_id)
        assert o["status"] == "shipped"
        assert any(h["status"] == "shipped" for h in o.get("history", []))

    def test_admin_customers(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/customers", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        if arr:
            assert "order_count" in arr[0] and "total_spent" in arr[0]
            # no password_hash leak
            assert "password_hash" not in arr[0]


# ---------------- Settings (Admin toggle) ----------------
class TestSettings:
    def test_admin_settings_get_reflects_env(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/settings", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "coming_soon_env" in d
        assert isinstance(d["coming_soon_env"], bool)

    def test_admin_toggle_coming_soon_and_public_reflects(self, admin_headers):
        # Set false
        r1 = requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                            json={"coming_soon": False}, timeout=15)
        assert r1.status_code == 200
        rp = requests.get(f"{BASE_URL}/api/settings/public", timeout=15)
        assert rp.json()["coming_soon"] is False
        # Set true
        r2 = requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                            json={"coming_soon": True}, timeout=15)
        assert r2.status_code == 200
        rp2 = requests.get(f"{BASE_URL}/api/settings/public", timeout=15)
        assert rp2.json()["coming_soon"] is True


# ---------------- Contact form ----------------
class TestContact:
    def test_contact_post_and_admin_crud(self, admin_headers):
        payload = {"name": "TestSender", "email": "sender@example.com",
                   "subject": "Hello", "message": "A test message"}
        r = requests.post(f"{BASE_URL}/api/contact", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        msg_id = r.json()["id"]
        # admin list
        rl = requests.get(f"{BASE_URL}/api/admin/contact-messages",
                          headers=admin_headers, timeout=15)
        assert rl.status_code == 200
        found = next((m for m in rl.json() if m["id"] == msg_id), None)
        assert found is not None
        assert found["status"] == "new"
        assert found["email"] == "sender@example.com"
        # patch status
        rp = requests.patch(f"{BASE_URL}/api/admin/contact-messages/{msg_id}",
                            headers=admin_headers, json={"status": "read"}, timeout=15)
        assert rp.status_code == 200
        items = requests.get(f"{BASE_URL}/api/admin/contact-messages",
                             headers=admin_headers, timeout=15).json()
        found2 = next(m for m in items if m["id"] == msg_id)
        assert found2["status"] == "read"
        # delete
        rd = requests.delete(f"{BASE_URL}/api/admin/contact-messages/{msg_id}",
                             headers=admin_headers, timeout=15)
        assert rd.status_code == 200
        items2 = requests.get(f"{BASE_URL}/api/admin/contact-messages",
                              headers=admin_headers, timeout=15).json()
        assert not any(m["id"] == msg_id for m in items2)

    def test_contact_requires_email_message(self):
        r = requests.post(f"{BASE_URL}/api/contact", json={"name": "x"}, timeout=15)
        assert r.status_code == 400


# ---------------- Newsletter ----------------
class TestNewsletter:
    def test_newsletter_idempotent(self):
        email = f"news_{uuid.uuid4().hex[:8]}@example.com"
        r1 = requests.post(f"{BASE_URL}/api/newsletter", json={"email": email}, timeout=15)
        assert r1.status_code == 200
        r2 = requests.post(f"{BASE_URL}/api/newsletter", json={"email": email}, timeout=15)
        assert r2.status_code == 200


# ---------------- Role enforcement ----------------
class TestRoleEnforcement:
    @pytest.mark.parametrize("method,path", [
        ("get", "/api/admin/stats"),
        ("get", "/api/admin/products"),
        ("get", "/api/admin/orders"),
        ("get", "/api/admin/customers"),
        ("get", "/api/admin/coupons"),
        ("get", "/api/admin/settings"),
        ("get", "/api/admin/contact-messages"),
    ])
    def test_user_cannot_access_admin(self, customer_headers, method, path):
        r = requests.request(method, f"{BASE_URL}{path}", headers=customer_headers, timeout=15)
        assert r.status_code == 403, f"{method.upper()} {path} expected 403 got {r.status_code}"


# ---------------- INR Migration ----------------
class TestINRMigration:
    def test_products_are_INR(self):
        r = requests.get(f"{BASE_URL}/api/products", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 12
        for p in items:
            assert p.get("currency") == "INR", f"product {p['name']} currency={p.get('currency')}"
            # INR price should be much higher than the USD equivalents (>= 800 for cheapest)
            assert p["price"] >= 800, f"{p['name']} price={p['price']} looks like USD, not INR"
            if p.get("compare_at_price"):
                assert p["compare_at_price"] >= 800

    def test_sword_sculpt_tee_inr_price(self):
        # Original USD $68 * 83 = 5644. Product is "Sword Sculpt Compression Tee".
        all_items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        tee = next((p for p in all_items if "Sword Sculpt" in p.get("name", "") and "Tee" in p.get("name", "")), None)
        assert tee is not None, "Sword Sculpt Tee not found"
        assert tee["currency"] == "INR"
        # USD 68 * 83 = 5644
        assert 5500 <= tee["price"] <= 5700, f"got price {tee['price']}, expected ~5644"


# ---------------- Admin Launch Controls (show_prices, enable_purchases) ----------------
class TestLaunchControls:
    def test_patch_show_prices_persists(self, admin_headers):
        # toggle off
        r = requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                           json={"show_prices": False}, timeout=15)
        assert r.status_code == 200, r.text
        rp = requests.get(f"{BASE_URL}/api/settings/public", timeout=15).json()
        assert rp["show_prices"] is False
        # restore
        r2 = requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                            json={"show_prices": True}, timeout=15)
        assert r2.status_code == 200
        rp2 = requests.get(f"{BASE_URL}/api/settings/public", timeout=15).json()
        assert rp2["show_prices"] is True

    def test_patch_enable_purchases_persists(self, admin_headers):
        r = requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                           json={"enable_purchases": False}, timeout=15)
        assert r.status_code == 200
        rp = requests.get(f"{BASE_URL}/api/settings/public", timeout=15).json()
        assert rp["enable_purchases"] is False
        # restore
        r2 = requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                            json={"enable_purchases": True}, timeout=15)
        assert r2.status_code == 200
        rp2 = requests.get(f"{BASE_URL}/api/settings/public", timeout=15).json()
        assert rp2["enable_purchases"] is True

    def test_patch_settings_idempotent(self, admin_headers):
        """Setting one field must not wipe other fields."""
        # Set show_prices=false
        requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                       json={"show_prices": False}, timeout=15)
        # Then independently set coming_soon=true
        requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                       json={"coming_soon": True}, timeout=15)
        rp = requests.get(f"{BASE_URL}/api/settings/public", timeout=15).json()
        # Both should be reflected
        assert rp["show_prices"] is False, "show_prices wiped by later coming_soon patch"
        assert rp["coming_soon"] is True
        # restore show_prices
        requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                       json={"show_prices": True}, timeout=15)


# ---------------- Purchases Disabled (423) ----------------
class TestPurchasesDisabled:
    def test_cart_and_checkout_blocked_with_423(self, admin_headers, fresh_user):
        h = fresh_user["headers"]
        # Disable purchases
        rp = requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                            json={"enable_purchases": False}, timeout=15)
        assert rp.status_code == 200
        try:
            items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
            pid = items[0]["id"]
            # POST /api/cart -> 423
            rc = requests.post(f"{BASE_URL}/api/cart", headers=h,
                               json={"product_id": pid, "qty": 1}, timeout=15)
            assert rc.status_code == 423, f"cart got {rc.status_code}: {rc.text}"
            body = rc.json()
            assert "disabled" in (body.get("detail") or "").lower()

            addr = {"full_name": "J", "line1": "1", "city": "X", "state": "Y",
                    "postal_code": "1", "country": "IN", "phone": "1"}
            # POST /api/orders/checkout -> 423
            rk = requests.post(f"{BASE_URL}/api/orders/checkout", headers=h,
                               json={"address": addr, "payment_method": "cod"}, timeout=15)
            assert rk.status_code == 423, f"checkout got {rk.status_code}: {rk.text}"

            # POST /api/orders/checkout-stripe -> 423
            rs = requests.post(f"{BASE_URL}/api/orders/checkout-stripe", headers=h,
                               json={"address": addr}, timeout=15)
            assert rs.status_code == 423, f"checkout-stripe got {rs.status_code}: {rs.text}"
        finally:
            # ALWAYS restore
            requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                           json={"enable_purchases": True}, timeout=15)

        # After restore, cart works
        items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        rc2 = requests.post(f"{BASE_URL}/api/cart", headers=h,
                            json={"product_id": items[0]["id"], "qty": 1}, timeout=15)
        assert rc2.status_code == 200, rc2.text


# ---------------- INR Checkout math ----------------
class TestINRCheckoutMath:
    def test_checkout_totals_inr(self, fresh_user):
        h = fresh_user["headers"]
        items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        # pick a cheap product so subtotal < 4999 to verify shipping=499
        cheap = sorted(items, key=lambda p: p["price"])[0]
        requests.post(f"{BASE_URL}/api/cart", headers=h,
                      json={"product_id": cheap["id"], "qty": 1}, timeout=15)
        addr = {"full_name": "I", "line1": "1", "city": "Mumbai", "state": "MH",
                "postal_code": "400001", "country": "IN", "phone": "1"}
        r = requests.post(f"{BASE_URL}/api/orders/checkout", headers=h,
                          json={"address": addr, "payment_method": "cod"}, timeout=20)
        assert r.status_code == 200, r.text
        order = r.json()
        subtotal = order["subtotal"]
        discount = order.get("discount", 0)
        # shipping rule: 0 if subtotal>4999 else 499
        expected_shipping = 0 if subtotal > 4999 else 499
        assert order["shipping"] == expected_shipping, \
            f"shipping {order['shipping']} != expected {expected_shipping} for subtotal {subtotal}"
        # tax = 18% of (subtotal-discount), rounded to 2dp
        expected_tax = round((subtotal - discount) * 0.18, 2)
        assert abs(order["tax"] - expected_tax) < 0.05, \
            f"tax {order['tax']} != expected {expected_tax}"
        # total = subtotal - discount + shipping + tax
        expected_total = round(subtotal - discount + order["shipping"] + order["tax"], 2)
        assert abs(order["total"] - expected_total) < 0.05

    def test_checkout_free_shipping_above_4999(self, fresh_user):
        h = fresh_user["headers"]
        items = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        # pick the most expensive product to get subtotal > 4999
        expensive = sorted(items, key=lambda p: -p["price"])[0]
        qty = 1 if expensive["price"] > 4999 else (5000 // int(expensive["price"]) + 1)
        requests.post(f"{BASE_URL}/api/cart", headers=h,
                      json={"product_id": expensive["id"], "qty": qty}, timeout=15)
        addr = {"full_name": "I", "line1": "1", "city": "Mumbai", "state": "MH",
                "postal_code": "400001", "country": "IN", "phone": "1"}
        r = requests.post(f"{BASE_URL}/api/orders/checkout", headers=h,
                          json={"address": addr, "payment_method": "cod"}, timeout=20)
        assert r.status_code == 200, r.text
        order = r.json()
        if order["subtotal"] > 4999:
            assert order["shipping"] == 0, f"expected free shipping, got {order['shipping']}"


# ---------------- Final teardown - restore settings ----------------
class TestZZZRestoreSettings:
    """Runs last (alphabetical) - ensures launch state is restored."""
    def test_restore_launch_defaults(self, admin_headers):
        r = requests.patch(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                           json={"coming_soon": True, "show_prices": True, "enable_purchases": True},
                           timeout=15)
        assert r.status_code == 200
        d = requests.get(f"{BASE_URL}/api/settings/public", timeout=15).json()
        assert d["coming_soon"] is True
        assert d["show_prices"] is True
        assert d["enable_purchases"] is True

