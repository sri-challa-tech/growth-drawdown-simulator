function fmt(n) {
  if (n === undefined || n === null) return '—';
  const abs = Math.abs(n);
  const s = abs >= 1000
    ? `$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : `$${abs.toFixed(0)}`;
  return n < 0 ? <span className="negative">-{s}</span> : s;
}

export default function ResultsTable({ rows, retirementAge, single }) {
  return (
    <div>
      <h2>Annual Detail Table</h2>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th rowSpan="2">{single ? 'Age' : 'Age (You / Sp)'}</th>
              <th className="col-divider" colSpan="5" style={{ textAlign: 'center', borderBottom: '1px solid #4a5568' }}>
                Annual Cash Flow
              </th>
              <th className="col-divider" colSpan={single ? 3 : 6} style={{ textAlign: 'center', borderBottom: '1px solid #4a5568' }}>
                Annual Withdrawals
              </th>
              <th className="col-divider" colSpan={single ? 3 : 6} style={{ textAlign: 'center', borderBottom: '1px solid #4a5568' }}>
                Year-End Balances
              </th>
            </tr>
            <tr>
              <th className="col-divider">SS Income</th>
              <th>Other Income</th>
              <th>Fed Tax</th>
              <th>State Tax</th>
              <th>Expenses</th>
              <th className="col-divider">{single ? 'Pre-Tax' : 'Your Pre-Tax'}</th>
              <th>{single ? 'Brokerage' : 'Your Broker.'}</th>
              <th>{single ? 'Roth' : 'Your Roth'}</th>
              {!single && <><th>Sp Pre-Tax</th><th>Sp Broker.</th><th>Sp Roth</th></>}
              <th className="col-divider">{single ? 'Pre-Tax' : 'Your Pre-Tax'}</th>
              <th>{single ? 'Brokerage' : 'Your Broker.'}</th>
              <th>{single ? 'Roth' : 'Your Roth'}</th>
              {!single && <><th>Sp Pre-Tax</th><th>Sp Broker.</th><th>Sp Roth</th></>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isFirstRetirement = r.isRetired && (i === 0 || !rows[i - 1].isRetired);
              // Render a withdrawal cell with optional RMD / DEFICIT badges.
              const wCell = (key, divider = false) => {
                const isRmd = r.rmdForced?.[key];
                const isDeficit = r.deficitAcct === key;
                const cls = [
                  isDeficit ? 'deficit-cell' : (isRmd ? 'rmd-cell' : ''),
                  divider ? 'col-divider' : '',
                ].filter(Boolean).join(' ');
                return (
                  <td className={cls}>
                    {r.isRetired ? fmt(r.withdrawals[key]) : '—'}
                    {isRmd && (
                      <span className="rmd-badge" title="A Required Minimum Distribution forced this pre-tax withdrawal to exceed the year's spending need. The after-tax surplus was moved to brokerage.">RMD</span>
                    )}
                    {isDeficit && (
                      <span className="deficit-badge" title="All accounts are depleted. The remaining shortfall is carried here as a negative, compounding balance — this was the last account money was drawn from.">DEFICIT</span>
                    )}
                  </td>
                );
              };
              return (
                <tr key={r.userAge} className={isFirstRetirement ? 'retirement-marker' : ''}>
                  <td>{single ? r.userAge : `${r.userAge} / ${r.spouseAge}`}</td>
                  <td className="col-divider">{r.isRetired ? fmt(r.ssIncome) : '—'}</td>
                  <td>{r.isRetired ? fmt(r.otherIncome) : '—'}</td>
                  <td>{r.isRetired ? fmt(r.federalTax) : '—'}</td>
                  <td>{r.isRetired ? fmt(r.stateTax) : '—'}</td>
                  <td>{r.isRetired ? fmt(r.totalExpenses) : '—'}</td>
                  {wCell('userPreTax', true)}
                  {wCell('userBrokerage')}
                  {wCell('userRoth')}
                  {!single && wCell('spousePreTax')}
                  {!single && wCell('spouseBrokerage')}
                  {!single && wCell('spouseRoth')}
                  <td className="col-divider">{fmt(r.balances.userPreTax)}</td>
                  <td>{fmt(r.balances.userBrokerage)}</td>
                  <td>{fmt(r.balances.userRoth)}</td>
                  {!single && <td>{fmt(r.balances.spousePreTax)}</td>}
                  {!single && <td>{fmt(r.balances.spouseBrokerage)}</td>}
                  {!single && <td>{fmt(r.balances.spouseRoth)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="table-footnote">
        <span className="rmd-badge">RMD</span> A Required Minimum Distribution forced a
        pre-tax withdrawal larger than that year's spending need. The extra was taxed and the
        after-tax surplus moved to brokerage. (Strategies like Roth conversions before age 73
        can reduce future RMDs.)
      </p>
      <p className="table-footnote">
        <span className="deficit-badge">DEFICIT</span> All accounts are depleted. The remaining
        shortfall is carried in this account as a negative balance that compounds each year.
        This marks where the plan runs out of money — a signal to save more before retirement,
        reduce spending, or consider options like a reverse mortgage.
      </p>
    </div>
  );
}
