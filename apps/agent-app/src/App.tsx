import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Catalog from "./pages/Catalog";
import Drivers from "./pages/Drivers";
import Customers from "./pages/Customers";
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
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reports" element={<Reports />} />
          <Route
            path="/notifications"
            element={
              <NotificationPage
                token={localStorage.getItem('agent_token') || ''}
                userRole="agent"
              />
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;