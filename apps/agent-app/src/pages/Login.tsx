import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, TextField, Button, Typography, Paper, Alert, CircularProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!emailOrPhone.trim() || !password.trim()) {
      setError("Please enter both email/phone and password");
      return;
    }
    setLoading(true);
    const result = await login(emailOrPhone.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#0B1120" }}>
      <Paper elevation={6} sx={{ p: 4, width: "100%", maxWidth: 420, bgcolor: "#151e2e", color: "#fff" }}>
        <Typography variant="h4" align="center" fontWeight={700} sx={{ mb: 1 }}>
          GasMobil Agent
        </Typography>
        <Typography variant="body2" align="center" color="#94A3B8" sx={{ mb: 3 }}>
          Sign in to your agent account
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, bgcolor: "#fef2f2", color: "#991b1b" }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email or Phone"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            margin="normal"
            required
            sx={{
              "& .MuiOutlinedInput-root": { bgcolor: "#0F172A", color: "#fff", borderRadius: 2 },
              "& .MuiInputLabel-root": { color: "#94A3B8" },
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            sx={{
              "& .MuiOutlinedInput-root": { bgcolor: "#0F172A", color: "#fff", borderRadius: 2 },
              "& .MuiInputLabel-root": { color: "#94A3B8" },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 2, py: 1.5, borderRadius: 2, fontWeight: 600 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}