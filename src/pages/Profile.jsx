import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Check, AlertCircle } from 'lucide-react'
import { sanitize } from '../utils/sanitize'

const TRANSPORT_MODES = {
  car_petrol: 'Car (Petrol)',
  car_diesel: 'Car (Diesel)',
  car_electric: 'Car (Electric)',
  bus: 'Bus',
  train: 'Train',
  metro: 'Metro',
  auto_rickshaw: 'Auto Rickshaw',
  two_wheeler_petrol: '2-Wheeler (Petrol)',
  two_wheeler_electric: '2-Wheeler (Electric)',
  flight_domestic: 'Flight (Domestic)',
  flight_international: 'Flight (International)',
  bicycle: 'Bicycle',
  walking: 'Walking',
}

const DIETS = {
  mutton: 'Mutton / Lamb',
  chicken: 'Chicken',
  fish: 'Fish / Seafood',
  paneer: 'Paneer / Dairy',
  egg: 'Eggs',
  dal: 'Dal / Pulses',
  rice_meal: 'Rice + Sabzi',
  veg_thali: 'Veg Thali',
  vegan: 'Fully Plant-Based',
}

const ENERGY_SOURCES = {
  electricity_india: 'Electricity (India Grid)',
  electricity_solar: 'Solar (Rooftop)',
  natural_gas: 'Natural Gas (PNG)',
  lpg: 'LPG (Cooking Gas)',
  kerosene: 'Kerosene',
}

const inputClass = (hasError) =>
  `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-dark focus:border-transparent transition-colors ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
  }`

