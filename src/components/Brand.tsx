import { Sparkles } from "lucide-react";

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="brand-mark"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Sparkles size={Math.round(size * 0.52)} strokeWidth={2} />
    </span>
  );
}

export function BrandAvatar({ size = 30 }: { size?: number }) {
  return (
    <span
      className="brand-avatar"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Sparkles size={Math.round(size * 0.48)} strokeWidth={2} />
    </span>
  );
}
