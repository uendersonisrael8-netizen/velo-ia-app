import type { ChatMessage, Conversation } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Em produção aponta para o deploy da Vercel que já roda a rede social.
 * Pode ser trocado por uma preview no .env.local.
 */
export const API_URL = (
  import.meta.env.VITE_VELO_API_URL?.trim() ||
  "https://velo-iota-bice.vercel.app"
).replace(/\/+$/, "");

type Envelope = {
  ok?: boolean;
  error?: string;
  code?: string;
};

async function request<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T & Envelope> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new ApiError(
      "Não consegui falar com a velo agora. Verifique sua conexão.",
      0,
    );
  }

  const payload = (await response
    .json()
    .catch(() => null)) as (T & Envelope) | null;

  if (!response.ok || !payload || payload.ok === false) {
    throw new ApiError(
      payload?.error ??
        (response.status === 401
          ? "Sua sessão expirou. Entre de novo."
          : "A velo ia não conseguiu responder agora."),
      response.status,
      payload?.code,
    );
  }

  return payload;
}

export async function listConversations(token: string) {
  const data = await request<{ conversations: Conversation[] }>(
    "/api/ai/conversations",
    token,
  );
  return Array.isArray(data.conversations) ? data.conversations : [];
}

export async function getConversation(token: string, id: string) {
  return request<{ conversation: Conversation; messages: ChatMessage[] }>(
    `/api/ai/conversations/${encodeURIComponent(id)}`,
    token,
  );
}

export async function createConversation(token: string, title?: string) {
  const data = await request<{ conversation: Conversation }>(
    "/api/ai/conversations",
    token,
    {
      method: "POST",
      body: JSON.stringify(title ? { title } : {}),
    },
  );
  return data.conversation;
}

export async function deleteConversation(token: string, id: string) {
  return request<{ deleted: number }>(
    `/api/ai/conversations/${encodeURIComponent(id)}`,
    token,
    { method: "DELETE" },
  );
}

export type ChatHistoryEntry = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequest = {
  message: string;
  conversationId?: string | null;
  history?: ChatHistoryEntry[];
  image?: string;
};

export type ChatReply = {
  reply: string;
  conversationId: string | null;
  persisted: boolean;
  storage: "local" | "server";
  mock?: boolean;
  searched?: boolean;
  sources?: Array<{ title: string; url: string }>;
};

export async function sendChat(token: string, input: ChatRequest) {
  const body = {
    message: input.message,
    ...(input.conversationId
      ? { conversationId: input.conversationId }
      : {}),
    ...(input.history?.length ? { history: input.history.slice(-10) } : {}),
    ...(input.image ? { image: input.image } : {}),
  };

  return request<ChatReply>("/api/ai/chat", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
