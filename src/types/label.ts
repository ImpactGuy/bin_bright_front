/**
 * Label Configuration Types
 * These types define the structure for label configurations that will be sent to Shopify
 */

// PDF Dimensions (in millimeters)
export const PDF_DIMENSIONS = {
  WIDTH_MM: 280, // Increased by 10mm for order number area
  HEIGHT_MM: 66,
  ORDER_NUMBER_WIDTH_MM: 10, // Left side area for order number
  TEXT_MAX_WIDTH_MM: 260,
  TEXT_MAX_HEIGHT_MM: 54,
} as const;

// Font size constraints for PDF (in points, converted from mm)
// 1 point = 0.352778 mm, so max width 260mm ≈ 737 points at base size
export const FONT_CONSTRAINTS = {
  MIN_SIZE_PT: 40, // Minimum font size in points for readability
  MAX_SIZE_PT: 700, // Maximum font size in points (will be constrained by width)
} as const;

export interface LabelConfiguration {
  /** The text content for the label (uppercase, trimmed) */
  text: string;
  /** Font size in points (for PDF generation) */
  fontSizePt: number;
  /** Font size in pixels (for preview) */
  fontSizePx: number;
  /** Quantity of labels with this configuration */
  quantity: number;
  /** Font family (Impact, Arial Black, etc.) */
  fontFamily: string;
  /** Text color (hex format) */
  color: string;
  /** Unique ID for this configuration */
  id: string;
  /** Timestamp when configuration was created */
  timestamp: number;
}

export interface CartItem extends LabelConfiguration {
  /** Price per unit */
  unitPrice: number;
  /** Total price (unitPrice * quantity) */
  totalPrice: number;
  /** Shopify cart line ID (for cart mutations) */
  shopifyLineId?: string;
}

export interface CheckoutData {
  /** Array of cart items */
  items: CartItem[];
  /** Total quantity of all items */
  totalQuantity: number;
  /** Total price of all items */
  totalPrice: number;
  /** Customer information (if available) */
  customerInfo?: {
    email?: string;
    name?: string;
  };
}

