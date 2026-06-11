import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen() {
	const router = useRouter();
	const { isAuthenticated, register } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	if (isAuthenticated) {
		router.replace("/(tabs)");
		return null;
	}

	const handleRegister = async () => {
		console.log("[REGISTER SCREEN] handleRegister called");
		console.log("[REGISTER SCREEN] Values:", { name, email, phone, password: "***" });

		if (!name || !email || !phone || !password) {
			console.log("[REGISTER SCREEN] Validation failed - missing fields");
			Alert.alert("Missing fields", "Please fill all fields to create your account.");
			return;
		}

		if (password.length < 6) {
			console.log("[REGISTER SCREEN] Password too short");
			Alert.alert("Weak password", "Password must be at least 6 characters.");
			return;
		}

		setLoading(true);
		try {
			console.log("[REGISTER SCREEN] Calling register...");
			await register({ name, email, phone, password });
			console.log("[REGISTER SCREEN] Register succeeded!");
			Alert.alert("Success", "Account created! Please login.");
			router.replace("/login");
		} catch (error: any) {
			console.error("[REGISTER SCREEN] Register failed:", error);
			console.error("[REGISTER SCREEN] Error message:", error?.message);
			Alert.alert("Registration failed", error?.message || "Please try again.");
		} finally {
			setLoading(false);
			console.log("[REGISTER SCREEN] Loading set to false");
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Create Account</Text>
			<Text style={styles.subtitle}>Sign up to order and track your deliveries.</Text>
			<TextInput
				style={styles.input}
				placeholder="Full name"
				placeholderTextColor="#8492a6"
				value={name}
				onChangeText={setName}
				autoCapitalize="words"
			/>
			<TextInput
				style={styles.input}
				placeholder="Email"
				placeholderTextColor="#8492a6"
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<TextInput
				style={styles.input}
				placeholder="Phone"
				placeholderTextColor="#8492a6"
				value={phone}
				onChangeText={setPhone}
				keyboardType="phone-pad"
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
					console.log("[REGISTER SCREEN] Button pressed");
					handleRegister();
				}}
				disabled={loading}
			>
				<Text style={styles.buttonText}>
					{loading ? "Creating account..." : "Sign Up"}
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => router.push("/login")}>
				<Text style={styles.link}>Already have an account? Login</Text>
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