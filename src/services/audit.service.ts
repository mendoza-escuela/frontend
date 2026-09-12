import { api } from '../lib/api';
import type { AuditFilters, AuditPage, MonitoringStatus } from '../types/audit';

export const auditService = {
  async list(filters: AuditFilters, signal?: AbortSignal) {
    return (await api.get<AuditPage>('/admin/audit', { params: filters, signal, timeout: 15000 })).data;
  },
  async monitoring(signal?: AbortSignal) {
    return (await api.get<MonitoringStatus>('/admin/monitoring', { signal, timeout: 15000 })).data;
  },
};
