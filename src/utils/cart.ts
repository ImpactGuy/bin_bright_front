/**
 * Cart Management Utilities
 * Handles cart storage, retrieval, and management
 */

import { CartItem, LabelConfiguration, CheckoutData } from "@/types/label";

// Price per label unit (in EUR)
export const PRICE_PER_UNIT = 12.9;

const CART_STORAGE_KEY = "label_cart_items";

/**
 * Save cart items to localStorage
 */
export function saveCartItems(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save cart items:", error);
  }
}

/**
 * Load cart items from localStorage
 */
export function loadCartItems(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as CartItem[];
    }
  } catch (error) {
    console.error("Failed to load cart items:", error);
  }
  return [];
}

/**
 * Add a label configuration to the cart
 */
export function addToCart(config: LabelConfiguration): CartItem {
  const cartItem: CartItem = {
    ...config,
    unitPrice: PRICE_PER_UNIT,
    totalPrice: PRICE_PER_UNIT * config.quantity,
  };
  
  const existingItems = loadCartItems();
  existingItems.push(cartItem);
  saveCartItems(existingItems);
  
  return cartItem;
}

/**
 * Remove an item from the cart by ID
 */
export function removeFromCart(itemId: string): void {
  const items = loadCartItems();
  const filtered = items.filter(item => item.id !== itemId);
  saveCartItems(filtered);
}

/**
 * Update quantity of a cart item
 */
export function updateCartItemQuantity(itemId: string, quantity: number): void {
  const items = loadCartItems();
  const item = items.find(i => i.id === itemId);
  if (item) {
    item.quantity = quantity;
    item.totalPrice = item.unitPrice * quantity;
    saveCartItems(items);
  }
}

/**
 * Get all cart items
 */
export function getCartItems(): CartItem[] {
  return loadCartItems();
}

/**
 * Clear all cart items
 */
export function clearCart(): void {
  saveCartItems([]);
}

/**
 * Calculate cart totals
 */
export function getCartTotals(): { totalQuantity: number; totalPrice: number } {
  const items = getCartItems();
  return {
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.totalPrice, 0),
  };
}

/**
 * Prepare checkout data for sending to Shopify
 */
export function prepareCheckoutData(customerInfo?: { email?: string; name?: string }): CheckoutData {
  const items = getCartItems();
  const { totalQuantity, totalPrice } = getCartTotals();
  
  return {
    items,
    totalQuantity,
    totalPrice,
    customerInfo,
  };
}

