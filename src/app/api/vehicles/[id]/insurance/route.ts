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

  const policies = await prisma.insurance.findMany({
    where: { vehicleId: params.id },
    orderBy: { startDate: 'desc' },
  });
  return NextResponse.json(policies);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwnership(params.id, user.id)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const insurance = await prisma.insurance.create({
    data: {
      vehicleId: params.id,
      provider: body.provider,
      policyNumber: body.policyNumber || null,
      monthlyPremium: body.monthlyPremium,
      deductible: body.deductible || null,
      coverageType: body.coverageType,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });

  return NextResponse.json(insurance, { status: 201 });
}
