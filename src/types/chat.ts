
export interface ChatMessage {
  id: string;
  association_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface ChatSession {
  association_id: string;
  participants: {
    id: string;
    name: string;
    profile_image?: string;
    last_seen?: string;
  }[];
}
