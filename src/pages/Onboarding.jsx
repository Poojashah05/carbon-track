/**
 * @file Onboarding.jsx
 * @description 3-step onboarding form with progress indicator and Supabase profiles save.
 */

// No props — reads state via hooks/context

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ChevronRight, ChevronLeft } from 'lucide-react';
import supabase from '../lib/supabaseClient';
import { sanitizeString, toSafeNumber } from '../utils/sanitize';
import logger from '../utils/logger';

const STEPS = ['Personal', 'Transport', 'Energy'];

const TRANSPORT_OPTIONS = [
  { value: 'car_petrol', label: 'Car (Petrol)' },
  { value: 'car_diesel', label: 'Car (Diesel)' },
  { value: 'car_electric', label: 'Car (Electric)' },
  { value: 'two_wheeler_petrol', label: '2-Wheeler (Petrol)' },
  { value: 'two_wheeler_electric', label: '2-Wheeler (Electric)' },
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Train' },
  { value: 'metro', label: 'Metro' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'walking', label: 'Walking' },
];

const DIET_OPTIONS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'veg_thali', label: 'Vegetarian' },
  { value: 'chicken', label: 'Non-Veg (Chicken/Fish)' },
  { value: 'mutton', label: 'Non-Veg (Mutton/Red Meat)' },
];

