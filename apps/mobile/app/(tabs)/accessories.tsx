import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ShoppingCart, Flame, Utensils, Gauge, Cable } from "lucide-react-native";
import { useCart } from "../../context/CartContext";

interface Accessory {
	id: number;
	name: string;
	cat: string;
	desc: string;
	price: number;
	icon: string;
}

const ACC: Accessory[] = [
	{
		id: 1,
		name: "Single Gas Burner",
		cat: "burner",
		desc: "Stainless steel single burner stove",
		price: 35000,
		icon: "flame",
	},
	{
		id: 2,
		name: "Double Gas Burner",
		cat: "burner",
		desc: "Heavy-duty double burner stove",
		price: 65000,
		icon: "flame",
	},
	{
		id: 3,
		name: "Commercial Gas Burner",
		cat: "burner",
		desc: "Industrial-grade burner",
		price: 180000,
		icon: "flame",
	},
	{
		id: 4,
		name: "Portable Gas Grill",
		cat: "grill",
		desc: "Compact outdoor gas grill",
		price: 120000,
		icon: "utensils",
	},
	{
		id: 5,
		name: "Tabletop Gas Grill",
		cat: "grill",
		desc: "Small tabletop grill",
		price: 85000,
		icon: "utensils",
	},
	{
		id: 6,
		name: "Standard Gas Regulator",
		cat: "reg",
		desc: "Brass pressure regulator",
		price: 25000,
		icon: "gauge",
	},
	{
		id: 7,
		name: "Low-Pressure Regulator",
		cat: "reg",
		desc: "Precision low-pressure regulator",
		price: 35000,
		icon: "gauge",
	},
	{
		id: 8,
		name: "Commercial Regulator",
		cat: "reg",
		desc: "Heavy-duty regulator for 45kg",
		price: 55000,
		icon: "gauge",
	},
	{
		id: 9,
		name: "Gas Hosepipe 1.5m",
		cat: "hose",
		desc: "High-quality rubber hose 1.5m",
		price: 15000,
		icon: "cable",
	},
	{
		id: 10,
		name: "Gas Hosepipe 2m",
		cat: "hose",
		desc: "Premium hose 2m with clamps",
		price: 20000,
		icon: "cable",
	},
];

const TABS: { key: string; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "burner", label: "Burners" },
	{ key: "grill", label: "Grills" },
	{ key: "hose", label: "Hosepipes" },
	{ key: "reg", label: "Regulators" },
];

export default function AccessoriesScreen() {
	const router = useRouter();
	const { addToCart, cartItems } = useCart();
	const [activeTab, setActiveTab] = useState<string>("all");

	const filtered: Accessory[] =
		activeTab === "all" ? ACC : ACC.filter((a) => a.cat === activeTab);

	const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

	const getIcon = (iconName: string) => {
		const props = { size: 24, color: "#1484FF" };
		switch (iconName) {
			case "flame":
				return <Flame {...props} />;
			case "utensils":
				return <Utensils {...props} />;
			case "gauge":
				return <Gauge {...props} />;
			case "cable":
				return <Cable {...props} />;
			default:
				return <Flame {...props} />;
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
						<ChevronLeft size={18} color="#fff" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Accessories</Text>
					<TouchableOpacity style={styles.cartBtn} onPress={() => router.push("/cart")}>
						<ShoppingCart size={18} color="#fff" />
						{cartCount > 0 ?
							<View style={styles.cartBadge}>
								<Text style={styles.cartBadgeText}>{cartCount}</Text>
							</View>
						:	null}
					</TouchableOpacity>
				</View>

				<Text style={styles.subtitle}>Everything you need for your gas setup</Text>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.tabsScroll}
				>
					<View style={styles.tabs}>
						{TABS.map((tab) => (
							<TouchableOpacity
								key={tab.key}
								style={[styles.tab, activeTab === tab.key && styles.tabActive]}
								onPress={() => setActiveTab(tab.key)}
							>
								<Text
									style={[
										styles.tabText,
										activeTab === tab.key && styles.tabTextActive,
									]}
								>
									{tab.label}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</ScrollView>

				<View style={styles.list}>
					{filtered.map((item) => (
						<View key={item.id} style={styles.accCard}>
							<View style={styles.thumb}>{getIcon(item.icon)}</View>
							<View style={styles.meta}>
								<Text style={styles.accName}>{item.name}</Text>
								<Text style={styles.accDesc}>{item.desc}</Text>
								<Text style={styles.accPrice}>
									UGX {item.price.toLocaleString()}
								</Text>
								<View style={styles.stockRow}>
									<View style={styles.stockDot} />
									<Text style={styles.stockText}>In Stock</Text>
								</View>
							</View>
							<TouchableOpacity
								style={styles.addBtn}
								onPress={() =>
									addToCart({
										id: item.id.toString(),
										name: item.name,
										type: "accessory",
										unitPrice: item.price,
										quantity: 1,
									})
								}
							>
								<ShoppingCart size={14} color="#fff" />
								<Text style={styles.addText}>Add</Text>
							</TouchableOpacity>
						</View>
					))}
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
		flex: 1,
	},
	cartBtn: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: "#121a28",
		borderWidth: 1,
		borderColor: "#1F2A3D",
		alignItems: "center",
		justifyContent: "center",
	},
	cartBadge: {
		position: "absolute",
		top: -6,
		right: -6,
		minWidth: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: "#f97316",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	cartBadgeText: {
		color: "#fff",
		fontSize: 10,
		fontWeight: "700",
	},
	subtitle: {
		color: "#8A93A6",
		fontSize: 12,
		marginHorizontal: 16,
		marginBottom: 12,
	},
	tabsScroll: {
		marginHorizontal: 16,
		marginBottom: 12,
	},
	tabs: {
		flexDirection: "row",
		gap: 8,
		paddingVertical: 4,
	},
	tab: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 999,
		backgroundColor: "#101723",
		borderWidth: 1,
		borderColor: "#1F2A3D",
	},
	tabActive: {
		backgroundColor: "#1484FF",
		borderColor: "#1484FF",
	},
	tabText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#8A93A6",
	},
	tabTextActive: {
		color: "#fff",
	},
	list: {
		paddingHorizontal: 16,
		gap: 10,
	},
	accCard: {
		flexDirection: "row",
		gap: 12,
		alignItems: "center",
		backgroundColor: "#101723",
		borderWidth: 1,
		borderColor: "#1F2A3D",
		borderRadius: 14,
		padding: 12,
	},
	thumb: {
		width: 64,
		height: 64,
		borderRadius: 10,
		backgroundColor: "#1a2438",
		alignItems: "center",
		justifyContent: "center",
	},
	meta: {
		flex: 1,
		minWidth: 0,
	},
	accName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 2,
	},
	accDesc: {
		color: "#8A93A6",
		fontSize: 11,
		lineHeight: 16,
	},
	accPrice: {
		color: "#1484FF",
		fontWeight: "700",
		fontSize: 13,
		marginTop: 6,
	},
	stockRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginTop: 4,
	},
	stockDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#34d399",
	},
	stockText: {
		color: "#34d399",
		fontSize: 11,
	},
	addBtn: {
		backgroundColor: "#1484FF",
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 8,
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	addText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "600",
	},
});
