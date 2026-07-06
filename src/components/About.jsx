import { useState } from 'react';

export default function About() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card about-card">
      <button className="about-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>📋 How this works &amp; assumptions</span>
        <span className="about-chevron">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="about-body">
          <h3>What this tool does</h3>
          <p>
            It projects your household's accounts year by year — from today to retirement age and
            then through the year the younger spouse turns 90 — accumulating savings until
            retirement and then drawing them down to cover expenses, with federal and state taxes
            estimated each year. The goal is
            to help you make informed decisions (save more, adjust spending, or relocate) by seeing
            how the levers change the outcome.
          </p>

          <h3>Withdrawal order (during retirement)</h3>
          <p>Each year, after Social Security and other income, the remaining expense gap is funded in this order:</p>
          <ol>
            <li><strong>Pre-tax</strong> (401k/IRA) — oldest spouse first</li>
            <li><strong>Brokerage</strong> (taxable) — oldest spouse first</li>
            <li><strong>Roth</strong> — oldest spouse first</li>
          </ol>
          <p>
            <strong>RMDs:</strong> starting at age 73, Required Minimum Distributions are taken from
            pre-tax accounts even if not needed. If an RMD exceeds the year's spending need, the
            after-tax surplus is moved into that person's brokerage account and the year is marked
            with an <span className="rmd-badge">RMD</span> badge.
          </p>
          <p>
            <strong>Deficit:</strong> if every account is depleted, the remaining shortfall is
            carried as a negative, <em>compounding</em> balance in the last account money was drawn
            from, marked <span className="deficit-badge">DEFICIT</span>. It models running out of
            money (e.g. borrowing / reverse mortgage territory).
          </p>

          <h3>Taxes (2026 rates)</h3>
          <ul>
            <li><strong>Filing status:</strong> Married Filing Jointly if a spouse's age is entered, otherwise Single — each with its own 2026 federal/state brackets, standard deduction, and Social Security thresholds. The <strong>standard deduction</strong> is always taken; itemized deductions are not modeled.</li>
            <li><strong>Federal tax:</strong> The 2026 progressive tax brackets are applied. Pre-tax withdrawals and other income are treated as ordinary income.</li>
            <li><strong>State tax:</strong> The 2026 progressive tax brackets for all 41 taxing states + DC are applied. States with no income taxes pay $0.</li>
            <li>
              <strong>Social Security Income:</strong>
              <ul>
                <li><strong>Federal:</strong> Taxed via the IRS "provisional income" rule (up to 85% taxable). Those thresholds ($32K/$44K) are not inflation-indexed, by law.</li>
                <li><strong>State:</strong> Applied only in the 8 states that tax it (CO, CT, MN, MT, NM, RI, UT, VT). Those states' age/income-based SS exemptions are <em>not</em> modeled, so their tax may be overstated for some retirees.</li>
              </ul>
            </li>
            <li><strong>Capital gains (brokerage):</strong> 50% of each brokerage withdrawal is assumed to be taxable long-term gain, taxed at the federal LTCG rate (0/15/20% by income) plus the state's ordinary rate.</li>
            <li><strong>Net Investment Income Tax (ACA):</strong> An extra 3.8% is applied to brokerage gains in years your income (MAGI) exceeds $250,000 (MFJ) / $200,000 (single). These thresholds are not inflation-indexed. NIIT is applied only to brokerage gains; "other Income" is treated as non-investment income (e.g. a pension), so if yours is actually rental or investment income, its NIIT is not modeled.</li>
          </ul>

          <h3>Inflation &amp; growth</h3>
          <ul>
            <li>The inflation rate is applied to <strong>retirement expenses, Social Security, and other income</strong>.</li>
            <li>It is <strong>not</strong> applied to pre-retirement <strong>contributions</strong> (they stay flat in today's dollars) or to <strong>tax brackets</strong> (frozen at 2026 — may overstate later-year taxes).</li>
            <li>Account growth rates are nominal and set separately for before vs. during retirement.</li>
          </ul>

          <h3>Other assumptions</h3>
          <ul>
            <li>For couples, the spouse is assumed to retire in the same year as the user — there's a single retirement age input, not one per person.</li>
            <li>For couples, both spouses are assumed alive through the simulation (no survivor scenario). For a single filer, the spouse accounts/income are omitted and the projection runs to the user's age 90.</li>
            <li>Local/city income taxes (e.g. NYC, Maryland counties, OH/IN local) are not modeled.</li>
            <li>Washington's separate capital-gains tax is not modeled.</li>
            <li>Tax data is sourced from the IRS and the Tax Foundation for tax year 2026, and should be refreshed annually.</li>
          </ul>

          <p className="about-disclaimer">
            <strong>Disclaimer:</strong> This tool provides educational estimates only and is not
            financial, tax, or investment advice. Real outcomes depend on market returns, tax-law
            changes, and personal circumstances. Consult a qualified professional before making
            decisions.
          </p>
        </div>
      )}
    </div>
  );
}
