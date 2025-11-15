export type UserRole = 'customer' | 'admin';

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: UserRole;
  customer_id?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user_id: string;
  role: UserRole;
}

export type OrderStatus =
  | 'placed'
  | 'under_risk'
  | 'waiting_for_customer_action'
  | 'picking'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type ClaimStatus =
  | 'open'
  | 'ai_processing'
  | 'manual_review'
  | 'approved'
  | 'rejected'
  | 'resolved';

export type InvoiceStatus = 'pending' | 'paid' | 'refunded' | 'cancelled';

export interface OrderSummary {
  order_id: string;
  delivery_date: string;
  status: OrderStatus;
  overall_order_risk?: number | null;
  order_datetime: string;
}

export interface ClaimSummary {
  claim_id: string;
  order_id: string;
  claim_type: string;
  status: ClaimStatus;
  model_confidence_score?: number;
}

export interface CustomerDashboard {
  customer: {
    customer_id: string;
    name: string;
  };
  stats: {
    total_orders: number;
    orders_at_risk: number;
    orders_in_picking: number;
    orders_delivered_today: number;
  };
  recent_orders: OrderSummary[];
  open_claims: ClaimSummary[];
}

export interface Message {
  message_id: number;
  order_id?: string | null;
  claim_id?: string | null;
  sender_type: 'customer' | 'admin' | 'ai';
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Product {
  product_code: string;
  product_name: string;
  gtin?: string | null;
  product_name_en?: string | null;
  product_name_fi?: string | null;
  category_code?: string | null;
  category?: string | null;
  sub_category?: string | null;
  vendor_name?: string | null;
  country_of_origin?: string | null;
  temperature_condition?: number | null;
  temperature_zone?: string | null;
  sales_unit?: string | null;
  base_unit?: string | null;
  allowed_lot_size?: number | null;
  marketing_text?: string | null;
  ingredients?: string | null;
  storage_instructions?: string | null;
  allergens?: string | null;
  labels?: string | null;
  energy_kj?: number | null;
  protein?: number | null;
  carbohydrates?: number | null;
  fat?: number | null;
  sugar?: number | null;
  salt?: number | null;
  shelf_life_days?: number | null;
  unit_size?: string | null;
  unit_type?: string | null;
  price?: number | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface Category {
  category: string;
  sub_categories: string[];
}

export interface CartItem {
  cart_item_id: number;
  product_code: string;
  quantity: number;
  risk_score?: number | null;
  product?: Product | null;
  substitutes?: Array<{
    substitute_product_code: string;
    priority: number;
  }>;
  created_at: string;
}

export interface Cart {
  cart_id: number;
  customer_id: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

// Order Types
export type PriorityLevel = 'CRITICAL' | 'IMPORTANT' | 'FLEXIBLE';
export type LineStatus = 'OK' | 'PARTIAL' | 'ZERO' | 'REPLACED';

export interface OrderChange {
  change_id: number;
  order_id: string;
  line_id: number;
  old_product_code?: string | null;
  new_product_code?: string | null;
  change_reason: string;
  confirmed_by: string;
  created_at: string;
}

export interface OrderLine {
  line_id: number;
  order_id: string;
  product_code: string;
  ordered_qty: number;
  delivered_qty: number;
  item_priority: PriorityLevel;
  auto_substitution_allowed: boolean;
  customer_comments?: string | null;
  shortage_flag: boolean;
  shortage_ratio: number;
  risk_score?: number | null;
  line_status: LineStatus;
  created_at: string;
  updated_at: string;
  product?: Product | null; // Product details if included by backend
  order_changes?: OrderChange[]; // Order changes history for this line
}

export interface OrderSubstitute {
  substitute_id: number;
  order_id: string;
  line_id: number;
  substitute_product_code: string;
  priority: number;
  is_used: boolean;
  substitute_product?: Product | null;
  created_at: string;
}

export interface OrderTracking {
  tracking_id: number;
  order_id: string;
  status: OrderStatus;
  updated_by?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Order {
  order_id: string;
  customer_id: string;
  delivery_date: string;
  delivery_window_start?: string | null;
  delivery_window_end?: string | null;
  channel: string;
  order_datetime: string;
  status: OrderStatus;
  overall_order_risk?: number | null;
  created_at: string;
  updated_at: string;
  order_lines: OrderLine[];
}

export interface OrderWithDetails extends Order {
  order_substitutes: OrderSubstitute[];
  tracking_history: OrderTracking[];
  messages: Message[];
}

// Claim Types
export type ClaimType = 'MISSING_ITEM' | 'DAMAGED_ITEM' | 'WRONG_ITEM' | 'QUALITY_ISSUE';
export type ResolutionType = 'CREDIT' | 'REDELIVERY_SAME_DAY' | 'REDELIVERY_NEXT_DAY' | 'REPLACEMENT_NEXT_ORDER';

export interface ClaimLine {
  claim_line_id: number;
  claim_id: string;
  line_id?: number | null;
  product_code: string;
  reported_issue: string;
  created_at: string;
}

export interface ClaimAttachment {
  attachment_id: number;
  claim_id: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

export interface ClaimProcessing {
  processing_id: number;
  claim_id: string;
  ai_processed: boolean;
  ai_confidence?: number | null;
  ai_result?: string | null;
  requires_manual_review: boolean;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  claim_id: string;
  order_id: string;
  customer_id: string;
  claim_type: ClaimType;
  status: ClaimStatus;
  channel: string;
  model_confidence_score?: number | null;
  resolution_type?: ResolutionType | null;
  credit_amount?: number | null;
  re_delivery_date?: string | null;
  handled_by?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  claim_lines: ClaimLine[];
  claim_attachments: ClaimAttachment[];
}

export interface ClaimWithDetails extends Claim {
  messages: Message[];
  processing?: ClaimProcessing | null;
}

// Invoice Types
export type InvoiceType = 'order' | 'refund' | 'modification';

export interface InvoiceItem {
  item_id: number;
  invoice_id: string;
  product_code?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Invoice {
  invoice_id: string;
  order_id?: string | null;
  claim_id?: string | null;
  customer_id: string;
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  total_amount: number;
  tax_amount: number;
  notes?: string | null;
  created_at: string;
  paid_at?: string | null;
  items: InvoiceItem[];
}

// Customer Types
export type Language = 'fi' | 'sv' | 'en';
export type ContactChannel = 'voice_first' | 'sms_first' | 'email_only';

export interface Customer {
  customer_id: string;
  name: string;
  segment?: string | null;
  language_preference: Language;
  contact_channel: ContactChannel;
  no_call_before: string;
  accept_auto_substitutions_for_flexible_items: boolean;
  location?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  customer_id: string;
  name: string;
  segment?: string | null;
  language_preference?: Language;
  contact_channel?: ContactChannel;
  no_call_before?: string;
  accept_auto_substitutions_for_flexible_items?: boolean;
  location?: string | null;
}

// Inventory Types
export interface Inventory {
  inventory_id: number;
  product_code: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  last_updated: string;
  updated_by?: string | null;
  product?: Product | null;
}

export interface InventoryUpdate {
  quantity: number;
}
