from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Header
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import os
import logging
import uuid
import bcrypt
import jwt
import secrets
# from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import asyncio

mongo_url = os.environ.get("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ.get("DB_NAME")
if not db_name:
    raise Exception("Missing DB_NAME")

db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_oauth(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user:
        return None
    user.pop("password_hash", None)
    return user

async def get_authenticated_user(request: Request) -> dict:
    jwt_user = None
    oauth_user = None
    
    try:
        jwt_user = await get_current_user(request)
    except:
        pass
    
    if not jwt_user:
        oauth_user = await get_current_user_oauth(request)
    
    user = jwt_user or oauth_user
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@iphonestore.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email}, {"_id": 0})
    if existing is None:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "user_id": user_id,
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
    
    test_user_email = "test@iphonestore.com"
    test_user = await db.users.find_one({"email": test_user_email}, {"_id": 0})
    if not test_user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": test_user_email,
            "password_hash": hash_password("test123"),
            "name": "Test User",
            "role": "user",
            "created_at": datetime.now(timezone.utc)
        })
    
    credentials_content = f"""# Test Credentials for iPhone Store

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Test User Account
- Email: test@iphonestore.com
- Password: test123
- Role: user

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/google/session
- GET /api/auth/google/me
"""
    
BASE_DIR = Path(__file__).parent

memory_path = BASE_DIR / "memory"
memory_path.mkdir(exist_ok=True)

(memory_path / "test_credentials.md").write_text(credentials_content)

async def seed_products():
    count = await db.products.count_documents({})
    if count == 0:
        products = [
            {
                "product_id": f"prod_{uuid.uuid4().hex[:12]}",
                "name": "iPhone 16 Pro Max",
                "description": "The ultimate iPhone with advanced camera system, A18 Pro chip, and stunning titanium design.",
                "variants": [
                    {"storage": "256GB", "color": "Natural Titanium", "price": 1199.00, "stock": 50},
                    {"storage": "512GB", "color": "Natural Titanium", "price": 1399.00, "stock": 40},
                    {"storage": "1TB", "color": "Natural Titanium", "price": 1599.00, "stock": 30},
                    {"storage": "256GB", "color": "Blue Titanium", "price": 1199.00, "stock": 45},
                    {"storage": "512GB", "color": "Blue Titanium", "price": 1399.00, "stock": 35},
                ],
                "features": ["A18 Pro chip", "48MP camera system", "Titanium design", "Action button"],
                "category": "flagship",
                "image": "https://static.prod-images.emergentagent.com/jobs/a4d3fad4-3db0-44f5-a5ce-de38fedecc5b/images/2c1c50bdfe2bbb379e252e56a91233f62daf65090440c5a8b686e9439567fd4e.png",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "product_id": f"prod_{uuid.uuid4().hex[:12]}",
                "name": "iPhone 16 Pro",
                "description": "Pro performance with advanced features in a more compact size.",
                "variants": [
                    {"storage": "128GB", "color": "Desert Titanium", "price": 999.00, "stock": 60},
                    {"storage": "256GB", "color": "Desert Titanium", "price": 1099.00, "stock": 55},
                    {"storage": "512GB", "color": "Desert Titanium", "price": 1299.00, "stock": 40},
                    {"storage": "128GB", "color": "White Titanium", "price": 999.00, "stock": 50},
                ],
                "features": ["A18 Pro chip", "Pro camera system", "6.3 display"],
                "category": "flagship",
                "image": "https://images.unsplash.com/photo-1727079525588-4638ea8301e0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHw0fHxpcGhvbmUlMjBwcm8lMjBtYXh8ZW58MHx8fHwxNzc1MjM5NzgxfDA&ixlib=rb-4.1.0&q=85",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "product_id": f"prod_{uuid.uuid4().hex[:12]}",
                "name": "iPhone 16",
                "description": "The perfect balance of performance and value with the powerful A18 chip.",
                "variants": [
                    {"storage": "128GB", "color": "Black", "price": 799.00, "stock": 80},
                    {"storage": "256GB", "color": "Black", "price": 899.00, "stock": 70},
                    {"storage": "512GB", "color": "Black", "price": 1099.00, "stock": 50},
                    {"storage": "128GB", "color": "Pink", "price": 799.00, "stock": 75},
                    {"storage": "256GB", "color": "Pink", "price": 899.00, "stock": 60},
                ],
                "features": ["A18 chip", "Dual camera system", "All-day battery"],
                "category": "standard",
                "image": "https://images.unsplash.com/photo-1727079513748-d03e7b8c8947?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHxpcGhvbmUlMjBwcm8lMjBtYXh8ZW58MHx8fHwxNzc1MjM5NzgxfDA&ixlib=rb-4.1.0&q=85",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "product_id": f"prod_{uuid.uuid4().hex[:12]}",
                "name": "iPhone 15",
                "description": "Last year's flagship, still incredibly powerful with premium features.",
                "variants": [
                    {"storage": "128GB", "color": "Blue", "price": 699.00, "stock": 90},
                    {"storage": "256GB", "color": "Blue", "price": 799.00, "stock": 80},
                    {"storage": "128GB", "color": "Green", "price": 699.00, "stock": 85},
                ],
                "features": ["A16 Bionic chip", "Advanced camera", "Dynamic Island"],
                "category": "standard",
                "image": "https://images.unsplash.com/photo-1710023038502-ba80a70a9f53?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxpcGhvbmUlMjBwcm8lMjBtYXh8ZW58MHx8fHwxNzc1MjM5NzgxfDA&ixlib=rb-4.1.0&q=85",
                "created_at": datetime.now(timezone.utc)
            },
        ]
        for product in products:
            await db.products.insert_one(product)

