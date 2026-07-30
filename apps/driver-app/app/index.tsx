import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { COLORS } from "../src/utils/constants";

/**
 * Root entry point for the app.
 *
 * AuthContext handles all routing logic:
 *  - If not authenticated → redirects to /login
 *  - If authenticated     → redirects to /(tabs)
 *
 * This screen just shows a branded loading spinner while
 * the auth state is being hydrated from AsyncStorage.
 */
export default function Index() {
  const { isLoading } = useAuth();

  console.log('[App] Root index rendered, auth loading:', isLoading);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
});