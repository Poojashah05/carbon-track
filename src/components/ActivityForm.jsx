import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { calculateEmission, getSubcategories, getSubcategoryLabel } from '../utils/emissionFactors'

const CATEGORIES = {
  transport: 'Transport',
  food: 'Food',
  energy: 'Energy',
  shopping: 'Shopping',
}

/**
 * Activity Form Component
 * Form to log or edit a user activity for carbon footprint tracking
 * 
 * @param {Object} props
 * @param {Function} props.onSubmit - Called when the form is successfully submitted
 * @param {Object} [props.initialData] - Initial form data for editing an existing activity
 * @param {Function} [props.onCancel] - Called when the cancel button is clicked
 * @returns {JSX.Element}
 */
export default function ActivityForm({ onSubmit, initialData = null, onCancel }) {
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
  })

  const [errors, setErrors] = useState({})
  const [availableSubcategories, setAvailableSubcategories] = useState([])

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category || '',
        subcategory: initialData.subcategory || '',
        quantity: initialData.quantity || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
      })
    }
  }, [initialData])

  useEffect(() => {
    if (formData.category) {
      const subcategories = getSubcategories(formData.category)
      setAvailableSubcategories(subcategories)
      if (!subcategories.includes(formData.subcategory)) {
        setFormData(prev => ({ ...prev, subcategory: '' }))
      }
    } else {
      setAvailableSubcategories([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.category])

  const getLabel = (category, subcategory) => {
    return getSubcategoryLabel(category, subcategory)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.category) {
      newErrors.category = 'Please select a category'
    }

    if (!formData.subcategory) {
      newErrors.subcategory = 'Please select an option'
    }

    if (!formData.quantity || Number.parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Please enter a valid quantity'
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) return

    const co2Kg = calculateEmission(formData.category, formData.subcategory, formData.quantity)

    onSubmit({
      ...formData,
      co2Kg,
    })

    if (!initialData) {
      setFormData({
        category: '',
        subcategory: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }

  const getInputProps = (field, type = 'text', placeholder = '') => {
    return {
      id: field,
      type,
      value: formData[field],
      onChange: (e) => setFormData({ ...formData, [field]: e.target.value }),
      className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-dark focus:border-transparent transition-colors\n                    ${errors[field] ? 'border-red-500' : 'border-gray-300'}`,
      placeholder,
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-charcoal mb-2">
            Category
          </label>
          <select {...getInputProps('category')}>
            <option value="">Select a category</option>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
        </div>

        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-charcoal mb-2">
            {formData.category ? `Select ${CATEGORIES[formData.category] || 'option'}` : 'Select option'}
          </label>
          <select {...getInputProps('subcategory')} disabled={!formData.category}>
            <option value="">Select an option</option>
            {availableSubcategories.map((sub) => (
              <option key={sub} value={sub}>{getLabel(formData.category, sub)}</option>
            ))}
          </select>
          {errors.subcategory && <p className="text-red-600 text-sm mt-1">{errors.subcategory}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-charcoal mb-2">
            Quantity
          </label>
          <input
            {...getInputProps('quantity', 'number', formData.subcategory ? `Enter ${formData.subcategory.includes('_') ? formData.subcategory.split('_')[1] : formData.subcategory}` : 'Enter quantity')}
            min="0"
            step="0.1"
          />
          {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-charcoal mb-2">
            Date
          </label>
          <input {...getInputProps('date', 'date')} />
          {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date}</p>}
        </div>
      </div>

      {formData.subcategory && formData.quantity && (
        <div className="bg-green-light/30 rounded-lg p-4">
          <div className="text-sm text-charcoal">
            <span className="font-medium">Estimated CO₂:</span>{' '}
            <span className="text-green-dark font-semibold">
              {calculateEmission(formData.category, formData.subcategory, formData.quantity).toFixed(2)} kg
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 bg-green-dark text-white py-3 px-6 rounded-lg font-medium hover:bg-green-med transition-colors focus:outline-none focus:ring-2 focus:ring-green-dark focus:ring-offset-2"
        >
          {initialData ? 'Update Activity' : 'Log Activity'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-charcoal rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

ActivityForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    category: PropTypes.string,
    subcategory: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.string,
  }),
  onCancel: PropTypes.func,
}