/**
 * @file emissionFactors.test.js
 * @description Unit tests for all emissionFactors.js pure functions.
 *   Tests every subcategory, edge cases, and aggregation logic.
 */

import {
  FACTORS,
  calculateEmission,
  getTotalMonthlyEmission,
  getCategoryBreakdown,
  compareToGlobalAverage,
  INDIA_MONTHLY_AVG_KG,
  GLOBAL_MONTHLY_AVG_KG,
} from '../utils/emissionFactors';

// ─── calculateEmission ───────────────────────────────────────────────

describe('calculateEmission', () => {
  // Transport
  describe('transport subcategories', () => {
    const transportCases = Object.entries(FACTORS.transport);
    test.each(transportCases)(
      'transport/%s: calculates correctly for 100 km',
      (sub, factor) => {
        const result = calculateEmission('transport', sub, 100);
        expect(result).toBeCloseTo(factor * 100, 2);
      }
    );

    it('car_petrol zero distance returns 0', () => {
      expect(calculateEmission('transport', 'car_petrol', 0)).toBe(0);
    });

    it('bicycle always returns 0', () => {
      expect(calculateEmission('transport', 'bicycle', 9999)).toBe(0);
    });

    it('walking always returns 0', () => {
      expect(calculateEmission('transport', 'walking', 100)).toBe(0);
    });
  });

  // Food
  describe('food subcategories', () => {
    const foodCases = Object.entries(FACTORS.food);
    test.each(foodCases)(
      'food/%s: calculates correctly for 3 meals',
      (sub, factor) => {
        const result = calculateEmission('food', sub, 3);
        expect(result).toBeCloseTo(factor * 3, 2);
      }
    );
  });

  // Energy
  describe('energy subcategories', () => {
    const energyCases = Object.entries(FACTORS.energy);
    test.each(energyCases)(
      'energy/%s: calculates correctly for 100 units',
      (sub, factor) => {
        const result = calculateEmission('energy', sub, 100);
        expect(result).toBeCloseTo(factor * 100, 2);
      }
    );
  });

  // Shopping
  describe('shopping subcategories', () => {
    const shoppingCases = Object.entries(FACTORS.shopping);
    test.each(shoppingCases)(
      'shopping/%s: calculates correctly for 2 items',
      (sub, factor) => {
        const result = calculateEmission('shopping', sub, 2);
        expect(result).toBeCloseTo(factor * 2, 2);
      }
    );
  });

  // Edge cases
  describe('edge cases', () => {
    it('returns 0 for unknown category', () => {
      expect(calculateEmission('unknown', 'car_petrol', 100)).toBe(0);
    });

    it('returns 0 for unknown subcategory', () => {
      expect(calculateEmission('transport', 'hovercraft', 100)).toBe(0);
    });

    it('returns 0 for negative quantity', () => {
      expect(calculateEmission('transport', 'car_petrol', -50)).toBe(0);
    });

    it('handles NaN quantity gracefully', () => {
      expect(calculateEmission('transport', 'car_petrol', NaN)).toBe(0);
    });

    it('handles string quantity gracefully', () => {
      expect(calculateEmission('food', 'mutton', 'two')).toBe(0);
    });

    it('handles Infinity quantity as 0', () => {
      expect(calculateEmission('transport', 'car_petrol', Infinity)).toBe(0);
    });
  });
});

// ─── getTotalMonthlyEmission ─────────────────────────────────────────

