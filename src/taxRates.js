// =============================================================================
// 2026 TAX DATA — sourced from IRS and the Tax Foundation (tax year 2026).
//   Federal & state brackets, standard deductions, LTCG, SS rules for BOTH
//   filing statuses: Married Filing Jointly ('mfj') and Single ('single').
//   States that tax Social Security (2026): CO, CT, MN, MT, NM, RI, UT, VT.
//   Refresh annually when new rates post.
//
// DOCUMENTED SIMPLIFICATIONS (surfaced in the app's assumptions panel):
//   - Filing status is MFJ when a spouse age is entered, otherwise Single.
//   - Local/city income taxes (NYC, MD counties, IN/OH local) are NOT modeled.
//   - For the 8 states that tax SS, the federally-taxable SS amount is included in
//     state income; those states' age/income SS exemptions are NOT modeled.
//   - Brokerage: 50% of each withdrawal is assumed to be taxable long-term gain.
//   - State capital gains taxed as ordinary income; WA's separate cap-gains tax
//     is not modeled.
// =============================================================================

// ---- Federal (2026) ---------------------------------------------------------
export const FEDERAL = {
  mfj: {
    brackets: [[0,0.10],[24800,0.12],[100800,0.22],[211400,0.24],[403550,0.32],[512450,0.35],[768700,0.37]],
    std: 32200,
    ltcg: [[0,0.00],[98900,0.15],[613700,0.20]],
  },
  single: {
    brackets: [[0,0.10],[12400,0.12],[50400,0.22],[105700,0.24],[201775,0.32],[256225,0.35],[640600,0.37]],
    std: 16100,
    ltcg: [[0,0.00],[49450,0.15],[545500,0.20]],
  },
};

// Social Security provisional-income thresholds (federal rule; NOT inflation-indexed).
export const SS_THRESHOLDS = {
  mfj:    { lower: 32000, upper: 44000 },
  single: { lower: 25000, upper: 34000 },
};

export const BROKERAGE_GAIN_FRACTION = 0.5;

// Net Investment Income Tax (ACA): 3.8% on net investment income once MAGI is
// over the threshold. Thresholds are NOT inflation-indexed.
export const NIIT_RATE = 0.038;
export const NIIT_THRESHOLD = { mfj: 250000, single: 200000 };

