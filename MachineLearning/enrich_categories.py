"""
Enrich product CSV with human-readable categories and subcategories using GPT-4o-mini
Processes in batches to minimize API calls
"""
import pandas as pd
import json
from openai import OpenAI
from tqdm import tqdm
import time
import os
import config

# Initialize OpenAI client
client = OpenAI(api_key=config.OPENAI_API_KEY)

def create_batch_prompt(products_batch):
    """Create a prompt for a batch of products"""
    
    products_info = []
    for idx, row in products_batch.iterrows():
        product_info = {
            "index": idx,
            "name": row.get('product_name_en', ''),
            "name_fi": row.get('product_name_fi', ''),
            "existing_category": row.get('category', ''),
            "vendor": row.get('vendor_name', ''),
            "ingredients": str(row.get('ingredients', ''))[:200] if pd.notna(row.get('ingredients')) else '',
            "marketing": str(row.get('marketing_text', ''))[:200] if pd.notna(row.get('marketing_text')) else ''
        }
        products_info.append(product_info)
    
    prompt = f"""You are a product categorization expert. Analyze these {len(products_info)} products and assign each a clear CATEGORY and SUBCATEGORY.

Products to categorize:
{json.dumps(products_info, indent=2)}

Rules:
1. CATEGORY should be broad (e.g., "Dairy & Eggs", "Meat & Poultry", "Bakery", "Beverages", "Snacks", "Frozen Foods", "Fresh Produce", "Pantry Staples", "Household Items", "Personal Care")
2. SUBCATEGORY should be specific (e.g., "Yogurt", "Chicken Products", "Bread", "Soft Drinks", "Chips & Crisps", "Ice Cream", "Vegetables", "Cooking Oils", "Cleaning Supplies", "Toiletries")
3. Use clear, customer-friendly names
4. Be consistent across similar products
5. Consider the product name, ingredients, and description

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {{"index": 0, "category": "Category Name", "subcategory": "Subcategory Name"}},
  {{"index": 1, "category": "Category Name", "subcategory": "Subcategory Name"}}
]"""
    
    return prompt


