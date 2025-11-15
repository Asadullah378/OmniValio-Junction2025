import { z } from 'zod';

// Auth validations
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Order validations
export const placeOrderSchema = z.object({
  delivery_date: z.string().min(1, 'Delivery date is required'),
  delivery_window_start: z.string().optional().nullable(),
  delivery_window_end: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.delivery_window_start && data.delivery_window_end) {
      return data.delivery_window_start < data.delivery_window_end;
    }
    return true;
  },
  {
    message: 'Start time must be before end time',
    path: ['delivery_window_end'],
  }
);

export type PlaceOrderFormData = z.infer<typeof placeOrderSchema>;

// Claim validations
export const createClaimSchema = z.object({
  order_id: z.string().min(1, 'Please select an order'),
  claim_type: z.enum(['MISSING_ITEM', 'DAMAGED_ITEM', 'WRONG_ITEM', 'QUALITY_ISSUE'], {
    required_error: 'Please select a claim type',
  }),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  files: z.any().optional().nullable(), // Files are handled separately in component state
});

export type CreateClaimFormData = z.infer<typeof createClaimSchema>;

// Customer validations
export const createCustomerSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  name: z.string().min(1, 'Name is required'),
  segment: z.string().optional().nullable(),
  language_preference: z.enum(['fi', 'sv', 'en']).optional(),
  contact_channel: z.enum(['voice_first', 'sms_first', 'email_only']).optional(),
  no_call_before: z.string().optional(),
  accept_auto_substitutions_for_flexible_items: z.boolean().optional(),
  location: z.string().optional().nullable(),
});

export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;

export const createCustomerUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type CreateCustomerUserFormData = z.infer<typeof createCustomerUserSchema>;

// Product validations
export const productSchema = z.object({
  product_code: z.string().min(1, 'Product code is required').optional(),
  product_name: z.string().min(1, 'Product name is required'),
  category: z.string().optional().nullable(),
  sub_category: z.string().optional().nullable(),
  temperature_zone: z.string().optional().nullable(),
  shelf_life_days: z.number().int().positive().optional().nullable(),
  unit_size: z.string().optional().nullable(),
  unit_type: z.string().optional().nullable(),
  price: z.number().nonnegative('Price must be non-negative').optional().nullable(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Inventory validations
export const inventoryUpdateSchema = z.object({
  quantity: z.number().int().nonnegative('Quantity must be non-negative'),
});

export type InventoryUpdateFormData = z.infer<typeof inventoryUpdateSchema>;

// Message validations
export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
});

export type MessageFormData = z.infer<typeof messageSchema>;

// Claim approval/rejection
export const approveClaimSchema = z.object({
  refund_amount: z.number().nonnegative().optional().nullable(),
});

export type ApproveClaimFormData = z.infer<typeof approveClaimSchema>;

export const rejectClaimSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export type RejectClaimFormData = z.infer<typeof rejectClaimSchema>;