const ENERGY_OPTIONS = [
  { value: 'electricity_india', label: 'India Grid Electricity' },
  { value: 'electricity_solar', label: 'Solar / Rooftop' },
  { value: 'lpg', label: 'LPG Cooking Gas' },
  { value: 'natural_gas', label: 'Natural Gas (PNG)' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    location: 'India',
    // Step 2
    primary_transport: 'car_petrol',
    weekly_km: '',
    diet_type: 'veg_thali',
    // Step 3
    energy_source: 'electricity_india',
    monthly_kwh: '',
    household_size: '3',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user;
      if (u) {
        setUser(u);
        setFormData((prev) => ({
          ...prev,
          name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? '',
        }));
      }
    });
  }, []);

  const update = (key, value) => setFormData((p) => ({ ...p, [key]: value }));

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!formData.name.trim()) errs.name = 'Name is required.';
    }
    if (step === 1) {
      if (!formData.weekly_km || toSafeNumber(formData.weekly_km) <= 0)
        errs.weekly_km = 'Enter a valid weekly km estimate.';
    }
    if (step === 2) {
      if (!formData.monthly_kwh || toSafeNumber(formData.monthly_kwh) <= 0)
        errs.monthly_kwh = 'Enter a valid monthly electricity usage.';
      if (!formData.household_size || toSafeNumber(formData.household_size) < 1)
        errs.household_size = 'Household size must be at least 1.';
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleBack = () => { setErrors({}); setStep((s) => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsSaving(true);
    try {
      const profile = {
        user_id: user?.id,
        name: sanitizeString(formData.name),
        location: formData.location,
        primary_transport: formData.primary_transport,
        weekly_km: toSafeNumber(formData.weekly_km),
        diet_type: formData.diet_type,
        energy_source: formData.energy_source,
        monthly_kwh: toSafeNumber(formData.monthly_kwh),
        household_size: toSafeNumber(formData.household_size),
        onboarded: true,
      };

      const { error } = await supabase.from('profiles').upsert(profile, { onConflict: 'user_id' });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err) {
      logger.error('Onboarding save failed:', err);
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-forest rounded flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-charcoal">CO2Track</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`step-dot ${i < step ? 'step-dot-done' : i === step ? 'step-dot-active' : 'step-dot-pending'}`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-charcoal font-medium' : 'text-text-muted'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} noValidate>

            {/* ── Step 0: Personal ─────────────────────── */}
            {step === 0 && (
              <section aria-labelledby="step-personal-title" className="space-y-4 animate-fade-in">
                <h1 id="step-personal-title" className="text-xl font-semibold text-charcoal">
                  Welcome! Tell us about yourself
                </h1>
                <p className="text-sm text-text-muted">
                  We use this to personalise your carbon insights.
                </p>

                <div>
                  <label htmlFor="onboard-name" className="form-label">Full Name</label>
                  <input
                    id="onboard-name"
                    type="text"
                    className="form-input"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => update('name', e.target.value)}
                  />
                  {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="onboard-location" className="form-label">Region</label>
                  <select
                    id="onboard-location"
                    className="form-select"
                    value={formData.location}
                    onChange={(e) => update('location', e.target.value)}
                  >
                    <option value="India">India</option>
                    <option value="Global">Global / Other</option>
                  </select>
                </div>
              </section>
            )}

            {/* ── Step 1: Transport ────────────────────── */}
            {step === 1 && (
              <section aria-labelledby="step-transport-title" className="space-y-4 animate-fade-in">
                <h2 id="step-transport-title" className="text-xl font-semibold text-charcoal">
                  How do you get around?
                </h2>

                <div>
                  <label htmlFor="onboard-transport" className="form-label">Primary Transport Mode</label>
                  <select
                    id="onboard-transport"
                    className="form-select"
                    value={formData.primary_transport}
                    onChange={(e) => update('primary_transport', e.target.value)}
                  >
                    {TRANSPORT_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="onboard-km" className="form-label">Weekly km estimate</label>
                  <input
                    id="onboard-km"
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 80"
                    value={formData.weekly_km}
                    onChange={(e) => update('weekly_km', e.target.value)}
                  />
                  {errors.weekly_km && <p className="text-xs text-danger mt-1">{errors.weekly_km}</p>}
                </div>

                <div>
                  <label htmlFor="onboard-diet" className="form-label">Diet Type</label>
                  <select
                    id="onboard-diet"
                    className="form-select"
                    value={formData.diet_type}
                    onChange={(e) => update('diet_type', e.target.value)}
                  >
                    {DIET_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </section>
            )}

            {/* ── Step 2: Energy ───────────────────────── */}
            {step === 2 && (
              <section aria-labelledby="step-energy-title" className="space-y-4 animate-fade-in">
                <h2 id="step-energy-title" className="text-xl font-semibold text-charcoal">
                  Home Energy Usage
                </h2>

                <div>
                  <label htmlFor="onboard-energy" className="form-label">Primary Energy Source</label>
                  <select
                    id="onboard-energy"
                    className="form-select"
                    value={formData.energy_source}
                    onChange={(e) => update('energy_source', e.target.value)}
                  >
                    {ENERGY_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="onboard-kwh" className="form-label">Avg Monthly Electricity (kWh)</label>
                  <input
                    id="onboard-kwh"
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 200"
                    value={formData.monthly_kwh}
                    onChange={(e) => update('monthly_kwh', e.target.value)}
                  />
                  {errors.monthly_kwh && <p className="text-xs text-danger mt-1">{errors.monthly_kwh}</p>}
                </div>

                <div>
                  <label htmlFor="onboard-household" className="form-label">Household Size (people)</label>
                  <input
                    id="onboard-household"
                    type="number"
                    min="1"
                    max="20"
                    className="form-input"
                    placeholder="e.g. 3"
                    value={formData.household_size}
                    onChange={(e) => update('household_size', e.target.value)}
                  />
                  {errors.household_size && <p className="text-xs text-danger mt-1">{errors.household_size}</p>}
                </div>

                {errors.submit && (
                  <p className="text-xs text-danger p-3 bg-red-50 border border-red-200 rounded">
                    {errors.submit}
                  </p>
                )}
              </section>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <button
                type="button"
                className="btn-ghost"
                onClick={handleBack}
                disabled={step === 0}
              >
                <ChevronLeft size={16} />
                Back
              </button>

              {step < STEPS.length - 1 ? (
                <button type="button" className="btn-primary" onClick={handleNext}>
                  Next
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Get Started'}
                  {!isSaving && <ChevronRight size={16} />}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
