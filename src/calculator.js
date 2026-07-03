import { calcTotalTax, grossUpPreTax, baseIncomeTax, grossUpBrokerage, brokerageTax } from './taxRates.js';

// RMD divisors by age (IRS Uniform Lifetime Table)
const RMD_TABLE = {
  72:27.4,73:26.5,74:25.5,75:24.6,76:23.7,77:22.9,78:22.0,79:21.1,
  80:20.2,81:19.4,82:18.5,83:17.7,84:16.8,85:16.0,86:15.2,87:14.4,
  88:13.7,89:12.9,90:12.2,91:11.5,92:10.8,93:10.1,94:9.5,95:8.9,
  96:8.4,97:7.8,98:7.3,99:6.8,100:6.4,
};

function getRMD(balance, age) {
  const divisor = RMD_TABLE[Math.min(Math.floor(age), 100)];
  if (!divisor || age < 73) return 0;
  return balance / divisor;
}

// Round every reported amount UP to a whole dollar (no cents). Rounds the
// magnitude away from zero so negative (depleted) balances round up too.
function fmt(n) { return Math.sign(n) * Math.ceil(Math.abs(n)); }

// Sub-dollar residuals from the iterative pre-tax gross-up (which converges to
// within ~$1) shouldn't spill into the next account. Treat anything at or below
// this threshold as fully covered.
const EPS = 1;

