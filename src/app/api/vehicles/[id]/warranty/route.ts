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

  const warranties = await prisma.warranty.findMany({
    where: { vehicleId: params.id },
    orderBy: { expirationDate: 'asc' },
  });
  return NextResponse.json(warranties);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwnership(params.id, user.id)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const warranty = await prisma.warranty.create({
    data: {
      vehicleId: params.id,
      type: body.type,
      provider: body.provider || null,
      expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
      expirationMileage: body.expirationMileage || null,
      cost: body.cost || null,
    },
  });

  return NextResponse.json(warranty, { status: 201 });
}
