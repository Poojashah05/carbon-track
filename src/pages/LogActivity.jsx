import { useState } from 'react'
import { useEmissions } from '../hooks/useEmissions'
import { calculateEmission, getSubcategories, getSubcategoryLabel } from '../utils/emissionFactors'
import { getTransportModeLabel, getDietLabel, getEnergySourceLabel } from '../utils/formatters'
import { formatCO2 } from '../utils/formatters'
import { Car, Utensils, Zap, ShoppingBag } from 'lucide-react'

const TABS = [
  { key: 'transport', label: 'Transport', icon: Car },
  { key: 'food', label: 'Food', icon: Utensils },
  { key: 'energy', label: 'Energy', icon: Zap },
  { key: 'shopping', label: 'Shopping', icon: ShoppingBag },
]

const QUANTITY_LABELS = {
  transport: 'Distance (km)',
  food: 'Number of servings',
  energy: 'Quantity (kWh / m³ / L)',
  shopping: 'Number of items',
}

const inputClass = (hasError) =>
  `w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-dark focus:border-transparent transition-colors ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
  }`

function getSubcategoryLabel2(category, sub) {
  switch (category) {
    case 'transport': return getTransportModeLabel(sub)
    case 'food': return getDietLabel(sub)
    case 'energy': return getEnergySourceLabel(sub)
    default: return getSubcategoryLabel(category, sub)
  }
}

// No props — reads state via hooks/context
export default function LogActivity() {
  const { logs, addLog } = useEmissions()
  const [activeTab, setActiveTab] = useState('transport')
  const [form, setForm] = useState({
    subcategory: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)

  const subcategories = getSubcategories(activeTab)

  const todayLogs = logs.filter((l) => {
    const today = new Date().toISOString().split('T')[0]
    return l.date?.split('T')[0] === today
  })
  const todayTotal = todayLogs.reduce((sum, l) => sum + (l.co2Kg || 0), 0)

  const resetForm = () => {
    setForm({ subcategory: '', quantity: '', date: new Date().toISOString().split('T')[0] })
    setErrors({})
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    resetForm()
  }

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.subcategory) newErrors.subcategory = 'Please select an option'
    if (!form.quantity || Number.parseFloat(form.quantity) <= 0) newErrors.quantity = 'Please enter a valid quantity'
    if (!form.date) newErrors.date = 'Please select a date'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const co2Kg = calculateEmission(activeTab, form.subcategory, form.quantity)

    addLog({
      category: activeTab,
      subcategory: form.subcategory,
      quantity: Number.parseFloat(form.quantity),
      date: form.date,
      co2Kg,
    })

    resetForm()

    setToast(`Logged ${formatCO2(co2Kg)} CO₂`)
    setTimeout(() => setToast(null), 3000)
  }

  const estimatedCO2 = form.subcategory && form.quantity
    ? calculateEmission(activeTab, form.subcategory, form.quantity)
    : null

  const recentLogs = logs.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Log Activity</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your daily carbon footprint</p>
        </div>
        <div className="text-right lg:hidden">
          <div className="text-xs text-gray-500">Today's total</div>
          <div className="text-lg font-semibold text-green-dark">{formatCO2(todayTotal)}</div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column: Tab Form (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Tab Row */}
            <div className="flex border-b border-gray-200" role="tablist" aria-label="Activity categories">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`tab-${key}`}
                  aria-selected={activeTab === key}
                  aria-controls={`panel-${key}`}
                  onClick={() => handleTabChange(key)}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm font-medium transition-colors border-b-2 ${
                    activeTab === key
                      ? 'text-green-dark border-green-dark bg-green-light/20'
                      : 'text-gray-500 border-transparent hover:text-green-dark'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  {label}
                </button>
              ))}
            </div>

            {/* Form */}
            <div
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="p-5 sm:p-6"
            >
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`subcategory-${activeTab}`} className="block text-sm font-medium text-charcoal mb-1.5">
                      {activeTab === 'transport' ? 'Mode' : activeTab === 'food' ? 'Meal Type' : activeTab === 'energy' ? 'Energy Type' : 'Item Category'}
                    </label>
                    <select
                      id={`subcategory-${activeTab}`}
                      value={form.subcategory}
                      onChange={(e) => handleFieldChange('subcategory', e.target.value)}
                      className={inputClass(errors.subcategory)}
                    >
                      <option value="">Select an option</option>
                      {subcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {getSubcategoryLabel2(activeTab, sub)}
                        </option>
                      ))}
                    </select>
                    {errors.subcategory && <p className="text-red-600 text-xs mt-1">{errors.subcategory}</p>}
                  </div>

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-charcoal mb-1.5">
                      {QUANTITY_LABELS[activeTab]}
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      value={form.quantity}
                      onChange={(e) => handleFieldChange('quantity', e.target.value)}
                      className={inputClass(errors.quantity)}
                      placeholder="Enter amount"
                      min="0"
                      step="0.1"
                    />
                    {errors.quantity && <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>}
                  </div>
                </div>

                <div className="sm:max-w-xs">
                  <label htmlFor="date" className="block text-sm font-medium text-charcoal mb-1.5">
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    className={inputClass(errors.date)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date}</p>}
                </div>

                {/* Live preview */}
                {estimatedCO2 !== null && (
                  <div className="flex items-center gap-2 bg-green-light/30 border border-green-med/30 rounded-lg px-4 py-3">
                    <span className="text-sm text-gray-600">Estimated CO₂:</span>
                    <span className="text-sm font-semibold text-green-dark">{formatCO2(estimatedCO2)}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-green-dark text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-green-med transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark"
                >
                  Log Activity
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Summary & History (1/3 width) */}
        <div className="space-y-6">
          {/* Today's footprint card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Today's Footprint</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-green-dark">{formatCO2(todayTotal)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Total carbon emissions logged today. Keep logging to get precise AI recommendations.
            </p>
          </div>

          {/* Recent Logs */}
          {recentLogs.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500 mb-4">Recent Activities</h2>
              <div className="divide-y divide-gray-100">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-3">
                    <div className="text-sm text-charcoal">
                      <span className="font-medium capitalize">{log.category}</span>
                      <span className="text-gray-500 ml-2">{log.subcategory?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-sm font-medium text-charcoal">{formatCO2(log.co2Kg)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 sm:bottom-4 right-4 bg-green-dark text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300"
        >
          <span className="text-green-light">✓</span>
          {toast}
        </div>
      )}
    </div>
  )
}