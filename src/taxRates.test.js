import { describe, it, expect } from 'vitest';
import {
  calcFederalTax,
  taxableSS,
  calcTotalTax,
  baseIncomeTax,
  grossUpPreTax,
  grossUpBrokerage,
  brokerageTax,
  STATE_TAX,
  FEDERAL,
  SS_THRESHOLDS,
  NIIT_THRESHOLD,
} from './taxRates.js';

// Helper: compare dollars within a small tolerance.
const near = (actual, expected, tol = 1) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);

describe('calcFederalTax', () => {
  // Hand-computed from the published 2026 MFJ brackets:
  //   10% x 24,800            =  2,480
  //   12% x (100,800-24,800)  =  9,120
  //   22% x (172,800-100,800) = 15,840
  //                    total  = 27,440
  it('matches a hand-computed MFJ figure at $172,800 taxable', () => {
    near(calcFederalTax(172800, 'mfj'), 27440);
  });

  // Single brackets: 10% x 12,400 = 1,240
  //                  12% x (50,400-12,400) = 4,560
  //                  22% x (105,700-50,400) = 12,166
  //                  24% x (150,000-105,700) = 10,632
  //                                    total = 28,598
  it('matches a hand-computed Single figure at $150,000 taxable', () => {
    near(calcFederalTax(150000, 'single'), 28598);
  });

  it('is zero at or below zero taxable income', () => {
    expect(calcFederalTax(0, 'mfj')).toBe(0);
    expect(calcFederalTax(-5000, 'mfj')).toBe(0);
  });

  it('taxes a single filer more than MFJ on identical income', () => {
    expect(calcFederalTax(200000, 'single')).toBeGreaterThan(
      calcFederalTax(200000, 'mfj')
    );
  });

  it('applies only the lowest bracket to small incomes', () => {
    near(calcFederalTax(10000, 'mfj'), 1000); // 10%
  });
});

describe('taxableSS (IRS provisional income rule)', () => {
  it('taxes none of the benefit below the lower threshold', () => {
    // provisional = 0 + 40,000*0.5 = 20,000 < 32,000
    expect(taxableSS(40000, 0, 'mfj')).toBe(0);
  });

  it('taxes 50% of the excess in the middle band', () => {
    // provisional = 20,000 + 20,000 = 40,000 (between 32k and 44k)
    // taxable = 50% x (40,000 - 32,000) = 4,000
    near(taxableSS(40000, 20000, 'mfj'), 4000);
  });

  it('caps the middle band at 50% of benefits', () => {
    // provisional = 35,000 + 2,000 = 37,000 -> 50% x 5,000 = 2,500,
    // but 50% of the $4,000 benefit is only $2,000, which governs.
    near(taxableSS(4000, 35000, 'mfj'), 2000);
  });

  it('taxes 85% of the excess above the upper threshold', () => {
    // provisional = 50,000 + 20,000 = 70,000
    // taxable = 6,000 + 85% x (70,000 - 44,000) = 28,100
    near(taxableSS(40000, 50000, 'mfj'), 28100);
  });

  it('never taxes more than 85% of the benefit', () => {
    // Very high other income: the 85%-of-benefits ceiling must bind.
    expect(taxableSS(40000, 100000, 'mfj')).toBeLessThanOrEqual(0.85 * 40000);
    expect(taxableSS(40000, 1000000, 'mfj')).toBeLessThanOrEqual(0.85 * 40000);
    near(taxableSS(40000, 100000, 'mfj'), 34000); // exactly 85%
  });

  it('uses lower thresholds for single filers', () => {
    expect(SS_THRESHOLDS.single.lower).toBe(25000);
    expect(SS_THRESHOLDS.single.upper).toBe(34000);
    // Same inputs are taxed more heavily as a single filer.
    expect(taxableSS(30000, 20000, 'single')).toBeGreaterThan(
      taxableSS(30000, 20000, 'mfj')
    );
  });
});

