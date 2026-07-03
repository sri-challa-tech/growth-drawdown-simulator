# Retirement Planner

A browser-based retirement planning tool that projects a household's accounts year by year —
through the year the youngest spouse turns 90 — with tax-aware accumulation and drawdown modeling.
It's designed to help people make informed decisions: save more now, adjust retirement spending,
or relocate to a more tax-friendly state.

## Features

- **Multi-account modeling** for both spouses: Pre-Tax (401k/IRA), Roth, and Brokerage.
- **Single or Married Filing Jointly** — leave the spouse's age blank to model a single filer.
- **2026 tax engine** (federal + all 50 states + DC) sourced from the IRS and the Tax Foundation:
  full progressive brackets, standard deductions, long-term capital gains, and Social Security
  taxation (including the 8 states that tax SS).
- **Tax-aware drawdown** in a defined order (Pre-Tax → Brokerage → Roth, oldest spouse first),
  with **Required Minimum Distributions** from age 73 and surplus swept to brokerage.
- **Inflation-adjusted** expenses, Social Security, and other income.
- **Interactive chart** of all six accounts over time and a detailed annual table, with **RMD**
  and **DEFICIT** badges flagging forced withdrawals and depletion.
- **Privacy-first:** everything runs in the browser; no data is stored or sent anywhere.

## Tech stack

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [Recharts](https://recharts.org/) for the chart

## Getting started

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Updating tax data

Tax rates are baked into `src/taxRates.js` for tax year 2026 and should be refreshed annually when
new federal and state figures are published (IRS and the Tax Foundation are the sources used).

## Disclaimer

This tool provides **educational estimates only** and is not financial, tax, or investment advice.
Real outcomes depend on market returns, tax-law changes, and personal circumstances. Consult a
qualified professional before making decisions.
