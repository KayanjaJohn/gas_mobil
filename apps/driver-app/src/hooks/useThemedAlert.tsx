import React, { useCallback, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

type Kind = "success" | "error" | "warning" | "info" | "confirm";
type Action = { label: string; onPress?: () => void; tone?: "primary" | "secondary" | "danger" };
type Config = { title: string; message: string; kind: Kind; actions: Action[] };

const ICONS: Record<Kind, { name: string; color: string; background: string }> = {
  success: { name: "check-circle", color: "#168447", background: "#E8F5EC" },
  error: { name: "alert-circle", color: "#C43D35", background: "#FCECE9" },
  warning: { name: "alert", color: "#B66A14", background: "#FFF1DB" },
  info: { name: "information", color: "#236A8C", background: "#E8F2F8" },
  confirm: { name: "help-circle", color: "#F36A21", background: "#FFF0E5" },
};

export function useThemedAlert() {
  const [config, setConfig] = useState<Config | null>(null);
  const closeAlert = useCallback(() => setConfig(null), []);
  const showAlert = useCallback((title: string, message: string, kind: Kind = "info", actions?: Action[]) => {
    setConfig({ title, message, kind, actions: actions?.length ? actions : [{ label: "OK", tone: "primary" }] });
  }, []);

  const alertModal = (
    <Modal transparent visible={!!config} animationType="fade" statusBarTranslucent onRequestClose={closeAlert}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeAlert} accessibilityLabel="Dismiss message" />
        {config && <View style={styles.card} accessibilityRole="alert">
          <View style={[styles.iconWrap, { backgroundColor: ICONS[config.kind].background }]}>
            <Icon name={ICONS[config.kind].name as any} size={30} color={ICONS[config.kind].color} />
          </View>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>
          <View style={styles.actions}>
            {config.actions.map((action, index) => {
              const tone = action.tone || (index === config.actions.length - 1 ? "primary" : "secondary");
              return <Pressable key={action.label} accessibilityRole="button"
                onPress={() => { setConfig(null); action.onPress?.(); }}
                style={[styles.action, tone === "primary" ? styles.primary : null, tone === "danger" ? styles.danger : null, tone === "secondary" ? styles.secondary : null]}>
                <Text style={[styles.actionText, tone !== "secondary" ? styles.lightText : null]}>{action.label}</Text>
              </Pressable>;
            })}
          </View>
        </View>}
      </View>
    </Modal>
  );
  return { showAlert, alertModal, closeAlert };
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,15,10,.68)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 420, borderRadius: 24, padding: 24, backgroundColor: "#FFF8EE", borderWidth: 1, borderColor: "#E8DCCB", shadowColor: "#000", shadowOpacity: .28, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 18 },
  iconWrap: { width: 58, height: 58, borderRadius: 19, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 15 },
  title: { color: "#0B3D2E", fontSize: 21, fontWeight: "800", textAlign: "center", fontFamily: "sans-serif" },
  message: { color: "#53665C", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 9, fontFamily: "sans-serif" },
  actions: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 23, flexWrap: "wrap" },
  action: { minWidth: 106, minHeight: 46, paddingHorizontal: 17, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: "#138A43" }, danger: { backgroundColor: "#B9362D" }, secondary: { backgroundColor: "#EFE8DC", borderWidth: 1, borderColor: "#D9CCB9" },
  actionText: { color: "#0B3D2E", fontSize: 14, fontWeight: "800", fontFamily: "sans-serif" }, lightText: { color: "#FFFFFF" },
});
