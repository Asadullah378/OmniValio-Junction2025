# Valio Aimo Customer Portal Backend

FastAPI backend for the Zero-Fail Logistics Customer Portal with complete customer and admin functionality.

## Features

### Customer Features
- **Authentication**: Login (accounts created by admin)
- **Dashboard**: View stats, orders in progress, actions needed
- **Orders**: 
  - Browse products and add to cart
  - View product risk evaluation (dummy endpoint)
  - Select up to 2 substitutes per product
  - View similar products (dummy endpoint)
  - Place orders and track status
  - Order communication chat
- **Claims**: Create claims for delivered orders with images, track status, chat
- **Payments**: View invoices, refunds, and order modifications

### Admin Features
- **Authentication**: Admin login
- **Order Management**: View all orders, update status, replace products with substitutes
- **Inventory Management**: Add/remove products, update quantities
- **Claims Management**: View claims, approve/reject, chat with customers
- **Customer Management**: Create new customers and user accounts
- **Communication**: Send messages for orders and claims

## Tech Stack

- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **SQLite**: Local database (can be easily switched to PostgreSQL)
- **Pydantic**: Data validation and serialization
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Seed sample data (optional):
```bash
python seed_data.py
```

This creates:
- Admin user: `admin` / `admin123`
- Customer user: `customer1` / `customer123`
- Sample products and inventory

## Running the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

## Database

The application uses SQLite by default (`valio_aimo.db`). The database is automatically initialized when the application starts.

To reset the database, simply delete `valio_aimo.db` and restart the server.

## API Endpoints

### Authentication
- `POST /auth/login` - Login (admin or customer)
- `GET /auth/me` - Get current user info

### Customer Endpoints

#### Cart
- `GET /customer/cart/` - Get cart
- `POST /customer/cart/items` - Add item to cart
- `DELETE /customer/cart/items/{cart_item_id}` - Remove item from cart
- `DELETE /customer/cart/` - Clear cart

#### Products
- `GET /customer/products/` - Browse products
- `GET /customer/products/{product_code}` - Get product details
- `GET /customer/products/{product_code}/risk` - Get risk evaluation (dummy)
- `GET /customer/products/{product_code}/similar` - Get similar products (dummy)

#### Orders
- `POST /customer/orders/` - Place order from cart
- `GET /customer/orders/` - Get all orders
- `GET /customer/orders/{order_id}` - Get order details
- `GET /customer/orders/{order_id}/messages` - Get order messages
- `POST /customer/orders/{order_id}/messages` - Send order message

#### Dashboard
- `GET /customer/dashboard/` - Get dashboard
- `GET /customer/dashboard/actions-needed` - Get orders needing action

#### Claims
- `POST /customer/claims/` - Create claim (with file uploads)
- `GET /customer/claims/` - Get all claims
- `GET /customer/claims/{claim_id}` - Get claim details
- `GET /customer/claims/{claim_id}/messages` - Get claim messages
- `POST /customer/claims/{claim_id}/messages` - Send claim message

#### Payments
- `GET /customer/payments/invoices` - Get all invoices
- `GET /customer/payments/invoices/{invoice_id}` - Get invoice details

### Admin Endpoints

#### Orders
- `GET /admin/orders/` - Get all orders
- `GET /admin/orders/{order_id}` - Get order details
- `PUT /admin/orders/{order_id}/status` - Update order status
- `POST /admin/orders/{order_id}/replace-product` - Replace product with substitute
- `GET /admin/orders/{order_id}/messages` - Get order messages
- `POST /admin/orders/{order_id}/messages` - Send order message

#### Inventory
- `GET /admin/inventory/` - Get all inventory
- `GET /admin/inventory/{product_code}` - Get inventory item
- `PUT /admin/inventory/{product_code}` - Update inventory
- `DELETE /admin/inventory/{product_code}` - Remove from inventory

#### Claims
- `GET /admin/claims/` - Get all claims
- `GET /admin/claims/manual-review` - Get claims requiring manual review
- `GET /admin/claims/{claim_id}` - Get claim details
- `POST /admin/claims/{claim_id}/approve` - Approve claim
- `POST /admin/claims/{claim_id}/reject` - Reject claim
- `GET /admin/claims/{claim_id}/messages` - Get claim messages
- `POST /admin/claims/{claim_id}/messages` - Send claim message

#### Customers
- `POST /admin/customers/` - Create customer
- `POST /admin/customers/{customer_id}/user` - Create user for customer
- `GET /admin/customers/` - Get all customers
- `GET /admin/customers/{customer_id}` - Get customer

#### Products
- `POST /admin/products/` - Create product
- `GET /admin/products/` - Get all products
- `PUT /admin/products/{product_code}` - Update product
- `DELETE /admin/products/{product_code}` - Delete product

## Database Schema

The database includes the following main entities:

- **Users**: Authentication (admin/customer roles)
- **Customers**: Customer profiles
- **Products**: Product catalog
- **Inventory**: Product stock levels
- **Carts & CartItems**: Shopping cart
- **Orders & OrderLines**: Customer orders
- **OrderSubstitutes**: Customer-selected substitutes
- **OrderTracking**: Order status history
- **Messages**: Order/claim communication
- **Invoices**: Payments and refunds
- **Claims**: Post-delivery claims
- **ClaimProcessing**: AI/manual claim processing

## Order Status Flow

1. **PLACED** - Order placed by customer
2. **UNDER_RISK** - AI detected high risk items
3. **WAITING_FOR_CUSTOMER_ACTION** - Needs customer confirmation
4. **PICKING** - Being picked in warehouse
5. **DELIVERING** - Out for delivery
6. **DELIVERED** - Delivered to customer
7. **CANCELLED** - Order cancelled

## Claim Status Flow

1. **OPEN** - Claim created
2. **AI_PROCESSING** - AI analyzing claim
3. **MANUAL_REVIEW** - Requires admin review
4. **APPROVED** - Claim approved, refund issued
5. **REJECTED** - Claim rejected
6. **RESOLVED** - Claim fully resolved

## Development

### Project Structure

```
Backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication utilities
│   └── routers/
│       ├── auth.py          # Authentication endpoints
│       ├── customer/
│       │   ├── cart.py
│       │   ├── products.py
│       │   ├── orders.py
│       │   ├── dashboard.py
│       │   ├── claims.py
│       │   └── payments.py
│       └── admin/
│           ├── orders.py
│           ├── inventory.py
│           ├── claims.py
│           ├── customers.py
│           └── products.py
├── requirements.txt
├── seed_data.py            # Sample data seeding script
└── README.md
```

## Notes

- Risk evaluation and similar products endpoints are placeholders - integrate with ML models in production
- Claim AI processing is a placeholder - integrate with vision model in production
- File uploads for claims are saved to `uploads/claims/` directory
- JWT secret key should be changed in production (in `app/auth.py`)
- Default passwords in seed data should be changed in production

## License

MIT
