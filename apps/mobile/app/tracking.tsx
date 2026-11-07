import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { COLORS } from "../src/utils/constants";
import { apiRequest } from "../src/services/api";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useOrderTracking } from "../src/hooks/useOrderTracking";
import { LiveTrackingMap } from "../src/components/LiveTrackingMap";
import * as Location from "expo-location";

const STATUS_MAP: Record<string, { label: string; icon: string; done: boolean }> = {
  pending: { label: "Order confirmed", icon: "check-circle", done: true },
  confirmed: { label: "Order confirmed", icon: "check-circle", done: true },
  driver_assigned: { label: "Driver assigned", icon: "truck-fast-outline", done: true },
  picked_up: { label: "Picked up from station", icon: "package-variant", done: true },
  in_transit: { label: "On the way", icon: "truck-fast-outline", done: true },
  nearby: { label: "Driver nearby", icon: "map-marker", done: true },
  delivered: { label: "Delivered", icon: "home-outline", done: true },
  cancelled: { label: "Cancelled", icon: "close-circle", done: false },
};

const TIMELINE_KEYS = ["pending", "picked_up", "in_transit", "delivered"];

function formatFriendlyAddress(address?: string, city?: string) {
  const cityName = String(city || "").trim();
  const district = String(address || "").split(",").map((part) => part.trim())
    .find((part) => part && !part.includes("+") && part.toLowerCase() !== cityName.toLowerCase()) || "";
  const parts = [cityName, district ? (district.toLowerCase().endsWith("district") ? district : district + " District") : "", "Uganda"].filter(Boolean);
  return parts.filter((part, index) => parts.findIndex((item) => item.toLowerCase() === part.toLowerCase()) === index).join(", ") || "Address details unavailable";
}

interface OrderItem {
  id: string;
  productId?: string;
  quantity: number;
  price: number;
  subtotal: number;
  product?: {
    id?: string;
    name?: string;
    type?: string;
    size?: string;
    weight?: number | string | null;
    description?: string | null;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  station?: { name?: string };
  user?: { name?: string; phone?: string; email?: string };
  items?: OrderItem[];
  deliveries?: Array<{
    driverName?: string;
    driverPhone?: string;
    vehicleNumber?: string;
    status?: string;
  }>;
}

export default function TrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [friendlyAddress, setFriendlyAddress] = useState("");

  // ── SOCKET TRACKING (only when orderId is present) ──
  const { driverLocation, orderStatus, isConnected } = useOrderTracking(orderId || null);

