import {
  calculateEquity,
  calculatePayoffProgress,
  calculateMonthlyDepreciation,
  calculateAnnualDepreciationRate,
  calculateWarrantyRemaining,
  calculateInterestPaid,
  calculateRemainingPayments,
  projectMarketValue,
  projectLoanBalance,
} from './calculations';

export interface Insight {
  id: string;
  type: 'keep' | 'sell' | 'trade' | 'refinance';
  title: string;
  confidence: number; // 0-100
  summary: string;
  reasoning: string[];
  metrics: Record<string, string | number>;
}

interface VehicleData {
  purchasePrice: number;
  purchaseDate: Date;
  mileage: number;
  annualMiles: number;
  year: number;
  loan: {
    originalAmount: number;
    currentBalance: number;
    apr: number;
    termMonths: number;
    monthlyPayment: number;
    startDate: Date;
  } | null;
  latestMarketValue: number | null;
  warranties: Array<{
    type: string;
    expirationDate: Date | null;
    expirationMileage: number | null;
  }>;
  totalMaintenanceCost: number;
  maintenanceRecordCount: number;
  recentMaintenanceCosts: number; // last 12 months
  monthlyInsurance: number;
  totalModCost: number;
}

export function generateInsights(data: VehicleData): Insight[] {
  const insights: Insight[] = [];
  const marketValue = data.latestMarketValue ?? data.purchasePrice * 0.7;

  // ── Equity Analysis ──
  if (data.loan) {
    const equity = calculateEquity(marketValue, data.loan.currentBalance);
    const payoff = calculatePayoffProgress(data.loan.originalAmount, data.loan.currentBalance);
    const remainingPayments = calculateRemainingPayments(
      data.loan.currentBalance,
      data.loan.apr,
      data.loan.monthlyPayment
    );
    const interestPaid = calculateInterestPaid(
      data.loan.originalAmount,
      data.loan.currentBalance,
      data.loan.monthlyPayment,
      data.loan.startDate
    );

    if (equity > 0) {
      insights.push({
        id: 'positive-equity',
        type: 'keep',
        title: 'Positive Equity Position',
        confidence: Math.min(90, 50 + (equity / marketValue) * 100),
        summary: `You have $${equity.toLocaleString()} in positive equity (${Math.round((equity / marketValue) * 100)}% of market value). This gives you flexibility.`,
        reasoning: [
          `Current market value is estimated at $${marketValue.toLocaleString()}, while your loan balance is $${data.loan.currentBalance.toLocaleString()}.`,
          `You've paid off ${payoff}% of the original loan amount ($${data.loan.originalAmount.toLocaleString()}).`,
          `With ${remainingPayments} payments left, you'll pay an additional $${(remainingPayments * data.loan.monthlyPayment).toLocaleString()} to own the car outright.`,
          equity > marketValue * 0.3
            ? `Your equity ratio is strong — you could trade for a similarly-priced vehicle with a smaller loan.`
            : `Continue building equity. Your position will strengthen as the loan pays down faster than depreciation.`,
        ],
        metrics: {
          equity: `$${equity.toLocaleString()}`,
          'Payoff Progress': `${payoff}%`,
          'Remaining Payments': remainingPayments,
          'Interest Paid': `$${interestPaid.toLocaleString()}`,
        },
      });
    } else {
      insights.push({
        id: 'negative-equity',
        type: 'keep',
        title: 'Underwater — Hold Recommended',
        confidence: 75,
        summary: `You're $${Math.abs(equity).toLocaleString()} underwater. Selling or trading now would require bringing cash to the table.`,
        reasoning: [
          `The vehicle's estimated market value ($${marketValue.toLocaleString()}) is below your loan balance ($${data.loan.currentBalance.toLocaleString()}).`,
          `Selling would cost you approximately $${Math.abs(equity).toLocaleString()} out of pocket to settle the loan.`,
          `Negative equity typically reverses as loan principal pays down — you're ${payoff}% through the loan already.`,
          `Focus on accelerating payments if possible. Even an extra $100/month significantly reduces total interest.`,
        ],
        metrics: {
          'Negative Equity': `-$${Math.abs(equity).toLocaleString()}`,
          'Payoff Progress': `${payoff}%`,
          'Months to Break Even': Math.ceil(Math.abs(equity) / (data.loan.monthlyPayment - (marketValue * (data.loan.apr / 100 / 12)))),
        },
      });
    }

    // ── Refinance Analysis ──
    const currentMarketRate = 5.5; // reasonable average for auto loans
    if (data.loan.apr > currentMarketRate + 1 && data.loan.currentBalance > 10000) {
      const potentialSavings = Math.round(
        (data.loan.apr - currentMarketRate) / 100 / 12 * data.loan.currentBalance * remainingPayments * 0.5
      );
      insights.push({
        id: 'refinance-opportunity',
        type: 'refinance',
        title: 'Refinancing Could Save You Money',
        confidence: 65,
        summary: `Your APR of ${data.loan.apr}% is above current market rates. Refinancing could save approximately $${potentialSavings.toLocaleString()}.`,
        reasoning: [
          `Your current rate is ${data.loan.apr}%, while competitive auto loan rates are around ${currentMarketRate}%.`,
          `With $${data.loan.currentBalance.toLocaleString()} remaining, the interest rate difference adds up over ${remainingPayments} remaining payments.`,
          `Estimated savings of ~$${potentialSavings.toLocaleString()} over the remaining term (varies by actual offered rate and fees).`,
          `Check with credit unions — they often offer the most competitive refinance rates for auto loans.`,
          `Make sure any refinance offer doesn't extend your term significantly, as that can negate interest savings.`,
        ],
        metrics: {
          'Current APR': `${data.loan.apr}%`,
          'Market Rate': `~${currentMarketRate}%`,
          'Est. Savings': `$${potentialSavings.toLocaleString()}`,
          'Balance': `$${data.loan.currentBalance.toLocaleString()}`,
        },
      });
    }
  }

  // ── Depreciation Analysis ──
  const monthlyDep = calculateMonthlyDepreciation(data.purchasePrice, marketValue, data.purchaseDate);
  const annualDepRate = calculateAnnualDepreciationRate(data.purchasePrice, marketValue, data.purchaseDate);
  const totalDep = data.purchasePrice - marketValue;

  if (annualDepRate > 15) {
    insights.push({
      id: 'high-depreciation',
      type: 'sell',
      title: 'Rapid Depreciation Detected',
      confidence: 60,
      summary: `This vehicle is depreciating at ${annualDepRate}% per year — significantly faster than average. Consider selling if you're not attached.`,
      reasoning: [
        `The vehicle has lost $${totalDep.toLocaleString()} since purchase (${Math.round((totalDep / data.purchasePrice) * 100)}% of purchase price).`,
        `At $${monthlyDep.toLocaleString()}/month in depreciation, holding longer means continued value erosion.`,
        `Average vehicles depreciate ~10-15% per year in the first 5 years. Yours is above that range.`,
        `If you're considering a change anyway, selling sooner preserves more value. Each month of delay costs ~$${monthlyDep.toLocaleString()} in depreciation alone.`,
        data.year >= new Date().getFullYear() - 3
          ? `Newer vehicles depreciate fastest — the curve typically flattens after years 4-5.`
          : `At this age, depreciation should be slowing. The high rate may reflect model-specific market softening.`,
      ],
      metrics: {
        'Annual Rate': `${annualDepRate}%`,
        'Monthly Loss': `$${monthlyDep.toLocaleString()}`,
        'Total Lost': `$${totalDep.toLocaleString()}`,
      },
    });
  } else if (annualDepRate < 8 && annualDepRate > 0) {
    const futureValue12 = projectMarketValue(marketValue, monthlyDep, 12);
    insights.push({
      id: 'strong-value-retention',
      type: 'keep',
      title: 'Excellent Value Retention',
      confidence: 80,
      summary: `At ${annualDepRate}% annual depreciation, this vehicle holds value well. Keeping it is financially sound.`,
      reasoning: [
        `Depreciation of only ${annualDepRate}% per year is well below the industry average of 10-15%.`,
        `Monthly depreciation cost is just $${monthlyDep.toLocaleString()} — one of the lowest costs of ownership for this vehicle.`,
        `If the trend continues, the vehicle should be worth approximately $${futureValue12.toLocaleString()} in 12 months.`,
        `Strong resale value also means flexibility — you can exit this vehicle at a good price if circumstances change.`,
      ],
      metrics: {
        'Annual Rate': `${annualDepRate}%`,
        'Monthly Loss': `$${monthlyDep.toLocaleString()}`,
        '12-Month Projection': `$${futureValue12.toLocaleString()}`,
      },
    });
  }

  // ── Warranty Status ──
  const activeWarranties = data.warranties.filter((w) => {
    const wr = calculateWarrantyRemaining(w.expirationDate, w.expirationMileage, data.mileage);
    return !wr.isExpired;
  });

  const expiringWarranties = data.warranties.filter((w) => {
    const wr = calculateWarrantyRemaining(w.expirationDate, w.expirationMileage, data.mileage);
    return !wr.isExpired && ((wr.daysRemaining !== null && wr.daysRemaining < 180) || (wr.milesRemaining !== null && wr.milesRemaining < 5000));
  });

  if (expiringWarranties.length > 0) {
    const w = expiringWarranties[0];
    const wr = calculateWarrantyRemaining(w.expirationDate, w.expirationMileage, data.mileage);
    insights.push({
      id: 'warranty-expiring',
      type: 'sell',
      title: 'Warranty Coverage Ending Soon',
      confidence: 55,
      summary: `Your ${w.type} warranty expires soon. Out-of-warranty repair costs can be significant for this type of vehicle.`,
      reasoning: [
        wr.daysRemaining !== null
          ? `${w.type} warranty expires in ${wr.daysRemaining} days.`
          : '',
        wr.milesRemaining !== null
          ? `Mileage-based limit: ${wr.milesRemaining.toLocaleString()} miles remaining at ${data.annualMiles.toLocaleString()} miles/year driving pace.`
          : '',
        `Consider getting a pre-warranty-expiration inspection to catch anything covered while you still can.`,
        `If this is a luxury or performance vehicle, budget for higher out-of-pocket maintenance after warranty ends.`,
        `Alternatively, look into extended warranty options — but calculate whether the premium justifies the coverage.`,
      ].filter(Boolean),
      metrics: {
        'Days Left': wr.daysRemaining ?? 'N/A',
        'Miles Left': wr.milesRemaining?.toLocaleString() ?? 'N/A',
        'Warranty Type': w.type,
      },
    });
  }

  if (activeWarranties.length === 0 && data.warranties.length > 0) {
    insights.push({
      id: 'no-warranty',
      type: 'sell',
      title: 'No Active Warranty Coverage',
      confidence: 45,
      summary: `All warranties have expired. You're responsible for 100% of repair costs going forward.`,
      reasoning: [
        `Without warranty coverage, unexpected repairs can be expensive — especially for performance and luxury vehicles.`,
        `If maintenance costs have been trending upward, this is a signal the vehicle may be entering a costly phase.`,
        `Consider the risk tolerance: if a major repair ($3,000+) would be financially stressful, selling may be prudent.`,
        `Alternatively, setting aside a monthly "repair fund" of $200-400 can buffer unexpected costs.`,
      ],
      metrics: {
        'Maintenance Last 12mo': `$${data.recentMaintenanceCosts.toLocaleString()}`,
        'Total Maintenance': `$${data.totalMaintenanceCost.toLocaleString()}`,
      },
    });
  }

  // ── Maintenance Cost Trend ──
  if (data.maintenanceRecordCount >= 3) {
    const avgPerRecord = Math.round(data.totalMaintenanceCost / data.maintenanceRecordCount);
    const annualized = data.recentMaintenanceCosts;

    if (annualized > data.monthlyInsurance * 12 * 0.5) {
      insights.push({
        id: 'high-maintenance',
        type: 'trade',
        title: 'Maintenance Costs Are Climbing',
        confidence: 55,
        summary: `You've spent $${annualized.toLocaleString()} on maintenance in the last 12 months. This is a significant portion of your ownership cost.`,
        reasoning: [
          `Average cost per service visit: $${avgPerRecord.toLocaleString()}.`,
          `Recent 12-month maintenance ($${annualized.toLocaleString()}) is ${annualized > avgPerRecord * 2 ? 'above' : 'near'} your historical average.`,
          `When maintenance costs approach monthly payment levels, it's often a signal to evaluate alternatives.`,
          `A newer vehicle with warranty coverage could reduce this unpredictability significantly.`,
          `If you enjoy the vehicle, consider budgeting a dedicated maintenance fund rather than trading.`,
        ],
        metrics: {
          'Annual Maintenance': `$${annualized.toLocaleString()}`,
          'Avg Per Visit': `$${avgPerRecord.toLocaleString()}`,
          'Total Records': data.maintenanceRecordCount,
        },
      });
    }
  }

  // ── Total Ownership Cost ──
  const monthlyPayment = data.loan?.monthlyPayment ?? 0;
  const totalMonthlyCost = monthlyPayment + data.monthlyInsurance + data.recentMaintenanceCosts / 12 + monthlyDep;

  insights.push({
    id: 'ownership-cost',
    type: 'keep',
    title: 'Total Monthly Ownership Cost',
    confidence: 85,
    summary: `Your all-in monthly cost of ownership is approximately $${Math.round(totalMonthlyCost).toLocaleString()}.`,
    reasoning: [
      `Loan payment: $${monthlyPayment.toLocaleString()}/mo`,
      `Insurance: $${data.monthlyInsurance.toLocaleString()}/mo`,
      `Maintenance (averaged): $${Math.round(data.recentMaintenanceCosts / 12).toLocaleString()}/mo`,
      `Depreciation: $${monthlyDep.toLocaleString()}/mo`,
      `Modifications investment: $${data.totalModCost.toLocaleString()} total (not recurring, but consider for resale value impact).`,
      totalMonthlyCost > 2500
        ? `This is a premium ownership cost. Ensure it aligns with your budget targets.`
        : `This is a manageable ownership cost for this class of vehicle.`,
    ],
    metrics: {
      'Total Monthly': `$${Math.round(totalMonthlyCost).toLocaleString()}`,
      'Annual Cost': `$${Math.round(totalMonthlyCost * 12).toLocaleString()}`,
      'Mods Total': `$${data.totalModCost.toLocaleString()}`,
    },
  });

  // ── Modification Value Impact ──
  if (data.totalModCost > 2000) {
    const modRecovery = Math.round(data.totalModCost * 0.3); // mods typically retain ~30%
    insights.push({
      id: 'mod-impact',
      type: 'keep',
      title: 'Modifications & Resale Value',
      confidence: 50,
      summary: `You've invested $${data.totalModCost.toLocaleString()} in modifications. Expect to recover ~$${modRecovery.toLocaleString()} at resale.`,
      reasoning: [
        `Aftermarket modifications typically retain 20-40% of their cost at resale, depending on the type and market.`,
        `Performance mods on enthusiast cars (exhaust, suspension, tunes) tend to retain value better than cosmetic mods.`,
        `Keeping OEM parts to reinstall before selling can maximize resale value — buyers often prefer stock.`,
        `Some mods (PPF, ceramic coating) protect the vehicle and indirectly support resale value.`,
        `The $${data.totalModCost.toLocaleString()} invested is a sunk cost — factor only the recovery amount into sell/keep decisions.`,
      ],
      metrics: {
        'Total Invested': `$${data.totalModCost.toLocaleString()}`,
        'Est. Recovery': `$${modRecovery.toLocaleString()}`,
        'Recovery Rate': '~30%',
      },
    });
  }

  // Sort by confidence descending
  return insights.sort((a, b) => b.confidence - a.confidence);
}
