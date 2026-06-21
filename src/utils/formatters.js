/**
 * Utility functions for formatting data
 * Updated for Indian culture (no beef/pork labels)
 */

/**
 * Format CO₂ amount with appropriate units
 * @param {number} kg - CO₂ in kg
 * @returns {string}
 */
export function formatCO2(kg) {
  const num = Number.parseFloat(kg) || 0
  if (num >= 1000) return `${(num / 1000).toFixed(2)} t CO₂`
  return `${num.toFixed(1)} kg CO₂`
}

/**
 * Format date with relative time
 * @param {string} dateString - ISO date string or YYYY-MM-DD
 * @returns {string}
 */
export function formatDate(dateString) {
  const date = new Date(dateString)
  const now  = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dateStart  = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays   = Math.round((todayStart - dateStart) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return `${diffDays} days ago`
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Get diet label (India-localised — no beef/pork)
 * @param {string} diet
 * @returns {string}
 */
export function getDietLabel(diet) {
  const labels = {
    mutton:    'Mutton / Lamb',
    chicken:   'Chicken',
    fish:      'Fish / Seafood',
    paneer:    'Paneer / Dairy',
    egg:       'Eggs',
    dal:       'Dal / Pulses',
    rice_meal: 'Rice + Sabzi',
    veg_thali: 'Veg Thali',
    vegan:     'Fully Plant-Based',
  }
  return labels[diet] || diet
}

/**
 * Get energy source label (India-localised)
 * @param {string} source
 * @returns {string}
 */
export function getEnergySourceLabel(source) {
  const labels = {
    electricity_india:  'Electricity (India Grid)',
    electricity_solar:  'Solar (Rooftop)',
    natural_gas:        'Natural Gas (PNG)',
    lpg:                'LPG (Cooking Gas)',
    kerosene:           'Kerosene',
  }
  return labels[source] || source
}

/**
 * Get transport mode label (India-localised)
 * @param {string} mode
 * @returns {string}
 */
export function getTransportModeLabel(mode) {
  const labels = {
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
  }
  return labels[mode] || mode
}