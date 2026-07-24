import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Paper, Alert, CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!emailOrPhone.trim() || !password.trim()) {
      setError('Please enter both email/phone and password');
      return;
    }

    setLoading(true);
    const result = await login(emailOrPhone.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: '#0B1120', p: 3,
    }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400, bgcolor: '#1E293B', border: '1px solid #334155' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#F59E0B', mb: 1, textAlign: 'center' }}>
          GasMobil Agent
        </Typography>
        <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3, textAlign: 'center' }}>
          Sign in to your agent account
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email or Phone"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            fullWidth
            required
            sx={{
              '& .MuiOutlinedInput-root': { bgcolor: '#0F172A', color: '#fff', borderRadius: 2 },
              '& .MuiInputLabel-root': { color: '#94A3B8' },
            }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            sx={{
              '& .MuiOutlinedInput-root': { bgcolor: '#0F172A', color: '#fff', borderRadius: 2 },
              '& .MuiInputLabel-root': { color: '#94A3B8' },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 1, bgcolor: '#F59E0B', color: '#fff', fontWeight: 700, borderRadius: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
