import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox,
  Typography
} from '@mui/material';
import { Assessment, CalendarMonth, Download, Event, Today, ViewWeek } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface Station {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  agents?: Array<{ id: string; name: string; isActive: boolean }>;
}

interface ReportOrderItem {
  id?: string;
  productId?: string;
  quantity: number;
  price: number | string;
  subtotal: number | string;
  product?: {
    name?: string;
    type?: string;
    size?: string | null;
    weight?: number | string | null;
    description?: string | null;
    imageUrl?: string | null;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number | string;
  paymentStatus: string;
  paymentMethod: string;
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
  station?: { id?: string; name: string };
  user?: { id?: string; name: string; phone: string; email?: string; address?: string; city?: string };
  items?: ReportOrderItem[];
  deliveries?: Array<{
    driverName?: string; driverPhone?: string; vehicleNumber?: string; status?: string;
    pickedUpAt?: string | null; startedAt?: string | null; deliveredAt?: string | null; notes?: string | null;
  }>;
}

const periodOptions: Array<{ value: ReportPeriod; label: string; icon: JSX.Element }> = [
  { value: 'daily', label: 'Daily', icon: <Today /> },
  { value: 'weekly', label: 'Weekly', icon: <ViewWeek /> },
  { value: 'monthly', label: 'Monthly', icon: <CalendarMonth /> },
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

  if (period === 'monthly') {
    date.setDate(1);
  }

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
  return !excluded && isCash && order.paymentStatus === 'pending'
    ? Number(order.totalAmount || 0)
    : 0;
};

const getProductDetails = (order: Order) => {
  if (!order.items?.length) return 'Item details unavailable';
  return order.items.map((item) => {
    const product = item.product;
    const attributes = [product?.type, product?.size, product?.weight ? `${product.weight} kg` : null]
      .filter(Boolean).join(' / ');
    return [
      product?.name || 'Product',
      attributes ? `[${attributes}]` : '',
      `Qty ${Number(item.quantity || 0)}`,
      `Unit UGX ${Number(item.price || 0).toLocaleString()}`,
      `Line UGX ${Number(item.subtotal || 0).toLocaleString()}`,
      product?.description || '',
      item.productId ? `Product ID ${item.productId}` : '',
    ].filter(Boolean).join(' · ');
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
  if (period === 'monthly') {
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(start);
  }

  return String(start.getFullYear());
};

export default function Reports() {
  const { token } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [excludedIntegrityOrders, setExcludedIntegrityOrders] = useState(0);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError('');

    try {
      const stationsRes = await axios.get(`${API_URL}/admin/stations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const loadedStations = stationsRes.data.data || [];
      setStations(loadedStations);
      setSelectedStationId((current) => current || loadedStations[0]?.id || '');
    } catch (err: any) {
      setError(err.response?.data?.error || 'We could not load the station list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedStationId || !token) {
      setOrders([]);
      setExcludedIntegrityOrders(0);
      return;
    }

    let active = true;
    setOrders([]);
    setLoading(true);
    setError('');

    axios.get(`${API_URL}/admin/stations/${encodeURIComponent(selectedStationId)}/report-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((response) => {
      if (!active) return;
      setOrders(Array.isArray(response.data?.data) ? response.data.data : []);
      setSelectedOrderIds([]);
      setExcludedIntegrityOrders(Number(response.data?.meta?.excludedIntegrityOrders || 0));
    }).catch((err: any) => {
      if (active) {
        setOrders([]);
        setError(err.response?.data?.error || 'We could not load this station report. Please try again.');
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [selectedStationId, token]);

  const selectedStation = stations.find((station) => station.id === selectedStationId);
  const periodStart = useMemo(() => getPeriodStart(period), [period]);

  const stationOrders = useMemo(() => {
    if (!selectedStationId) return [];

    return orders.filter((order) => {
      // The API has already queried by this station ID. Keep this second
      // strict check so an incomplete legacy record is never attributed to it.
      return order.stationId === selectedStationId;
    });
  }, [orders, selectedStationId]);

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

  const archiveSelectedOrders = async () => {
    if (!selectedStationId || selectedOrderIds.length === 0) return;
    const selected = reportOrders.filter(order => selectedOrderIds.includes(order.id));
    const selectedIds = selected.map(order => order.id);
    if (!selectedIds.length) { setSelectedOrderIds([]); return; }
    const blocked = selected.filter(order => ["pending", "confirmed", "driver_assigned", "picked_up", "in_transit", "nearby"].includes(order.status));
    if (blocked.length) {
      setError("Active orders cannot be archived. Complete or cancel selected orders first.");
      return;
    }
    if (!window.confirm(`Archive ${selectedIds.length} selected order(s) from ${selectedStation?.name}? The records remain available in the database for audit and financial history.`)) return;
    setArchiving(true);
    setError("");
    try {
      const response = await axios.post(
        `${API_URL}/admin/stations/${encodeURIComponent(selectedStationId)}/orders/archive`,
        { orderIds: selectedIds, reason: "Archived by administrator from station reports" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedOrderIds([]);
      const refresh = await axios.get(`${API_URL}/admin/stations/${encodeURIComponent(selectedStationId)}/report-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(Array.isArray(refresh.data?.data) ? refresh.data.data : []);
      setError("");
      window.alert(response.data?.message || "Selected orders archived.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not archive selected orders.");
    } finally {
      setArchiving(false);
    }
  };

  const selectableReportOrders = reportOrders.filter(order =>
    !["pending", "confirmed", "driver_assigned", "picked_up", "in_transit", "nearby"].includes(order.status)
  );

  const handleDownload = () => {
    if (!selectedStation) return;

    // Keep every value directly below its header when opened in Excel.
    // The previous vertical key/value layout made the report difficult to scan.
    const summaryHeaders = [
      'Report', 'Station', 'Period', 'Generated At', 'Orders', 'Completed Orders',
      'Total Order Value', 'Paid Orders', 'Paid Revenue', 'COD Outstanding', 'Average Paid Order',
    ];
    const summaryValues = [
      `${periodOptions.find((option) => option.value === period)?.label} Station Report`,
      selectedStation.name,
      formatPeriodLabel(period, periodStart),
      new Date().toLocaleString(),
      String(reportOrders.length),
      String(completedOrders.length),
      String(totalOrderValue),
      String(paidOrders.length),
      String(totalRevenue),
      String(outstandingCash),
      String(Math.round(averageOrderValue)),
    ];
    const orderHeaders = [
      'Order ID', 'Order Date', 'Last Updated', 'Order Status',
      'Customer ID', 'Customer Name', 'Customer Phone', 'Customer Email', 'Customer Profile Address', 'Customer Profile City',
      'Delivery Address', 'Delivery City', 'Delivery Latitude', 'Delivery Longitude', 'GPS Accuracy (m)',
      'Station ID', 'Station Name', 'Driver Name', 'Driver Phone', 'Driver Vehicle', 'Delivery Status',
      'Picked Up At', 'Delivery Started At', 'Delivered At', 'Delivery Notes',
      'Payment Method', 'Payment Status',
      'Product IDs and Details (name, description, type, size, weight, quantity, unit price, line total)',
      'Total Quantity', 'Order Total (UGX)', 'COD Outstanding (UGX)',
      'Order Notes', 'Cancellation Reason',
    ];
    const rows = [
      summaryHeaders,
      summaryValues,
      [],
      orderHeaders,
      ...(reportOrders.length > 0
        ? reportOrders.map((order) => [
            order.id,
            new Date(order.createdAt).toLocaleString(),
            order.updatedAt ? new Date(order.updatedAt).toLocaleString() : '',
            order.status,
            order.userId || order.user?.id || '',
            order.user?.name || 'N/A',
            order.user?.phone || '',
            order.user?.email || '',
            order.user?.address || '',
            order.user?.city || '',
            order.deliveryAddress || '',
            order.deliveryCity || '',
            order.deliveryLatitude ?? '',
            order.deliveryLongitude ?? '',
            order.locationAccuracy ?? '',
            order.stationId,
            order.station?.name || selectedStation.name,
            order.deliveries?.[0]?.driverName || 'Not assigned',
            order.deliveries?.[0]?.driverPhone || '',
            order.deliveries?.[0]?.vehicleNumber || '',
            order.deliveries?.[0]?.status || '',
            order.deliveries?.[0]?.pickedUpAt ? new Date(order.deliveries[0].pickedUpAt).toLocaleString() : '',
            order.deliveries?.[0]?.startedAt ? new Date(order.deliveries[0].startedAt).toLocaleString() : '',
            order.deliveries?.[0]?.deliveredAt ? new Date(order.deliveries[0].deliveredAt).toLocaleString() : '',
            order.deliveries?.[0]?.notes || '',
            order.paymentMethod || 'cash',
            order.paymentStatus || 'pending',
            getProductDetails(order),
            String(getTotalQuantity(order)),
            String(Number(order.totalAmount || 0)),
            String(getCODOutstanding(order)),
            order.notes || '',
            order.cancellationReason || '',
          ])
        : [['No orders found for this period', ...Array(orderHeaders.length - 1).fill('')]]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    // UTF-8 BOM ensures Excel opens names and report text correctly.
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${selectedStation.name}-${period}-report.csv`.replace(/\s+/g, '-').toLowerCase();
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box>
          <Typography variant="h4" sx={{ color: "#FFF8EE", fontWeight: 800 }}>Station Reports</Typography>
          <Typography variant="body2" sx={{ color: "#D8E7DE" }}>
            Select a station and generate daily, weekly, monthly, or yearly reports.
          </Typography>
        </Box>
        <Button variant="outlined" color="warning" onClick={archiveSelectedOrders} disabled={!selectedOrderIds.length || archiving || loading}> {archiving ? "Archiving…" : `Archive selected (${selectedOrderIds.length})`} </Button>
        <Button variant="outlined" startIcon={<Download />} onClick={handleDownload} disabled={!selectedStation || loading}
          sx={{ color: "#FFF8EE", borderColor: "rgba(255,248,238,.75)", "&:hover": { borderColor: "#F36A21", background: "rgba(243,106,33,.14)" }, "&.Mui-disabled": { color: "rgba(255,248,238,.45)", borderColor: "rgba(255,248,238,.25)" } }}>
          Download Report
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {excludedIntegrityOrders > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {excludedIntegrityOrders} order(s) were excluded because at least one product is assigned to a different station. These legacy records need an administrator review before they can appear in this report.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6">Stations</Typography>
                <Typography variant="caption" color="textSecondary">Click a station to prepare its report.</Typography>
              </Box>
              <Divider />
              {stations.map((station) => (
                <Box
                  key={station.id}
                  onClick={() => setSelectedStationId(station.id)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderLeft: '4px solid',
                    borderLeftColor: selectedStationId === station.id ? 'primary.main' : 'transparent',
                    bgcolor: selectedStationId === station.id ? 'primary.light' : 'background.paper',
                    color: selectedStationId === station.id ? 'primary.contrastText' : 'text.primary',
                    '&:hover': { bgcolor: selectedStationId === station.id ? 'primary.light' : 'grey.50' },
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">{station.name}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>{station.address}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip label={station.isActive ? 'Active' : 'Inactive'} size="small" color={station.isActive ? 'success' : 'default'} />
                    <Chip label={`${station.agents?.length || 0} agents`} size="small" />
                  </Box>
                </Box>
              ))}
              {stations.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="textSecondary">No stations found</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Assessment color="primary" />
                <Box>
                  <Typography variant="h6">{selectedStation?.name || 'Choose a station'}</Typography>
                  <Typography variant="caption" sx={{ color: "#68786F" }}>
                    {selectedStation ? formatPeriodLabel(period, periodStart) : 'Reports appear after selecting a station.'}
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
                    disabled={!selectedStation}
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
                {reportOrders.length === 0 && selectedStation && (
                  <Typography variant="body2" color="textSecondary">No orders in this period.</Typography>
                )}
              </Box>
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: 2, width: "100%", overflowX: "auto", border: "1px solid", borderColor: "divider" }}>
              <Table size="small" sx={{ minWidth: 1250, "& th": { whiteSpace: "nowrap", fontWeight: 800, bgcolor: "action.hover", color: "text.primary" }, "& td": { verticalAlign: "top", color: "text.primary", borderColor: "divider" } }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={selectableReportOrders.length > 0 && selectableReportOrders.every(order => selectedOrderIds.includes(order.id))} indeterminate={selectableReportOrders.some(order => selectedOrderIds.includes(order.id)) && !selectableReportOrders.every(order => selectedOrderIds.includes(order.id))} onChange={(event) => setSelectedOrderIds(event.target.checked ? selectableReportOrders.map(order => order.id) : [])} /></TableCell>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Ordered products &amp; quantities</TableCell>
                    <TableCell align="right">Total Qty</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">COD outstanding</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell padding="checkbox"><Checkbox size="small" disabled={["pending", "confirmed", "driver_assigned", "picked_up", "in_transit", "nearby"].includes(order.status)} checked={selectedOrderIds.includes(order.id)} onChange={(event) => setSelectedOrderIds(current => event.target.checked ? [...current, order.id] : current.filter(id => id !== order.id))} /></TableCell>
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
                      <TableCell>{order.paymentStatus}</TableCell>
                      <TableCell align="right">UGX {Number(order.totalAmount).toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: getCODOutstanding(order) > 0 ? 'warning.main' : 'success.main' }}>
                        UGX {getCODOutstanding(order).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {reportOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          {selectedStation ? 'No report orders found for this period' : 'Select a station to generate a report'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
