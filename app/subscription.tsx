import { showToast } from "@/components/ui/toast";
import { PRIMARY_COLOR } from "@/constants/theme";
import {
  type PlanInfo,
  type SubscriptionPlanId,
  queryKeys,
  useInitializePaymentMutation,
  useSubscriptionPlansQuery,
  useSubscriptionStatusQuery,
} from "@/lib/queries";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const { width } = Dimensions.get("window");

const PLAN_BADGES: Record<SubscriptionPlanId, string | null> = {
  weekly: null,
  monthly: "MOST POPULAR",
  biannual: "BEST VALUE",
  yearly: "SAVE 33%",
};

const PLAN_COLORS: Record<
  SubscriptionPlanId,
  { border: string; bg: string; badge: string; badgeText: string }
> = {
  weekly: {
    border: "#E5E7EB",
    bg: "#FFFFFF",
    badge: "#F3F4F6",
    badgeText: "#374151",
  },
  monthly: {
    border: PRIMARY_COLOR,
    bg: "#FFF5F6",
    badge: PRIMARY_COLOR,
    badgeText: "#FFFFFF",
  },
  biannual: {
    border: "#8B5CF6",
    bg: "#F9F7FF",
    badge: "#8B5CF6",
    badgeText: "#FFFFFF",
  },
  yearly: {
    border: "#059669",
    bg: "#F0FDF9",
    badge: "#059669",
    badgeText: "#FFFFFF",
  },
};

