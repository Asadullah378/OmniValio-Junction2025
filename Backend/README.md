# Valio Aimo Customer Portal Backend

FastAPI backend for the Zero-Fail Logistics Customer Portal.

## Features

- **Customer Management**: Create, read, update customer profiles with preferences
- **Product Management**: Manage product catalog with substitution capabilities
- **Order Management**: Full order lifecycle with risk scoring
- **Pre-Order Optimization**: Suggest alternatives for low-priority items with high risk
- **Substitution Management**: Handle product substitutions during picking
- **Claims Management**: Post-delivery claim handling with multimodal support
- **Dashboard**: Customer and system statistics

## Tech Stack

- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **SQLite**: Local database (can be easily switched to PostgreSQL)
- **Pydantic**: Data validation and serialization

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

### Customers
- `POST /customers/` - Create customer
- `GET /customers/` - List customers
- `GET /customers/{customer_id}` - Get customer
- `PUT /customers/{customer_id}` - Update customer
- `DELETE /customers/{customer_id}` - Delete customer

### Products
- `POST /products/` - Create product
- `GET /products/` - List products
- `GET /products/{product_code}` - Get product
- `GET /products/{product_code}/substitutes` - Get substitute products

### Orders
- `POST /orders/` - Create order
- `GET /orders/` - List orders
- `GET /orders/{order_id}` - Get order
- `PUT /orders/{order_id}` - Update order
- `POST /orders/{order_id}/risk-score` - Score order risk
- `GET /orders/{order_id}/lines` - Get order lines

### Substitutions
- `POST /substitutions/pre-order-optimization/{order_id}` - Get pre-order suggestions
- `POST /substitutions/suggest` - Create substitution suggestions
- `POST /substitutions/decide` - Customer decides on substitution
- `GET /substitutions/{order_id}/suggestions` - Get suggestions for order

### Claims
- `POST /claims/` - Create claim
- `GET /claims/` - List claims
- `GET /claims/{claim_id}` - Get claim
- `POST /claims/{claim_id}/analyze` - Analyze claim images
- `POST /claims/{claim_id}/resolve` - Resolve claim
- `PUT /claims/{claim_id}/status` - Update claim status

### Dashboard
- `GET /dashboard/customer/{customer_id}` - Customer dashboard
- `GET /dashboard/stats/orders` - Order statistics

## Database Schema

The database includes the following main entities:

- **Customers**: Customer profiles with preferences
- **Products**: Product catalog
- **Orders**: Customer orders
- **OrderLines**: Individual items in orders
- **SubstitutionSuggestions**: Suggested product alternatives
- **OrderChanges**: History of order modifications
- **Claims**: Post-delivery claims
- **ClaimLines**: Items in claims
- **ClaimAttachments**: Images/videos for claims
- **ContactSessions**: AI interaction logs

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
│   └── routers/
│       ├── customers.py
│       ├── products.py
│       ├── orders.py
│       ├── substitutions.py
│       ├── claims.py
│       └── dashboard.py
├── requirements.txt
└── README.md
```

## Notes

- Risk scoring is currently a placeholder - integrate with ML model in production
- Image analysis for claims is a placeholder - integrate with vision model in production
- Substitution logic is simplified - enhance with ML-based similarity in production

## License

MIT

