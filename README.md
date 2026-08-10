# Investment Growth & Retirement Planner

A browser-based simulator that projects a household's investment accounts year by year — through
accumulation, then drawdown — modelling 2026 federal and state tax law along the way.

**▶ Live: [retirement.srichalla.com](https://retirement.srichalla.com)**

Everything runs client-side. No backend, no accounts, no storage: the figures you type never leave
your browser.

---

## Why this isn't a spreadsheet

The interesting part isn't the compounding — it's that **withdrawals have to be solved for, not
calculated.**

**1. Funding a dollar of spending costs more than a dollar.** To cover $100,000 of expenses from a
pre-tax account, you can't withdraw $100,000 — you owe income tax on the withdrawal itself. The
required gross withdrawal satisfies:

```
gross − tax(gross) = needed
```

Because `tax()` is a progressive step function, there's no closed form. `grossUpPreTax()` solves it
iteratively, converging to within a dollar.

**2. Rates stack within a year.** The second withdrawal of a year lands in a higher bracket than the
first. Tax is therefore computed **marginally** — against everything already withdrawn that year —
rather than treating each account independently. Getting this wrong silently understates the cost of
a drawdown strategy.

**3. Social Security taxation is self-referential.** How much of a benefit is federally taxable
depends on "provisional income," which includes the very withdrawals being sized — which in turn
depend on the tax. The model resolves this by treating base-income tax as a funded expense and
grossing up only the marginal portion, so nothing is double-counted.

**4. Some withdrawals aren't chosen.** From age 73, Required Minimum Distributions come out of
pre-tax accounts whether or not the money is needed. The surplus is taxed and swept into the same
person's brokerage account, and the year is flagged — surfacing a tax cost the user didn't opt into,
and one that Roth conversions before 73 can reduce.

---

## Architecture

```
src/
  taxRates.js      2026 tax data + pure tax functions   (no React)
  calculator.js    year-by-year simulation engine        (no React)
  components/      presentation only
```

The engine is **plain JavaScript with zero React dependencies** — it can be lifted into React Native,
a Node service, or a test harness unchanged. The UI never computes anything.

## Tax model

| | Coverage |
|---|---|
| **Filing status** | Married Filing Jointly and Single — separate brackets, deductions, and thresholds |
| **Federal** | Full 2026 progressive brackets and standard deduction |
| **State** | All 41 taxing states + DC, full bracket tables; the 9 no-tax states resolve to zero |
| **Social Security** | IRS provisional-income rule, both bands, capped at 85% of benefits |
| **State SS treatment** | Applied only in the 8 states that tax it (CO, CT, MN, MT, NM, RI, UT, VT) |
| **Capital gains** | Federal LTCG tiers (0/15/20%) plus state ordinary rate |
| **NIIT** | 3.8% net investment income tax above the MAGI threshold |
| **RMDs** | IRS Uniform Lifetime Table from age 73 |

## Verification

Tax data is verified against **primary sources**, not just aggregators:

- **Federal** brackets and standard deductions confirmed against the IRS directly — exact match
- **CA, TX, GA, MD, IL, AZ, VA, CT** confirmed against state revenue departments
- The nine states that cut rates in 2026 cross-checked individually

That process caught two stale jurisdictions: Georgia was still on its pre-HB-463 rate, and
California's standard deduction was a year behind.

```bash
npm test    # 73 tests
```

The suite covers the tax engine and the simulation, with expected values **hand-computed from
published bracket tables** rather than snapshotted from the implementation. Writing it surfaced five
real bugs — including Social Security being taxed above the statutory 85% ceiling, and pre-tax
accounts stranding 10% of their balance mid-drawdown.

---

## Documented assumptions

Accuracy matters more than appearing comprehensive, so the simplifications are stated rather than
hidden. The app surfaces these in an in-page panel; the short version:

- Standard deduction only — itemized deductions are not modelled
- Local and city income taxes are not modelled (notably Maryland's county tax)
- The SS-taxing states' age and income exemptions are not modelled, so their tax may be overstated
- 50% of any brokerage withdrawal is assumed to be taxable long-term gain
- Federal SS provisional-income thresholds are not inflation-indexed — correct, by statute
- Tax brackets are frozen at 2026 and do not inflate over the projection

## Running locally

```bash
npm install
npm run dev       # dev server
npm run build     # production build → dist/
npm test          # test suite
```

## Maintaining the tax data

Rates live in `src/taxRates.js` and need an annual refresh. Two things to watch:

1. **January indexing** — federal figures publish around October–November; states vary and some
   publish late.
2. **Mid-year legislation** — Georgia changed its rate in May 2026, which an annual snapshot alone
   would miss.

---

## Disclaimer

Educational estimates only — not financial, tax, or investment advice. Real outcomes depend on
market returns, tax-law changes, and personal circumstances. Consult a qualified professional.