function PlanCard({
  plan,
  index,
  onSubscribe,
  loadingPlan,
}: {
  plan: PlanInfo;
  index: number;
  onSubscribe: (planId: SubscriptionPlanId) => void;
  loadingPlan: SubscriptionPlanId | null;
}) {
  const badge = PLAN_BADGES[plan.id];
  const colors = PLAN_COLORS[plan.id];
  const isLoading = loadingPlan === plan.id;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400).springify()}
    >
      <View
        style={[
          styles.planCard,
          {
            borderColor: plan.isCurrentPlan ? colors.border : colors.border,
            backgroundColor: colors.bg,
            borderWidth: plan.isCurrentPlan ? 2 : 1.5,
          },
        ]}
      >
        {/* Badge row */}
        <View style={styles.planCardTop}>
          {badge ? (
            <View
              style={[styles.badge, { backgroundColor: colors.badge }]}
            >
              <Text style={[styles.badgeText, { color: colors.badgeText }]}>
                {badge}
              </Text>
            </View>
          ) : (
            <View />
          )}

          {plan.isCurrentPlan && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>✓ Current Plan</Text>
            </View>
          )}
        </View>

        {/* Plan name & price */}
        <View style={styles.planPricing}>
          <Text style={styles.planName}>{plan.label}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>₦</Text>
            <Text style={styles.price}>
              {plan.amountNaira.toLocaleString()}
            </Text>
            <Text style={styles.pricePer}>
              {" / "}
              {plan.durationDays === 7
                ? "week"
                : plan.durationDays === 30
                  ? "month"
                  : plan.durationDays === 180
                    ? "6 months"
                    : "year"}
            </Text>
          </View>
          <Text style={styles.planDescription}>{plan.description}</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresList}>
          {plan.features.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View
                style={[
                  styles.featureCheck,
                  { backgroundColor: colors.badge === "#F3F4F6" ? PRIMARY_COLOR : colors.badge },
                ]}
              >
                <Text style={styles.featureCheckText}>✓</Text>
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        {plan.isCurrentPlan ? (
          <View style={[styles.ctaBtn, styles.ctaBtnActive]}>
            <Text style={[styles.ctaBtnText, { color: colors.badge === "#F3F4F6" ? PRIMARY_COLOR : colors.badge }]}>
              Active Plan
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onSubscribe(plan.id)}
            disabled={!!loadingPlan}
          >
            <LinearGradient
              colors={
                plan.id === "biannual"
                  ? ["#8B5CF6", "#A78BFA"]
                  : plan.id === "yearly"
                    ? ["#059669", "#34D399"]
                    : [PRIMARY_COLOR, "#f17d8a"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.ctaBtn, styles.ctaBtnGradient]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.ctaBtnText, { color: "#fff" }]}>
                  Get {plan.label}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Always fetch fresh plans and status when this screen opens
  useFocusEffect(
    useCallback(() => {
      queryClient.refetchQueries({ queryKey: queryKeys.subscriptionPlans() });
      queryClient.refetchQueries({ queryKey: queryKeys.subscriptionStatus() });
    }, [queryClient]),
  );

  const { data: plans = [], isLoading: plansLoading } =
    useSubscriptionPlansQuery();
  const { data: status } = useSubscriptionStatusQuery();

  const initPayment = useInitializePaymentMutation();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlanId | null>(null);

  const handleSubscribe = async (planId: SubscriptionPlanId) => {
    setLoadingPlan(planId);
    try {
      const result = await initPayment.mutateAsync(planId);
      await WebBrowser.openBrowserAsync(result.authorizationUrl);
    } catch (err: any) {
      showToast("error", "Error", err?.message ?? "Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[PRIMARY_COLOR, "#f17d8a", "#FFFFFF"]}
        locations={[0, 0.55, 1]}
        style={styles.headerGradient}
      >
        <Animated.View entering={FadeInUp.duration(400)}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Crown badge */}
          <View style={styles.crownBadge}>
            <Text style={styles.crownBadgeText}>✦ PREMIUM</Text>
          </View>

          <Text style={styles.heroTitle}>
            Unlock your full{"\n"}dating potential
          </Text>
          <Text style={styles.heroSubtitle}>
            See who likes you, go incognito, and get{"\n"}unlimited likes every single day.
          </Text>

          {status?.isPremium && (() => {
            const isCancelled = status.subscriptionStatus === "non_renewing";
            const accessDate = status.nextPaymentDate ?? status.endDate;
            const dateStr = accessDate
              ? new Date(accessDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : null;
            const noticeText = isCancelled
              ? `⏳ Cancelled · access until ${dateStr ?? "next billing date"}`
              : `✓ Premium active${dateStr ? ` · renews ${dateStr}` : ""}`;
            return (
              <View style={styles.activeNoticeRow}>
                <View style={[styles.activeNotice, isCancelled && styles.activeNoticeCancelled]}>
                  <Text style={styles.activeNoticeText}>{noticeText}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/billing" as any)}
                  style={styles.manageBillingBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.manageBillingText}>
                    {isCancelled ? "View billing details →" : "Manage billing →"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </Animated.View>
      </LinearGradient>


      {/* Plans list */}
      {plansLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={PRIMARY_COLOR} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.chooseLabel}>Choose your plan</Text>

          {plans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={i}
              onSubscribe={handleSubscribe}
              loadingPlan={loadingPlan}
            />
          ))}

          <Text style={styles.disclaimer}>
            Card payment only · Recurring billing via Paystack.{"\n"}
            Cancel anytime from your billing settings.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerGradient: {
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  crownBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },
  crownBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 22,
  },
  activeNoticeRow: {
    marginTop: 16,
    gap: 8,
  },
  activeNotice: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  activeNoticeCancelled: {
    backgroundColor: "rgba(253,230,138,0.35)",
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.6)",
  },
  activeNoticeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  manageBillingBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  manageBillingText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  chooseLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 16,
    marginLeft: 4,
  },
  // ── Plan card ──
  planCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  planCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 24,
  },
  badge: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  currentBadge: {
    backgroundColor: "#ECFDF5",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  planPricing: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  currency: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 3,
  },
  price: {
    fontSize: 36,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -1,
    lineHeight: 40,
  },
  pricePer: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 4,
    marginLeft: 2,
  },
  planDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
  featuresList: {
    marginBottom: 20,
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCheckText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  featureText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  ctaBtn: {
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaBtnGradient: {
    paddingVertical: 14,
    borderRadius: 100,
  },
  ctaBtnActive: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  disclaimer: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 16,
  },
});
