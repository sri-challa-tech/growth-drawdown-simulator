import { describe, it, expect } from 'vitest';
import { runSimulation } from './calculator.js';

// A comfortable baseline: a couple who can fund retirement without depleting.
function baseInputs(overrides = {}) {
  return {
    userAge: 52, spouseAge: 47, retirementAge: 60, stateCode: 'CA',
    userPreTax: 1000000, userRoth: 100000, userBrokerage: 50000,
    spousePreTax: 800000, spouseRoth: 100000, spouseBrokerage: 50000,
    userPreTaxContrib: 0, userRothContrib: 0, userBrokerageContrib: 0,
    spousePreTaxContrib: 0, spouseRothContrib: 0, spouseBrokerageContrib: 0,
    preTaxGrowthPre: 6, rothGrowthPre: 7, brokerageGrowthPre: 7,
    preTaxGrowthRet: 4, rothGrowthRet: 7, brokerageGrowthRet: 7,
    userSSMonthly: 3000, userSSStartAge: 67,
    spouseSSMonthly: 3000, spouseSSStartAge: 67,
    otherAnnualIncome: 0, otherIncomeStartAge: 62,
    monthlyExpenses: 8000, annualTravelMisc: 10000, inflationRate: 2,
    ...overrides,
  };
}

const totalBalance = row =>
  Object.values(row.balances).reduce((a, b) => a + b, 0);

describe('simulation horizon', () => {
  it('runs until the younger spouse turns 90', () => {
    // User 52, spouse 47 -> spouse hits 90 when the user is 95.
    const rows = runSimulation(baseInputs());
    expect(rows[0].userAge).toBe(52);
    expect(rows[rows.length - 1].userAge).toBe(95);
    expect(rows[rows.length - 1].spouseAge).toBe(90);
  });

  it('runs until the user turns 90 when the user is younger', () => {
    const rows = runSimulation(baseInputs({ userAge: 47, spouseAge: 52 }));
    expect(rows[rows.length - 1].userAge).toBe(90);
  });

  it('runs until the user turns 90 for a single filer', () => {
    const rows = runSimulation(baseInputs({ spouseAge: '' }));
    expect(rows[rows.length - 1].userAge).toBe(90);
  });

  it('produces one row per year with no gaps', () => {
    const rows = runSimulation(baseInputs());
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].userAge).toBe(rows[i - 1].userAge + 1);
    }
  });

  it('marks rows at or after the retirement age as retired', () => {
    const rows = runSimulation(baseInputs());
    for (const r of rows) {
      expect(r.isRetired).toBe(r.userAge >= 60);
    }
  });
});

describe('accumulation phase', () => {
  it('shows the current-age balances exactly as entered', () => {
    const rows = runSimulation(baseInputs());
    expect(rows[0].balances.userPreTax).toBe(1000000);
    expect(rows[0].balances.spousePreTax).toBe(800000);
    expect(rows[0].balances.userRoth).toBe(100000);
  });

  it('applies growth starting the year after the current age', () => {
    const rows = runSimulation(baseInputs());
    // 6% pre-tax growth: 1,000,000 -> 1,060,000
    expect(rows[1].balances.userPreTax).toBe(1060000);
  });

  it('adds annual contributions from the second year onward', () => {
    const rows = runSimulation(baseInputs({
      userPreTax: 100000, userPreTaxContrib: 1000, preTaxGrowthPre: 0,
    }));
    expect(rows[0].balances.userPreTax).toBe(100000);       // unchanged
    expect(rows[1].balances.userPreTax).toBe(112000);        // + 12 x 1,000
  });

  it('records no withdrawals, taxes, or expenses before retirement', () => {
    const rows = runSimulation(baseInputs());
    const preRetirement = rows.filter(r => !r.isRetired);
    for (const r of preRetirement) {
      expect(Object.values(r.withdrawals).every(v => v === 0)).toBe(true);
      expect(r.taxesPaid).toBe(0);
      expect(r.totalExpenses).toBe(0);
    }
  });

  it('is independent of the state (no tax applies before retirement)', () => {
    // Regression: the "Total Entering Retirement" figure must not vary by state.
    const ca = runSimulation(baseInputs({ stateCode: 'CA' }));
    const tx = runSimulation(baseInputs({ stateCode: 'TX' }));
    const lastAccumCA = [...ca].reverse().find(r => !r.isRetired);
    const lastAccumTX = [...tx].reverse().find(r => !r.isRetired);
    expect(totalBalance(lastAccumCA)).toBe(totalBalance(lastAccumTX));
  });
});

