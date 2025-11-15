"""
AI-powered claim processing service
Uses OpenAI Vision API to analyze claim images and make decisions
"""
from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import base64
import os
import json
from app.database import SessionLocal
from app import models

load_dotenv()

# Initialize OpenAI client (will be created with API key when needed)
def get_openai_client():
    """Get OpenAI client with API key"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables")
    return OpenAI(api_key=api_key)


class ClaimResult(BaseModel):
    """Result from AI claim processing"""
    summary: str
    confidence: float  # 0.0 to 1.0
    decision: str  # "approved", "rejected", or "manual_review_needed"


SYSTEM_INSTRUCTIONS = """You are an expert AI claim assessment system for a food service logistics company (Valio Aimo). Your role is to analyze customer claims about delivery issues and make informed decisions.

## Your Task
Analyze customer claims based on:
1. Claim type and description
2. Order information (what was ordered vs what was delivered)
3. Visual evidence from uploaded images/videos
4. Product information and specifications

## Claim Types and Assessment Criteria

### MISSING_ITEM
- **What to check**: Compare order lines (ordered quantities) with what appears in images
- **Evidence needed**: 
  - Images showing incomplete delivery
  - Order shows items that are not visible in delivery images
  - Empty spaces or missing packages in crates/boxes
- **Decision guidelines**:
  - **APPROVE** if: Images clearly show missing items, order confirms items were ordered, high confidence (>0.85)
  - **REJECT** if: All ordered items appear in images, no evidence of missing items, customer error
  - **MANUAL_REVIEW** if: Unclear images, partial visibility, conflicting evidence, confidence <0.75

### DAMAGED_ITEM
- **What to check**: Physical condition of products in images
- **Evidence needed**:
  - Visible damage (dents, tears, leaks, broken packaging)
  - Product condition that affects usability or safety
  - Packaging integrity issues
- **Decision guidelines**:
  - **APPROVE** if: Clear visible damage affecting product quality/safety, high confidence (>0.85)
  - **REJECT** if: No visible damage, normal wear acceptable for transport, cosmetic only
  - **MANUAL_REVIEW** if: Unclear damage extent, requires quality assessment, confidence <0.75

### WRONG_ITEM
- **What to check**: Product codes, names, or visual product identification
- **Evidence needed**:
  - Product in image doesn't match ordered product name/code
  - Wrong brand, size, or variant delivered
  - Visual mismatch between ordered and delivered items
- **Decision guidelines**:
  - **APPROVE** if: Clear product mismatch, wrong item visible in images, high confidence (>0.85)
  - **REJECT** if: Correct product delivered, matches order specifications
  - **MANUAL_REVIEW** if: Similar products, variant differences, requires product verification

### QUALITY_ISSUE
- **What to check**: Product quality, freshness, expiration, contamination
- **Evidence needed**:
  - Expired or near-expiry products
  - Signs of spoilage, mold, or contamination
  - Quality defects affecting usability
  - Temperature-related issues (frozen items thawed, etc.)
- **Decision guidelines**:
  - **APPROVE** if: Clear quality issues (expired, spoiled, contaminated), safety concerns, high confidence (>0.85)
  - **REJECT** if: Products within acceptable quality standards, normal appearance
  - **MANUAL_REVIEW** if: Requires expert quality assessment, unclear quality issues, confidence <0.75

## Image Analysis Guidelines

### When Images Are Available:
1. **Examine each image carefully** for evidence supporting the claim type
2. **Count items** in images and compare with ordered quantities
3. **Inspect product condition** for damage, quality issues
4. **Identify products** by packaging, labels, or visual appearance
5. **Note any inconsistencies** between order and visual evidence
6. **Assess image quality** - if images are unclear, blurry, or don't show relevant items, lower confidence

### When Images Are NOT Available:
1. **Base decision on textual information only**
2. **Lower confidence scores** (typically 0.5-0.7 range)
3. **Favor MANUAL_REVIEW** when images are missing, especially for:
   - DAMAGED_ITEM claims (visual evidence critical)
   - QUALITY_ISSUE claims (requires visual inspection)
   - WRONG_ITEM claims (product identification needed)
4. **Can still APPROVE** MISSING_ITEM claims if order data clearly shows discrepancies

## Confidence Scoring

- **0.9-1.0**: Very high confidence - clear, unambiguous evidence
- **0.75-0.89**: High confidence - strong evidence with minor uncertainties
- **0.6-0.74**: Moderate confidence - some evidence but requires verification
- **0.5-0.59**: Low confidence - limited evidence, high uncertainty
- **<0.5**: Very low confidence - insufficient evidence

