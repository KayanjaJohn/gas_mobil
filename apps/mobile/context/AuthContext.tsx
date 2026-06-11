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
		console.log("[AUTH] Login called with:", emailOrPhone);

		const payload = { emailOrPhone, password };
		console.log("[AUTH] Sending payload:", JSON.stringify(payload));

		const response = await loginUser(payload);
		console.log("[AUTH] Login response:", JSON.stringify(response, null, 2));

		// Handle both response formats
		const tokenData = response.data?.token || response.token;
		const userData = response.data?.user || response.user;

		console.log("[AUTH] Extracted token:", tokenData ? "yes" : "no");
		console.log("[AUTH] Extracted user:", userData ? "yes" : "no");

		if (!tokenData) {
			console.error("[AUTH] No token in response!");
			throw new Error("Invalid response from server - no token received");
		}

		setToken(tokenData);
		setAuthToken(tokenData);
		setUser(userData);
		console.log("[AUTH] Login state updated successfully");
	};

	const register = async (payload: {
		name: string;
		email: string;
		phone: string;
		password: string;
	}) => {
		console.log("[AUTH] Register called with:", JSON.stringify(payload, null, 2));
		const response = await registerUser(payload);
		console.log("[AUTH] Register response:", JSON.stringify(response, null, 2));
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
		[user, token],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}