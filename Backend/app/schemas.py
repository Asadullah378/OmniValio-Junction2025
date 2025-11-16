"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Generic, TypeVar
from datetime import datetime
from app.models import (
    PriorityLevel, ContactChannel, Language, OrderStatus, 
    LineStatus, ClaimType, ClaimStatus, ResolutionType, SubstitutionQuality,
    UserRole, InvoiceType, InvoiceStatus, MessageSenderType
)


# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    segment: Optional[str] = None
    language_preference: Language = Language.FI
    contact_channel: ContactChannel = ContactChannel.VOICE_FIRST
    no_call_before: str = "07:00"
    accept_auto_substitutions_for_flexible_items: bool = True
    location: Optional[str] = None


class CustomerCreate(CustomerBase):
    customer_id: str


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    segment: Optional[str] = None
    language_preference: Optional[Language] = None
    contact_channel: Optional[ContactChannel] = None
    no_call_before: Optional[str] = None
    accept_auto_substitutions_for_flexible_items: Optional[bool] = None
    location: Optional[str] = None


class Customer(CustomerBase):
    customer_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Product Schemas
class ProductBase(BaseModel):
    product_name: str
    gtin: Optional[str] = None
    product_name_en: Optional[str] = None
    product_name_fi: Optional[str] = None
    category_code: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    vendor_name: Optional[str] = None
    country_of_origin: Optional[str] = None
    temperature_condition: Optional[float] = None
    temperature_zone: Optional[str] = None
    sales_unit: Optional[str] = None
    base_unit: Optional[str] = None
    allowed_lot_size: Optional[float] = None
    marketing_text: Optional[str] = None
    ingredients: Optional[str] = None
    storage_instructions: Optional[str] = None
    allergens: Optional[str] = None
    labels: Optional[str] = None
    energy_kj: Optional[float] = None
    protein: Optional[float] = None
    carbohydrates: Optional[float] = None
    fat: Optional[float] = None
    sugar: Optional[float] = None
    salt: Optional[float] = None
    shelf_life_days: Optional[int] = None
    unit_size: Optional[str] = None
    unit_type: Optional[str] = None
    price: Optional[float] = None


class ProductCreate(ProductBase):
    product_code: str


class Product(ProductBase):
    product_code: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Paginated Response Schema
T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int
    limit: int
    has_more: bool


# Category Schema
class Category(BaseModel):
    category: str
    sub_categories: List[str]
    
    class Config:
        from_attributes = True


# Order Line Schemas
class OrderLineBase(BaseModel):
    product_code: str
    ordered_qty: float
    item_priority: PriorityLevel = PriorityLevel.IMPORTANT
    auto_substitution_allowed: bool = True
    customer_comments: Optional[str] = None


class OrderLineCreate(OrderLineBase):
    pass


class OrderLine(OrderLineBase):
    line_id: int
    order_id: str
    delivered_qty: float
    shortage_flag: bool
    shortage_ratio: float
    risk_score: Optional[float] = None
    line_status: LineStatus
    product: Optional[Product] = None  # Product information
    order_changes: List["OrderChange"] = []  # Track replacements/changes
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Order Schemas
class OrderBase(BaseModel):
    delivery_date: str  # YYYY-MM-DD
    delivery_window_start: Optional[str] = None  # HH:MM
    delivery_window_end: Optional[str] = None  # HH:MM
    channel: str = "web"


class OrderCreate(OrderBase):
    customer_id: str
    lines: List[OrderLineCreate]


class OrderPlaceFromCart(BaseModel):
    delivery_date: str  # YYYY-MM-DD
    delivery_window_start: Optional[str] = None  # HH:MM
    delivery_window_end: Optional[str] = None  # HH:MM


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    overall_order_risk: Optional[float] = None


class Order(OrderBase):
    order_id: str
    customer_id: str
    order_datetime: datetime
    status: OrderStatus
    overall_order_risk: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    order_lines: List[OrderLine] = []

    class Config:
        from_attributes = True


# Risk Scoring Schemas
class LineRisk(BaseModel):
    line_id: int
    product_code: str
    shortage_probability: float
    expected_shortage_ratio: Optional[float] = None
    top_contributors: List[str] = []


class OrderRiskScore(BaseModel):
    order_id: str
    overall_order_risk: float
    line_risks: List[LineRisk]


