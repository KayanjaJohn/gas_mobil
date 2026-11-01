import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, TextField, Typography } from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email: email.trim() });
      setMessage(response.data?.message || "If the account exists, reset instructions will be sent.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Password recovery is temporarily unavailable. Please contact your administrator.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="main" sx={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: { xs: "center", md: "flex-start" }, px: { xs: 2, sm: 4, md: "7vw" }, py: 4,
      boxSizing: "border-box",
      backgroundImage: "linear-gradient(90deg, rgba(2,18,13,.93), rgba(2,18,13,.72) 52%, rgba(2,18,13,.2)), url('/agent/gasmobil-login-bg.jpg')",
      backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#061D16",
    }}>
      <Box sx={{
        width: "100%", maxWidth: 460, p: { xs: 3, sm: 4 }, boxSizing: "border-box",
        borderRadius: 4, color: "#FFF8EE", background: "rgba(4,25,19,.84)",
        border: "1px solid rgba(255,248,238,.23)", backdropFilter: "blur(18px)",
        boxShadow: "0 24px 80px rgba(0,0,0,.42)",
      }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <Box component="img" src="/agent/gasmobil-icon.png" alt="GasMobil Uganda" sx={{ width: 76, height: 76 }} />
        </Box>
        <Typography variant="h4" align="center" sx={{ color: "#FFF8EE", fontWeight: 800 }}>
          Reset your <Box component="span" sx={{ color: "#F36A21" }}>password</Box>
        </Typography>
        <Typography align="center" sx={{ color: "#D0DED6", mt: 1, mb: 3 }}>
          Station Agent account recovery
        </Typography>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={submit}>
          <TextField
            fullWidth label="Account email" type="email" value={email}
            onChange={(event) => setEmail(event.target.value)}
            required autoComplete="email"
            sx={{
              "& .MuiOutlinedInput-root": { color: "#FFF8EE", bgcolor: "rgba(4,24,18,.72)", borderRadius: 2,
                "& fieldset": { borderColor: "rgba(255,248,238,.34)" },
                "&:hover fieldset": { borderColor: "#F36A21" }, "&.Mui-focused fieldset": { borderColor: "#F36A21" } },
              "& .MuiInputLabel-root": { color: "#D2DED7" },
            }}
          />
          <Button type="submit" fullWidth variant="contained" disabled={loading}
            sx={{ mt: 2, py: 1.5, borderRadius: 2, fontWeight: 800, textTransform: "none", bgcolor: "#F36A21", "&:hover": { bgcolor: "#DB5917" } }}>
            {loading ? <CircularProgress size={22} color="inherit" /> : "Send reset link"}
          </Button>
        </Box>
        <Button fullWidth onClick={() => navigate("/login")} sx={{ mt: 2, color: "#FFC08F", textTransform: "none" }}>
          Back to sign in
        </Button>
      </Box>
    </Box>
  );
}
