/**
 * @file CategoryBreakdown.jsx
 * @description Donut chart + per-category horizontal bar breakdown of emissions.
 */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import PropTypes from 'prop-types';
import { formatCO2 } from '../utils/formatters';

const CATEGORY_META = {
  transport: { label: 'Transport', color: '#2d6a4f' },
  food:      { label: 'Food',      color: '#52b788' },
  energy:    { label: 'Energy',    color: '#40916c' },
  shopping:  { label: 'Shopping',  color: '#74c69d' },
};

/**
 * @param {{ active: boolean, payload: Array }} props
 */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-border rounded px-3 py-2 text-xs shadow-dropdown">
      <p className="font-medium text-charcoal">{d.name}</p>
      <p className="text-text-muted">{formatCO2(d.value)}</p>
    </div>
  );
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

/**
 * Donut chart and horizontal bar breakdown for emission categories.
 * @param {Object} props
 * @param {Array<{category: string, kg: number, percent: number}>} props.breakdown
 *   Sorted category breakdown from getCategoryBreakdown().
 * @returns {JSX.Element}
 */
export default function CategoryBreakdown({ breakdown }) {
  const chartData = breakdown
    .filter((b) => b.kg > 0)
    .map((b) => ({
      name: CATEGORY_META[b.category]?.label ?? b.category,
      value: b.kg,
      color: CATEGORY_META[b.category]?.color ?? '#52b788',
    }));

  const hasData = chartData.length > 0;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-charcoal mb-4">Category Breakdown</h3>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Donut */}
        <div className="w-40 h-40 shrink-0">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={64}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-full border-8 border-surface-2 flex items-center justify-center">
              <span className="text-xs text-text-muted">No data</span>
            </div>
          )}
        </div>

        {/* Bars */}
        <div className="flex-1 w-full space-y-3">
          {breakdown.map((b) => {
            const meta = CATEGORY_META[b.category];
            return (
              <div key={b.category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-text-secondary">
                    {meta?.label ?? b.category}
                  </span>
                  <span className="text-xs text-text-muted tabular-nums">
                    {formatCO2(b.kg)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${b.percent}%`,
                      backgroundColor: meta?.color ?? '#52b788',
                    }}
                  />
                </div>
              </div>
            );
          })}
          {!hasData && (
            <p className="text-xs text-text-muted py-4 text-center">
              Log activities to see your breakdown.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

CategoryBreakdown.propTypes = {
  breakdown: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      kg: PropTypes.number.isRequired,
      percent: PropTypes.number.isRequired,
    })
  ).isRequired,
};
