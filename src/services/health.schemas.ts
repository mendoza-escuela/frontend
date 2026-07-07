import { z } from 'zod';

export const healthStatusSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  timestamp: z.string(),
});

export const databaseHealthStatusSchema = z.object({
  status: z.literal('ok'),
  database: z.literal('postgres'),
  latencyMs: z.number(),
  timestamp: z.string(),
});
