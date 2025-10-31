/**
 * Shopify Storefront API Service
 * Handles cart operations and checkout creation via Shopify Storefront API
 */

import { CartItem } from "@/types/label";
import { SHOPIFY_STORE_URL, STOREFRONT_API_URL, STOREFRONT_ACCESS_TOKEN, isShopifyConfigured } from "@/lib/shopifyConfig";

export interface ShopifyLineItem {
  variantId: string;
  quantity: number;
  customAttributes?: Array<{ key: string; value: string }>;
}

export interface CheckoutCreateResponse {
  checkoutId?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Create a checkout with line items
 * Uses Shopify Storefront API GraphQL
 */
export async function createCheckout(
  lineItems: ShopifyLineItem[]
): Promise<CheckoutCreateResponse> {
  if (!isShopifyConfigured()) {
    return {
      error: "Shopify Storefront API not configured. Please set VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env"
    };
  }

  try {
    const mutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            lines(first: 10) {
              edges {
                node {
                  id
                  merchandise {
                    ... on ProductVariant {
                      title
                    }
                  }
                  quantity
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        lines: lineItems.map(item => ({
          merchandiseId: `gid://shopify/ProductVariant/${item.variantId}`,
          quantity: item.quantity,
          attributes: item.customAttributes || []
        }))
      }
    };

    const response = await fetch(STOREFRONT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      return {
        error: data.errors.map((e: any) => e.message).join(", "),
      };
    }

    const cart = data.data?.cartCreate?.cart;
    const errors = data.data?.cartCreate?.userErrors;

    if (errors && errors.length > 0) {
      return {
        error: errors.map((e: any) => e.message).join(", "),
      };
    }

    if (!cart) {
      return {
        error: "Failed to create cart",
      };
    }

    return {
      checkoutId: cart.id,
      checkoutUrl: cart.checkoutUrl,
    };
  } catch (error) {
    console.error("Failed to create checkout:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to create checkout",
    };
  }
}

/**
 * Convert label cart items to Shopify line items
 * Note: This requires a product variant ID from Shopify
 * You'll need to either:
 * 1. Create a product in Shopify and get its variant ID
 * 2. Create products dynamically via Admin API (backend only)
 */
export function convertCartItemsToLineItems(
  cartItems: CartItem[],
  productVariantId: string
): ShopifyLineItem[] {
  return cartItems.map(item => ({
    variantId: productVariantId,
    quantity: item.quantity,
    customAttributes: [
      {
        key: "label_text",
        value: item.text,
      },
      {
        key: "label_font_size_pt",
        value: item.fontSizePt.toString(),
      },
      {
        key: "label_font_family",
        value: item.fontFamily,
      },
      {
        key: "label_color",
        value: item.color,
      },
      {
        key: "label_config_id",
        value: item.id,
      },
    ],
  }));
}

/**
 * Get or create a product variant for custom labels
 * This would typically be done via Admin API (backend)
 * For now, returns the variant ID that should be configured
 */
export function getLabelProductVariantId(): string {
  // This should be set from environment variable
  // Or fetched from your Shopify product
  return import.meta.env.VITE_SHOPIFY_LABEL_VARIANT_ID || "";
}

/**
 * Redirect to Shopify checkout
 */
export function redirectToCheckout(checkoutUrl: string): void {
  if (checkoutUrl) {
    window.location.href = checkoutUrl;
  }
}

