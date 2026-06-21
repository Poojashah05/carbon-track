import { formatCO2, formatDate, getDietLabel, getEnergySourceLabel, getTransportModeLabel } from '../utils/formatters'

describe('formatters', () => {
  describe('formatCO2', () => {
    it('formats values under 1000kg to kg', () => {
      expect(formatCO2(150.5)).toBe('150.5 kg CO₂')
      expect(formatCO2(0)).toBe('0.0 kg CO₂')
    })

    it('formats values over 1000kg to tons', () => {
      expect(formatCO2(1500)).toBe('1.50 t CO₂')
    })
  })

  describe('formatDate', () => {
    const mockDate = new Date('2026-06-19T10:00:00Z')
    
    beforeAll(() => {
      jest.useFakeTimers()
      jest.setSystemTime(mockDate)
    })
    
    afterAll(() => {
      jest.useRealTimers()
    })

    it('formats today', () => {
      expect(formatDate('2026-06-19T05:00:00Z')).toBe('Today')
    })

    it('formats yesterday', () => {
      expect(formatDate('2026-06-18T10:00:00Z')).toBe('Yesterday')
    })

    it('formats recent days', () => {
      expect(formatDate('2026-06-15T10:00:00Z')).toBe('4 days ago')
    })

    it('formats older dates', () => {
      expect(formatDate('2026-05-19T10:00:00Z')).toBe('19 May')
    })

    it('formats older dates from different year', () => {
      expect(formatDate('2025-06-19T10:00:00Z')).toBe('19 Jun 2025')
    })
  })

  describe('label formatters', () => {
    it('returns proper diet label', () => {
      expect(getDietLabel('mutton')).toBe('Mutton / Lamb')
      expect(getDietLabel('unknown_diet')).toBe('unknown_diet')
    })

    it('returns proper energy source label', () => {
      expect(getEnergySourceLabel('natural_gas')).toBe('Natural Gas (PNG)')
      expect(getEnergySourceLabel('unknown')).toBe('unknown')
    })

    it('returns proper transport mode label', () => {
      expect(getTransportModeLabel('bus')).toBe('Bus')
      expect(getTransportModeLabel('spaceship')).toBe('spaceship')
    })
  })
})