describe('getTotalMonthlyEmission', () => {
  it('returns 0 for empty logs array', () => {
    expect(getTotalMonthlyEmission([])).toBe(0);
  });

  it('returns 0 for null/undefined input', () => {
    expect(getTotalMonthlyEmission(null)).toBe(0);
    expect(getTotalMonthlyEmission(undefined)).toBe(0);
  });

  it('sums multiple valid logs correctly', () => {
    const logs = [
      { category: 'transport', subcategory: 'car_petrol', quantity: 100 },  // 19.2
      { category: 'food', subcategory: 'mutton', quantity: 2 },             // 11.68
    ];
    expect(getTotalMonthlyEmission(logs)).toBeCloseTo(30.88, 1);
  });

  it('skips malformed log entries', () => {
    const logs = [
      { category: 'transport', subcategory: 'car_petrol', quantity: 50 },   // 9.6
      null,
      undefined,
      { category: undefined, subcategory: null, quantity: 999 },
      'not-an-object',
    ];
    expect(getTotalMonthlyEmission(logs)).toBeCloseTo(9.6, 1);
  });

  it('handles log with unknown category gracefully', () => {
    const logs = [{ category: 'alien', subcategory: 'ufo', quantity: 100 }];
    expect(getTotalMonthlyEmission(logs)).toBe(0);
  });
});

// ─── getCategoryBreakdown ─────────────────────────────────────────────

describe('getCategoryBreakdown', () => {
  it('returns all 4 categories with 0 values for empty logs', () => {
    const result = getCategoryBreakdown([]);
    expect(result).toHaveLength(4);
    result.forEach((b) => {
      expect(b.kg).toBe(0);
      expect(b.percent).toBe(0);
    });
  });

  it('percentages sum to 100 for valid logs', () => {
    const logs = [
      { category: 'transport', subcategory: 'car_petrol', quantity: 100 },
      { category: 'food', subcategory: 'mutton', quantity: 5 },
      { category: 'energy', subcategory: 'electricity_india', quantity: 50 },
      { category: 'shopping', subcategory: 'clothing_item', quantity: 1 },
    ];
    const breakdown = getCategoryBreakdown(logs);
    const total = breakdown.reduce((s, b) => s + b.percent, 0);
    expect(total).toBeCloseTo(100, 0);
  });

  it('returns sorted descending by kg', () => {
    const logs = [
      { category: 'food', subcategory: 'dal', quantity: 1 },              // 0.22
      { category: 'transport', subcategory: 'car_petrol', quantity: 100 }, // 19.2
    ];
    const breakdown = getCategoryBreakdown(logs);
    const kgs = breakdown.filter((b) => b.kg > 0).map((b) => b.kg);
    for (let i = 1; i < kgs.length; i++) {
      expect(kgs[i - 1]).toBeGreaterThanOrEqual(kgs[i]);
    }
  });
});

// ─── compareToGlobalAverage ──────────────────────────────────────────

describe('compareToGlobalAverage', () => {
  it('returns below_india status for low emitters', () => {
    const result = compareToGlobalAverage(100);
    expect(result.status).toBe('below_india');
    expect(result.indiaPercent).toBeLessThan(0);
    expect(result.globalPercent).toBeLessThan(0);
  });

  it('returns above_india_below_global for mid-range emitters', () => {
    const result = compareToGlobalAverage(300);
    expect(result.status).toBe('above_india_below_global');
  });

  it('returns above_global for high emitters', () => {
    const result = compareToGlobalAverage(500);
    expect(result.status).toBe('above_global');
    expect(result.globalPercent).toBeGreaterThan(0);
  });

  it('includes correct averages', () => {
    const result = compareToGlobalAverage(0);
    expect(result.indiaAvg).toBe(INDIA_MONTHLY_AVG_KG);
    expect(result.globalAvg).toBe(GLOBAL_MONTHLY_AVG_KG);
  });

  it('formats vsGlobal as + prefix when above average', () => {
    const result = compareToGlobalAverage(500);
    expect(result.vsGlobal).toMatch(/^\+/);
  });

  it('formats vsIndia as negative when below average', () => {
    const result = compareToGlobalAverage(100);
    expect(result.vsIndia).toMatch(/^-/);
  });

  it('handles 0 kg gracefully', () => {
    const result = compareToGlobalAverage(0);
    expect(result.status).toBe('below_india');
  });

  it('handles NaN gracefully', () => {
    const result = compareToGlobalAverage(NaN);
    expect(result.status).toBe('below_india');
  });
});
