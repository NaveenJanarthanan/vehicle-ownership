import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { generateInsights } from '@/lib/insights';
import { subMonths } from 'date-fns';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      loan: true,
      warranties: true,
      maintenanceRecords: true,
      insurancePolicies: { orderBy: { startDate: 'desc' }, take: 1 },
      modifications: true,
      marketValues: { orderBy: { fetchedAt: 'desc' }, take: 1 },
    },
  });

  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const oneYearAgo = subMonths(new Date(), 12);
  const recentMaintenance = vehicle.maintenanceRecords.filter(
    (r) => new Date(r.date) >= oneYearAgo
  );

  const insights = generateInsights({
    purchasePrice: vehicle.purchasePrice,
    purchaseDate: vehicle.purchaseDate,
    mileage: vehicle.mileage,
    annualMiles: vehicle.annualMiles,
    year: vehicle.year,
    loan: vehicle.loan
      ? {
          originalAmount: vehicle.loan.originalAmount,
          currentBalance: vehicle.loan.currentBalance,
          apr: vehicle.loan.apr,
          termMonths: vehicle.loan.termMonths,
          monthlyPayment: vehicle.loan.monthlyPayment,
          startDate: vehicle.loan.startDate,
        }
      : null,
    latestMarketValue: vehicle.marketValues[0]?.estimatedValue ?? null,
    warranties: vehicle.warranties.map((w) => ({
      type: w.type,
      expirationDate: w.expirationDate,
      expirationMileage: w.expirationMileage,
    })),
    totalMaintenanceCost: vehicle.maintenanceRecords.reduce((a, r) => a + r.cost, 0),
    maintenanceRecordCount: vehicle.maintenanceRecords.length,
    recentMaintenanceCosts: recentMaintenance.reduce((a, r) => a + r.cost, 0),
    monthlyInsurance: vehicle.insurancePolicies[0]?.monthlyPremium ?? 0,
    totalModCost: vehicle.modifications.reduce((a, m) => a + m.cost, 0),
  });

  return NextResponse.json(insights);
}
