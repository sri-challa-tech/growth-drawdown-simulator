const ACCOUNT_TYPES = [
  { key: 'PreTax', label: 'Pre-Tax (401k/IRA)' },
  { key: 'Roth',   label: 'Roth (Roth 401k/IRA)' },
  { key: 'Brokerage', label: 'Brokerage (Taxable)' },
];

export default function StepAccounts({ data, onChange, single }) {
  return (
    <div>
      <div className="step-title">Current Account Balances & Monthly Contributions</div>
      <div className="step-desc">Enter current balances and monthly contributions for each account.</div>

      <table className="account-table">
        <thead>
          <tr>
            <th>Account Type</th>
            <th>Your Balance ($)</th>
            {!single && <th>Spouse Balance ($)</th>}
            <th>Your Monthly Contrib ($)</th>
            {!single && <th>Spouse Monthly Contrib ($)</th>}
          </tr>
        </thead>
        <tbody>
          {ACCOUNT_TYPES.map(({ key, label }) => (
            <tr key={key}>
              <td>{label}</td>
              <td>
                <input type="number" min="0" value={data[`user${key}`]}
                  onChange={e => onChange(`user${key}`, e.target.value)} />
              </td>
              {!single && (
                <td>
                  <input type="number" min="0" value={data[`spouse${key}`]}
                    onChange={e => onChange(`spouse${key}`, e.target.value)} />
                </td>
              )}
              <td>
                <input type="number" min="0" value={data[`user${key}Contrib`]}
                  onChange={e => onChange(`user${key}Contrib`, e.target.value)} />
              </td>
              {!single && (
                <td>
                  <input type="number" min="0" value={data[`spouse${key}Contrib`]}
                    onChange={e => onChange(`spouse${key}Contrib`, e.target.value)} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