## Decision Rules

1. **Always prioritize safety** - Quality issues affecting safety should be approved
2. **Be conservative with high-value claims** - When in doubt, flag for manual review
3. **Consider customer history** - If provided, factor into decision (not in current data)
4. **Image quality matters** - Poor quality images reduce confidence
5. **Missing images** - Generally require manual review except for clear textual discrepancies

## Response Format

You MUST respond with a valid JSON object only (no markdown, no code blocks, just pure JSON):
{
  "decision": "approved" | "rejected" | "manual_review_needed",
  "summary": "A detailed explanation of your analysis, what evidence you found, and why you made this decision",
  "confidence": 0.0-1.0
}

The summary should:
- Clearly state what evidence was found (or not found)
- Explain the reasoning for the decision
- Mention any limitations (e.g., "Images were unclear", "Missing visual evidence")
- Be professional and factual
- Be 2-4 sentences long

Important: Return ONLY the JSON object, no additional text, no markdown formatting, no code blocks.
"""


def encode_image(image_path: str) -> str:
    """Encode image file to base64 string"""
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
    except Exception as e:
        print(f"Error encoding image {image_path}: {e}")
        return None


def build_claim_info_text(claim: models.Claim, order: models.Order) -> str:
    """
    Build comprehensive text description of claim and order for AI analysis
    """
    parts = []
    
    # Claim Information
    parts.append("=== CLAIM INFORMATION ===")
    parts.append(f"Claim ID: {claim.claim_id}")
    parts.append(f"Claim Type: {claim.claim_type.value}")
    parts.append(f"Claim Status: {claim.status.value}")
    parts.append(f"Created: {claim.created_at}")
    
    # Order Information
    parts.append("\n=== ORDER INFORMATION ===")
    parts.append(f"Order ID: {order.order_id}")
    parts.append(f"Order Date: {order.order_datetime}")
    parts.append(f"Delivery Date: {order.delivery_date}")
    if order.delivery_window_start and order.delivery_window_end:
        parts.append(f"Delivery Window: {order.delivery_window_start} - {order.delivery_window_end}")
    parts.append(f"Order Status: {order.status.value}")
    
    # Order Lines (What was ordered)
    parts.append("\n=== ORDERED ITEMS ===")
    for line in order.order_lines:
        product_name = line.product.product_name if line.product else f"Product {line.product_code}"
        parts.append(f"- {product_name} (Code: {line.product_code})")
        parts.append(f"  Ordered Quantity: {line.ordered_qty}")
        parts.append(f"  Delivered Quantity: {line.delivered_qty}")
        if line.shortage_flag:
            parts.append(f"  ⚠️ SHORTAGE DETECTED: {line.shortage_ratio:.0%} missing")
        if line.customer_comments:
            parts.append(f"  Customer Comments: {line.customer_comments}")
    
    # Claim Lines (What customer is reporting)
    parts.append("\n=== CLAIM DETAILS ===")
    for claim_line in claim.claim_lines:
        if claim_line.reported_issue:
            parts.append(f"Reported Issue: {claim_line.reported_issue}")
        if claim_line.product_code:
            parts.append(f"Affected Product Code: {claim_line.product_code}")
        if claim_line.line_id:
            parts.append(f"Related Order Line ID: {claim_line.line_id}")
    
    # Customer Information
    if order.customer:
        parts.append("\n=== CUSTOMER INFORMATION ===")
        parts.append(f"Customer: {order.customer.name}")
        parts.append(f"Segment: {order.customer.segment or 'N/A'}")
    
    # Attachments Info
    parts.append(f"\n=== ATTACHMENTS ===")
    parts.append(f"Number of attachments: {len(claim.claim_attachments)}")
    for i, attachment in enumerate(claim.claim_attachments, 1):
        parts.append(f"Attachment {i}: {attachment.file_type} - {attachment.file_path}")
    
    return "\n".join(parts)


def process_claim(claim_id: str) -> Optional[ClaimResult]:
    """
    Process a claim using AI vision analysis
    
    Args:
        claim_id: The claim ID to process
    
    Returns:
        ClaimResult with decision, summary, and confidence, or None if error
    """
    # Check if OpenAI API key is available
    if not os.getenv('OPENAI_API_KEY'):
        print("Warning: OPENAI_API_KEY not found. Cannot process claim with AI.")
        return None
    
    db = SessionLocal()
    
    try:
        from sqlalchemy.orm import joinedload
        
        # Retrieve claim with all relationships
        claim = db.query(models.Claim).options(
            joinedload(models.Claim.claim_lines),
            joinedload(models.Claim.claim_attachments),
            joinedload(models.Claim.order).joinedload(models.Order.order_lines).joinedload(models.OrderLine.product),
            joinedload(models.Claim.order).joinedload(models.Order.customer)
        ).filter(
            models.Claim.claim_id == claim_id
        ).first()
        
        if not claim:
            print(f"Claim {claim_id} not found")
            return None
        
        # Get order (already loaded via relationship)
        order = claim.order
        
        if not order:
            print(f"Order {claim.order_id} not found for claim {claim_id}")
            return None
        
        # Build claim information text
        claim_info = build_claim_info_text(claim, order)
        
        # Prepare messages for OpenAI
        messages = [{
            "role": "system",
            "content": SYSTEM_INSTRUCTIONS
        }]
        
        # Build user message with text and images
        user_content = [{"type": "text", "text": claim_info}]
        
        # Add images from attachments
        image_count = 0
        for attachment in claim.claim_attachments:
            if attachment.file_type == "IMAGE":
                # Handle both relative and absolute paths
                file_path = attachment.file_path
                if not os.path.isabs(file_path):
                    # If relative, try to resolve from current directory
                    file_path = os.path.join(os.getcwd(), file_path)
                
                if os.path.exists(file_path):
                    try:
                        base64_image = encode_image(file_path)
                        if base64_image:
                            # Determine image format from file extension
                            ext = os.path.splitext(file_path)[1].lower()
                            mime_type = "image/jpeg"
                            if ext in ['.png']:
                                mime_type = "image/png"
                            elif ext in ['.gif']:
                                mime_type = "image/gif"
                            elif ext in ['.webp']:
                                mime_type = "image/webp"
                            
                            user_content.append({
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}"
                                }
                            })
                            image_count += 1
                    except Exception as e:
                        print(f"Error processing attachment {file_path}: {e}")
                else:
                    print(f"Warning: Attachment file not found: {file_path}")
        
        # Add note if no images available
        if image_count == 0:
            user_content.append({
                "type": "text",
                "text": "\n⚠️ NOTE: No images are available for this claim. Please base your assessment on the textual information provided above. This should generally result in lower confidence scores and may require manual review."
            })
        
        messages.append({
            "role": "user",
            "content": user_content
        })
        
        # Call OpenAI Vision API
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4o",  # Using gpt-4o for vision capabilities
            messages=messages,
            max_tokens=1000,
            temperature=0.3,  # Lower temperature for more consistent, factual responses
            response_format={"type": "json_object"}  # Request JSON response
        )
        
        # Parse response (should be JSON due to response_format)
        response_text = response.choices[0].message.content
        
        try:
            # Try parsing directly first (since we requested JSON format)
            try:
                result_data = json.loads(response_text.strip())
            except json.JSONDecodeError:
                # If direct parse fails, try to extract JSON from markdown or text
                if "```json" in response_text:
                    json_start = response_text.find("```json") + 7
                    json_end = response_text.find("```", json_start)
                    json_str = response_text[json_start:json_end].strip()
                elif "```" in response_text:
                    json_start = response_text.find("```") + 3
                    json_end = response_text.find("```", json_start)
                    json_str = response_text[json_start:json_end].strip()
                else:
                    # Try to find JSON object directly
                    json_start = response_text.find("{")
                    json_end = response_text.rfind("}") + 1
                    if json_start >= 0 and json_end > json_start:
                        json_str = response_text[json_start:json_end]
                    else:
                        raise ValueError("No JSON found in response")
                
                result_data = json.loads(json_str)
            
            # Validate and create ClaimResult
            decision = result_data.get("decision", "manual_review_needed")
            if decision not in ["approved", "rejected", "manual_review_needed"]:
                decision = "manual_review_needed"
            
            confidence = float(result_data.get("confidence", 0.5))
            confidence = max(0.0, min(1.0, confidence))  # Clamp between 0 and 1
            
            summary = result_data.get("summary", response_text)
            
            return ClaimResult(
                decision=decision,
                summary=summary,
                confidence=confidence
            )
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"Error parsing AI response: {e}")
            print(f"Response text: {response_text}")
            
            # Fallback: try to extract decision from text
            decision = "manual_review_needed"
            confidence = 0.5
            
            if "approved" in response_text.lower():
                decision = "approved"
            elif "rejected" in response_text.lower():
                decision = "rejected"
            
            return ClaimResult(
                decision=decision,
                summary=response_text[:500],  # Use first 500 chars as summary
                confidence=confidence
            )
    
    except Exception as e:
        print(f"Error processing claim {claim_id}: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    finally:
        db.close()
