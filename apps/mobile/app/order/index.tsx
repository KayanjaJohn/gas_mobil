import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, RefreshCw, ShoppingBag, ChevronRight } from "lucide-react-native";

const PRICES: Record<string, Record<string, number>> = {
	swap: { "6kg": 50000, "12kg": 100000, "45kg": 250000 },
	buy: { "6kg": 157000, "12kg": 270000, "45kg": 525000 },
};

export default function OrderScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const initialType = params.type === "buy" ? "buy" : "swap";
	const [orderType, setOrderType] = useState<"swap" | "buy">(initialType as "swap" | "buy");
	const [orderSize, setOrderSize] = useState<string>((params.size as string) || "12kg");

	const sizes: string[] = ["6kg", "12kg", "45kg"];

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
						<ChevronLeft size={18} color="#fff" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Order Gas</Text>
				</View>

				<View style={styles.stepper}>
					<View style={[styles.step, styles.stepOn]} />
					<View style={styles.step} />
					<View style={styles.step} />
				</View>

				<Text style={styles.label}>What do you need?</Text>
				<View style={styles.choose}>
					<TouchableOpacity
						style={[styles.opt, orderType === "swap" && styles.optActive]}
						onPress={() => setOrderType("swap")}
					>
						<RefreshCw size={18} color="#1484FF" />
						<Text style={styles.optTitle}>Swap Refill</Text>
						<Text style={styles.optSub}>Exchange empty for full</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.opt, orderType === "buy" && styles.optActive]}
						onPress={() => setOrderType("buy")}
					>
						<ShoppingBag size={18} color="#1484FF" />
						<Text style={styles.optTitle}>Buy Full Kit</Text>
						<Text style={styles.optSub}>First-time purchase</Text>
					</TouchableOpacity>
				</View>

				<Text style={styles.label}>Select size</Text>
				<View style={styles.sizes}>
					{sizes.map((s: string) => (
						<TouchableOpacity
							key={s}
							style={[styles.size, orderSize === s && styles.sizeActive]}
							onPress={() => setOrderSize(s)}
						>
							{s === "6kg" && (
								<View style={styles.popBadge}>
									<Text style={styles.popText}>POPULAR</Text>
								</View>
							)}
							<View>
								<Text style={styles.sizeTitle}>{s}</Text>
								<Text style={styles.sizeSub}>
									{orderType === "swap" ? "Refill" : "Full Kit"}
								</Text>
							</View>
							<Text style={styles.sizePrice}>
								UGX {PRICES[orderType][s].toLocaleString()}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<TouchableOpacity
					style={styles.continueBtn}
					onPress={() =>
						router.push(`/order/location?type=${orderType}&size=${orderSize}`)
					}
				>
					<Text style={styles.continueText}>Continue</Text>
					<ChevronRight size={16} color="#fff" />
				</TouchableOpacity>

				<View style={{ height: 40 }} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#070b14",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 14,
	},
	backBtn: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: "#1a2236",
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#fff",
	},
	stepper: {
		flexDirection: "row",
		gap: 6,
		marginHorizontal: 16,
		marginBottom: 16,
	},
	step: {
		flex: 1,
		height: 3,
		borderRadius: 2,
		backgroundColor: "#1E2A44",
	},
	stepOn: {
		backgroundColor: "#1484FF",
	},
	label: {
		fontSize: 13,
		color: "#8A93A6",
		marginHorizontal: 16,
		marginTop: 18,
		marginBottom: 10,
	},
	choose: {
		flexDirection: "row",
		gap: 10,
		marginHorizontal: 16,
	},
	opt: {
		flex: 1,
		backgroundColor: "#101723",
		borderWidth: 1,
		borderColor: "#1F2A3D",
		borderRadius: 14,
		padding: 14,
		gap: 6,
	},
	optActive: {
		borderColor: "#1484FF",
		backgroundColor: "rgba(20,132,255,0.08)",
	},
	optTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
	},
	optSub: {
		fontSize: 11,
		color: "#8A93A6",
	},
	sizes: {
		gap: 10,
		marginHorizontal: 16,
	},
	size: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#101723",
		borderWidth: 1,
		borderColor: "#1F2A3D",
		borderRadius: 14,
		padding: 16,
	},
	sizeActive: {
		borderColor: "#1484FF",
		backgroundColor: "rgba(20,132,255,0.08)",
	},
	popBadge: {
		position: "absolute",
		top: -8,
		right: 14,
		backgroundColor: "#1484FF",
		paddingVertical: 3,
		paddingHorizontal: 8,
		borderRadius: 6,
	},
	popText: {
		color: "#fff",
		fontSize: 9,
		fontWeight: "700",
		letterSpacing: 0.1,
	},
	sizeTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#fff",
	},
	sizeSub: {
		fontSize: 12,
		color: "#8A93A6",
	},
	sizePrice: {
		color: "#1484FF",
		fontWeight: "700",
		fontSize: 14,
	},
	continueBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		backgroundColor: "#1484FF",
		marginHorizontal: 16,
		marginTop: 18,
		paddingVertical: 14,
		borderRadius: 14,
	},
	continueText: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 14,
	},
});
