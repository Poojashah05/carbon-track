/**
 * @file ActivityForm.jsx
 * @description Log activity form with tab navigation, validation, and live emission preview.
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Car, Utensils, Zap, ShoppingBag } from 'lucide-react';
import { FACTORS, calculateEmission } from '../utils/emissionFactors';
import { formatCO2 } from '../utils/formatters';
import { sanitizeString, toSafeNumber } from '../utils/sanitize';

const TABS = [
  { id: 'transport', label: 'Transport', Icon: Car },
  { id: 'food',      label: 'Food',      Icon: Utensils },
  { id: 'energy',    label: 'Energy',    Icon: Zap },
  { id: 'shopping',  label: 'Shopping',  Icon: ShoppingBag },
];

const SUBCATEGORY_LABELS = {
  transport: {
    car_petrol:           'Car (Petrol)',
    car_diesel:           'Car (Diesel)',
    car_electric:         'Car (Electric)',
    bus:                  'Bus',
    train:                'Train',
    metro:                'Metro',
    auto_rickshaw:        'Auto Rickshaw',
    two_wheeler_petrol:   '2-Wheeler (Petrol)',
    two_wheeler_electric: '2-Wheeler (Electric)',
    flight_domestic:      'Flight (Domestic)',
    flight_international: 'Flight (International)',
    bicycle:              'Bicycle',
    walking:              'Walking',
  },
  food: {
    mutton:    'Mutton',
    chicken:   'Chicken',
    fish:      'Fish',
    paneer:    'Paneer',
    egg:       'Egg',
    dal:       'Dal',
    rice_meal: 'Rice Meal',
    veg_thali: 'Veg Thali',
    vegan:     'Vegan Meal',
  },
  energy: {
    electricity_india:  'Electricity (India Grid)',
    electricity_solar:  'Electricity (Solar)',
    natural_gas:        'Natural Gas (PNG)',
    lpg:                'LPG Cooking Gas',
    kerosene:           'Kerosene',
  },
  shopping: {
    clothing_item:      'Clothing Item',
    electronics_small:  'Electronics (Small)',
    electronics_large:  'Electronics (Large)',
    online_delivery:    'Online Delivery',
  },
};

const QUANTITY_LABELS = {
  transport: 'Distance (km)',
  food:      'Number of meals',
  energy:    'Units (kWh or litres)',
  shopping:  'Number of items',
};

const DEFAULT_STATE = {
  subcategory: '',
  quantity: '',
  note: '',
};

/**
 * Multi-tab activity logging form with live emission preview.
 * @param {Object} props
 * @param {function(Object): Promise<void>} props.onSubmit - Called with validated log data.
 * @param {boolean} [props.isSubmitting=false] - Disables form during async submit.
 * @returns {JSX.Element}
 */
export default function ActivityForm({ onSubmit, isSubmitting = false }) {
  const [activeTab, setActiveTab] = useState('transport');
  const [form, setForm] = useState(DEFAULT_STATE);
  const [errors, setErrors] = useState({});

  // First subcategory of active tab as default
  const firstSub = Object.keys(SUBCATEGORY_LABELS[activeTab])[0];
  const subcategory = form.subcategory || firstSub;
  const quantity = toSafeNumber(form.quantity);
  const previewKg = calculateEmission(activeTab, subcategory, quantity);

  const switchTab = useCallback((tabId) => {
    setActiveTab(tabId);
    setForm(DEFAULT_STATE);
    setErrors({});
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.subcategory && !firstSub) errs.subcategory = 'Please select a type.';
    if (!form.quantity || toSafeNumber(form.quantity) <= 0)
      errs.quantity = 'Enter a valid quantity greater than 0.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    await onSubmit({
      category: activeTab,
      subcategory: form.subcategory || firstSub,
      quantity: toSafeNumber(form.quantity),
      kg_co2: previewKg,
      note: sanitizeString(form.note),
      logged_at: new Date().toISOString(),
    });
    setForm(DEFAULT_STATE);
    setErrors({});
  };

  return (
    <div className="card overflow-hidden">
      {/* Tab Row */}
      <div className="flex border-b border-border" role="tablist">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => switchTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium
                        transition-colors duration-150 border-b-2
                        ${activeTab === id
                          ? 'border-forest text-forest bg-light-green/30'
                          : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-surface-1'
                        }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
        {/* Subcategory Select */}
        <div>
          <label htmlFor="subcategory-select" className="form-label">
            {TABS.find((t) => t.id === activeTab)?.label} Type
          </label>
          <select
            id="subcategory-select"
            className="form-select"
            value={form.subcategory || firstSub}
            onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))}
          >
            {Object.entries(SUBCATEGORY_LABELS[activeTab]).map(([key, lbl]) => (
              <option key={key} value={key}>{lbl}</option>
            ))}
          </select>
          {errors.subcategory && (
            <p className="text-xs text-danger mt-1">{errors.subcategory}</p>
          )}
        </div>

        {/* Quantity Input */}
        <div>
          <label htmlFor="quantity-input" className="form-label">
            {QUANTITY_LABELS[activeTab]}
          </label>
          <input
            id="quantity-input"
            type="number"
            min="0"
            step="any"
            className="form-input"
            placeholder="0"
            value={form.quantity}
            onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
          />
          {errors.quantity && (
            <p className="text-xs text-danger mt-1">{errors.quantity}</p>
          )}
        </div>

        {/* Optional Note */}
        <div>
          <label htmlFor="note-input" className="form-label">Note (optional)</label>
          <input
            id="note-input"
            type="text"
            className="form-input"
            placeholder="e.g. commute to office"
            maxLength={120}
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          />
        </div>

        {/* Live preview */}
        {quantity > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-light-green/30 border border-mint/30 rounded text-sm animate-fade-in">
            <span className="text-text-secondary font-medium">Estimated emission</span>
            <span className="font-semibold text-forest tabular-nums">{formatCO2(previewKg)}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary w-full justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving…' : 'Log Activity'}
        </button>
      </form>
    </div>
  );
}

ActivityForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};
