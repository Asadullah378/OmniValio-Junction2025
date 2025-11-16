"""
Product Data Preprocessing Script for CSV Format
Extracts and structures product attributes for recommendation engine
"""
import pandas as pd
import json
import os
from typing import Dict, Any


def get_temperature_category(temp_condition: int) -> str:
    """Map temperature condition to category"""
    temp_map = {
        0: "frozen",
        1: "frozen",
        2: "frozen",
        3: "refrigerated",
        4: "refrigerated",
        5: "chilled",
        6: "chilled",
        7: "frozen",
        8: "ambient",
        9: "ambient"
    }
    return temp_map.get(temp_condition, "ambient")


def parse_allergens(allergen_str: str) -> Dict[str, list]:
    """Parse allergen string into structured format"""
    allergens = {
        "contains": [],
        "may_contain": [],
        "free_from": []
    }
    
    if pd.isna(allergen_str) or not allergen_str:
        return allergens
    
    allergen_str = str(allergen_str).lower()
    
    # Common allergens to look for
    allergen_keywords = {
        'milk': 'milk',
        'eggs': 'eggs',
        'egg': 'eggs',
        'wheat': 'wheat',
        'gluten': 'gluten',
        'soy': 'soy',
        'peanuts': 'peanuts',
        'nuts': 'nuts',
        'fish': 'fish',
        'shellfish': 'shellfish',
        'sesame': 'sesame',
        'celery': 'celery',
        'mustard': 'mustard',
        'sulphites': 'sulphur dioxide',
        'sulphur': 'sulphur dioxide'
    }
    
    for keyword, allergen_name in allergen_keywords.items():
        if keyword in allergen_str:
            if 'may contain' in allergen_str or 'traces of' in allergen_str:
                if allergen_name not in allergens['may_contain']:
                    allergens['may_contain'].append(allergen_name)
            else:
                if allergen_name not in allergens['contains']:
                    allergens['contains'].append(allergen_name)
    
    return allergens


def parse_dietary_claims(labels: str, ingredients: str) -> list:
    """Extract dietary claims from labels and ingredients"""
    claims = []
    
    label_text = str(labels).lower() if not pd.isna(labels) else ""
    ingredient_text = str(ingredients).lower() if not pd.isna(ingredients) else ""
    
    # Check for vegan/vegetarian
    if 'vegan' in label_text:
        claims.append('vegan')
    if 'vegetarian' in label_text:
        claims.append('vegetarian')
    
    # Check for gluten-free
    if 'gluten-free' in label_text or 'gluten free' in label_text:
        claims.append('gluten-free')
    
    # Check for lactose-free
    if 'lactose-free' in label_text or 'lactose free' in label_text or 'lactose free' in ingredient_text:
        claims.append('lactose-free')
    
    return claims


def preprocess_product(row: pd.Series) -> Dict[str, Any]:
    """
    Extract and structure all relevant attributes from a product row
    """
    # Basic information
    gtin = str(row.get('gtin', '')).strip()
    product_code = str(row.get('product_code', '')).strip()
    name_en = str(row.get('product_name_en', '')).strip()
    name_fi = str(row.get('product_name_fi', '')).strip()
    
    # Use English name, fallback to Finnish
    name = name_en if name_en and name_en != 'nan' else name_fi
    if not name or name == 'nan':
        name = f"Product {product_code}"
    
    # Brand and category
    category = str(row.get('category', '')).strip()
    vendor = str(row.get('vendor_name', '')).strip()
    
    # Nutritional content
    nutrition = {}
    for nutrient in ['energy_kj', 'protein', 'carbohydrates', 'fat', 'sugar', 'salt']:
        value = row.get(nutrient)
        if not pd.isna(value) and value != '':
            try:
                nutrition[nutrient] = float(value)
            except (ValueError, TypeError):
                pass
    
    # Rename energy_kj to calories (approximation: kJ / 4.184 = kcal)
    if 'energy_kj' in nutrition:
        nutrition['calories'] = nutrition['energy_kj'] / 4.184
        del nutrition['energy_kj']
    
    # Allergens
    allergen_str = row.get('allergens', '')
    allergens = parse_allergens(allergen_str)
    
    # Dietary claims
    labels = row.get('labels', '')
    ingredients_str = row.get('ingredients', '')
    dietary_claims = parse_dietary_claims(labels, ingredients_str)
    
    # Ingredients (parse from string)
    ingredients = []
    if not pd.isna(ingredients_str) and ingredients_str:
        # Split by common separators
        ingredient_list = str(ingredients_str).split(',')
        ingredients = [ing.strip() for ing in ingredient_list[:10]]  # Top 10
    
    # Temperature and storage
    temp_condition = row.get('temperature_condition', 8)
    try:
        temp_condition = int(temp_condition)
    except (ValueError, TypeError):
        temp_condition = 8
    temp_category = get_temperature_category(temp_condition)
    
    # Marketing text for context
    marketing_text = str(row.get('marketing_text', '')).strip()
    if marketing_text == 'nan':
        marketing_text = ""
    
    # Country of origin
    country = str(row.get('country_of_origin', '')).strip()
    if country == 'nan':
        country = ""
    
    # Get enriched category fields
    category_name = str(row.get('category_name', '')).strip()
    if category_name == 'nan':
        category_name = ""
    
    subcategory_name = str(row.get('subcategory_name', '')).strip()
    if subcategory_name == 'nan':
        subcategory_name = ""
    
    # Create structured product record
    structured_product = {
        "gtin": gtin,
        "product_code": product_code,
        "name": name,
        "name_fi": name_fi if name_fi != 'nan' else "",
        "brand": "",  # Not directly available in CSV
        "category": category if category != 'nan' else "",
        "category_name": category_name,  # Human-readable category
        "subcategory_name": subcategory_name,  # Human-readable subcategory
        "vendor": vendor if vendor != 'nan' else "",
        "nutrition": nutrition,
        "allergens": allergens,
        "dietary_claims": dietary_claims,
        "ingredients": ingredients,
        "temperature_category": temp_category,
        "country_of_origin": country,
        "marketing_text": marketing_text[:500] if marketing_text else "",
        "sales_unit": str(row.get('sales_unit', '')).strip(),
        "deleted": False
    }
    
    return structured_product


