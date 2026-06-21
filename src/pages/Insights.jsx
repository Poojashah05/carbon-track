import { useState, useRef, useEffect } from 'react'
import { useEmissions } from '../hooks/useEmissions'
import { useGroqInsights } from '../hooks/useGroqInsights'
import { useAIUsage } from '../hooks/useAIUsage'
import { sanitize } from '../utils/sanitize'
import InsightCard from '../components/InsightCard'
import { formatCO2 } from '../utils/formatters'
import { Sparkles, Send, RefreshCw, AlertCircle, ChevronDown } from 'lucide-react'

const DID_YOU_KNOW = {
  transport: [
    'Switching from a petrol car to public transit for 1 year saves up to 2.4 tonnes of CO₂.',
    'Electric vehicles produce 50-70% less CO₂ over their lifetime than petrol cars (India grid).',
    'Cycling for commutes under 5 km eliminates transport emissions entirely.',
  ],
  food: [
    'Paneer and dairy production has about 2.5× higher emissions than plant proteins like dal.',
    'Eating plant-based 3 days a week can cut your food footprint by nearly 50%.',
    'Seasonal, local produce can have 10× lower emissions than imported equivalents.',
  ],
  energy: [
    'LED bulbs use 75% less energy than incandescent bulbs.',
    'Turning AC from 18°C to 24°C reduces energy use by ~25%.',
    'A 5-star rated appliance uses up to 40% less electricity than a 3-star model.',
  ],
  shopping: [
    'Making one new cotton T-shirt produces 2.1 kg of CO₂.',
    'Second-hand clothing saves 82% of the carbon cost of new garments.',
    'Repairing electronics extends their life and saves 50–200 kg of CO₂ per device.',
  ],
}

