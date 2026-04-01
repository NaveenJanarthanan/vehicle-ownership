import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: user.id },
    include: {
      loan: true,
      marketValues: { orderBy: { fetchedAt: 'desc' }, take: 1 },
      insurancePolicies: { orderBy: { startDate: 'desc' }, take: 1 },
      maintenanceRecords: true,
      warranties: true,
      modifications: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(vehicles);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const vehicle = await prisma.vehicle.create({
    data: {
      userId: user.id,
      year: body.year,
      make: body.make,
      model: body.model,
      trim: body.trim || null,
      vin: body.vin || null,
      mileage: body.mileage,
      annualMiles: body.annualMiles || 12000,
      purchasePrice: body.purchasePrice,
      purchaseDate: new Date(body.purchaseDate),
      color: body.color || null,
      imageUrl: body.imageUrl || null,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
