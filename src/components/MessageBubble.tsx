import { BrandAvatar } from "./Brand";
import { formatTime } from "../lib/format";
import type { ChatMessage } from "../lib/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.role === "user";
  const time = formatTime(message.created_at);

  return (
    <div className={`msg-row ${mine ? "msg-row-user" : ""}`}>
      {mine ? null : <BrandAvatar size={30} />}
      <div className="msg-stack">
        <div className={`msg-bubble ${mine ? "is-user" : "is-assistant"}`}>
          {message.image ? (
            <img
              src={message.image}
              alt="Imagem enviada na conversa"
              className="msg-image"
            />
          ) : null}
          {message.content ? <p>{message.content}</p> : null}
        </div>
        {time ? <time className="msg-time">{time}</time> : null}
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="msg-row" aria-live="polite">
      <BrandAvatar size={30} />
      <div className="msg-bubble is-assistant typing">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="sr-only">velo ia está digitando…</span>
      </div>
    </div>
  );
}
