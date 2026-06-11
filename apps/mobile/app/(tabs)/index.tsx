import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
	Flame,
	Bell,
	MapPin,
	RefreshCw,
	ShoppingBag,
	Map,
	Settings,
	Truck,
	Zap,
	ChevronRight,
	AlertTriangle,
	Phone,
	Mail,
	Globe,
} from "lucide-react-native";
import { useCart } from "../../context/CartContext";
import { createOrder } from "../../utils/apiClient";

export default function HomeScreen() {
	const router = useRouter();
	const [percent, setPercent] = useState<number>(15);
	const [loadingOrder, setLoadingOrder] = useState(false);
	const { deliveryAddress, paymentMethod, setLastOrderId, clearCart } = useCart();

	// Cylinder drain animation
	useEffect(() => {
		const interval = setInterval(() => {
			setPercent((prev) => {
				const next = prev - 0.5;
				return next <= 0 ? 100 : next;
			});
		}, 2000);
		return () => clearInterval(interval);
	}, []);

	const getStatusColor = (p: number): string =>
		p < 20 ? "#ff4d4d"
		: p < 50 ? "#f59e0b"
		: "#22c55e";
	const getStatusText = (p: number): string => {
		if (p < 20) return "~1 day left — Refill soon!";
		if (p < 50) return "~3 days left — Plan a refill";
		return "Plenty of gas remaining";
	};
	const getStatusLabel = (p: number): string =>
		p < 20 ? "LOW"
		: p < 50 ? "HALF"
		: "FULL";

	const statusColor = getStatusColor(percent);

	const handleQuickOrder = async (type: 'swap' | 'buy_new' | 'quick') => {
		if (!deliveryAddress || !deliveryAddress.trim()) {
			Alert.alert("No delivery address", "Please set a delivery address before placing a quick order.", [
				{ text: "Enter address", onPress: () => router.push("/order/location") },
				{ text: "Cancel", style: "cancel" },
			]);
			return;
		}
		setLoadingOrder(true);
		try {
			const res = await createOrder({
				items: [],
				totalPrice: 0,
				deliveryAddress,
				paymentMethod,
				orderType: type,
			});
			const orderId = res?.data?.order?._id || res?.data?.order?.id;
			if (orderId) {
				setLastOrderId(orderId.toString());
				clearCart();
			}
			router.push("/(tabs)/tracking");
		} catch (err: any) {
			Alert.alert("Order failed", err?.message || "Unable to place order");
		} finally {
			setLoadingOrder(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Top Bar */}
				<View style={styles.topBar}>
					<View style={styles.brand}>
						<View style={styles.flameLogo}>
							<Flame size={20} color="#1484FF" />
						</View>
						<View>
							<View style={styles.locRow}>
								<MapPin size={12} color="#8A93A6" />
								<Text style={styles.locText}>Kampala, Uganda</Text>
							</View>
							<Text style={styles.brandTitle}>
								Gasmobil <Text style={styles.accent}>Uganda</Text>
							</Text>
						</View>
					</View>
					<TouchableOpacity style={styles.bell} onPress={() => {}}>
						<Bell size={18} color="#fff" />
						<View style={styles.dot} />
					</TouchableOpacity>
				</View>

				{/* Hero Order Card */}
				<View style={styles.orderCard}>
					<View style={styles.orderText}>
						<Text style={styles.tag}>DEPOSIT-FREE</Text>
						<Text style={styles.orderTitle}>
							Swap your empty cylinder for a full one
						</Text>
						<TouchableOpacity
							style={styles.btnPrimary}
						onPress={() => router.push('/order?type=quick')}
					>
						<Text style={styles.btnText}>Order Now</Text>
							<ChevronRight size={16} color="#fff" />
						</TouchableOpacity>
					</View>
					<View style={styles.flameArt}>
						<Flame size={60} color="#1484FF" />
					</View>
				</View>

				{/* Cylinder Card */}
				<View style={styles.sectionLabel}>
					<Text style={styles.sectionTitle}>YOUR CYLINDER</Text>
				</View>
				<View style={styles.cylinderCard}>
					<View style={[styles.progressRing, { borderColor: statusColor }]}>
						<View style={styles.progressInner}>
							<Text style={[styles.percentText, { color: statusColor }]}>
								{Math.round(percent)}%
							</Text>
							<Text style={styles.fullLabel}>{getStatusLabel(percent)}</Text>
						</View>
					</View>
					<View style={styles.cylInfo}>
						<View style={styles.cylTitleRow}>
							<Flame size={14} color="#1484FF" />
							<Text style={styles.cylTitle}>6kg Cylinder</Text>
						</View>
						<View style={styles.warnRow}>
							<AlertTriangle size={12} color={statusColor} />
							<Text style={[styles.warnText, { color: statusColor }]}>
								{getStatusText(percent)}
							</Text>
						</View>
						<View style={styles.inspRow}>
							<View style={[styles.inspDot, { backgroundColor: "#22c55e" }]} />
							<Text style={styles.inspText}>Inspected May 16, 2026</Text>
						</View>
					</View>
				</View>

				{/* Quick Actions */}
				<View style={styles.sectionLabel}>
					<Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
				</View>
				<View style={styles.actions}>
					<TouchableOpacity style={styles.action} onPress={() => router.push('/order?type=swap&size=12kg')}> 
						<View
							style={[styles.actionIcon, { backgroundColor: "rgba(20,132,255,.15)" }]}
						>
							<RefreshCw size={18} color="#3DA5FF" />
						</View>
						<Text style={styles.actionText}>Swap Refill</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.action} onPress={() => router.push('/order?type=buy&size=12kg')}> 
						<View
							style={[styles.actionIcon, { backgroundColor: "rgba(255,77,77,.15)" }]}
						>
							<ShoppingBag size={18} color="#ff6b6b" />
						</View>
						<Text style={styles.actionText}>Buy New</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.action}
						onPress={() => router.push("/(tabs)/agents")}
					>
						<View
							style={[styles.actionIcon, { backgroundColor: "rgba(34,197,94,.15)" }]}
						>
							<Map size={18} color="#3ddc84" />
						</View>
						<Text style={styles.actionText}>Find Agent</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.action}
						onPress={() => router.push("/(tabs)/accessories")}
					>
						<View
							style={[styles.actionIcon, { backgroundColor: "rgba(245,158,11,.15)" }]}
						>
							<Settings size={18} color="#f5b042" />
						</View>
						<Text style={styles.actionText}>Accessories</Text>
					</TouchableOpacity>
				</View>

				{/* Delivery Card */}
				<View style={styles.deliveryCard}>
					<View style={styles.deliveryIcon}>
						<Truck size={20} color="#1484FF" />
					</View>
					<View style={styles.deliveryText}>
						<Text style={styles.deliveryTitle}>2-Hour Delivery Guarantee</Text>
						<Text style={styles.deliverySub}>Or get 10% off your next refill</Text>
					</View>
					<Zap size={18} color="#1484FF" />
				</View>

				{/* Nearest Station */}
				<View style={styles.sectionLabel}>
					<Text style={styles.sectionTitle}>NEAREST STATION</Text>
					<TouchableOpacity onPress={() => router.push("/(tabs)/agents")}>
						<Text style={styles.viewAll}>View All</Text>
					</TouchableOpacity>
				</View>
				<TouchableOpacity
					style={styles.stationCard}
					onPress={() => router.push("/(tabs)/agents")}
				>
					<View style={styles.stationAvatar}>
						<Text style={styles.stationAvatarText}>KA</Text>
					</View>
					<View style={styles.stationInfo}>
						<Text style={styles.stationName}>Shell Kampala Road</Text>
						<Text style={styles.stationSub}>Kampala · Open until 10:00 PM</Text>
					</View>
					<View style={styles.stationMeta}>
						<Text style={styles.kmText}>1.2 km</Text>
						<View style={styles.openRow}>
							<View style={styles.openDot} />
							<Text style={styles.openText}>Open</Text>
						</View>
					</View>
				</TouchableOpacity>

				{/* Contact Card */}
				<View style={styles.contactCard}>
					<View style={styles.contactHead}>
						<View style={styles.flameLogo}>
							<Flame size={22} color="#1484FF" />
						</View>
						<View>
							<Text style={styles.contactTitle}>Gasmobil Uganda</Text>
							<Text style={styles.contactSub}>
								A member of{" "}
								<Text style={styles.accent}>Lambula Creative Agency</Text>
							</Text>
						</View>
					</View>
					<View style={styles.divider} />
					<View style={styles.infoList}>
						<View style={styles.infoItem}>
							<Phone size={14} color="#1484FF" />
							<Text style={styles.infoText}>+256 785 796 333 · 0776 800 386</Text>
						</View>
						<View style={styles.infoItem}>
							<Mail size={14} color="#1484FF" />
							<Text style={styles.infoText}>info@gasmobil.ug</Text>
						</View>
						<View style={styles.infoItem}>
							<MapPin size={14} color="#1484FF" />
							<Text style={styles.infoText}>
								Plot 12, Kampala Road, Kampala, Uganda
							</Text>
						</View>
						<View style={styles.infoItem}>
							<Globe size={14} color="#1484FF" />
							<Text style={styles.infoText}>www.gasmobil.ug</Text>
						</View>
					</View>
					<View style={styles.divider} />
					<Text style={styles.copy}>
						© 2026 Gasmobil Uganda. All rights reserved.{"\n"}
						Powered by <Text style={styles.accent}>Lambula Creative Agency.</Text>
					</Text>
				</View>

				<View style={{ height: 100 }} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#070b14",
	},
	topBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 18,
		paddingTop: 8,
		paddingBottom: 8,
	},
	brand: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	flameLogo: {
		width: 38,
		height: 38,
		borderRadius: 12,
		backgroundColor: "#0d2647",
		borderWidth: 1,
		borderColor: "#16223a",
		alignItems: "center",
		justifyContent: "center",
	},
	locRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
	},
	locText: {
		fontSize: 11,
		color: "#8A93A6",
	},
	brandTitle: {
		fontSize: 17,
		fontWeight: "700",
		color: "#fff",
		marginTop: 2,
	},
	accent: {
		color: "#1484FF",
	},
	bell: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: "#121a28",
		borderWidth: 1,
		borderColor: "#1F2A3D",
		alignItems: "center",
		justifyContent: "center",
	},
	dot: {
		position: "absolute",
		top: 9,
		right: 10,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#ff4d4d",
		borderWidth: 1,
		borderColor: "#121a28",
	},
	orderCard: {
		marginHorizontal: 16,
		marginTop: 8,
		padding: 22,
		borderRadius: 18,
		backgroundColor: "#0e1828",
		borderWidth: 1,
		borderColor: "#16223a",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	orderText: {
		maxWidth: "62%",
	},
	tag: {
		color: "#1484FF",
		fontSize: 11,
		letterSpacing: 1.4,
		fontWeight: "700",
	},
	orderTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#fff",
		lineHeight: 24,
		marginTop: 8,
		marginBottom: 14,
	},
	btnPrimary: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#1484FF",
		paddingVertical: 11,
		paddingHorizontal: 20,
		borderRadius: 999,
		alignSelf: "flex-start",
	},
	btnText: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 13,
	},
	flameArt: {
		width: 80,
		height: 80,
		alignItems: "center",
		justifyContent: "center",
	},
	sectionLabel: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 22,
		paddingTop: 18,
		paddingBottom: 8,
	},
	sectionTitle: {
		fontSize: 11,
		letterSpacing: 1.5,
		color: "#8A93A6",
		fontWeight: "600",
	},
	viewAll: {
		fontSize: 12,
		color: "#1484FF",
		fontWeight: "600",
	},
	cylinderCard: {
		marginHorizontal: 16,
		padding: 18,
		borderRadius: 18,
		backgroundColor: "#1a0e12",
		borderWidth: 1,
		borderColor: "#3a1a22",
		flexDirection: "row",
		alignItems: "center",
		gap: 18,
	},
	progressRing: {
		width: 96,
		height: 96,
		borderRadius: 48,
		borderWidth: 6,
		alignItems: "center",
		justifyContent: "center",
	},
	progressInner: {
		alignItems: "center",
	},
	percentText: {
		fontSize: 20,
		fontWeight: "700",
		lineHeight: 24,
	},
	fullLabel: {
		fontSize: 9,
		letterSpacing: 1.5,
		color: "#8A93A6",
		marginTop: 4,
	},
	cylInfo: {
		flex: 1,
	},
	cylTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	cylTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "#fff",
	},
	warnRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 6,
	},
	warnText: {
		fontSize: 12,
	},
	inspRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 6,
	},
	inspDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	inspText: {
		fontSize: 11,
		color: "#8A93A6",
	},
	actions: {
		flexDirection: "row",
		gap: 10,
		paddingHorizontal: 16,
		marginTop: 4,
	},
	action: {
		flex: 1,
		alignItems: "center",
		gap: 8,
		paddingVertical: 14,
		paddingHorizontal: 6,
		borderRadius: 16,
		backgroundColor: "#101827",
		borderWidth: 1,
		borderColor: "#1F2A3D",
	},
	actionIcon: {
		width: 42,
		height: 42,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	actionText: {
		fontSize: 11,
		color: "#cfd3dc",
		textAlign: "center",
	},
	deliveryCard: {
		marginHorizontal: 16,
		marginTop: 14,
		padding: 16,
		borderRadius: 18,
		backgroundColor: "#101827",
		borderWidth: 1,
		borderColor: "#1F2A3D",
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	deliveryIcon: {
		width: 46,
		height: 46,
		borderRadius: 23,
		backgroundColor: "rgba(20,132,255,.15)",
		alignItems: "center",
		justifyContent: "center",
	},
	deliveryText: {
		flex: 1,
	},
	deliveryTitle: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "600",
	},
	deliverySub: {
		color: "#8A93A6",
		fontSize: 11,
		marginTop: 3,
	},
	stationCard: {
		marginHorizontal: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: "#101723",
		borderWidth: 1,
		borderColor: "#1F2A3D",
		borderRadius: 14,
		padding: 12,
	},
	stationAvatar: {
		width: 46,
		height: 46,
		borderRadius: 14,
		backgroundColor: "rgba(34,197,94,.15)",
		alignItems: "center",
		justifyContent: "center",
	},
	stationAvatarText: {
		color: "#3ddc84",
		fontWeight: "700",
		fontSize: 14,
	},
	stationInfo: {
		flex: 1,
	},
	stationName: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "600",
	},
	stationSub: {
		color: "#8A93A6",
		fontSize: 11,
		marginTop: 3,
	},
	stationMeta: {
		alignItems: "flex-end",
	},
	kmText: {
		color: "#1484FF",
		fontWeight: "700",
		fontSize: 14,
	},
	openRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginTop: 2,
	},
	openDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#22c55e",
	},
	openText: {
		fontSize: 10,
		color: "#22c55e",
	},
	contactCard: {
		marginHorizontal: 16,
		marginTop: 18,
		marginBottom: 24,
		padding: 20,
		borderRadius: 18,
		backgroundColor: "#101827",
		borderWidth: 1,
		borderColor: "#1F2A3D",
	},
	contactHead: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	contactTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "#fff",
	},
	contactSub: {
		fontSize: 11,
		color: "#8A93A6",
		marginTop: 2,
	},
	divider: {
		height: 1,
		backgroundColor: "#1F2A3D",
		marginVertical: 14,
	},
	infoList: {
		gap: 12,
	},
	infoItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	infoText: {
		fontSize: 12.5,
		color: "#cfd3dc",
	},
	copy: {
		fontSize: 10.5,
		color: "#8A93A6",
		textAlign: "center",
		lineHeight: 18,
	},
});
