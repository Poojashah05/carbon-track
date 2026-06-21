/**
 * @file storage.js
 * @description Safe localStorage wrapper with try/catch error handling
 *   for quota exceeded errors, JSON parse failures, and SSR environments.
 */

import logger from './logger';

const PREFIX = 'co2track_';

/**
 * Reads a value from localStorage and JSON-parses it.
 * @param {string} key - Storage key (prefix applied automatically).
 * @param {*} [fallback=null] - Value to return on failure.
 * @returns {*} Parsed value or fallback.
 */
export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    logger.warn(`storage.getItem("${key}") failed:`, err);
    return fallback;
  }
}

/**
 * Serialises a value to JSON and writes it to localStorage.
 * @param {string} key - Storage key (prefix applied automatically).
 * @param {*} value - Value to store (must be JSON-serialisable).
 * @returns {boolean} `true` on success, `false` on failure.
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    logger.warn(`storage.setItem("${key}") failed:`, err);
    return false;
  }
}

/**
 * Removes a key from localStorage.
 * @param {string} key - Storage key (prefix applied automatically).
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (err) {
    logger.warn(`storage.removeItem("${key}") failed:`, err);
  }
}
