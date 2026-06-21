/**
 * Utility for sanitizing user inputs
 */
export const sanitize = {
  /**
   * Basic text trim
   * @param {string} str 
   * @returns {string}
   */
  text: (str) => (typeof str === 'string' ? str.trim() : ''),

  /**
   * Trim and collapse multiple spaces into one
   * @param {string} str 
   * @returns {string}
   */
  name: (str) => (typeof str === 'string' ? str.trim().replace(/\s+/g, ' ') : ''),
}