# Risk Assessment Schemas
class ProductRiskRequest(BaseModel):
    """Single product risk assessment request"""
    product_code: str
    order_qty: float = Field(gt=0, description="Order quantity (must be > 0)")
    order_created_date: str = Field(description="Order creation date (YYYY-MM-DD)")
    requested_delivery_date: str = Field(description="Requested delivery date (YYYY-MM-DD)")


class BatchRiskAssessmentRequest(BaseModel):
    """Batch risk assessment request"""
    products: List[ProductRiskRequest] = Field(min_length=1, description="List of products to assess")


class ProductRiskResponse(BaseModel):
    """Single product risk assessment response"""
    product_code: str
    shortage_probability: float = Field(ge=0.0, le=1.0, description="Risk probability (0-1)")


class BatchRiskAssessmentResponse(BaseModel):
    """Batch risk assessment response"""
    predictions: List[ProductRiskResponse]
    total_products: int
    high_risk_count: int = Field(description="Number of products with shortage_probability > 0.5")


# Substitution Schemas
class SubstitutionAlternative(BaseModel):
    alt_product_code: str
    alt_product_name: str
    substitution_quality: SubstitutionQuality
    reason: str
    availability_status: str = "AVAILABLE"


class SubstitutionSuggestionCreate(BaseModel):
    order_id: str
    line_id: int
    original_product_code: str
    alternatives: List[SubstitutionAlternative]
    context: str  # PRE_ORDER, PICKING, POST_DELIVERY


class SubstitutionSuggestion(BaseModel):
    suggestion_id: int
    order_id: str
    line_id: int
    original_product_code: str
    alt_product_code: str
    substitution_quality: SubstitutionQuality
    reason: Optional[str] = None
    availability_status: str
    context: str
    created_at: datetime

    class Config:
        from_attributes = True


class SubstitutionDecision(BaseModel):
    order_id: str
    line_id: int
    chosen_product_code: str  # Can be original or alternative
    decision: str  # ACCEPTED_ALT, KEEP_ORIGINAL, ACCEPT_PARTIAL, CANCEL_LINE


class OrderChange(BaseModel):
    change_id: int
    order_id: str
    line_id: int
    old_product_code: Optional[str] = None
    new_product_code: Optional[str] = None
    change_reason: str
    confirmed_by: str
    created_at: datetime

    class Config:
        from_attributes = True


# Pre-Order Optimization Schemas
class PreOrderAlternativeSuggestion(BaseModel):
    line_id: int
    product_code: str
    shortage_probability: float
    item_priority: PriorityLevel
    suggested_alternatives: List[SubstitutionAlternative]


class PreOrderOptimizationResponse(BaseModel):
    order_id: str
    suggestions: List[PreOrderAlternativeSuggestion]


# Claim Schemas
class ClaimLineCreate(BaseModel):
    line_id: Optional[int] = None
    product_code: str
    reported_issue: str


class ClaimAttachmentCreate(BaseModel):
    file_path: str
    file_type: str  # IMAGE, VIDEO


class ClaimCreate(BaseModel):
    order_id: str
    claim_type: ClaimType
    channel: str = "WEB"
    lines: List[ClaimLineCreate]
    attachments: List[ClaimAttachmentCreate] = []


class ClaimLine(BaseModel):
    claim_line_id: int
    claim_id: str
    line_id: Optional[int] = None
    product_code: str
    reported_issue: str
    created_at: datetime

    class Config:
        from_attributes = True


class ClaimAttachment(BaseModel):
    attachment_id: int
    claim_id: str
    file_path: str
    file_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class Claim(BaseModel):
    claim_id: str
    order_id: str
    customer_id: str
    claim_type: ClaimType
    status: ClaimStatus
    channel: str
    model_confidence_score: Optional[float] = None
    resolution_type: Optional[ResolutionType] = None
    credit_amount: Optional[float] = None
    re_delivery_date: Optional[str] = None
    handled_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    claim_lines: List[ClaimLine] = []
    claim_attachments: List[ClaimAttachment] = []

    class Config:
        from_attributes = True


class ClaimResolution(BaseModel):
    resolution_type: ResolutionType
    credit_amount: Optional[float] = None
    re_delivery_date: Optional[str] = None
    handled_by: str = "AI_AGENT"


