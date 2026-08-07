import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../services/api";
import { useSocket } from "./useSocket";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  weight: number | null;
  size: string | null;
  type: "cylinder" | "accessory";
  isAvailable: boolean;
  imageUrl: string | null;
  stationId: string;
  createdAt: string;
  updatedAt: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ success: boolean; data?: Product[] }>(
        "get", "/products"
      );
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useSocket((data) => {
    if (
      data?.type === "product_updated" ||
      data?.type === "product_created" ||
      data?.type === "product_deleted"
    ) {
      fetchProducts();
    }
  });

  const cylinders = products.filter(
    (p) => p.type === "cylinder" && p.isAvailable
  );
  const accessories = products.filter(
    (p) => p.type === "accessory" && p.isAvailable
  );

  return { products, cylinders, accessories, loading, error, refresh: fetchProducts };
}
