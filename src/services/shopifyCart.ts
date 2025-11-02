/**
 * Shopify Cart Service
 * Handles all cart operations using Shopify Storefront API Cart mutations
 */

import { CartItem, LabelConfiguration } from "@/types/label";
import { STOREFRONT_API_URL, STOREFRONT_ACCESS_TOKEN, isShopifyConfigured } from "@/lib/shopifyConfig";
import { getLabelProductVariantId } from "./shopifyStorefront";

// Price per label unit (in EUR) - matches utils/cart.ts
const PRICE_PER_UNIT = 12.9;

const CART_ID_STORAGE_KEY = "shopify_cart_id";

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      id: string;
      title: string;
    };
  };
  attributes: Array<{
    key: string;
    value: string;
  }>;
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
  lines: {
    edges: Array<{
      node: ShopifyCartLine;
    }>;
  };
}

/**
 * Get cart ID from localStorage
 */
export function getCartId(): string | null {
  try {
    return localStorage.getItem(CART_ID_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to get cart ID:", error);
    return null;
  }
}

/**
 * Save cart ID to localStorage
 */
export function saveCartId(cartId: string): void {
  try {
    localStorage.setItem(CART_ID_STORAGE_KEY, cartId);
  } catch (error) {
    console.error("Failed to save cart ID:", error);
  }
}

/**
 * Clear cart ID from localStorage
 */
export function clearCartId(): void {
  try {
    localStorage.removeItem(CART_ID_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear cart ID:", error);
  }
}

/**
 * Make a GraphQL request to Shopify Storefront API
 */
async function shopifyRequest(query: string, variables: Record<string, any> = {}) {
  if (!isShopifyConfigured()) {
    throw new Error("Shopify Storefront API not configured");
  }

  const response = await fetch(STOREFRONT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors.map((e: any) => e.message).join(", "));
  }

  return data.data;
}

/**
 * Create a new Shopify cart
 */
export async function createCart(): Promise<{ cartId: string; checkoutUrl: string } | null> {
  try {
    const variantId = getLabelProductVariantId();
    if (!variantId) {
      throw new Error("Product variant ID not configured");
    }

    const mutation = `
      mutation cartCreate {
        cartCreate {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const data = await shopifyRequest(mutation);

    const errors = data.cartCreate?.userErrors;
    if (errors && errors.length > 0) {
      throw new Error(errors.map((e: any) => e.message).join(", "));
    }

    const cart = data.cartCreate?.cart;
    if (!cart) {
      throw new Error("Failed to create cart");
    }

    saveCartId(cart.id);
    return {
      cartId: cart.id,
      checkoutUrl: cart.checkoutUrl,
    };
  } catch (error) {
    console.error("Failed to create cart:", error);
    return null;
  }
}

/**
 * Get or create a cart
 */
export async function getOrCreateCart(): Promise<string | null> {
  let cartId = getCartId();
  
  if (cartId) {
    // Verify cart still exists
    const cart = await queryCart(cartId);
    if (cart) {
      return cartId;
    }
    // Cart doesn't exist, clear the ID
    clearCartId();
  }

  // Create new cart
  const result = await createCart();
  return result?.cartId || null;
}

/**
 * Query cart by ID
 */
export async function queryCart(cartId: string): Promise<ShopifyCart | null> {
  try {
    const query = `
      query cartQuery($id: ID!) {
        cart(id: $id) {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      id
                      title
                    }
                  }
                }
                attributes {
                  key
                  value
                }
                cost {
                  totalAmount {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await shopifyRequest(query, { id: cartId });
    return data.cart || null;
  } catch (error) {
    console.error("Failed to query cart:", error);
    return null;
  }
}

/**
 * Add items to cart
 */
export async function addToCart(
  cartId: string,
  config: LabelConfiguration
): Promise<ShopifyCart | null> {
  try {
    const variantId = getLabelProductVariantId();
    if (!variantId) {
      throw new Error("Product variant ID not configured");
    }

    const mutation = `
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        id
                        title
                      }
                    }
                  }
                  attributes {
                    key
                    value
                  }
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
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
      cartId,
      lines: [
        {
          merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
          quantity: config.quantity,
          attributes: [
            { key: "label_text", value: config.text },
            { key: "label_font_size_pt", value: config.fontSizePt.toString() },
            { key: "label_font_size_px", value: config.fontSizePx.toString() },
            { key: "label_font_family", value: config.fontFamily },
            { key: "label_color", value: config.color },
            { key: "label_config_id", value: config.id },
          ],
        },
      ],
    };

    const data = await shopifyRequest(mutation, variables);

    const errors = data.cartLinesAdd?.userErrors;
    if (errors && errors.length > 0) {
      throw new Error(errors.map((e: any) => e.message).join(", "));
    }

    return data.cartLinesAdd?.cart || null;
  } catch (error) {
    console.error("Failed to add to cart:", error);
    return null;
  }
}

/**
 * Update cart line quantity
 */
export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart | null> {
  try {
    const mutation = `
      mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        id
                        title
                      }
                    }
                  }
                  attributes {
                    key
                    value
                  }
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
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
      cartId,
      lines: [
        {
          id: lineId,
          quantity,
        },
      ],
    };

    const data = await shopifyRequest(mutation, variables);

    const errors = data.cartLinesUpdate?.userErrors;
    if (errors && errors.length > 0) {
      throw new Error(errors.map((e: any) => e.message).join(", "));
    }

    return data.cartLinesUpdate?.cart || null;
  } catch (error) {
    console.error("Failed to update cart line:", error);
    return null;
  }
}

