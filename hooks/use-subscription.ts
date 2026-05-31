import { useSubscriptionStatusQuery } from "@/lib/queries";

/**
 * Convenience hook — exposes isPremium and subscription details anywhere in the app.
 * Use this to gate premium features instead of calling useSubscriptionStatusQuery directly.
 */
export function useSubscription() {
  const { data, isLoading, refetch } = useSubscriptionStatusQuery();

  return {
    isPremium: data?.isPremium ?? false,
    plan: data?.plan ?? null,
    endDate: data?.endDate ? new Date(data.endDate) : null,
    isLoading,
    refetch,
  };
}