describe('calcTotalTax', () => {
  // Hand-computed CA MFJ on $205,000 ordinary income.
  //   federal taxable = 205,000 - 32,200 = 172,800 -> 27,440
  //   CA taxable      = 205,000 - 11,412 = 193,588
  //     1%  x 22,158  =    221.58
  //     2%  x 30,370  =    607.40
  //     4%  x 30,376  =  1,215.04
  //     6%  x 32,180  =  1,930.80
  //     8%  x 30,364  =  2,429.12
  //     9.3% x 48,140 =  4,477.02
  //                     ---------
  //                     10,880.96
  it('matches hand-computed federal and CA tax on $205,000 (MFJ)', () => {
    const r = calcTotalTax(205000, 0, 0, 'CA', 'mfj');
    near(r.federalTax, 27440);
    near(r.stateTax, 10881);
    near(r.total, 38321);
  });

  it('charges no state tax in a no-income-tax state', () => {
    const r = calcTotalTax(205000, 0, 0, 'TX', 'mfj');
    expect(r.stateTax).toBe(0);
    near(r.federalTax, 27440); // federal is unchanged by state
  });

  it('gives identical federal tax across states', () => {
    const ca = calcTotalTax(150000, 0, 0, 'CA', 'mfj');
    const tx = calcTotalTax(150000, 0, 0, 'TX', 'mfj');
    near(ca.federalTax, tx.federalTax);
  });

  it('does not apply state tax to Social Security in a non-SS-taxing state', () => {
    // CA exempts SS. Adding SS income must not raise CA state tax.
    const withoutSS = calcTotalTax(120000, 0, 0, 'CA', 'mfj');
    const withSS = calcTotalTax(120000, 40000, 0, 'CA', 'mfj');
    near(withSS.stateTax, withoutSS.stateTax);
    // ...but it must raise federal tax, since SS is federally taxable.
    expect(withSS.federalTax).toBeGreaterThan(withoutSS.federalTax);
  });

  it('does apply state tax to Social Security in an SS-taxing state', () => {
    // Colorado taxes SS (exemptions not modelled).
    const withoutSS = calcTotalTax(120000, 0, 0, 'CO', 'mfj');
    const withSS = calcTotalTax(120000, 40000, 0, 'CO', 'mfj');
    expect(withSS.stateTax).toBeGreaterThan(withoutSS.stateTax);
  });

  it('treats other income as taxable ordinary income', () => {
    const without = calcTotalTax(100000, 0, 0, 'CA', 'mfj');
    const with35k = calcTotalTax(100000, 0, 35000, 'CA', 'mfj');
    expect(with35k.total).toBeGreaterThan(without.total);
  });

  it('taxes a single filer more than MFJ on the same income', () => {
    const mfj = calcTotalTax(80000, 30000, 20000, 'CA', 'mfj');
    const single = calcTotalTax(80000, 30000, 20000, 'CA', 'single');
    expect(single.total).toBeGreaterThan(mfj.total);
  });

  it('returns zero tax on zero income', () => {
    const r = calcTotalTax(0, 0, 0, 'CA', 'mfj');
    expect(r.total).toBe(0);
  });

  it('falls back safely for an unknown state code', () => {
    const r = calcTotalTax(100000, 0, 0, 'ZZ', 'mfj');
    expect(r.stateTax).toBe(0);
    expect(r.federalTax).toBeGreaterThan(0);
  });
});

describe('baseIncomeTax', () => {
  it('equals calcTotalTax with no pre-tax withdrawal', () => {
    near(
      baseIncomeTax(40000, 30000, 'CA', 'mfj'),
      calcTotalTax(0, 40000, 30000, 'CA', 'mfj').total
    );
  });
});

describe('grossUpPreTax', () => {
  it('grosses up so the net after marginal tax equals the amount needed', () => {
    const needed = 100000;
    const gross = grossUpPreTax(needed, 0, 0, 'CA', 0, 'mfj');
    const tax = calcTotalTax(gross, 0, 0, 'CA', 'mfj').total;
    near(gross - tax, needed, 2);
  });

  it('requires a larger gross withdrawal than the after-tax need', () => {
    const gross = grossUpPreTax(100000, 0, 0, 'CA', 0, 'mfj');
    expect(gross).toBeGreaterThan(100000);
  });

  it('requires less gross-up in a no-tax state than in a high-tax state', () => {
    const ca = grossUpPreTax(100000, 0, 0, 'CA', 0, 'mfj');
    const tx = grossUpPreTax(100000, 0, 0, 'TX', 0, 'mfj');
    expect(tx).toBeLessThan(ca);
  });

  it('returns zero when nothing is needed', () => {
    expect(grossUpPreTax(0, 0, 0, 'CA', 0, 'mfj')).toBe(0);
    expect(grossUpPreTax(-100, 0, 0, 'CA', 0, 'mfj')).toBe(0);
  });

  it('accounts for pre-tax already withdrawn (stacked marginal rate)', () => {
    // Stacking on top of $200k of prior withdrawals should cost more.
    const first = grossUpPreTax(50000, 0, 0, 'CA', 0, 'mfj');
    const stacked = grossUpPreTax(50000, 0, 0, 'CA', 200000, 'mfj');
    expect(stacked).toBeGreaterThan(first);
  });
});

