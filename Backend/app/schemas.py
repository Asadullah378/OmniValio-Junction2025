"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models import (
    PriorityLevel, ContactChannel, Language, OrderStatus, 
    LineStatus, ClaimType, ClaimStatus, ResolutionType, SubstitutionQuality
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
    category: Optional[str] = None
    sub_category: Optional[str] = None
    temperature_zone: Optional[str] = None
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