# Contact Session Schemas
class ContactSessionCreate(BaseModel):
    customer_id: str
    order_id: Optional[str] = None
    channel: str
    initiator: str
    reason: Optional[str] = None
    language: Language = Language.FI


class ContactSession(BaseModel):
    session_id: str
    customer_id: str
    order_id: Optional[str] = None
    channel: str
    initiator: str
    reason: Optional[str] = None
    language: Language
    outcome: Optional[str] = None
    transcript_reference: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None

    class Config:
        from_attributes = True


# Dashboard/Stats Schemas
class OrderStats(BaseModel):
    total_orders: int
    orders_at_risk: int
    orders_in_picking: int
    orders_delivered_today: int


class CustomerDashboard(BaseModel):
    customer: Customer
    recent_orders: List[Order]
    open_claims: List[Claim]
    stats: OrderStats


# Authentication Schemas
class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: UserRole


class User(BaseModel):
    user_id: str
    username: str
    email: str
    role: UserRole
    customer_id: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: UserRole
    customer_id: Optional[str] = None


# Cart Schemas
class CartItemSubstituteCreate(BaseModel):
    substitute_product_code: str
    priority: int  # 1 or 2


class CartItemCreate(BaseModel):
    product_code: str
    quantity: float
    substitutes: List[CartItemSubstituteCreate] = []  # Max 2


class CartItemQuantityUpdate(BaseModel):
    quantity: float


class CartItem(BaseModel):
    cart_item_id: int
    product_code: str
    quantity: float
    risk_score: Optional[float] = None
    product: Optional[Product] = None
    substitutes: List[dict] = []  # Will contain substitute products
    created_at: datetime

    class Config:
        from_attributes = True


class Cart(BaseModel):
    cart_id: int
    customer_id: str
    items: List[CartItem] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Order Substitutes
class OrderSubstitute(BaseModel):
    substitute_id: int
    order_id: str
    line_id: int
    substitute_product_code: str
    priority: int
    is_used: bool
    substitute_product: Optional[Product] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Order Tracking
class OrderTracking(BaseModel):
    tracking_id: int
    order_id: str
    status: OrderStatus
    updated_by: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Messages
class MessageCreate(BaseModel):
    content: str
    order_id: Optional[str] = None
    claim_id: Optional[str] = None


class Message(BaseModel):
    message_id: int
    order_id: Optional[str] = None
    claim_id: Optional[str] = None
    sender_type: MessageSenderType
    sender_id: str
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Invoices
class InvoiceItem(BaseModel):
    item_id: int
    invoice_id: str
    product_code: Optional[str] = None
    description: str
    quantity: float
    unit_price: float
    total_price: float
    created_at: datetime

    class Config:
        from_attributes = True


class Invoice(BaseModel):
    invoice_id: str
    order_id: Optional[str] = None
    claim_id: Optional[str] = None
    customer_id: str
    invoice_type: InvoiceType
    status: InvoiceStatus
    total_amount: float
    tax_amount: float
    notes: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None
    items: List[InvoiceItem] = []

    class Config:
        from_attributes = True


# Inventory
class InventoryUpdate(BaseModel):
    quantity: int


class Inventory(BaseModel):
    inventory_id: int
    product_code: str
    quantity: int
    reserved_quantity: int
    available_quantity: int
    last_updated: datetime
    updated_by: Optional[str] = None
    product: Optional[Product] = None

    class Config:
        from_attributes = True


# Claim Processing
class ClaimProcessing(BaseModel):
    processing_id: int
    claim_id: str
    ai_processed: bool
    ai_confidence: Optional[float] = None
    ai_result: Optional[str] = None
    requires_manual_review: bool
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Updated Order Schema with new fields
class OrderWithDetails(Order):
    order_lines: List[OrderLine] = []
    order_substitutes: List[OrderSubstitute] = []
    tracking_history: List[OrderTracking] = []
    messages: List[Message] = []

    class Config:
        from_attributes = True


# Updated Claim Schema
class ClaimWithDetails(Claim):
    claim_lines: List[ClaimLine] = []
    claim_attachments: List[ClaimAttachment] = []
    messages: List[Message] = []
    processing: Optional[ClaimProcessing] = None

    class Config:
        from_attributes = True

