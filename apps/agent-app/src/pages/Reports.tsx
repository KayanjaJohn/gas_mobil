import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Grid, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography
} from '@mui/material';
import { Assessment, Download, Event, Today, ViewWeek } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface ReportOrderItem {
  id?: string;
  productId?: string;
  quantity: number;
  price: number | string;
  subtotal: number | string;
  product?: { name?: string; type?: string; size?: string | null; weight?: number | string | null; description?: string | null; imageUrl?: string | null };
}
interface Order {
  id: string;
  status: string;
  totalAmount: number | string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt: string;
  userId?: string;
  deliveryAddress?: string;
  deliveryCity?: string | null;
  deliveryLatitude?: number | string | null;
  deliveryLongitude?: number | string | null;
  locationAccuracy?: number | string | null;
  notes?: string | null;
  cancellationReason?: string | null;
  updatedAt?: string;
  stationId?: string;
  user?: { id?: string; name: string; phone?: string; email?: string; address?: string; city?: string };
  driver?: { name: string };
  station?: { id?: string; name: string };
  items?: ReportOrderItem[];
  deliveries?: Array<{
    driverName?: string; driverPhone?: string; vehicleNumber?: string; status?: string;
    pickedUpAt?: string | null; startedAt?: string | null; deliveredAt?: string | null; notes?: string | null;
  }>;
}

const periodOptions: Array<{ value: ReportPeriod; label: string; icon: JSX.Element }> = [
  { value: 'daily', label: 'Daily', icon: <Today /> },
  { value: 'weekly', label: 'Weekly', icon: <ViewWeek /> },
  { value: 'monthly', label: 'Monthly', icon: <Event /> },
  { value: 'yearly', label: 'Yearly', icon: <Event /> },
];

const statusColors: Record<string, 'default' | 'error' | 'info' | 'primary' | 'secondary' | 'success' | 'warning'> = {
  pending: 'warning',
  confirmed: 'info',
  driver_assigned: 'primary',
  picked_up: 'secondary',
  in_transit: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'error',
  failed: 'error',
  refunded: 'default',
};

const getPeriodStart = (period: ReportPeriod) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  if (period === 'weekly') {
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + mondayOffset);
  }

  if (period === 'monthly') date.setDate(1);

  if (period === 'yearly') {
    date.setMonth(0, 1);
  }

  return date;
};

