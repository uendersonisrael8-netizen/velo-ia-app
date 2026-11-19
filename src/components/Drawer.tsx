import {
  Loader2,
  LogOut,
  MessageSquare,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import { BrandMark } from "./Brand";
import { ThemeButton } from "./ThemeButton";
import { emailInitial, formatRelative } from "../lib/format";
import type { Conversation } from "../lib/types";
import type { Theme } from "../lib/theme";

type DrawerProps = {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  deletingId: string | null;
  userEmail: string;
  theme: Theme;
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (conversation: Conversation) => void;
  onSignOut: () => void;
  onToggleTheme: () => void;
};

export function Drawer({
  open,
  conversations,
  activeId,
  loading,
  deletingId,
  userEmail,
  theme,
  onClose,
  onNew,
  onSelect,
  onDelete,
  onSignOut,
  onToggleTheme,
}: DrawerProps) {
  return (
    <div className={`drawer-layer ${open ? "is-open" : ""}`} inert={!open}>
      <button
        type="button"
        className="drawer-overlay"
        onClick={onClose}
        aria-label="Fechar histórico"
      />

      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Histórico de conversas"
      >
        <header className="drawer-head">
          <div className="drawer-brand">
            <BrandMark size={32} />
            <div>
              <p className="drawer-title">conversas</p>
              <p className="drawer-subtitle">sincronizadas com a velo</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fechar histórico"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </header>

        <button type="button" className="new-chat-btn" onClick={onNew}>
          <SquarePen size={17} strokeWidth={1.9} />
          nova conversa
        </button>

        <div className="drawer-list">
          {loading ? (
            <div className="drawer-loading">
              <Loader2 className="spin" size={18} strokeWidth={1.9} />
              carregando conversas…
            </div>
          ) : conversations.length === 0 ? (
            <div className="drawer-empty">
              <MessageSquare size={22} strokeWidth={1.6} />
              <p>Nenhuma conversa ainda.</p>
              <span>Comece falando com a velo ia.</span>
            </div>
          ) : (
            conversations.map((conversation) => {
              const active = conversation.id === activeId;
              const deleting = deletingId === conversation.id;

              return (
                <div
                  key={conversation.id}
                  className={`conv-item ${active ? "is-active" : ""}`}
                >
                  <button
                    type="button"
                    className="conv-main"
                    onClick={() => onSelect(conversation.id)}
                  >
                    <span className="conv-title">{conversation.title}</span>
                    <span className="conv-preview">
                      {conversation.preview || "sem mensagens ainda"}
                    </span>
                    <span className="conv-time">
                      {formatRelative(conversation.updated_at)}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="conv-delete"
                    onClick={() => onDelete(conversation)}
                    disabled={deleting}
                    aria-label={`Apagar conversa ${conversation.title}`}
                    title="Apagar conversa"
                  >
                    {deleting ? (
                      <Loader2 className="spin" size={15} strokeWidth={2} />
                    ) : (
                      <Trash2 size={15} strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <footer className="drawer-foot">
          <div className="user-chip">
            <span className="user-avatar">{emailInitial(userEmail)}</span>
            <span className="user-email" title={userEmail}>
              {userEmail}
            </span>
          </div>
          <div className="drawer-actions">
            <ThemeButton theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              className="icon-btn"
              onClick={onSignOut}
              aria-label="Sair da conta"
              title="Sair da conta"
            >
              <LogOut size={18} strokeWidth={1.8} />
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
