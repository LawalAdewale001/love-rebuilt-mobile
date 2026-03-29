import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ToastType = "error" | "success" | "info";

type ToastMessage = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  error: { bg: "#FFF0F0", border: "#E86673", icon: "\u2716" },
  success: { bg: "#F0FFF4", border: "#38A169", icon: "\u2714" },
  info: { bg: "#EBF8FF", border: "#3182CE", icon: "\u2139" },
};

let toastId = 0;
let addToastFn: ((toast: Omit<ToastMessage, "id">) => void) | null = null;

/** Show a toast from anywhere (call after ToastProvider is mounted). */
export function showToast(type: ToastType, title: string, message: string) {
  addToastFn?.({ type, title, message });
}

// ─── Individual toast item with slide + fade animation
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const colors = TOAST_COLORS[toast.type];

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 4s
    const timer = setTimeout(() => dismiss(), 4000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(toast.id));
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.bg,
          borderLeftColor: colors.border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: colors.border }]}>
          <Text style={styles.iconText}>{colors.icon}</Text>
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{toast.title}</Text>
        <Text style={styles.message}>{toast.message}</Text>
      </View>
      <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
        <Text style={styles.closeText}>{"\u2715"}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Toast provider — render once in root layout
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastFn = (toast) => {
      setToasts((prev) => [...prev, { ...toast, id: ++toastId }]);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    width: SCREEN_WIDTH - 32,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: "#555555",
    lineHeight: 18,
  },
  closeButton: {
    padding: 6,
    marginLeft: 8,
  },
  closeText: {
    fontSize: 16,
    color: "#999999",
    fontWeight: "600",
  },
});
