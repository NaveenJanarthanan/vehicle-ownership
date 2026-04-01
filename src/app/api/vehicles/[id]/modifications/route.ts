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

  const mods = await prisma.modification.findMany({
    where: { vehicleId: params.id },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(mods);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwnership(params.id, user.id)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const mod = await prisma.modification.create({
    data: {
      vehicleId: params.id,
      name: body.name,
      category: body.category,
      cost: body.cost,
      date: new Date(body.date),
      description: body.description || null,
      shop: body.shop || null,
    },
  });

  return NextResponse.json(mod, { status: 201 });
}
