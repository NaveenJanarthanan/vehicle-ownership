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

  const records = await prisma.maintenanceRecord.findMany({
    where: { vehicleId: params.id },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(records);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwnership(params.id, user.id)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const record = await prisma.maintenanceRecord.create({
    data: {
      vehicleId: params.id,
      date: new Date(body.date),
      type: body.type,
      description: body.description,
      cost: body.cost,
      mileage: body.mileage,
      shop: body.shop || null,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
