import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { loginUser, registerUser, setAuthToken } from "../utils/apiClient";

interface User {
	id: string;
	name: string;
	email: string;
	phone: string;
}

interface AuthContextValue {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	login: (credentials: { emailOrPhone: string; password: string }) => Promise<void>;
	register: (payload: {
		name: string;
		email: string;
		phone: string;
		password: string;
	}) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);

	const login = async ({
		emailOrPhone,
		password,
	}: {
		emailOrPhone: string;
		password: string;
	}) => {
		console.log("[AUTH] Login attempt:", emailOrPhone);

		try {
			const payload = { emailOrPhone, password };
			const response = await loginUser(payload);
			console.log("[AUTH] Login response:", JSON.stringify(response, null, 2));

			// FIX: Handle both response formats (with or without 'data' wrapper)
			const responseData = response.data || response;
			const tokenData = responseData.token;
			const userData = responseData.user;

			if (!tokenData) {
				console.error("[AUTH] No token in response!");
				throw new Error("Invalid response from server - no token received");
			}

			if (!userData) {
				console.error("[AUTH] No user data in response!");
				throw new Error("Invalid response from server - no user data received");
			}

			setToken(tokenData);
			setAuthToken(tokenData);
			setUser(userData);
			console.log("[AUTH] ✅ Login successful");
		} catch (error: any) {
			console.error("[AUTH] ❌ Login failed:", error.message);
			throw error;
		}
	};

	const register = async (payload: {
		name: string;
		email: string;
		phone: string;
		password: string;
	}) => {
		console.log("[AUTH] Register attempt:", payload.email);

		try {
			const response = await registerUser(payload);
			console.log("[AUTH] Register response:", JSON.stringify(response, null, 2));

			const responseData = response.data || response;
			const tokenData = responseData.token;
			const userData = responseData.user;

			if (!tokenData || !userData) {
				throw new Error("Invalid response from server");
			}

			setToken(tokenData);
			setAuthToken(tokenData);
			setUser(userData);
			console.log("[AUTH] ✅ Registration successful");
		} catch (error: any) {
			console.error("[AUTH] ❌ Registration failed:", error.message);
			throw error;
		}
	};

	const logout = () => {
		console.log("[AUTH] Logout called");
		setUser(null);
		setToken(null);
		setAuthToken(null);
	};

	const value = useMemo(
		() => ({
			user,
			token,
			isAuthenticated: Boolean(user && token),
			login,
			register,
			logout,
		}),
		[user, token]
	);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
