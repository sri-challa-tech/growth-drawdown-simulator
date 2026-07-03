export default function StepExpenses({ data, onChange }) {
  return (
    <div>
      <div className="step-title">Retirement Expenses</div>
      <div className="step-desc">All amounts should be in today's dollars (after-tax). Inflation will be applied automatically.</div>

      <div className="inline-grid-3">
        <div className="form-group">
          <label>Monthly Living Expenses (after-tax $)</label>
          <input type="number" min="0" value={data.monthlyExpenses}
            onChange={e => onChange('monthlyExpenses', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Annual Travel & Misc. (after-tax $)</label>
          <input type="number" min="0" value={data.annualTravelMisc}
            onChange={e => onChange('annualTravelMisc', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Annual Inflation Rate (%)</label>
          <input type="number" min="0" max="15" step="0.1" value={data.inflationRate}
            onChange={e => onChange('inflationRate', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
