import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Check, Package, Truck, Home } from "lucide-react-native";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getDelivery } from "../../utils/apiClient";

interface TimelineItem {
	icon: string;
	title: string;
	time: string;
	done: boolean;
}

const DEFAULT_TIMELINE: TimelineItem[] = [
	{ icon: "check", title: "Order confirmed", time: "2 mins ago", done: true },
	{ icon: "package", title: "Picked up from station", time: "Just now", done: true },
	{ icon: "truck", title: "On the way", time: "ETA 18 min", done: false },
	{ icon: "home", title: "Delivered", time: "—", done: false },
];

export default function TrackingScreen() {
	const router = useRouter();
	const { lastOrderId } = useCart();
	const { logout } = useAuth();
	const [timeline, setTimeline] = useState<TimelineItem[]>(DEFAULT_TIMELINE);
	const [orderNumber, setOrderNumber] = useState("Pending Order");
	const [truckPosition, setTruckPosition] = useState({ left: "18%", top: "60%" });

	const handleLogout = () => {
		logout();
		router.replace("/");
	};

	useEffect(() => {
		if (!lastOrderId) {
			return;
		}

		setOrderNumber(`#${lastOrderId.slice(-6).toUpperCase()}`);

		getDelivery(lastOrderId)
			.then((response) => {
				if (response?.data?.status === "assigned") {
					setTimeline(DEFAULT_TIMELINE);
				}
			})
			.catch(() => {
				// ignore delivery fetch errors for now
			});

		const updateProgress = () => {
			setTimeline((previous) => {
				const nextIndex = previous.findIndex((item) => !item.done);
				if (nextIndex === -1) return previous;
				return previous.map((item, index) =>
					index === nextIndex ?
						{ ...item, done: true, time: index === 2 ? "ETA 5 min" : item.time }
					:	item,
				);
			});

			setTruckPosition((position) => {
				if (position.left === "18%") {
					return { left: "32%", top: "52%" };
				}
				if (position.left === "32%") {
					return { left: "48%", top: "40%" };
				}
				return { left: "63%", top: "28%" };
			});
		};

		const interval = setInterval(updateProgress, 7000);
		return () => clearInterval(interval);
	}, [lastOrderId]);

	const getIcon = (iconName: string, done: boolean) => {
		const color = done ? "#fff" : "#8A93A6";
		const size = 14;
		switch (iconName) {
			case "check":
				return <Check size={size} color={color} />;
			case "package":
				return <Package size={size} color={color} />;
			case "truck":
				return <Truck size={size} color={color} />;
			case "home":
				return <Home size={size} color={color} />;
			default:
				return <Check size={size} color={color} />;
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
						<ChevronLeft size={18} color="#fff" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Live Tracking</Text>
					<TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
						<Text style={styles.logoutText}>Logout</Text>
					</TouchableOpacity>
					<View
						style={[
							styles.dot,
							styles.dotEnd,
							{ left: truckPosition.left, top: truckPosition.top },
						]}
					/>
				</View>
				<View style={{ marginHorizontal: 16, marginBottom: 12 }}>
					<Text style={{ color: "#8A93A6", fontSize: 11 }}>
						Live route updates in real time while your order is on the way.
					</Text>
					<Text style={styles.orderNum}>{orderNumber}</Text>
					<Text style={styles.driverInfo}>
						Driver: Moses K. · Toyota Hiace · UAX 234B
					</Text>

					<View style={styles.timeline}>
						{timeline.map((item, index) => (
							<View key={index} style={styles.tl}>
								<View style={[styles.tlIcon, item.done && styles.tlIconDone]}>
									{getIcon(item.icon, item.done)}
								</View>
								<View style={styles.tlText}>
									<Text style={styles.tlTitle}>{item.title}</Text>
									<Text style={styles.tlTime}>{item.time}</Text>
								</View>
							</View>
						))}
					</View>
				</View>

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
	map: {
		height: 240,
		borderRadius: 14,
		backgroundColor: "#0a1530",
		borderWidth: 1,
		borderColor: "#1F2A3D",
		marginHorizontal: 16,
		marginBottom: 14,
		position: "relative",
		overflow: "hidden",
	},
	path: {
		position: "absolute",
		left: "20%",
		top: "30%",
		width: "60%",
		height: "40%",
		borderWidth: 2,
		borderStyle: "dashed",
		borderColor: "rgba(59,130,246,.5)",
		borderRadius: 100,
		borderRightWidth: 0,
		borderBottomWidth: 0,
	},
	dot: {
		position: "absolute",
		width: 14,
		height: 14,
		borderRadius: 7,
		backgroundColor: "#1484FF",
	},
	dotStart: {
		left: "18%",
		top: "60%",
	},
	dotEnd: {
		right: "18%",
		top: "25%",
		backgroundColor: "#34d399",
	},
	card: {
		marginHorizontal: 16,
		padding: 16,
		borderRadius: 18,
		backgroundColor: "#101723",
		borderWidth: 1,
		borderColor: "#1F2A3D",
	},
	orderNum: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
	},
	driverInfo: {
		color: "#8A93A6",
		fontSize: 12,
		marginTop: 4,
		marginBottom: 14,
	},
	timeline: {
		gap: 0,
	},
	tl: {
		flexDirection: "row",
		gap: 14,
		paddingVertical: 12,
		position: "relative",
	},
	tlIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#1a2236",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 1,
	},
	tlIconDone: {
		backgroundColor: "#1484FF",
	},
	tlText: {
		flex: 1,
	},
	tlTitle: {
		fontSize: 13,
		fontWeight: "600",
		color: "#fff",
	},
	tlTime: {
		color: "#8A93A6",
		fontSize: 11,
		marginTop: 2,
	},
	logoutBtn: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 14,
		backgroundColor: "#1f2937",
		marginLeft: "auto",
	},
	logoutText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "700",
	},
});
