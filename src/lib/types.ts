export type Conversation = {
  id: string;
  title: string;
  preview: string;
  created_at: string;
  updated_at: string;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  created_at?: string;
  /** Data URL usada só na prévia local; o servidor guarda apenas o texto. */
  image?: string;
  /** Indica se a resposta consultou a web em tempo real. */
  searched?: boolean;
  /** Fontes pesquisadas na web. */
  sources?: Array<{ title: string; url: string }>;
};

export type PendingImage = {
  dataUrl: string;
  name: string;
  bytes: number;
};
