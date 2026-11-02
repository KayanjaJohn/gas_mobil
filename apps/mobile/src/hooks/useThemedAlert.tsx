import React, { useCallback, useState } from "react";
import {
  Modal, Pressable, StyleSheet, Text, View,
} from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

export type ThemedAlertKind = "success" | "error" | "warning" | "info" | "confirm";
export interface ThemedAlertAction {
  label: string;
  onPress?: () => void;
  tone?: "primary" | "secondary" | "danger";
}
interface AlertConfig {
  title: string;
  message: string;
  kind: ThemedAlertKind;
  actions: ThemedAlertAction[];
}

const PRESENTATION: Record<ThemedAlertKind, { icon: string; color: string; background: string }> = {
  success: { icon: "check-circle", color: "#168447", background: "#E8F5EC" },
  error: { icon: "alert-circle", color: "#C43D35", background: "#FCECE9" },
  warning: { icon: "alert", color: "#B66A14", background: "#FFF1DB" },
  info: { icon: "information", color: "#236A8C", background: "#E8F2F8" },
  confirm: { icon: "help-circle", color: "#F36A21", background: "#FFF0E5" },
};

export function useThemedAlert() {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((
    title: string,
    message: string,
    kind: ThemedAlertKind = "info",
    actions?: ThemedAlertAction[],
  ) => {
    setConfig({
      title,
      message,
      kind,
      actions: actions?.length ? actions : [{ label: "OK", tone: "primary" }],
    });
  }, []);

  const closeAlert = useCallback(() => setConfig(null), []);

  const alertModal = (
    <Modal
      transparent
      visible={!!config}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeAlert}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeAlert} accessibilityLabel="Dismiss message" />
        {config && (
          <View style={styles.card} accessibilityRole="alert">
            <View style={[styles.iconWrap, { backgroundColor: PRESENTATION[config.kind].background }]}>
              <Icon name={PRESENTATION[config.kind].icon as any} size={30} color={PRESENTATION[config.kind].color} />
            </View>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.message}>{config.message}</Text>
            <View style={styles.actions}>
              {config.actions.map((action, index) => {
                const tone = action.tone || (index === config.actions.length - 1 ? "primary" : "secondary");
                return (
                  <Pressable
                    key={action.label}
                    accessibilityRole="button"
                    onPress={() => {
                      setConfig(null);
                      action.onPress?.();
                    }}
                    style={[
                      styles.action,
                      tone === "primary" ? styles.primaryAction : null,
                      tone === "danger" ? styles.dangerAction : null,
                      tone === "secondary" ? styles.secondaryAction : null,
                    ]}
                  >
                    <Text style={[
                      styles.actionText,
                      tone === "primary" || tone === "danger" ? styles.lightActionText : null,
                    ]}>{action.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  return { showAlert, alertModal, closeAlert };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0, 15, 10, .68)",
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  card: {
    width: "100%", maxWidth: 420, borderRadius: 24, padding: 24,
    backgroundColor: "#FFF8EE", borderWidth: 1, borderColor: "#E8DCCB",
    shadowColor: "#000", shadowOpacity: .28, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }, elevation: 18,
  },
  iconWrap: {
    width: 58, height: 58, borderRadius: 19, alignItems: "center",
    justifyContent: "center", alignSelf: "center", marginBottom: 15,
  },
  title: { color: "#0B3D2E", fontSize: 21, fontWeight: "800", textAlign: "center", fontFamily: "sans-serif" },
  message: { color: "#53665C", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 9, fontFamily: "sans-serif" },
  actions: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 23, flexWrap: "wrap" },
  action: { minWidth: 106, minHeight: 46, paddingHorizontal: 17, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  primaryAction: { backgroundColor: "#F36A21" },
  dangerAction: { backgroundColor: "#B9362D" },
  secondaryAction: { backgroundColor: "#EFE8DC", borderWidth: 1, borderColor: "#D9CCB9" },
  actionText: { color: "#0B3D2E", fontSize: 14, fontWeight: "800", fontFamily: "sans-serif" },
  lightActionText: { color: "#FFFFFF" },
});
