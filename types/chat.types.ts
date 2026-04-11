// ─── Shared types for the chat conversation feature ───

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  MEETUP = 'meetup',
  MISSED_CALL = 'missed_call',
}

export type ChatMessage = {
  id: string;
  text?: string;
  sent: boolean;
  time: string;
  createdAt: string;
  read?: boolean;
  sender?: string;
  replyTo?: { id: string; text?: string; sender?: string; type?: MessageType };
  edited?: boolean;
  deleted?: boolean;
  type?: MessageType;
  mediaUrl?: string;
  transcription?: string;
  meetup?: {
    title: string;
    location: string;
    date: string;
    time: string;
  };
};

export type ChatHeaderItem = { title: string; isHeader: true; id: string };
export type ChatListItem = ChatMessage | ChatHeaderItem;

export type SheetType = "leave" | "block" | "report" | "joinGroup" | "planMeetup" | null;
