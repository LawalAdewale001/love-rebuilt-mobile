import { PRIMARY_COLOR } from "@/constants/theme";
import { useSubscription } from "@/hooks/use-subscription";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

type Props = {
  children: React.ReactNode;
  /** Short label shown on the lock card, e.g. "See who liked you" */
  featureName: string;
  /** Extra description below the feature name */
  description?: string;
};

/**
 * Wraps any content. When the user is not premium it overlays a frosted-glass
 * upgrade prompt while keeping the content visible but locked underneath.
 */
export function PremiumGate({ children, featureName, description }: Props) {
  const { isPremium, isLoading } = useSubscription();
  const router = useRouter();

  // Show content normally if premium
  if (isPremium || isLoading) return <>{children}</>;

  return (
    <View style={styles.container}>
      {/* Dimmed preview of the real content */}
      <View style={styles.previewWrapper} pointerEvents="none">
        {children}
      </View>

      {/* Frosted overlay — pure RN, no native module needed */}
      <View style={[StyleSheet.absoluteFill, styles.frostedOverlay]} />

      {/* Upgrade card */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.cardWrapper}>
        <LinearGradient
          colors={["#FFFFFF", "#FFF5F6"]}
          style={styles.card}
        >
          {/* Crown icon */}
          <View style={styles.crownCircle}>
            <Text style={styles.crownEmoji}>👑</Text>
          </View>

          <Text style={styles.premiumLabel}>PREMIUM FEATURE</Text>

          <Text style={styles.featureName}>{featureName}</Text>

          {description && (
            <Text style={styles.description}>{description}</Text>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.upgradeBtn}
            onPress={() => router.push("/subscription" as any)}
          >
            <LinearGradient
              colors={[PRIMARY_COLOR, "#f17d8a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeBtnGradient}
            >
              <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.seePlans}>
            Starting from <Text style={{ color: PRIMARY_COLOR, fontWeight: "700" }}>₦1,500</Text> / week
          </Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  previewWrapper: {
    flex: 1,
    opacity: 0.35,
  },
  frostedOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.82)",
  },
  cardWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#FFE4E7",
  },
  crownCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF0F2",
    borderWidth: 2,
    borderColor: "#FFD6DB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  crownEmoji: {
    fontSize: 28,
  },
  premiumLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: PRIMARY_COLOR,
    marginBottom: 8,
  },
  featureName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  upgradeBtn: {
    width: "100%",
    borderRadius: 100,
    overflow: "hidden",
    marginBottom: 12,
  },
  upgradeBtnGradient: {
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 100,
  },
  upgradeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  seePlans: {
    fontSize: 13,
    color: "#9CA3AF",
  },
});
