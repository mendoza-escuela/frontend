// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditAdminPage } from './AuditAdminPage';
import { auditService } from '../../services/audit.service';

vi.mock('../../services/audit.service', () => ({ auditService: { list: vi.fn(), monitoring: vi.fn() } }));
const monitoring = {
  timestamp: '2026-09-12T12:00:00Z', api: 'ok', database: 'ok', latencyMs: 3, uptimeSeconds: 60,
  monitoring: { mode: 'internal' as const, status: 'ok' as const, latest: {
    checkedAt: '2026-09-12T12:00:00Z', database: true, frontend: true,
    smtpConfigured: false, recipientCount: 1, notificationStatus: 'unconfigured', lastNotificationAt: null,
  } },
  alerts: { responsible: 'Usuarios activos con rol administrador', channel: 'email', ready: false },
  retention: { minimumDays: 365, purge: 'Solo mantenimiento autorizado', protected: false, triggersInstalled: true, runtimePrivileged: true },
  auditWriter: { lastWriteFailureAt: null },
};
describe('Auditoría y salud', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auditService.list).mockResolvedValue({ items: [], total: 0, page: 1, limit: 25, totalPages: 1 });
    vi.mocked(auditService.monitoring).mockResolvedValue(monitoring);
  });
  it('muestra la supervisión interna y las dependencias pendientes', async () => {
    render(<MemoryRouter><AuditAdminPage /></MemoryRouter>);
    expect(await screen.findByText('Supervisión interna: Operativa.')).toBeDefined();
    expect(screen.getByText('SMTP: Pendiente de configurar.')).toBeDefined();
    expect(screen.getByText(/usar una cuenta de aplicación sin privilegios/)).toBeDefined();
    expect(screen.getByText('Mínimo de 365 días.')).toBeDefined();
    expect(screen.queryByText('Configuradas')).toBeNull();
  });
  it('aplica filtros y muestra datos como texto, sin interpretar HTML', async () => {
    vi.mocked(auditService.list).mockResolvedValue({ items: [{ id: '1', createdAt: monitoring.timestamp,
      actorUserId: null, action: 'AUTH_LOGIN_FAILED', entityType: 'http', entityId: null,
      changes: { text: '<img src=x onerror=alert(1)>' }, requestId: null, sourceIp: '127.0.0.1', service: 'backend', severity: 'warning' }], total: 1, page: 1, limit: 25, totalPages: 1 });
    const { container } = render(<MemoryRouter><AuditAdminPage /></MemoryRouter>);
    await screen.findByText('AUTH_LOGIN_FAILED');
    expect(container.querySelector('img')).toBeNull();
    fireEvent.change(screen.getByLabelText('Código del evento'), { target: { value: 'AUTH_LOGIN_FAILED' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await waitFor(() => expect(auditService.list).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'AUTH_LOGIN_FAILED', page: 1 }), expect.any(AbortSignal)));
  });
  it('retira el estado disponible cuando falla la actualización', async () => {
    render(<MemoryRouter><AuditAdminPage /></MemoryRouter>);
    await screen.findByText(/API disponible/);
    vi.mocked(auditService.monitoring).mockRejectedValue(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    await screen.findByRole('alert');
    expect(screen.queryByText(/API disponible/)).toBeNull();
  });
});
