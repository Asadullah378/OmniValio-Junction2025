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


class OrderStatus(str, enum.Enum):
    CREATED = "created"
    RISK_SCORED = "risk_scored"
    PICKING = "picking"
    SHIPPED = "shipped"
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


class ClaimStatus(str, enum.Enum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"


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


class Product(Base):
    __tablename__ = "products"

    product_code = Column(String, primary_key=True, index=True)
    product_name = Column(String, nullable=False)
    category = Column(String)
    sub_category = Column(String)
    temperature_zone = Column(String)  # ambient, chilled, frozen
    shelf_life_days = Column(Integer)
    unit_size = Column(String)
    unit_type = Column(String)
    price = Column(Float)
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
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.CREATED)
    channel = Column(String, default="web")  # web, phone, sales_rep
    overall_order_risk = Column(Float)  # 0-1 risk score
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    order_lines = relationship("OrderLine", back_populates="order", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="order")


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
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    order = relationship("Order", back_populates="claims")
    customer = relationship("Customer", back_populates="claims")
    claim_lines = relationship("ClaimLine", back_populates="claim", cascade="all, delete-orphan")
    claim_attachments = relationship("ClaimAttachment", back_populates="claim", cascade="all, delete-orphan")


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

