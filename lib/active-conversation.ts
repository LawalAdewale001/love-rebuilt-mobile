/**
 * Module-level tracker for which conversation the user is currently viewing.
 * Set when chat-conversation screen gains focus; cleared when it loses focus.
 * Used by the global socket hooks to decide whether to play notification sounds.
 */

let activeConversationId: string | null = null;

export function setActiveConversation(id: string | null): void {
  activeConversationId = id;
}

export function getActiveConversationId(): string | null {
  return activeConversationId;
}
