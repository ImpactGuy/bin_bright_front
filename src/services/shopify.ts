/**
 * Shopify Integration Service
 * Handles communication with Shopify backend for order processing and PDF generation
 */

import { CheckoutData } from "@/types/label";

// Shopify Integration Configuration
// These can be set via environment variables in .env file
// Example .env file:
//   VITE_SHOPIFY_WEBHOOK_URL=https://your-backend.com/api/shopify/process-order
//   VITE_SHOPIFY_API_KEY=your_api_key_here
//
// If not set, defaults to relative path for local development
const SHOPIFY_ENDPOINT = 
  import.meta.env.VITE_SHOPIFY_WEBHOOK_URL || 
  "/api/shopify/process-order";
  
const SHOPIFY_API_KEY = 
  import.meta.env.VITE_SHOPIFY_API_KEY || 
  undefined;

export interface ShopifyOrderResponse {
  success: boolean;
  orderId?: string;
  pdfUrl?: string;
  error?: string;
}

/**
 * Send label configuration data to Shopify for processing
 * This will trigger PDF generation on the server side
 */
export async function submitOrderToShopify(
  checkoutData: CheckoutData
): Promise<ShopifyOrderResponse> {
  try {
    const response = await fetch(SHOPIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SHOPIFY_API_KEY && { "X-Shopify-API-Key": SHOPIFY_API_KEY }),
      },
      body: JSON.stringify({
        checkoutData,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      orderId: data.orderId,
      pdfUrl: data.pdfUrl,
    };
  } catch (error) {
    console.error("Failed to submit order to Shopify:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit order",
    };
  }
}

/**
 * Check if Shopify integration is configured
 */
export function isShopifyConfigured(): boolean {
  return !!SHOPIFY_ENDPOINT && SHOPIFY_ENDPOINT !== "/api/shopify/process-order";
}