describe('capital gains and NIIT', () => {
  it('taxes 50% of a brokerage withdrawal as long-term gain', () => {
    // $40k withdrawal -> $20k taxable gain, taxed at CA's marginal rate.
    // $120k ordinary income -> $108,920 CA taxable -> the 6% bracket.
    const t = brokerageTax(40000, 120000, 0, 0, 'CA', 'mfj');
    near(t.state, 20000 * 0.06, 1);
  });

  // KNOWN LIMITATION: the state marginal rate is derived from ordinary income
  // only, so a capital gain does not push the filer into higher brackets. With
  // zero ordinary income the state rate is 0 and the gain escapes state tax,
  // which understates it slightly. Documented rather than silently accepted.
  it('does not tax gains at state level when ordinary income is zero', () => {
    const t = brokerageTax(40000, 0, 0, 0, 'CA', 'mfj');
    expect(t.state).toBe(0);
  });

  it('applies the 15% federal LTCG rate at higher income', () => {
    // $50k pre-tax puts taxable income above the 0% LTCG breakpoint.
    const t = brokerageTax(40000, 150000, 0, 0, 'TX', 'mfj');
    near(t.federal, 40000 * 0.5 * 0.15); // $3,000
  });

  it('adds 3.8% NIIT once MAGI exceeds the threshold', () => {
    const below = brokerageTax(40000, 150000, 0, 0, 'TX', 'mfj');
    const above = brokerageTax(40000, 300000, 0, 0, 'TX', 'mfj');
    // gain = $20,000; NIIT adds 3.8% of that = $760
    near(above.federal - below.federal, 20000 * 0.038, 5);
  });

  it('does not apply NIIT below the MAGI threshold', () => {
    expect(NIIT_THRESHOLD.mfj).toBe(250000);
    // $150k MAGI is above the 15% LTCG breakpoint but below the NIIT
    // threshold, so the federal rate should be exactly 15% of the gain.
    const t = brokerageTax(10000, 150000, 0, 0, 'TX', 'mfj');
    near(t.federal, 10000 * 0.5 * 0.15);
  });

  it('applies the 0% federal LTCG rate at modest income', () => {
    // $100k pre-tax -> $67,800 taxable, below the $98,900 LTCG breakpoint.
    const t = brokerageTax(10000, 100000, 0, 0, 'TX', 'mfj');
    expect(t.federal).toBe(0);
  });

  it('splits cap-gains tax into federal and state that sum to the total', () => {
    const t = brokerageTax(40000, 150000, 0, 0, 'CA', 'mfj');
    near(t.federal + t.state, t.total, 0.01);
  });

  it('grosses up a brokerage withdrawal to net the amount needed', () => {
    const needed = 50000;
    const { gross } = grossUpBrokerage(needed, 150000, 0, 0, 'CA', 'mfj');
    const tax = brokerageTax(gross, 150000, 0, 0, 'CA', 'mfj');
    near(gross - tax.total, needed, 2);
  });

  it('charges no cap-gains tax on a zero withdrawal', () => {
    const { gross, tax } = grossUpBrokerage(0, 100000, 0, 0, 'CA', 'mfj');
    expect(gross).toBe(0);
    expect(tax).toBe(0);
  });
});

describe('state tax data integrity', () => {
  const codes = Object.keys(STATE_TAX);

  it('covers all 50 states plus DC', () => {
    expect(codes).toHaveLength(51);
  });

  it('defines both filing statuses for every state', () => {
    for (const c of codes) {
      expect(STATE_TAX[c].mfj, `${c}.mfj`).toBeDefined();
      expect(STATE_TAX[c].single, `${c}.single`).toBeDefined();
      expect(Array.isArray(STATE_TAX[c].mfj.brackets), `${c} brackets`).toBe(true);
    }
  });

  it('keeps every bracket table sorted ascending with valid rates', () => {
    for (const c of codes) {
      for (const status of ['mfj', 'single']) {
        const b = STATE_TAX[c][status].brackets;
        for (let i = 1; i < b.length; i++) {
          expect(b[i][0], `${c}.${status} bracket order`).toBeGreaterThan(b[i - 1][0]);
        }
        for (const [, rate] of b) {
          expect(rate, `${c}.${status} rate`).toBeGreaterThanOrEqual(0);
          expect(rate, `${c}.${status} rate`).toBeLessThan(0.15);
        }
      }
    }
  });

  it('marks the nine no-income-tax states as having no brackets', () => {
    for (const c of ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY']) {
      expect(STATE_TAX[c].mfj.brackets, c).toHaveLength(0);
    }
  });

  it('flags exactly the eight states that tax Social Security', () => {
    const ssStates = codes.filter(c => STATE_TAX[c].taxesSS).sort();
    expect(ssStates).toEqual(['CO', 'CT', 'MN', 'MT', 'NM', 'RI', 'UT', 'VT']);
  });

  it('uses the published 2026 federal standard deductions', () => {
    expect(FEDERAL.mfj.std).toBe(32200);
    expect(FEDERAL.single.std).toBe(16100);
  });
});
