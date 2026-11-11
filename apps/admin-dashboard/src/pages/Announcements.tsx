import { useState } from "react";
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, Paper, Stack, TextField, Typography } from "@mui/material";
import Campaign from "@mui/icons-material/Campaign";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export default function Announcements() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendPush, setSendPush] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const submit = async () => {
    setError(""); setResult(null);
    if (title.trim().length < 4 || message.trim().length < 10) {
      setError("Enter a title (at least 4 characters) and a message (at least 10 characters).");
      return;
    }
    if (!sendPush && !sendEmail) { setError("Select at least one delivery channel."); return; }
    if (!window.confirm("Send this announcement to all active GasMobil customers, drivers, agents and administrators? This action cannot be recalled.")) return;
    setBusy(true);
    try {
      const response = await axios.post(`${API_URL}/admin/announcements`, {
        title: title.trim(), message: message.trim(), sendPush, sendEmail,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(response.data?.data || {});
      setTitle(""); setMessage("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not send the announcement.");
    } finally { setBusy(false); }
  };

  return <Box sx={{maxWidth:980,mx:"auto"}}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{mb:1}}>
      <Campaign color="success" sx={{fontSize:34}}/>
      <Box><Typography variant="h4" fontWeight={800}>Global Announcements</Typography>
        <Typography color="text.secondary">Send official GasMobil updates to all active users.</Typography></Box>
    </Stack>
    <Alert severity="info" sx={{my:2}}>Emails are sent as GasMobil from info@gas-mobil.com. Recipients are blind-copied so users cannot see one another's email addresses.</Alert>
    {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
    {result && <Alert severity="success" sx={{mb:2}}>
      Announcement processed for {result.recipientCount} active users. In-app notifications: {result.inAppNotifications}.
      {result.push && ` Push accepted: ${result.push.accepted}; missing device tokens: ${result.push.skippedNoToken}; push errors: ${result.push.failed}.`}
      {result.email && ` Email sent: ${result.email.sent}; skipped: ${result.email.skipped}; failed: ${result.email.failed}.`}
    </Alert>}
    <Paper sx={{p:{xs:2,md:3},borderRadius:3}}>
      <Stack spacing={2}>
        <TextField label="Announcement title" value={title} onChange={e=>setTitle(e.target.value)} inputProps={{maxLength:160}} required fullWidth/>
        <TextField label="Message" value={message} onChange={e=>setMessage(e.target.value)} multiline minRows={7} inputProps={{maxLength:10000}} required fullWidth placeholder="Write the official update for GasMobil users..."/>
        <Box>
          <Typography fontWeight={700} sx={{mb:0.5}}>Delivery channels</Typography>
          <FormControlLabel control={<Checkbox checked={sendPush} onChange={e=>setSendPush(e.target.checked)}/>} label="In-app notification and mobile push notification"/>
          <FormControlLabel control={<Checkbox checked={sendEmail} onChange={e=>setSendEmail(e.target.checked)}/>} label="Email from info@gas-mobil.com"/>
        </Box>
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" color="success" size="large" disabled={busy} onClick={()=>void submit()} startIcon={busy?<CircularProgress size={18} color="inherit"/>:<Campaign/>}>
            {busy ? "Sending announcement..." : "Send to all GasMobil users"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  </Box>;
}
