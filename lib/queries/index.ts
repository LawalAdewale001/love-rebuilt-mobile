/**
 * React Query hooks tied to the API client.
 * Add your query keys and hooks here for a single source of truth.
 */

import { apiClient } from "@/lib/api-client";
import { type AuthUser, setAuth } from "@/lib/auth-store";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

// ─── Query keys (use for invalidations and consistency)
export const queryKeys = {
  all: ["api"] as const,
  auth: () => [...queryKeys.all, "auth"] as const,
  profile: () => [...queryKeys.all, "profile"] as const,
  chats: () => [...queryKeys.all, "chats"] as const,
  chatSearch: (query: string) =>
    [...queryKeys.all, "chatSearch", query] as const,
  messages: (conversationId: string) =>
    [...queryKeys.all, "messages", conversationId] as const,
  blockedUsers: () => [...queryKeys.all, "blockedUsers"] as const,
  callToken: (channelName: string, uid?: string) =>
    [...queryKeys.all, "callToken", channelName, uid ?? null] as const,

  userSearch: (query: string) =>
    [...queryKeys.all, "userSearch", query] as const,
  userProfileById: (id: string) =>
    [...queryKeys.all, "userProfileById", id] as const,
  discoveryGeneral: () => [...queryKeys.all, "discoveryGeneral"] as const,
  discoveryMatches: () => [...queryKeys.all, "discoveryMatches"] as const,
};

// ─── Auth types
type LoginRequest = {
  email: string;
  password: string;
  devicePushToken?: string;
};

type LoginResponse = {
  user: AuthUser;
  accessToken: string;
};