/**
 * Remove lines from cart
 */
export async function removeCartLines(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart | null> {
  try {
    const mutation = `
      mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        id
                        title
                      }
                    }
                  }
                  attributes {
                    key
                    value
                  }
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
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
      cartId,
      lineIds,
    };

    const data = await shopifyRequest(mutation, variables);

    const errors = data.cartLinesRemove?.userErrors;
    if (errors && errors.length > 0) {
      throw new Error(errors.map((e: any) => e.message).join(", "));
    }

    return data.cartLinesRemove?.cart || null;
  } catch (error) {
    console.error("Failed to remove cart lines:", error);
    return null;
  }
}

/**
 * Convert Shopify cart line to CartItem
 */
export function convertShopifyLineToCartItem(line: ShopifyCartLine): CartItem {
  const attributes = line.attributes.reduce((acc, attr) => {
    acc[attr.key] = attr.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    id: attributes.label_config_id || line.id,
    text: attributes.label_text || "",
    fontSizePt: parseFloat(attributes.label_font_size_pt || "0"),
    fontSizePx: parseFloat(attributes.label_font_size_px || "0"),
    quantity: line.quantity,
    fontFamily: attributes.label_font_family || "",
    color: attributes.label_color || "#000000",
    unitPrice: PRICE_PER_UNIT,
    totalPrice: parseFloat(line.cost.totalAmount.amount) || PRICE_PER_UNIT * line.quantity,
    timestamp: Date.now(),
    shopifyLineId: line.id, // Store Shopify line ID for updates/deletes
  };
}

/**
 * Get all cart items from Shopify cart
 */
export async function getCartItems(): Promise<CartItem[]> {
  const cartId = await getOrCreateCart();
  if (!cartId) {
    return [];
  }

  const cart = await queryCart(cartId);
  if (!cart || !cart.lines.edges.length) {
    return [];
  }

  return cart.lines.edges.map((edge) => convertShopifyLineToCartItem(edge.node));
}

/**
 * Get cart totals
 */
export async function getCartTotals(): Promise<{ totalQuantity: number; totalPrice: number }> {
  const cartId = await getOrCreateCart();
  if (!cartId) {
    return { totalQuantity: 0, totalPrice: 0 };
  }

  const cart = await queryCart(cartId);
  if (!cart) {
    return { totalQuantity: 0, totalPrice: 0 };
  }

  return {
    totalQuantity: cart.totalQuantity,
    totalPrice: parseFloat(cart.cost.totalAmount.amount) || 0,
  };
}

/**
 * Clear cart (remove all items)
 */
export async function clearCart(): Promise<void> {
  const cartId = getCartId();
  if (!cartId) {
    return;
  }

  const cart = await queryCart(cartId);
  if (!cart || !cart.lines.edges.length) {
    return;
  }

  const lineIds = cart.lines.edges.map((edge) => edge.node.id);
  await removeCartLines(cartId, lineIds);
}

