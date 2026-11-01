import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, CircularProgress, IconButton, InputAdornment,
  TextField, Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!emailOrPhone.trim() || !password) {
      setError("Please enter both email/phone and password");
      return;
    }
    setLoading(true);
    const result = await login(emailOrPhone.trim(), password);
    setLoading(false);
    if (result.success) navigate("/dashboard", { replace: true });
    else setError(result.error || "Login failed");
  };

  const fieldSx = {
    mt: 2,
    "& .MuiOutlinedInput-root": {
      color: "#FFF8EE", backgroundColor: "rgba(4, 24, 18, .72)", borderRadius: 2,
      "& fieldset": { borderColor: "rgba(255,248,238,.34)" },
      "&:hover fieldset": { borderColor: "#F36A21" },
      "&.Mui-focused fieldset": { borderColor: "#F36A21" },
    },
    "& .MuiInputLabel-root": { color: "#D2DED7" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#FF9A5E" },
  };

  return (
    <Box component="main" sx={{
      minHeight: "100vh", width: "100%", display: "flex", alignItems: "center",
      justifyContent: "center", px: { xs: 2, sm: 3, md: 4 },
      py: 4, boxSizing: "border-box",
      backgroundImage: "linear-gradient(90deg, rgba(2,18,13,.93) 0%, rgba(2,18,13,.76) 48%, rgba(2,18,13,.18) 100%), url('/agent/gasmobil-login-bg.jpg')",
      backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#061D16",
    }}>
      <Box sx={{
        width: "100%", maxWidth: 460, boxSizing: "border-box", p: { xs: 3, sm: 4 },
        borderRadius: 4, color: "#FFF8EE", background: "rgba(4, 25, 19, .68)",
        border: "1px solid rgba(255,248,238,.23)", backdropFilter: "blur(24px)",
        boxShadow: "0 24px 80px rgba(0,0,0,.42)",
      }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <Box component="img" src="/agent/gasmobil-icon.png" alt="GasMobil Uganda" sx={{ width: 76, height: 76, objectFit: "contain" }} />
        </Box>
        <Typography variant="h4" align="center" sx={{ color: "#FFF8EE", fontWeight: 800, letterSpacing: "-.5px" }}>
          GasMobil <Box component="span" sx={{ color: "#F36A21" }}>Agent</Box>
        </Typography>
        <Typography align="center" sx={{ color: "#D0DED6", mt: .7, mb: 3 }}>
          Station Operations Portal
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Email or Phone" value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)} autoComplete="username"
            required sx={fieldSx}
          />
          <TextField
            fullWidth label="Password" type={showPassword ? "text" : "password"}
            value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password" required sx={fieldSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)} edge="end" sx={{ color: "#FFF8EE" }}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button onClick={() => navigate("/forgot-password")} sx={{ color: "#FFC08F", textTransform: "none", fontWeight: 700 }}>
              Forgot password?
            </Button>
          </Box>
          <Button
            type="submit" fullWidth variant="contained" size="large"
            disabled={loading} sx={{
              mt: 2, py: 1.55, borderRadius: 2, fontWeight: 800, textTransform: "none",
              color: "#fff", background: "linear-gradient(90deg,#138A43,#20B85A)",
              "&:hover": { background: "linear-gradient(90deg,#0F7338,#159749)" },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
          </Button>
        </Box>
        <Typography align="center" sx={{ mt: 3, fontSize: 12, color: "#C7D4CD" }}>
          Sign in using the credentials issued by your GasMobil administrator
        </Typography>
      </Box>
    </Box>
  );
}
