import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      loan: true,
      warranties: { orderBy: { expirationDate: 'asc' } },
      maintenanceRecords: { orderBy: { date: 'desc' } },
      insurancePolicies: { orderBy: { startDate: 'desc' } },
      modifications: { orderBy: { date: 'desc' } },
      marketValues: { orderBy: { fetchedAt: 'desc' } },
    },
  });

  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(vehicle);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vehicle = await prisma.vehicle.findFirst({ where: { id: params.id, userId: user.id } });
  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.vehicle.update({
    where: { id: params.id },
    data: {
      year: body.year ?? undefined,
      make: body.make ?? undefined,
      model: body.model ?? undefined,
      trim: body.trim ?? undefined,
      vin: body.vin ?? undefined,
      mileage: body.mileage ?? undefined,
      annualMiles: body.annualMiles ?? undefined,
      purchasePrice: body.purchasePrice ?? undefined,
      color: body.color ?? undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vehicle = await prisma.vehicle.findFirst({ where: { id: params.id, userId: user.id } });
  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.vehicle.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
