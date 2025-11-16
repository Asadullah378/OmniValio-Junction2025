"""
FastAPI Product Recommendation Inference Endpoint
Simple, single-file API for product recommendations
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
from pinecone import Pinecone
from openai import OpenAI
from dotenv import load_dotenv
from difflib import SequenceMatcher
import config
import os
import json

class ProductRecommender:
    """
    Product recommendation engine using semantic search
    """
    
    def __init__(self):
        """Initialize the recommender with OpenAI and Pinecone clients"""
        print("Initializing Product Recommender...")
        
        # Initialize clients
        self.openai_client = OpenAI(api_key=config.OPENAI_API_KEY)
        self.pc = Pinecone(api_key=config.PINECONE_API_KEY)
        
        # Connect to Pinecone index
        self.index = self.pc.Index(config.PINECONE_INDEX_NAME, host=config.PINECONE_HOST)
        
        # Load processed products for lookup
        script_dir = os.path.dirname(os.path.abspath(__file__))
        processed_path = os.path.join(script_dir, "processed_products.json")
        
        with open(processed_path, 'r', encoding='utf-8') as f:
            self.products = json.load(f)
        
        # Create GTIN lookup dictionary
        self.gtin_to_product = {p['gtin']: p for p in self.products}
        
        print(f"Loaded {len(self.products)} products")
        print("Recommender ready!")
    
    def find_product_by_gtin(self, gtin: str) -> Optional[Dict[str, Any]]:
        """Find a product by its GTIN"""
        # Try exact match first
        if gtin in self.gtin_to_product:
            return self.gtin_to_product[gtin]
        
        # Try with .0 appended (for CSV float GTINs)
        gtin_float = f"{gtin}.0"
        if gtin_float in self.gtin_to_product:
            return self.gtin_to_product[gtin_float]
        
        # Try stripping .0 if present
        if gtin.endswith('.0'):
            gtin_clean = gtin[:-2]
            if gtin_clean in self.gtin_to_product:
                return self.gtin_to_product[gtin_clean]
        
        return None
    
    def find_product_by_name(self, name: str, threshold: float = 0.6) -> Optional[Dict[str, Any]]:
        """
        Find a product by name using fuzzy matching
        Returns the best match above the threshold
        """
        best_match = None
        best_score = 0
        
        name_lower = name.lower()
        
        for product in self.products:
            # Check against English name
            product_name = product['name'].lower()
            score = SequenceMatcher(None, name_lower, product_name).ratio()
            
            # Also check Finnish and Swedish names
            if product.get('name_fi'):
                score_fi = SequenceMatcher(None, name_lower, product['name_fi'].lower()).ratio()
                score = max(score, score_fi)
            
            if product.get('name_sv'):
                score_sv = SequenceMatcher(None, name_lower, product['name_sv'].lower()).ratio()
                score = max(score, score_sv)
            
            # Exact substring match bonus
            if name_lower in product_name or product_name in name_lower:
                score = max(score, 0.8)
            
            if score > best_score:
                best_score = score
                best_match = product
        
        if best_score >= threshold:
            return best_match
        
        return None
    
    def find_product(self, query: Union[str, int]) -> Optional[Dict[str, Any]]:
        """
        Find a product by GTIN or name
        Automatically detects input type
        """
        query_str = str(query).strip()
        
        # Try GTIN first (if it's all digits and reasonable length)
        if query_str.isdigit() and len(query_str) >= 8:
            product = self.find_product_by_gtin(query_str)
            if product:
                return product
        
        # Try name search
        return self.find_product_by_name(query_str)
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a text using OpenAI"""
        response = self.openai_client.embeddings.create(
            model=config.EMBEDDING_MODEL,
            input=text,
            dimensions=config.PINECONE_DIMENSION
        )
        return response.data[0].embedding
    
    def get_recommendations(
        self,
        query: Union[str, int],
        top_k: int = 5,
        include_query_product: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get product recommendations for a given query
        
        Args:
            query: Product GTIN or name
            top_k: Number of recommendations to return (default 5)
            include_query_product: Whether to include the query product in results
        
        Returns:
            List of recommended products with similarity scores
        """
        # Find the query product
        query_product = self.find_product(query)
        
        if not query_product:
            raise ValueError(f"Product not found: {query}")
        
        print(f"\nFound product: {query_product['name']} (GTIN: {query_product['gtin']})")
        
        # Generate embedding for the query product
        query_embedding = self.generate_embedding(query_product['search_text'])
        
        # Query Pinecone for similar products
        # Request more than needed to account for filtering
        search_results = self.index.query(
            vector=query_embedding,
            top_k=top_k + 10,  # Get extra results for filtering
            include_metadata=True
        )
        
        # Process results
        recommendations = []
        query_gtin = query_product['gtin']
        
        for match in search_results['matches']:
            match_gtin = match['id']
            
            # Skip the query product itself unless requested
            if match_gtin == query_gtin and not include_query_product:
                continue
            
            # Get full product details
            full_product = self.gtin_to_product.get(match_gtin)
            
            if full_product:
                recommendation = {
                    'gtin': match_gtin,
                    'name': full_product['name'],
                    'brand': full_product.get('brand', ''),
                    'category': full_product.get('category', ''),
                    'category_name': full_product.get('category_name', ''),
                    'subcategory_name': full_product.get('subcategory_name', ''),
                    'vendor': full_product.get('vendor', ''),
                    'temperature_category': full_product.get('temperature_category', ''),
                    'nutrition': full_product.get('nutrition', {}),
                    'allergens': full_product.get('allergens', {}),
                    'dietary_claims': full_product.get('dietary_claims', []),
                    'similarity_score': match['score'],
                    'metadata': match.get('metadata', {})
                }
                
                recommendations.append(recommendation)
                
                # Stop when we have enough recommendations
                if len(recommendations) >= top_k:
                    break
        
        return recommendations
    
    def get_recommendations_detailed(
        self,
        query: Union[str, int],
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Get detailed recommendations including the query product info
        
        Returns:
            Dictionary with query_product and recommendations
        """
        query_product = self.find_product(query)
        
        if not query_product:
            raise ValueError(f"Product not found: {query}")
        
        recommendations = self.get_recommendations(query, top_k, include_query_product=False)
        
        return {
            'query_product': {
                'gtin': query_product['gtin'],
                'name': query_product['name'],
                'brand': query_product.get('brand', ''),
                'category': query_product.get('category', ''),
                'category_name': query_product.get('category_name', ''),
                'subcategory_name': query_product.get('subcategory_name', ''),
                'vendor': query_product.get('vendor', ''),
                'temperature_category': query_product.get('temperature_category', ''),
                'nutrition': query_product.get('nutrition', {}),
                'allergens': query_product.get('allergens', {}),
                'dietary_claims': query_product.get('dietary_claims', [])
            },
            'recommendations': recommendations,
            'total_found': len(recommendations)
        }
    
    def format_recommendation(self, rec: Dict[str, Any], index: int) -> str:
        """Format a single recommendation for display"""
        lines = []
        lines.append(f"\n{index}. {rec['name']}")
        lines.append(f"   GTIN: {rec['gtin']}")
        lines.append(f"   Similarity Score: {rec['similarity_score']:.4f}")
        
        if rec.get('brand'):
            lines.append(f"   Brand: {rec['brand']}")
        
        lines.append(f"   Category: {rec['category']}")
        lines.append(f"   Temperature: {rec['temperature_category']}")
        
        # Nutrition summary
        nutrition = rec.get('nutrition', {})
        if nutrition:
            nutri_parts = []
            if 'calories' in nutrition:
                nutri_parts.append(f"{nutrition['calories']:.0f} kcal")
            if 'protein' in nutrition:
                nutri_parts.append(f"{nutrition['protein']:.1f}g protein")
            if 'fat' in nutrition:
                nutri_parts.append(f"{nutrition['fat']:.1f}g fat")
            if nutri_parts:
                lines.append(f"   Nutrition: {', '.join(nutri_parts)}")
        
        # Allergens
        allergens = rec.get('allergens', {})
        if allergens.get('contains'):
            lines.append(f"   Allergens: {', '.join(allergens['contains'])}")
        
        # Dietary claims
        if rec.get('dietary_claims'):
            lines.append(f"   Dietary: {', '.join(rec['dietary_claims'])}")
        
        return '\n'.join(lines)
    
    def print_recommendations(self, result: Dict[str, Any]):
        """Pretty print recommendations"""
        print("\n" + "="*80)
        print("QUERY PRODUCT")
        print("="*80)
        
        qp = result['query_product']
        print(f"Name: {qp['name']}")
        print(f"GTIN: {qp['gtin']}")
        print(f"Brand: {qp.get('brand', 'N/A')}")
        print(f"Category: {qp['category']}")
        
        print("\n" + "="*80)
        print(f"TOP {len(result['recommendations'])} ALTERNATIVE PRODUCTS")
        print("="*80)
        
        for idx, rec in enumerate(result['recommendations'], 1):
            print(self.format_recommendation(rec, idx))
        
        print("\n" + "="*80)


def main():
    """Example usage"""
    # Initialize recommender
    recommender = ProductRecommender()
    
    # Example 1: Search by GTIN
    print("\nExample 1: Search by GTIN")
    print("-" * 80)
    try:
        result = recommender.get_recommendations_detailed("6409460002724", top_k=5)
        recommender.print_recommendations(result)
    except ValueError as e:
        print(f"Error: {e}")
    
    # Example 2: Search by name
    print("\n\nExample 2: Search by product name")
    print("-" * 80)
    try:
        result = recommender.get_recommendations_detailed("potato salad", top_k=5)
        recommender.print_recommendations(result)
    except ValueError as e:
        print(f"Error: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="Product Recommendation API",
    description="LLM-based product recommendation system",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global recommender instance
recommender = None


@app.on_event("startup")
async def startup_event():
    """Initialize recommendation engine on startup"""
    global recommender
    print("🚀 Initializing Product Recommendation Engine...")
    try:
        recommender = ProductRecommender()
        print("✅ Recommendation engine ready!")
        print(f"   Products loaded: {len(recommender.products)}")
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")
        import traceback
        traceback.print_exc()


# Response models
class Product(BaseModel):
    gtin: str
    name: str
    category: Optional[str] = ""
    category_name: Optional[str] = ""
    subcategory_name: Optional[str] = ""
    vendor: Optional[str] = ""
    similarity_score: Optional[float] = None


class RecommendationResponse(BaseModel):
    success: bool
    message: str
    query_product: Optional[Product] = None
    alternatives: List[Product] = []
    count: int


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Product Recommendation API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "recommend": "/recommend/{product_query}",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="Not initialized")
    
    return {
        "status": "healthy",
        "products_loaded": len(recommender.products),
        "index": "hackathon2"
    }


@app.get("/recommend/{product_query}", response_model=RecommendationResponse)
async def get_recommendations(
    product_query: str,
    count: int = Query(5, ge=1, le=20, description="Number of recommendations")
):
    """
    Get product recommendations by GTIN or product name
    
    Example queries:
    - /recommend/6407800018305
    - /recommend/chicken
    - /recommend/salad?count=3
    """
    if recommender is None:
        raise HTTPException(status_code=503, detail="Recommender not initialized")
    
    try:
        # Get recommendations
        result = recommender.get_recommendations_detailed(product_query, top_k=count)
        
        # Format response
        query_prod = result['query_product']
        query_product = Product(
            gtin=query_prod['gtin'],
            name=query_prod['name'],
            category=query_prod.get('category', ''),
            category_name=query_prod.get('category_name', ''),
            subcategory_name=query_prod.get('subcategory_name', ''),
            vendor=query_prod.get('vendor', '')
        )
        
        alternatives = []
        for rec in result['recommendations']:
            alternatives.append(Product(
                gtin=rec['gtin'],
                name=rec['name'],
                category=rec.get('category', ''),
                category_name=rec.get('category_name', ''),
                subcategory_name=rec.get('subcategory_name', ''),
                vendor=rec.get('vendor', ''),
                similarity_score=rec['similarity_score']
            ))
        
        return RecommendationResponse(
            success=True,
            message=f"Found {len(alternatives)} alternatives",
            query_product=query_product,
            alternatives=alternatives,
            count=len(alternatives)
        )
    
    except ValueError as e:
        return RecommendationResponse(
            success=False,
            message=str(e),
            query_product=None,
            alternatives=[],
            count=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search")
async def search_products(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50)
):
    """Search products by name"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="Not initialized")
    
    try:
        products = recommender.products
        query_lower = q.lower()
        
        matching = []
        for p in products:
            if query_lower in p['name'].lower():
                matching.append({
                    "gtin": p['gtin'],
                    "name": p['name'],
                    "category_name": p.get('category_name', ''),
                    "subcategory_name": p.get('subcategory_name', '')
                })
                if len(matching) >= limit:
                    break
        
        return {
            "query": q,
            "results": matching,
            "count": len(matching)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    load_dotenv()
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

