import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

async function verifyOwnership(vehicleId: string, userId: string) {
  return prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwnership(params.id, user.id)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const loan = await prisma.loan.findUnique({ where: { vehicleId: params.id } });
  return NextResponse.json(loan);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwnership(params.id, user.id)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const loan = await prisma.loan.upsert({
    where: { vehicleId: params.id },
    create: {
      vehicleId: params.id,
      originalAmount: body.originalAmount,
      currentBalance: body.currentBalance,
      apr: body.apr,
      termMonths: body.termMonths,
      monthlyPayment: body.monthlyPayment,
      startDate: new Date(body.startDate),
      lender: body.lender || null,
    },
    update: {
      originalAmount: body.originalAmount,
      currentBalance: body.currentBalance,
      apr: body.apr,
      termMonths: body.termMonths,
      monthlyPayment: body.monthlyPayment,
      startDate: new Date(body.startDate),
      lender: body.lender || null,
    },
  });

  return NextResponse.json(loan, { status: 201 });
}
