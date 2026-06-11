import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type PaymentMethod = "mtn" | "airtel" | "visa" | "wallet" | "cash";

export type CartItem = {
	id: string;
	name: string;
	type: "accessory" | "cylinder";
	unitPrice: number;
	quantity: number;
};

interface CartContextProps {
	cartItems: CartItem[];
	addToCart: (item: CartItem) => void;
	removeFromCart: (itemId: string) => void;
	updateQuantity: (itemId: string, quantity: number) => void;
	clearCart: () => void;
	totalPrice: number;
	deliveryAddress: string;
	setDeliveryAddress: (address: string) => void;
	paymentMethod: PaymentMethod;
	setPaymentMethod: (method: PaymentMethod) => void;
	lastOrderId: string | null;
	setLastOrderId: (id: string | null) => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export  function CartProvider({ children }: { children: ReactNode }) {
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [deliveryAddress, setDeliveryAddress] = useState("");
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mtn");
	const [lastOrderId, setLastOrderId] = useState<string | null>(null);

	const addToCart = (item: CartItem) => {
		setCartItems((current) => {
			const existing = current.find((cartItem) => cartItem.id === item.id);
			if (existing) {
				return current.map((cartItem) =>
					cartItem.id === item.id ?
						{ ...cartItem, quantity: cartItem.quantity + item.quantity }
					:	cartItem,
				);
			}

			return [...current, item];
		});
	};

	const removeFromCart = (itemId: string) => {
		setCartItems((current) => current.filter((item) => item.id !== itemId));
	};

	const updateQuantity = (itemId: string, quantity: number) => {
		setCartItems((current) =>
			current
				.map((item) =>
					item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item,
				)
				.filter((item) => item.quantity > 0),
		);
	};

	const clearCart = () => {
		setCartItems([]);
	};

	const totalPrice = useMemo(
		() => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
		[cartItems],
	);

	return React.createElement(
		CartContext.Provider,
		{
			value: {
				cartItems,
				addToCart,
				removeFromCart,
				updateQuantity,
				clearCart,
				totalPrice,
				deliveryAddress,
				setDeliveryAddress,
				paymentMethod,
				setPaymentMethod,
				lastOrderId,
				setLastOrderId,
			},
		},
		children,
	);
}

export function useCart() {
	const context = useContext(CartContext);
	if (!context) {
		throw new Error("useCart must be used within CartProvider");
	}
	return context;
}