// ---- State data (2026) ------------------------------------------------------
// Each state has `mfj` and `single` { brackets, std }. brackets: ascending
// [min, rate]; empty => no income tax. taxesSS: whether the state taxes SS.
export const STATE_TAX = {
  AL: { taxesSS:false, mfj:{brackets:[[0,0.02],[1000,0.04],[6000,0.05]],std:8500}, single:{brackets:[[0,0.02],[500,0.04],[3000,0.05]],std:3000} },
  AK: { taxesSS:false, mfj:{brackets:[],std:0}, single:{brackets:[],std:0} },
  AZ: { taxesSS:false, mfj:{brackets:[[0,0.025]],std:16700}, single:{brackets:[[0,0.025]],std:8350} },
  AR: { taxesSS:false, mfj:{brackets:[[0,0.02],[4600,0.039]],std:4940}, single:{brackets:[[0,0.02],[4600,0.039]],std:2470} },
  // CA: brackets are 2026 (FTB indexing factor 2.971%). Standard deduction was
  // corrected from the 2025 values ($5,540 / $11,080) to 2026 ($5,706 / $11,412).
  // NOTE: FTB had not published official 2026 rate schedules as of 2026-08; these
  // come from the announced indexing factor applied to the 2025 schedule.
  CA: { taxesSS:false, mfj:{brackets:[[0,0.01],[22158,0.02],[52528,0.04],[82904,0.06],[115084,0.08],[145448,0.093],[742958,0.103],[891542,0.113],[1000000,0.123],[1485906,0.133]],std:11412}, single:{brackets:[[0,0.01],[11079,0.02],[26264,0.04],[41452,0.06],[57542,0.08],[72724,0.093],[371479,0.103],[445771,0.113],[742953,0.123],[1000000,0.133]],std:5706} },
  CO: { taxesSS:true,  mfj:{brackets:[[0,0.044]],std:32200}, single:{brackets:[[0,0.044]],std:16100} },
  CT: { taxesSS:true,  mfj:{brackets:[[0,0.02],[20000,0.045],[100000,0.055],[200000,0.06],[400000,0.065],[500000,0.069],[1000000,0.0699]],std:0}, single:{brackets:[[0,0.02],[10000,0.045],[50000,0.055],[100000,0.06],[200000,0.065],[250000,0.069],[500000,0.0699]],std:0} },
  DE: { taxesSS:false, mfj:{brackets:[[0,0],[2000,0.022],[5000,0.039],[10000,0.048],[20000,0.052],[25000,0.0555],[60000,0.066]],std:6500}, single:{brackets:[[0,0],[2000,0.022],[5000,0.039],[10000,0.048],[20000,0.052],[25000,0.0555],[60000,0.066]],std:3250} },
  FL: { taxesSS:false, mfj:{brackets:[],std:0}, single:{brackets:[],std:0} },
  // GA: HB 463 (signed 2026-05-11, retroactive to 2026-01-01) cut the flat rate
  // from 5.19% to 4.99% and raised the standard deduction to $30k MFJ / $15k single.
  GA: { taxesSS:false, mfj:{brackets:[[0,0.0499]],std:30000}, single:{brackets:[[0,0.0499]],std:15000} },
  HI: { taxesSS:false, mfj:{brackets:[[0,0.014],[19200,0.032],[28800,0.055],[38400,0.064],[48000,0.068],[72000,0.072],[96000,0.076],[250000,0.079],[350000,0.0825],[450000,0.09],[550000,0.10],[650000,0.11]],std:8800}, single:{brackets:[[0,0.014],[9600,0.032],[14400,0.055],[19200,0.064],[24000,0.068],[36000,0.072],[48000,0.076],[125000,0.079],[175000,0.0825],[225000,0.09],[275000,0.10],[325000,0.11]],std:4400} },
  ID: { taxesSS:false, mfj:{brackets:[[0,0],[9622,0.053]],std:32200}, single:{brackets:[[0,0],[4811,0.053]],std:16100} },
  IL: { taxesSS:false, mfj:{brackets:[[0,0.0495]],std:0}, single:{brackets:[[0,0.0495]],std:0} },
  IN: { taxesSS:false, mfj:{brackets:[[0,0.0295]],std:0}, single:{brackets:[[0,0.0295]],std:0} },
  IA: { taxesSS:false, mfj:{brackets:[[0,0.038]],std:32200}, single:{brackets:[[0,0.038]],std:16100} },
  KS: { taxesSS:false, mfj:{brackets:[[0,0.052],[46000,0.0558]],std:8240}, single:{brackets:[[0,0.052],[23000,0.0558]],std:3605} },
  KY: { taxesSS:false, mfj:{brackets:[[0,0.035]],std:3360}, single:{brackets:[[0,0.035]],std:3360} },
  LA: { taxesSS:false, mfj:{brackets:[[0,0.03]],std:25750}, single:{brackets:[[0,0.03]],std:12875} },
  ME: { taxesSS:false, mfj:{brackets:[[0,0.058],[54849,0.0675],[129749,0.0715]],std:16700}, single:{brackets:[[0,0.058],[27399,0.0675],[64849,0.0715]],std:8350} },
  MD: { taxesSS:false, mfj:{brackets:[[0,0.02],[1000,0.03],[2000,0.04],[3000,0.0475],[150000,0.05],[175000,0.0525],[225000,0.055],[300000,0.0575],[600000,0.0625],[1200000,0.065]],std:6700}, single:{brackets:[[0,0.02],[1000,0.03],[2000,0.04],[3000,0.0475],[100000,0.05],[125000,0.0525],[150000,0.055],[250000,0.0575],[500000,0.0625],[1000000,0.065]],std:3350} },
  MA: { taxesSS:false, mfj:{brackets:[[0,0.05],[1083150,0.09]],std:0}, single:{brackets:[[0,0.05],[1083150,0.09]],std:0} },
  MI: { taxesSS:false, mfj:{brackets:[[0,0.0425]],std:0}, single:{brackets:[[0,0.0425]],std:0} },
  MN: { taxesSS:true,  mfj:{brackets:[[0,0.0535],[48700,0.068],[193480,0.0785],[337930,0.0985]],std:30600}, single:{brackets:[[0,0.0535],[33310,0.068],[109430,0.0785],[203150,0.0985]],std:15300} },
  MS: { taxesSS:false, mfj:{brackets:[[0,0],[10000,0.04]],std:4600}, single:{brackets:[[0,0],[10000,0.04]],std:2300} },
  MO: { taxesSS:false, mfj:{brackets:[[0,0],[1348,0.02],[2696,0.025],[4044,0.03],[5392,0.035],[6740,0.04],[8088,0.045],[9436,0.047]],std:32200}, single:{brackets:[[0,0],[1348,0.02],[2696,0.025],[4044,0.03],[5392,0.035],[6740,0.04],[8088,0.045],[9436,0.047]],std:16100} },
  MT: { taxesSS:true,  mfj:{brackets:[[0,0.047],[95000,0.0565]],std:32200}, single:{brackets:[[0,0.047],[47500,0.0565]],std:16100} },
  NE: { taxesSS:false, mfj:{brackets:[[0,0.0246],[8250,0.0351],[49530,0.0455]],std:17700}, single:{brackets:[[0,0.0246],[4130,0.0351],[24760,0.0455]],std:8850} },
  NV: { taxesSS:false, mfj:{brackets:[],std:0}, single:{brackets:[],std:0} },
  NH: { taxesSS:false, mfj:{brackets:[],std:0}, single:{brackets:[],std:0} },
  NJ: { taxesSS:false, mfj:{brackets:[[0,0.014],[20000,0.0175],[50000,0.0245],[70000,0.035],[80000,0.0553],[150000,0.0637],[500000,0.0897],[1000000,0.1075]],std:0}, single:{brackets:[[0,0.014],[20000,0.0175],[35000,0.035],[40000,0.0553],[75000,0.0637],[500000,0.0897],[1000000,0.1075]],std:0} },
  NM: { taxesSS:true,  mfj:{brackets:[[0,0.015],[8000,0.032],[25000,0.043],[50000,0.047],[100000,0.049],[315000,0.059]],std:32200}, single:{brackets:[[0,0.015],[5500,0.032],[16500,0.043],[33500,0.047],[66500,0.049],[210000,0.059]],std:16100} },
  NY: { taxesSS:false, mfj:{brackets:[[0,0.039],[17150,0.044],[23600,0.0515],[27900,0.054],[161550,0.059],[323200,0.0685],[2155350,0.0965],[5000000,0.103],[25000000,0.109]],std:16050}, single:{brackets:[[0,0.039],[8500,0.044],[11700,0.0515],[13900,0.054],[80650,0.059],[215400,0.0685],[1077550,0.0965],[5000000,0.103],[25000000,0.109]],std:8000} },
  NC: { taxesSS:false, mfj:{brackets:[[0,0.0399]],std:25500}, single:{brackets:[[0,0.0399]],std:12750} },
  ND: { taxesSS:false, mfj:{brackets:[[0,0],[80975,0.0195],[298075,0.025]],std:32200}, single:{brackets:[[0,0],[48475,0.0195],[244825,0.025]],std:16100} },
  OH: { taxesSS:false, mfj:{brackets:[[0,0],[26050,0.0275]],std:0}, single:{brackets:[[0,0],[26050,0.0275]],std:0} },
  OK: { taxesSS:false, mfj:{brackets:[[0,0],[7500,0.025],[9800,0.035],[14400,0.045]],std:12700}, single:{brackets:[[0,0],[3750,0.025],[4900,0.035],[7200,0.045]],std:6350} },
  OR: { taxesSS:false, mfj:{brackets:[[0,0.0475],[9100,0.0675],[22800,0.0875],[250000,0.099]],std:5820}, single:{brackets:[[0,0.0475],[4550,0.0675],[11400,0.0875],[125000,0.099]],std:2910} },
  PA: { taxesSS:false, mfj:{brackets:[[0,0.0307]],std:0}, single:{brackets:[[0,0.0307]],std:0} },
  RI: { taxesSS:true,  mfj:{brackets:[[0,0.0375],[82050,0.0475],[186450,0.0599]],std:22400}, single:{brackets:[[0,0.0375],[82050,0.0475],[186450,0.0599]],std:11200} },
  SC: { taxesSS:false, mfj:{brackets:[[0,0],[3640,0.03],[18230,0.06]],std:16700}, single:{brackets:[[0,0],[3640,0.03],[18230,0.06]],std:8350} },
  SD: { taxesSS:false, mfj:{brackets:[],std:0}, single:{brackets:[],std:0} },
  TN: { taxesSS:false, mfj:{brackets:[],std:0}, single:{brackets:[],std:0} },
  TX: { taxesSS:false, mfj:{brackets:[],std:0}, single:{brackets:[],std:0} },
  UT: { taxesSS:true,  mfj:{brackets:[[0,0.045]],std:0}, single:{brackets:[[0,0.045]],std:0} },
  VT: { taxesSS:true,  mfj:{brackets:[[0,0.0335],[82500,0.066],[199450,0.076],[304000,0.0875]],std:15300}, single:{brackets:[[0,0.0335],[49400,0.066],[119700,0.076],[249700,0.0875]],std:7650} },
  VA: { taxesSS:false, mfj:{brackets:[[0,0.02],[3000,0.03],[5000,0.05],[17000,0.0575]],std:17500}, single:{brackets:[[0,0.02],[3000,0.03],[5000,0.05],[17000,0.0575]],std:8750} },
  WA: { taxesSS:false, mfj:{brackets:[],std:0}, single:{brackets:[],std:0} },
  WV: { taxesSS:false, mfj:{brackets:[[0,0.0222],[10000,0.0296],[25000,0.0333],[40000,0.0444],[60000,0.0482]],std:0}, single:{brackets:[[0,0.0222],[10000,0.0296],[25000,0.0333],[40000,0.0444],[60000,0.0482]],std:0} },
  WI: { taxesSS:false, mfj:{brackets:[[0,0.035],[20150,0.044],[69260,0.053],[443630,0.0765]],std:25840}, single:{brackets:[[0,0.035],[15110,0.044],[51950,0.053],[332720,0.0765]],std:13960} },
  WY: { taxesSS:false, mfj:{brackets:[],std:0}, single:{brackets:[],std:0} },
  DC: { taxesSS:false, mfj:{brackets:[[0,0.04],[10000,0.06],[40000,0.065],[60000,0.085],[250000,0.0925],[500000,0.0975],[1000000,0.1075]],std:32200}, single:{brackets:[[0,0.04],[10000,0.06],[40000,0.065],[60000,0.085],[250000,0.0925],[500000,0.0975],[1000000,0.1075]],std:16100} },
};

