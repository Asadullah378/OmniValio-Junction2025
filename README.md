# Omni-Valio - Zero-Fail Logistics Portal

**Live URL**: https://omnivalio.live

Omni-Valio is a comprehensive logistics management platform designed for professional kitchens and operations teams. The platform leverages AI to predict shortages, manage substitutes, automate communication, and transform manual logistics management into a proactive, streamlined operation.

## 🚀 Features

### For Professional Kitchens (Customer Portal)

- **AI-Powered Order Management**
  - Browse products with real-time shortage risk assessment
  - Visual risk indicators (Safe, Low, Medium, High, Very High)
  - Per-item shortage risk percentages with live updates
  - AI-powered product recommendations and substitutes

- **Smart Ordering**
  - Cart-based ordering system
  - Set up to 2 substitute products per item
  - Delivery date and time window selection
  - Real-time cart state management

- **Order Tracking & Communication**
  - Real-time order status updates
  - Complete order history with tracking timeline
  - Embedded chat with operations team and AI assistant
  - Automatic notifications for order changes and status updates

- **Claims Management**
  - Create claims for delivered orders only
  - Multiple image attachments support
  - AI-powered claim processing with confidence scores
  - Chat support for claim resolution

- **Invoice & Payment Tracking**
  - View all invoices for orders
  - Automatic invoice regeneration on product substitutions
  - Invoice removal on order cancellation

### For Operations Teams (Admin Portal)

- **Order Management**
  - View all customer orders with status filtering
  - Update order statuses (placed, under_risk, waiting_for_customer_action, picking, delivering, delivered, cancelled)
  - Replace products with customer-approved substitutes
  - Automatic customer alerts on status changes

- **Inventory Management**
  - Real-time inventory tracking with low stock alerts
  - Batch inventory updates
  - Visual stock level indicators
  - Search and filter capabilities

- **Product Catalog**
  - Create, update, and delete products
  - Product categorization and temperature zone management
  - Paginated product listing with search and filters

- **Claims Processing**
  - AI-powered claim triage with confidence scores
  - Manual review queue for claims requiring human attention
  - Approve/reject claims with refund processing
  - Rejection reasoning capture

- **Customer Management**
  - Create and manage customer accounts
  - Customer user account creation
  - Customer details and preferences management

## 🔐 Test Credentials

### Customer Account
- **Username**: `unicafe`
- **Password**: `customer123`

**Customer Features**: Dashboard, New Orders, Order History, Claims, Invoices, Alerts

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`

**Admin Features**: Order Management, Inventory Management, Product Catalog, Claims Processing, Customer Management

## 🛠️ Technology Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Form Management**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **API Communication**: Axios
- **AI Integration**: ElevenLabs ConvAI widget (customer portal)
- **Date Handling**: date-fns
- **Icons**: Lucide React

### Backend

- **Framework**: FastAPI (Modern Python web framework)
- **ORM**: SQLAlchemy
- **Database**: SQLite (can be easily switched to PostgreSQL)
- **Validation**: Pydantic
- **Authentication**: JWT tokens
- **Password Hashing**: bcrypt
- **API Documentation**: OpenAPI/Swagger (auto-generated)

## 📦 Installation & Setup

### Prerequisites

- **Node.js** 18+ and npm (for Frontend)
- **Python** 3.8+ (for Backend)
- **pip** (Python package manager)

### Backend Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd Backend
```

2. **Create a virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Set up environment variables** (optional):
Create a `.env` file in the Backend directory:
```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_HOST=your_pinecone_environment
RISK_PREDICTION_API_URL=https://your-risk-api-url.com
```

5. **Initialize the database**:
The database is automatically created when the application starts. For manual initialization:
```bash
python -c "from app.database import init_db; init_db()"
```

6. **Load product data** (optional):
```bash
python load_product_data.py
```

7. **Update product prices** (if needed):
```bash
python update_product_prices.py
```