def categorize_batch(products_batch, batch_num, total_batches):
    """Use GPT-4o-mini to categorize a batch of products"""
    
    try:
        prompt = create_batch_prompt(products_batch)
        
        print(f"\n📤 Processing batch {batch_num}/{total_batches} ({len(products_batch)} products)...")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Fast and cost-effective
            messages=[
                {"role": "system", "content": "You are a product categorization expert. Always return valid JSON arrays."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Lower temperature for consistency
            max_tokens=2000
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if result_text.startswith("```json"):
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif result_text.startswith("```"):
            result_text = result_text.split("```")[1].split("```")[0].strip()
        
        categories = json.loads(result_text)
        
        print(f"✅ Batch {batch_num} processed successfully")
        return categories
    
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error in batch {batch_num}: {e}")
        print(f"Response: {result_text[:200]}")
        return None
    except Exception as e:
        print(f"❌ Error processing batch {batch_num}: {e}")
        return None


def main(test_mode=False):
    """Main enrichment process"""
    
    print("="*80)
    print("🏷️  PRODUCT CATEGORY ENRICHMENT")
    print("="*80)
    
    # Load CSV
    csv_path = "product_descriptions_top1000.csv"
    print(f"\n📂 Loading: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"✅ Loaded {len(df)} products")
    
    # Add new columns if they don't exist
    if 'category_name' not in df.columns:
        df['category_name'] = ''
    if 'subcategory_name' not in df.columns:
        df['subcategory_name'] = ''
    
    # Process in batches
    BATCH_SIZE = 20  # Process 20 products per API call
    
    if test_mode:
        print("\n🧪 TEST MODE: Processing only 1 batch (20 products)")
        max_batches = 1
    else:
        max_batches = (len(df) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"\n📊 Processing {len(df)} products in {max_batches} batches")
    
    print(f"   Batch size: {BATCH_SIZE}")
    print(f"   Model: gpt-4o-mini")
    
    if not test_mode:
        print(f"   Estimated cost: ~$0.01-0.02")
        # Confirm before proceeding
        response = input("\n⚠️  This will use OpenAI API. Continue? (y/n): ")
        if response.lower() != 'y':
            print("❌ Cancelled")
            return
    
    print("\n" + "="*80)
    print("🚀 Starting enrichment...")
    print("="*80)
    
    all_results = []
    processed_batches = 0
    
    for i in range(0, len(df), BATCH_SIZE):
        if test_mode and processed_batches >= max_batches:
            break
            
        batch_df = df.iloc[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        
        # Categorize batch
        categories = categorize_batch(batch_df, batch_num, max_batches)
        
        if categories:
            # Update dataframe
            for cat_info in categories:
                idx = cat_info['index']
                df.at[idx, 'category_name'] = cat_info['category']
                df.at[idx, 'subcategory_name'] = cat_info['subcategory']
                all_results.append(cat_info)
            
            # Show sample results
            if len(categories) > 0:
                sample = categories[0]
                product_name = df.iloc[sample['index']]['product_name_en']
                print(f"   Example: {product_name[:50]}")
                print(f"   → {sample['category']} / {sample['subcategory']}")
            
            processed_batches += 1
        
        # Rate limiting
        if not test_mode and batch_num < max_batches:
            time.sleep(1)  # Small delay between batches
    
    if test_mode:
        print("\n" + "="*80)
        print("🧪 TEST MODE - SAMPLE RESULTS")
        print("="*80)
        print(f"\n✅ Successfully categorized {len(all_results)} products")
        print("\nSample categorized products:")
        for i in range(min(10, len(all_results))):
            idx = all_results[i]['index']
            row = df.iloc[idx]
            print(f"\n{i+1}. {row['product_name_en'][:60]}")
            print(f"   Category: {row['category_name']}")
            print(f"   Subcategory: {row['subcategory_name']}")
        
        print("\n" + "="*80)
        print("✅ Test successful! Run without test_mode=True to process all batches")
        return
    
    print("\n" + "="*80)
    print("💾 Saving enriched dataset...")
    print("="*80)
    
    # Save enriched CSV
    output_path = "product_descriptions_top1000_enriched.csv"
    df.to_csv(output_path, index=False)
    print(f"✅ Saved to: {output_path}")
    
    # Replace original file
    df.to_csv(csv_path, index=False)
    print(f"✅ Updated: {csv_path}")
    
    # Show statistics
    print("\n" + "="*80)
    print("📊 ENRICHMENT SUMMARY")
    print("="*80)
    
    category_counts = df['category_name'].value_counts()
    print(f"\n🏷️  Categories created: {len(category_counts)}")
    print("\nTop categories:")
    for cat, count in category_counts.head(10).items():
        print(f"   • {cat}: {count} products")
    
    subcategory_counts = df['subcategory_name'].value_counts()
    print(f"\n🏷️  Subcategories created: {len(subcategory_counts)}")
    print("\nTop subcategories:")
    for subcat, count in subcategory_counts.head(10).items():
        print(f"   • {subcat}: {count} products")
    
    # Show examples
    print("\n" + "="*80)
    print("📝 SAMPLE ENRICHED PRODUCTS")
    print("="*80)
    
    for i in range(min(5, len(df))):
        row = df.iloc[i]
        print(f"\n{i+1}. {row['product_name_en']}")
        print(f"   Category: {row['category_name']}")
        print(f"   Subcategory: {row['subcategory_name']}")
    
    print("\n" + "="*80)
    print("✅ ENRICHMENT COMPLETE!")
    print("="*80)
    print(f"\n📦 Dataset now has:")
    print(f"   • {len(df)} products")
    print(f"   • {len(category_counts)} categories")
    print(f"   • {len(subcategory_counts)} subcategories")
    print(f"   • Human-readable labels")
    print(f"\n🚀 Ready to rebuild pipeline with enriched data!")


if __name__ == "__main__":
    import sys
    test_mode = '--test' in sys.argv or '-t' in sys.argv
    main(test_mode=test_mode)