// No props — reads state via hooks/context
export default function Profile() {
  const { profile, updateProfile, loading } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    location: 'india',
    transport: '',
    weeklyKm: '',
    diet: '',
    energySource: '',
    electricityBill: '',
    householdSize: 1,
  })
  const [errors, setErrors] = useState({})
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'success' | 'error'

  // Load current profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        location: profile.location || 'india',
        transport: profile.transport || '',
        weeklyKm: profile.weekly_km !== undefined ? String(profile.weekly_km) : '',
        diet: profile.diet || '',
        energySource: profile.energy_source || '',
        electricityBill: profile.electricity_kwh !== undefined ? String(profile.electricity_kwh) : '',
        householdSize: profile.household_size || 1,
      })
    }
  }, [profile])

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (saveStatus === 'success') setSaveStatus(null)
  }

  const validate = () => {
    const newErrors = {}
    if (!sanitize.name(formData.name)) newErrors.name = 'Please enter your name'
    if (!formData.location) newErrors.location = 'Please select your location'
    if (!formData.transport) newErrors.transport = 'Please select your transport'
    if (!formData.weeklyKm || Number.parseFloat(formData.weeklyKm) < 0)
      newErrors.weeklyKm = 'Please enter a valid distance'
    if (!formData.diet) newErrors.diet = 'Please select your diet'
    if (!formData.energySource) newErrors.energySource = 'Please select your energy source'
    if (!formData.electricityBill || Number.parseFloat(formData.electricityBill) < 0)
      newErrors.electricityBill = 'Please enter a valid usage amount'
    if (!formData.householdSize || Number.parseInt(formData.householdSize) < 1)
      newErrors.householdSize = 'Please enter a valid household size'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaveStatus('saving')
    const updates = {
      name: sanitize.name(formData.name),
      location: formData.location,
      transport: formData.transport,
      weekly_km: Number.parseFloat(formData.weeklyKm),
      diet: formData.diet,
      energy_source: formData.energySource,
      electricity_kwh: Number.parseFloat(formData.electricityBill),
      household_size: Number.parseInt(formData.householdSize),
    }

    const { error } = await updateProfile(updates)
    if (!error) {
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    } else {
      setSaveStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block h-8 w-8 border-2 border-green-dark border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-charcoal">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your personal settings and carbon footprint baseline</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column: Form (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Personal Section */}
              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Personal Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={inputClass(errors.name)}
                      placeholder="Your name"
                    />
                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-charcoal mb-1.5">
                      Location
                    </label>
                    <select
                      id="location"
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      className={inputClass(errors.location)}
                    >
                      <option value="india">India</option>
                      <option value="global">Global / Other</option>
                    </select>
                    {errors.location && <p className="text-red-600 text-xs mt-1">{errors.location}</p>}
                  </div>
                </div>
              </div>

              {/* Transport & Diet Section */}
              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Transport &amp; Diet</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="transport" className="block text-sm font-medium text-charcoal mb-1.5">
                      Primary Transport
                    </label>
                    <select
                      id="transport"
                      value={formData.transport}
                      onChange={(e) => updateField('transport', e.target.value)}
                      className={inputClass(errors.transport)}
                    >
                      <option value="">Select transport</option>
                      {Object.entries(TRANSPORT_MODES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    {errors.transport && <p className="text-red-600 text-xs mt-1">{errors.transport}</p>}
                  </div>

                  <div>
                    <label htmlFor="weeklyKm" className="block text-sm font-medium text-charcoal mb-1.5">
                      Weekly Distance (km)
                    </label>
                    <input
                      id="weeklyKm"
                      type="number"
                      value={formData.weeklyKm}
                      onChange={(e) => updateField('weeklyKm', e.target.value)}
                      className={inputClass(errors.weeklyKm)}
                      placeholder="e.g. 50"
                      min="0"
                    />
                    {errors.weeklyKm && <p className="text-red-600 text-xs mt-1">{errors.weeklyKm}</p>}
                  </div>

                  <div>
                    <label htmlFor="diet" className="block text-sm font-medium text-charcoal mb-1.5">
                      Diet Type
                    </label>
                    <select
                      id="diet"
                      value={formData.diet}
                      onChange={(e) => updateField('diet', e.target.value)}
                      className={inputClass(errors.diet)}
                    >
                      <option value="">Select diet</option>
                      {Object.entries(DIETS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    {errors.diet && <p className="text-red-600 text-xs mt-1">{errors.diet}</p>}
                  </div>
                </div>
              </div>

              {/* Energy Section */}
              <div className="pb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Household &amp; Energy</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="energySource" className="block text-sm font-medium text-charcoal mb-1.5">
                      Primary Energy Source
                    </label>
                    <select
                      id="energySource"
                      value={formData.energySource}
                      onChange={(e) => updateField('energySource', e.target.value)}
                      className={inputClass(errors.energySource)}
                    >
                      <option value="">Select source</option>
                      {Object.entries(ENERGY_SOURCES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    {errors.energySource && <p className="text-red-600 text-xs mt-1">{errors.energySource}</p>}
                  </div>

                  <div>
                    <label htmlFor="electricityBill" className="block text-sm font-medium text-charcoal mb-1.5">
                      Monthly Electricity (kWh)
                    </label>
                    <input
                      id="electricityBill"
                      type="number"
                      value={formData.electricityBill}
                      onChange={(e) => updateField('electricityBill', e.target.value)}
                      className={inputClass(errors.electricityBill)}
                      placeholder="e.g. 200"
                      min="0"
                    />
                    {errors.electricityBill && <p className="text-red-600 text-xs mt-1">{errors.electricityBill}</p>}
                  </div>

                  <div>
                    <label htmlFor="householdSize" className="block text-sm font-medium text-charcoal mb-1.5">
                      Household Size (people)
                    </label>
                    <input
                      id="householdSize"
                      type="number"
                      value={formData.householdSize}
                      onChange={(e) => updateField('householdSize', e.target.value)}
                      className={inputClass(errors.householdSize)}
                      placeholder="e.g. 3"
                      min="1"
                    />
                    {errors.householdSize && <p className="text-red-600 text-xs mt-1">{errors.householdSize}</p>}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                  {saveStatus === 'success' && (
                    <span className="flex items-center gap-1.5 text-sm text-green-dark bg-green-light/40 border border-green-med/20 px-3.5 py-1.5 rounded-lg">
                      <Check className="h-4 w-4" /> Profile updated successfully!
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-lg">
                      <AlertCircle className="h-4 w-4" /> Failed to update profile. Please try again.
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saveStatus === 'saving'}
                  className="w-full sm:w-auto bg-green-dark text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-green-med transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveStatus === 'saving' ? 'Saving changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Column: Educational Baseline Info (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-charcoal mb-4">Baseline Footprint Guide</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-green-dark uppercase tracking-wider mb-1">Location & Grid</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Emissions calculations are localized. For example, India's electrical grid relies heavily on coal, resulting in a higher emission factor (~0.71 kg CO₂/kWh) compared to global averages.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-green-dark uppercase tracking-wider mb-1">Transport Impact</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Petrol and diesel vehicles emit significant greenhouse gases per kilometer. Switching to public transit, electric autos, or walking eliminates or halves your travel footprint.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-green-dark uppercase tracking-wider mb-1">Dietary Footprint</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Animal agriculture contributes heavily to methane and carbon emissions. Shifting meals towards plant-based alternatives (like dal and vegetables) lowers food emissions by 50-90%.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-green-dark uppercase tracking-wider mb-1">Home & Energy</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Electricity is a primary baseline carbon contributor. Installing solar panels or using energy-efficient star-rated appliances helps lower monthly footprint baselines dramatically.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
