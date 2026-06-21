/**
 * @file emissionFactors.js
 * @description Emission calculation engine using IPCC AR6 / EPA emission factors.
 *   All functions are pure (no side effects) and fully tested.
 */

import { toSafeNumber } from './sanitize';

/**
 * Emission factors per unit of activity.
 * Transport: kg CO₂ per km
 * Food: kg CO₂ per meal serving (~150g)
 * Energy: kg CO₂ per kWh (electricity) or per litre/m³ (fuels)
 * Shopping: kg CO₂ per item/delivery
 * @type {Object.<string, Object.<string, number>>}
 */
export const FACTORS = {
  transport: {
    car_petrol: 0.192,
    car_diesel: 0.171,
    car_electric: 0.053,
    bus: 0.089,
    train: 0.041,
    metro: 0.045,
    auto_rickshaw: 0.075,
    two_wheeler_petrol: 0.114,
    two_wheeler_electric: 0.035,
    flight_domestic: 0.255,
    flight_international: 0.195,
    bicycle: 0,
    walking: 0,
  },
  food: {
    mutton: 5.84,
    chicken: 0.97,
    fish: 0.87,
    paneer: 2.50,
    egg: 0.50,
    dal: 0.22,
    rice_meal: 0.32,
    veg_thali: 0.44,
    vegan: 0.32,
  },
  energy: {
    electricity_india: 0.82,
    electricity_solar: 0.05,
    natural_gas: 2.04,
    lpg: 1.51,
    kerosene: 2.50,
  },
  shopping: {
    clothing_item: 10.0,
    electronics_small: 50.0,
    electronics_large: 200.0,
    online_delivery: 0.5,
  },
};

/** India monthly average CO₂ in kg */
export const INDIA_MONTHLY_AVG_KG = 230;

/** Global monthly average CO₂ in kg */
export const GLOBAL_MONTHLY_AVG_KG = 391.67;

/**
 * Calculates CO₂ emission for a single activity.
 * @param {string} category - One of: 'transport' | 'food' | 'energy' | 'shopping'.
 * @param {string} subcategory - Key within the category (e.g. 'car_petrol').
 * @param {number} quantity - Amount of activity (km, meals, kWh, or items).
 * @returns {number} CO₂ emission in kilograms, rounded to 4 decimal places.
 */
export function calculateEmission(category, subcategory, quantity) {
  const safeQty = toSafeNumber(quantity);
  const categoryFactors = FACTORS[category];
  if (!categoryFactors) return 0;
  const factor = categoryFactors[subcategory];
  if (factor === undefined || factor === null) return 0;
  return Math.round(factor * safeQty * 10000) / 10000;
}

/**
 * Computes the total CO₂ emissions from an array of activity logs.
 * Gracefully skips malformed entries.
 * @param {Array<{category: string, subcategory: string, quantity: number}>} logs
 *   Array of emission log objects.
 * @returns {number} Total CO₂ in kg, rounded to 2 decimal places.
 */
export function getTotalMonthlyEmission(logs) {
  if (!Array.isArray(logs) || logs.length === 0) return 0;
  const total = logs.reduce((sum, log) => {
    if (!log || typeof log !== 'object') return sum;
    const emission = calculateEmission(log.category, log.subcategory, log.quantity);
    return sum + emission;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Returns a per-category breakdown of emissions with percentages.
 * @param {Array<{category: string, subcategory: string, quantity: number}>} logs
 *   Array of emission log objects.
 * @returns {Array<{category: string, kg: number, percent: number}>}
 *   Array sorted descending by kg, percentages sum to 100 (or 0 if no logs).
 */
export function getCategoryBreakdown(logs) {
  const categories = Object.keys(FACTORS);
  const totals = {};

  categories.forEach((cat) => { totals[cat] = 0; });

  if (!Array.isArray(logs) || logs.length === 0) {
    return categories.map((cat) => ({ category: cat, kg: 0, percent: 0 }));
  }

  logs.forEach((log) => {
    if (!log || !log.category || !Object.prototype.hasOwnProperty.call(totals, log.category)) return;
    totals[log.category] += calculateEmission(log.category, log.subcategory, log.quantity);
  });

  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  return categories
    .map((cat) => ({
      category: cat,
      kg: Math.round(totals[cat] * 100) / 100,
      percent: grandTotal > 0 ? Math.round((totals[cat] / grandTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.kg - a.kg);
}

/**
 * Compares a user's total monthly emission against India and global averages.
 * @param {number} totalKg - User's total monthly CO₂ in kg.
 * @returns {{
 *   indiaAvg: number,
 *   globalAvg: number,
 *   vsIndia: string,
 *   vsGlobal: string,
 *   indiaPercent: number,
 *   globalPercent: number,
 *   status: 'below_india' | 'above_india_below_global' | 'above_global'
 * }} Comparison result object.
 */
export function compareToGlobalAverage(totalKg) {
  const kg = toSafeNumber(totalKg);
  const indiaPercent = Math.round(((kg - INDIA_MONTHLY_AVG_KG) / INDIA_MONTHLY_AVG_KG) * 100);
  const globalPercent = Math.round(((kg - GLOBAL_MONTHLY_AVG_KG) / GLOBAL_MONTHLY_AVG_KG) * 100);

  let status;
  if (kg < INDIA_MONTHLY_AVG_KG) status = 'below_india';
  else if (kg < GLOBAL_MONTHLY_AVG_KG) status = 'above_india_below_global';
  else status = 'above_global';

  return {
    indiaAvg: INDIA_MONTHLY_AVG_KG,
    globalAvg: GLOBAL_MONTHLY_AVG_KG,
    vsIndia: indiaPercent >= 0 ? `+${indiaPercent}%` : `${indiaPercent}%`,
    vsGlobal: globalPercent >= 0 ? `+${globalPercent}%` : `${globalPercent}%`,
    indiaPercent,
    globalPercent,
    status,
  };
}
