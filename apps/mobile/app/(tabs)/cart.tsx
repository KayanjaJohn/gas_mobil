import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ShoppingCart, Plus, Minus, X } from "lucide-react-native";
import { useCart } from "../../context/CartContext";

export default function CartScreen() {
	const router = useRouter();
	const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
						<ChevronLeft size={18} color="#fff" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Your Cart</Text>
				</View>

				{cartItems.length === 0 ?
					<View style={styles.empty}>
						<ShoppingCart size={48} color="#1e2a44" />
						<Text style={styles.emptyText}>Your cart is empty</Text>
						<TouchableOpacity
							style={styles.browseBtn}
							onPress={() => router.push("/accessories")}
						>
							<Text style={styles.browseText}>Browse Accessories</Text>
						</TouchableOpacity>
					</View>
				:	<View style={styles.content}>
						{cartItems.map((item) => (
							<View key={item.id} style={styles.itemCard}>
								<View style={styles.itemInfo}>
									<Text style={styles.itemName}>{item.name}</Text>
									<Text style={styles.itemMeta}>
										{item.quantity} x UGX {item.unitPrice.toLocaleString()}
									</Text>
								</View>
								<View style={styles.itemActions}>
									<TouchableOpacity
										onPress={() => updateQuantity(item.id, item.quantity - 1)}
										style={styles.qtyBtn}
									>
										<Minus size={14} color="#fff" />
									</TouchableOpacity>
									<Text style={styles.qtyText}>{item.quantity}</Text>
									<TouchableOpacity
										onPress={() => updateQuantity(item.id, item.quantity + 1)}
										style={styles.qtyBtn}
									>
										<Plus size={14} color="#fff" />
									</TouchableOpacity>
								</View>
								<TouchableOpacity
									onPress={() => removeFromCart(item.id)}
									style={styles.removeBtn}
								>
									<X size={14} color="#fff" />
								</TouchableOpacity>
							</View>
						))}

						<View style={styles.summaryCard}>
							<Text style={styles.summaryText}>Total</Text>
							<Text style={styles.summaryValue}>
								UGX {totalPrice.toLocaleString()}
							</Text>
						</View>

						<TouchableOpacity
							style={styles.checkoutBtn}
							onPress={() => router.push("/order/location")}
						>
							<Text style={styles.checkoutText}>Checkout</Text>
						</TouchableOpacity>
					</View>
				}

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
	empty: {
		alignItems: "center",
		paddingTop: 60,
		paddingHorizontal: 20,
	},
	emptyText: {
		color: "#8A93A6",
		marginTop: 10,
		fontSize: 14,
	},
	browseBtn: {
		backgroundColor: "#1484FF",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 14,
		marginTop: 16,
	},
	browseText: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 14,
	},
	content: {
		paddingHorizontal: 16,
		gap: 12,
	},
	itemCard: {
		backgroundColor: "#101723",
		borderWidth: 1,
		borderColor: "#1F2A3D",
		borderRadius: 14,
		padding: 16,
		gap: 10,
	},
	itemInfo: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	itemName: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 14,
		flex: 1,
	},
	itemMeta: {
		color: "#8A93A6",
		fontSize: 12,
	},
	itemActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	qtyBtn: {
		width: 32,
		height: 32,
		borderRadius: 10,
		backgroundColor: "#1a2236",
		alignItems: "center",
		justifyContent: "center",
	},
	qtyText: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "600",
	},
	removeBtn: {
		position: "absolute",
		top: 16,
		right: 16,
		width: 32,
		height: 32,
		borderRadius: 10,
		backgroundColor: "#181f2f",
		alignItems: "center",
		justifyContent: "center",
	},
	summaryCard: {
		marginTop: 12,
		padding: 16,
		borderRadius: 14,
		backgroundColor: "#101723",
		borderWidth: 1,
		borderColor: "#1F2A3D",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	summaryText: {
		color: "#8A93A6",
		fontSize: 13,
	},
	summaryValue: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 15,
	},
	checkoutBtn: {
		marginTop: 16,
		backgroundColor: "#1484FF",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
	},
	checkoutText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 15,
	},
});