// ---- Progressive tax helpers ------------------------------------------------
function progressiveTax(taxableIncome, brackets) {
  if (taxableIncome <= 0 || !brackets.length) return 0;
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const [min, rate] = brackets[i];
    if (taxableIncome <= min) break;
    const next = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    tax += (Math.min(taxableIncome, next) - min) * rate;
  }
  return tax;
}

export function calcFederalTax(taxableIncome, status = 'mfj') {
  return progressiveTax(taxableIncome, FEDERAL[status].brackets);
}

function stateMarginalRate(stateTaxable, brackets) {
  if (!brackets.length || stateTaxable <= 0) return 0;
  let rate = 0;
  for (const [min, r] of brackets) {
    if (stateTaxable > min) rate = r; else break;
  }
  return rate;
}

function fedLTCGRate(ordinaryTaxable, status = 'mfj') {
  let rate = 0;
  for (const [min, r] of FEDERAL[status].ltcg) {
    if (ordinaryTaxable >= min) rate = r; else break;
  }
  return rate;
}

// SS taxation: up to 85% of SS is taxable based on provisional income.
export function taxableSS(ssIncome, otherIncome, status = 'mfj') {
  const { lower, upper } = SS_THRESHOLDS[status];
  const provisional = otherIncome + ssIncome * 0.5;
  if (provisional <= lower) return 0;

  // Middle band: the lesser of 50% of the excess over the lower threshold,
  // or 50% of the benefit itself.
  if (provisional <= upper) {
    return Math.min(0.5 * ssIncome, 0.5 * (provisional - lower));
  }

  // Upper band: 85% of the excess over the upper threshold, plus the amount
  // carried over from the middle band — capped at 85% of the benefit. At least
  // 15% of Social Security is always federally tax-free, by law.
  const midCap = Math.min(0.5 * ssIncome, 0.5 * (upper - lower));
  return Math.min(0.85 * ssIncome, midCap + 0.85 * (provisional - upper));
}

