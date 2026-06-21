/**
 * Unit tests for emission calculation engine
 * Run with: npm test
 */
import {
  calculateEmission,
  getTotalMonthlyEmission,
  getCategoryBreakdown,
  compareToGlobalAverage,
} from '../utils/emissionFactors'
import { formatCO2 } from '../utils/formatters'

// ─── calculateEmission ────────────────────────────────────────────────────────

describe('calculateEmission()', () => {
  describe('transport category', () => {
    it('calculates petrol car emissions correctly', () => {
      // 100 km × 0.192 kg/km = 19.2 kg
      expect(calculateEmission('transport', 'car_petrol', 100)).toBeCloseTo(19.2)
    })

    it('calculates electric car emissions correctly', () => {
      expect(calculateEmission('transport', 'car_electric', 100)).toBeCloseTo(5.3)
    })

    it('returns 0 for bicycle', () => {
      expect(calculateEmission('transport', 'bicycle', 50)).toBe(0)
    })

    it('returns 0 for walking', () => {
      expect(calculateEmission('transport', 'walking', 10)).toBe(0)
    })

    it('calculates domestic flight correctly', () => {
      // 500 km × 0.255 = 127.5 kg
      expect(calculateEmission('transport', 'flight_domestic', 500)).toBeCloseTo(127.5)
    })

    it('calculates diesel car emissions correctly', () => {
      expect(calculateEmission('transport', 'car_diesel', 100)).toBeCloseTo(17.1)
    })

    it('calculates bus emissions correctly', () => {
      expect(calculateEmission('transport', 'bus', 100)).toBeCloseTo(8.9)
    })

    it('calculates train emissions correctly', () => {
      expect(calculateEmission('transport', 'train', 100)).toBeCloseTo(4.1)
    })

    it('calculates metro emissions correctly', () => {
      expect(calculateEmission('transport', 'metro', 100)).toBeCloseTo(3.1)
    })

    it('calculates auto rickshaw emissions correctly', () => {
      expect(calculateEmission('transport', 'auto_rickshaw', 100)).toBeCloseTo(11.0)
    })

    it('calculates petrol 2-wheeler emissions correctly', () => {
      expect(calculateEmission('transport', 'two_wheeler_petrol', 100)).toBeCloseTo(8.5)
    })

    it('calculates electric 2-wheeler emissions correctly', () => {
      expect(calculateEmission('transport', 'two_wheeler_electric', 100)).toBeCloseTo(2.0)
    })

    it('calculates international flight correctly', () => {
      expect(calculateEmission('transport', 'flight_international', 1000)).toBeCloseTo(195.0)
    })
  })

  describe('food category', () => {
    it('calculates mutton meal correctly', () => {
      // 2 servings × 5.84 = 11.68 kg
      expect(calculateEmission('food', 'mutton', 2)).toBeCloseTo(11.68)
    })

    it('calculates vegan meal correctly', () => {
      // 3 servings × 0.22 = 0.66 kg
      expect(calculateEmission('food', 'vegan', 3)).toBeCloseTo(0.66)
    })

    it('calculates veg thali correctly', () => {
      // 1 serving × 0.40 = 0.40 kg
      expect(calculateEmission('food', 'veg_thali', 1)).toBeCloseTo(0.40)
    })

    it('calculates chicken meal correctly', () => {
      expect(calculateEmission('food', 'chicken', 2)).toBeCloseTo(1.94)
    })

    it('calculates fish meal correctly', () => {
      expect(calculateEmission('food', 'fish', 2)).toBeCloseTo(1.74)
    })

    it('calculates paneer meal correctly', () => {
      expect(calculateEmission('food', 'paneer', 2)).toBeCloseTo(1.10)
    })

    it('calculates egg meal correctly', () => {
      expect(calculateEmission('food', 'egg', 2)).toBeCloseTo(0.92)
    })

    it('calculates dal correctly', () => {
      expect(calculateEmission('food', 'dal', 2)).toBeCloseTo(0.56)
    })

    it('calculates rice meal correctly', () => {
      expect(calculateEmission('food', 'rice_meal', 2)).toBeCloseTo(0.70)
    })
  })

  describe('energy category', () => {
    it('calculates India electricity correctly', () => {
      // 300 kWh × 0.82 = 246 kg
      expect(calculateEmission('energy', 'electricity_india', 300)).toBeCloseTo(246)
    })

    it('calculates LPG correctly', () => {
      // 10 L × 1.51 = 15.1 kg
      expect(calculateEmission('energy', 'lpg', 10)).toBeCloseTo(15.1)
    })

    it('calculates solar electricity correctly', () => {
      expect(calculateEmission('energy', 'electricity_solar', 100)).toBeCloseTo(4.1)
    })

    it('calculates natural gas correctly', () => {
      expect(calculateEmission('energy', 'natural_gas', 10)).toBeCloseTo(20.4)
    })

    it('calculates kerosene correctly', () => {
      expect(calculateEmission('energy', 'kerosene', 10)).toBeCloseTo(25.4)
    })
  })

  describe('shopping category', () => {
    it('calculates clothing item correctly', () => {
      // 2 items × 10.0 = 20 kg
      expect(calculateEmission('shopping', 'clothing_item', 2)).toBeCloseTo(20)
    })

    it('calculates large electronics correctly', () => {
      expect(calculateEmission('shopping', 'electronics_large', 1)).toBeCloseTo(200)
    })

    it('calculates small electronics correctly', () => {
      expect(calculateEmission('shopping', 'electronics_small', 1)).toBeCloseTo(50)
    })

    it('calculates online delivery correctly', () => {
      expect(calculateEmission('shopping', 'online_delivery', 2)).toBeCloseTo(1.0)
    })

    it('calculates plastic bag correctly', () => {
      expect(calculateEmission('shopping', 'plastic_bag', 10)).toBeCloseTo(0.20)
    })
  })

  describe('edge cases', () => {
    it('returns 0 for zero quantity', () => {
      expect(calculateEmission('transport', 'car_petrol', 0)).toBe(0)
    })

    it('returns 0 for negative quantity', () => {
      expect(calculateEmission('transport', 'car_petrol', -10)).toBe(0)
    })

    it('returns 0 for unknown category', () => {
      expect(calculateEmission('unknown', 'car_petrol', 100)).toBe(0)
    })

    it('returns 0 for unknown subcategory', () => {
      expect(calculateEmission('transport', 'hovercraft', 100)).toBe(0)
    })

    it('handles string quantity by parsing to float', () => {
      expect(calculateEmission('transport', 'car_petrol', '50')).toBeCloseTo(9.6)
    })

    it('returns 0 for non-numeric quantity', () => {
      expect(calculateEmission('transport', 'car_petrol', 'abc')).toBe(0)
    })
  })
})

