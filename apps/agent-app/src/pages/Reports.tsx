import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography
} from '@mui/material';
import { Assessment, Download, Event, Today, ViewWeek } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type ReportPeriod = 'daily' | 'weekly' | 'yearly';

interface Order {
  id: string;
  status: string;
  totalAmount: number | string;
  paymentStatus?: string;
  createdAt: string;
  user?: { name: string; phone?: string };
  driver?: { name: string };
  deliveries?: Array<{ driverName?: string }>;
}

const periodOptions: Array<{ value: ReportPeriod; label: string; icon: JSX.Element }> = [
  { value: 'daily', label: 'Daily', icon: <Today /> },
  { value: 'weekly', label: 'Weekly', icon: <ViewWeek /> },
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

  return String(start.getFullYear());
};

export default function Reports() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${API_URL}/agent/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const periodStart = useMemo(() => getPeriodStart(period), [period]);
  const reportOrders = useMemo(() => {
    return orders.filter((order) => new Date(order.createdAt) >= periodStart);
  }, [orders, periodStart]);

  const paidOrders = reportOrders.filter((order) => order.paymentStatus === 'paid');
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

  const handleDownload = () => {
    const stationName = user?.station?.name || 'Station';
    const rows = [
      ['Report', `${periodOptions.find((option) => option.value === period)?.label} Agent Station Report`],
      ['Station', stationName],
      ['Period', formatPeriodLabel(period, periodStart)],
      ['Generated At', new Date().toLocaleString()],
      ['Orders', String(reportOrders.length)],
      ['Completed Orders', String(completedOrders.length)],
      ['Paid Revenue', String(totalRevenue)],
      ['Average Paid Order', String(Math.round(averageOrderValue))],
      [],
      ['Order ID', 'Customer', 'Phone', 'Date', 'Status', 'Payment', 'Driver', 'Amount'],
      ...(reportOrders.length > 0
        ? reportOrders.map((order) => [
            order.id,
            order.user?.name || 'N/A',
            order.user?.phone || '',
            new Date(order.createdAt).toLocaleString(),
            order.status,
            order.paymentStatus || 'N/A',
            getDriverName(order),
            String(order.totalAmount),
          ])
        : [['No orders found for this period', '', '', '', '', '', '', '']]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${stationName}-${period}-report.csv`.replace(/\s+/g, '-').toLowerCase();
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box>
          <Typography variant="h4">Station Reports</Typography>
          <Typography variant="body2" color="textSecondary">
            Generate daily, weekly, and yearly reports for {user?.station?.name || 'your station'}.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Download />} onClick={handleDownload}>
          Download Report
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
              {reportOrders.length === 0 && (
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
                  <TableCell>Driver</TableCell>
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
                    <TableCell>{order.paymentStatus || 'N/A'}</TableCell>
                    <TableCell>{getDriverName(order)}</TableCell>
                    <TableCell align="right">UGX {Number(order.totalAmount).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {reportOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
