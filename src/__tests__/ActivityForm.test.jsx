import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActivityForm from '../components/ActivityForm'
import { calculateEmission } from '../utils/emissionFactors'

jest.mock('../utils/emissionFactors', () => ({
  ...jest.requireActual('../utils/emissionFactors'),
  calculateEmission: jest.fn(),
  getSubcategories: jest.fn(() => ['car_petrol', 'car_diesel']),
}))

describe('ActivityForm Validation', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    calculateEmission.mockReturnValue(10.5)
  })

  it('rejects submission when required fields are empty', async () => {
    render(<ActivityForm onSubmit={mockOnSubmit} />)
    const submitBtn = screen.getByRole('button', { name: /Log Activity/i })
    
    await userEvent.click(submitBtn)
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Please select a category')).toBeInTheDocument()
    expect(screen.getByText('Please select an option')).toBeInTheDocument()
    expect(screen.getByText('Please enter a valid quantity')).toBeInTheDocument()
  })

  it('rejects submission with a negative number in quantity field', async () => {
    render(<ActivityForm onSubmit={mockOnSubmit} />)
    
    await userEvent.selectOptions(screen.getByLabelText(/Category/i), 'transport')
    await userEvent.selectOptions(screen.getByLabelText(/Select Transport/i), 'car_petrol')
    
    const quantityInput = screen.getByLabelText(/Quantity/i)
    await userEvent.type(quantityInput, '-5')
    
    const submitBtn = screen.getByRole('button', { name: /Log Activity/i })
    fireEvent.submit(submitBtn)
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Please enter a valid quantity')).toBeInTheDocument()
  })

  it('rejects submission with non-numeric text in quantity field', async () => {
    render(<ActivityForm onSubmit={mockOnSubmit} />)
    
    await userEvent.selectOptions(screen.getByLabelText(/Category/i), 'transport')
    await userEvent.selectOptions(screen.getByLabelText(/Select Transport/i), 'car_petrol')
    
    const quantityInput = screen.getByLabelText(/Quantity/i)
    // typing non-numeric in a type="number" input doesn't register a value usually, but let's test it
    fireEvent.change(quantityInput, { target: { value: 'abc' } })
    
    const submitBtn = screen.getByRole('button', { name: /Log Activity/i })
    fireEvent.submit(submitBtn)
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Please enter a valid quantity')).toBeInTheDocument()
  })

  it('calls submit handler correctly when form is valid', async () => {
    render(<ActivityForm onSubmit={mockOnSubmit} />)
    
    await userEvent.selectOptions(screen.getByLabelText(/Category/i), 'transport')
    await userEvent.selectOptions(screen.getByLabelText(/Select Transport/i), 'car_petrol')
    
    const quantityInput = screen.getByLabelText(/Quantity/i)
    await userEvent.type(quantityInput, '100')
    
    const submitBtn = screen.getByRole('button', { name: /Log Activity/i })
    await userEvent.click(submitBtn)
    
    expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      category: 'transport',
      subcategory: 'car_petrol',
      quantity: '100',
      co2Kg: 10.5
    }))
  })
})