// ─── getTotalMonthlyEmission ──────────────────────────────────────────────────

describe('getTotalMonthlyEmission()', () => {
  const now = new Date()
  const thisMonth = now.toISOString()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString()

  it('sums current month logs only', () => {
    const logs = [
      { date: thisMonth, co2Kg: 10 },
      { date: thisMonth, co2Kg: 20 },
      { date: lastMonth, co2Kg: 100 }, // should be excluded
    ]
    expect(getTotalMonthlyEmission(logs)).toBeCloseTo(30)
  })

  it('returns 0 for empty array', () => {
    expect(getTotalMonthlyEmission([])).toBe(0)
  })

  it('returns 0 for non-array input', () => {
    expect(getTotalMonthlyEmission(null)).toBe(0)
    expect(getTotalMonthlyEmission(undefined)).toBe(0)
    expect(getTotalMonthlyEmission('string')).toBe(0)
  })

  it('handles missing co2Kg gracefully', () => {
    const logs = [
      { date: thisMonth, co2Kg: 5 },
      { date: thisMonth }, // no co2Kg
    ]
    expect(getTotalMonthlyEmission(logs)).toBeCloseTo(5)
  })

  it('tests with a single log entry', () => {
    const logs = [{ date: thisMonth, co2Kg: 15 }]
    expect(getTotalMonthlyEmission(logs)).toBeCloseTo(15)
  })

  it('tests with multiple logs spanning all four categories', () => {
    const logs = [
      { date: thisMonth, category: 'transport', co2Kg: 10 },
      { date: thisMonth, category: 'food', co2Kg: 20 },
      { date: thisMonth, category: 'energy', co2Kg: 30 },
      { date: thisMonth, category: 'shopping', co2Kg: 40 },
    ]
    expect(getTotalMonthlyEmission(logs)).toBeCloseTo(100)
  })

  it('handles logs containing malformed or missing fields safely', () => {
    const logs = [
      { date: thisMonth, category: 'transport', co2Kg: 10 },
      { date: thisMonth, category: undefined, co2Kg: undefined },
      { date: thisMonth, noCategoryHere: true, missingQuantity: true },
      { date: 'invalid-date', co2Kg: 50 },
    ]
    expect(getTotalMonthlyEmission(logs)).toBeCloseTo(10)
  })
})

// ─── getCategoryBreakdown ─────────────────────────────────────────────────────

