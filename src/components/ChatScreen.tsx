import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  AlertCircle,
  Menu,
  RefreshCw,
  SquarePen,
  WifiOff,
} from "lucide-react";
import { BrandMark } from "./Brand";
import { Composer } from "./Composer";
import { Drawer } from "./Drawer";
import { MessageBubble, TypingBubble } from "./MessageBubble";
import { ThemeButton } from "./ThemeButton";
import {
  ApiError,
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  sendChat,
  type ChatHistoryEntry,
} from "../lib/api";
import { prepareImage } from "../lib/images";
import { supabase } from "../lib/supabase";
import type { Theme } from "../lib/theme";
import type { ChatMessage, Conversation, PendingImage } from "../lib/types";

const SUGGESTIONS = [
  "tô ansioso com amanhã",
  "me ajuda a escolher um vídeo",
  "só quero conversar um pouco",
];

function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não consegui falar com a velo agora.";
}

/**
 * Renova o JWT uma vez se a API responder 401. O Supabase também renova em
 * segundo plano, mas o app pode voltar do background com o token vencido.
 */
async function runWithAuth<T>(
  session: Session,
  run: (token: string) => Promise<T>,
): Promise<T> {
  try {
    return await run(session.access_token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && supabase) {
      const { data } = await supabase.auth.refreshSession();
      const refreshed = data.session?.access_token;
      if (refreshed) return run(refreshed);
    }
    throw error;
  }
}

