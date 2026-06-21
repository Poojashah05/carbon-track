/**
 * @file Profile.jsx
 * @description Profile page — 3-column layout with preference forms (left 2/3)
 *   and Carbon Baseline Guide (right 1/3).
 */

// No props — reads state via hooks/context

import { useState, useEffect } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import supabase from '../lib/supabaseClient';
import { sanitizeString, toSafeNumber } from '../utils/sanitize';
import logger from '../utils/logger';

const TRANSPORT_OPTIONS = [
  { value: 'car_petrol',           label: 'Car (Petrol)' },
  { value: 'car_diesel',           label: 'Car (Diesel)' },
  { value: 'car_electric',         label: 'Car (Electric)' },
  { value: 'two_wheeler_petrol',   label: '2-Wheeler (Petrol)' },
  { value: 'two_wheeler_electric', label: '2-Wheeler (Electric)' },
  { value: 'bus',                  label: 'Bus' },
  { value: 'train',                label: 'Train' },
  { value: 'metro',                label: 'Metro' },
  { value: 'bicycle',              label: 'Bicycle' },
  { value: 'walking',              label: 'Walking' },
];

const ENERGY_OPTIONS = [
  { value: 'electricity_india',  label: 'India Grid Electricity' },
  { value: 'electricity_solar',  label: 'Solar / Rooftop' },
  { value: 'lpg',                label: 'LPG Cooking Gas' },
  { value: 'natural_gas',        label: 'Natural Gas (PNG)' },
];

const BASELINE_FACTS = [
  {
    title: 'India Grid Intensity',
    detail: '0.82 kg CO₂ per kWh — one of the highest globally due to coal dependency.',
  },
  {
    title: 'Solar Footprint',
    detail: '0.05 kg CO₂/kWh — 94% lower than India grid. Rooftop solar is the highest-impact action.',
  },
  {
    title: 'Dairy & Protein',
    detail: 'Paneer emits ~2.5× more CO₂ than plant proteins (dal) and 5.8× more than a vegan meal.',
  },
  {
    title: 'Transport Hierarchy',
    detail: 'Walking (0) → Metro (0.045) → Bus (0.089) → EV (0.053) → Petrol car (0.192 kg/km).',
  },
  {
    title: 'Flight Emissions',
    detail: 'A single 1000 km domestic flight emits ~255 kg CO₂ — more than a month of vegetarian meals.',
  },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    location: 'India',
    primary_transport: 'car_petrol',
    weekly_km: '',
    diet_type: 'veg_thali',
    energy_source: 'electricity_india',
    monthly_kwh: '',
    household_size: '3',
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user;
      if (!u) return;
      setUser(u);

      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', u.id)
          .maybeSingle();

        if (data) {
          setForm({
            name: data.name ?? '',
            location: data.location ?? 'India',
            primary_transport: data.primary_transport ?? 'car_petrol',
            weekly_km: String(data.weekly_km ?? ''),
            diet_type: data.diet_type ?? 'veg_thali',
            energy_source: data.energy_source ?? 'electricity_india',
            monthly_kwh: String(data.monthly_kwh ?? ''),
            household_size: String(data.household_size ?? '3'),
          });
        }
      } catch (err) {
        logger.error('Profile load failed:', err);
      }
    });
  }, []);

  const update = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (toSafeNumber(form.weekly_km) <= 0) errs.weekly_km = 'Enter a valid weekly km.';
    if (toSafeNumber(form.monthly_kwh) <= 0) errs.monthly_kwh = 'Enter a valid monthly kWh.';
    if (toSafeNumber(form.household_size) < 1) errs.household_size = 'At least 1 person.';
    return errs;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsSaving(true);
    setErrors({});
    try {
      await supabase.from('profiles').upsert({
        user_id: user?.id,
        name: sanitizeString(form.name),
        location: form.location,
        primary_transport: form.primary_transport,
        weekly_km: toSafeNumber(form.weekly_km),
        diet_type: form.diet_type,
        energy_source: form.energy_source,
        monthly_kwh: toSafeNumber(form.monthly_kwh),
        household_size: toSafeNumber(form.household_size),
        onboarded: true,
      }, { onConflict: 'user_id' });
      setSaved(true);
    } catch (err) {
      logger.error('Profile save failed:', err);
      setErrors({ submit: 'Failed to save. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // eslint-disable-next-line react/prop-types
  const Field = ({ id, label, type = 'text', children, error, ...rest }) => (
    <div>
      <label htmlFor={id} className="form-label">{label}</label>
      {children ?? <input id={id} type={type} className="form-input" {...rest} />}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="page-container">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Profile</h1>
        <p className="text-sm text-text-muted mt-1">
          {user?.email ?? 'Manage your baseline preferences.'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left 2/3: Preference Forms ─────────────────── */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} noValidate className="space-y-6">

            {/* Personal */}
            <section className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-charcoal">Personal</h2>

              <Field
                id="profile-name"
                label="Full Name"
                error={errors.name}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Your name"
              />

              <div>
                <label htmlFor="profile-location" className="form-label">Region</label>
                <select
                  id="profile-location"
                  className="form-select"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                >
                  <option value="India">India</option>
                  <option value="Global">Global / Other</option>
                </select>
              </div>
            </section>

            {/* Transport */}
            <section className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-charcoal">Transport</h2>

              <div>
                <label htmlFor="profile-transport" className="form-label">Primary Mode</label>
                <select
                  id="profile-transport"
                  className="form-select"
                  value={form.primary_transport}
                  onChange={(e) => update('primary_transport', e.target.value)}
                >
                  {TRANSPORT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <Field
                id="profile-km"
                label="Weekly km estimate"
                type="number"
                error={errors.weekly_km}
                value={form.weekly_km}
                onChange={(e) => update('weekly_km', e.target.value)}
                placeholder="e.g. 80"
                min="0"
              />
            </section>

            {/* Energy */}
            <section className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-charcoal">Home Energy</h2>

              <div>
                <label htmlFor="profile-energy" className="form-label">Primary Source</label>
                <select
                  id="profile-energy"
                  className="form-select"
                  value={form.energy_source}
                  onChange={(e) => update('energy_source', e.target.value)}
                >
                  {ENERGY_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <Field
                id="profile-kwh"
                label="Monthly electricity (kWh)"
                type="number"
                error={errors.monthly_kwh}
                value={form.monthly_kwh}
                onChange={(e) => update('monthly_kwh', e.target.value)}
                placeholder="e.g. 200"
                min="0"
              />

              <Field
                id="profile-household"
                label="Household size (people)"
                type="number"
                error={errors.household_size}
                value={form.household_size}
                onChange={(e) => update('household_size', e.target.value)}
                placeholder="e.g. 3"
                min="1"
                max="20"
              />
            </section>

            {errors.submit && (
              <p className="text-xs text-danger p-3 bg-red-50 border border-red-200 rounded">
                {errors.submit}
              </p>
            )}

            <button type="submit" className="btn-primary w-full justify-center" disabled={isSaving}>
              {saved
                ? <><CheckCircle2 size={16} /> Saved</>
                : isSaving
                  ? 'Saving…'
                  : <><Save size={16} /> Save Changes</>
              }
            </button>
          </form>
        </div>

        {/* ── Right 1/3: Carbon Baseline Guide ─────────────── */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-charcoal px-1">Carbon Baseline Guide</h2>
          {BASELINE_FACTS.map(({ title, detail }) => (
            <div key={title} className="card p-4">
              <h3 className="text-xs font-semibold text-mint mb-1">{title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
