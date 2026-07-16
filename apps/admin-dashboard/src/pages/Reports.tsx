import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography
} from '@mui/material';
import { Assessment, CalendarMonth, Download, Event, Today, ViewWeek } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface Station {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  agents?: Array<{ id: string; name: string; isActive: boolean }>;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number | string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  stationId?: string;
  station?: { id?: string; name: string };
  user?: { name: string; phone: string };
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

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError('');

    try {
      const [stationsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stations`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const loadedStations = stationsRes.data.data || [];
      setStations(loadedStations);
      setOrders(ordersRes.data.data || []);
      setSelectedStationId((current) => current || loadedStations[0]?.id || '');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const selectedStation = stations.find((station) => station.id === selectedStationId);
  const periodStart = useMemo(() => getPeriodStart(period), [period]);

  const stationOrders = useMemo(() => {
    if (!selectedStationId) return [];

    return orders.filter((order) => {
      const orderStationId = order.stationId || order.station?.id;
      return orderStationId === selectedStationId;
    });
  }, [orders, selectedStationId]);

  const reportOrders = useMemo(() => {
    return stationOrders.filter((order) => new Date(order.createdAt) >= periodStart);
  }, [stationOrders, periodStart]);

  const paidOrders = reportOrders.filter((order) => order.paymentStatus === 'paid');
  const completedOrders = reportOrders.filter((order) => ['delivered', 'completed'].includes(order.status));
  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const averageOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0;

  const statusSummary = reportOrders.reduce<Record<string, number>>((summary, order) => {
    summary[order.status] = (summary[order.status] || 0) + 1;
    return summary;
  }, {});

  const handleDownload = () => {
    if (!selectedStation) return;

    const rows = [
      ['Report', `${periodOptions.find((option) => option.value === period)?.label} Station Report`],
      ['Station', selectedStation.name],
      ['Period', formatPeriodLabel(period, periodStart)],
      ['Generated At', new Date().toLocaleString()],
      ['Orders', String(reportOrders.length)],
      ['Completed Orders', String(completedOrders.length)],
      ['Paid Revenue', String(totalRevenue)],
      ['Average Paid Order', String(Math.round(averageOrderValue))],
      [],
      ['Order ID', 'Customer', 'Date', 'Status', 'Payment', 'Amount'],
      ...(reportOrders.length > 0
        ? reportOrders.map((order) => [
            order.id,
            order.user?.name || 'N/A',
            new Date(order.createdAt).toLocaleString(),
            order.status,
            order.paymentStatus,
            String(order.totalAmount),
          ])
        : [['No orders found for this period', '', '', '', '', '']]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
          <Typography variant="h4">Station Reports</Typography>
          <Typography variant="body2" color="textSecondary">
            Select a station and generate daily, weekly, monthly, or yearly reports.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Download />} onClick={handleDownload} disabled={!selectedStation}>
          Download Report
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                  <Typography variant="caption" color="textSecondary">
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
                  <Typography variant="body2" color="textSecondary">Completed</Typography>
                  <Typography variant="h5" fontWeight="bold">{completedOrders.length}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Paid Revenue</Typography>
                  <Typography variant="h5" fontWeight="bold">UGX {totalRevenue.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Avg. Paid Order</Typography>
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

            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell align="right">Amount</TableCell>
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
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip label={order.status.replace('_', ' ')} color={statusColors[order.status] || 'default'} size="small" />
                      </TableCell>
                      <TableCell>{order.paymentStatus}</TableCell>
                      <TableCell align="right">UGX {Number(order.totalAmount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {reportOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