@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.products.create_index("product_id", unique=True)
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("user_id")
    await db.payment_transactions.create_index("session_id")
    await seed_admin()
    await seed_products()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str = "user"
    created_at: datetime

@api_router.post("/auth/register", response_model=UserResponse)
async def register(input: RegisterRequest, response: Response):
    email = input.email.lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed = hash_password(input.password)
    user_doc = {
        "user_id": user_id,
        "email": email,
        "password_hash": hashed,
        "name": input.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    user_doc.pop("password_hash")
    return UserResponse(**user_doc)

@api_router.post("/auth/login", response_model=UserResponse)
async def login(input: LoginRequest, request: Request, response: Response):
    email = input.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(user["user_id"], email)
    refresh_token = create_refresh_token(user["user_id"])
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    user.pop("password_hash")
    return UserResponse(**user)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_authenticated_user)):
    return UserResponse(**user)

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

class GoogleSessionRequest(BaseModel):
    session_id: str

@api_router.post("/auth/google/session")
async def google_session(input: GoogleSessionRequest, response: Response):
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": input.session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session ID")
        data = resp.json()
    
    email = data["email"].lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name", email.split("@")[0]),
            "picture": data.get("picture"),
            "role": "user",
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user_doc)
        user = user_doc
    
    session_token = data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    user.pop("password_hash", None)
    return {"user": user}

class ProductResponse(BaseModel):
    product_id: str
    name: str
    description: str
    variants: List[Dict[str, Any]]
    features: List[str]
    category: str
    image: str
    created_at: datetime

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

class AddToCartRequest(BaseModel):
    product_id: str
    variant_index: int
    quantity: int = 1

class CartItemResponse(BaseModel):
    cart_item_id: str
    user_id: str
    product_id: str
    product_name: str
    variant: Dict[str, Any]
    quantity: int
    subtotal: float
    created_at: datetime

@api_router.post("/cart", response_model=CartItemResponse)
async def add_to_cart(input: AddToCartRequest, user: dict = Depends(get_authenticated_user)):
    product = await db.products.find_one({"product_id": input.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if input.variant_index >= len(product["variants"]):
        raise HTTPException(status_code=400, detail="Invalid variant")
    
    variant = product["variants"][input.variant_index]
    
    existing_item = await db.cart_items.find_one({
        "user_id": user["user_id"],
        "product_id": input.product_id,
        "variant.storage": variant["storage"],
        "variant.color": variant["color"]
    }, {"_id": 0})
    
    if existing_item:
        new_quantity = existing_item["quantity"] + input.quantity
        new_subtotal = new_quantity * variant["price"]
        await db.cart_items.update_one(
            {"cart_item_id": existing_item["cart_item_id"]},
            {"$set": {"quantity": new_quantity, "subtotal": new_subtotal}}
        )
        existing_item["quantity"] = new_quantity
        existing_item["subtotal"] = new_subtotal
        return CartItemResponse(**existing_item)
    
    cart_item_id = f"cart_{uuid.uuid4().hex[:12]}"
    cart_item = {
        "cart_item_id": cart_item_id,
        "user_id": user["user_id"],
        "product_id": input.product_id,
        "product_name": product["name"],
        "variant": variant,
        "quantity": input.quantity,
        "subtotal": variant["price"] * input.quantity,
        "created_at": datetime.now(timezone.utc)
    }
    await db.cart_items.insert_one(cart_item)
    return CartItemResponse(**cart_item)

@api_router.get("/cart", response_model=List[CartItemResponse])
async def get_cart(user: dict = Depends(get_authenticated_user)):
    items = await db.cart_items.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return items

@api_router.delete("/cart/{cart_item_id}")
async def remove_from_cart(cart_item_id: str, user: dict = Depends(get_authenticated_user)):
    result = await db.cart_items.delete_one({"cart_item_id": cart_item_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}

@api_router.put("/cart/{cart_item_id}")
async def update_cart_quantity(cart_item_id: str, quantity: int, user: dict = Depends(get_authenticated_user)):
    item = await db.cart_items.find_one({"cart_item_id": cart_item_id, "user_id": user["user_id"]}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    new_subtotal = quantity * item["variant"]["price"]
    await db.cart_items.update_one(
        {"cart_item_id": cart_item_id},
        {"$set": {"quantity": quantity, "subtotal": new_subtotal}}
    )
    return {"message": "Cart updated"}

class OrderResponse(BaseModel):
    order_id: str
    items: List[Dict[str, Any]]
    total: float
    status: str
    created_at: datetime
    paid_at: Optional[datetime] = None

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(user: dict = Depends(get_authenticated_user)):
    orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, user: dict = Depends(get_authenticated_user)):
    order = await db.orders.find_one({"order_id": order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.get("/admin/orders", response_model=List[OrderResponse])
async def get_all_orders(user: dict = Depends(get_authenticated_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user: dict = Depends(get_authenticated_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.orders.update_one({"order_id": order_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    variants: Optional[List[Dict[str, Any]]] = None
    features: Optional[List[str]] = None

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, input: ProductUpdateRequest, user: dict = Depends(get_authenticated_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.orders.update_one({"product_id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
