/**
 * @file sanitize.js
 * @description Input sanitisation helpers — strip HTML, coerce numbers safely,
 *   and prevent injection attacks before data is stored or displayed.
 */

/**
 * Strips HTML tags from a string to prevent XSS injection.
 * @param {string} value - Raw user-provided string.
 * @returns {string} Sanitised plain-text string.
 */
export function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').trim();
}

/**
 * Safely converts a value to a finite non-negative number.
 * Returns 0 for any invalid, NaN, Infinity, or negative input.
 * @param {*} value - Value to convert.
 * @returns {number} A safe non-negative finite number.
 */
export function toSafeNumber(value) {
  const num = Number(value);
  if (!isFinite(num) || isNaN(num) || num < 0) return 0;
  return num;
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param {number} value - The number to clamp.
 * @param {number} min - Minimum bound (inclusive).
 * @param {number} max - Maximum bound (inclusive).
 * @returns {number} Clamped value.
 */
export function clamp(value, min, max) {
  const num = toSafeNumber(value);
  return Math.min(Math.max(num, min), max);
}
