import React, { useState, useRef, useEffect } from 'react';
import { useAgentNotifications } from '../hooks/useAgentNotifications';

interface NotificationBellProps {
  token: string;
  userRole: 'admin' | 'agent';
}

export default function NotificationBell({ token, userRole }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useAgentNotifications(token);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recentNotifications = notifications.slice(0, 8);

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffMs / 86400000)}d`;
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.bellButton}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <span style={styles.dropdownTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={styles.markAllButton}>
                Mark all read
              </button>
            )}
          </div>

          <div style={styles.dropdownList}>
            {recentNotifications.length === 0 ? (
              <div style={styles.emptyDropdown}>
                <span style={{ fontSize: 24 }}>🔔</span>
                <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 13 }}>
                  No notifications
                </p>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id);
                  }}
                  style={{
                    ...styles.dropdownItem,
                    ...(n.isRead ? styles.readItem : styles.unreadItem),
                  }}
                >
                  <div style={styles.itemDot}>
                    {!n.isRead && <span style={styles.unreadItemDot} />}
                  </div>
                  <div style={styles.itemContent}>
                    <p style={styles.itemTitle}>{n.title}</p>
                    <p style={styles.itemMessage}>{n.message}</p>
                    <span style={styles.itemTime}>{formatTime(n.createdAt)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    style={styles.itemDelete}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <a
            href={userRole === 'admin' ? '/admin/notifications' : '/agent/notifications'}
            style={styles.viewAllLink}
            onClick={() => setIsOpen(false)}
          >
            View all notifications →
          </a>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bellButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#374151',
    transition: 'background-color 0.15s',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    borderRadius: 9,
    backgroundColor: '#dc2626',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #fff',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 380,
    maxHeight: 480,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    border: '1px solid #e5e7eb',
    zIndex: 1000,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
  },
  markAllButton: {
    fontSize: 12,
    color: '#3b82f6',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
  },
  dropdownList: {
    overflowY: 'auto',
    maxHeight: 360,
  },
  emptyDropdown: {
    padding: 32,
    textAlign: 'center',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.1s',
  },
  unreadItem: {
    backgroundColor: '#eff6ff',
  },
  readItem: {
    backgroundColor: '#fff',
  },
  itemDot: {
    width: 8,
    height: 8,
    marginTop: 6,
    flexShrink: 0,
  },
  unreadItemDot: {
    display: 'block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    margin: '0 0 2px',
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
  },
  itemMessage: {
    margin: 0,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    display: 'block',
  },
  itemDelete: {
    width: 20,
    height: 20,
    borderRadius: 4,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  viewAllLink: {
    display: 'block',
    padding: '12px 16px',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: '#3b82f6',
    textDecoration: 'none',
    borderTop: '1px solid #f3f4f6',
    backgroundColor: '#f9fafb',
  },
};