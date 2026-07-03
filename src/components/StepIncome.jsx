export default function StepIncome({ data, onChange, single }) {
  return (
    <div>
      <div className="step-title">Retirement Income</div>
      <div className="step-desc">Enter Social Security benefits and any other income sources.</div>

      <h3>Social Security</h3>
      <div className="inline-grid">
        <div className="form-group">
          <label>Your Monthly SS Benefit ($)</label>
          <input type="number" min="0" value={data.userSSMonthly}
            onChange={e => onChange('userSSMonthly', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Your Age When SS Starts</label>
          <input type="number" min="62" max="70" value={data.userSSStartAge}
            onChange={e => onChange('userSSStartAge', e.target.value)} />
        </div>
        {!single && (
          <>
            <div className="form-group">
              <label>Spouse's Monthly SS Benefit ($)</label>
              <input type="number" min="0" value={data.spouseSSMonthly}
                onChange={e => onChange('spouseSSMonthly', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Spouse's Age When SS Starts</label>
              <input type="number" min="62" max="70" value={data.spouseSSStartAge}
                onChange={e => onChange('spouseSSStartAge', e.target.value)} />
            </div>
          </>
        )}
      </div>

      <h3 style={{ marginTop: 16 }}>Other Income (pension, rental, etc.)</h3>
      <div className="inline-grid">
        <div className="form-group">
          <label>Annual Amount ($)</label>
          <input type="number" min="0" value={data.otherAnnualIncome}
            onChange={e => onChange('otherAnnualIncome', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Your Age When It Starts</label>
          <input type="number" min="50" max="90" value={data.otherIncomeStartAge}
            onChange={e => onChange('otherIncomeStartAge', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
