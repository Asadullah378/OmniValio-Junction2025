# Test Suite Documentation

This test suite provides comprehensive testing for the Valio Aimo Customer Portal backend.

## Test Structure

### `test_auth.py`
Tests authentication functionality:
- Admin and customer login
- Token validation
- Unauthorized access handling

### `test_customer_flow.py`
Tests complete customer workflows:
- Product browsing and details
- Risk evaluation and similar products
- Cart management with substitutes
- Order placement and tracking
- Order communication
- Dashboard viewing
- Claim creation
- Invoice viewing

### `test_admin_flow.py`
Tests admin functionality:
- Order management and status updates
- Product replacement with substitutes
- Inventory management
- Product creation
- Customer creation
- Claim processing (approve/reject)
- Communication with customers

### `test_end_to_end_flow.py`
End-to-end integration tests:
- Complete order-to-claim resolution flow
- Multi-order dashboard scenarios
- Inventory management workflows

## Running Tests

### Run all tests:
```bash
pytest
```

### Run specific test file:
```bash
pytest tests/test_customer_flow.py
```

### Run specific test:
```bash
pytest tests/test_customer_flow.py::test_customer_place_order
```

### Run with verbose output:
```bash
pytest -v
```

### Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

## Test Fixtures

The test suite uses pytest fixtures defined in `conftest.py`:

- `db`: Fresh database session for each test
- `client`: FastAPI test client
- `admin_user`: Pre-created admin user
- `customer`: Pre-created customer
- `customer_user`: Pre-created customer user account
- `products`: Sample products with inventory
- `admin_token`: Admin authentication token
- `customer_token`: Customer authentication token

## Test Coverage

The tests cover:

1. **Authentication**: Login, token validation, role-based access
2. **Customer Operations**: 
   - Product browsing and search
   - Cart management
   - Order placement and tracking
   - Claim creation and tracking
   - Invoice viewing
   - Dashboard statistics
3. **Admin Operations**:
   - Order management
   - Inventory management
   - Product management
   - Customer management
   - Claim processing
   - Communication
4. **End-to-End Flows**:
   - Complete order lifecycle
   - Claim resolution workflow
   - Multi-order scenarios

## Notes

- Tests use an in-memory SQLite database for isolation
- Each test gets a fresh database state
- Authentication tokens are automatically generated via fixtures
- Tests are designed to run independently and in any order

