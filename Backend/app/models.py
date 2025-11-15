"""
SQLAlchemy database models
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from app.database import Base


class PriorityLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"
    IMPORTANT = "IMPORTANT"
    FLEXIBLE = "FLEXIBLE"


class ContactChannel(str, enum.Enum):
    VOICE_FIRST = "voice_first"
    SMS_FIRST = "sms_first"
    EMAIL_ONLY = "email_only"


class Language(str, enum.Enum):
    FI = "fi"
    SV = "sv"
    EN = "en"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"


class OrderStatus(str, enum.Enum):
    PLACED = "placed"
    UNDER_RISK = "under_risk"
    WAITING_FOR_CUSTOMER_ACTION = "waiting_for_customer_action"
    PICKING = "picking"
    DELIVERING = "delivering"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class LineStatus(str, enum.Enum):
    OK = "OK"
    PARTIAL = "PARTIAL"
    ZERO = "ZERO"
    REPLACED = "REPLACED"


class ClaimType(str, enum.Enum):
    MISSING_ITEM = "MISSING_ITEM"
    DAMAGED_ITEM = "DAMAGED_ITEM"
    WRONG_ITEM = "WRONG_ITEM"
    QUALITY_ISSUE = "QUALITY_ISSUE"


class ClaimStatus(str, enum.Enum):
    OPEN = "open"
    AI_PROCESSING = "ai_processing"
    MANUAL_REVIEW = "manual_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    RESOLVED = "resolved"


class InvoiceType(str, enum.Enum):
    ORDER = "order"
    REFUND = "refund"
    MODIFICATION = "modification"


class InvoiceStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class MessageSenderType(str, enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    AI = "ai"


class ResolutionType(str, enum.Enum):
    CREDIT = "CREDIT"
    REDELIVERY_SAME_DAY = "REDELIVERY_SAME_DAY"
    REDELIVERY_NEXT_DAY = "REDELIVERY_NEXT_DAY"
    REPLACEMENT_NEXT_ORDER = "REPLACEMENT_NEXT_ORDER"


class SubstitutionQuality(str, enum.Enum):
    GOOD = "GOOD"
    BETTER = "BETTER"
    BEST = "BEST"


class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    segment = Column(String)  # restaurant, school, hotel, hospital, etc.
    language_preference = Column(SQLEnum(Language), default=Language.FI)
    contact_channel = Column(SQLEnum(ContactChannel), default=ContactChannel.VOICE_FIRST)
    no_call_before = Column(String, default="07:00")  # Time format HH:MM
    accept_auto_substitutions_for_flexible_items = Column(Boolean, default=True)
    location = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="customer")
    claims = relationship("Claim", back_populates="customer")
    contact_sessions = relationship("ContactSession", back_populates="customer")
    cart = relationship("Cart", back_populates="customer", uselist=False)
    invoices = relationship("Invoice", back_populates="customer")


class Product(Base):
    __tablename__ = "products"

    product_code = Column(String, primary_key=True, index=True)
    gtin = Column(String, nullable=True)
    product_name = Column(String, nullable=False)  # Will use product_name_en as primary
    product_name_en = Column(String, nullable=True)
    product_name_fi = Column(String, nullable=True)
    category_code = Column(String, nullable=True)  # Numeric category code from CSV
    category = Column(String, nullable=True)  # category_name from CSV
    sub_category = Column(String, nullable=True)  # subcategory_name from CSV
    vendor_name = Column(String, nullable=True)
    country_of_origin = Column(String, nullable=True)
    temperature_condition = Column(Float, nullable=True)  # Numeric temperature condition
    temperature_zone = Column(String, nullable=True)  # Derived from temperature_condition
    sales_unit = Column(String, nullable=True)
    base_unit = Column(String, nullable=True)
    allowed_lot_size = Column(Float, nullable=True)
    marketing_text = Column(Text, nullable=True)
    ingredients = Column(Text, nullable=True)
    storage_instructions = Column(Text, nullable=True)
    allergens = Column(Text, nullable=True)
    labels = Column(Text, nullable=True)
    energy_kj = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)
    carbohydrates = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)
    sugar = Column(Float, nullable=True)
    salt = Column(Float, nullable=True)
    shelf_life_days = Column(Integer, nullable=True)
    unit_size = Column(String, nullable=True)
    unit_type = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    order_lines = relationship("OrderLine", back_populates="product")
    substitution_suggestions = relationship("SubstitutionSuggestion", foreign_keys="SubstitutionSuggestion.original_product_code", back_populates="original_product")


class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    fill_rate_30d = Column(Float)  # Calculated metric
    avg_delay_days = Column(Float)  # Calculated metric
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.customer_id"), nullable=False)
    order_datetime = Column(DateTime, default=func.now(), nullable=False)
    delivery_date = Column(String, nullable=False)  # YYYY-MM-DD
    delivery_window_start = Column(String)  # HH:MM
    delivery_window_end = Column(String)  # HH:MM
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PLACED)
    channel = Column(String, default="web")  # web, phone, sales_rep
    overall_order_risk = Column(Float)  # 0-1 risk score
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    order_lines = relationship("OrderLine", back_populates="order", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="order")
    order_substitutes = relationship("OrderSubstitute", back_populates="order", cascade="all, delete-orphan")
    tracking_history = relationship("OrderTracking", back_populates="order", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="order", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="order")


class OrderLine(Base):
    __tablename__ = "order_lines"

    line_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False)
    product_code = Column(String, ForeignKey("products.product_code"), nullable=False)
    ordered_qty = Column(Float, nullable=False)
    delivered_qty = Column(Float, default=0.0)
    shortage_flag = Column(Boolean, default=False)
    shortage_ratio = Column(Float, default=0.0)  # (ordered - delivered) / ordered
    risk_score = Column(Float)  # ML model prediction 0-1
    item_priority = Column(SQLEnum(PriorityLevel), default=PriorityLevel.IMPORTANT)
    auto_substitution_allowed = Column(Boolean, default=True)
    line_status = Column(SQLEnum(LineStatus), default=LineStatus.OK)
    customer_comments = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    order = relationship("Order", back_populates="order_lines")
    product = relationship("Product", back_populates="order_lines")
    substitution_suggestions = relationship("SubstitutionSuggestion", back_populates="order_line", cascade="all, delete-orphan")
    order_changes = relationship("OrderChange", back_populates="order_line", cascade="all, delete-orphan")


class SubstitutionSuggestion(Base):
    __tablename__ = "substitution_suggestions"

    suggestion_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False)
    line_id = Column(Integer, ForeignKey("order_lines.line_id"), nullable=False)
    original_product_code = Column(String, ForeignKey("products.product_code"), nullable=False)
    alt_product_code = Column(String, ForeignKey("products.product_code"), nullable=False)
    substitution_quality = Column(SQLEnum(SubstitutionQuality))
    reason = Column(Text)
    availability_status = Column(String)  # AVAILABLE, LOW_STOCK
    context = Column(String)  # PRE_ORDER, PICKING, POST_DELIVERY
    created_at = Column(DateTime, default=func.now())

    # Relationships
    order_line = relationship("OrderLine", back_populates="substitution_suggestions")
    original_product = relationship("Product", foreign_keys=[original_product_code])


class OrderChange(Base):
    __tablename__ = "order_changes"

    change_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False)
    line_id = Column(Integer, ForeignKey("order_lines.line_id"), nullable=False)
    old_product_code = Column(String)
    new_product_code = Column(String)
    change_reason = Column(String)  # shortage, quality, customer_request
    confirmed_by = Column(String)  # customer, AI_auto, agent
    created_at = Column(DateTime, default=func.now())

    # Relationships
    order_line = relationship("OrderLine", back_populates="order_changes")


class Claim(Base):
    __tablename__ = "claims"

    claim_id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.customer_id"), nullable=False)
    claim_type = Column(SQLEnum(ClaimType), nullable=False)
    status = Column(SQLEnum(ClaimStatus), default=ClaimStatus.OPEN)
    channel = Column(String)  # WEB, VOICE, CHAT, EMAIL
    model_confidence_score = Column(Float)  # From image analysis
    resolution_type = Column(SQLEnum(ResolutionType))
    credit_amount = Column(Float)
    re_delivery_date = Column(String)
    handled_by = Column(String)  # AI_AGENT, HUMAN_AGENT
    rejection_reason = Column(Text)  # Reason for rejection if claim is rejected
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    order = relationship("Order", back_populates="claims")
    customer = relationship("Customer", back_populates="claims")
    claim_lines = relationship("ClaimLine", back_populates="claim", cascade="all, delete-orphan")
    claim_attachments = relationship("ClaimAttachment", back_populates="claim", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="claim", cascade="all, delete-orphan")
    processing = relationship("ClaimProcessing", back_populates="claim", uselist=False)
    invoices = relationship("Invoice", back_populates="claim")


class ClaimLine(Base):
    __tablename__ = "claim_lines"

    claim_line_id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(String, ForeignKey("claims.claim_id"), nullable=False)
    line_id = Column(Integer, ForeignKey("order_lines.line_id"))
    product_code = Column(String)
    reported_issue = Column(Text)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    claim = relationship("Claim", back_populates="claim_lines")


class ClaimAttachment(Base):
    __tablename__ = "claim_attachments"

    attachment_id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(String, ForeignKey("claims.claim_id"), nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String)  # IMAGE, VIDEO
    created_at = Column(DateTime, default=func.now())

    # Relationships
    claim = relationship("Claim", back_populates="claim_attachments")


class ContactSession(Base):
    __tablename__ = "contact_sessions"

    session_id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.customer_id"), nullable=False)
    order_id = Column(String, ForeignKey("orders.order_id"))
    channel = Column(String, nullable=False)  # voice, SMS, chat
    initiator = Column(String, nullable=False)  # system, customer
    reason = Column(String)  # shortage_pre_pick, claim_post_delivery, etc.
    language = Column(SQLEnum(Language), default=Language.FI)
    outcome = Column(String)  # substitution_accepted, declined, etc.
    transcript_reference = Column(String)  # Reference to stored transcript
    start_time = Column(DateTime, default=func.now())
    end_time = Column(DateTime)

    # Relationships
    customer = relationship("Customer", back_populates="contact_sessions")


# User Authentication
class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    customer_id = Column(String, ForeignKey("customers.customer_id"), nullable=True)  # Only for customers
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", foreign_keys=[customer_id])


# Cart Management
class Cart(Base):
    __tablename__ = "carts"

    cart_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String, ForeignKey("customers.customer_id"), nullable=False, unique=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", foreign_keys=[customer_id])
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"

    cart_item_id = Column(Integer, primary_key=True, autoincrement=True)
    cart_id = Column(Integer, ForeignKey("carts.cart_id"), nullable=False)
    product_code = Column(String, ForeignKey("products.product_code"), nullable=False)
    quantity = Column(Float, nullable=False)
    risk_score = Column(Float)  # Dummy for now
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")
    substitutes = relationship("CartItemSubstitute", back_populates="cart_item", cascade="all, delete-orphan")


class CartItemSubstitute(Base):
    __tablename__ = "cart_item_substitutes"

    substitute_id = Column(Integer, primary_key=True, autoincrement=True)
    cart_item_id = Column(Integer, ForeignKey("cart_items.cart_item_id"), nullable=False)
    substitute_product_code = Column(String, ForeignKey("products.product_code"), nullable=False)
    priority = Column(Integer, nullable=False)  # 1 or 2 (max 2 substitutes)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    cart_item = relationship("CartItem", back_populates="substitutes")
    substitute_product = relationship("Product", foreign_keys=[substitute_product_code])


# Order Substitutes (customer-selected substitutes linked to order lines)
class OrderSubstitute(Base):
    __tablename__ = "order_substitutes"

    substitute_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False)
    line_id = Column(Integer, ForeignKey("order_lines.line_id"), nullable=False)
    substitute_product_code = Column(String, ForeignKey("products.product_code"), nullable=False)
    priority = Column(Integer, nullable=False)  # 1 or 2
    is_used = Column(Boolean, default=False)  # Whether this substitute was actually used
    created_at = Column(DateTime, default=func.now())

    # Relationships
    order = relationship("Order")
    order_line = relationship("OrderLine")
    substitute_product = relationship("Product", foreign_keys=[substitute_product_code])


# Order Tracking History
class OrderTracking(Base):
    __tablename__ = "order_tracking"

    tracking_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False)
    status = Column(SQLEnum(OrderStatus), nullable=False)
    updated_by = Column(String)  # admin, ai, system
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    order = relationship("Order")


# Messages for Order/Claim Communication
class Message(Base):
    __tablename__ = "messages"

    message_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=True)
    claim_id = Column(String, ForeignKey("claims.claim_id"), nullable=True)
    sender_type = Column(SQLEnum(MessageSenderType), nullable=False)
    sender_id = Column(String, nullable=False)  # user_id or "ai" or "admin"
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    order = relationship("Order")
    claim = relationship("Claim")


# Invoices and Payments
class Invoice(Base):
    __tablename__ = "invoices"

    invoice_id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=True)
    claim_id = Column(String, ForeignKey("claims.claim_id"), nullable=True)
    customer_id = Column(String, ForeignKey("customers.customer_id"), nullable=False)
    invoice_type = Column(SQLEnum(InvoiceType), nullable=False)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.PENDING)
    total_amount = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    paid_at = Column(DateTime, nullable=True)

    # Relationships
    order = relationship("Order")
    claim = relationship("Claim")
    customer = relationship("Customer")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    item_id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(String, ForeignKey("invoices.invoice_id"), nullable=False)
    product_code = Column(String, ForeignKey("products.product_code"), nullable=True)
    description = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product")


# Inventory Management
class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id = Column(Integer, primary_key=True, autoincrement=True)
    product_code = Column(String, ForeignKey("products.product_code"), nullable=False, unique=True)
    quantity = Column(Float, default=0.0, nullable=False)
    reserved_quantity = Column(Float, default=0.0)  # Reserved for orders
    available_quantity = Column(Float, default=0.0)  # Calculated: quantity - reserved_quantity
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_by = Column(String)  # admin user_id

    # Relationships
    product = relationship("Product")


# Claim Processing Status
class ClaimProcessing(Base):
    __tablename__ = "claim_processing"

    processing_id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(String, ForeignKey("claims.claim_id"), nullable=False, unique=True)
    ai_processed = Column(Boolean, default=False)
    ai_confidence = Column(Float)
    ai_result = Column(Text)  # AI's assessment
    requires_manual_review = Column(Boolean, default=False)
    reviewed_by = Column(String)  # admin user_id
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    claim = relationship("Claim")

