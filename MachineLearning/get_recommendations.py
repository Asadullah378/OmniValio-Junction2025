"""
Simple Product Recommendation Function
For integration with backend services
"""
from typing import List, Dict, Any, Union, Optional
from pinecone import Pinecone
from openai import OpenAI
from dotenv import load_dotenv
from difflib import SequenceMatcher
import json
import os


def get_product_recommendations(
    product_query: Union[str, int],
    n: int = 5,
    openai_api_key: str = None,
    pinecone_api_key: str = None,
    pinecone_index_name: str = "hackathon2",
    pinecone_host: str = "https://hackathon2-bxd09my.svc.gcp-europe-west4-de1d.pinecone.io"
) -> Dict[str, Any]:
    """
    Get product recommendations based on a product query.
    
    Args:
        product_query (str|int): Product GTIN (barcode number) or product name
        n (int): Number of recommendations to return (default: 5)
        openai_api_key (str): OpenAI API key (or set OPENAI_API_KEY env var)
        pinecone_api_key (str): Pinecone API key (or set PINECONE_KEY env var)
        pinecone_index_name (str): Pinecone index name
        pinecone_host (str): Pinecone host URL
    
    Returns:
        dict: {
            "success": bool,
            "message": str,
            "query_product": {
                "gtin": str,
                "name": str,
                "category": str,
                "brand": str,
                ...
            },
            "recommendations": [
                {
                    "gtin": str,
                    "name": str,
                    "brand": str,
                    "category": str,
                    "similarity_score": float,
                    ...
                },
                ...
            ],
            "total_found": int
        }
    
    Example:
        >>> result = get_product_recommendations("6409460002724", n=5)
        >>> print(f"Found {result['total_found']} recommendations")
        >>> for rec in result['recommendations']:
        ...     print(f"{rec['name']} - Score: {rec['similarity_score']:.2f}")
        
        >>> result = get_product_recommendations("potato salad", n=3)
    """
    
    # Get API keys from arguments or environment
    openai_key = openai_api_key or os.getenv("OPENAI_API_KEY")
    pinecone_key = pinecone_api_key or os.getenv("PINECONE_KEY")
    
    if not openai_key:
        return {
            "success": False,
            "message": "OpenAI API key not provided",
            "query_product": None,
            "recommendations": [],
            "total_found": 0
        }
    
    if not pinecone_key:
        return {
            "success": False,
            "message": "Pinecone API key not provided",
            "query_product": None,
            "recommendations": [],
            "total_found": 0
        }
    
    try:
        # Initialize clients
        openai_client = OpenAI(api_key=openai_key)
        pc = Pinecone(api_key=pinecone_key)
        index = pc.Index(pinecone_index_name, host=pinecone_host)
        
        # Load products database
        script_dir = os.path.dirname(os.path.abspath(__file__))
        processed_path = os.path.join(script_dir, "processed_products.json")
        
        with open(processed_path, 'r', encoding='utf-8') as f:
            products = json.load(f)
        
        # Create GTIN lookup
        gtin_to_product = {p['gtin']: p for p in products}
        
        # Find the query product
        query_product = _find_product(product_query, products, gtin_to_product)
        
        if not query_product:
            return {
                "success": False,
                "message": f"Product not found: {product_query}",
                "query_product": None,
                "recommendations": [],
                "total_found": 0
            }
        
        # Generate embedding for the query product
        embedding_response = openai_client.embeddings.create(
            model="text-embedding-3-large",
            input=query_product['search_text'],
            dimensions=1024
        )
        query_embedding = embedding_response.data[0].embedding
        
        # Search Pinecone for similar products
        search_results = index.query(
            vector=query_embedding,
            top_k=n + 10,  # Get extra to filter out query product
            include_metadata=True
        )
        
        # Process recommendations
        recommendations = []
        query_gtin = query_product['gtin']
        
        for match in search_results['matches']:
            match_gtin = match['id']
            
            # Skip the query product itself
            if match_gtin == query_gtin:
                continue
            
            # Get full product details
            full_product = gtin_to_product.get(match_gtin)
            
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
                    'similarity_score': round(match['score'], 4)
                }
                
                recommendations.append(recommendation)
                
                # Stop when we have enough
                if len(recommendations) >= n:
                    break
        
        return {
            "success": True,
            "message": f"Found {len(recommendations)} recommendations",
            "query_product": {
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
            "recommendations": recommendations,
            "total_found": len(recommendations)
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "query_product": None,
            "recommendations": [],
            "total_found": 0
        }


def _find_product(
    query: Union[str, int],
    products: List[Dict[str, Any]],
    gtin_to_product: Dict[str, Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """Helper function to find a product by GTIN or name"""
    query_str = str(query).strip()
    
    # Try GTIN first (if it's all digits)
    if query_str.replace('.', '').isdigit() and len(query_str) >= 8:
        # Try exact match
        if query_str in gtin_to_product:
            return gtin_to_product[query_str]
        
        # Try with .0 appended
        gtin_float = f"{query_str}.0"
        if gtin_float in gtin_to_product:
            return gtin_to_product[gtin_float]
        
        # Try stripping .0
        if query_str.endswith('.0'):
            gtin_clean = query_str[:-2]
            if gtin_clean in gtin_to_product:
                return gtin_to_product[gtin_clean]
    
    # Try name search with fuzzy matching
    best_match = None
    best_score = 0
    threshold = 0.6
    
    name_lower = query_str.lower()
    
    for product in products:
        product_name = product['name'].lower()
        score = SequenceMatcher(None, name_lower, product_name).ratio()
        
        # Check Finnish and Swedish names too
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


# Example usage
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    print("="*80)
    print("Product Recommendation Function - Example Usage")
    print("="*80)
    
    
    # Example 2: Search by name
    print("\n2. Search by product name:")
    print("-" * 80)
    result = get_product_recommendations("chocolate bar", n=3)
    
    if result['success']:
        print(f"✅ Query Product: {result['query_product']['name']}")
        print(f"📦 Found {result['total_found']} recommendations:\n")
        for i, rec in enumerate(result['recommendations'], 1):
            print(f"   {i}. {rec['name']}")
            print(f"      Similarity: {rec['similarity_score']:.2f}")
            print()
    else:
        print(f"❌ {result['message']}")