def create_search_text(product: Dict[str, Any]) -> str:
    """
    Create a rich text representation for embedding generation
    This text captures all substitution-relevant features
    """
    parts = []
    
    # Product identity
    parts.append(f"Product: {product['name']}")
    
    # Category and type (use human-readable if available)
    if product.get('category_name'):
        parts.append(f"Category: {product['category_name']}")
        if product.get('subcategory_name'):
            parts.append(f"Subcategory: {product['subcategory_name']}")
    elif product.get('category'):
        parts.append(f"Category: {product['category']}")
    
    # Temperature/storage
    parts.append(f"Storage: {product['temperature_category']}")
    
    # Nutritional profile
    nutrition = product.get('nutrition', {})
    if nutrition:
        nutri_parts = []
        if 'calories' in nutrition:
            nutri_parts.append(f"{nutrition['calories']:.0f} kcal")
        if 'protein' in nutrition:
            nutri_parts.append(f"{nutrition['protein']:.1f}g protein")
        if 'fat' in nutrition:
            nutri_parts.append(f"{nutrition['fat']:.1f}g fat")
        if 'carbohydrates' in nutrition:
            nutri_parts.append(f"{nutrition['carbohydrates']:.1f}g carbs")
        
        if nutri_parts:
            parts.append(f"Nutrition (per 100g): {', '.join(nutri_parts)}")
    
    # Allergens
    allergens = product.get('allergens', {})
    if allergens.get('contains'):
        parts.append(f"Contains allergens: {', '.join(allergens['contains'])}")
    if allergens.get('free_from'):
        parts.append(f"Free from: {', '.join(allergens['free_from'])}")
    
    # Dietary claims
    if product.get('dietary_claims'):
        parts.append(f"Dietary: {', '.join(product['dietary_claims'])}")
    
    # Key ingredients
    if product.get('ingredients'):
        ingredients_str = ', '.join(product['ingredients'][:5])
        parts.append(f"Main ingredients: {ingredients_str}")
    
    # Vendor
    if product.get('vendor'):
        parts.append(f"Vendor: {product['vendor']}")
    
    # Marketing text (if available)
    if product.get('marketing_text'):
        # Add first 200 chars of marketing text
        marketing_snippet = product['marketing_text'][:200]
        parts.append(f"Description: {marketing_snippet}")
    
    return ". ".join(parts)


def main():
    """Main preprocessing pipeline"""
    print("Starting product data preprocessing from CSV...")
    
    # Get the CSV path from config
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Try to load from config first
    try:
        import config
        csv_path = os.path.join(script_dir, config.PRODUCT_DATA_PATH)
    except:
        # Fallback
        csv_path = os.path.join(script_dir, "product_descriptions.csv")
        if not os.path.exists(csv_path):
            csv_path = os.path.join(script_dir, "..", "product_descriptions.csv")
    
    print(f"Loading product data from: {csv_path}")
    
    if not os.path.exists(csv_path):
        print(f"❌ Error: CSV file not found at {csv_path}")
        return
    
    # Load CSV
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"Loaded {len(df)} products from CSV")
    
    # Import config to get MAX_PRODUCTS limit
    try:
        import config
        if hasattr(config, 'MAX_PRODUCTS') and config.MAX_PRODUCTS:
            df = df.head(config.MAX_PRODUCTS)
            print(f"⚠️  Limiting to first {len(df)} products (MAX_PRODUCTS={config.MAX_PRODUCTS})")
    except Exception as e:
        print(f"Note: Could not load MAX_PRODUCTS from config: {e}")
    
    # Process all products
    processed_products = []
    skipped = 0
    
    for idx, row in df.iterrows():
        try:
            structured = preprocess_product(row)
            
            # Add search text
            structured['search_text'] = create_search_text(structured)
            
            processed_products.append(structured)
            
            if (idx + 1) % 1000 == 0:
                print(f"Processed {idx + 1}/{len(df)} products...")
        
        except Exception as e:
            print(f"Error processing product at index {idx}: {e}")
            skipped += 1
            continue
    
    print(f"\nProcessing complete!")
    print(f"Total products processed: {len(processed_products)}")
    print(f"Products skipped: {skipped}")
    
    # Save processed data
    output_path = os.path.join(script_dir, "processed_products.json")
    print(f"\nSaving processed data to: {output_path}")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(processed_products, f, indent=2, ensure_ascii=False)
    
    print("Preprocessing complete!")
    
    # Show example
    if processed_products:
        print("\n" + "="*80)
        print("Example processed product:")
        print("="*80)
        example = processed_products[0]
        print(f"GTIN: {example['gtin']}")
        print(f"Product Code: {example['product_code']}")
        print(f"Name: {example['name']}")
        print(f"Category: {example['category']}")
        print(f"\nSearch Text:\n{example['search_text']}")
        print("="*80)


if __name__ == "__main__":
    main()

