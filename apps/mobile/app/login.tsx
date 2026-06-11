import React from "react";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
	const router = useRouter();
	const { isAuthenticated, login } = useAuth();
	const [emailOrPhone, setEmailOrPhone] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	if (isAuthenticated) {
		return <Redirect href="/(tabs)" />;
	}

	const handleLogin = async () => {
		console.log("[LOGIN SCREEN] handleLogin called");
		console.log("[LOGIN SCREEN] Values:", { emailOrPhone, password: "***" });

		if (!emailOrPhone || !password) {
			console.log("[LOGIN SCREEN] Validation failed - missing fields");
			Alert.alert("Missing fields", "Please enter your email or phone and password.");
			return;
		}

		setLoading(true);
		try {
			console.log("[LOGIN SCREEN] Calling login...");
			await login({ emailOrPhone, password });
			console.log("[LOGIN SCREEN] Login succeeded!");
			router.replace("/(tabs)");
		} catch (error: any) {
			console.error("[LOGIN SCREEN] Login failed:", error);
			console.error("[LOGIN SCREEN] Error message:", error?.message);
			Alert.alert("Login failed", error?.message || "Please try again.");
		} finally {
			setLoading(false);
			console.log("[LOGIN SCREEN] Loading set to false");
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Welcome Back</Text>
			<Text style={styles.subtitle}>Sign in to continue ordering gas.</Text>
			<TextInput
				style={styles.input}
				placeholder="Email or Phone"
				placeholderTextColor="#8492a6"
				value={emailOrPhone}
				onChangeText={setEmailOrPhone}
				autoCapitalize="none"
			/>
			<TextInput
				style={styles.input}
				placeholder="Password"
				placeholderTextColor="#8492a6"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<TouchableOpacity
				style={styles.button}
				onPress={() => {
					console.log("[LOGIN SCREEN] Button pressed");
					handleLogin();
				}}
				disabled={loading}
			>
				<Text style={styles.buttonText}>
					{loading ? "Signing in..." : "Login"}
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => router.push("/register")}>
				<Text style={styles.link}>Create new account</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#070b14",
		padding: 24,
		justifyContent: "center",
	},
	title: {
		color: "#fff",
		fontSize: 34,
		fontWeight: "800",
		marginBottom: 10,
	},
	subtitle: {
		color: "#d1d5db",
		fontSize: 16,
		marginBottom: 32,
	},
	input: {
		backgroundColor: "#0f172a",
		color: "#fff",
		borderRadius: 16,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#1e293b",
	},
	button: {
		backgroundColor: "#2563eb",
		paddingVertical: 16,
		borderRadius: 16,
		alignItems: "center",
		marginTop: 8,
	},
	buttonText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 16,
	},
	link: {
		color: "#60a5fa",
		textAlign: "center",
		marginTop: 22,
		fontWeight: "600",
	},
});