function parseInsights(raw) {
  if (!raw) return []
  return raw
    .split(/\n(?=\d+\.)/)
    .map((s) => s.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
}

function formatDateTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// No props — reads state via hooks/context
export default function Insights() {
  const { totalMonthlyEmission, categoryBreakdown, userProfile } = useEmissions()
  const { insights, insightsHistory, isLoading, error, generateInsights, chat, retry } = useGroqInsights()
  const { remaining, canUse, incrementUsage, loading: usageLoading } = useAIUsage()
  const [messageHistory, setMessageHistory] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef(null)
  const chatInputRef = useRef(null)

  const [expandedReportId, setExpandedReportId] = useState(null)
  const prevHistoryLengthRef = useRef(0)

  // Expand the newest report when history loads or a new one is added
  useEffect(() => {
    if (insightsHistory.length > 0) {
      if (insightsHistory.length > prevHistoryLengthRef.current) {
        setExpandedReportId(insightsHistory[0].id)
      }
      prevHistoryLengthRef.current = insightsHistory.length
    }
  }, [insightsHistory])

  // Scroll to bottom of chat on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messageHistory])

  const emissionData = {
    transportKg: categoryBreakdown.transport || 0,
    foodKg: categoryBreakdown.food || 0,
    energyKg: categoryBreakdown.energy || 0,
    shoppingKg: categoryBreakdown.shopping || 0,
    totalKg: categoryBreakdown.total || 0,
    status: categoryBreakdown.status || 'below',
    percent: categoryBreakdown.percent || '0',
  }

  // Find top category for "Did you know?" section
  const topCategory = Object.entries({
    transport: categoryBreakdown.transport || 0,
    food: categoryBreakdown.food || 0,
    energy: categoryBreakdown.energy || 0,
    shopping: categoryBreakdown.shopping || 0,
  }).sort(([, a], [, b]) => b - a)[0][0]

  const didYouKnowFacts = DID_YOU_KNOW[topCategory] || DID_YOU_KNOW.transport

  const handleGetInsights = async () => {
    if (!canUse) return
    await incrementUsage()
    setExpandedReportId('generating') // collapse others while generating new ones
    generateInsights(emissionData)
  }

  const handleSendChat = async () => {
    const text = sanitize.text(chatInput)
    if (!text || isChatLoading) return

    const userMsg = { id: Date.now(), text, sender: 'user', timestamp: new Date().toISOString() }
    const newHistory = [...messageHistory, userMsg].slice(-10)
    setMessageHistory(newHistory)
    setChatInput('')
    setIsChatLoading(true)

    const botText = await chat(text, messageHistory, emissionData)
    setMessageHistory((prev) => [
      ...prev,
      { id: Date.now() + 1, text: botText, sender: 'bot', timestamp: new Date().toISOString() },
    ])
    setIsChatLoading(false)
  }

  const insightsList = parseInsights(insights)

  const statCards = [
    { label: 'Transport', value: categoryBreakdown.transport, color: '#2d6a4f' },
    { label: 'Food', value: categoryBreakdown.food, color: '#52b788' },
    { label: 'Energy', value: categoryBreakdown.energy, color: '#a8d8a8' },
    { label: 'Shopping', value: categoryBreakdown.shopping, color: '#64748b' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-charcoal">AI Insights</h1>
        <p className="text-sm text-gray-500 mt-0.5">Personalized recommendations based on your emissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Profile summary */}
          {userProfile && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-sm font-medium text-gray-500 mb-3">Profile</h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-green-light border border-green-med flex items-center justify-center flex-shrink-0">
                  <span className="text-green-dark font-medium text-sm">
                    {userProfile.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-charcoal text-sm">{userProfile.name}</div>
                  <div className="text-xs text-gray-500">{userProfile.location === 'india' ? 'India' : 'Global'}</div>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Transport</span>
                  <span className="text-charcoal">{userProfile.transport?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Diet</span>
                  <span className="text-charcoal capitalize">{userProfile.diet}</span>
                </div>
              </div>
            </div>
          )}

          {/* Emission stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Monthly Breakdown</h2>
            <div className="space-y-2.5">
              {statCards.map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-charcoal">{stat.label}</span>
                    <span className="font-medium" style={{ color: stat.color }}>{formatCO2(stat.value || 0)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${categoryBreakdown.total > 0 ? ((stat.value || 0) / categoryBreakdown.total) * 100 : 0}%`,
                        backgroundColor: stat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100 flex justify-between text-xs">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold text-charcoal">{formatCO2(totalMonthlyEmission)}</span>
              </div>
            </div>
          </div>

          {/* Did you know? */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Did you know? <span className="text-gray-400 font-normal">({topCategory})</span>
            </h2>
            <div className="space-y-3">
              {didYouKnowFacts.map((fact, i) => (
                <div key={i} className="flex gap-2 text-xs text-charcoal leading-relaxed">
                  <span className="text-green-dark flex-shrink-0 font-bold">—</span>
                  {fact}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Recommendations */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-charcoal flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-dark" strokeWidth={1.5} />
                AI Recommendations
              </h2>
              <button
                onClick={handleGetInsights}
                disabled={isLoading || categoryBreakdown.total === 0 || !canUse || usageLoading}
                className="flex items-center gap-1.5 bg-green-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-med transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><RefreshCw className="h-3 w-3 animate-spin" /> Generating...</>
                ) : !canUse ? (
                  <>Limit Reached</>
                ) : (
                  <>Get AI Insights ({remaining} left)</>
                )}
              </button>
            </div>

            {/* Error state */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-xs text-red-700">{error}</p>
                  <button
                    onClick={retry}
                    className="text-xs font-medium text-red-600 hover:text-red-800 mt-1 focus:outline-none"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Skeleton loader */}
            {isLoading && insightsList.length === 0 && (
              <div className="space-y-3" aria-busy="true" aria-label="Loading insights">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4">
                    <div className="h-3 bg-gray-100 rounded animate-pulse mb-2 w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2 mt-2" />
                  </div>
                ))}
              </div>
            )}

            {/* Streaming Active Insight */}
            {isLoading && insightsList.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-green-dark uppercase tracking-wider mb-3 animate-pulse">Generating New Recommendations...</h3>
                <div className="space-y-3">
                  {insightsList.map((insight, i) => (
                    <InsightCard key={`streaming-${i}`} insight={insight} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* History of AI Insights */}
            {insightsHistory.length > 0 ? (
              <div className="space-y-3">
                {insightsHistory.map((report, rIdx) => {
                  const isExpanded = expandedReportId === report.id
                  const parsed = parseInsights(report.content)
                  return (
                    <div
                      key={report.id || rIdx}
                      className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 shadow-sm"
                    >
                      {/* Accordion Trigger Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left text-xs font-semibold transition-colors focus:outline-none ${
                          isExpanded
                            ? 'bg-green-light/20 text-green-dark border-b border-gray-200'
                            : 'bg-white text-charcoal hover:bg-gray-50'
                        }`}
                        aria-expanded={isExpanded}
                        aria-controls={`report-content-${report.id}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-500">Report generated</span>
                          <span>{formatDateTime(report.created_at)}</span>
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                            isExpanded ? 'transform rotate-180 text-green-dark' : ''
                          }`}
                        />
                      </button>

                      {/* Accordion Content Panel */}
                      {isExpanded && (
                        <div
                          id={`report-content-${report.id}`}
                          className="p-4 bg-white space-y-3"
                        >
                          <div className="space-y-3">
                            {parsed.map((insight, i) => (
                              <InsightCard key={`${report.id || rIdx}-${i}`} insight={insight} index={i} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : !isLoading && !error && (
              <div className="py-8 text-center text-sm text-gray-400">
                {categoryBreakdown.total === 0
                  ? 'Log some activities first to get personalized insights.'
                  : 'Click "Get AI Insights" to receive personalized recommendations.'}
              </div>
            )}
          </div>

          {/* Chat interface */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-medium text-charcoal mb-4">Ask a follow-up question</h2>

            <div
              className="h-52 overflow-y-auto border border-gray-100 rounded-lg p-3 space-y-2 mb-3 scrollbar-thin"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messageHistory.length === 0 && (
                <p className="text-xs text-gray-400 text-center pt-8">
                  Ask anything about your carbon footprint…
                </p>
              )}
              {messageHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs text-xs px-3 py-2 rounded-lg leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-green-dark text-white'
                        : 'bg-gray-100 text-charcoal'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-charcoal text-xs px-3 py-2 rounded-lg">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce delay-0">.</span>
                      <span className="animate-bounce delay-100">.</span>
                      <span className="animate-bounce delay-200">.</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2">
              <label htmlFor="chat-input" className="sr-only">Your message</label>
              <input
                id="chat-input"
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                placeholder="e.g. How can I reduce my transport emissions?"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-dark focus:border-transparent"
                disabled={isChatLoading}
              />
              <button
                type="button"
                onClick={handleSendChat}
                disabled={!sanitize.text(chatInput) || isChatLoading}
                aria-label="Send message"
                className="bg-green-dark text-white px-3 py-2 rounded-lg hover:bg-green-med transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}