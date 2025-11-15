"""
AI Services module
"""
from app.AI_Services.product_recommender import (
    get_recommender,
    get_similar_products_by_text,
    get_similar_products_by_query
)

__all__ = [
    'get_recommender',
    'get_similar_products_by_text',
    'get_similar_products_by_query'
]

