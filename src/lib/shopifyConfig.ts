/**
 * Shopify Configuration
 * Storefront API configuration for client-side use
 */

// Storefront API Configuration
export const SHOPIFY_STORE_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'tonnentext.myshopify.com';
export const STOREFRONT_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '';
export const STOREFRONT_API_VERSION = '2024-01';

// Admin API Configuration (for backend/server-side only - NOT for client-side!)
// DO NOT expose Admin API token in frontend code
export const ADMIN_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN || ''; // Only if needed server-side

// Store URL
export const SHOPIFY_STORE_URL = `https://${SHOPIFY_STORE_DOMAIN}`;
export const STOREFRONT_API_URL = `${SHOPIFY_STORE_URL}/api/${STOREFRONT_API_VERSION}/graphql.json`;

/**
 * Check if Shopify is properly configured
 */
export function isShopifyConfigured(): boolean {
  return !!STOREFRONT_ACCESS_TOKEN && !!SHOPIFY_STORE_DOMAIN;
}

