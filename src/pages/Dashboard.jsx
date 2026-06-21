import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEmissions } from '../hooks/useEmissions'
import EmissionGauge from '../components/EmissionGauge'
import CategoryBreakdown from '../components/CategoryBreakdown'
import { formatCO2, formatDate } from '../utils/formatters'
import { compareToGlobalAverage } from '../utils/emissionFactors'
import { PlusCircle, Clock } from 'lucide-react'

const CATEGORY_COLORS = {
  transport: '#2d6a4f',
  food: '#52b788',
  energy: '#a8d8a8',
  shopping: '#1a1a1a',
}

// No props — reads state via hooks/context
export default function Dashboard() {
  const { totalMonthlyEmission, categoryBreakdown, userProfile, isLoading, logs } = useEmissions()
  const [countUp, setCountUp] = useState(0)

  const comparison = compareToGlobalAverage(totalMonthlyEmission)
  const recentLogs = logs.slice(0, 5)

  // Animated count-up
  useEffect(() => {
    if (isLoading) return
    const target = totalMonthlyEmission
    const duration = 1200
    const startTime = performance.now()

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCountUp(target * ease)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [totalMonthlyEmission, isLoading])

  const maxBar = Math.max(totalMonthlyEmission, 391.67, 1)
  const comparisonBars = [
    { label: 'You', value: totalMonthlyEmission, color: comparison.isAboveAverage ? '#dc2626' : '#2d6a4f' },
    { label: 'India avg', value: 230, color: '#52b788' },
    { label: 'Global avg', value: 391.67, color: '#94a3b8' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">
            {userProfile ? `Welcome, ${userProfile.name}` : 'Your Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <Link
          to="/log-activity"
          className="flex items-center gap-2 bg-green-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-med transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark"
        >
          <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
          Log Activity
        </Link>
      </div>

      {/* Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Emissions Hero (Gauge and Comparison side-by-side on tablet/desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gauge */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center">
              <h2 className="text-sm font-medium text-gray-500 mb-1 self-start">Monthly CO₂</h2>
              <div className="text-4xl font-semibold text-charcoal mt-2">
                {isLoading ? '—' : formatCO2(countUp)}
              </div>
              <span
                className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                  comparison.isAboveAverage
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-light text-green-dark border border-green-med/40'
                }`}
              >
                {comparison.isAboveAverage ? '▲' : '▼'} {comparison.percent}% {comparison.status} global avg
              </span>
              <div className="w-full mt-6">
                <EmissionGauge
                  totalKg={totalMonthlyEmission}
                  status={comparison.status}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Comparison bar */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-4">Comparison</h2>
                <div className="space-y-5">
                  {comparisonBars.map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm text-charcoal">{item.label}</span>
                        <span className="text-sm font-medium" style={{ color: item.color }}>
                          {formatCO2(item.value)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${(item.value / maxBar) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difference row */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500">vs. global average</span>
                <span className={`font-medium ${comparison.isAboveAverage ? 'text-red-600' : 'text-green-dark'}`}>
                  {comparison.isAboveAverage ? '+' : '−'}{formatCO2(Math.abs(comparison.diff))} {comparison.status}
                </span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <CategoryBreakdown breakdown={categoryBreakdown} />
        </div>

        {/* Sidebar Column (1/3 width) */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500">Recent Activity</h2>
              <Clock className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
            </div>

            {recentLogs.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[log.category] || '#94a3b8' }}
                      />
                      <div>
                        <span className="text-sm font-medium text-charcoal capitalize">{log.category}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {log.subcategory?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-charcoal">{formatCO2(log.co2Kg)}</div>
                      <div className="text-xs text-gray-400">{formatDate(log.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">
                No activities logged yet
              </div>
            )}
          </div>

          {/* CTA Card */}
          <div className="bg-green-dark rounded-lg p-5 text-white flex flex-col justify-between min-h-[180px]">
            <div>
              <h3 className="font-semibold text-lg mb-2">Log Today's Activity</h3>
              <p className="text-green-light/80 text-sm leading-relaxed">
                Track what you eat, how you travel, and your energy use to get accurate insights.
              </p>
            </div>
            <Link
              to="/log-activity"
              className="mt-4 flex items-center gap-2 bg-white text-green-dark px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white self-start"
            >
              <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
              Add Activity
            </Link>
          </div>

          {/* Onboarding CTA if no profile */}
          {!isLoading && !userProfile && (
            <div className="border border-green-med/30 bg-green-light/20 rounded-lg p-5">
              <h3 className="font-medium text-green-dark mb-1">Complete your profile</h3>
              <p className="text-sm text-gray-600 mb-3">
                Set up your profile to get personalized insights and track your baseline emissions.
              </p>
              <Link
                to="/onboarding"
                className="text-sm font-medium text-green-dark border border-green-dark px-3 py-1.5 rounded hover:bg-green-dark hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark"
              >
                Get started →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}