export function runSimulation(inputs) {
  const {
    userAge, spouseAge,
    retirementAge,
    // balances: { userPreTax, userRoth, userBrokerage, spousePreTax, spouseRoth, spouseBrokerage }
    userPreTax, userRoth, userBrokerage,
    spousePreTax, spouseRoth, spouseBrokerage,
    // monthly contributions
    userPreTaxContrib, userRothContrib, userBrokerageContrib,
    spousePreTaxContrib, spouseRothContrib, spouseBrokerageContrib,
    // growth before retirement
    preTaxGrowthPre, rothGrowthPre, brokerageGrowthPre,
    // growth during retirement
    preTaxGrowthRet, rothGrowthRet, brokerageGrowthRet,
    // SS
    userSSMonthly, userSSStartAge,
    spouseSSMonthly, spouseSSStartAge,
    // other income
    otherAnnualIncome, otherIncomeStartAge,
    // expenses
    monthlyExpenses, annualTravelMisc, inflationRate,
    // state
    stateCode,
  } = inputs;

  // Single filer when no spouse age is provided. In single mode the spouse's
  // accounts, contributions, and Social Security are ignored entirely, and the
  // simulation runs until the user turns 90.
  const single = spouseAge === '' || spouseAge === null || spouseAge === undefined
    || isNaN(Number(spouseAge));
  const status = single ? 'single' : 'mfj';

  const ageDiff = single ? 0 : Number(userAge) - Number(spouseAge); // +ve if user older
  // Run until the youngest person reaches 90 (just the user when single).
  const endUserAge = single ? 90 : (Number(spouseAge) <= Number(userAge) ? 90 + ageDiff : 90);

  let balances = {
    userPreTax: Number(userPreTax),
    userRoth: Number(userRoth),
    userBrokerage: Number(userBrokerage),
    spousePreTax: single ? 0 : Number(spousePreTax),
    spouseRoth: single ? 0 : Number(spouseRoth),
    spouseBrokerage: single ? 0 : Number(spouseBrokerage),
  };

  const rows = [];
  const currentYear = new Date().getFullYear();

  // The account that holds the running deficit once everything is depleted — set
  // to the account that gave the last positive withdrawal, and persisted across
  // years so the negative keeps compounding in the same place.
  let deficitAcct = null;

  for (let ua = Number(userAge); ua <= endUserAge; ua++) {
    const sa = ua - ageDiff; // spouse age this year
    const year = currentYear + (ua - userAge);
    const isRetired = ua >= Number(retirementAge);

    // --- ACCUMULATION PHASE ---
    if (!isRetired) {
      // The current-age row shows balances exactly as entered. Growth and new
      // contributions begin the FOLLOWING year and compound from there.
      if (ua > Number(userAge)) {
        // grow all accounts
        balances.userPreTax    *= (1 + preTaxGrowthPre / 100);
        balances.userRoth      *= (1 + rothGrowthPre / 100);
        balances.userBrokerage *= (1 + brokerageGrowthPre / 100);
        balances.spousePreTax    *= (1 + preTaxGrowthPre / 100);
        balances.spouseRoth      *= (1 + rothGrowthPre / 100);
        balances.spouseBrokerage *= (1 + brokerageGrowthPre / 100);

        // add contributions (annual)
        balances.userPreTax    += userPreTaxContrib * 12;
        balances.userRoth      += userRothContrib * 12;
        balances.userBrokerage += userBrokerageContrib * 12;
        if (!single) {
          balances.spousePreTax    += spousePreTaxContrib * 12;
          balances.spouseRoth      += spouseRothContrib * 12;
          balances.spouseBrokerage += spouseBrokerageContrib * 12;
        }
      }

      rows.push({
        userAge: ua, spouseAge: sa, year, isRetired: false,
        withdrawals: { userPreTax:0, userRoth:0, userBrokerage:0, spousePreTax:0, spouseRoth:0, spouseBrokerage:0 },
        balances: { ...balances },
        ssIncome: 0, otherIncome: 0, taxesPaid: 0, totalExpenses: 0,
      });
      continue;
    }

    // --- RETIREMENT PHASE ---
    // Grow accounts at retirement rates. A negative (depleted) brokerage balance
    // compounds at the brokerage rate too — modeling the shortfall as borrowed
    // money whose cost grows over time, so the deficit accelerates year over year
    // (a clear signal to adjust savings/spending or consider a reverse mortgage).
    const grow = (bal, rate) => bal * (1 + rate / 100);
    balances.userPreTax      = grow(balances.userPreTax, preTaxGrowthRet);
    balances.userRoth        = grow(balances.userRoth, rothGrowthRet);
    balances.userBrokerage   = grow(balances.userBrokerage, brokerageGrowthRet);
    balances.spousePreTax    = grow(balances.spousePreTax, preTaxGrowthRet);
    balances.spouseRoth      = grow(balances.spouseRoth, rothGrowthRet);
    balances.spouseBrokerage = grow(balances.spouseBrokerage, brokerageGrowthRet);

    // income — SS and other income grow with inflation starting the year AFTER they begin.
    // In the start year the factor is 1; each subsequent year compounds by inflation.
    const inflRate = inflationRate / 100;
    const userSS = ua >= Number(userSSStartAge)
      ? Number(userSSMonthly) * 12 * Math.pow(1 + inflRate, ua - Number(userSSStartAge))
      : 0;
    const spouseSS = (!single && sa >= Number(spouseSSStartAge))
      ? Number(spouseSSMonthly) * 12 * Math.pow(1 + inflRate, sa - Number(spouseSSStartAge))
      : 0;
    const totalSS = userSS + spouseSS;
    const other = ua >= Number(otherIncomeStartAge)
      ? Number(otherAnnualIncome) * Math.pow(1 + inflRate, ua - Number(otherIncomeStartAge))
      : 0;

    // expenses (inflation-adjusted from retirement start)
    const yearsRetired = ua - Number(retirementAge);
    const inflFactor = Math.pow(1 + inflationRate / 100, yearsRetired);
    const annualExpenses = (Number(monthlyExpenses) * 12 + Number(annualTravelMisc)) * inflFactor;

    // Tax owed on SS + other income alone (must be funded even if no pre-tax
    // withdrawals happen this year). Treated as an expense added to the gap.
    const baseTax = baseIncomeTax(totalSS, other, stateCode, status);

    // gap = after-tax expenses + base-income tax, less after-tax income received.
    // Pre-tax withdrawals below are grossed up only for their MARGINAL tax, so the
    // base-income tax is counted exactly once (here).
    let gap = annualExpenses + baseTax - totalSS - other;

    const withdrawals = {
      userPreTax: 0, userRoth: 0, userBrokerage: 0,
      spousePreTax: 0, spouseRoth: 0, spouseBrokerage: 0,
    };
    let taxesPaid = baseTax;

    // RMD handling
    const userRMD   = getRMD(balances.userPreTax, ua);
    const spouseRMD = getRMD(balances.spousePreTax, sa);

    // Helper: withdraw from pre-tax (oldest first = user first if user older, else spouse first)
    const userOlderOrEqual = ua >= sa;

    // Running total of pre-tax dollars withdrawn this year — used so each new
    // pre-tax withdrawal (RMD or discretionary) is taxed at the correct marginal rate.
    let cumPreTax = 0;
    // Capital-gains tax accumulated from brokerage withdrawals this year (split).
    let capGainsTaxFed = 0;
    let capGainsTaxState = 0;
    // The last account a positive amount was actually withdrawn from this year.
    let lastPosAcct = null;

    function withdrawPreTax(needed) {
      // determine order: oldest first
      const order = userOlderOrEqual
        ? ['userPreTax', 'spousePreTax']
        : ['spousePreTax', 'userPreTax'];

      for (const acct of order) {
        if (needed <= EPS) break;  // ignore sub-dollar gross-up residuals
        const avail = balances[acct];
        if (avail <= EPS) continue;  // treat sub-dollar balances as empty
        const gross = grossUpPreTax(Math.min(needed, avail * 0.9), totalSS, other, stateCode, cumPreTax, status);
        const actual = Math.min(avail, gross);
        const marginalTax = calcTotalTax(cumPreTax + actual, totalSS, other, stateCode, status).total
                          - calcTotalTax(cumPreTax, totalSS, other, stateCode, status).total;
        const afterTax = actual - marginalTax;
        withdrawals[acct] += actual;
        balances[acct] -= actual;
        cumPreTax += actual;
        if (actual > EPS) lastPosAcct = acct;
        needed -= afterTax;
      }
      return needed;
    }

    function withdrawBrokerage(needed) {
      const order = userOlderOrEqual
        ? ['userBrokerage', 'spouseBrokerage']
        : ['spouseBrokerage', 'userBrokerage'];
      for (const acct of order) {
        if (needed <= EPS) break;  // ignore sub-dollar residuals
        const avail = balances[acct];
        if (avail <= EPS) continue;  // treat sub-dollar balances as empty
        // Gross up so the net (after cap-gains tax) covers what's needed,
        // but never withdraw more than the account holds. cumPreTax gives the
        // ordinary-income context for the correct LTCG + state marginal rate.
        const { gross } = grossUpBrokerage(needed, cumPreTax, totalSS, other, stateCode, status);
        const actual = Math.min(avail, gross);
        const t = brokerageTax(actual, cumPreTax, totalSS, other, stateCode, status);
        withdrawals[acct] += actual;
        balances[acct] -= actual;
        capGainsTaxFed += t.federal;
        capGainsTaxState += t.state;
        if (actual > EPS) lastPosAcct = acct;
        needed -= (actual - t.total);
      }
      return needed;
    }

    function withdrawRoth(needed) {
      const order = userOlderOrEqual
        ? ['userRoth', 'spouseRoth']
        : ['spouseRoth', 'userRoth'];
      for (const acct of order) {
        if (needed <= EPS) break;  // ignore sub-dollar residuals
        const avail = balances[acct];
        if (avail <= EPS) continue;  // treat sub-dollar balances as empty
        const take = Math.min(avail, needed);
        withdrawals[acct] += take;
        balances[acct] -= take;
        if (take > EPS) lastPosAcct = acct;
        needed -= take;
      }
      return needed;
    }

    // Process RMDs first (mandatory minimums). Marginal tax is computed on top of
    // any pre-tax already withdrawn this year (cumPreTax). `rmdForced` flags years
    // where an RMD pulled out MORE than was needed for expenses (surplus swept to
    // brokerage) — i.e. a taxable withdrawal the user didn't choose.
    const rmdForced = { userPreTax: false, spousePreTax: false };
    function processRMD(rmd, preTaxAcct, brokerageAcct) {
      if (rmd <= EPS || balances[preTaxAcct] <= EPS) return;  // ignore sub-dollar RMDs/balances
      const rmdGross = Math.min(rmd, balances[preTaxAcct]);
      const marginalTax = calcTotalTax(cumPreTax + rmdGross, totalSS, other, stateCode, status).total
                        - calcTotalTax(cumPreTax, totalSS, other, stateCode, status).total;
      const rmdAfterTax = rmdGross - marginalTax;
      withdrawals[preTaxAcct] += rmdGross;
      balances[preTaxAcct] -= rmdGross;
      cumPreTax += rmdGross;
      if (rmdAfterTax > gap) {
        // surplus RMD after-tax goes to same person's brokerage
        const surplus = rmdAfterTax - Math.max(gap, 0);
        balances[brokerageAcct] += surplus;
        if (surplus > EPS) rmdForced[preTaxAcct] = true;  // only flag a real surplus
        gap = 0;
      } else {
        gap -= rmdAfterTax;
      }
    }
    processRMD(userRMD, 'userPreTax', 'userBrokerage');
    processRMD(spouseRMD, 'spousePreTax', 'spouseBrokerage');

    // Cover remaining gap
    if (gap > EPS) gap = withdrawPreTax(gap);
    if (gap > EPS) gap = withdrawBrokerage(gap);
    if (gap > EPS) gap = withdrawRoth(gap);

    // If still gap (all accounts empty), the shortfall goes negative in the
    // account that gave the last positive withdrawal (or, once already in
    // deficit and nothing positive was withdrawn, the persisted deficit account).
    let deficitThisYear = null;
    if (gap > EPS) {
      const target = lastPosAcct || deficitAcct
        || (userOlderOrEqual ? 'userBrokerage' : 'spouseBrokerage');
      withdrawals[target] += gap;
      balances[target] -= gap;
      deficitAcct = target;
      deficitThisYear = target;
    }

    // Total tax for the year, split into federal and state = ordinary income tax
    // (pre-tax withdrawals + SS + other) plus capital-gains tax from brokerage.
    const ordTax = calcTotalTax(cumPreTax, totalSS, other, stateCode, status);
    const federalTax = ordTax.federalTax + capGainsTaxFed;
    const stateTax = ordTax.stateTax + capGainsTaxState;
    taxesPaid = federalTax + stateTax;

    rows.push({
      userAge: ua, spouseAge: sa, year, isRetired: true,
      rmdForced,
      deficitAcct: deficitThisYear,
      withdrawals: {
        userPreTax: fmt(withdrawals.userPreTax),
        userRoth: fmt(withdrawals.userRoth),
        userBrokerage: fmt(withdrawals.userBrokerage),
        spousePreTax: fmt(withdrawals.spousePreTax),
        spouseRoth: fmt(withdrawals.spouseRoth),
        spouseBrokerage: fmt(withdrawals.spouseBrokerage),
      },
      balances: {
        userPreTax: fmt(balances.userPreTax),
        userRoth: fmt(balances.userRoth),
        userBrokerage: fmt(balances.userBrokerage),
        spousePreTax: fmt(balances.spousePreTax),
        spouseRoth: fmt(balances.spouseRoth),
        spouseBrokerage: fmt(balances.spouseBrokerage),
      },
      ssIncome: fmt(totalSS),
      otherIncome: fmt(other),
      taxesPaid: fmt(taxesPaid),
      federalTax: fmt(federalTax),
      stateTax: fmt(stateTax),
      totalExpenses: fmt(annualExpenses),
    });
  }

  return rows;
}
