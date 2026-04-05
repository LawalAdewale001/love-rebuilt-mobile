/**
 * React Query hooks tied to the API client.
 * Add your query keys and hooks here for a single source of truth.
 */

import { apiClient } from '@/lib/api-client';
import { type AuthUser, setAuth } from '@/lib/auth-store';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Query keys (use for invalidations and consistency)
export const queryKeys = {
  all: ['api'] as const,
  auth: () => [...queryKeys.all, 'auth'] as const,
  profile: () => [...queryKeys.all, 'profile'] as const,
  chats: () => [...queryKeys.all, 'chats'] as const,
  chatSearch: (query: string) => [...queryKeys.all, 'chatSearch', query] as const,
  messages: (conversationId: string) => [...queryKeys.all, 'messages', conversationId] as const,
  blockedUsers: () => [...queryKeys.all, 'blockedUsers'] as const,
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
      apiClient.post<LoginResponse>('/api/auth/login', data),
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
    queryKey: queryKeys.profile(),
    queryFn: () => apiClient.get<UserProfile>('/api/user/profile'),
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
  type: 'direct' | 'group';
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
      apiClient.get<ChatListResponse>('/api/chat/list', {
        params: { page: String(pageParam), limit: '20' },
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
      apiClient.get<ChatSearchResult>('/api/chat/search', {
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
        params: { page: String(pageParam), limit: '30', order: 'newest' },
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
        const response = await apiClient.get<ChatConversation>(`/api/chat/${conversationId}`);
        // If meta/data structure is present, interceptors should have unwrapped it, 
        // but if it returned raw data, we take it.
        return response;
      } catch (err) {
        // Fallback: try to find the conversation in the chatted-list cache
        const chatsCache = queryClient.getQueryData<any>(queryKeys.chats());
        if (chatsCache?.pages) {
          for (const page of chatsCache.pages) {
            const found = page.result?.find((c: ChatConversation) => c.id === conversationId);
            if (found) return found;
          }
        }
        throw err;
      }
    },
    enabled: !!conversationId,
  });
}

// ─── Discovery interaction (like/dislike)
export function useInteractionMutation() {
  return useMutation({
    mutationFn: (data: { receiverId: string; type: 'like' | 'dislike' }) =>
      apiClient.post('/api/discovery/interaction', data),
  });
}

// ─── Block / Unblock / Report
export function useBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) =>
      apiClient.post('/api/chat/block', { blockedId }),
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
    mutationFn: (data: { targetId: string; targetType: 'user' | 'group'; reason: string }) =>
      apiClient.post('/api/chat/report', data),
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
      queryClient.invalidateQueries({ queryKey: [...queryKeys.chats(), groupId] });
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
      queryClient.invalidateQueries({ queryKey: [...queryKeys.chats(), groupId] });
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
      apiClient.post('/api/chat/meetups', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    },
  });
}

export function useChatProgressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { conversationId: string; reason: string; showChatProgressBanner: boolean }) =>
      apiClient.post(`/api/chat/${data.conversationId}/progress`, {
        reason: data.reason,
        showChatProgressBanner: data.showChatProgressBanner,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.chats(), variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    },
  });
}
