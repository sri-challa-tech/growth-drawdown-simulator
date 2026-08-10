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

// Fire a GA4 custom event, if analytics loaded (guards against ad blockers / dev env).
function trackEvent(name, params) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}

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
    if (err) {
      setError(err);
      trackEvent('calculate_click', { success: false, reason: 'validation' });
      return;
    }
    setError('');
    try {
      const rows = runSimulation(data);
      setResults(rows);
      trackEvent('calculate_click', { success: true });
    } catch (e) {
      setError('Calculation error: ' + e.message);
      trackEvent('calculate_click', { success: false, reason: 'exception' });
    }
  }

  function editInputs() {
    setResults(null);
    trackEvent('edit_inputs_click', {});
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
      <div className="app-header">
        <h1>Investment Growth &amp; Retirement Planner</h1>
        <a
          className="source-link"
          href="https://github.com/sri-challa-tech/growth-drawdown-simulator"
          target="_blank"
          rel="noopener noreferrer"
          title="Read the code on GitHub"
        >
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
          </svg>
          View source
        </a>
      </div>
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
            <button className="btn btn-secondary" onClick={editInputs}>
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
        Investment Growth &amp; Retirement Planner · Educational estimates only — not financial,
        tax, or investment advice.
      </footer>
    </div>
  );
}
