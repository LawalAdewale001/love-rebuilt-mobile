import { showToast } from "@/components/ui/toast";
import { PRIMARY_COLOR } from "@/constants/theme";
import {
  type SubscriptionPlanId,
  useBillingOverviewQuery,
  useCancelSubscriptionMutation,
  useSyncSubscriptionMutation,
} from "@/lib/queries";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { apiClient } from "@/lib/api-client";

const PLAN_LABELS: Record<SubscriptionPlanId, string> = {
  weekly: "Weekly Premium",
  monthly: "Monthly Premium",
  biannual: "6-Month Premium",
  yearly: "Yearly Premium",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  active: { label: "Active", color: "#059669", bg: "#ECFDF5" },
  non_renewing: {
    label: "Cancels at period end",
    color: "#D97706",
    bg: "#FFFBEB",
  },
  attention: { label: "Payment issue", color: "#DC2626", bg: "#FEF2F2" },
  pending: { label: "Pending", color: "#6B7280", bg: "#F3F4F6" },
  expired: { label: "Expired", color: "#6B7280", bg: "#F3F4F6" },
  cancelled: { label: "Cancelled", color: "#6B7280", bg: "#F3F4F6" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BillingScreen() {
  const router = useRouter();
  const { data: billing, isLoading, refetch } = useBillingOverviewQuery();
  const cancelMutation = useCancelSubscriptionMutation();
  const syncMutation = useSyncSubscriptionMutation();
  const [manageLoading, setManageLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Sync from Paystack every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      syncMutation.mutate();
      refetch();
    }, []),
  );

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncMutation.mutateAsync();
      await refetch();
    } catch {
      /* silent — sync is best-effort */
    } finally {
      setSyncing(false);
    }
  };

  const handleManageCard = async () => {
    setManageLoading(true);
    try {
      const result = await apiClient.get<{ url: string }>(
        "/api/subscription/manage-link",
      );
      const url = (result as any)?.url ?? (result as any)?.data?.result?.url;
      if (url) {
        await WebBrowser.openBrowserAsync(url);
        // Pull live status from Paystack immediately after returning — no webhook delay
        await handleSync();
      }
    } catch (err: any) {
      showToast("error", "Error", err?.message ?? "Unable to open management page.");
    } finally {
      setManageLoading(false);
    }
  };

  const handleCancel = () => {
    const sub = billing?.subscription;
    const accessDate = sub?.nextPaymentDate ?? sub?.endDate;
    const dateStr = accessDate
      ? new Date(accessDate).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

    const confirmMessage =
      billing?.cancellationInfo ??
      `You'll keep full premium access${dateStr ? ` until ${dateStr}` : " until the next billing date"}. No further charges will be made.`;

    Alert.alert("Cancel subscription?", confirmMessage, [
      { text: "Keep subscription", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          try {
            const result = await cancelMutation.mutateAsync();
            const message =
              (result as any)?.message ?? "Subscription cancelled.";
            showToast("success", "Cancelled", message);
            await handleSync();
          } catch (err: any) {
            // If Paystack codes aren't stored yet, fall back to the hosted manage page
            const isNotReady =
              err?.message?.toLowerCase().includes("not available") ||
              err?.message?.toLowerCase().includes("try again shortly");

            if (isNotReady) {
              Alert.alert(
                "Cancel via Paystack",
                "Please cancel directly on the Paystack subscription page. Tap 'Open' below.",
                [
                  { text: "Not now", style: "cancel" },
                  {
                    text: "Open Paystack",
                    onPress: handleManageCard,
                  },
                ],
              );
            } else {
              showToast(
                "error",
                "Could not cancel",
                err?.message ?? "Please try again.",
              );
            }
          }
        },
      },
    ]);
  };

  const sub = billing?.subscription;
  const statusConfig = sub?.subscriptionStatus
    ? STATUS_CONFIG[sub.subscriptionStatus]
    : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billing & Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={PRIMARY_COLOR} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={syncing}
              onRefresh={handleSync}
              tintColor={PRIMARY_COLOR}
              colors={[PRIMARY_COLOR]}
            />
          }
        >
          {/* ── Current plan card ── */}
          {sub?.isPremium ? (
            <Animated.View
              entering={FadeInDown.delay(0).duration(400).springify()}
              style={styles.planCard}
            >
              <View style={styles.planCardRow}>
                <View style={styles.crownCircle}>
                  <Text style={styles.crownEmoji}>👑</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.planName}>
                    {sub.plan ? PLAN_LABELS[sub.plan] : "Premium"}
                  </Text>
                  {statusConfig && (
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusConfig.bg },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: statusConfig.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusLabel,
                          { color: statusConfig.color },
                        ]}
                      >
                        {statusConfig.label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Next charge / access-until row */}
              {sub.nextPaymentDate &&
                sub.subscriptionStatus === "active" && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color="#6B7280"
                    />
                    <Text style={styles.infoText}>
                      Next charge:{" "}
                      <Text style={styles.infoTextBold}>
                        {formatDate(sub.nextPaymentDate)}
                      </Text>
                    </Text>
                  </View>
                )}

              {sub.nextPaymentDate &&
                sub.subscriptionStatus === "non_renewing" && (
                  <View style={[styles.alertBox, { backgroundColor: "#FFFBEB" }]}>
                    <Ionicons name="time-outline" size={16} color="#D97706" />
                    <Text style={[styles.alertText, { color: "#92400E" }]}>
                      You keep premium access until{" "}
                      <Text style={{ fontWeight: "700" }}>
                        {formatDate(sub.nextPaymentDate)}
                      </Text>
                      . No further charges.
                    </Text>
                  </View>
                )}

              {sub.subscriptionStatus === "attention" && (
                <View style={[styles.alertBox, { backgroundColor: "#FEF2F2" }]}>
                  <Ionicons name="warning-outline" size={16} color="#DC2626" />
                  <Text style={[styles.alertText, { color: "#991B1B" }]}>
                    There was a problem with your last payment. Update your card
                    below to keep your subscription.
                  </Text>
                </View>
              )}

              {sub.startDate && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={15}
                    color="#6B7280"
                  />
                  <Text style={styles.infoText}>
                    Member since: {formatDate(sub.startDate)}
                  </Text>
                </View>
              )}
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInDown.delay(0).duration(400).springify()}
              style={styles.freePlanCard}
            >
              <Text style={styles.freePlanTitle}>Free Plan</Text>
              <Text style={styles.freePlanSub}>
                Upgrade to unlock all premium features
              </Text>
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => router.push("/subscription")}
                activeOpacity={0.85}
              >
                <Text style={styles.upgradeBtnText}>
                  View Premium Plans →
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Manage actions — show for any active or attention subscriber ── */}
          {sub?.isPremium && (
            <Animated.View
              entering={FadeInDown.delay(80).duration(400).springify()}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>Manage subscription</Text>

              {/* Update card — shown when Paystack manage link is available */}
              {billing?.canManage && (
                <TouchableOpacity
                  style={styles.actionRow}
                  activeOpacity={0.7}
                  onPress={handleManageCard}
                  disabled={manageLoading}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: "#EFF6FF" }]}
                  >
                    {manageLoading ? (
                      <ActivityIndicator color="#3B82F6" size="small" />
                    ) : (
                      <Ionicons name="card-outline" size={20} color="#3B82F6" />
                    )}
                  </View>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>Update payment card</Text>
                    <Text style={styles.actionSub}>
                      Change the card used for future charges
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              )}

              {/* Cancel — shown whenever not already cancelled/expired */}
              {sub.subscriptionStatus !== "non_renewing" &&
                sub.subscriptionStatus !== "cancelled" &&
                sub.subscriptionStatus !== "expired" && (
                  <TouchableOpacity
                    style={[
                      styles.actionRow,
                      billing?.canManage && styles.actionRowDivider,
                    ]}
                    activeOpacity={0.7}
                    onPress={handleCancel}
                    disabled={cancelMutation.isPending}
                  >
                    <View
                      style={[styles.actionIcon, { backgroundColor: "#FEF2F2" }]}
                    >
                      {cancelMutation.isPending ? (
                        <ActivityIndicator color="#DC2626" size="small" />
                      ) : (
                        <Ionicons
                          name="close-circle-outline"
                          size={20}
                          color="#DC2626"
                        />
                      )}
                    </View>
                    <View style={styles.actionInfo}>
                      <Text style={[styles.actionTitle, { color: "#DC2626" }]}>
                        Cancel subscription
                      </Text>
                      <Text style={styles.actionSub}>
                        {sub.nextPaymentDate
                          ? `Access continues until ${formatShortDate(sub.nextPaymentDate)}`
                          : "You keep access until the next billing date"}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#D1D5DB"
                    />
                  </TouchableOpacity>
                )}
            </Animated.View>
          )}

          {/* ── Payment history ── */}
          {billing?.recentTransactions &&
            billing.recentTransactions.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(160).duration(400).springify()}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>Recent payments</Text>

                {billing.recentTransactions.map((txn, index) => {
                  const isSuccess = txn.status === "success";
                  const isFailed = txn.status === "failed";
                  return (
                    <View
                      key={txn.id}
                      style={[
                        styles.txnRow,
                        index < billing.recentTransactions.length - 1 &&
                          styles.txnRowDivider,
                      ]}
                    >
                      <View
                        style={[
                          styles.txnIcon,
                          {
                            backgroundColor: isSuccess
                              ? "#ECFDF5"
                              : isFailed
                                ? "#FEF2F2"
                                : "#F3F4F6",
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            isSuccess
                              ? "checkmark"
                              : isFailed
                                ? "close"
                                : "time-outline"
                          }
                          size={14}
                          color={
                            isSuccess
                              ? "#059669"
                              : isFailed
                                ? "#DC2626"
                                : "#6B7280"
                          }
                        />
                      </View>
                      <View style={styles.txnInfo}>
                        <Text style={styles.txnPlan}>
                          {PLAN_LABELS[txn.plan] ?? txn.plan}
                        </Text>
                        <Text style={styles.txnDate}>
                          {formatShortDate(txn.createdAt)}
                        </Text>
                      </View>
                      <View style={styles.txnRight}>
                        <Text style={styles.txnAmount}>
                          ₦{txn.amountNaira.toLocaleString()}
                        </Text>
                        <Text
                          style={[
                            styles.txnStatus,
                            {
                              color: isSuccess
                                ? "#059669"
                                : isFailed
                                  ? "#DC2626"
                                  : "#6B7280",
                            },
                          ]}
                        >
                          {txn.status.charAt(0).toUpperCase() +
                            txn.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </Animated.View>
            )}

          {/* ── Security note ── */}
          <Animated.View
            entering={FadeInDown.delay(240).duration(400).springify()}
            style={styles.securityNote}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color="#9CA3AF"
            />
            <Text style={styles.securityText}>
              Payments are processed securely by Paystack. Your card details are
              stored by Paystack and never on our servers.
            </Text>
          </Animated.View>

          <View style={{ height: 40 }} />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
  },

  // ── Current plan card
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 12,
  },
  planCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  crownCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF0F2",
    borderWidth: 1.5,
    borderColor: "#FFD6DB",
    alignItems: "center",
    justifyContent: "center",
  },
  crownEmoji: {
    fontSize: 24,
  },
  planName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
  },
  infoTextBold: {
    fontWeight: "700",
    color: "#374151",
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    padding: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Free plan
  freePlanCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  freePlanTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  freePlanSub: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  upgradeBtn: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  upgradeBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // ── Sections
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },

  // ── Actions
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  actionRowDivider: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 18,
  },

  // ── Transactions
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  txnRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  txnInfo: {
    flex: 1,
  },
  txnPlan: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  txnDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  txnRight: {
    alignItems: "flex-end",
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  txnStatus: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Security
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
  },
});
