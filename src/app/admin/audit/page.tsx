'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import {
  getAuditLogs,
  getAllNotifications,
  markNotificationRead,
  AuditRow,
  NotificationRow,
} from '@/lib/api';

export default function AdminAuditPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading system audit logs…</p>
            </div>
          </div>
        }
      >
        <AuditLogsContent />
      </Suspense>
    </AuthGuard>
  );
}

function AuditLogsContent() {
  const [notificationsList, setNotificationsList] = useState<NotificationRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [logs, notifs] = await Promise.all([getAuditLogs(50), getAllNotifications()]);
      setAuditLogs(logs);
      setNotificationsList(notifs);
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load audit trail');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRetryNotification = async (notifId: string) => {
    setNotificationsList((list) => list.map((n) => (n.id === notifId ? { ...n, is_read: true } : n)));
    try {
      await markNotificationRead(notifId);
    } catch {
      setNotificationsList((list) => list.map((n) => (n.id === notifId ? { ...n, is_read: false } : n)));
    }
  };

  const queuedCount = notificationsList.filter((n) => !n.is_read).length;

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-file-earmark-text" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Security &amp; Compliance</p>
            <h1 className="h3 mb-1">System Audit Trail &amp; Notification Queue</h1>
            <p className="text-muted mb-0">
              Immutable record of administrative actions, system events and notification dispatch.
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={loadData}>
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Refresh Audit Trail
          </button>
        </div>
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{loadError}</span>
        </div>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-shield-lock" aria-hidden="true" />
              <span>Immutable Audit Log Stream</span>
            </h2>
            <p className="text-muted mb-0">FR-4.5 · Section 5.1</p>
          </div>
          <span className="badge text-bg-secondary">{auditLogs.length} events</span>
        </div>

        {isLoading ? (
          <p className="text-muted small mb-0">Loading audit trail…</p>
        ) : auditLogs.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-journal-x" aria-hidden="true" />
            <p className="mb-0">No audit events recorded yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Entity</th>
                  <th scope="col">Action</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Details</th>
                  <th scope="col" className="text-end">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="fw-semibold">{log.entity}</td>
                    <td>
                      <span className="badge text-bg-primary">{log.action}</span>
                    </td>
                    <td>{log.actor}</td>
                    <td className="text-muted small">{log.details}</td>
                    <td className="text-end text-muted small">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel mt-3">
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-bell" aria-hidden="true" />
              <span>Async Notification Dispatch Queue</span>
            </h2>
            <p className="text-muted mb-0">Technical Debt #2 · FR-6.3</p>
          </div>
          <span className="badge text-bg-warning">{queuedCount} queued</span>
        </div>

        {isLoading ? (
          <p className="text-muted small mb-0">Loading notification queue…</p>
        ) : notificationsList.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-bell-slash" aria-hidden="true" />
            <p className="mb-0">The notification queue is empty.</p>
          </div>
        ) : (
          <div className="d-grid gap-2">
            {notificationsList.map((notif) => (
              <div className="settings-row" key={notif.id}>
                <span>
                  <strong>
                    {notif.title}
                    {notif.user && <span className="text-muted fw-normal"> → {notif.user.full_name}</span>}{' '}
                    <span className={`badge ${notif.is_read ? 'text-bg-success' : 'text-bg-warning'}`}>
                      {notif.is_read ? 'SENT' : 'QUEUED'}
                    </span>
                  </strong>
                  <small>{notif.message}</small>
                </span>
                <button className="btn btn-light btn-sm" type="button" onClick={() => handleRetryNotification(notif.id)}>
                  <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Retry
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
