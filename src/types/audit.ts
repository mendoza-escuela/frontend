export type AuditEvent = {
  id: string; createdAt: string; actorUserId: string | null; action: string;
  entityType: string; entityId: string | null; changes: Record<string, unknown>;
  requestId: string | null; sourceIp: string | null; service: string;
  severity: 'info' | 'warning' | 'error';
};
export type AuditFilters = {
  page: number; limit: number; action?: string; severity?: string;
  actorUserId?: string; requestId?: string; from?: string; to?: string;
};
export type AuditPage = {
  items: AuditEvent[]; total: number; page: number; limit: number; totalPages: number;
};
export type MonitoringStatus = {
  timestamp: string; api: string; database: string; latencyMs: number; uptimeSeconds: number;
  monitoring: {
    mode: 'internal'; status: 'ok' | 'degraded';
    latest: { checkedAt: string; database: boolean; frontend: boolean; smtpConfigured: boolean; recipientCount: number; notificationStatus: string; lastNotificationAt: string | null };
  };
  alerts: { responsible: string; channel: string; ready: boolean };
  retention: { minimumDays: number; purge: string; protected: boolean; triggersInstalled: boolean; runtimePrivileged: boolean };
  auditWriter: { lastWriteFailureAt: string | null };
};
