import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCO2 } from '../utils/formatters'

const COLORS = {
  transport: '#2d6a4f',
  food: '#52b788',
  energy: '#a8d8a8',
  shopping: '#64748b',
}

const CATEGORY_LABELS = {
  transport: 'Transport',
  food: 'Food',
  energy: 'Energy',
  shopping: 'Shopping',
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-xs">
        <div className="font-medium text-charcoal">{d.category || d.name}</div>
        <div className="text-gray-600">{formatCO2(payload[0].value)} · {d.pct}%</div>
      </div>
    )
  }
  return null
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(PropTypes.shape({
    payload: PropTypes.object,
    value: PropTypes.number
  }))
}

/**
 * Category Breakdown Component
 * Displays a visual breakdown of emissions by category (Transport, Food, Energy, Shopping)
 * using Recharts donut and bar charts.
 * 
 * @param {Object} props
 * @param {Object} props.breakdown - Breakdown of emissions by category
 * @returns {JSX.Element}
 */
export default function CategoryBreakdown({ breakdown }) {
  const pieData = useMemo(() =>
    Object.entries(COLORS)
      .map(([key, color]) => ({
        name: CATEGORY_LABELS[key],
        value: Number(breakdown[key]) || 0,
        color,
        pct: breakdown.percentages?.[key] || '0.0',
      }))
      .filter((d) => d.value > 0),
    [breakdown]
  )

  const barData = useMemo(() =>
    Object.entries(COLORS).map(([key, color]) => ({
      category: CATEGORY_LABELS[key],
      value: Number(breakdown[key]) || 0,
      pct: breakdown.percentages?.[key] || '0.0',
      color,
    })),
    [breakdown]
  )

  if (pieData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Category Breakdown</h2>
        <div className="py-8 text-center text-sm text-gray-400">
          Log activities to see your category breakdown.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-medium text-gray-500 mb-4">Category Breakdown</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut chart */}
        <div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-charcoal">{d.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal bar chart */}
        <div>
          <div className="space-y-3">
            {barData.map((d) => (
              <div key={d.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-charcoal">{d.category}</span>
                  <span className="font-medium" style={{ color: d.color }}>{formatCO2(d.value)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${d.pct}%`,
                      backgroundColor: d.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

CategoryBreakdown.propTypes = {
  breakdown: PropTypes.shape({
    transport: PropTypes.number,
    food: PropTypes.number,
    energy: PropTypes.number,
    shopping: PropTypes.number,
    total: PropTypes.number,
    percentages: PropTypes.objectOf(PropTypes.string),
  }).isRequired,
}