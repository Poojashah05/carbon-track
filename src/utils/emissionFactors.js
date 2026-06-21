/**
 * Emission calculation engine using IPCC AR6 / EPA emission factors
 * Culturally adapted for India — no beef/pork, includes Indian staples
 * All functions are pure with no side effects
 */

/** @type {Object} Emission factors by category and subcategory */
const FACTORS = {
  transport: {
    car_petrol:            0.192, // kg CO₂ per km
    car_diesel:            0.171,
    car_electric:          0.053,
    bus:                   0.089,
    train:                 0.041,
    metro:                 0.031, // Indian metro (cleaner grid)
    auto_rickshaw:         0.110,
    two_wheeler_petrol:    0.085,
    two_wheeler_electric:  0.020,
    flight_domestic:       0.255, // kg CO₂ per km
    flight_international:  0.195,
    bicycle:               0,
    walking:               0,
  },
  food: {
    mutton:       5.84,  // kg CO₂ per 150g serving (Poore & Nemecek 2018)
    chicken:      0.97,
    fish:         0.87,
    paneer:       0.55,  // Indian cottage cheese (dairy-based)
    egg:          0.46,
    dal:          0.28,  // Lentils / pulses
    rice_meal:    0.35,  // Cooked rice + sabzi
    veg_thali:    0.40,  // Mixed vegetarian thali
    vegan:        0.22,  // Purely plant-based
  },
  energy: {
    electricity_india:  0.82,  // kg CO₂ per kWh (CEA India Grid 2022)
    electricity_solar:  0.041, // Rooftop solar
    natural_gas:        2.04,  // kg CO₂ per m³
    lpg:                1.51,  // kg CO₂ per liter (cooking gas)
    kerosene:           2.54,  // kg CO₂ per liter
  },
  shopping: {
    clothing_item:     10.0,  // kg CO₂ per item (Cotton Trust)
    electronics_small: 50,
    electronics_large: 200,
    online_delivery:   0.5,   // per package
    plastic_bag:       0.02,
  },
}

export const GLOBAL_AVERAGE_MONTHLY_KG = 391.67
export const INDIA_AVERAGE_MONTHLY_KG = 230

// Human-readable labels (India-localised)
const LABELS = {
  transport: {
    car_petrol:            'Car (Petrol)',
    car_diesel:            'Car (Diesel)',
    car_electric:          'Car (Electric)',
    bus:                   'Bus',
    train:                 'Train',
    metro:                 'Metro',
    auto_rickshaw:         'Auto Rickshaw',
    two_wheeler_petrol:    '2-Wheeler (Petrol)',
    two_wheeler_electric:  '2-Wheeler (Electric)',
    flight_domestic:       'Flight (Domestic)',
    flight_international:  'Flight (International)',
    bicycle:               'Bicycle',
    walking:               'Walking',
  },
  food: {
    mutton:     'Mutton / Lamb',
    chicken:    'Chicken',
    fish:       'Fish / Seafood',
    paneer:     'Paneer / Dairy',
    egg:        'Eggs',
    dal:        'Dal / Pulses',
    rice_meal:  'Rice + Sabzi',
    veg_thali:  'Veg Thali',
    vegan:      'Fully Plant-Based',
  },
  energy: {
    electricity_india:  'Electricity (India Grid)',
    electricity_solar:  'Solar (Rooftop)',
    natural_gas:        'Natural Gas (PNG)',
    lpg:                'LPG (Cooking Gas)',
    kerosene:           'Kerosene',
  },
  shopping: {
    clothing_item:     'Clothing Item',
    electronics_small: 'Small Electronics',
    electronics_large: 'Large Electronics',
    online_delivery:   'Online Delivery',
    plastic_bag:       'Plastic Bags',
  },
}

/**
 * Calculate CO₂ emission for a given activity
 * @param {string} category - Top-level category
 * @param {string} subcategory - Specific activity type
 * @param {number|string} quantity - Amount (km, servings, kWh, items, etc.)
 * @returns {number} CO₂ in kg
 */