describe('getCategoryBreakdown()', () => {
  const now = new Date()
  const thisMonth = now.toISOString()

  it('returned percentages across all categories sum to 100 when logs exist', () => {
    const logs = [
      { date: thisMonth, category: 'transport', co2Kg: 25 },
      { date: thisMonth, category: 'food', co2Kg: 25 },
      { date: thisMonth, category: 'energy', co2Kg: 25 },
      { date: thisMonth, category: 'shopping', co2Kg: 25 },
    ]
    const breakdown = getCategoryBreakdown(logs)
    const sum = 
      parseFloat(breakdown.percentages.transport) +
      parseFloat(breakdown.percentages.food) +
      parseFloat(breakdown.percentages.energy) +
      parseFloat(breakdown.percentages.shopping)
    expect(sum).toBeCloseTo(100)
  })

  it('returns 0 or an empty breakdown when no logs exist', () => {
    const breakdown = getCategoryBreakdown([])
    expect(breakdown.transport).toBe(0)
    expect(breakdown.food).toBe(0)
    expect(breakdown.energy).toBe(0)
    expect(breakdown.shopping).toBe(0)
    expect(breakdown.total).toBe(0)
    expect(breakdown.percentages.transport).toBe('0.0')
  })

  it('returns 100% for one category when logs only belong to a single category', () => {
    const logs = [
      { date: thisMonth, category: 'transport', co2Kg: 50 },
      { date: thisMonth, category: 'transport', co2Kg: 50 },
    ]
    const breakdown = getCategoryBreakdown(logs)
    expect(breakdown.percentages.transport).toBe('100.0')
    expect(breakdown.percentages.food).toBe('0.0')
    expect(breakdown.percentages.energy).toBe('0.0')
    expect(breakdown.percentages.shopping).toBe('0.0')
  })
})

// ─── compareToGlobalAverage ──────────────────────────────────────────────────

describe('compareToGlobalAverage()', () => {
  it('correctly identifies above-average status', () => {
    const result = compareToGlobalAverage(500)
    expect(result.status).toBe('above')
    expect(result.isAboveAverage).toBe(true)
    expect(result.diff).toBeCloseTo(108.33)
  })

  it('correctly identifies below-average status', () => {
    const result = compareToGlobalAverage(200)
    expect(result.status).toBe('below')
    expect(result.isAboveAverage).toBe(false)
    expect(result.diff).toBeCloseTo(-191.67)
  })

  it('tests the exact boundary case where total equals the global average exactly', () => {
    const result = compareToGlobalAverage(391.67)
    expect(result.diff).toBeCloseTo(0)
    expect(result.status).toBe('below') // or above based on implementation, 0 is typically below
    expect(result.percent).toBe('0.0')
  })

  it('tests zero total', () => {
    const result = compareToGlobalAverage(0)
    expect(result.total).toBe(0)
    expect(result.globalAverage).toBe(391.67)
    expect(result.diff).toBeCloseTo(-391.67)
    expect(result.percent).toBe('100.0')
  })

  it('returns global average of 391.67', () => {
    const result = compareToGlobalAverage(0)
    expect(result.globalAverage).toBe(391.67)
  })

  it('returns India average of 230', () => {
    const result = compareToGlobalAverage(0)
    expect(result.indiaAverage).toBe(230)
  })

  it('returns correct percent for known inputs', () => {
    const result = compareToGlobalAverage(0)
    expect(parseFloat(result.percent)).toBeCloseTo(100)
  })

  it('handles non-numeric input', () => {
    const result = compareToGlobalAverage('abc')
    expect(result.total).toBe(0)
    expect(result.status).toBe('below')
  })
})

// ─── formatCO2 ───────────────────────────────────────────────────────────────

describe('formatCO2()', () => {
  it('formats values under 1000 kg correctly', () => {
    expect(formatCO2(123.456)).toBe('123.5 kg CO₂')
  })

  it('formats values >= 1000 as tonnes', () => {
    expect(formatCO2(1234)).toBe('1.23 t CO₂')
  })

  it('formats zero correctly', () => {
    expect(formatCO2(0)).toBe('0.0 kg CO₂')
  })

  it('formats exactly 1000 as tonnes', () => {
    expect(formatCO2(1000)).toBe('1.00 t CO₂')
  })

  it('handles non-numeric input gracefully', () => {
    expect(formatCO2(null)).toBe('0.0 kg CO₂')
    expect(formatCO2(undefined)).toBe('0.0 kg CO₂')
    expect(formatCO2('abc')).toBe('0.0 kg CO₂')
  })

  it('handles string numbers', () => {
    expect(formatCO2('250')).toBe('250.0 kg CO₂')
  })
})
