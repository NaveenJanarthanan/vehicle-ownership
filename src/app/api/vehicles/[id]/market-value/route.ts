import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { getAuctionMarketValue } from '@/lib/scraper';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, userId: user.id },
    include: { marketValues: { orderBy: { fetchedAt: 'desc' } } },
  });
  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(vehicle.marketValues);
}

/** Fetch fresh market values from auction sites */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await getAuctionMarketValue(vehicle.year, vehicle.make, vehicle.model);

  const saved = [];
  if (result.averagePrice) {
    for (const auction of result.results.slice(0, 5)) {
      const mv = await prisma.marketValue.create({
        data: {
          vehicleId: vehicle.id,
          estimatedValue: auction.price,
          source: auction.source,
          url: auction.url,
        },
      });
      saved.push(mv);
    }
  }

  return NextResponse.json({
    averagePrice: result.averagePrice,
    medianPrice: result.medianPrice,
    auctionResults: result.results,
    saved: saved.length,
  });
}
