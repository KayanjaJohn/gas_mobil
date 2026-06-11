import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
	ChevronLeft,
	QrCode,
	CreditCard,
	Bell,
	Shield,
	HelpCircle,
	Settings,
	LogOut,
	ChevronRight,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";

interface MenuItem {
	icon: string;
	title: string;
	subtitle: string;
}

const MENU_ITEMS: MenuItem[] = [
	{ icon: "qr", title: "My Cylinders", subtitle: "Scan & register" },
	{ icon: "card", title: "Payment Methods", subtitle: "Gasmobil Wallet, M-Pesa" },
	{ icon: "bell", title: "Notifications", subtitle: "Enabled" },
	{ icon: "shield", title: "Auto-Refill", subtitle: "Configure" },
	{ icon: "help", title: "Help & Support", subtitle: "FAQs, Contact" },
	{ icon: "settings", title: "Settings", subtitle: "Language, Location" },
];

export default function ProfileScreen() {
	const router = useRouter();
	const { user, logout } = useAuth();

	const getIcon = (iconName: string) => {
		const props = { size: 18, color: "#8A93A6" };
		switch (iconName) {
			case "qr":
				return <QrCode {...props} />;
			case "card":
				return <CreditCard {...props} />;
			case "bell":
				return <Bell {...props} />;
			case "shield":
				return <Shield {...props} />;
			case "help":
				return <HelpCircle {...props} />;
			case "settings":
				return <Settings {...props} />;
			default:
				return <Settings {...props} />;
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
						<ChevronLeft size={18} color="#fff" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Profile</Text>
				</View>

				<View style={styles.profileCard}>
					<View style={styles.avatar}>
						<Text style={styles.avatarText}>
							{user?.name?.slice(0, 2).toUpperCase() || "GM"}
						</Text>
					</View>
					<View>
						<Text style={styles.profileName}>
							{user?.email || "No email available"}
						</Text>
						<View style={styles.modeRow}>
							<View style={styles.modeDot} />
							<Text style={styles.modeText}>Consumer Mode</Text>
						</View>
					</View>
				</View>

				<View style={styles.wallet}>
					<Text style={styles.walletLabel}>GASMOBIL WALLET</Text>
					<Text style={styles.walletAmount}>UGX 0</Text>
					<TouchableOpacity style={styles.topUpBtn}>
						<Text style={styles.topUpText}>Top Up</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.menu}>
					{MENU_ITEMS.map((item, index) => (
						<TouchableOpacity key={index} style={styles.menuItem}>
							{getIcon(item.icon)}
							<View style={styles.menuText}>
								<Text style={styles.menuTitle}>{item.title}</Text>
								<Text style={styles.menuSub}>{item.subtitle}</Text>
							</View>
							<ChevronRight size={16} color="#8A93A6" />
						</TouchableOpacity>
					))}
				</View>

				<TouchableOpacity
					style={styles.signOutBtn}
					onPress={() => {
						logout();
						router.replace("/");
					}}
				>
					<LogOut size={16} color="#ff6b6b" />
					<Text style={styles.signOutText}>Sign Out</Text>
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
	profileCard: {
		marginHorizontal: 16,
		backgroundColor: "#101723",
		borderWidth: 1,
		borderColor: "#1F2A3D",
		borderRadius: 14,
		padding: 14,
		flexDirection: "row",
		gap: 12,
		alignItems: "center",
	},
	avatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: "rgba(59,130,246,.18)",
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: {
		color: "#1484FF",
		fontWeight: "700",
		fontSize: 16,
	},
	profileName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
	},
	modeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
		marginTop: 3,
	},
	modeDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#1484FF",
	},
	modeText: {
		color: "#1484FF",
		fontSize: 12,
	},
	wallet: {
		marginHorizontal: 16,
		marginTop: 14,
		backgroundColor: "#0e1d3f",
		borderWidth: 1,
		borderColor: "#1c2c4a",
		borderRadius: 18,
		padding: 20,
	},
	walletLabel: {
		fontSize: 11,
		color: "#1484FF",
		letterSpacing: 0.15,
		fontWeight: "700",
	},
	walletAmount: {
		fontSize: 32,
		fontWeight: "700",
		color: "#fff",
		marginTop: 6,
		marginBottom: 14,
	},
	topUpBtn: {
		backgroundColor: "#1484FF",
		paddingVertical: 11,
		paddingHorizontal: 20,
		borderRadius: 999,
		alignSelf: "flex-start",
	},
	topUpText: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 13,
	},
	menu: {
		marginTop: 6,
		paddingHorizontal: 16,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		paddingVertical: 14,
		paddingHorizontal: 4,
		borderBottomWidth: 1,
		borderBottomColor: "#131d33",
	},
	menuText: {
		flex: 1,
	},
	menuTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
	},
	menuSub: {
		color: "#8A93A6",
		fontSize: 11,
		marginTop: 2,
	},
	signOutBtn: {
		marginHorizontal: 16,
		marginTop: 18,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 14,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#6b1a1a",
		backgroundColor: "transparent",
	},
	signOutText: {
		color: "#ff6b6b",
		fontWeight: "600",
		fontSize: 14,
	},
});
