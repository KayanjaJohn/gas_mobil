import React, { useState } from 'react';
import { useAgentNotifications } from '../src/hooks/useAAgentNotifications';

const NOTIFICATION_TYPES = [
  { value: 'all', label: 'All Types', color: '#6b7280' },
  { value: 'order_placed', label: 'New Orders', color: '#3b82f6' },
  { value: 'order_confirmed', label: 'Confirmed', color: '#10b981' },
  { value: 'driver_assigned', label: 'Driver Assigned', color: '#8b5cf6' },
  { value: 'picked_up', label: 'Picked Up', color: '#f59e0b' },
  { value: 'in_transit', label: 'In Transit', color: '#06b6d4' },
  { value: 'nearby', label: 'Nearby', color: '#ec4899' },
  { value: 'delivered', label: 'Delivered', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  { value: 'payment_received', label: 'Payment', color: '#14b8a6' },
  { value: 'payment_failed', label: 'Payment Failed', color: '#dc2626' },
  { value: 'wallet_debited', label: 'Wallet', color: '#f97316' },
  { value: 'driver_status_changed', label: 'Driver Status', color: '#6366f1' },
  { value: 'system_announcement', label: 'System', color: '#64748b' },
];

function getTypeColor(type: string): string {
  const found = NOTIFICATION_TYPES.find((t) => t.value === type);
  return found?.color || '#6b7280';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface NotificationsPageProps {
  token: string;
  userRole: 'admin' | 'agent';
}

export default function NotificationsPage({ token, userRole }: NotificationsPageProps) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    filters,
    setFilters,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useAgentNotifications(token);

  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBySearch = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.orderId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {userRole === 'admin' ? 'Admin Notifications' : 'Station Notifications'}
          </h1>
          <p style={styles.subtitle}>
            {unreadCount > 0 ? (
              <span style={styles.unreadBadge}>{unreadCount} unread</span>
            ) : (
              'All caught up'
            )}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={refresh} style={styles.iconButton} title="Refresh">
            🔄
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} style={styles.primaryButton}>
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div style={styles.filtersBar}>
        <div style={styles.tabGroup}>
          {(['all', 'unread', 'read'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilters({ ...filters, status: tab })}
              style={{
                ...styles.tab,
                ...(filters.status === tab ? styles.tabActive : {}),
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'unread' && unreadCount > 0 && (
                <span style={styles.tabBadge}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        <div style={styles.filterGroup}>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            style={styles.select}
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
            style={styles.select}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={styles.errorBanner}>
          ⚠️ {error}
          <button onClick={refresh} style={styles.retryButton}>Retry</button>
        </div>
      )}

      {/* Loading State */}
      {loading && notifications.length === 0 && (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Loading notifications...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBySearch.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔔</div>
          <h3>No notifications</h3>
          <p>
            {filters.status === 'unread'
              ? "You have no unread notifications."
              : filters.status === 'read'
              ? "No read notifications yet."
              : "No notifications match your filters."}
          </p>
        </div>
      )}

      {/* Notification List */}
      <div style={styles.notificationList}>
        {filteredBySearch.map((notification) => (
          <div
            key={notification.id}
            onClick={() => {
              if (!notification.isRead) markAsRead(notification.id);
              setSelectedNotification(
                selectedNotification === notification.id ? null : notification.id
              );
            }}
            style={{
              ...styles.notificationCard,
              ...(notification.isRead ? styles.readCard : styles.unreadCard),
              ...(selectedNotification === notification.id ? styles.selectedCard : {}),
            }}
          >
            {/* Type Indicator */}
            <div
              style={{
                ...styles.typeIndicator,
                backgroundColor: getTypeColor(notification.type),
              }}
            />

            {/* Content */}
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <h4 style={styles.cardTitle}>
                  {!notification.isRead && <span style={styles.unreadDot} />}
                  {notification.title}
                </h4>
                <span style={styles.timestamp}>{formatTime(notification.createdAt)}</span>
              </div>

              <p style={styles.cardMessage}>{notification.message}</p>

              {/* Expanded Details */}
              {selectedNotification === notification.id && notification.data && (
                <div style={styles.detailsPanel}>
                  {notification.orderId && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Order ID:</span>
                      <a
                        href={`/orders/${notification.orderId}`}
                        style={styles.detailLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        #{notification.orderId.slice(0, 8).toUpperCase()}
                      </a>
                    </div>
                  )}
                  {notification.data?.customerName && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Customer:</span>
                      <span>{notification.data.customerName}</span>
                    </div>
                  )}
                  {notification.data?.amount && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Amount:</span>
                      <span style={styles.amount}>
                        UGX {Number(notification.data.amount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {notification.data?.driverName && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Driver:</span>
                      <span>{notification.data.driverName}</span>
                    </div>
                  )}
                  {notification.data?.scope && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Scope:</span>
                      <span style={styles.scopeBadge}>{notification.data.scope}</span>
                    </div>
                  )}
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Type:</span>
                    <span style={{ ...styles.typeBadge, color: getTypeColor(notification.type) }}>
                      {notification.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={styles.cardActions}>
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                  style={styles.actionButton}
                  title="Mark as read"
                >
                  ✓
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this notification?')) {
                    deleteNotification(notification.id);
                  }
                }}
                style={styles.deleteButton}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      <div style={styles.footer}>
        <span>
          Showing {filteredBySearch.length} of {notifications.length} notifications
        </span>
        <span>
          {unreadNotifications.length} unread · {readNotifications.length} read
        </span>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: 24,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    color: '#111827',
  },
  subtitle: {
    margin: '4px 0 0',
    color: '#6b7280',
    fontSize: 14,
  },
  unreadBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '2px 10px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
  },
  headerActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
  },
  primaryButton: {
    padding: '8px 16px',
    backgroundColor: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  filtersBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
  },
  tabGroup: {
    display: 'flex',
    gap: 4,
    backgroundColor: '#e5e7eb',
    padding: 4,
    borderRadius: 8,
  },
  tab: {
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: '#6b7280',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#fff',
    color: '#111827',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    width: 18,
    height: 18,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterGroup: {
    display: 'flex',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  select: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    fontSize: 13,
    color: '#374151',
    cursor: 'pointer',
  },
  searchInput: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    fontSize: 13,
    minWidth: 200,
    outline: 'none',
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: 8,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
  },
  retryButton: {
    marginLeft: 'auto',
    padding: '4px 12px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
  loadingState: {
    textAlign: 'center',
    padding: 60,
    color: '#6b7280',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e5e7eb',
    borderTopColor: '#111827',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: 80,
    color: '#6b7280',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  notificationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  notificationCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  unreadCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  readCard: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
  },
  selectedCard: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    borderColor: '#3b82f6',
  },
  typeIndicator: {
    width: 4,
    minHeight: 40,
    borderRadius: 2,
    flexShrink: 0,
    marginTop: 4,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'inline-block',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  cardMessage: {
    margin: 0,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 1.5,
  },
  detailsPanel: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
  },
  detailRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 6,
    fontSize: 13,
  },
  detailLabel: {
    color: '#6b7280',
    fontWeight: 500,
    minWidth: 80,
  },
  detailLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: 600,
  },
  amount: {
    fontWeight: 700,
    color: '#059669',
  },
  scopeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  typeBadge: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  cardActions: {
    display: 'flex',
    gap: 4,
    flexDirection: 'column',
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: '1px solid #fee2e2',
    backgroundColor: '#fef2f2',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 20,
    padding: '12px 0',
    borderTop: '1px solid #e5e7eb',
    fontSize: 13,
    color: '#6b7280',
  },
};

// Add hover effect for card actions via CSS-in-JS workaround
const hoverStyles = `
  .notification-card:hover .card-actions {
    opacity: 1 !important;
  }
`;