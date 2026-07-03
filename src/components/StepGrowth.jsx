const ACCTS = [
  { key: 'preTaxGrowth', label: 'Pre-Tax Accounts' },
  { key: 'rothGrowth',   label: 'Roth Accounts' },
  { key: 'brokerageGrowth', label: 'Brokerage Accounts' },
];

export default function StepGrowth({ data, onChange }) {
  return (
    <div>
      <div className="step-title">Annual Growth Rates</div>
      <div className="step-desc">Enter expected annual growth rates before and during retirement.</div>

      <table className="account-table">
        <thead>
          <tr>
            <th>Account Type</th>
            <th>Before Retirement (%)</th>
            <th>During Retirement (%)</th>
          </tr>
        </thead>
        <tbody>
          {ACCTS.map(({ key, label }) => (
            <tr key={key}>
              <td>{label}</td>
              <td>
                <input type="number" min="0" max="30" step="0.1"
                  value={data[`${key}Pre`]}
                  onChange={e => onChange(`${key}Pre`, e.target.value)} />
              </td>
              <td>
                <input type="number" min="0" max="30" step="0.1"
                  value={data[`${key}Ret`]}
                  onChange={e => onChange(`${key}Ret`, e.target.value)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
