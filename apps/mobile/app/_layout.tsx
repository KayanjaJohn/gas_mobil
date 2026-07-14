import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/index";

const ErrorUtils = (global as any).ErrorUtils;
if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === "function") {
  const previousHandler = ErrorUtils.getGlobalHandler?.();
  ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    const detail =
      error && error.stack
        ? error.stack
        : error && error.message
          ? error.message
          : String(error);
    console.error("[GlobalError]" + (isFatal ? " (fatal)" : "") + ":\n" + detail);
    if (previousHandler) previousHandler(error, isFatal);
  });
}

export default function RootLayout() {
  console.log('[App] RootLayout mounted');

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}