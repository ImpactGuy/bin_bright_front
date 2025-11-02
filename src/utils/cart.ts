/**
 * Cart Management Utilities
 * Now uses Shopify Cart API instead of localStorage
 */

import { CartItem, LabelConfiguration } from "@/types/label";
import {
  getOrCreateCart,
  addToCart as addToShopifyCart,
  getCartItems as getShopifyCartItems,
  getCartTotals as getShopifyCartTotals,
  clearCart as clearShopifyCart,
  queryCart,
  removeCartLines,
  updateCartLine,
  getCartId,
} from "@/services/shopifyCart";

// Price per label unit (in EUR)
export const PRICE_PER_UNIT = 12.9;

/**
 * Add a label configuration to the Shopify cart
 */
export async function addToCart(config: LabelConfiguration): Promise<CartItem | null> {
  try {
    const cartId = await getOrCreateCart();
    if (!cartId) {
      throw new Error("Failed to get or create cart");
    }

    const cart = await addToShopifyCart(cartId, config);
    if (!cart) {
      throw new Error("Failed to add item to cart");
    }

    // Return the first item (we just added one)
    if (cart.lines.edges.length > 0) {
      const line = cart.lines.edges[cart.lines.edges.length - 1].node;
      return {
        ...config,
        unitPrice: PRICE_PER_UNIT,
        totalPrice: parseFloat(line.cost.totalAmount.amount) || PRICE_PER_UNIT * config.quantity,
        shopifyLineId: line.id,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to add to cart:", error);
    return null;
  }
}

/**
 * Remove an item from the cart by Shopify line ID
 */
export async function removeFromCart(shopifyLineId: string): Promise<void> {
  try {
    const cartId = getCartId();
    if (!cartId) {
      return;
    }

    await removeCartLines(cartId, [shopifyLineId]);
  } catch (error) {
    console.error("Failed to remove from cart:", error);
    throw error;
  }
}

/**
 * Update quantity of a cart item
 */
export async function updateCartItemQuantity(shopifyLineId: string, quantity: number): Promise<void> {
  try {
    const cartId = getCartId();
    if (!cartId) {
      throw new Error("Cart not found");
    }

    await updateCartLine(cartId, shopifyLineId, quantity);
  } catch (error) {
    console.error("Failed to update cart item quantity:", error);
    throw error;
  }
}

/**
 * Get all cart items from Shopify
 */
export async function getCartItems(): Promise<CartItem[]> {
  try {
    return await getShopifyCartItems();
  } catch (error) {
    console.error("Failed to get cart items:", error);
    return [];
  }
}

/**
 * Clear all cart items
 */
export async function clearCart(): Promise<void> {
  try {
    await clearShopifyCart();
  } catch (error) {
    console.error("Failed to clear cart:", error);
  }
}

/**
 * Calculate cart totals from Shopify
 */
export async function getCartTotals(): Promise<{ totalQuantity: number; totalPrice: number }> {
  try {
    return await getShopifyCartTotals();
  } catch (error) {
    console.error("Failed to get cart totals:", error);
    return { totalQuantity: 0, totalPrice: 0 };
  }
}

/**
 * Prepare checkout data for sending to Shopify
 * Note: Now we use Shopify cart directly, so this might not be needed
 */
export async function prepareCheckoutData(customerInfo?: { email?: string; name?: string }) {
  const items = await getCartItems();
  const { totalQuantity, totalPrice } = await getCartTotals();

  return {
    items,
    totalQuantity,
    totalPrice,
    customerInfo,
  };
}
