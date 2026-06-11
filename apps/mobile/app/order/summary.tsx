import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Wallet, Smartphone, Clock, ChevronRight, Check } from "lucide-react-native";
import { useCart } from "../../context/CartContext";
import { createOrder } from "../../utils/apiClient";

const PAYMENT_OPTIONS = [
	{ value: "mtn", label: "Mobile Money", subtitle: "MTN / Airtel" },
	{ value: "visa", label: "Visa / Card", subtitle: "Credit or debit card" },
	{ value: "cash", label: "Cash on Delivery", subtitle: "Pay when delivered" },
];

export default function OrderSummaryScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const {
		cartItems,
		totalPrice,
		deliveryAddress,
		paymentMethod,
		setPaymentMethod,
		clearCart,
		setLastOrderId,
	} = useCart();
	const [loading, setLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");

	const PRICES: Record<string, Record<string, number>> = {
		swap: { "6kg": 50000, "12kg": 100000, "45kg": 250000 },
		buy: { "6kg": 157000, "12kg": 270000, "45kg": 525000 },
	};

	const selectedOrderType =
		params.type === "buy" ? "buy"
		: params.type === "swap" ? "swap"
		: undefined;
	const selectedSize = (params.size as string) || "12kg";
	const selectedItem =
		selectedOrderType ?
			{
				itemId: `cylinder-${selectedSize}`,
				name:
					selectedOrderType === "buy" ?
						`Buy New ${selectedSize}`
					:	`Swap Refill ${selectedSize}`,
				type: "cylinder",
				unitPrice: PRICES[selectedOrderType][selectedSize] || 0,
				quantity: 1,
			}
		:	undefined;
	const displayTotal = cartItems.length > 0 ? totalPrice : selectedItem?.unitPrice || 0;

	const handlePaymentOption = async (option: string) => {
		setPaymentMethod(option as any);
		if (option === "cash") {
			return;
		}

		if (option === "visa") {
			const url = "https://www.mastercard.com/global/en/personal/find-card-products.html";
			Linking.openURL(url).catch(() => {
				Alert.alert("Unable to open link", "Could not open the payment page.");
			});
			return;
		}

		if (option === "mtn" || option === "airtel") {
			const phone = option === "mtn" ? "+256770000000" : "+256780000000";
			Linking.openURL(`tel:${phone}`).catch(() => {
				Alert.alert("Unable to open dialer", "Could not open the phone dialer.");
			});
		}
	};

	const handlePlaceOrder = async () => {
		// Allow placing an order even if the cart is empty (backend will accept empty items).
		if (!deliveryAddress.trim()) {
			Alert.alert("Missing address", "Please provide a delivery address.");
			return;
		}

		if (!paymentMethod) {
			Alert.alert("Payment required", "Choose a payment method before placing your order.");
			return;
		}

		setLoading(true);
		try {
			// If cart is empty but order type/size provided via params, build an order item
			let itemsPayload = cartItems.map((item) => ({
				itemId: item.id,
				name: item.name,
				type: item.type,
				unitPrice: item.unitPrice,
				quantity: item.quantity,
			}));
			let computedTotal = totalPrice;

			if (!itemsPayload.length && params.type) {
				const typeKey = params.type === "buy" ? "buy" : "swap";
				const size = params.size || "12kg";
				const unit = PRICES[typeKey]?.[size] || 0;
				itemsPayload = [
					{
						itemId: `cylinder-${size}`,
						name: "Gas Cylinder",
						type: "cylinder",
						unitPrice: unit,
						quantity: 1,
					},
				];
				computedTotal = unit;
			}

			const response = await createOrder({
				items: itemsPayload,
				totalPrice: computedTotal,
				deliveryAddress,
				paymentMethod,
				orderType:
					params.type === "buy" ? "buy_new"
					: params.type === "swap" ? "swap"
					: params.type,
			});

			const orderId = response?.data?.order?._id || response?.data?.order?.id;
			if (orderId) {
				setLastOrderId(orderId.toString());
				clearCart();
				setSuccessMessage("Order successfully placed");
				setLoading(false);
				setTimeout(() => {
					setSuccessMessage("");
					router.push("/(tabs)/tracking");
				}, 3000);
				return;
			}
		} catch (error) {
			Alert.alert("Order failed", (error as Error).message || "Unable to place the order.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#070b14" }}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={{
							width: 38,
							height: 38,
							borderRadius: 19,
							backgroundColor: "#1a2236",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<ChevronLeft size={18} color="#fff" />
					</TouchableOpacity>
					<Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>
						Order Summary
					</Text>
				</View>
				<View
					style={{ flexDirection: "row", gap: 6, marginHorizontal: 16, marginBottom: 16 }}
				>
					<View
						style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: "#1484FF" }}
					/>
					<View
						style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: "#1484FF" }}
					/>
					<View
						style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: "#1484FF" }}
					/>
				</View>
				<View
					style={{
						marginHorizontal: 16,
						backgroundColor: "#101723",
						borderWidth: 1,
						borderColor: "#1F2A3D",
						borderRadius: 14,
						padding: 16,
						gap: 12,
					}}
				>
					{cartItems.map((item) => (
						<View
							key={item.id}
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<View style={{ flex: 1, paddingRight: 12 }}>
								<Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
									{item.name}
								</Text>
								<Text style={{ color: "#8A93A6", fontSize: 12 }}>
									{item.quantity} x UGX {item.unitPrice.toLocaleString()}
								</Text>
							</View>
							<Text style={{ color: "#fff", fontWeight: "700" }}>
								UGX {(item.unitPrice * item.quantity).toLocaleString()}
							</Text>
						</View>
					))}
					{!cartItems.length && selectedItem ?
						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								paddingTop: 14,
								borderTopWidth: 1,
								borderTopColor: "#1F2A3D",
							}}
						>
							<View style={{ flex: 1, paddingRight: 12 }}>
								<Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
									{selectedItem.name}
								</Text>
								<Text style={{ color: "#8A93A6", fontSize: 12 }}>
									{selectedItem.quantity} x UGX{" "}
									{selectedItem.unitPrice.toLocaleString()}
								</Text>
							</View>
							<Text style={{ color: "#fff", fontWeight: "700" }}>
								UGX{" "}
								{(selectedItem.unitPrice * selectedItem.quantity).toLocaleString()}
							</Text>
						</View>
					:	null}
					<View
						style={{
							borderTopWidth: 1,
							borderTopColor: "#1F2A3D",
							paddingTop: 14,
							flexDirection: "row",
							justifyContent: "space-between",
						}}
					>
						<Text style={{ color: "#8A93A6", fontSize: 13 }}>Delivery address</Text>
						<Text style={{ color: "#fff", fontSize: 12, flex: 1, textAlign: "right" }}>
							{deliveryAddress}
						</Text>
					</View>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							paddingTop: 14,
						}}
					>
						<Text style={{ fontSize: 15, color: "#fff", fontWeight: "600" }}>
							Total
						</Text>
						<Text style={{ fontSize: 15, color: "#1484FF", fontWeight: "700" }}>
							UGX {displayTotal.toLocaleString()}
						</Text>
					</View>
				</View>
				<Text
					style={{
						fontSize: 13,
						color: "#8A93A6",
						marginHorizontal: 16,
						marginTop: 18,
						marginBottom: 10,
					}}
				>
					Pay with
				</Text>
				{successMessage ?
					<View
						style={{
							marginHorizontal: 16,
							marginBottom: 14,
							padding: 12,
							borderRadius: 14,
							backgroundColor: "#14345c",
						}}
					>
						<Text style={{ color: "#8ef0a5", fontWeight: "700" }}>
							{successMessage}
						</Text>
					</View>
				:	null}
				<View style={{ marginHorizontal: 16, gap: 10 }}>
					{PAYMENT_OPTIONS.map((option) => (
						<TouchableOpacity
							key={option.value}
							onPress={() => handlePaymentOption(option.value)}
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								backgroundColor: "#101723",
								borderWidth: 1,
								borderColor: paymentMethod === option.value ? "#1484FF" : "#1F2A3D",
								borderRadius: 14,
								padding: 14,
							}}
						>
							<View style={{ flex: 1 }}>
								<Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
									{option.label}
								</Text>
								<Text style={{ fontSize: 11, color: "#8A93A6" }}>
									{option.subtitle}
								</Text>
							</View>
							{paymentMethod === option.value ?
								<Check size={16} color="#1484FF" />
							:	<ChevronRight size={16} color="#8A93A6" />}
						</TouchableOpacity>
					))}
				</View>
				<View
					style={{ flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 16 }}
				>
					<TouchableOpacity
						onPress={() => router.back()}
						style={{
							flex: 1,
							padding: 14,
							borderRadius: 14,
							borderWidth: 1,
							borderColor: "#1F2A3D",
							alignItems: "center",
						}}
					>
						<Text style={{ color: "#fff", fontWeight: "600" }}>Back</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={handlePlaceOrder}
						disabled={loading}
						style={{
							flex: 1.4,
							padding: 14,
							borderRadius: 14,
							backgroundColor: "#1484FF",
							alignItems: "center",
							opacity: loading ? 0.6 : 1,
						}}
					>
						<Text style={{ color: "#fff", fontWeight: "600" }}>
							{loading ? "Placing Order..." : "Place Order"}
						</Text>
					</TouchableOpacity>
				</View>
				<View style={{ height: 40 }} />
			</ScrollView>
		</SafeAreaView>
	);
}
