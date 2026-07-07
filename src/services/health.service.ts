import { api } from '../lib/api';
import type { DatabaseHealthStatus, HealthStatus } from '../types/health';
import {
  databaseHealthStatusSchema,
  healthStatusSchema,
} from './health.schemas';

export async function getHealthStatus(): Promise<HealthStatus> {
  const response = await api.get<unknown>('/health');
  return healthStatusSchema.parse(response.data);
}

export async function getDatabaseHealthStatus(): Promise<DatabaseHealthStatus> {
  const response = await api.get<unknown>('/health/database');
  return databaseHealthStatusSchema.parse(response.data);
}
