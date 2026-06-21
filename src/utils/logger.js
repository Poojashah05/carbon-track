/**
 * @file logger.js
 * @description Development-conditional logger. Wraps console methods behind
 *   `import.meta.env.DEV` so no logs leak into production bundles.
 */

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

/**
 * Standardised development logger.
 * @namespace logger
 */
const logger = {
  /**
   * Logs an informational message (dev only).
   * @param {...*} args - Values to log.
   */
  info: (...args) => {
    if (isDev) console.info('[CO2Track]', ...args);
  },

  /**
   * Logs a warning message (dev only).
   * @param {...*} args - Values to log.
   */
  warn: (...args) => {
    if (isDev) console.warn('[CO2Track]', ...args);
  },

  /**
   * Logs an error message (dev only).
   * @param {...*} args - Values to log.
   */
  error: (...args) => {
    if (isDev) console.error('[CO2Track]', ...args);
  },

  /**
   * Logs a debug message (dev only).
   * @param {...*} args - Values to log.
   */
  debug: (...args) => {
    if (isDev) console.debug('[CO2Track]', ...args);
  },
};

export default logger;
