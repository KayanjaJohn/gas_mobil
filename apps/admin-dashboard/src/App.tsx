import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Drivers from "./pages/Drivers";
import Customers from "./pages/Customers";
import Stations from "./pages/Stations";
import StationHistory from "./pages/StationHistory";
import Reports from "./pages/Reports";
import NotificationPage from "./pages/NotificationPage";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/products" element={<Products />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/station-history" element={<StationHistory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<NotificationPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;