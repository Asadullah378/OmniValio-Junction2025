"""
Risk Prediction Service
Uses the Shortage Risk Prediction API to predict shortage risk for products
"""
from typing import List, Optional, Dict, Any
import requests
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

# API Configuration
RISK_API_BASE_URL = os.getenv('RISK_API_BASE_URL', 'http://localhost:8001')
RISK_API_TIMEOUT = int(os.getenv('RISK_API_TIMEOUT', '30'))

# Fixed values for plant and storage location
DEFAULT_PLANT = "P01"
DEFAULT_STORAGE_LOCATION = "WH01"



def predict_risk(
    product_code: str,
    customer_number: str,
    order_qty: float,
    order_created_date: str,
    requested_delivery_date: str,
    plant: str = DEFAULT_PLANT,
    storage_location: str = DEFAULT_STORAGE_LOCATION
) -> Dict[str, Any]:
    """
    Predict shortage risk for a single product/order
    
    Args:
        product_code: Product code/SKU
        customer_number: Customer identifier
        order_qty: Order quantity (must be > 0)
        order_created_date: Order creation date (ISO format: YYYY-MM-DD)
        requested_delivery_date: Requested delivery date (ISO format: YYYY-MM-DD)
        plant: Plant/facility code (default: "P01")
        storage_location: Storage location code (default: "WH01")
    
    Returns:
        Dictionary containing prediction result with:
        - product_code
        - customer_number
        - plant
        - storage_location
        - order_qty
        - order_created_date
        - requested_delivery_date
        - shortage_probability (0-1)
        - shortage_flag_pred (0 or 1)
        - threshold_used
    
    Raises:
        RiskPredictionError: If API call fails or returns invalid response
    """
    # Validate dates format
    try:
        datetime.strptime(order_created_date, "%Y-%m-%d")
        datetime.strptime(requested_delivery_date, "%Y-%m-%d")
    except ValueError as e:
        raise Exception(f"Invalid date format. Use YYYY-MM-DD: {e}")
    
    # Validate order quantity
    if order_qty <= 0:
        raise Exception("Order quantity must be greater than 0")
    
    # Prepare request payload
    payload = {
        "product_code": product_code,
        "customer_number": customer_number,
        "plant": plant,
        "storage_location": storage_location,
        "order_qty": order_qty,
        "order_created_date": order_created_date,
        "requested_delivery_date": requested_delivery_date
    }
    
    try:
        # Call the risk prediction API
        response = requests.post(
            f"{RISK_API_BASE_URL}/predict",
            json=payload,
            timeout=RISK_API_TIMEOUT,
            headers={"Content-Type": "application/json"}
        )
        
        # Check for HTTP errors
        response.raise_for_status()
        
        # Parse response
        result = response.json()
        
        # Validate response structure
        required_fields = [
            "product_code", "customer_number", "plant", "storage_location",
            "order_qty", "order_created_date", "requested_delivery_date",
            "shortage_probability", "shortage_flag_pred", "threshold_used"
        ]
        
        for field in required_fields:
            if field not in result:
                raise Exception(f"Missing required field in API response: {field}")
        
        return result
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"API request failed: {str(e)}")
    except ValueError as e:
        raise Exception(f"Invalid JSON response from API: {str(e)}")
    except Exception as e:
        raise Exception(f"Unexpected error during risk prediction: {str(e)}")


def predict_risk_batch(
    products: List[Dict[str, Any]],
    plant: str = DEFAULT_PLANT,
    storage_location: str = DEFAULT_STORAGE_LOCATION
) -> Dict[str, Any]:
    """
    Predict shortage risk for multiple products/orders in batch
    
    Args:
        products: List of dictionaries, each containing:
            - product_code: str
            - customer_number: str
            - order_qty: float
            - order_created_date: str (ISO format: YYYY-MM-DD)
            - requested_delivery_date: str (ISO format: YYYY-MM-DD)
        plant: Plant/facility code (default: "P01")
        storage_location: Storage location code (default: "WH01")
    
    Returns:
        Dictionary containing:
        - predictions: List of prediction results (same structure as predict_risk)
        - total_orders: Total number of orders processed
        - high_risk_count: Number of orders flagged as high risk
    
    Raises:
        RiskPredictionError: If API call fails or returns invalid response
    """
    if not products:
        raise Exception("Products list cannot be empty")
    

    # Validate and prepare order requests
    order_requests = []
    for idx, product in enumerate(products):
        # Validate required fields
        required_fields = ["product_code", "customer_number", "order_qty", 
                          "order_created_date", "requested_delivery_date"]
        missing_fields = [field for field in required_fields if field not in product]
        
        if missing_fields:
            raise Exception(
                f"Product at index {idx} missing required fields: {', '.join(missing_fields)}"
            )
        
        # Validate dates format
        try:
            datetime.strptime(product["order_created_date"], "%Y-%m-%d")
            datetime.strptime(product["requested_delivery_date"], "%Y-%m-%d")
        except ValueError as e:
            raise Exception(
                f"Product at index {idx} has invalid date format. Use YYYY-MM-DD: {e}"
            )
        
        # Validate order quantity
        if product["order_qty"] <= 0:
            raise Exception(
                f"Product at index {idx} has invalid order_qty (must be > 0)"
            )
        
        # Build order request
        order_request = {
            "product_code": product["product_code"],
            "customer_number": product["customer_number"],
            "plant": plant,
            "storage_location": storage_location,
            "order_qty": product["order_qty"],
            "order_created_date": product["order_created_date"],
            "requested_delivery_date": product["requested_delivery_date"]
        }
        
        order_requests.append(order_request)
    
    # Prepare batch request payload
    payload = {
        "orders": order_requests
    }
    
    try:
        # Call the batch risk prediction API
        response = requests.post(
            f"{RISK_API_BASE_URL}/predict/batch",
            json=payload,
            timeout=RISK_API_TIMEOUT,
            headers={"Content-Type": "application/json"}
        )
        
        # Check for HTTP errors
        response.raise_for_status()
        
        # Parse response
        result = response.json()
        
        # Validate response structure
        required_fields = ["predictions", "total_orders", "high_risk_count"]
        for field in required_fields:
            if field not in result:
                raise Exception(f"Missing required field in API response: {field}")
        
        # Validate predictions structure
        if not isinstance(result["predictions"], list):
            raise Exception("Predictions must be a list")
        
        if len(result["predictions"]) != len(products):
            raise Exception(
                f"Number of predictions ({len(result['predictions'])}) "
                f"does not match number of input products ({len(products)})"
            )
        
        return result
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"API request failed: {str(e)}")
    except ValueError as e:
        raise Exception(f"Invalid JSON response from API: {str(e)}")
    except Exception as e:
        raise Exception(f"Unexpected error during batch risk prediction: {str(e)}")