describe('single filer mode', () => {
  const rows = runSimulation(baseInputs({ spouseAge: '' }));

  it('keeps every spouse account at zero', () => {
    for (const r of rows) {
      expect(r.balances.spousePreTax).toBe(0);
      expect(r.balances.spouseRoth).toBe(0);
      expect(r.balances.spouseBrokerage).toBe(0);
    }
  });

  it('never withdraws from a spouse account', () => {
    for (const r of rows) {
      expect(r.withdrawals.spousePreTax).toBe(0);
      expect(r.withdrawals.spouseRoth).toBe(0);
      expect(r.withdrawals.spouseBrokerage).toBe(0);
    }
  });

  it('counts only the user\'s Social Security', () => {
    const at70 = rows.find(r => r.userAge === 70);
    // One person's benefit, inflated from age 67 -> 70.
    const expected = 3000 * 12 * Math.pow(1.02, 3);
    expect(Math.abs(at70.ssIncome - expected)).toBeLessThanOrEqual(1);
  });
});

describe('withdrawal order', () => {
  const rows = runSimulation(baseInputs());
  const retired = rows.filter(r => r.isRetired);

  it('draws from pre-tax before touching brokerage or Roth', () => {
    const first = retired[0];
    expect(first.withdrawals.userPreTax).toBeGreaterThan(0);
    expect(first.withdrawals.userBrokerage).toBe(0);
    expect(first.withdrawals.userRoth).toBe(0);
    expect(first.withdrawals.spouseRoth).toBe(0);
  });

  it('draws from the older spouse first', () => {
    // User (52) is older than spouse (47), so the user's pre-tax goes first
    // and the spouse's stays untouched while the user's balance remains.
    const first = retired[0];
    expect(first.withdrawals.userPreTax).toBeGreaterThan(0);
    expect(first.withdrawals.spousePreTax).toBe(0);
  });

  it('does not spill sub-dollar amounts into the next account', () => {
    // Regression: the iterative gross-up converges to within ~$1, and that
    // residual used to trigger spurious ~$1 withdrawals from the next account.
    for (const r of retired) {
      if (r.userAge >= 73) break;            // RMDs legitimately start at 73
      if (r.balances.userPreTax > 0) {
        expect(r.withdrawals.spousePreTax, `age ${r.userAge}`).toBe(0);
      }
    }
  });

  it('leaves Roth untouched while other accounts still have money', () => {
    for (const r of retired) {
      const hasOther =
        r.balances.userPreTax > 0 || r.balances.spousePreTax > 0 ||
        r.balances.userBrokerage > 0 || r.balances.spouseBrokerage > 0;
      if (hasOther) {
        expect(r.withdrawals.userRoth, `age ${r.userAge}`).toBe(0);
      }
    }
  });
});

describe('required minimum distributions', () => {
  it('takes no RMD before age 73', () => {
    // Ample outside income means nothing needs to be withdrawn voluntarily.
    const rows = runSimulation(baseInputs({
      monthlyExpenses: 1000, annualTravelMisc: 0, otherAnnualIncome: 200000,
      otherIncomeStartAge: 60,
    }));
    const before73 = rows.filter(r => r.isRetired && r.userAge < 73);
    for (const r of before73) {
      expect(r.withdrawals.userPreTax, `age ${r.userAge}`).toBe(0);
    }
  });

  it('forces a pre-tax withdrawal at 73 even when income covers expenses', () => {
    const rows = runSimulation(baseInputs({
      monthlyExpenses: 1000, annualTravelMisc: 0, otherAnnualIncome: 200000,
      otherIncomeStartAge: 60,
    }));
    const at73 = rows.find(r => r.userAge === 73);
    expect(at73.withdrawals.userPreTax).toBeGreaterThan(0);
    expect(at73.rmdForced.userPreTax).toBe(true);
  });

  it('sweeps the after-tax RMD surplus into the same person\'s brokerage', () => {
    const rows = runSimulation(baseInputs({
      monthlyExpenses: 1000, annualTravelMisc: 0, otherAnnualIncome: 200000,
      otherIncomeStartAge: 60,
    }));
    const at72 = rows.find(r => r.userAge === 72);
    const at73 = rows.find(r => r.userAge === 73);
    // Brokerage grows 7% on its own; the RMD surplus must push it higher still.
    expect(at73.balances.userBrokerage).toBeGreaterThan(at72.balances.userBrokerage * 1.07);
  });
});