  const fetchOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<Order>("get", `/orders/${orderId}`);
      if (res.success && res.data) {
        setOrder(res.data);
        setError(null);
      } else {
        setError(res.error || "Order not found");
      }
    } catch (err: any) {
      console.error("[Tracking] Fetch error:", err);
      setError(err?.response?.data?.error || err?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await apiRequest<Order[]>("get", "/orders");
      if (res.success && res.data) {
        const active = res.data.filter((o: Order) => o.status !== "delivered" && o.status !== "cancelled");
        setOrders(active);
      }
    } catch (err: any) {
      console.error("[Tracking] Fetch orders error:", err);
    } finally {
      setOrdersLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      // ── No more HTTP polling every 10s — socket handles real-time updates ──
    } else {
      fetchOrders();
    }
  }, [orderId]);

  useEffect(() => {
    if (!order) { setFriendlyAddress(""); return; }
    const raw = String(order.deliveryAddress || "");
    const city = String(order.deliveryCity || "").trim();
    const district = raw.split(",").map((part) => part.trim()).find((part) => part && !part.includes("+") && part.toLowerCase() !== city.toLowerCase()) || "";
    const fallbackParts = [city, district ? (district.toLowerCase().endsWith("district") ? district : district + " District") : "", "Uganda"];
    const fallback = fallbackParts.filter(Boolean).filter((part, index, all) => all.findIndex((item) => item.toLowerCase() === part.toLowerCase()) === index).join(", ");
    setFriendlyAddress(fallback || raw.replace(/,?\\s*[23456789CFGHJMPQRVWX]{4,}\\+[23456789CFGHJMPQRVWX]{2,}/gi, "").trim() || "Address details unavailable");
    const lat = Number(order.deliveryLatitude), lng = Number(order.deliveryLongitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) return;
    let cancelled = false;
    Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }).then((places) => {
      if (cancelled || !places?.length) return;
      const place = places[0];
      const parts = [place.name, place.street, place.district, place.subregion, place.city, place.region, place.country].map((part) => String(part || "").trim()).filter((part) => part && !part.includes("+"));
      const unique = parts.filter((part, index) => parts.findIndex((item) => item.toLowerCase() === part.toLowerCase()) === index);
      if (unique.length && !cancelled) setFriendlyAddress(unique.join(", "));
    }).catch((error) => console.warn("[Tracking] Reverse geocoding unavailable:", error?.message));
    return () => { cancelled = true; };
  }, [order?.id, order?.deliveryAddress, order?.deliveryCity, order?.deliveryLatitude, order?.deliveryLongitude]);
  // Update local order status when socket pushes an update
  useEffect(() => {
    if (orderStatus && order) {
      setOrder((prev) => (prev ? { ...prev, status: orderStatus.status || prev.status } : prev));
    }
  }, [orderStatus]);

  const escapeReceiptHtml = (value: unknown) => {
    const replacements: Record<string, string> = {
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    };
    return String(value ?? "").replace(/[&<>"']/g, (character) => replacements[character] || character);
  };

  const createReceiptHtml = (receipt: Order) => {
    const orderNumber = receipt.id.slice(0, 12).toUpperCase();
    const itemRows = (receipt.items || []).map((item) => `
      <tr>
        <td>${escapeReceiptHtml(item.product?.name || "Gas product")}<small>${escapeReceiptHtml([item.product?.type, item.product?.size, item.product?.weight ? item.product.weight + " kg" : ""].filter(Boolean).join(" · "))}</small></td>
        <td class="num">${Number(item.quantity || 0)}</td>
        <td class="num">UGX ${Number(item.price || 0).toLocaleString("en-UG")}</td>
        <td class="num">UGX ${Number(item.subtotal || 0).toLocaleString("en-UG")}</td>
      </tr>`).join("");
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
      body{font-family:Arial,sans-serif;color:#12372b;padding:24px;max-width:760px;margin:auto}
      .brand{font-size:23px;font-weight:800;color:#08763f}.muted{color:#68786f;font-size:12px}
      .heading{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #f36a21;padding-bottom:14px}
      .status{padding:7px 12px;border-radius:20px;background:#e6f5ec;color:#08763f;font-weight:700;font-size:12px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0}
      .panel{background:#fff8ee;border:1px solid #e1d6c6;border-radius:10px;padding:12px}
      .panel b{display:block;margin-bottom:5px}.panel p{margin:4px 0;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}
      th,td{padding:11px 8px;border-bottom:1px solid #e1d6c6;text-align:left}
      th{background:#f5eddf}.num{text-align:right;white-space:nowrap}small{display:block;color:#68786f;margin-top:4px}
      .total{display:flex;justify-content:space-between;border-top:2px solid #0b3d2e;margin-top:18px;padding-top:15px;font-size:19px;font-weight:800}
      .footer{margin-top:28px;text-align:center;color:#68786f;font-size:11px}
      @media print{body{padding:0}}
    </style></head><body>
      <div class="heading"><div><div class="brand">GasMobil Uganda</div><div class="muted">OFFICIAL CUSTOMER RECEIPT</div><h2>Order #${orderNumber}</h2></div><span class="status">${escapeReceiptHtml(receipt.status || "pending").replace(/_/g," ").toUpperCase()}</span></div>
      <div class="grid">
        <div class="panel"><b>Customer</b><p>${escapeReceiptHtml(receipt.user?.name || "Customer")}</p><p>${escapeReceiptHtml(receipt.user?.phone || "")}</p><p>${escapeReceiptHtml(receipt.user?.email || "")}</p></div>
        <div class="panel"><b>Delivery details</b><p>${escapeReceiptHtml(friendlyAddress || receipt.deliveryCity || "Not provided")}</p><p>${escapeReceiptHtml(receipt.deliveryCity || "")}</p><p>Station: ${escapeReceiptHtml(receipt.station?.name || "GasMobil station")}</p></div>
        <div class="panel"><b>Order details</b><p>Placed: ${escapeReceiptHtml(new Date(receipt.createdAt).toLocaleString())}</p><p>Updated: ${escapeReceiptHtml(receipt.updatedAt ? new Date(receipt.updatedAt).toLocaleString() : "—")}</p></div>
        <div class="panel"><b>Payment</b><p>Method: Cash on Delivery</p><p>Status: ${escapeReceiptHtml(receipt.paymentStatus || "pending").toUpperCase()}</p></div>
      </div>
      <table><thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Line total</th></tr></thead>
      <tbody>${itemRows || '<tr><td colspan="4">Product details unavailable</td></tr>'}</tbody></table>
      <div class="total"><span>TOTAL DUE</span><span>UGX ${Number(receipt.totalAmount || 0).toLocaleString("en-UG")}</span></div>
      <div class="footer">Thank you for choosing GasMobil Uganda.<br>Keep this receipt for your records.</div>
    </body></html>`;
  };

  const getReceiptFileName = () => {
    const orderNumber = order?.id?.slice(0, 12).toUpperCase() || "ORDER";
    return `GasMobil_Receipt_${orderNumber}.pdf`;
  };

  const generateReceiptPdf = async () => {
    if (!order) throw new Error("Order details are not available.");
    const html = createReceiptHtml(order);
    return Print.printToFileAsync({ html, base64: true });
  };

  // Save a real PDF copy into a folder selected by the customer (normally Downloads).
  const downloadReceipt = async () => {
    if (!order) return;
    setReceiptLoading(true);
    try {
      const file = await generateReceiptPdf();
      const base64 = file.base64 || await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Download cancelled", "Choose a folder to save your GasMobil receipt.");
        return;
      }
      const destination = await FileSystem.StorageAccessFramework.createFileAsync(
        permission.directoryUri,
        getReceiptFileName(),
        "application/pdf"
      );
      await FileSystem.writeAsStringAsync(destination, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      Alert.alert("Receipt downloaded", `${getReceiptFileName()} was saved successfully.`);
    } catch (receiptError: any) {
      console.error("[Receipt] PDF download failed:", receiptError);
      Alert.alert("Receipt unavailable", receiptError?.message || "We couldn't save this receipt. Please try again.");
    } finally {
      setReceiptLoading(false);
    }
  };

  const shareReceipt = async () => {
    if (!order) return;
    setReceiptLoading(true);
    try {
      const file = await generateReceiptPdf();
      const namedUri = `${FileSystem.cacheDirectory || file.uri.substring(0, file.uri.lastIndexOf("/") + 1)}${getReceiptFileName()}`;
      await FileSystem.copyAsync({ from: file.uri, to: namedUri });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing unavailable", "Sharing is not available on this device.");
        return;
      }
      await Sharing.shareAsync(namedUri, {
        mimeType: "application/pdf",
        dialogTitle: `Share ${getReceiptFileName()}`,
        UTI: "com.adobe.pdf",
      });
    } catch (receiptError: any) {
      console.error("[Receipt] PDF sharing failed:", receiptError);
      Alert.alert("Receipt unavailable", receiptError?.message || "We couldn't prepare this receipt to share.");
    } finally {
      setReceiptLoading(false);
    }
  };

  const getTimeline = () => {
    const status = order?.status || "pending";
    const statusIndex = TIMELINE_KEYS.indexOf(status);
    return TIMELINE_KEYS.map((key, i) => {
      const mapped = STATUS_MAP[key] || { label: key, icon: "circle-outline", done: false };
      const isDone = i <= statusIndex && status !== "cancelled";
      return {
        status: mapped.label,
        icon: mapped.icon,
        done: isDone,
        time: isDone ? (i === statusIndex ? "Just now" : "Completed") : "—",
      };
    });
  };

  const timeline = getTimeline();

  const navigateToOrderTracking = (id: string) => {
    router.push(`/tracking?orderId=${id}`);
  };

  const activeOrder = orderId && order;
  const latitude = Number(order?.deliveryLatitude);
  const longitude = Number(order?.deliveryLongitude);
  const hasDeliveryCoords = Boolean(
    activeOrder &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180 &&
    (latitude !== 0 || longitude !== 0)
  );

  return (
    <View style={styles.container}>
      <TopBar showBack onBack={() => router.push("/(tabs)")} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── LIVE MAP (replaces mock) ── */}
        {activeOrder && hasDeliveryCoords ? (
          <View style={styles.mapContainer}>
            <LiveTrackingMap
              orderId={order.id}
              deliveryLatitude={latitude}
              deliveryLongitude={longitude}
              driverLocation={driverLocation}
              orderStatus={orderStatus}
              isConnected={isConnected}
            />
          </View>
        ) : activeOrder ? (
          <View style={[styles.mapContainer, styles.mapFallback]}>
            <View style={{ alignItems: "center" }}><Icon name="map-outline" size={28} color={COLORS.accent} /><Text style={styles.mapFallbackText}>Waiting for delivery coordinates...</Text></View>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchOrder} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : activeOrder ? (
          <>
            <View style={styles.card}>
              <Text style={styles.orderId}>
                Order #{order.id?.slice(0, 12)?.toUpperCase() || "GM-UNKNOWN"}
              </Text>
              {order.deliveries?.[0]?.driverName && (
                <Text style={styles.driver}>
                  Driver: {order.deliveries[0].driverName}
                  {order.deliveries[0].vehicleNumber ? ` · ${order.deliveries[0].vehicleNumber}` : ""}
                </Text>
              )}
              {driverLocation && (
                <Text style={styles.driver}>
                  Driver GPS is updating on the live map
                </Text>
              )}
              <Text style={[styles.statusBadge, { color: order.status === "cancelled" ? COLORS.danger : COLORS.accent }]}>
                Status: {(order.status || "pending").replace("_", " ").toUpperCase()}
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => void downloadReceipt()}
                  disabled={receiptLoading}
                  style={[styles.receiptButton, { flex: 1, marginTop: 0 }]}
                >
                  {receiptLoading ? <ActivityIndicator color="#FFFFFF" /> : <Icon name="download" size={19} color="#FFFFFF" />}
                  <Text style={styles.receiptButtonText}>Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => void shareReceipt()}
                  disabled={receiptLoading}
                  style={[styles.receiptButton, { flex: 1, marginTop: 0, backgroundColor: "#155E75" }]}
                >
                  <Icon name="share-variant" size={19} color="#FFFFFF" />
                  <Text style={styles.receiptButtonText}>Share PDF</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>Customer destination</Text>
              <View style={styles.destinationRow}>
                <Icon name="map-marker" size={21} color={COLORS.accent} />
                <View style={styles.destinationCopy}>
                  <Text style={styles.destinationAddress}>{friendlyAddress || order.deliveryCity || "Address details unavailable"}</Text>
                  <Text style={styles.destinationHint}>Delivery location · Uganda</Text>
                </View>
              </View>
              {!!order.notes && <Text style={styles.destinationNotes}>Delivery instructions: {order.notes}</Text>}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>Ordered products</Text>
              {order.items?.length ? (
                <>
                  {order.items.map((item, index) => (
                    <View key={item.id || `${item.productId || "item"}-${index}`} style={styles.productRow}>
                      <View style={styles.productCopy}>
                        <Text style={styles.productName}>{item.product?.name || "Gas product"}</Text>
                        <Text style={styles.productMeta}>
                          {[item.product?.type, item.product?.size, item.product?.weight ? `${item.product.weight} kg` : null]
                            .filter(Boolean).join(" · ") || "Product details"}
                        </Text>
                        <Text style={styles.productUnit}>
                          UGX {Number(item.price || 0).toLocaleString()} each
                        </Text>
                      </View>
                      <View style={styles.productTotals}>
                        <Text style={styles.productQty}>Qty {Number(item.quantity || 0)}</Text>
                        <Text style={styles.productSubtotal}>UGX {Number(item.subtotal || 0).toLocaleString()}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={styles.itemsSummary}>
                    <Text style={styles.itemsSummaryLabel}>Total quantity</Text>
                    <Text style={styles.itemsSummaryValue}>
                      {order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} item(s)
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.emptySub}>Product details were not returned for this order. Please refresh or contact the station.</Text>
              )}
              <View style={styles.itemsSummary}>
                <Text style={styles.itemsSummaryLabel}>Order total · Cash on delivery</Text>
                <Text style={styles.itemsSummaryValue}>UGX {Number(order.totalAmount || 0).toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.timeline}>
              {timeline.map((item, i) => (
                <View key={item.status} style={styles.tl}>
                  <View style={[styles.tlIcon, item.done && styles.tlIconDone]}>
                    <Icon name={item.icon as any} size={18} color={item.done ? "#FFFFFF" : COLORS.muted} />
                  </View>
                  <View style={styles.tlText}>
                    <Text style={styles.tlTitle}>{item.status}</Text>
                    <Text style={styles.tlTime}>{item.time}</Text>
                  </View>
                  {i < timeline.length - 1 && (
                    <View style={[styles.tlLine, item.done && styles.tlLineDone]} />
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          /* No orderId — show list of active orders */
          <>
            <Text style={styles.sectionTitle}>Active Orders</Text>
            {ordersLoading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.accent} />
            ) : orders.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>No active orders to track.</Text>
                <Text style={styles.emptySub}>Place an order first!</Text>
                <TouchableOpacity
                  onPress={() => router.push("/order")}
                  style={[styles.retryBtn, { marginTop: 12 }]}
                >
                  <Text style={styles.retryText}>Place Order →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              orders.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => navigateToOrderTracking(o.id)}
                  activeOpacity={0.8}
                  style={styles.orderCard}
                >
                  <Text style={styles.orderCardId}>Order #{o.id?.slice(0, 8)?.toUpperCase()}</Text>
                  <Text style={styles.orderCardStatus}>
                    {(o.status || "pending").replace("_", " ").toUpperCase()}
                  </Text>
                  {o.deliveryAddress && (
                    <Text style={styles.orderCardAddr}>{formatFriendlyAddress(o.deliveryAddress, o.deliveryCity)}</Text>
                  )}
                  {!!o.items?.length && (
                    <Text style={styles.orderCardAddr}>
                      {o.items.map((item) => `${item.product?.name || "Product"} ×${item.quantity}`).join(" · ")}
                    </Text>
                  )}
                  <Text style={styles.orderCardAmount}>UGX {Number(o.totalAmount || 0).toLocaleString()}</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  mapContainer: { height: 280, marginHorizontal: 16, marginBottom: 14, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border },
  mapFallback: { backgroundColor: "#E8F0E9", alignItems: "center", justifyContent: "center" },
  mapFallbackText: { color: COLORS.text, fontSize: 14 },
  destinationRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  destinationCopy: { flex: 1 },
  destinationAddress: { color: COLORS.text, fontSize: 14, fontWeight: "800", lineHeight: 20 },
  destinationHint: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  destinationNotes: { color: COLORS.text, fontSize: 12, lineHeight: 18, marginTop: 10 },
  connectionBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  connectionText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  center: { alignItems: "center", marginTop: 60, paddingHorizontal: 24 },
  loadingText: { color: COLORS.muted, marginTop: 12 },
  errorText: { color: COLORS.danger, fontSize: 14, textAlign: "center" },
  retryBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, marginTop: 16 },
  retryText: { color: "#fff", fontWeight: "600" },
  card: { marginHorizontal: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16, marginBottom: 14 },
  receiptButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#12834B", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginTop: 12 },
  receiptButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  orderId: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  driver: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  statusBadge: { fontSize: 12, fontWeight: "700", marginTop: 8 },
  timeline: { marginHorizontal: 16, marginTop: 8 },
  tl: { flexDirection: "row", gap: 14, paddingVertical: 12, position: "relative" },
  tlIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1a2236", alignItems: "center", justifyContent: "center", zIndex: 1 },
  tlIconDone: { backgroundColor: COLORS.accent },
  tlText: { flex: 1 },
  tlTitle: { color: "#FFF8EE", fontSize: 13, fontWeight: "600" },
  tlTime: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  tlLine: { position: "absolute", left: 15, top: 32, bottom: 0, width: 2, backgroundColor: "#1a2236" },
  tlLineDone: { backgroundColor: COLORS.accent },
  cardSectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#FFF8EE", paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
  emptyTitle: { color: "#FFF8EE", fontSize: 16, fontWeight: "600" },
  emptySub: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  orderCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 10 },
  orderCardId: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  orderCardStatus: { color: COLORS.accent, fontSize: 11, fontWeight: "700", marginTop: 4, textTransform: "uppercase" },
  orderCardAddr: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  orderCardAmount: { color: COLORS.accent, fontSize: 14, fontWeight: "700", marginTop: 6 },
  productRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  productCopy: { flex: 1 },
  productName: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  productMeta: { color: COLORS.muted, fontSize: 11, marginTop: 3, textTransform: "capitalize" },
  productUnit: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  productTotals: { alignItems: "flex-end", minWidth: 92 },
  productQty: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  productSubtotal: { color: COLORS.accent, fontSize: 12, fontWeight: "800", marginTop: 4 },
  itemsSummary: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingTop: 12, marginTop: 8 },
  itemsSummaryLabel: { color: COLORS.muted, fontSize: 11, flex: 1 },
  itemsSummaryValue: { color: COLORS.text, fontSize: 12, fontWeight: "800", textAlign: "right" },
});
