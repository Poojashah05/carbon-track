import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Onboarding from '../pages/Onboarding'
import { useEmissions } from '../hooks/useEmissions'
import { useAuth } from '../contexts/AuthContext'

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}))

jest.mock('../hooks/useEmissions', () => ({
  useEmissions: jest.fn()
}))

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}))

describe('Onboarding Validation', () => {
  const mockSetProfile = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockSetProfile.mockResolvedValue({ error: null })
    useEmissions.mockReturnValue({ setProfile: mockSetProfile })
    useAuth.mockReturnValue({ user: null, profile: null })
  })

  it('validates step 1 before allowing Next', async () => {
    render(<Onboarding />)
    
    const nextBtn = screen.getByRole('button', { name: /Continue/i })
    await userEvent.click(nextBtn)
    
    expect(screen.getByText('Please enter your name')).toBeInTheDocument()
    // Still on step 1 (Personal Info visible)
    expect(screen.getByText('Tell us a bit about yourself')).toBeInTheDocument()
  })

  it('validates step 2 before allowing Next', async () => {
    render(<Onboarding />)
    
    // Fill step 1
    await userEvent.type(screen.getByLabelText(/Full Name/i), 'John Doe')
    const nextBtn = screen.getByRole('button', { name: /Continue/i })
    await userEvent.click(nextBtn)
    
    // Now on step 2
    expect(screen.getByText('Your primary mode of transport and eating habits')).toBeInTheDocument()
    
    // Click Next without filling step 2
    await userEvent.click(screen.getByRole('button', { name: /Continue/i }))
    
    expect(screen.getByText('Please select your primary transport')).toBeInTheDocument()
    expect(screen.getByText('Please enter a valid weekly distance')).toBeInTheDocument()
    expect(screen.getByText('Please select your diet type')).toBeInTheDocument()
  })

  it('validates step 3 and submits correctly shaped data', async () => {
    render(<Onboarding />)
    
    // Step 1
    await userEvent.type(screen.getByLabelText(/Full Name/i), 'John Doe')
    await userEvent.click(screen.getByRole('button', { name: /Continue/i }))
    
    // Step 2
    await userEvent.selectOptions(screen.getByLabelText(/Primary Transport/i), 'car_petrol')
    await userEvent.type(screen.getByLabelText(/Estimated Weekly Distance/i), '50')
    await userEvent.selectOptions(screen.getByLabelText(/Diet Type/i), 'vegan')
    await userEvent.click(screen.getByRole('button', { name: /Continue/i }))
    
    // Step 3
    expect(screen.getByText('Your household energy consumption')).toBeInTheDocument()
    
    // Click Complete without filling step 3
    await userEvent.click(screen.getByRole('button', { name: /Complete Setup/i }))
    expect(screen.getByText('Please select your energy source')).toBeInTheDocument()
    expect(screen.getByText('Please enter a valid monthly electricity usage')).toBeInTheDocument()
    
    // Fill step 3
    await userEvent.selectOptions(screen.getByLabelText(/Primary Energy Source/i), 'electricity_india')
    await userEvent.type(screen.getByLabelText(/Monthly Electricity Usage/i), '150')
    // Household size defaults to 1, no error expected for it if not touched
    
    await userEvent.click(screen.getByRole('button', { name: /Complete Setup/i }))
    
    expect(mockSetProfile).toHaveBeenCalledTimes(1)
    expect(mockSetProfile).toHaveBeenCalledWith({
      name: 'John Doe',
      location: 'india',
      transport: 'car_petrol',
      weekly_km: 50,
      diet: 'vegan',
      energy_source: 'electricity_india',
      electricity_kwh: 150,
      household_size: 1,
      onboarding_done: true,
    })
  })
})