function stateInfo(stateCode) {
  return STATE_TAX[stateCode?.toUpperCase()]
    ?? { taxesSS: false, mfj: { brackets: [], std: 0 }, single: { brackets: [], std: 0 } };
}

// ---- Ordinary-income tax (pre-tax withdrawals + other income + taxable SS) ---
export function calcTotalTax(preTaxWithdrawal, ssIncome, otherIncome, stateCode, status = 'mfj') {
  const st = stateInfo(stateCode);
  const ordinaryNonSS = preTaxWithdrawal + otherIncome;
  const fedTaxableSS = taxableSS(ssIncome, ordinaryNonSS, status);

  const fedTaxable = Math.max(0, ordinaryNonSS + fedTaxableSS - FEDERAL[status].std);
  const federalTax = calcFederalTax(fedTaxable, status);

  const stateSS = st.taxesSS ? fedTaxableSS : 0;
  const stateTaxable = Math.max(0, ordinaryNonSS + stateSS - st[status].std);
  const stateTax = progressiveTax(stateTaxable, st[status].brackets);

  return { federalTax, stateTax, total: federalTax + stateTax };
}

export function baseIncomeTax(ssIncome, otherIncome, stateCode, status = 'mfj') {
  return calcTotalTax(0, ssIncome, otherIncome, stateCode, status).total;
}

