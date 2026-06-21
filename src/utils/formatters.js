/**
 * @file formatters.js
 * @description Pure formatting helpers for display-layer values.
 *   No side effects; safe to call with any input.
 */

/**
 * Formats a CO₂ value in kilograms into a human-readable string.
 * Values ≥ 1000 kg are shown as tonnes.
 * @param {number} kg - Raw kg CO₂ value.
 * @returns {string} Formatted string e.g. "12.3 kg CO₂" or "1.2 t CO₂".
 */
export function formatCO2(kg) {
  const n = Number(kg);
  if (!isFinite(n)) return '— kg CO₂';
  if (n >= 1000) return `${(n / 1000).toFixed(2)} t CO₂`;
  return `${n.toFixed(1)} kg CO₂`;
}

/**
 * Formats a Date object (or ISO string) using the user's locale.
 * @param {Date|string} date - Date to format.
 * @returns {string} Locale-aware date string e.g. "21 Jun 2026".
 */
export function formatDate(date) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

/**
 * Formats a decimal fraction as a percentage string.
 * @param {number} value - Fraction between 0 and 1.
 * @param {number} [decimals=1] - Number of decimal places.
 * @returns {string} e.g. "73.4%"
 */
export function formatPercent(value, decimals = 1) {
  const n = Number(value);
  if (!isFinite(n)) return '0%';
  return `${(n * 100).toFixed(decimals)}%`;
}

/**
 * Formats a number with comma separators for thousands.
 * @param {number} value - Numeric value.
 * @returns {string} e.g. "1,234.5"
 */
export function formatNumber(value) {
  const n = Number(value);
  if (!isFinite(n)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(n);
}
