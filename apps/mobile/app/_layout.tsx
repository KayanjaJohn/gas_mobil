import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";

// DEBUG: Check if imports are defined
console.log("Stack:", typeof Stack);
console.log("AuthProvider:", typeof AuthProvider);
console.log("CartProvider:", typeof CartProvider);

export default function Layout() {
  if (!Stack || !AuthProvider || !CartProvider) {
    throw new Error(`Missing import: Stack=${!!Stack}, AuthProvider=${!!AuthProvider}, CartProvider=${!!CartProvider}`);
  }
  
  return (
    <AuthProvider>
      <CartProvider>
        <Stack />
      </CartProvider>
    </AuthProvider>
  );
}