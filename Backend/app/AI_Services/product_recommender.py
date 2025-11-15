"""
Product Recommendation Service
Simplified version that uses database products directly
"""
from typing import List, Optional, Dict, Any, Union
from pinecone import Pinecone
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
PINECONE_INDEX_NAME = os.getenv('PINECONE_INDEX_NAME', 'hackathon2')
PINECONE_HOST = os.getenv('PINECONE_HOST')
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'text-embedding-3-small')
PINECONE_DIMENSION = int(os.getenv('PINECONE_DIMENSION', '1024'))


class ProductRecommender:
    """
    Product recommendation engine using semantic search
    Works directly with database products
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        """Singleton pattern - only one instance"""
        if cls._instance is None:
            cls._instance = super(ProductRecommender, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the recommender with OpenAI and Pinecone clients"""
        if self._initialized:
            return
        
        # Check if API keys are available
        if not OPENAI_API_KEY or not PINECONE_API_KEY:
            print("Warning: OpenAI or Pinecone API keys not found. Recommendation service will use fallback.")
            self.available = False
            self._initialized = True
            return
        
        try:
            print("Initializing Product Recommender...")
            
            # Initialize clients
            self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
            self.pc = Pinecone(api_key=PINECONE_API_KEY)
            
            # Connect to Pinecone index
            self.index = self.pc.Index(PINECONE_INDEX_NAME, host=PINECONE_HOST)
            
            self.available = True
            self._initialized = True
            print("Recommender ready!")
            
        except Exception as e:
            print(f"Error initializing Product Recommender: {e}")
            self.available = False
            self._initialized = True
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a text using OpenAI"""
        if not self.available:
            raise ValueError("Recommendation service not available")
        
        response = self.openai_client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text,
            dimensions=PINECONE_DIMENSION
        )
        return response.data[0].embedding
    
    def build_search_text(self, product) -> str:
        """
        Build search text from database product for embedding
        Uses product fields to create a comprehensive search text
        """
        parts = []
        
        # Product name (all languages)
        if product.product_name:
            parts.append(product.product_name)
        if product.product_name_en:
            parts.append(product.product_name_en)
        if product.product_name_fi:
            parts.append(product.product_name_fi)
        
        # Category information
        if product.category:
            parts.append(product.category)
        if product.sub_category:
            parts.append(product.sub_category)
        
        # Vendor and origin
        if product.vendor_name:
            parts.append(product.vendor_name)
        if product.country_of_origin:
            parts.append(product.country_of_origin)
        
        # Ingredients and marketing text
        if product.ingredients:
            parts.append(product.ingredients)
        if product.marketing_text:
            parts.append(product.marketing_text)
        
        # Allergens
        if product.allergens:
            parts.append(product.allergens)
        
        # Combine all parts
        search_text = " ".join(parts)
        return search_text
    
    def get_recommendations_by_text(
        self,
        search_text: str,
        top_k: int = 5
    ) -> List[str]:
        """
        Get product recommendations by generating embedding from text
        Returns list of GTINs of recommended products
        
        Args:
            search_text: Text to search for (product name, description, etc.)
            top_k: Number of recommendations to return
        
        Returns:
            List of GTINs of recommended products
        """
        if not self.available:
            return []
        
        try:
            # Generate embedding for the search text
            query_embedding = self.generate_embedding(search_text)
            
            # Query Pinecone for similar products
            search_results = self.index.query(
                vector=query_embedding,
                top_k=top_k + 10,  # Get extra results for filtering
                include_metadata=True
            )
            
            # Extract GTINs from results
            recommended_gtins = []
            for match in search_results.get('matches', []):
                match_gtin = match['id']
                recommended_gtins.append(match_gtin)
                if len(recommended_gtins) >= top_k:
                    break
            
            return recommended_gtins
            
        except Exception as e:
            print(f"Error getting recommendations by text: {e}")
            return []


# Global singleton instance
_recommender_instance = None


def get_recommender() -> ProductRecommender:
    """Get or create the global recommender instance"""
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = ProductRecommender()
    return _recommender_instance


def get_similar_products_by_text(search_text: str, limit: int = 5) -> List[str]:
    """
    Get similar products by search text
    Returns list of GTINs
    
    Args:
        search_text: Text to search for
        limit: Number of recommendations (default 5)
    
    Returns:
        List of GTINs of similar products
    """
    recommender = get_recommender()
    if not recommender.available:
        return []
    
    return recommender.get_recommendations_by_text(search_text, top_k=limit)


def get_similar_products_by_query(query: str, limit: int = 5) -> List[str]:
    """
    Get similar products by search text
    Returns list of GTINs
    
    Args:
        query: Search text (product name, description, etc.)
        limit: Number of recommendations (default 5)
    
    Returns:
        List of GTINs of similar products
    """
    recommender = get_recommender()
    if not recommender.available:
        return []
    
    return recommender.get_recommendations_by_text(query, top_k=limit)