describe('depletion and deficit', () => {
  // Spending far beyond the portfolio's capacity.
  const rows = runSimulation(baseInputs({
    userPreTax: 200000, userRoth: 20000, userBrokerage: 10000,
    spousePreTax: 100000, spouseRoth: 10000, spouseBrokerage: 10000,
    monthlyExpenses: 20000, annualTravelMisc: 50000,
  }));

  it('eventually drives the portfolio negative', () => {
    expect(totalBalance(rows[rows.length - 1])).toBeLessThan(0);
  });

  it('only goes negative once every other account is exhausted', () => {
    for (const r of rows) {
      const negatives = Object.entries(r.balances).filter(([, v]) => v < 0);
      if (negatives.length === 0) continue;
      // Every account that is not the deficit account must be empty.
      for (const [name, value] of Object.entries(r.balances)) {
        if (value < 0) continue;
        expect(value, `${name} at age ${r.userAge}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('carries the deficit forward so it worsens each year', () => {
    const negativeYears = rows.filter(r => totalBalance(r) < 0);
    expect(negativeYears.length).toBeGreaterThan(1);
    for (let i = 1; i < negativeYears.length; i++) {
      expect(totalBalance(negativeYears[i]))
        .toBeLessThan(totalBalance(negativeYears[i - 1]));
    }
  });

  it('flags the account holding the deficit', () => {
    const flagged = rows.find(r => r.deficitAcct);
    expect(flagged).toBeDefined();
    expect(flagged.balances[flagged.deficitAcct]).toBeLessThan(0);
  });
});

describe('income, taxes and expenses', () => {
  const rows = runSimulation(baseInputs({
    otherAnnualIncome: 35000, otherIncomeStartAge: 62,
  }));

  it('starts Social Security at the specified age', () => {
    expect(rows.find(r => r.userAge === 66).ssIncome).toBe(0);
    expect(rows.find(r => r.userAge === 67).ssIncome).toBeGreaterThan(0);
  });

  it('inflates Social Security only from the year after it starts', () => {
    const at67 = rows.find(r => r.userAge === 67);
    const at68 = rows.find(r => r.userAge === 68);
    // Only the user is 67 in that first year; the spouse is still 62.
    expect(at67.ssIncome).toBe(3000 * 12);
    expect(at68.ssIncome).toBeGreaterThan(at67.ssIncome);
  });

  it('starts other income at the specified age and inflates it thereafter', () => {
    expect(rows.find(r => r.userAge === 61).otherIncome).toBe(0);
    expect(rows.find(r => r.userAge === 62).otherIncome).toBe(35000);
    expect(rows.find(r => r.userAge === 63).otherIncome).toBe(35700); // +2%
  });

  it('inflates expenses from the retirement year', () => {
    const at60 = rows.find(r => r.userAge === 60);
    const at61 = rows.find(r => r.userAge === 61);
    expect(at60.totalExpenses).toBe(8000 * 12 + 10000);
    expect(at61.totalExpenses).toBe(Math.ceil(at60.totalExpenses * 1.02));
  });

  it('splits taxes into federal and state components that sum to the total', () => {
    for (const r of rows.filter(r => r.isRetired)) {
      const sum = r.federalTax + r.stateTax;
      expect(Math.abs(sum - r.taxesPaid), `age ${r.userAge}`).toBeLessThanOrEqual(2);
    }
  });

  it('charges no state tax in a state without income tax', () => {
    const tx = runSimulation(baseInputs({ stateCode: 'TX' }));
    for (const r of tx.filter(r => r.isRetired)) {
      expect(r.stateTax, `age ${r.userAge}`).toBe(0);
    }
  });

  it('costs more in total tax in California than in Texas', () => {
    const ca = runSimulation(baseInputs({ stateCode: 'CA' }));
    const tx = runSimulation(baseInputs({ stateCode: 'TX' }));
    const sum = rs => rs.reduce((a, r) => a + r.taxesPaid, 0);
    expect(sum(ca)).toBeGreaterThan(sum(tx));
  });
});

describe('output formatting', () => {
  it('reports every monetary figure as a whole dollar amount', () => {
    const rows = runSimulation(baseInputs());
    for (const r of rows) {
      for (const v of Object.values(r.balances)) {
        expect(Number.isInteger(v)).toBe(true);
      }
      for (const v of Object.values(r.withdrawals)) {
        expect(Number.isInteger(v)).toBe(true);
      }
      expect(Number.isInteger(r.ssIncome)).toBe(true);
      expect(Number.isInteger(r.taxesPaid)).toBe(true);
    }
  });
});
