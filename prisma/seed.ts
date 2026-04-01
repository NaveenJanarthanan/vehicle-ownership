import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const passwordHash = await hash('demo1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@garageiq.com' },
    update: {},
    create: {
      email: 'demo@garageiq.com',
      name: 'Alex Turner',
      passwordHash,
    },
  });

  // ── Vehicle 1: 2022 BMW M3 Competition ──
  const bmw = await prisma.vehicle.create({
    data: {
      userId: user.id,
      year: 2022,
      make: 'BMW',
      model: 'M3 Competition',
      trim: 'xDrive',
      vin: 'WBS43AY08NFJ12345',
      mileage: 18500,
      annualMiles: 10000,
      purchasePrice: 78500,
      purchaseDate: new Date('2022-06-15'),
      color: 'Isle of Man Green',
      imageUrl: '/cars/bmw-m3.jpg',
    },
  });

  await prisma.loan.create({
    data: {
      vehicleId: bmw.id,
      originalAmount: 62800,
      currentBalance: 48200,
      apr: 5.49,
      termMonths: 72,
      monthlyPayment: 1022,
      startDate: new Date('2022-06-15'),
      lender: 'BMW Financial Services',
    },
  });

  await prisma.warranty.createMany({
    data: [
      {
        vehicleId: bmw.id,
        type: 'factory',
        provider: 'BMW',
        expirationDate: new Date('2026-06-15'),
        expirationMileage: 50000,
      },
      {
        vehicleId: bmw.id,
        type: 'powertrain',
        provider: 'BMW',
        expirationDate: new Date('2026-06-15'),
        expirationMileage: 50000,
      },
    ],
  });

  await prisma.maintenanceRecord.createMany({
    data: [
      { vehicleId: bmw.id, date: new Date('2023-01-10'), type: 'oil-change', description: 'Full synthetic oil change + filter', cost: 185, mileage: 5200, shop: 'BMW of Nashville' },
      { vehicleId: bmw.id, date: new Date('2023-06-20'), type: 'tires', description: 'Michelin Pilot Sport 4S - full set', cost: 1420, mileage: 9800, shop: 'Discount Tire' },
      { vehicleId: bmw.id, date: new Date('2023-08-15'), type: 'oil-change', description: 'Synthetic oil change', cost: 185, mileage: 11200, shop: 'BMW of Nashville' },
      { vehicleId: bmw.id, date: new Date('2024-02-10'), type: 'brakes', description: 'Front brake pads + rotors', cost: 890, mileage: 14500, shop: 'ECS Tuning Install' },
      { vehicleId: bmw.id, date: new Date('2024-04-05'), type: 'oil-change', description: 'Oil change + cabin filter', cost: 220, mileage: 16000, shop: 'BMW of Nashville' },
      { vehicleId: bmw.id, date: new Date('2024-09-12'), type: 'inspection', description: 'Annual state inspection', cost: 35, mileage: 18000, shop: 'Quick Lane' },
    ],
  });

  await prisma.insurance.create({
    data: {
      vehicleId: bmw.id,
      provider: 'State Farm',
      policyNumber: 'SF-2284719',
      monthlyPremium: 245,
      deductible: 500,
      coverageType: 'full',
      startDate: new Date('2024-06-15'),
      endDate: new Date('2025-06-15'),
    },
  });

  await prisma.modification.createMany({
    data: [
      { vehicleId: bmw.id, name: 'M Performance Exhaust', category: 'exhaust', cost: 3200, date: new Date('2022-09-01'), description: 'OEM M Performance titanium exhaust system', shop: 'BMW of Nashville' },
      { vehicleId: bmw.id, name: 'KW V3 Coilovers', category: 'suspension', cost: 2800, date: new Date('2023-02-15'), description: 'KW Variant 3 coilover kit with adaptive cancellation', shop: 'Solo Motorsports' },
      { vehicleId: bmw.id, name: 'Carbon Fiber Front Lip', category: 'appearance', cost: 650, date: new Date('2023-04-10'), description: 'Vorsteiner carbon fiber front lip spoiler' },
    ],
  });

  await prisma.marketValue.createMany({
    data: [
      { vehicleId: bmw.id, estimatedValue: 72000, source: 'cars-and-bids', fetchedAt: new Date('2024-08-01') },
      { vehicleId: bmw.id, estimatedValue: 69500, source: 'bring-a-trailer', fetchedAt: new Date('2024-09-15') },
      { vehicleId: bmw.id, estimatedValue: 67000, source: 'cars-and-bids', fetchedAt: new Date('2024-11-01') },
      { vehicleId: bmw.id, estimatedValue: 65500, source: 'bring-a-trailer', fetchedAt: new Date('2025-01-10') },
    ],
  });

  // ── Vehicle 2: 2019 Porsche 911 Carrera S ──
  const porsche = await prisma.vehicle.create({
    data: {
      userId: user.id,
      year: 2019,
      make: 'Porsche',
      model: '911 Carrera S',
      trim: '992',
      vin: 'WP0AB2A97KS123456',
      mileage: 32000,
      annualMiles: 6000,
      purchasePrice: 115000,
      purchaseDate: new Date('2021-03-20'),
      color: 'GT Silver Metallic',
      imageUrl: '/cars/porsche-911.jpg',
    },
  });

  await prisma.loan.create({
    data: {
      vehicleId: porsche.id,
      originalAmount: 92000,
      currentBalance: 61500,
      apr: 4.25,
      termMonths: 72,
      monthlyPayment: 1455,
      startDate: new Date('2021-03-20'),
      lender: 'Porsche Financial Services',
    },
  });

  await prisma.warranty.create({
    data: {
      vehicleId: porsche.id,
      type: 'extended',
      provider: 'Porsche Approved',
      expirationDate: new Date('2027-03-20'),
      expirationMileage: 80000,
      cost: 4200,
    },
  });

  await prisma.maintenanceRecord.createMany({
    data: [
      { vehicleId: porsche.id, date: new Date('2021-09-10'), type: 'oil-change', description: 'Mobil 1 synthetic + filter', cost: 350, mileage: 22000, shop: 'Porsche Nashville' },
      { vehicleId: porsche.id, date: new Date('2022-04-18'), type: 'fluid', description: 'Brake fluid flush', cost: 280, mileage: 24500, shop: 'Porsche Nashville' },
      { vehicleId: porsche.id, date: new Date('2022-09-22'), type: 'oil-change', description: 'Oil change + air filter', cost: 420, mileage: 26200, shop: 'Porsche Nashville' },
      { vehicleId: porsche.id, date: new Date('2023-05-14'), type: 'tires', description: 'Pirelli P Zero N1 spec - rears', cost: 980, mileage: 28500, shop: 'Tire Rack / Installed' },
      { vehicleId: porsche.id, date: new Date('2024-01-08'), type: 'oil-change', description: 'Oil change + spark plugs', cost: 650, mileage: 30800, shop: 'Porsche Nashville' },
      { vehicleId: porsche.id, date: new Date('2024-06-20'), type: 'repair', description: 'Sport Chrono clock repair', cost: 800, mileage: 31500, shop: 'Porsche Nashville' },
    ],
  });

  await prisma.insurance.create({
    data: {
      vehicleId: porsche.id,
      provider: 'Hagerty',
      policyNumber: 'HAG-991204',
      monthlyPremium: 185,
      deductible: 1000,
      coverageType: 'full',
      startDate: new Date('2024-03-20'),
      endDate: new Date('2025-03-20'),
    },
  });

  await prisma.modification.createMany({
    data: [
      { vehicleId: porsche.id, name: 'Fabspeed Sport Cats', category: 'exhaust', cost: 4500, date: new Date('2021-06-01'), description: '200-cell sport catalytic converters', shop: 'Solo Motorsports' },
      { vehicleId: porsche.id, name: 'GMG WC-Sport Exhaust', category: 'exhaust', cost: 3800, date: new Date('2021-06-01'), description: 'Center muffler bypass', shop: 'Solo Motorsports' },
      { vehicleId: porsche.id, name: 'BBS FI-R Wheels', category: 'wheels-tires', cost: 6200, date: new Date('2022-01-15'), description: '20/21 staggered forged wheels in Platinum Silver' },
      { vehicleId: porsche.id, name: 'Clear Bra PPF', category: 'appearance', cost: 2500, date: new Date('2021-04-01'), description: 'XPEL Ultimate Plus full front end PPF', shop: 'DetailLab' },
    ],
  });

  await prisma.marketValue.createMany({
    data: [
      { vehicleId: porsche.id, estimatedValue: 108000, source: 'bring-a-trailer', fetchedAt: new Date('2024-06-01') },
      { vehicleId: porsche.id, estimatedValue: 105000, source: 'cars-and-bids', fetchedAt: new Date('2024-08-15') },
      { vehicleId: porsche.id, estimatedValue: 103500, source: 'bring-a-trailer', fetchedAt: new Date('2024-10-20') },
      { vehicleId: porsche.id, estimatedValue: 102000, source: 'bring-a-trailer', fetchedAt: new Date('2025-01-05') },
    ],
  });

  // ── Vehicle 3: 2020 Toyota GR Supra ──
  const supra = await prisma.vehicle.create({
    data: {
      userId: user.id,
      year: 2020,
      make: 'Toyota',
      model: 'GR Supra',
      trim: '3.0 Premium',
      vin: 'JTDP4RCE4L3012345',
      mileage: 27000,
      annualMiles: 8000,
      purchasePrice: 56000,
      purchaseDate: new Date('2020-08-10'),
      color: 'Renaissance Red 2.0',
      imageUrl: '/cars/toyota-supra.jpg',
    },
  });

  await prisma.loan.create({
    data: {
      vehicleId: supra.id,
      originalAmount: 44800,
      currentBalance: 14200,
      apr: 3.99,
      termMonths: 60,
      monthlyPayment: 827,
      startDate: new Date('2020-08-10'),
      lender: 'Toyota Financial',
    },
  });

  await prisma.warranty.create({
    data: {
      vehicleId: supra.id,
      type: 'powertrain',
      provider: 'Toyota',
      expirationDate: new Date('2025-08-10'),
      expirationMileage: 60000,
    },
  });

  await prisma.maintenanceRecord.createMany({
    data: [
      { vehicleId: supra.id, date: new Date('2021-02-15'), type: 'oil-change', description: 'First oil change at 5k', cost: 120, mileage: 5000, shop: 'Toyota Dealership' },
      { vehicleId: supra.id, date: new Date('2021-08-20'), type: 'oil-change', description: 'Oil change', cost: 120, mileage: 10000, shop: 'Valvoline Instant' },
      { vehicleId: supra.id, date: new Date('2022-03-10'), type: 'tires', description: 'Continental ExtremeContact Sport 02', cost: 1100, mileage: 15000, shop: 'Discount Tire' },
      { vehicleId: supra.id, date: new Date('2022-08-25'), type: 'oil-change', description: 'Oil change + diff fluid', cost: 280, mileage: 18500, shop: 'Indy shop' },
      { vehicleId: supra.id, date: new Date('2023-06-30'), type: 'brakes', description: 'Rear pads replacement', cost: 340, mileage: 22000, shop: 'Brake Masters' },
      { vehicleId: supra.id, date: new Date('2024-01-15'), type: 'oil-change', description: 'Oil change + cabin filter + air filter', cost: 195, mileage: 25000, shop: 'Valvoline Instant' },
      { vehicleId: supra.id, date: new Date('2024-08-01'), type: 'repair', description: 'Infotainment head unit replacement (warranty)', cost: 0, mileage: 26800, shop: 'Toyota Dealership' },
    ],
  });

  await prisma.insurance.create({
    data: {
      vehicleId: supra.id,
      provider: 'Progressive',
      policyNumber: 'PRG-8847221',
      monthlyPremium: 178,
      deductible: 500,
      coverageType: 'full',
      startDate: new Date('2024-08-10'),
      endDate: new Date('2025-08-10'),
    },
  });

  await prisma.modification.createMany({
    data: [
      { vehicleId: supra.id, name: 'HKS Hi-Power Exhaust', category: 'exhaust', cost: 1400, date: new Date('2020-11-01'), description: 'Single exit catback exhaust', shop: 'Speed Factory' },
      { vehicleId: supra.id, name: 'Bootmod3 Tune', category: 'performance', cost: 500, date: new Date('2021-01-15'), description: 'Stage 1 ECU tune via OBD' },
      { vehicleId: supra.id, name: 'Ceramic Coating', category: 'appearance', cost: 1200, date: new Date('2020-09-01'), description: 'Gtechniq Crystal Serum Ultra + EXO', shop: 'DetailLab' },
    ],
  });

  await prisma.marketValue.createMany({
    data: [
      { vehicleId: supra.id, estimatedValue: 48000, source: 'cars-and-bids', fetchedAt: new Date('2024-07-01') },
      { vehicleId: supra.id, estimatedValue: 46500, source: 'bring-a-trailer', fetchedAt: new Date('2024-09-20') },
      { vehicleId: supra.id, estimatedValue: 45000, source: 'cars-and-bids', fetchedAt: new Date('2024-12-01') },
      { vehicleId: supra.id, estimatedValue: 44500, source: 'bring-a-trailer', fetchedAt: new Date('2025-02-10') },
    ],
  });

  console.log('✓ Seed data created successfully');
  console.log(`  User: ${user.email} / demo1234`);
  console.log(`  Vehicles: ${bmw.year} ${bmw.make} ${bmw.model}, ${porsche.year} ${porsche.make} ${porsche.model}, ${supra.year} ${supra.make} ${supra.model}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