// Gross up a pre-tax withdrawal so net (after MARGINAL income tax) = neededAfterTax.
export function grossUpPreTax(neededAfterTax, ssIncome, otherIncome, stateCode, priorPreTax = 0, status = 'mfj', maxIter = 50) {
  if (neededAfterTax <= 0) return 0;
  const below = calcTotalTax(priorPreTax, ssIncome, otherIncome, stateCode, status).total;
  let gross = neededAfterTax * 1.25;
  for (let i = 0; i < maxIter; i++) {
    const { total } = calcTotalTax(priorPreTax + gross, ssIncome, otherIncome, stateCode, status);
    const afterTax = gross - (total - below);
    const diff = neededAfterTax - afterTax;
    if (Math.abs(diff) < 1) break;
    gross += diff * 1.1;
    if (gross < 0) gross = neededAfterTax;
  }
  return Math.max(0, gross);
}

// ---- Capital-gains tax on brokerage withdrawals -----------------------------
// Returns the marginal cap-gains rates on a dollar of taxable GAIN, split into
// federal (LTCG) and state (ordinary) components.
function capGainsRateOnGain(preTaxWithdrawal, ssIncome, otherIncome, stateCode, status) {
  const st = stateInfo(stateCode);
  const ordinaryNonSS = preTaxWithdrawal + otherIncome;
  const fedTaxableSS = taxableSS(ssIncome, ordinaryNonSS, status);
  const fedOrdinaryTaxable = Math.max(0, ordinaryNonSS + fedTaxableSS - FEDERAL[status].std);
  let fed = fedLTCGRate(fedOrdinaryTaxable, status);

  // NIIT (ACA 3.8%): investment income (the brokerage gain) is subject to an extra
  // 3.8% once MAGI is over the threshold. Approximated by testing ordinary MAGI
  // (pre-tax withdrawals + other income + taxable SS, i.e. AGI before the standard
  // deduction). Thresholds are not inflation-indexed.
  const magi = ordinaryNonSS + fedTaxableSS;
  if (magi >= NIIT_THRESHOLD[status]) fed += NIIT_RATE;

  const stateSS = st.taxesSS ? fedTaxableSS : 0;
  const stateOrdinaryTaxable = Math.max(0, ordinaryNonSS + stateSS - st[status].std);
  const state = stateMarginalRate(stateOrdinaryTaxable, st[status].brackets);

  return { fed, state };
}

function brokerageEffRate(preTaxWithdrawal, ssIncome, otherIncome, stateCode, status) {
  const { fed, state } = capGainsRateOnGain(preTaxWithdrawal, ssIncome, otherIncome, stateCode, status);
  return BROKERAGE_GAIN_FRACTION * (fed + state);
}

export function grossUpBrokerage(neededAfterTax, preTaxWithdrawal, ssIncome, otherIncome, stateCode, status = 'mfj') {
  if (neededAfterTax <= 0) return { gross: 0, tax: 0 };
  const rate = brokerageEffRate(preTaxWithdrawal, ssIncome, otherIncome, stateCode, status);
  const gross = neededAfterTax / (1 - rate);
  return { gross, tax: gross * rate };
}

// Cap-gains tax on a gross brokerage withdrawal, split into federal and state.
export function brokerageTax(grossWithdrawal, preTaxWithdrawal, ssIncome, otherIncome, stateCode, status = 'mfj') {
  const { fed, state } = capGainsRateOnGain(preTaxWithdrawal, ssIncome, otherIncome, stateCode, status);
  const federal = grossWithdrawal * BROKERAGE_GAIN_FRACTION * fed;
  const stateTax = grossWithdrawal * BROKERAGE_GAIN_FRACTION * state;
  return { federal, state: stateTax, total: federal + stateTax };
}