8. **Populate inventory** (optional):
```bash
python populate_inventory.py
```

9. **Seed sample data** (optional):
```bash
python seed_data.py
```

This creates:
- Admin user: `admin` / `admin123`
- Customer user: `unicafe` / `customer123` (email: `unicafe@helsinki.fi`)
- Sample products and inventory

### Frontend Setup

1. **Navigate to Frontend directory**:
```bash
cd Frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure API endpoint** (if needed):
Update the API base URL in `src/lib/api.ts` to point to your backend server.

## 🚀 Running the Application

### Backend (Development Mode)

For local development with auto-reload:

```bash
cd Backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### Frontend (Development Mode)

```bash
cd Frontend
npm run dev
```

The application will be available at `http://localhost:8080`

## 📦 Production Build & Deployment

### Backend Production Deployment

#### Using PM2

1. **Install PM2** (if not already installed):
```bash
npm install -g pm2
```

2. **Make the run script executable**:
```bash
cd Backend
chmod +x run.sh
./run.sh
```

This will:
- Start the FastAPI server as a PM2 process named `omni-valio-backend`
- Run on `127.0.0.1:8000` (localhost only)
- Save the process to PM2's startup list

**PM2 Management Commands**:
```bash
# View application status
pm2 status

# View logs
pm2 logs omni-valio-backend

# Restart application
pm2 restart omni-valio-backend

# Stop application
pm2 stop omni-valio-backend

# Delete process (after stopping)
pm2 delete omni-valio-backend

# Setup PM2 to start on system boot
pm2 startup
```

#### Docker Deployment (Optional)

Create a `Dockerfile` in the Backend directory:
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

### Frontend Production Build

```bash
cd Frontend
npm run build
npm run preview
```

#### Deployment with PM2

```bash
cd Frontend
# Make run script executable (Linux/Mac)
chmod +x run.sh

# Run the deployment script
./run.sh
```

The script will:
1. Build the React application
2. Install PM2 if not already installed
3. Start the server on `localhost:3000`
4. Save the PM2 process for auto-restart

**PM2 Management Commands**:
- `pm2 logs omni-valio-frontend` - View logs
- `pm2 stop omni-valio-frontend` - Stop server
- `pm2 restart omni-valio-frontend` - Restart server
- `pm2 status` - Check process status

### Cloud Deployment

For production deployment on GCP/AWS/Azure:

1. **Prepare the server**:
   - Install Python 3.8+ and Node.js 18+
   - Install PM2 globally
   - Install project dependencies

2. **Set up firewall rules** (if exposing publicly):
   - Allow TCP port 8000 (Backend API)
   - Allow TCP port 3000 or 8080 (Frontend)

3. **Set up reverse proxy** (recommended):
Use Nginx as a reverse proxy for production:

