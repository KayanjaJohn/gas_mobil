import { Platform } from "react-native";
import Constants from "expo-constants";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/+$/, "");
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
        authToken = token;
}

const API_URLS = API_BASE_URL
        ? [API_BASE_URL.endsWith("/api") ? API_BASE_URL : API_BASE_URL + "/api"]
        : [];

if (API_URLS.length === 0) {
        console.warn("[API] EXPO_PUBLIC_API_URL is not configured.");
}

async function tryFetch(url: string, path: string, options: RequestInit, timeoutMs: number) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	const fullUrl = `${url}${path}`;

	try {
		const res = await fetch(fullUrl, {
			...options,
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
				...(options.headers || {}),
				...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
			},
		});

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			data = { raw: text };
		}

		if (!res.ok) {
			const errorMsg = data?.error || data?.message || `HTTP ${res.status}`;
			throw new Error(errorMsg);
		}

		return data;
	} finally {
		clearTimeout(timeoutId);
	}
}

async function request(path: string, options: RequestInit = {}) {
	let lastError: any;

	for (const baseUrl of API_URLS) {
		try {
			return await tryFetch(baseUrl, path, options, 30000);  // Increased timeout to 30s
		} catch (error: any) {
			lastError = error;
			const message = error?.message?.toString() || "";
			if (
				message.includes("AbortError") ||
				message.includes("timed out") ||
				message.includes("Failed to fetch") ||
				message.includes("Network request failed")
			) {
				continue;
			}
			throw error;
		}
	}

	throw new Error(
		lastError?.message || `Unable to connect to API. Tried: ${API_URLS.join(", ")}`,
	);
}

export async function createOrder(payload: any) {
	// Ensure items have productId (not just itemId)
	if (payload.items && Array.isArray(payload.items)) {
		payload.items = payload.items.map((item: any) => ({
			...item,
			productId: item.productId || item.itemId || item.id,
			quantity: item.quantity || 1,
		}));
	}

	return request("/orders", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function getDelivery(orderId: string) {
	return request(`/delivery/${orderId}`);
}

export async function registerUser(payload: any) {
	return request("/auth/register", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function loginUser(payload: any) {
	return request("/auth/login", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function verifyUser() {
	return request("/auth/verify");
}

// Product APIs
export async function getProducts() {
	return request("/products");
}

export async function getProductById(productId: string) {
	return request(`/products/${productId}`);
}