import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  orderId?: string;
  data?: any;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function NotificationPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "all" as "all" | "unread" | "read", type: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.data || []);
      else setError(data.error || "Failed to load notifications");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      console.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      console.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      console.error("Failed to delete notification");
    }
  };

  const filtered = notifications.filter((n) => {
    if (filters.status === "unread" && n.isRead) return false;
    if (filters.status === "read" && !n.isRead) return false;
    if (filters.type !== "all" && n.type !== filters.type) return false;
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && !n.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  const formatTime = (date: string) => new Date(date).toLocaleString();

  const getTypeColor = (type: string) => {
    switch (type) {
      case "order_placed": return "#3b82f6";
      case "payment_received": return "#10b981";
      case "cancelled": return "#ef4444";
      case "delivered": return "#8b5cf6";
      default: return "#6b7280";
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Notifications</h1>
          <p style={styles.subtitle}>
            {unreadCount > 0 ? (
              <span style={styles.unreadBadge}>{unreadCount} unread</span>
            ) : (
              "All caught up"
            )}
          </p>
        </div>
        <div style={styles.headerActions}>
          {unreadCount > 0 && (
            <button style={styles.primaryButton} onClick={markAllAsRead}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div style={styles.filtersBar}>
        <div style={styles.tabGroup}>
          {(["all", "unread", "read"] as const).map((tab) => (
            <button
              key={tab}
              style={{
                ...styles.tab,
                ...(filters.status === tab ? styles.tabActive : {}),
              }}
              onClick={() => setFilters((f) => ({ ...f, status: tab }))}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "unread" && unreadCount > 0 && (
                <span style={styles.tabBadge}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
        <div style={styles.filterGroup}>
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          ⚠️ {error}
          <button style={styles.retryButton} onClick={fetchNotifications}>Retry</button>
        </div>
      )}

      {loading && notifications.length === 0 && (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p>Loading notifications...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔔</div>
          <h3>No notifications</h3>
          <p>
            {filters.status === "unread"
              ? "You have no unread notifications."
              : filters.status === "read"
              ? "No read notifications yet."
              : "No notifications match your filters."}
          </p>
        </div>
      )}

      <div style={styles.notificationList}>
        {filtered.map((notification) => (
          <div
            key={notification.id}
            className="notification-card"
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
            <div style={{ ...styles.typeIndicator, backgroundColor: getTypeColor(notification.type) }} />
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <h4 style={styles.cardTitle}>
                  {!notification.isRead && <span style={styles.unreadDot} />}
                  {notification.title}
                </h4>
                <span style={styles.timestamp}>{formatTime(notification.createdAt)}</span>
              </div>
              <p style={styles.cardMessage}>{notification.message}</p>

              {selectedNotification === notification.id && notification.data && (
                <div style={styles.detailsPanel}>
                  {notification.orderId && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Order:</span>
                      <a href={`/orders`} style={styles.detailLink}>#{notification.orderId.slice(0, 8)}</a>
                    </div>
                  )}
                  {notification.data?.customerName && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Customer:</span>{notification.data.customerName}
                    </div>
                  )}
                  {notification.data?.amount && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Amount:</span>
                      <span style={styles.amount}>UGX {Number(notification.data.amount).toLocaleString()}</span>
                    </div>
                  )}
                  {notification.data?.driverName && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Driver:</span>{notification.data.driverName}
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
                    <span style={styles.typeBadge}>{notification.type.replace(/_/g, " ")}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="card-actions" style={styles.cardActions}>
              {!notification.isRead && (
                <button style={styles.actionButton} onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} title="Mark as read">
                  ✓
                </button>
              )}
              <button style={styles.deleteButton} onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} title="Delete">
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <span>Showing {filtered.length} of {notifications.length} notifications</span>
        <span>{unreadNotifications.length} unread · {readNotifications.length} read</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui, -apple-system, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, margin: 0, color: "#111827" },
  subtitle: { margin: "4px 0 0", color: "#6b7280", fontSize: 14 },
  unreadBadge: { display: "inline-flex", alignItems: "center", backgroundColor: "#fee2e2", color: "#dc2626", padding: "2px 10px", borderRadius: 999, fontSize: 13, fontWeight: 600 },
  headerActions: { display: "flex", gap: 8, alignItems: "center" },
  primaryButton: { padding: "8px 16px", backgroundColor: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  filtersBar: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, padding: 16, backgroundColor: "#f9fafb", borderRadius: 12, border: "1px solid #e5e7eb" },
  tabGroup: { display: "flex", gap: 4, backgroundColor: "#e5e7eb", padding: 4, borderRadius: 8 },
  tab: { padding: "6px 14px", borderRadius: 6, border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#6b7280", position: "relative" },
  tabActive: { backgroundColor: "#fff", color: "#111827", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  tabBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  filterGroup: { display: "flex", gap: 8, flex: 1, justifyContent: "flex-end", flexWrap: "wrap" },
  searchInput: { padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", backgroundColor: "#fff", fontSize: 13, minWidth: 200, outline: "none" },
  errorBanner: { padding: "12px 16px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 12, fontSize: 14 },
  retryButton: { marginLeft: "auto", padding: "4px 12px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" },
  loadingState: { textAlign: "center", padding: 60, color: "#6b7280" },
  spinner: { width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#111827", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" },
  emptyState: { textAlign: "center", padding: 80, color: "#6b7280" },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  notificationList: { display: "flex", flexDirection: "column", gap: 8 },
  notificationCard: { display: "flex", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "#fff", cursor: "pointer", transition: "all 0.15s ease" },
  unreadCard: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  readCard: { backgroundColor: "#fff", borderColor: "#e5e7eb" },
  selectedCard: { boxShadow: "0 4px 12px rgba(0,0,0,0.08)", borderColor: "#3b82f6" },
  typeIndicator: { width: 4, minHeight: 40, borderRadius: 2, flexShrink: 0, marginTop: 4 },
  cardContent: { flex: 1, minWidth: 0 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: "50%", backgroundColor: "#3b82f6", display: "inline-block" },
  timestamp: { fontSize: 12, color: "#9ca3af", flexShrink: 0, whiteSpace: "nowrap" },
  cardMessage: { margin: 0, fontSize: 14, color: "#4b5563", lineHeight: 1.5 },
  detailsPanel: { marginTop: 12, padding: 12, backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" },
  detailRow: { display: "flex", gap: 8, marginBottom: 6, fontSize: 13 },
  detailLabel: { color: "#6b7280", fontWeight: 500, minWidth: 80 },
  detailLink: { color: "#3b82f6", textDecoration: "none", fontWeight: 600 },
  amount: { fontWeight: 700, color: "#059669" },
  scopeBadge: { display: "inline-block", padding: "2px 8px", borderRadius: 4, backgroundColor: "#e0e7ff", color: "#4338ca", fontSize: 11, fontWeight: 600, textTransform: "uppercase" },
  typeBadge: { fontSize: 12, fontWeight: 600, textTransform: "capitalize" },
  cardActions: { display: "flex", gap: 4, flexDirection: "column", opacity: 0, transition: "opacity 0.15s ease" },
  actionButton: { width: 28, height: 28, borderRadius: 6, border: "1px solid #d1d5db", backgroundColor: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 },
  deleteButton: { width: 28, height: 28, borderRadius: 6, border: "1px solid #fee2e2", backgroundColor: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 },
  footer: { display: "flex", justifyContent: "space-between", marginTop: 20, padding: "12px 0", borderTop: "1px solid #e5e7eb", fontSize: 13, color: "#6b7280" },
};