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

1. Clone the repository:
```bash
git clone <repository-url>
cd Backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables (optional):
Create a `.env` file in the root directory for API keys and configuration:
```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
RISK_PREDICTION_API_URL=https://your-risk-api-url.com
JWT_SECRET_KEY=your-secret-key-here
```

5. Initialize the database:
The database is automatically created when the application starts. For manual initialization:
```bash
python -c "from app.database import init_db; init_db()"
```

6. Load product data (optional):
```bash
python load_product_data.py
```

7. Update product prices (if needed):
```bash
python update_product_prices.py
```

8. Populate inventory (optional):
```bash
python populate_inventory.py
```

9. Seed sample data (optional):
```bash
python seed_data.py
```

This creates:
- Admin user: `admin` / `admin123`
- Customer user: `unicafe` / `customer123` (email: `unicafe@helsinki.fi`)
- Sample products and inventory

## Running the Server

### Development Mode (Local)

For local development with auto-reload:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

### Production Mode with PM2

For production deployment, use PM2 for process management:

1. Install PM2 (if not already installed):
```bash
npm install -g pm2
```

2. Make the run script executable:
```bash
chmod +x run.sh
```

3. Run the application:
```bash
./run.sh
```

This will:
- Start the FastAPI server as a PM2 process named `omni-valio-backend`
- Run on `127.0.0.1:8000` (localhost only)
- Save the process to PM2's startup list

#### PM2 Management Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs omni-valio-backend

# View last 50 lines of logs
pm2 logs omni-valio-backend --lines 50

# Restart application
pm2 restart omni-valio-backend

# Stop application
pm2 stop omni-valio-backend

# Delete process (after stopping)
pm2 delete omni-valio-backend

# Save PM2 process list (auto-saves on start)
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Running on Custom Host/Port

To run on a different host or port:

```bash
# Using uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8080

# Using PM2 with custom settings
pm2 start python3 --name "omni-valio-backend" -- \
    -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8080
```

**Note**: For external access (host `0.0.0.0`), ensure firewall rules allow traffic on the specified port.

### Cloud Deployment (GCP/AWS/Azure)

1. **Prepare the server**:
   - Install Python 3.8+
   - Install Node.js and PM2
   - Install project dependencies

2. **Set up firewall rules** (if exposing publicly):
   - GCP: Create firewall rule allowing TCP port 8000
   - AWS: Configure security group to allow port 8000
   - Azure: Configure network security group

3. **Deploy the code**:
```bash
# Clone or upload code
git clone <repository-url>
cd Backend

# Set up virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database and load data
python load_product_data.py
python update_product_prices.py
python populate_inventory.py
```

4. **Run with PM2**:
```bash
chmod +x run.sh
./run.sh
```

5. **Set up reverse proxy (recommended)**:
For production, use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t valio-aimo-backend .
docker run -p 8000:8000 valio-aimo-backend
```

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

## Deployment Considerations

### Security

- **Change default passwords**: Update admin and customer passwords in production
- **JWT Secret Key**: Set a strong secret key in `.env` or `app/auth.py`
- **CORS**: Update CORS origins in `app/main.py` to allow only your frontend domains
- **API Keys**: Store API keys (OpenAI, Pinecone, etc.) in environment variables, never commit them
- **HTTPS**: Use HTTPS in production (set up SSL certificate with Nginx/Apache)

### Performance

- **Database**: Consider migrating from SQLite to PostgreSQL for production workloads
- **Connection Pooling**: Configure database connection pooling for high traffic
- **Caching**: Implement Redis caching for frequently accessed data
- **File Storage**: Use cloud storage (S3, GCS) for claim attachments instead of local filesystem

### Monitoring

- **PM2 Monitoring**: Use `pm2 monit` to monitor CPU and memory usage
- **Logging**: Set up centralized logging (ELK, CloudWatch, etc.)
- **Health Checks**: Use `/health` endpoint for load balancer health checks
- **Error Tracking**: Integrate error tracking service (Sentry, Rollbar, etc.)

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
sudo lsof -i :8000
# or
sudo netstat -tlnp | grep 8000

# Kill the process
kill -9 <PID>
```

### Database Issues

```bash
# Reset database (WARNING: deletes all data)
rm valio_aimo.db
python -c "from app.database import init_db; init_db()"

# Update inventory schema (if needed)
python update_inventory_schema.py
```

### PM2 Issues

```bash
# Clear PM2 logs
pm2 flush

# Restart all processes
pm2 restart all

# Check PM2 error logs
pm2 logs omni-valio-backend --err
```

### Module Import Errors

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## Notes

- Risk evaluation and similar products endpoints use AI services (OpenAI, Pinecone) - configure API keys in `.env`
- Claim AI processing uses OpenAI Vision API for image analysis
- File uploads for claims are saved to `uploads/claims/` directory
- JWT secret key should be changed in production (set via `JWT_SECRET_KEY` environment variable or in `app/auth.py`)
- Default passwords in seed data should be changed in production
- For production, remove `--reload` flag and use production ASGI server (gunicorn with uvicorn workers)

## License

MIT
