import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

// Color scheme by seniority:
//   Older spouse  -> Pre-Tax: yellow,  Brokerage: blue,       Roth: green
//   Younger spouse-> Pre-Tax: orange,  Brokerage: dark-blue,  Roth: dark-green
const OLDER_COLORS   = { PreTax: '#d55e00', Brokerage: '#bce2f7', Roth: '#a8e6cf' }; // vermilion, sky blue, mint green
const YOUNGER_COLORS = { PreTax: '#e69f00', Brokerage: '#0072b2', Roth: '#009e73' }; // light orange, blue, bluish green

function fmt(v) {
  if (v === undefined || v === null) return '';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${v < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${v < 0 ? '-' : ''}$${(abs / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function ResultsChart({ rows, retirementAge, single }) {
  const chartData = rows.map(r => ({
    age: r.userAge,
    userPreTax: r.balances.userPreTax,
    userRoth: r.balances.userRoth,
    userBrokerage: r.balances.userBrokerage,
    spousePreTax: r.balances.spousePreTax,
    spouseRoth: r.balances.spouseRoth,
    spouseBrokerage: r.balances.spouseBrokerage,
  }));

  // Even, readable x-axis ticks: every 5 years plus the first and last age.
  const ages = chartData.map(d => d.age);
  const firstAge = ages[0];
  const lastAge = ages[ages.length - 1];
  const xTicks = [...new Set([
    firstAge,
    ...ages.filter(a => a % 5 === 0),
    lastAge,
  ])].sort((a, b) => a - b);

  // Determine who is older from the first row's ages
  const first = rows[0] || { userAge: 0, spouseAge: 0 };
  const userIsOlder = first.userAge >= first.spouseAge;

  // "older" / "younger" mapped to the underlying user/spouse data keys
  const olderPrefix   = userIsOlder ? 'user' : 'spouse';
  const youngerPrefix = userIsOlder ? 'spouse' : 'user';
  const olderName   = userIsOlder ? 'You' : 'Spouse';
  const youngerName = userIsOlder ? 'Spouse' : 'You';

  // Legend/draw order follows the withdrawal strategy:
  //   1) Pre-Tax (older then younger)
  //   2) Brokerage (older then younger)
  //   3) Roth (older then younger)
  // Single filer: show only the user's three accounts (older-spouse colors).
  const LINES = single ? [
    { key: 'userPreTax',    label: 'Pre-Tax',   color: OLDER_COLORS.PreTax },
    { key: 'userBrokerage', label: 'Brokerage', color: OLDER_COLORS.Brokerage },
    { key: 'userRoth',      label: 'Roth',      color: OLDER_COLORS.Roth },
  ] : [
    { key: `${olderPrefix}PreTax`,      label: `Pre-Tax — ${olderName} (older)`,       color: OLDER_COLORS.PreTax },
    { key: `${youngerPrefix}PreTax`,    label: `Pre-Tax — ${youngerName} (younger)`,   color: YOUNGER_COLORS.PreTax },
    { key: `${olderPrefix}Brokerage`,   label: `Brokerage — ${olderName} (older)`,     color: OLDER_COLORS.Brokerage },
    { key: `${youngerPrefix}Brokerage`, label: `Brokerage — ${youngerName} (younger)`, color: YOUNGER_COLORS.Brokerage },
    { key: `${olderPrefix}Roth`,        label: `Roth — ${olderName} (older)`,          color: OLDER_COLORS.Roth },
    { key: `${youngerPrefix}Roth`,      label: `Roth — ${youngerName} (younger)`,      color: YOUNGER_COLORS.Roth },
  ];

  return (
    <div>
      <h2>Portfolio Value Over Time</h2>
      <div className="legend">
        {LINES.map(l => (
          <div className="legend-item" key={l.key}>
            <span className="legend-dot" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="age"
              ticks={xTicks}
              interval={0}
              label={{ value: "Your Age", position: "insideBottom", offset: -2, fontSize: 12 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fontSize: 11 }}
              width={65}
            />
            <Tooltip
              formatter={(v, name) => [fmt(v), name]}
              itemSorter={(item) => -item.value}
              labelFormatter={(v, payload) => {
                const total = (payload || []).reduce((sum, p) => sum + (p.value || 0), 0);
                return `Your Age: ${v}  (Total: ${fmt(total)})`;
              }}
              contentStyle={{ fontSize: '0.78rem' }}
            />
            <ReferenceLine
              x={retirementAge}
              stroke="#e53e3e"
              strokeDasharray="6 3"
              label={{ value: 'Retirement', position: 'top', fill: '#e53e3e', fontSize: 11 }}
            />
            {LINES.map(l => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.label}
                stroke={l.color}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
