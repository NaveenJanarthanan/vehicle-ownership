import { differenceInDays, differenceInMonths } from 'date-fns';

/** Estimate current market value using compound depreciation when no market data is available.
 *  Uses ~15% year 1, ~12% per year thereafter as a reasonable average. */
export function estimateCurrentValue(purchasePrice: number, purchaseDate: Date): number {
  const years = differenceInDays(new Date(), purchaseDate) / 365.25;
  if (years <= 0) return purchasePrice;
  const estimated = purchasePrice * Math.pow(0.88, years);
  return Math.round(Math.max(estimated, purchasePrice * 0.1) * 100) / 100;
}

/** Calculate remaining loan balance using amortization formula */
export function calculateCurrentBalance(
  originalAmount: number,
  apr: number,
  termMonths: number,
  monthlyPayment: number,
  startDate: Date
): number {
  const monthlyRate = apr / 100 / 12;
  const monthsElapsed = differenceInMonths(new Date(), startDate);
  if (monthlyRate === 0) {
    return Math.max(0, originalAmount - monthlyPayment * monthsElapsed);
  }
  const balance =
    originalAmount * Math.pow(1 + monthlyRate, monthsElapsed) -
    (monthlyPayment * (Math.pow(1 + monthlyRate, monthsElapsed) - 1)) / monthlyRate;
  return Math.max(0, Math.round(balance * 100) / 100);
}

/** Equity = market value - loan balance */
export function calculateEquity(marketValue: number, loanBalance: number): number {
  return Math.round((marketValue - loanBalance) * 100) / 100;
}

/** Payoff progress as percentage */
export function calculatePayoffProgress(originalAmount: number, currentBalance: number): number {
  if (originalAmount === 0) return 100;
  return Math.round(((originalAmount - currentBalance) / originalAmount) * 10000) / 100;
}

/** Remaining months on loan */
export function calculateRemainingPayments(
  currentBalance: number,
  apr: number,
  monthlyPayment: number
): number {
  if (currentBalance <= 0) return 0;
  const monthlyRate = apr / 100 / 12;
  if (monthlyRate === 0) return Math.ceil(currentBalance / monthlyPayment);
  const n = -Math.log(1 - (monthlyRate * currentBalance) / monthlyPayment) / Math.log(1 + monthlyRate);
  return Math.ceil(Math.max(0, n));
}

/** Total interest paid so far */
export function calculateInterestPaid(
  originalAmount: number,
  currentBalance: number,
  monthlyPayment: number,
  startDate: Date
): number {
  const monthsElapsed = differenceInMonths(new Date(), startDate);
  const totalPaid = monthlyPayment * monthsElapsed;
  const principalPaid = originalAmount - currentBalance;
  return Math.max(0, Math.round((totalPaid - principalPaid) * 100) / 100);
}

/** Total interest over life of loan */
export function calculateTotalInterest(
  originalAmount: number,
  monthlyPayment: number,
  termMonths: number
): number {
  return Math.round((monthlyPayment * termMonths - originalAmount) * 100) / 100;
}

/** Depreciation to date = purchase price - current market value */
export function calculateDepreciation(purchasePrice: number, marketValue: number): number {
  return Math.round((purchasePrice - marketValue) * 100) / 100;
}

/** Annual depreciation rate */
export function calculateAnnualDepreciationRate(
  purchasePrice: number,
  marketValue: number,
  purchaseDate: Date
): number {
  const years = differenceInDays(new Date(), purchaseDate) / 365.25;
  if (years <= 0 || purchasePrice <= 0) return 0;
  const totalDep = (purchasePrice - marketValue) / purchasePrice;
  return Math.round((totalDep / years) * 10000) / 100;
}

/** Total monthly ownership cost */
export function calculateMonthlyOwnershipCost(
  monthlyPayment: number,
  monthlyInsurance: number,
  annualMaintenanceCost: number,
  monthlyDepreciation: number
): number {
  return Math.round(
    (monthlyPayment + monthlyInsurance + annualMaintenanceCost / 12 + monthlyDepreciation) * 100
  ) / 100;
}

/** Average monthly depreciation */
export function calculateMonthlyDepreciation(
  purchasePrice: number,
  marketValue: number,
  purchaseDate: Date
): number {
  const months = differenceInMonths(new Date(), purchaseDate);
  if (months <= 0) return 0;
  return Math.round(((purchasePrice - marketValue) / months) * 100) / 100;
}

/** Cost per mile */
export function calculateCostPerMile(
  totalCosts: number,
  mileage: number,
  purchaseMileage: number = 0
): number {
  const milesDriven = mileage - purchaseMileage;
  if (milesDriven <= 0) return 0;
  return Math.round((totalCosts / milesDriven) * 100) / 100;
}

/** Warranty remaining in days and miles */
export function calculateWarrantyRemaining(
  expirationDate: Date | null,
  expirationMileage: number | null,
  currentMileage: number
): { daysRemaining: number | null; milesRemaining: number | null; isExpired: boolean } {
  const daysRemaining = expirationDate
    ? Math.max(0, differenceInDays(expirationDate, new Date()))
    : null;
  const milesRemaining = expirationMileage
    ? Math.max(0, expirationMileage - currentMileage)
    : null;
  const isExpired =
    (daysRemaining !== null && daysRemaining <= 0) ||
    (milesRemaining !== null && milesRemaining <= 0);
  return { daysRemaining, milesRemaining, isExpired };
}

/** Estimate market value at future date using linear depreciation trend */
export function projectMarketValue(
  currentValue: number,
  monthlyDepreciation: number,
  monthsAhead: number
): number {
  return Math.max(0, Math.round((currentValue - monthlyDepreciation * monthsAhead) * 100) / 100);
}

/** Estimate future loan balance */
export function projectLoanBalance(
  currentBalance: number,
  apr: number,
  monthlyPayment: number,
  monthsAhead: number
): number {
  const monthlyRate = apr / 100 / 12;
  let balance = currentBalance;
  for (let i = 0; i < monthsAhead; i++) {
    balance = balance * (1 + monthlyRate) - monthlyPayment;
    if (balance <= 0) return 0;
  }
  return Math.round(balance * 100) / 100;
}
