/**
 * @file sanitize.test.js
 * @description Unit tests for input sanitisation helper functions.
 */

import { sanitizeString, toSafeNumber, clamp } from '../utils/sanitize';

describe('sanitizeString', () => {
  it('strips HTML tags correctly', () => {
    expect(sanitizeString('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
    expect(sanitizeString('<div>Paragraph</div>')).toBe('Paragraph');
  });

  it('returns empty string for non-string inputs', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
    expect(sanitizeString(123)).toBe('');
    expect(sanitizeString({})).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('   hello world   ')).toBe('hello world');
  });
});

describe('toSafeNumber', () => {
  it('converts valid numbers correctly', () => {
    expect(toSafeNumber(10)).toBe(10);
    expect(toSafeNumber('12.5')).toBe(12.5);
  });

  it('returns 0 for negative numbers', () => {
    expect(toSafeNumber(-5)).toBe(0);
  });

  it('returns 0 for NaN, Infinity, and invalid inputs', () => {
    expect(toSafeNumber(NaN)).toBe(0);
    expect(toSafeNumber(Infinity)).toBe(0);
    expect(toSafeNumber('abc')).toBe(0);
    expect(toSafeNumber(null)).toBe(0);
  });
});

describe('clamp', () => {
  it('clamps values correctly within bounds', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(0, 1, 10)).toBe(1);
    expect(clamp(15, 1, 10)).toBe(10);
  });
});
