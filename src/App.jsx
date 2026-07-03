import { useState, useEffect } from 'react';
import './index.css';
import StepPersonal from './components/StepPersonal';
import StepAccounts from './components/StepAccounts';
import StepGrowth from './components/StepGrowth';
import StepIncome from './components/StepIncome';
import StepExpenses from './components/StepExpenses';
import ResultsChart from './components/ResultsChart';
import ResultsTable from './components/ResultsTable';
import About from './components/About';
import AccordionSection from './components/AccordionSection';
import { runSimulation } from './calculator';
import { STATE_TAX } from './taxRates';


const DEFAULT = {
  userAge: '', spouseAge: '', retirementAge: '', stateCode: '',
  userPreTax: '', userRoth: '', userBrokerage: '',
  spousePreTax: '', spouseRoth: '', spouseBrokerage: '',
  userPreTaxContrib: '', userRothContrib: '', userBrokerageContrib: '',
  spousePreTaxContrib: '', spouseRothContrib: '', spouseBrokerageContrib: '',
  preTaxGrowthPre: '', rothGrowthPre: '', brokerageGrowthPre: '',
  preTaxGrowthRet: '', rothGrowthRet: '', brokerageGrowthRet: '',
  userSSMonthly: '', userSSStartAge: '',
  spouseSSMonthly: '', spouseSSStartAge: '',
  otherAnnualIncome: '', otherIncomeStartAge: '',
  monthlyExpenses: '', annualTravelMisc: '', inflationRate: '',
};

function fmtMoney(n) {
  if (n === undefined || n === null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

export default function App() {
  const [data, setData] = useState(DEFAULT);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // When results appear (after Calculate), jump to the top of the page.
  useEffect(() => {
    if (results) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [results]);

  function handleChange(key, value) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  function validate() {
    if (!data.stateCode || !(data.stateCode.toUpperCase() in STATE_TAX)) {
      return 'Please enter a valid 2-letter US state code (e.g. CA, TX, NY).';
    }
    if (Number(data.retirementAge) <= Number(data.userAge)) {
      return 'Retirement age must be greater than your current age.';
    }
    return '';
  }

  function calculate() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    try {
      const rows = runSimulation(data);
      setResults(rows);
    } catch (e) {
      setError('Calculation error: ' + e.message);
    }
  }

  function getSummary(rows) {
    if (!rows) return null;
    // Portfolio value at the moment of retirement = the last accumulation year's
    // ending balance, BEFORE any drawdown/taxes. This is state-independent (only
    // contributions + growth happen before retirement). Falls back to the first
    // retirement row if there are no accumulation years.
    const lastAccum = [...rows].reverse().find(r => !r.isRetired);
    const retRow = lastAccum || rows.find(r => r.isRetired);
    const lastRow = rows[rows.length - 1];
    const totalAtRetirement = retRow
      ? Object.values(retRow.balances).reduce((a, b) => a + b, 0) : 0;
    const totalAtEnd = Object.values(lastRow.balances).reduce((a, b) => a + b, 0);
    const depleted = rows.find(r =>
      r.isRetired && Object.values(r.balances).every(v => v <= 0)
    );
    return { totalAtRetirement, totalAtEnd, depletedAge: depleted?.userAge };
  }

  const summary = getSummary(results);

  // Single filer when no spouse age is entered — spouse inputs/columns are hidden.
  const single = data.spouseAge === '' || data.spouseAge === null
    || data.spouseAge === undefined || isNaN(Number(data.spouseAge));

  return (
    <div className="app">
      <h1>Investment Growth & Retirement Planner</h1>
      <p className="subtitle">
        Model your retirement across all accounts with tax-aware projections through age 90.
      </p>
      <p className="privacy-note">
        🔒 <strong>Your privacy:</strong> All your financial inputs stay in your browser and are
        never saved, stored, or sent anywhere — closing or refreshing the page clears all data.
        This site uses Google Analytics to anonymously track visits (page views only, no financial
        information).
      </p>

      {!results ? (
        <>
          <AccordionSection title="1. Personal Information" defaultOpen={true}>
            <StepPersonal data={data} onChange={handleChange} single={single} />
          </AccordionSection>
          <AccordionSection title="2. Account Balances & Contributions" defaultOpen={false}>
            <StepAccounts data={data} onChange={handleChange} single={single} />
          </AccordionSection>
          <AccordionSection title="3. Growth Rates" defaultOpen={false}>
            <StepGrowth data={data} onChange={handleChange} />
          </AccordionSection>
          <AccordionSection title="4. Retirement Income" defaultOpen={false}>
            <StepIncome data={data} onChange={handleChange} single={single} />
          </AccordionSection>
          <AccordionSection title="5. Retirement Expenses" defaultOpen={false}>
            <StepExpenses data={data} onChange={handleChange} />
          </AccordionSection>

          {error && <div className="form-error">{error}</div>}

          <div className="btn-row">
            <button className="btn btn-success btn-calculate" onClick={calculate}>
              Calculate →
            </button>
          </div>
        </>
      ) : (
        <div className="results-section">
          <div className="results-topbar">
            <button className="btn btn-secondary" onClick={() => setResults(null)}>
              ← Edit Inputs
            </button>
          </div>

          <About />

          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-card-label">Total Entering Retirement (Age {Number(data.retirementAge) - 1})</div>
              <div className="summary-card-value">{fmtMoney(summary.totalAtRetirement)}</div>
            </div>
            <div className={`summary-card ${summary.totalAtEnd < 0 ? 'warning' : 'good'}`}>
              <div className="summary-card-label">
                Total at End (Age {results[results.length - 1]?.userAge})
              </div>
              <div className="summary-card-value">{fmtMoney(summary.totalAtEnd)}</div>
            </div>
            <div className={`summary-card ${summary.depletedAge ? 'warning' : 'good'}`}>
              <div className="summary-card-label">Accounts Depleted</div>
              <div className="summary-card-value">
                {summary.depletedAge ? `Age ${summary.depletedAge}` : 'Never ✓'}
              </div>
            </div>
          </div>

          <div className="card">
            <ResultsChart rows={results} retirementAge={Number(data.retirementAge)} single={single} />
          </div>

          <div className="card">
            <ResultsTable rows={results} retirementAge={Number(data.retirementAge)} single={single} />
          </div>
        </div>
      )}

      <footer className="app-footer">
        Retirement Planner · Educational estimates only — not financial, tax, or investment advice.
      </footer>
    </div>
  );
}
