import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(), password: z.string().min(6),
});

export const registerHouseholdSchema = z.object({
  name: z.string().min(2).max(100), email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs number'),
  phone: z.string().min(10).optional(), address: z.string().min(5),
  districtId: z.string().optional(), zoneId: z.string().optional(),
  latitude: z.number().optional(), longitude: z.number().optional(),
});

export const addRecyclerSchema = z.object({
  name: z.string().min(2), email: z.string().email(), password: z.string().min(8),
  phone: z.string().optional(), companyName: z.string().min(2),
  businessLicense: z.string().min(5), address: z.string().min(5),
  wasteTypes: z.array(z.string()).min(1), capacity: z.number().positive(),
  latitude: z.number().optional(), longitude: z.number().optional(),
});

export const collectorRequestSchema = z.object({
  vehicleType: z.string().min(2), vehiclePlate: z.string().min(4),
  reason: z.string().max(500).optional(),
});

export const approveCollectorSchema = z.object({
  action: z.literal('approve'), zoneId: z.string().min(1), adminNote: z.string().optional(),
});

export const rejectCollectorSchema = z.object({
  action: z.literal('reject'), adminNote: z.string().min(5),
});

export const createPickupSchema = z.object({
  categoryId: z.string().min(1), wasteType: z.string().min(1),
  estimatedWeight: z.number().positive().max(10000),
  description: z.string().max(500).optional(), address: z.string().min(5),
  latitude: z.number().optional(), longitude: z.number().optional(),
  preferredDate: z.string().optional(), notes: z.string().max(500).optional(),
});

export const updatePickupStatusSchema = z.object({
  status: z.enum(['ACCEPTED','EN_ROUTE','COLLECTED','DELIVERED','CANCELLED']),
  actualWeight: z.number().positive().optional(), notes: z.string().optional(),
});

export const createRatingSchema = z.object({
  score: z.number().int().min(1).max(5), comment: z.string().max(500).optional(),
});

export const createBidSchema = z.object({
  pickupId: z.string().min(1), pricePerKg: z.number().positive(),
  message: z.string().max(300).optional(),
});

export const updateCollectorStatusSchema = z.object({
  status: z.enum(['ACTIVE','SUSPENDED','REJECTED']), reason: z.string().optional(),
});
