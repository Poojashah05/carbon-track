import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmissions } from '../hooks/useEmissions'
import { useAuth } from '../contexts/AuthContext'
import { Check } from 'lucide-react'
import { sanitize } from '../utils/sanitize'

const STEPS = { PERSONAL: 1, TRANSPORT: 2, ENERGY: 3 }

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
  `w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-dark focus:border-transparent transition-colors ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
  }`

// No props — reads state via hooks/context
export default function Onboarding() {
  const { setProfile } = useEmissions()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(STEPS.PERSONAL)
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

  // Pre-populate name from OAuth metadata or profile
  useEffect(() => {
    if (profile?.name && !formData.name) {
      setFormData(prev => ({ ...prev, name: profile.name }))
    } else if (user?.user_metadata?.full_name && !formData.name) {
      setFormData(prev => ({ ...prev, name: user.user_metadata.full_name }))
    } else if (user?.user_metadata?.name && !formData.name) {
      setFormData(prev => ({ ...prev, name: user.user_metadata.name }))
    }
  }, [profile, user, formData.name])

  const update = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validateStep = (step) => {
    const newErrors = {}

    if (step === STEPS.PERSONAL) {
      if (!sanitize.name(formData.name)) newErrors.name = 'Please enter your name'
      if (!formData.location) newErrors.location = 'Please select your location'
    }

    if (step === STEPS.TRANSPORT) {
      if (!formData.transport) newErrors.transport = 'Please select your primary transport'
      if (!formData.weeklyKm || Number.parseFloat(formData.weeklyKm) <= 0)
        newErrors.weeklyKm = 'Please enter a valid weekly distance'
      if (!formData.diet) newErrors.diet = 'Please select your diet type'
    }

    if (step === STEPS.ENERGY) {
      if (!formData.energySource) newErrors.energySource = 'Please select your energy source'
      if (!formData.electricityBill || Number.parseFloat(formData.electricityBill) <= 0)
        newErrors.electricityBill = 'Please enter a valid monthly electricity usage'
      if (!formData.householdSize || Number.parseInt(formData.householdSize) < 1)
        newErrors.householdSize = 'Please enter a valid household size'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === STEPS.ENERGY) {
        handleComplete()
      } else {
        setCurrentStep((prev) => prev + 1)
      }
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
    setErrors({})
  }

  const handleComplete = async () => {
    const profileUpdates = {
      name: sanitize.name(formData.name),
      location: formData.location,
      transport: formData.transport,
      weekly_km: Number.parseFloat(formData.weeklyKm),
      diet: formData.diet,
      energy_source: formData.energySource,
      electricity_kwh: Number.parseFloat(formData.electricityBill),
      household_size: Number.parseInt(formData.householdSize),
      onboarding_done: true,
    }

    const { error } = await setProfile(profileUpdates)
    if (!error) {
      navigate('/', { replace: true })
    } else {
      setErrors({ submit: 'Failed to save profile. Please try again.' })
    }
  }

  const stepTitles = ['Personal Info', 'Transport & Diet', 'Home Energy']
  const stepProgress = ((currentStep - 1) / 3) * 100

  return (
    <div className="min-h-screen bg-offwhite flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-charcoal">CO₂Track</h1>
          <p className="text-sm text-gray-500 mt-1">Set up your profile to get started</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          {errors.submit && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {errors.submit}
            </div>
          )}
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              {stepTitles.map((title, i) => (
                <div
                  key={title}
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    i + 1 < currentStep
                      ? 'text-green-dark'
                      : i + 1 === currentStep
                      ? 'text-charcoal'
                      : 'text-gray-400'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      i + 1 < currentStep
                        ? 'bg-green-dark text-white'
                        : i + 1 === currentStep
                        ? 'bg-charcoal text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {i + 1 < currentStep ? <Check className="h-3 w-3" strokeWidth={2.5} /> : i + 1}
                  </span>
                  <span className="hidden sm:block">{title}</span>
                </div>
              ))}
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-dark transition-all duration-500 ease-out rounded-full"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
          </div>

          {/* Step 1: Personal */}
          {currentStep === STEPS.PERSONAL && (
            <section aria-label="Personal information">
              <h2 className="text-lg font-medium text-charcoal mb-1">Personal Information</h2>
              <p className="text-sm text-gray-500 mb-6">Tell us a bit about yourself</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => update('name', e.target.value)}
                    className={inputClass(errors.name)}
                    placeholder="Your first name"
                    autoComplete="given-name"
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
                    onChange={(e) => update('location', e.target.value)}
                    className={inputClass(errors.location)}
                  >
                    <option value="india">India</option>
                    <option value="global">Global / Other</option>
                  </select>
                  {errors.location && <p className="text-red-600 text-xs mt-1">{errors.location}</p>}
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Transport & Diet */}
          {currentStep === STEPS.TRANSPORT && (
            <section aria-label="Transport and diet information">
              <h2 className="text-lg font-medium text-charcoal mb-1">Transport &amp; Diet</h2>
              <p className="text-sm text-gray-500 mb-6">Your primary mode of transport and eating habits</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="transport" className="block text-sm font-medium text-charcoal mb-1.5">
                    Primary Transport
                  </label>
                  <select
                    id="transport"
                    value={formData.transport}
                    onChange={(e) => update('transport', e.target.value)}
                    className={inputClass(errors.transport)}
                  >
                    <option value="">Select mode of transport</option>
                    {Object.entries(TRANSPORT_MODES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  {errors.transport && <p className="text-red-600 text-xs mt-1">{errors.transport}</p>}
                </div>

                <div>
                  <label htmlFor="weeklyKm" className="block text-sm font-medium text-charcoal mb-1.5">
                    Estimated Weekly Distance (km)
                  </label>
                  <input
                    id="weeklyKm"
                    type="number"
                    value={formData.weeklyKm}
                    onChange={(e) => update('weeklyKm', e.target.value)}
                    className={inputClass(errors.weeklyKm)}
                    placeholder="e.g. 50"
                    min="0"
                    step="1"
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
                    onChange={(e) => update('diet', e.target.value)}
                    className={inputClass(errors.diet)}
                  >
                    <option value="">Select your diet</option>
                    {Object.entries(DIETS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  {errors.diet && <p className="text-red-600 text-xs mt-1">{errors.diet}</p>}
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Energy */}
          {currentStep === STEPS.ENERGY && (
            <section aria-label="Home energy information">
              <h2 className="text-lg font-medium text-charcoal mb-1">Home Energy</h2>
              <p className="text-sm text-gray-500 mb-6">Your household energy consumption</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="energySource" className="block text-sm font-medium text-charcoal mb-1.5">
                    Primary Energy Source
                  </label>
                  <select
                    id="energySource"
                    value={formData.energySource}
                    onChange={(e) => update('energySource', e.target.value)}
                    className={inputClass(errors.energySource)}
                  >
                    <option value="">Select energy source</option>
                    {Object.entries(ENERGY_SOURCES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  {errors.energySource && <p className="text-red-600 text-xs mt-1">{errors.energySource}</p>}
                </div>

                <div>
                  <label htmlFor="electricityBill" className="block text-sm font-medium text-charcoal mb-1.5">
                    Monthly Electricity Usage (kWh)
                  </label>
                  <input
                    id="electricityBill"
                    type="number"
                    value={formData.electricityBill}
                    onChange={(e) => update('electricityBill', e.target.value)}
                    className={inputClass(errors.electricityBill)}
                    placeholder="e.g. 250"
                    min="0"
                    step="1"
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
                    onChange={(e) => update('householdSize', e.target.value)}
                    className={inputClass(errors.householdSize)}
                    placeholder="e.g. 3"
                    min="1"
                    max="20"
                    step="1"
                  />
                  {errors.householdSize && <p className="text-red-600 text-xs mt-1">{errors.householdSize}</p>}
                </div>
              </div>
            </section>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 border border-gray-300 text-charcoal rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-green-dark text-white py-2.5 px-5 rounded-lg text-sm font-medium hover:bg-green-med transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark"
            >
              {currentStep === STEPS.ENERGY ? 'Complete Setup' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}