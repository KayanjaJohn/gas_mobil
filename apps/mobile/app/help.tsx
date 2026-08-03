import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";

export default function HelpScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TopBar title="Help & Support" showBack />
      <ScrollView style={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📞 Contact Us</Text>
          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL("tel:+256785796333")}>
            <Text style={styles.rowText}>+256 785 796 333</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL("tel:+256776800386")}>
            <Text style={styles.rowText}>0776 800 386</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL("mailto:info@gasmobil.ug")}>
            <Text style={styles.rowText}>info@gasmobil.ug</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>❓ Frequently Asked Questions</Text>
          <Text style={styles.faqQ}>How fast is delivery?</Text>
          <Text style={styles.faqA}>We guarantee 2-hour delivery in Kampala. If we're late, you get 10% off your next refill.</Text>
          <Text style={styles.faqQ}>What sizes do you offer?</Text>
          <Text style={styles.faqA}>6kg, 12kg, and 45kg cylinders — both swap refills and full kit purchases.</Text>
          <Text style={styles.faqQ}>How do I pay?</Text>
          <Text style={styles.faqA}>Gasmobil Wallet, Mobile Money (M-Pesa / Airtel), or Cash on Delivery.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Visit Us</Text>
          <Text style={styles.faqA}>Plot 12, Kampala Road, Kampala, Uganda</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070b14" },
  card: { backgroundColor: "#101723", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#1F2A3D" },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 12 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#131d33" },
  rowText: { color: "#1484FF", fontSize: 14, fontWeight: "600" },
  faqQ: { color: "#fff", fontSize: 14, fontWeight: "600", marginTop: 10 },
  faqA: { color: "#8A93A6", fontSize: 13, marginTop: 4, lineHeight: 20 },
});