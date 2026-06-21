import { renderHook, act } from '@testing-library/react'
import { useGroqInsights } from '../hooks/useGroqInsights'
import { useAuth } from '../contexts/AuthContext'

jest.mock('../contexts/AuthContext')
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: '1', content: 'test' }, error: null })
    }))
  }
}))

global.fetch = jest.fn()

// Polyfill TextEncoder/TextDecoder for jsdom
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

describe('useGroqInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuth.mockReturnValue({ user: { id: 'user-123' } })
    localStorage.clear()
    process.env.VITE_GROQ_API_KEY = 'test-key'
    
    // Mock the body's getReader
    const encoder = new TextEncoder()
    const chunks = [
      encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'),
      encoder.encode('data: {"choices":[{"delta":{"content":" World"}}]}\n\n'),
      encoder.encode('data: [DONE]\n\n')
    ]
    let chunkIndex = 0

    global.fetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: async () => {
            if (chunkIndex < chunks.length) {
              return { done: false, value: chunks[chunkIndex++] }
            }
            return { done: true }
          }
        })
      },
      json: jest.fn().mockResolvedValue({ choices: [{ message: { content: 'chat response' } }] })
    })
  })

  it('transitions from idle -> loading -> success and accumulates state', async () => {
    const { result } = renderHook(() => useGroqInsights())

    const emissionData = {
      transportKg: 10,
      foodKg: 20,
      energyKg: 30,
      shoppingKg: 40,
      totalKg: 100,
      status: 'below',
      percent: '75.0'
    }

    expect(result.current.isLoading).toBe(false)

    let promise;
    act(() => {
      promise = result.current.generateInsights(emissionData)
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      await promise
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.insights).toBe('Hello World')
    expect(result.current.error).toBeNull()
  })

  it('chat function calls API and returns message', async () => {
    const { result } = renderHook(() => useGroqInsights())

    const emissionData = { totalKg: 100 }
    
    let response;
    await act(async () => {
      response = await result.current.chat('Hello', [{ text: 'Hi', sender: 'user' }], emissionData)
    })

    expect(response).toBe('chat response')
    expect(global.fetch).toHaveBeenCalled()
    const requestBody = JSON.parse(global.fetch.mock.calls[global.fetch.mock.calls.length - 1][1].body)
    expect(requestBody.messages).toHaveLength(3) // System, History, User
  })

  it('transitions from idle -> loading -> error when API fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })

    const { result } = renderHook(() => useGroqInsights())

    await act(async () => {
      await result.current.generateInsights({
        transportKg: 0, foodKg: 0, energyKg: 0, shoppingKg: 0, totalKg: 0, status: 'below', percent: '0.0'
      })
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('API request failed: 500 Internal Server Error')
    expect(result.current.insights).toBe('')
  })

  it('interpolates the users exact emission numbers into the system prompt', async () => {
    const { result } = renderHook(() => useGroqInsights())
    
    const emissionData = {
      transportKg: 15.5,
      foodKg: 25.1,
      energyKg: 35.2,
      shoppingKg: 45.3,
      totalKg: 121.1,
      status: 'below',
      percent: '69.0'
    }

    await act(async () => {
      await result.current.generateInsights(emissionData)
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    
    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body)
    const systemPrompt = requestBody.messages.find(m => m.role === 'system').content
    
    expect(systemPrompt).toContain('Transport: 15.5 kg CO₂')
    expect(systemPrompt).toContain('Food: 25.1 kg CO₂')
    expect(systemPrompt).toContain('Home energy: 35.2 kg CO₂')
    expect(systemPrompt).toContain('Shopping: 45.3 kg CO₂')
    expect(systemPrompt).toContain('Total: 121.1 kg CO₂/month')
    expect(systemPrompt).toContain('below average by 69.0%')
  })
})
