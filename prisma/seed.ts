import { PrismaClient, Role, WasteType, CollectorStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding WasteLink Uganda...');

  // System Settings
  await prisma.systemSetting.upsert({
    where: { key: 'collectors_enabled_global' }, update: {},
    create: { key: 'collectors_enabled_global', value: 'true', label: 'Global collector applications toggle' },
  });

  // Districts & Zones
  const kampala = await prisma.district.upsert({ where: { name: 'Kampala' }, update: {}, create: { name: 'Kampala' } });
  const wakiso  = await prisma.district.upsert({ where: { name: 'Wakiso'  }, update: {}, create: { name: 'Wakiso'  } });
  const mukono  = await prisma.district.upsert({ where: { name: 'Mukono'  }, update: {}, create: { name: 'Mukono'  } });

  const zoneData = [
    { districtId: kampala.id, name: 'Central Division',  code: 'KLA-CEN', maxCollectors: 15 },
    { districtId: kampala.id, name: 'Kawempe Division',  code: 'KLA-KAW', maxCollectors: 10 },
    { districtId: kampala.id, name: 'Makindye Division', code: 'KLA-MAK', maxCollectors: 10 },
    { districtId: kampala.id, name: 'Nakawa Division',   code: 'KLA-NAK', maxCollectors: 10 },
    { districtId: kampala.id, name: 'Rubaga Division',   code: 'KLA-RUB', maxCollectors: 10 },
    { districtId: wakiso.id,  name: 'Entebbe',           code: 'WAK-ENT', maxCollectors: 8  },
    { districtId: wakiso.id,  name: 'Kira',              code: 'WAK-KIR', maxCollectors: 8  },
    { districtId: wakiso.id,  name: 'Nansana',           code: 'WAK-NAN', maxCollectors: 8  },
    { districtId: mukono.id,  name: 'Mukono Town',       code: 'MUK-TWN', maxCollectors: 6  },
  ];
  const zones: Record<string, any> = {};
  for (const z of zoneData) {
    zones[z.code] = await prisma.zone.upsert({ where: { code: z.code }, update: {}, create: z });
  }
  console.log('✅ Districts & zones seeded');

  // Waste Categories
  const cats = [
    { name: 'Organic Waste',     type: WasteType.ORGANIC,    baseFee: 4000,  collectorFeePerKg: 150, recyclerPricePerKg: 300,  recyclingRate: 95, color: '#84cc16', description: 'Food scraps, yard waste, biodegradables' },
    { name: 'Plastic Waste',     type: WasteType.PLASTIC,    baseFee: 5000,  collectorFeePerKg: 200, recyclerPricePerKg: 800,  recyclingRate: 70, color: '#3b82f6', description: 'Bottles, bags, containers, packaging' },
    { name: 'Metal Waste',       type: WasteType.METAL,      baseFee: 5000,  collectorFeePerKg: 250, recyclerPricePerKg: 1500, recyclingRate: 90, color: '#6b7280', description: 'Cans, scrap metal, appliances' },
    { name: 'Glass',             type: WasteType.GLASS,      baseFee: 5000,  collectorFeePerKg: 180, recyclerPricePerKg: 500,  recyclingRate: 80, color: '#06b6d4', description: 'Bottles, jars, broken glass' },
    { name: 'Paper & Cardboard', type: WasteType.PAPER,      baseFee: 3000,  collectorFeePerKg: 120, recyclerPricePerKg: 400,  recyclingRate: 85, color: '#f59e0b', description: 'Newspapers, cardboard, office paper' },
    { name: 'Hazardous Waste',   type: WasteType.HAZARDOUS,  baseFee: 15000, collectorFeePerKg: 500, recyclerPricePerKg: 2000, recyclingRate: 40, color: '#ef4444', description: 'Chemicals, batteries, paint, medical waste' },
    { name: 'E-Waste',           type: WasteType.ELECTRONIC, baseFee: 10000, collectorFeePerKg: 400, recyclerPricePerKg: 2500, recyclingRate: 60, color: '#8b5cf6', description: 'Electronics, phones, computers' },
    { name: 'Mixed Waste',       type: WasteType.MIXED,      baseFee: 5000,  collectorFeePerKg: 180, recyclerPricePerKg: 200,  recyclingRate: 30, color: '#64748b', description: 'Unsorted/mixed household waste' },
  ];
  for (const cat of cats) {
    await prisma.wasteCategory.upsert({ where: { type: cat.type }, update: {}, create: cat });
  }
  console.log('✅ Waste categories seeded');

  // Admin
  const adminPw = await bcrypt.hash('Admin@123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@kampala.go.ug' }, update: {},
    create: { name: 'Kampala City Authority', email: 'admin@kampala.go.ug', password: adminPw, role: Role.ADMIN, phone: '+256700000001' },
  });

  // Household
  const hhPw = await bcrypt.hash('House@123', 12);
  await prisma.user.upsert({
    where: { email: 'sarah@home.ug' }, update: {},
    create: {
      name: 'Sarah Nakato', email: 'sarah@home.ug', password: hhPw, role: Role.HOUSEHOLD, phone: '+256701234567',
      householdProfile: { create: { address: '45 Bukoto Street, Kampala', districtId: kampala.id, zoneId: zones['KLA-CEN'].id } },
    },
  });

  // Collector
  const colPw = await bcrypt.hash('Collect@123', 12);
  await prisma.user.upsert({
    where: { email: 'john@collect.ug' }, update: {},
    create: {
      name: 'John Ssemakula', email: 'john@collect.ug', password: colPw, role: Role.COLLECTOR, phone: '+256702345678',
      collectorProfile: {
        create: {
          vehicleType: 'Pickup Truck', vehiclePlate: 'UAA 123B',
          licenseNumber: 'KLA-CEN-0042', status: CollectorStatus.ACTIVE,
          zoneId: zones['KLA-CEN'].id, totalCollected: 1250.5,
          totalEarnings: 850000, totalDeliveries: 47, rating: 4.7, ratingCount: 38, verifiedAt: new Date(),
        },
      },
    },
  });

  // Recycler (isFirstLogin: false for demo — set true for real admin-created accounts)
  const recPw = await bcrypt.hash('Recycle@123', 12);
  await prisma.user.upsert({
    where: { email: 'eco@recyclers.ug' }, update: {},
    create: {
      name: 'EcoFuture Uganda Ltd', email: 'eco@recyclers.ug', password: recPw,
      role: Role.RECYCLER, phone: '+256703456789', isFirstLogin: false,
      recyclerProfile: {
        create: {
          companyName: 'EcoFuture Uganda Ltd', businessLicense: 'BL-2024-RCY-001',
          address: 'Plot 12, Industrial Area, Kampala',
          wasteTypes: [WasteType.PLASTIC, WasteType.METAL, WasteType.GLASS],
          capacity: 5000, totalProcessed: 28500,
        },
      },
    },
  });

  // Landfill
  await prisma.landfillSite.upsert({
    where: { id: 'kiteezi-main' }, update: { currentLoad: 892000 },
    create: { id: 'kiteezi-main', name: 'Kiteezi Landfill Site', location: 'Kiteezi, Kampala', latitude: 0.4167, longitude: 32.5833, maxCapacity: 1000000, currentLoad: 892000, alertThreshold: 0.85 },
  });

  console.log('\n🎉 Seeding complete!');
  console.log('Admin:     admin@kampala.go.ug / Admin@123!');
  console.log('Household: sarah@home.ug       / House@123');
  console.log('Collector: john@collect.ug     / Collect@123');
  console.log('Recycler:  eco@recyclers.ug    / Recycle@123');
}
main().catch(console.error).finally(() => prisma.$disconnect());