export function calculateEmission(category, subcategory, quantity) {
  const qty = Number.parseFloat(quantity) || 0
  if (qty <= 0) return 0
  const categoryFactors = FACTORS[category]
  if (!categoryFactors) return 0
  const factor = categoryFactors[subcategory]
  if (factor === undefined) return 0
  return qty * factor
}

/**
 * Calculate total monthly emissions from logs
 * @param {Array} logs
 * @returns {number} Total kg CO₂ for current month
 */
export function getTotalMonthlyEmission(logs) {
  if (!Array.isArray(logs)) return 0
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  return logs
    .filter(log => {
      const logDate = new Date(log.date)
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear
    })
    .reduce((sum, log) => sum + (Number.parseFloat(log.co2Kg) || 0), 0)
}

/**
 * Get category breakdown from logs for the current month
 * @param {Array} logs
 * @returns {Object}
 */
export function getCategoryBreakdown(logs) {
  if (!Array.isArray(logs)) {
    return { transport: 0, food: 0, energy: 0, shopping: 0, total: 0, percentages: {}, status: 'below', diff: 0, percent: '0.0' }
  }
  const now = new Date()
  const monthlyLogs = logs.filter(log => {
    const logDate = new Date(log.date)
    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear()
  })
  const breakdown = { transport: 0, food: 0, energy: 0, shopping: 0 }
  monthlyLogs.forEach(log => {
    if (Object.prototype.hasOwnProperty.call(breakdown, log.category)) {
      breakdown[log.category] += Number.parseFloat(log.co2Kg) || 0
    }
  })
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0)
  const diff = total - GLOBAL_AVERAGE_MONTHLY_KG
  const percent = GLOBAL_AVERAGE_MONTHLY_KG > 0
    ? Math.abs((diff / GLOBAL_AVERAGE_MONTHLY_KG) * 100).toFixed(1)
    : '0.0'
  return {
    ...breakdown,
    total,
    percentages: {
      transport: total > 0 ? ((breakdown.transport / total) * 100).toFixed(1) : '0.0',
      food:      total > 0 ? ((breakdown.food      / total) * 100).toFixed(1) : '0.0',
      energy:    total > 0 ? ((breakdown.energy    / total) * 100).toFixed(1) : '0.0',
      shopping:  total > 0 ? ((breakdown.shopping  / total) * 100).toFixed(1) : '0.0',
    },
    diff,
    percent,
    status: diff > 0 ? 'above' : 'below',
    isAboveAverage: diff > 0,
  }
}

/**
 * Compare user's emissions to global average
 * @param {number} totalKg
 * @returns {Object}
 */
export function compareToGlobalAverage(totalKg) {
  const total = Number.parseFloat(totalKg) || 0
  const diff = total - GLOBAL_AVERAGE_MONTHLY_KG
  const percent = GLOBAL_AVERAGE_MONTHLY_KG > 0 ? Math.abs((diff / GLOBAL_AVERAGE_MONTHLY_KG) * 100) : 0
  return {
    total,
    globalAverage: GLOBAL_AVERAGE_MONTHLY_KG,
    indiaAverage:  INDIA_AVERAGE_MONTHLY_KG,
    diff,
    percent: percent.toFixed(1),
    status: diff > 0 ? 'above' : 'below',
    isAboveAverage: diff > 0,
  }
}

/**
 * Get available subcategories for a category
 * @param {string} category
 * @returns {string[]}
 */
export function getSubcategories(category) {
  return Object.keys(FACTORS[category] || {})
}

/**
 * Get display label for subcategory
 * @param {string} category
 * @param {string} subcategory
 * @returns {string}
 */
export function getSubcategoryLabel(category, subcategory) {
  return LABELS[category]?.[subcategory] || subcategory.replace(/_/g, ' ')
}