// ─── Login mutation
export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginRequest) =>
      apiClient.post<LoginResponse>("/api/auth/login", data),
    onSuccess: async (response) => {
      await setAuth(response.accessToken, response.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

// ─── Social Login mutation
export type SocialLoginRequest = {
  provider: "google" | "apple";
  token: string; // The identity token (JWT) returned from Google/Apple
  devicePushToken?: string;
};

export function useSocialLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SocialLoginRequest) =>
      // Adjust this URL to exactly match your Swagger doc (e.g., "/api/auth/google" or "/api/auth/social")
      apiClient.post<LoginResponse>("/api/auth/social-login", data),
    onSuccess: async (response) => {
      await setAuth(response.accessToken, response.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

// ─── User profile
export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  provider: string;
  socialId: string | null;
  isVerified: boolean;
  location: string;
  latitude: string;
  longitude: string;
  dob: string;
  gender: string;
  identity: string;
  religion: string;
  tribe: string;
  relationshipGoal: string;
  hasChildren: boolean;
  childrenCount: number;
  childrenStay: string;
  childrenAgeRangeInYears: string;
  avatar: string | null;
  pictures: string[];
  interests: string[];
};

export function useProfileQuery() {
  return useQuery({
    queryKey: ["profile"], // or queryKeys.profile()
    queryFn: async () => {
      // Fetch as 'any' to bypass strict generic typing temporarily
      const response = await apiClient.get<any>("/api/user/profile");

      return response?.data?.result || response?.result || response;
    },
  });
}

export function useUserProfileByIdQuery(id: string) {
  return useQuery({
    queryKey: [...queryKeys.profile(), id], // Unique key per user ID
    queryFn: () => apiClient.get<UserProfile>(`/api/user/${id}`),
    enabled: !!id, // Only fetch if an ID is provided
  });
}

/* lib/queries/index.ts */

export function useUserSearchQuery(query: string) {
  return useQuery({
    queryKey: [...queryKeys.all, "userSearch", query],
    queryFn: async () => {
      // FIX: The backend explicitly expects the parameter key to be 'q' as per swagger docs
      const response = await apiClient.get<any>("/api/user/search", {
        params: { q: query },
      });

      // Keep the safe extraction: your interceptor returns { result, pagination }
      return response?.data?.result || response?.result || [];
    },
    enabled: query.trim().length > 0,
  });
}

// ─── Chat types
export type ChatMember = {
  userId: string;
  name: string;
  avatar: string | null;
  isAdmin: boolean;
  isOnline: boolean;
  lastSeen: string | null;
  joinedAt: string;
  lastReadAt?: string;
  isBlocked: boolean;
  isLiked: boolean;
};

export type ChatConversation = {
  id: string;
  type: "direct" | "group";
  name: string;
  description: string;
  image: string | null;
  adminId: string | null;
  lastMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  showChatProgressBanner: boolean;
  lastMessage: {
    id: string;
    content: string;
    type: string;
    senderId: string;
    createdAt: string;
    isDeleted?: boolean;
  } | null;
  members: ChatMember[];
  totalMembers: number;
  isMember: boolean;
  isBlocked: boolean;
  blockedMe: boolean;
  unreadCount?: number;
};

type ChatListResponse = {
  result: ChatConversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

// Note: the response interceptor unwraps { meta, data } → data,
// but chat list returns { result, pagination } inside data, so we get that directly.

export function useChatListQuery() {
  return useInfiniteQuery({
    queryKey: queryKeys.chats(),
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<ChatListResponse>("/api/chat/list", {
        params: { page: String(pageParam), limit: "20" },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
  });
}

// ─── Chat search
type ChatSearchResult = {
  chats: ChatConversation[];
  messages: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: string;
    sender: Record<string, unknown>;
    createdAt: string;
  }[];
};

export function useChatSearchQuery(query: string) {
  return useQuery({
    queryKey: queryKeys.chatSearch(query),
    queryFn: () =>
      apiClient.get<ChatSearchResult>("/api/chat/search", {
        params: { query },
      }),
    enabled: query.trim().length > 0,
  });
}

// ─── Chat messages
export type MessageSender = {
  id: string;
  fullName: string;
  avatar: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  content: string;
  mediaUrl: string | null;
  transcription: string | null;
  replyToId: string | null;
  isRead: boolean;
  isDeleted: boolean;
  isEdited: boolean;
  meetupId: string | null;
  createdAt: string;
  updatedAt: string;
  sender: MessageSender;
  replyTo: {
    id: string;
    content: string;
    type: string;
    senderId: string;
    sender: MessageSender;
  } | null;
  meetup: {
    id: string;
    title: string;
    location: string;
    date: string;
    time: string;
    status: string;
  } | null;
};

type MessagesResponse = {
  result: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export function useMessagesQuery(conversationId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<MessagesResponse>(`/api/chat/messages/${conversationId}`, {
        params: { page: String(pageParam), limit: "30", order: "newest" },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: !!conversationId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useConversationQuery(conversationId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [...queryKeys.chats(), conversationId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ChatConversation>(
          `/api/chat/${conversationId}`,
        );
        // If meta/data structure is present, interceptors should have unwrapped it,
        // but if it returned raw data, we take it.
        return response;
      } catch (err) {
        // Fallback: try to find the conversation in the chatted-list cache
        const chatsCache = queryClient.getQueryData<any>(queryKeys.chats());
        if (chatsCache?.pages) {
          for (const page of chatsCache.pages) {
            const found = page.result?.find(
              (c: ChatConversation) => c.id === conversationId,
            );
            if (found) return found;
          }
        }
        throw err;
      }
    },
    enabled: !!conversationId && conversationId !== "0",
  });
}

// ─── Discovery interaction (like/dislike)
export function useInteractionMutation() {
  return useMutation({
    mutationFn: (data: { receiverId: string; type: "LIKE" | "DISLIKE" }) =>
      apiClient.post("/api/discovery/interaction", data),
  });
}

// ─── Block / Unblock / Report
export function useBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) =>
      apiClient.post("/api/chat/block", { blockedId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    },
  });
}

export function useCreateDirectChatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (receiverId: string) =>
      apiClient.post<ChatConversation>("/api/chat/direct", { receiverId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    },
  });
}

