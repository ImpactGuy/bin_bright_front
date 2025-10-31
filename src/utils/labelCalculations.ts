/**
 * Label Calculation Utilities
 * Functions for converting between pixels, points, and millimeters
 * for accurate preview-to-PDF matching
 */

import { PDF_DIMENSIONS } from "@/types/label";

// Conversion constants
const MM_TO_PX = 3.779527559; // 1mm = 3.779527559px at 96 DPI (standard screen)
const MM_TO_PT = 2.834645669; // 1mm = 2.834645669 points (standard PDF units)
const PT_TO_PX = 1.333333333; // 1pt = 1.333px at 96 DPI

/**
 * Convert millimeters to pixels (for screen display)
 */
export function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

/**
 * Convert pixels to millimeters
 */
export function pxToMm(px: number): number {
  return px / MM_TO_PX;
}

/**
 * Convert millimeters to points (for PDF generation)
 */
export function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

/**
 * Convert points to pixels (for preview)
 */
export function ptToPx(pt: number): number {
  return pt * PT_TO_PX;
}

/**
 * Convert pixels to points
 */
export function pxToPt(px: number): number {
  return px / PT_TO_PX;
}

/**
 * Calculate the maximum font size (in points) that will fit within the text area
 * given the text content and font family
 * 
 * This is a simplified calculation. The actual fitting should be done server-side
 * with proper font metrics for accuracy.
 */
export function calculateMaxFontSizePt(
  text: string,
  maxWidthMm: number = PDF_DIMENSIONS.TEXT_MAX_WIDTH_MM
): number {
  // Approximate character width ratio (Impact font is condensed)
  // This is an estimate - actual measurement should be done server-side with font metrics
  const avgCharWidthRatio = 0.7; // Impact is condensed
  
  const maxWidthPt = mmToPt(maxWidthMm);
  const textLength = text.length;
  
  if (textLength === 0) return 0;
  
  // Rough calculation: font size should fit text within width
  // More accurate: use canvas measureText or server-side font metrics
  const estimatedFontSize = (maxWidthPt / textLength) / avgCharWidthRatio;
  
  // Clamp to reasonable bounds
  const MIN_PT = 40;
  const MAX_PT = 700;
  
  return Math.max(MIN_PT, Math.min(MAX_PT, estimatedFontSize));
}

/**
 * Generate a unique ID for a label configuration
 */
export function generateLabelId(): string {
  return `label_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

