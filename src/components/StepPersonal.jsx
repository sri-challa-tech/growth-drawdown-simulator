export default function StepPersonal({ data, onChange, single }) {
  return (
    <div>
      <div className="step-title">Personal Information</div>
      <div className="step-desc">
        Enter the current ages for you and your spouse. Leave spouse's age blank if you're single —
        taxes will be calculated as a single filer.
      </div>

      <div className="inline-grid">
        <div className="form-group">
          <label>Your Current Age</label>
          <input type="number" min="18" max="80" value={data.userAge}
            onChange={e => onChange('userAge', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Spouse's Current Age <span className="optional-tag">(blank if single)</span></label>
          <input type="number" min="18" max="80" placeholder="—" value={data.spouseAge}
            onChange={e => onChange('spouseAge', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Your Planned Retirement Age</label>
          <input type="number" min="50" max="80" value={data.retirementAge}
            onChange={e => onChange('retirementAge', e.target.value)} />
        </div>
        <div className="form-group">
          <label>State (2-letter code)</label>
          <input type="text" maxLength="2" placeholder="e.g. CA" value={data.stateCode}
            onChange={e => onChange('stateCode', e.target.value.toUpperCase())} />
        </div>
      </div>
    </div>
  );
}