export function useUnblockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete(`/api/chat/unblock/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    },
  });
}

export function useReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      targetId: string;
      targetType: "user" | "group";
      reason: string;
    }) => apiClient.post("/api/chat/report", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    },
  });
}

export function useJoinGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      apiClient.post(`/api/chat/groups/${groupId}/join`),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.chats(), groupId],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(groupId) });
    },
  });
}

export function useLeaveGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      apiClient.delete(`/api/chat/groups/${groupId}/leave`),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.chats(), groupId],
      });
    },
  });
}

export type CreateMeetupRequest = {
  conversationId: string;
  title: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
};

export function useCreateMeetupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMeetupRequest) =>
      apiClient.post("/api/chat/meetups", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(variables.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    },
  });
}

export function useChatProgressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      conversationId: string;
      reason: string;
      showChatProgressBanner: boolean;
    }) =>
      apiClient.post(`/api/chat/${data.conversationId}/progress`, {
        reason: data.reason,
        showChatProgressBanner: data.showChatProgressBanner,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.chats(), variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    },
  });
}

export type CallTokenResponse = {
  token: string;
  channelName: string;
  uid: string;
};

export function useCallTokenQuery(channelName: string, uid?: string) {
  const params: Record<string, string> = { channelName };
  if (uid) params.uid = uid;

  return useQuery({
    queryKey: queryKeys.callToken(channelName, uid),
    queryFn: () =>
      apiClient.get<CallTokenResponse>("/api/call/token", {
        params,
      }),
    enabled: !!channelName,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  });
}

// --- Auth: Register ---
type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
};

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      apiClient.post("/api/auth/register", data),
  });
}

// --- Auth: Verify Email ---
type VerifyEmailRequest = {
  email: string;
  code: string;
};

export function useVerifyEmailMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) =>
      // Assuming verify returns the same response as login (user + token) so we can log them in immediately
      apiClient.post<{ user: AuthUser; accessToken: string }>(
        "/api/auth/verify",
        data,
      ),
    onSuccess: async (response) => {
      if (response.accessToken) {
        await setAuth(response.accessToken, response.user);
        queryClient.invalidateQueries({ queryKey: queryKeys.all });
      }
    },
  });
}

// --- Auth: Resend Code ---
export function useResendCodeMutation() {
  return useMutation({
    mutationFn: (data: { email: string }) =>
      apiClient.post("/api/auth/resend", data),
  });
}

// --- User: Update Profile (Used for Onboarding Steps) ---
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) =>
      apiClient.patch("/api/user/update", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
    },
  });
}

// --- Discovery Endpoints ---
export function useDiscoveryGeneralQuery(
  filter: "forYou" | "nearby" = "forYou",
) {
  return useQuery({
    queryKey: ["discoveryGeneral", filter],
    queryFn: async () => {
      const response = await apiClient.get<any>("/api/discovery/general", {
        params: { page: "1", limit: "20", filter }, // Added pagination params to match your swagger
      });
      // Extract the array directly so the UI doesn't have to guess
      return response?.data?.result || response?.result || [];
    },
  });
}

export function useDiscoveryMatchesQuery() {
  return useQuery({
    queryKey: ["discoveryMatches"],
    queryFn: async () => {
      const response = await apiClient.get<any>("/api/discovery/matches", {
        params: { page: "1", limit: "20" },
      });
      // Extract the array directly
      return response?.data?.result || response?.result || [];
    },
  });
}

export function useRecordInteractionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    // Changed parameter to receiverId and restricted type to 'like' or 'dislike' based on your API logs
    mutationFn: (data: { receiverId: string; type: "like" | "dislike" }) =>
      apiClient.post("/api/discovery/interaction", data),
    onSuccess: () => {
      // Invalidate the specific query keys you have defined for discovery
      queryClient.invalidateQueries({ queryKey: queryKeys.discoveryGeneral() });
      queryClient.invalidateQueries({ queryKey: queryKeys.discoveryMatches() });
    },
  });
}

// --- Discovery Preferences ---
export function useDiscoveryPreferencesQuery() {
  return useQuery({
    queryKey: ["discoveryPreferences"],
    queryFn: () => apiClient.get("/api/discovery/preferences"),
  });
}

// --- Shared Optimistic Like State ---
export function useLikedProfiles() {
  const queryClient = useQueryClient();
  const { data: likedProfiles = {} } = useQuery<Record<string, boolean>>({
    queryKey: ["optimisticLikedProfiles"],
    queryFn: () => ({}), // Dummy function required by React Query v5
    initialData: {},
    staleTime: Infinity, // keep in cache
  });

  const toggleLike = (id: string, currentStatus: boolean) => {
    queryClient.setQueryData(["optimisticLikedProfiles"], (old: any = {}) => ({
      ...old,
      [id]: !currentStatus,
    }));
  };

  return { likedProfiles, toggleLike };
}

export function useUpdateDiscoveryPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.patch("/api/discovery/preferences", data),
    onSuccess: () => {
      // Invalidate everything related to discovery so the home and matches screens instantly refresh!
      queryClient.invalidateQueries({ queryKey: ["discoveryPreferences"] });
      queryClient.invalidateQueries({ queryKey: ["discoveryGeneral"] });
      queryClient.invalidateQueries({ queryKey: ["discoveryMatches"] });
    },
  });
}

// --- Location Endpoints ---
export function useLocationSearchQuery(query: string) {
  return useQuery({
    queryKey: ["locationSearch", query],
    queryFn: () =>
      apiClient.get<any[]>(`/api/location/search`, {
        params: {
          query,
          // Assuming the backend can accept a 'countries' parameter
          // "NG" is Nigeria, "GB" is United Kingdom (ISO 3166-1 alpha-2 codes)
          countries: "NG,GB",
        },
      }),
    enabled: query.trim().length > 2,
  });
}

// Fetches location based on IP from the backend
export function useCurrentLocationQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["currentLocation"],
    queryFn: () => apiClient.get<{ location: string }>("/api/location/current"),
    enabled,
  });
}

// --- Notification Endpoints ---
export function useNotificationListQuery() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<any[]>("/api/notification/list"),
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) =>
      apiClient.patch(`/api/notification/${id}/read`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ─── Learn / Mini-Courses Endpoints ─────────────────────────────────────

export type MiniCourse = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  categoryId: string;
};

export type CourseCategory = {
  id: string;
  name: string;
  miniCourses: MiniCourse[];
};
// 1. Fetch all mini-courses (List)
export function useMiniCoursesQuery() {
  return useQuery({
    queryKey: ["miniCourses"],
    queryFn: async () => {
      // FIX: Updated the endpoint to match your actual Swagger URL
      const response = await apiClient.get<any>(
        "/api/mini-courses/categories",
        {
          params: { page: "1", limit: "10" },
        },
      );

      return response?.data?.result || response?.result || response;
    },
  });
}

// 2. Fetch a specific mini-course by ID
export function useMiniCourseByIdQuery(id: string) {
  return useQuery({
    queryKey: ["miniCourse", id],
    queryFn: async () => {
      // NOTE: Make sure this URL matches your Swagger for fetching a single course.
      // It might be "/api/mini-courses/courses/${id}" depending on your backend routing.
      const response = await apiClient.get<any>(`/api/mini-course/${id}`);
      return response?.data?.result || response?.result || response;
    },
    enabled: !!id,
  });
}

// 3. Update Progress / Mark as Complete (Assuming this exists based on common LMS flows)

export function useCompleteMiniCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/api/mini-course/${id}/complete`), // Adjust URL if different in Swagger
    onSuccess: (_, id) => {
      // Invalidate both the list and the specific course so the UI updates instantly
      queryClient.invalidateQueries({ queryKey: ["miniCourses"] });
      queryClient.invalidateQueries({ queryKey: ["miniCourse", id] });
    },
  });
}
