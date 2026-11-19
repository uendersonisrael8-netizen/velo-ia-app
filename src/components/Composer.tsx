import { useEffect, type ChangeEvent, type KeyboardEvent, type RefObject } from "react";
import { ArrowUp, ImagePlus, Loader2, X } from "lucide-react";
import { formatBytes } from "../lib/format";
import type { PendingImage } from "../lib/types";

type ComposerProps = {
  input: string;
  onInputChange: (value: string) => void;
  pendingImage: PendingImage | null;
  preparingImage: boolean;
  sending: boolean;
  canSend: boolean;
  onSend: () => void;
  onRemoveImage: () => void;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

export function Composer({
  input,
  onInputChange,
  pendingImage,
  preparingImage,
  sending,
  canSend,
  onSend,
  onRemoveImage,
  onImageChange,
  onKeyDown,
  textareaRef,
  fileInputRef,
}: ComposerProps) {
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, [input, textareaRef]);

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      {preparingImage ? (
        <div className="attach-loading">
          <Loader2 className="spin" size={16} strokeWidth={1.9} />
          preparando a imagem…
        </div>
      ) : pendingImage ? (
        <div className="attach-preview">
          <img src={pendingImage.dataUrl} alt="Prévia da imagem" />
          <div className="attach-info">
            <p>{pendingImage.name}</p>
            <span>{formatBytes(pendingImage.bytes)} · a velo ia vai analisar</span>
          </div>
          <button
            type="button"
            className="icon-btn compact"
            onClick={onRemoveImage}
            aria-label="Remover imagem"
          >
            <X size={16} strokeWidth={1.9} />
          </button>
        </div>
      ) : null}

      <div className="composer-box">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={onImageChange}
        />
        <button
          type="button"
          className="composer-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || preparingImage}
          aria-label="Anexar imagem"
          title="Anexar imagem (JPG, PNG ou WebP)"
        >
          {preparingImage ? (
            <Loader2 className="spin" size={19} strokeWidth={1.8} />
          ) : (
            <ImagePlus size={19} strokeWidth={1.8} />
          )}
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={2000}
          placeholder="manda uma mensagem pra velo ia…"
          aria-label="Mensagem para a velo ia"
          autoComplete="on"
          disabled={sending}
        />

        <button
          type="submit"
          className="send-btn"
          disabled={!canSend}
          aria-label="Enviar mensagem"
        >
          {sending ? (
            <Loader2 className="spin" size={18} strokeWidth={2.1} />
          ) : (
            <ArrowUp size={18} strokeWidth={2.2} />
          )}
        </button>
      </div>

      <div className="composer-meta">
        <span>enter envia · shift + enter quebra linha</span>
        <span className={input.length > 1800 ? "is-warning" : ""}>
          {input.length}/2000
        </span>
      </div>
    </form>
  );
}
