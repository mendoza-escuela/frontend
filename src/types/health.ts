export type HealthStatus = {
  status: 'ok';
  uptime: number;
  timestamp: string;
};

export type DatabaseHealthStatus = {
  status: 'ok';
  database: 'postgres';
  latencyMs: number;
  timestamp: string;
};