const getTotalQuantity = (order: Order) =>
  (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

const getCODOutstanding = (order: Order) => {
  const excluded = ['cancelled', 'failed', 'refunded'].includes(order.status);
  const isCash = !order.paymentMethod || order.paymentMethod.toLowerCase() === 'cash';
  return !excluded && isCash && (order.paymentStatus || 'pending') === 'pending'
    ? Number(order.totalAmount || 0) : 0;
};

const getProductDetails = (order: Order) => {
  if (!order.items?.length) return 'Item details unavailable';
  return order.items.map((item) => {
    const product = item.product;
    const attributes = [product?.type, product?.size, product?.weight ? `${product.weight} kg` : null]
      .filter(Boolean).join(' / ');
    return [product?.name || 'Product', attributes ? `[${attributes}]` : '',
      `Qty ${Number(item.quantity || 0)}`,
      `Unit UGX ${Number(item.price || 0).toLocaleString()}`,
      `Line UGX ${Number(item.subtotal || 0).toLocaleString()}`,
      product?.description || '',
      item.productId ? `Product ID ${item.productId}` : ''].filter(Boolean).join(' · ');
  }).join(' | ');
};

const formatPeriodLabel = (period: ReportPeriod, start: Date) => {
  const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  if (period === 'daily') return formatter.format(start);
  if (period === 'weekly') {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }

  if (period === 'monthly') return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(start);
  return String(start.getFullYear());
};

export default function Reports() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historicalProductMismatches, setHistoricalProductMismatches] = useState(0);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupPhrase, setCleanupPhrase] = useState('');
  const [cleanupCounts, setCleanupCounts] = useState<any>(null);
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState('');

  useEffect(() => {
    if (!token || !user?.station?.id) {
      setOrders([]);
      return;
    }
    void fetchOrders();
  }, [token, user?.station?.id]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${API_URL}/agent/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(Array.isArray(res.data.data) ? res.data.data : []);
      setHistoricalProductMismatches(Number(res.data.meta?.ordersWithHistoricalProductStationMismatch || 0));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const stationOrders = useMemo(() => {
    const stationId = user?.station?.id;
    if (!stationId) return [];
    return orders.filter((order) => order.stationId === stationId);
  }, [orders, user?.station?.id]);

  const periodStart = useMemo(() => getPeriodStart(period), [period]);
  const reportOrders = useMemo(() => {
    return stationOrders.filter((order) => new Date(order.createdAt) >= periodStart);
  }, [stationOrders, periodStart]);

  const paidOrders = reportOrders.filter((order) => order.paymentStatus === 'paid');
  const totalOrderValue = reportOrders.filter((order) => !['cancelled', 'failed', 'refunded'].includes(order.status)).reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const outstandingCash = reportOrders.reduce((sum, order) => sum + getCODOutstanding(order), 0);
  const completedOrders = reportOrders.filter((order) => ['delivered', 'completed'].includes(order.status));
  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const averageOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0;

  const statusSummary = reportOrders.reduce<Record<string, number>>((summary, order) => {
    summary[order.status] = (summary[order.status] || 0) + 1;
    return summary;
  }, {});

  const getDriverName = (order: Order) => {
    return order.driver?.name || order.deliveries?.[0]?.driverName || 'Not assigned';
  };

  const openCleanup = async () => {
    if (!user?.station?.id) return;
    setCleanupBusy(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/agent/station/data-cleanup-preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCleanupCounts(response.data?.data?.counts || {});
      setCleanupPhrase('');
      setCleanupOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not preview station cleanup.');
    } finally {
      setCleanupBusy(false);
    }
  };

  const confirmCleanup = async () => {
    if (!user?.station?.name || cleanupPhrase !== `CLEAR ${user.station.name}`) return;
    setCleanupBusy(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/agent/station/clear-data`, {
        confirmStationName: user.station.name,
        confirmation: cleanupPhrase,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setOrders([]);
      setHistoricalProductMismatches(0);
      setCleanupOpen(false);
      setCleanupMessage(response.data?.message || 'Station test data cleared.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not clear station data.');
    } finally {
      setCleanupBusy(false);
    }
  };

  const handleDownload = () => {
    const stationName = user?.station?.name || 'Station';
    const generatedAt = new Date().toLocaleString();
    const completedStatuses = ['delivered', 'completed'];
    const totalQuantity = reportOrders.reduce((sum, order) => sum + getTotalQuantity(order), 0);
    const completedQuantity = completedOrders.reduce((sum, order) => sum + getTotalQuantity(order), 0);

    // Section 1: one header row followed immediately by its values.
    const summaryHeaders = [
      'Report', 'Station', 'Period', 'Generated At',
      'Total Orders Received', 'Completed Orders', 'Completion Rate (%)',
      'Total Order Value (UGX)', 'Paid Orders', 'Paid Revenue (UGX)',
      'COD Outstanding (UGX)', 'Average Paid Order (UGX)',
      'Total Product Quantity Ordered', 'Product Quantity Delivered',
    ];
    const summaryValues = [
      `${periodOptions.find((option) => option.value === period)?.label} Agent Station Report`,
      stationName,
      formatPeriodLabel(period, periodStart),
      generatedAt,
      reportOrders.length,
      completedOrders.length,
      reportOrders.length ? Number(((completedOrders.length / reportOrders.length) * 100).toFixed(1)) : 0,
      Math.round(totalOrderValue),
      paidOrders.length,
      Math.round(totalRevenue),
      Math.round(outstandingCash),
      Math.round(averageOrderValue),
      totalQuantity,
      completedQuantity,
    ];

    // Section 2: one row per order, with the products and quantities visible.
    const orderHeaders = [
      'Order ID', 'Order Date', 'Station', 'Order Status', 'Customer',
      'Driver', 'Ordered Products and Quantities', 'Total Quantity',
      'Order Value (UGX)', 'Payment Method', 'Payment Status',
      'Amount Paid (UGX)', 'COD Outstanding (UGX)', 'Delivery Address',
      'Delivery City', 'Delivered At',
    ];
    const orderRows = reportOrders.map((order) => {
      const products = (order.items || []).map((item) => {
        const product = item.product;
        const variant = [product?.type, product?.size, product?.weight ? `${product.weight} kg` : null]
          .filter(Boolean).join(' / ');
        return `${product?.name || 'Product'}${variant ? ` (${variant})` : ''} x ${Number(item.quantity || 0)}`;
      }).join('; ');
      const isPaid = order.paymentStatus === 'paid';
      const deliveredAt = order.deliveries?.[0]?.deliveredAt;
      return [
        order.id,
        new Date(order.createdAt).toLocaleString(),
        order.station?.name || stationName,
        order.status,
        order.user?.name || 'N/A',
        getDriverName(order),
        products || 'Item details unavailable',
        getTotalQuantity(order),
        Math.round(Number(order.totalAmount || 0)),
        order.paymentMethod || 'cash',
        order.paymentStatus || 'pending',
        isPaid ? Math.round(Number(order.totalAmount || 0)) : 0,
        Math.round(getCODOutstanding(order)),
        order.deliveryAddress || '',
        order.deliveryCity || '',
        deliveredAt ? new Date(deliveredAt).toLocaleString() : '',
      ];
    });

    // Section 3: aggregate the cylinder/product quantities across this station.
    const productTotals = new Map<string, {
      name: string; type: string; size: string; weight: string;
      orders: Set<string>; quantityOrdered: number; quantityDelivered: number; value: number;
    }>();
    reportOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const product = item.product;
        const name = product?.name || 'Product';
        const type = product?.type || '';
        const size = product?.size || '';
        const weight = product?.weight == null ? '' : String(product.weight);
        const key = [item.productId || '', name, type, size, weight].join('|');
        const current = productTotals.get(key) || {
          name, type, size, weight, orders: new Set<string>(),
          quantityOrdered: 0, quantityDelivered: 0, value: 0,
        };
        current.orders.add(order.id);
        current.quantityOrdered += Number(item.quantity || 0);
        if (completedStatuses.includes(order.status)) current.quantityDelivered += Number(item.quantity || 0);
        current.value += Number(item.subtotal || 0);
        productTotals.set(key, current);
      });
    });
    const productHeaders = [
      'Product', 'Type', 'Size', 'Weight (kg)', 'Number of Orders',
      'Total Quantity Ordered', 'Quantity in Completed Orders', 'Product Order Value (UGX)',
    ];
    const productRows = Array.from(productTotals.values()).map((item) => [
      item.name, item.type, item.size, item.weight, item.orders.size,
      item.quantityOrdered, item.quantityDelivered, Math.round(item.value),
    ]);

    const rows: Array<Array<string | number>> = [
      summaryHeaders,
      summaryValues,
      [],
      ['ORDER DETAILS'],
      orderHeaders,
      ...(orderRows.length ? orderRows : [['No orders found for this period']]),
      [],
      ['PRODUCT SUMMARY'],
      productHeaders,
      ...(productRows.length ? productRows : [['No product orders found for this period']]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${stationName}-${period}-report.csv`.replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box>
          <Typography variant="h4" sx={{ color: "#FFF8EE", fontWeight: 800 }}>Station Reports</Typography>
          <Typography variant="body2" sx={{ color: "#D8E7DE" }}>
            Generate daily, weekly, monthly, and yearly reports for {user?.station?.name || 'your station'}.
          </Typography>
        </Box>
        <Button variant="outlined" color="error" onClick={() => void openCleanup()}
          disabled={!user?.station?.id || loading || cleanupBusy}>
          {cleanupBusy ? 'Loading…' : 'Clear station test data'}
        </Button>
        <Button variant="outlined" startIcon={<Download />} onClick={handleDownload} disabled={!user?.station?.id || loading}
          sx={{ color: "#FFF8EE", borderColor: "rgba(255,248,238,.75)", "&:hover": { borderColor: "#F36A21", background: "rgba(243,106,33,.14)" }, "&.Mui-disabled": { color: "rgba(255,248,238,.45)", borderColor: "rgba(255,248,238,.25)" } }}>
          Download Report
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {cleanupMessage && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCleanupMessage('')}>{cleanupMessage}</Alert>}
      <Dialog open={cleanupOpen} onClose={() => !cleanupBusy && setCleanupOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Clear {user?.station?.name || 'station'} test data?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This permanently deletes this station's orders, order items, delivery records, order notifications and station activity. It preserves the station, products/current stock, customers, staff, wallet balances and financial transaction ledger.
          </Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Orders: {cleanupCounts?.orders ?? '—'} · Items: {cleanupCounts?.orderItems ?? '—'} · Deliveries: {cleanupCounts?.deliveries ?? '—'} · Activities: {cleanupCounts?.stationActivities ?? '—'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Financial transactions are retained for accounting; links to deleted orders are cleared.
          </Typography>
          <TextField fullWidth label={`Type CLEAR ${user?.station?.name || 'station'} to confirm`}
            value={cleanupPhrase} onChange={(event) => setCleanupPhrase(event.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupOpen(false)} disabled={cleanupBusy}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void confirmCleanup()}
            disabled={cleanupBusy || cleanupPhrase !== `CLEAR ${user?.station?.name || ''}`}>
            {cleanupBusy ? 'Clearing…' : 'Permanently clear station data'}
          </Button>
        </DialogActions>
      </Dialog>
      {!user?.station?.id && (
        <Alert severity="error" sx={{ mb: 2 }}>
          This agent account does not have an assigned station. Contact an administrator; no report can be generated until a station is assigned.
        </Alert>
      )}
      {historicalProductMismatches > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {historicalProductMismatches} historical order(s) contain products whose current inventory station differs from the station recorded on the order. These orders remain included under this station's original order records. Review stock transfers before attempting any cancellation or inventory adjustment.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Assessment color="primary" />
              <Box>
                <Typography variant="h6">{user?.station?.name || 'Station Report'}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatPeriodLabel(period, periodStart)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {periodOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={period === option.value ? 'contained' : 'outlined'}
                  startIcon={option.icon}
                  onClick={() => setPeriod(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Orders</Typography>
                  <Typography variant="h5" fontWeight="bold">{reportOrders.length}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Completed Deliveries</Typography>
                  <Typography variant="h5" fontWeight="bold">{completedOrders.length}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Completed Delivery Value</Typography>
                  <Typography variant="h5" fontWeight="bold">UGX {reportOrders.filter((order) => ['delivered', 'completed'].includes(order.status)).reduce((sum, order) => sum + Number(order.totalAmount || 0), 0).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Paid Orders</Typography>
                  <Typography variant="h5" fontWeight="bold">{paidOrders.length}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Paid Revenue</Typography>
                  <Typography variant="h5" fontWeight="bold">UGX {totalRevenue.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">COD Outstanding</Typography>
                  <Typography variant="h5" fontWeight="bold">UGX {outstandingCash.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Average Paid Order</Typography>
                  <Typography variant="h5" fontWeight="bold">UGX {Math.round(averageOrderValue).toLocaleString()}</Typography>
                </Grid>
              </Grid>

            <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap' }}>
              {Object.entries(statusSummary).map(([status, count]) => (
                <Chip key={status} label={`${status.replace('_', ' ')}: ${count}`} color={statusColors[status] || 'default'} />
              ))}
              {reportOrders.length === 0 && (
                <Typography variant="body2" color="textSecondary">No orders in this period.</Typography>
              )}
            </Box>
          </Paper>

          <TableContainer component={Paper} sx={{ borderRadius: 2, width: "100%", overflowX: "auto", border: "1px solid", borderColor: "divider" }}>
            <Table size="small" sx={{ minWidth: 1250, "& th": { whiteSpace: "nowrap", fontWeight: 800, bgcolor: "action.hover", color: "text.primary" }, "& td": { verticalAlign: "top", color: "text.primary", borderColor: "divider" } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Ordered products &amp; quantities</TableCell>
                  <TableCell align="right">Total Qty</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment / Collection</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">COD outstanding</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>#{order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      {order.user?.name || 'N/A'}
                      <Typography variant="caption" color="textSecondary" display="block">{order.user?.phone}</Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 260, maxWidth: 360 }}>
                      {order.items?.length ? order.items.map((item, index) => (
                        <Box key={item.id || index} sx={{ mb: .6 }}>
                          <Typography variant="body2" fontWeight={700}>{item.product?.name || 'Product'} × {Number(item.quantity || 0)}</Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            {[item.product?.type, item.product?.size, item.product?.weight ? `${item.product.weight} kg` : null]
                              .filter(Boolean).join(' · ')}
                          </Typography>
                          {!!item.product?.description && (
                            <Typography variant="caption" color="textSecondary" display="block">{item.product.description}</Typography>
                          )}
                          <Typography variant="caption" color="textSecondary" display="block">
                            UGX {Number(item.price || 0).toLocaleString()} each · Line total UGX {Number(item.subtotal || 0).toLocaleString()}
                          </Typography>
                        </Box>
                      )) : <Typography variant="caption" color="textSecondary">Item details unavailable</Typography>}
                    </TableCell>
                    <TableCell align="right">{getTotalQuantity(order)}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={order.status.replace('_', ' ')} color={statusColors[order.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>Cash on Delivery</Typography>
                      <Typography variant="caption" color="textSecondary">{order.paymentStatus || 'pending'}</Typography>
                    </TableCell>
                    <TableCell>{getDriverName(order)}</TableCell>
                    <TableCell align="right">UGX {Number(order.totalAmount).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: getCODOutstanding(order) > 0 ? 'warning.main' : 'success.main' }}>
                      UGX {getCODOutstanding(order).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {reportOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">No report orders found for this period</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
