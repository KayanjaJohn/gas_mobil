import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, MapPin } from "lucide-react-native";
import * as Location from "expo-location";
import { useCart } from "../../context/CartContext";

export default function OrderLocationScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { cartItems, deliveryAddress, setDeliveryAddress } = useCart();
	const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
	const [locationStatus, setLocationStatus] = useState("Locating...");

	useEffect(() => {
		let subscription: Location.LocationSubscription | null = null;

		const requestLocation = async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				setLocationStatus("Location permission denied");
				return;
			}

			const position = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Highest,
			});
			setCurrentLocation(position);
			setLocationStatus("Live location active");

			subscription = await Location.watchPositionAsync(
				{ accuracy: Location.Accuracy.Highest, distanceInterval: 5 },
				(pos) => setCurrentLocation(pos),
			);
		};

		requestLocation().catch(() => {
			setLocationStatus("Unable to access location");
		});

		return () => {
			subscription?.remove();
		};
	}, []);

	const handleContinue = () => {
		// Allow proceeding when order type is provided via params even if cart is empty
		if (!cartItems.length && !params.type) {
			Alert.alert("Cart is empty", "Add items to the cart before placing an order.");
			return;
		}
		if (!deliveryAddress.trim()) {
			Alert.alert("Delivery address required", "Please enter your delivery address.");
			return;
		}
		router.push(`/order/summary?type=${params.type || ""}&size=${params.size || ""}`);
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
						Order Gas
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
						style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: "#1E2A44" }}
					/>
				</View>
				<Text
					style={{ fontSize: 15, color: "#fff", marginHorizontal: 16, marginBottom: 4 }}
				>
					Delivery location
				</Text>
				<Text
					style={{
						fontSize: 12,
						color: "#8A93A6",
						marginHorizontal: 16,
						marginBottom: 12,
					}}
				>
					Drop a pin to mark your delivery spot
				</Text>
				<View
					style={{
						height: 200,
						borderRadius: 14,
						backgroundColor: "#0a1530",
						borderWidth: 1,
						borderColor: "#1F2A3D",
						marginHorizontal: 16,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<MapPin size={32} color="#1484FF" />
					<Text style={{ color: "#fff", fontSize: 14, marginTop: 12, fontWeight: "600" }}>
						{currentLocation ? "Live location active" : locationStatus}
					</Text>
					{currentLocation ?
						<Text
							style={{
								color: "#8A93A6",
								fontSize: 12,
								marginTop: 8,
								textAlign: "center",
							}}
						>
							Lat {currentLocation.coords.latitude.toFixed(5)} · Lon{" "}
							{currentLocation.coords.longitude.toFixed(5)}
						</Text>
					:	null}
				</View>
				<Text
					style={{
						fontSize: 15,
						color: "#fff",
						marginHorizontal: 16,
						marginTop: 18,
						marginBottom: 4,
					}}
				>
					Delivery address
				</Text>
				<TextInput
					style={{
						marginHorizontal: 16,
						backgroundColor: "#101723",
						borderWidth: 1,
						borderColor: "#1F2A3D",
						borderRadius: 14,
						padding: 14,
						color: "#fff",
						fontSize: 14,
						minHeight: 84,
						textAlignVertical: "top",
					}}
					placeholder="Enter your address..."
					placeholderTextColor="#8A93A6"
					multiline
					value={deliveryAddress}
					onChangeText={setDeliveryAddress}
				/>
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
						onPress={handleContinue}
						style={{
							flex: 1.4,
							padding: 14,
							borderRadius: 14,
							backgroundColor: "#1484FF",
							alignItems: "center",
						}}
					>
						<Text style={{ color: "#fff", fontWeight: "600" }}>Continue</Text>
					</TouchableOpacity>
				</View>
				<View style={{ height: 40 }} />
			</ScrollView>
		</SafeAreaView>
	);
}