export function ChatScreen({
  session,
  theme,
  onToggleTheme,
}: {
  session: Session;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [preparingImage, setPreparingImage] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyCode, setHistoryCode] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const sessionRef = useRef(session);
  const sendingRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const request = useCallback(function request<T>(
    run: (token: string) => Promise<T>,
  ) {
    return runWithAuth(sessionRef.current, run);
  }, []);

  const applyMessages = useCallback((next: ChatMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  }, []);

  const openConversation = useCallback(
    async (id: string) => {
      setDrawerOpen(false);
      setConversationId(id);
      setLoadingMessages(true);
      setError(null);
      applyMessages([]);

      try {
        const data = await request((token) => getConversation(token, id));
        applyMessages(Array.isArray(data.messages) ? data.messages : []);
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === id
              ? { ...conversation, ...data.conversation }
              : conversation,
          ),
        );
      } catch (openError) {
        if (openError instanceof ApiError && openError.status === 404) {
          setConversationId(null);
          applyMessages([]);
          setConversations((current) =>
            current.filter((conversation) => conversation.id !== id),
          );
        } else {
          setError(messageOf(openError));
        }
      } finally {
        setLoadingMessages(false);
      }
    },
    [applyMessages, request],
  );

  const loadConversations = useCallback(
    async (openLatest = false) => {
      setLoadingConversations(true);
      try {
        const list = await request(listConversations);
        setConversations(list);
        setHistoryError(null);
        setHistoryCode(null);

        if (openLatest && list.length > 0) {
          await openConversation(list[0].id);
        }
      } catch (loadError) {
        setHistoryError(messageOf(loadError));
        setHistoryCode(
          loadError instanceof ApiError ? loadError.code ?? null : null,
        );
      } finally {
        setLoadingConversations(false);
      }
    },
    [openConversation, request],
  );

  const refreshConversations = useCallback(async () => {
    try {
      const list = await request(listConversations);
      setConversations(list);
      setHistoryError(null);
      setHistoryCode(null);
    } catch {
      // A lista atual continua válida; o próximo envio tenta de novo.
    }
  }, [request]);

  /* eslint-disable react-hooks/set-state-in-effect -- carga inicial assíncrona */
  useEffect(() => {
    void loadConversations(true);
  }, [loadConversations]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Mantém a conversa no fim quando chega mensagem ou o indicador aparece.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: messages.length > 0 ? "smooth" : "auto",
    });
  }, [messages, sending, loadingMessages]);

  // No desktop o foco já começa no campo; no celular evita abrir o teclado.
  useEffect(() => {
    if (window.matchMedia("(min-width: 900px)").matches) {
      textareaRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const newConversation = useCallback(() => {
    setConversationId(null);
    applyMessages([]);
    setInput("");
    setPendingImage(null);
    setError(null);
    setDrawerOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [applyMessages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    const image = pendingImage?.dataUrl ?? null;
    if ((!text && !image) || sending || sendingRef.current || preparingImage) {
      return;
    }

    sendingRef.current = true;
    setError(null);
    const content =
      text || "O que você vê nesta imagem? Descreva e comente com carinho.";
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content,
      image: image ?? undefined,
      created_at: new Date().toISOString(),
    };
    const history: ChatHistoryEntry[] = messagesRef.current
      .filter((message) => message.content.trim())
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));
    const imageToRestore = pendingImage;

    applyMessages([...messagesRef.current, optimistic]);
    setInput("");
    setPendingImage(null);
    setSending(true);

    try {
      let activeId = conversationId;

      if (!activeId) {
        const created = await request((token) => createConversation(token));
        activeId = created.id;
        setConversationId(created.id);
        setConversations((current) => [created, ...current]);
      }

      const data = await request((token) =>
        sendChat(token, {
          message: content,
          conversationId: activeId,
          history,
          ...(image ? { image } : {}),
        }),
      );

      if (data.conversationId && data.conversationId !== activeId) {
        setConversationId(data.conversationId);
      }

      applyMessages([
        ...messagesRef.current,
        {
          id: `reply-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString(),
        },
      ]);

      void refreshConversations();
    } catch (sendError) {
      applyMessages(
        messagesRef.current.filter((message) => message.id !== optimistic.id),
      );
      setInput(text);
      if (imageToRestore) setPendingImage(imageToRestore);
      setError(messageOf(sendError));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [
    applyMessages,
    conversationId,
    input,
    pendingImage,
    preparingImage,
    refreshConversations,
    request,
    sending,
  ]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPreparingImage(true);
    setError(null);
    try {
      setPendingImage(await prepareImage(file));
    } catch (imageError) {
      setError(messageOf(imageError));
    } finally {
      setPreparingImage(false);
    }
  };

  const handleDelete = useCallback(
    async (conversation: Conversation) => {
      if (deletingId) return;

      const confirmed = window.confirm(
        `Apagar "${conversation.title}"? Essa ação não pode ser desfeita.`,
      );
      if (!confirmed) return;

      setDeletingId(conversation.id);
      setError(null);

      try {
        await request((token) => deleteConversation(token, conversation.id));
        setConversations((current) =>
          current.filter((item) => item.id !== conversation.id),
        );
        if (conversationId === conversation.id) newConversation();
      } catch (deleteError) {
        setError(messageOf(deleteError));
      } finally {
        setDeletingId(null);
      }
    },
    [conversationId, deletingId, newConversation, request],
  );

  const handleSignOut = () => {
    void supabase?.auth.signOut();
  };

  const canSend =
    !sending && !preparingImage && (input.trim().length > 0 || Boolean(pendingImage));
  const userEmail = session.user.email ?? "conta velo";

  return (
    <div className="chat">
      <Drawer
        open={drawerOpen}
        conversations={conversations}
        activeId={conversationId}
        loading={loadingConversations}
        deletingId={deletingId}
        userEmail={userEmail}
        theme={theme}
        onClose={() => setDrawerOpen(false)}
        onNew={newConversation}
        onSelect={(id) => void openConversation(id)}
        onDelete={(conversation) => void handleDelete(conversation)}
        onSignOut={handleSignOut}
        onToggleTheme={onToggleTheme}
      />

      <header className="chat-header">
        <div className="chat-header-inner">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir histórico de conversas"
          >
            <Menu size={19} strokeWidth={1.9} />
          </button>

          <div className="chat-identity">
            <BrandMark size={38} />
            <div>
              <h1>velo ia</h1>
              <p>
                <span className="status-dot" />
                online · sua amiga virtual
              </p>
            </div>
          </div>

          <div className="chat-actions">
            <ThemeButton theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              className="icon-btn"
              onClick={newConversation}
              aria-label="Nova conversa"
              title="Nova conversa"
            >
              <SquarePen size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      <main
        className="messages"
        ref={scrollRef}
        role="log"
        aria-label="Conversa com a velo ia"
      >
        <div className="messages-inner">
          <div className="day-divider">
            <span>hoje</span>
          </div>

          {messages.length === 0 && !loadingMessages ? (
            <section className="welcome">
              <BrandMark size={52} />
              <h2>
                oi, eu sou a <em>velo ia</em>.
              </h2>
              <p>
                Pode falar do seu dia, desabafar, pedir uma ideia de vídeo ou só
                jogar conversa fora. Eu lembro das últimas mensagens — e você
                pode apagar tudo quando quiser.
              </p>
              <div className="suggestions">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {loadingMessages ? (
            <div className="loading-bubbles" aria-hidden="true">
              <span className="skeleton avatar" />
              <span className="skeleton bubble" />
              <span className="skeleton bubble short" />
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}

          {sending ? <TypingBubble /> : null}

          {historyError ? (
            <div className="history-banner" role="status">
              <span className="history-icon">
                <WifiOff size={18} strokeWidth={1.8} />
              </span>
              <div>
                <p>
                  {historyCode === "ai_history_unavailable"
                    ? "O histórico compartilhado ainda não foi ativado."
                    : "Não consegui carregar suas conversas."}
                </p>
                <span>
                  {historyCode === "ai_history_unavailable"
                    ? "O chat continua funcionando, mas as conversas não serão salvas até a migração do Supabase ser aplicada."
                    : historyError}
                </span>
                <button
                  type="button"
                  className="retry-btn"
                  onClick={() => void loadConversations(true)}
                >
                  <RefreshCw size={13} strokeWidth={2} />
                  tentar de novo
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="chat-error" role="alert">
              <AlertCircle size={16} strokeWidth={1.9} />
              {error}
            </p>
          ) : null}
        </div>
      </main>

      <div className="composer-shell">
        <Composer
          input={input}
          onInputChange={setInput}
          pendingImage={pendingImage}
          preparingImage={preparingImage}
          sending={sending}
          canSend={canSend}
          onSend={() => void sendMessage()}
          onRemoveImage={() => setPendingImage(null)}
          onImageChange={(event) => void handleImageChange(event)}
          onKeyDown={handleKeyDown}
          textareaRef={textareaRef}
          fileInputRef={fileInputRef}
        />
      </div>
    </div>
  );
}
