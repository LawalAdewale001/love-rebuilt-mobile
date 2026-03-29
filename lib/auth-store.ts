import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "auth_access_token";
const AUTH_USER_KEY = "auth_user";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
};

let cachedToken: string | null = null;
let cachedUser: AuthUser | null = null;

/** Load persisted auth state from AsyncStorage into memory. Call once at app startup. */
export async function loadAuth() {
  const [token, userJson] = await Promise.all([
    AsyncStorage.getItem(AUTH_TOKEN_KEY),
    AsyncStorage.getItem(AUTH_USER_KEY),
  ]);
  cachedToken = token;
  cachedUser = userJson ? JSON.parse(userJson) : null;
}

/** Get the current access token (synchronous, from cache). */
export function getAccessToken(): string | null {
  return cachedToken;
}

/** Get the current authenticated user (synchronous, from cache). */
export function getAuthUser(): AuthUser | null {
  return cachedUser;
}

/** Persist auth state after login. */
export async function setAuth(token: string, user: AuthUser) {
  cachedToken = token;
  cachedUser = user;
  await Promise.all([
    AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
    AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
  ]);
}

/** Clear auth state on logout. */
export async function clearAuth() {
  cachedToken = null;
  cachedUser = null;
  await Promise.all([
    AsyncStorage.removeItem(AUTH_TOKEN_KEY),
    AsyncStorage.removeItem(AUTH_USER_KEY),
  ]);
}
