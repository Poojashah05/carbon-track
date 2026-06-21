import { renderHook, act } from '@testing-library/react'
import { useAIUsage } from '../hooks/useAIUsage'
import { useAuth } from '../contexts/AuthContext'

jest.mock('../contexts/AuthContext')
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { count: 1 }, error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null })
    }))
  }
}))

describe('useAIUsage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuth.mockReturnValue({ user: { id: 'user-123' } })
  })

  it('fetches usage count on mount', async () => {
    const { result } = renderHook(() => useAIUsage())
    
    expect(result.current.loading).toBe(true)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.count).toBe(1)
    expect(result.current.canUse).toBe(true)
    expect(result.current.remaining).toBe(1)
  })

  it('handles missing user safely', async () => {
    useAuth.mockReturnValue({ user: null })
    const { result } = renderHook(() => useAIUsage())
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.count).toBe(0)
    expect(result.current.loading).toBe(false)
  })

  it('increments usage', async () => {
    const { result } = renderHook(() => useAIUsage())
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await act(async () => {
      await result.current.incrementUsage()
    })

    expect(result.current.count).toBe(2)
    expect(result.current.canUse).toBe(false)
    expect(result.current.remaining).toBe(0)
  })
})
