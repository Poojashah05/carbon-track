import { renderHook, act } from '@testing-library/react'
import { useEmissions } from '../hooks/useEmissions'
import { useAuth } from '../contexts/AuthContext'

jest.mock('../contexts/AuthContext')
const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ 
    data: { id: 'log-1', category: 'transport', co2_kg: '10.5' }, 
    error: null 
  }),
  then: function(resolve) {
    resolve(this.mockData || { data: [], error: null })
  }
}

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockSupabaseQuery)
  }
}))

describe('useEmissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuth.mockReturnValue({ 
      user: { id: 'user-123' }, 
      profile: { name: 'Test' },
      updateProfile: jest.fn().mockResolvedValue({ error: null })
    })
  })

  it('fetches logs on mount', async () => {
    mockSupabaseQuery.mockData = {
      data: [{ id: 'log-old', category: 'food', co2_kg: '5.2' }],
      error: null
    }

    const { result } = renderHook(() => useEmissions())

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.logs).toHaveLength(1)
    expect(result.current.logs[0].category).toBe('food')
    expect(result.current.logs[0].co2Kg).toBe(5.2)
  })

  it('adds a log', async () => {
    mockSupabaseQuery.mockData = {
      data: [],
      error: null
    }

    const { result } = renderHook(() => useEmissions())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await act(async () => {
      await result.current.addLog({ category: 'transport', subcategory: 'bus', quantity: '10', date: '2026-06-19', co2Kg: 10.5 })
    })

    expect(result.current.logs).toHaveLength(1)
    expect(result.current.logs[0].id).toBe('log-1')
    expect(result.current.logs[0].co2Kg).toBe(10.5)
  })

  it('handles missing user safely', async () => {
    useAuth.mockReturnValue({ user: null, profile: null, updateProfile: jest.fn() })
    const { result } = renderHook(() => useEmissions())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.logs).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('delegates setProfile to updateProfile', async () => {
    mockSupabaseQuery.mockData = { data: [], error: null }
    const { result } = renderHook(() => useEmissions())

    await act(async () => {
      await result.current.setProfile({ location: 'global' })
    })

    const { updateProfile } = useAuth()
    expect(updateProfile).toHaveBeenCalledWith({ location: 'global' })
  })
})