```nginx
# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📁 Project Structure

```
OmniValio-Junction2025/
├── Backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   ├── database.py          # Database configuration
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # Authentication utilities
│   │   ├── AI_Services/         # AI service integrations
│   │   │   ├── claim_processor.py
│   │   │   ├── product_recommender.py
│   │   │   ├── risk_prediction.py
│   │   │   └── similar_products.py
│   │   └── routers/
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── customer/        # Customer portal endpoints
│   │       │   ├── cart.py
│   │       │   ├── products.py
│   │       │   ├── orders.py
│   │       │   ├── dashboard.py
│   │       │   ├── claims.py
│   │       │   └── payments.py
│   │       └── admin/           # Admin portal endpoints
│   │           ├── orders.py
│   │           ├── inventory.py
│   │           ├── claims.py
│   │           ├── customers.py
│   │           └── products.py
│   ├── tests/                   # Test suite
│   ├── uploads/                 # File uploads (claims)
│   ├── requirements.txt         # Python dependencies
│   ├── seed_data.py            # Sample data seeding
│   ├── run.sh                  # Deployment script
│   └── README.md
│
├── Frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   └── ...             # Custom components
│   │   ├── contexts/           # React contexts (Auth, Language)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities and API client
│   │   │   ├── api.ts          # API endpoints
│   │   │   ├── types.ts        # TypeScript types
│   │   │   └── validations.ts  # Zod schemas
│   │   ├── pages/              # Page components
│   │   │   ├── admin/          # Admin portal pages
│   │   │   ├── customer/       # Customer portal pages
│   │   │   └── ...             # Public pages (Login, Landing)
│   │   └── main.tsx            # Application entry point
│   ├── public/                 # Static assets
│   ├── package.json            # Dependencies and scripts
│   ├── server.cjs              # Production server (PM2)
│   ├── run.sh                  # Deployment script
│   └── README.md
│
├── MachineLearning/             # ML models and scripts
│   ├── shortage_risk_predictor.ipynb
│   ├── app_inference.py
│   └── ...
│
└── README.md                    # This file
```

## 🔑 Key Features Explained

### AI-Powered Risk Assessment

The platform uses AI to assess shortage risk for products in the cart:
- Risk categories: Safe (<10%), Low (10-25%), Medium (25-40%), High (40-55%), Very High (>55%)
- Batch risk assessment for efficiency
- Real-time risk updates when delivery dates or quantities change
- Visual indicators with percentage displays

### Substitute Management

- Customers can select up to 2 substitute products per item
- AI-powered recommendations for similar products
- Admins can trigger substitutions with automatic invoice updates
- Chat notifications on product replacements

### Claims Processing Flow

1. Customer creates claim for delivered orders only
2. AI processes claim with confidence score
3. Automatic routing: Approved, Rejected, or Manual Review
4. Admin actions: Approve (with refund) or Reject (with reason)
5. Customer receives updates via chat

### Order Status Workflow

1. **Placed** - Order submitted by customer
2. **Under Risk** - AI detects potential shortages
3. **Waiting for Customer Action** - Customer alert triggered
4. **Picking** - Items being gathered
5. **Delivering** - In transit
6. **Delivered** - Order completed
7. **Cancelled** - Order cancelled (invoice removed)

### Claim Status Flow

1. **OPEN** - Claim created
2. **AI_PROCESSING** - AI analyzing claim
3. **MANUAL_REVIEW** - Requires admin review
4. **APPROVED** - Claim approved, refund issued
5. **REJECTED** - Claim rejected
6. **RESOLVED** - Claim fully resolved

## 🔌 API Endpoints

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
- `GET /customer/products/{product_code}/risk` - Get risk evaluation
- `GET /customer/products/{product_code}/similar` - Get similar products

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

For detailed API documentation, visit `http://localhost:8000/docs` when the backend is running.

## 🗄️ Database Schema

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

The application uses SQLite by default (`valio_aimo.db`). The database is automatically initialized when the application starts. To reset the database, simply delete `valio_aimo.db` and restart the server.

## 🛡️ Deployment Considerations

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

## 🔧 Troubleshooting

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
cd Backend
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
cd Backend
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## 📝 Notes

- Risk evaluation and similar products endpoints use AI services (OpenAI, Pinecone) - configure API keys in `.env`
- Claim AI processing uses OpenAI Vision API for image analysis
- File uploads for claims are saved to `uploads/claims/` directory
- JWT secret key should be changed in production (set via `JWT_SECRET_KEY` environment variable or in `app/auth.py`)
- Default passwords in seed data should be changed in production
- For production, remove `--reload` flag and use production ASGI server (gunicorn with uvicorn workers)

## 🤝 Contributing

This is a proprietary project. For contributions or questions, please contact the development team.

## 🔗 Links

- **Live Application**: https://omnivalio.live
- **Backend API Documentation**: See `Backend/risk_openapi.json` or visit `/docs` endpoint when backend is running
- **Frontend API Documentation**: See `Frontend/backend_openapi.json`

---

**Version**: 2.0.0  
**Last Updated**: 2025
