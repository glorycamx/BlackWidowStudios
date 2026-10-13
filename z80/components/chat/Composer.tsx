"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComposerHandle {
  focus(): void;
}

interface Props {
  value: string;
  onChange(v: string): void;
  onSubmit(text: string): void;
  placeholder?: string;
  disabled?: boolean;
  /** Bigger box for empty states and the homepage. */
  size?: "md" | "lg";
  autoFocus?: boolean;
  id?: string;
  label?: string;
  className?: string;
}

/**
 * The message box. One rounded field, one send button, Enter to send,
 * Shift+Enter for a new line. Grows with the text.
 */
export const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  { value, onChange, onSubmit, placeholder = "Tell an agent what to do…", disabled, size = "md", autoFocus, id = "composer", label = "Message", className },
  ref,
) {
  const ta = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => ta.current?.focus() }));

  // Auto-grow up to a cap.
  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) ta.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const send = () => {
    const t = value.trim();
    if (!t || disabled) return;
    onSubmit(t);
  };
  const lg = size === "lg";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className={cn(
        "flex items-end gap-2 rounded-[26px] bg-[var(--surface-input)] p-2 pl-5 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_10px_32px_-16px_rgb(0_0_0/0.35)] transition-shadow focus-within:shadow-[0_0_0_1px_var(--color-line-3),0_10px_32px_-16px_rgb(0_0_0/0.4)]",
        "ring-1 ring-[var(--color-line-2)]",
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        id={id}
        ref={ta}
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        className={cn(
          "min-w-0 flex-1 resize-none bg-transparent text-white placeholder:text-fg-3 focus:outline-none disabled:opacity-60",
          lg ? "min-h-[56px] py-3.5 text-[17px] leading-[1.5]" : "min-h-[40px] py-2 text-[16px] leading-[1.5]",
        )}
      />
      <button
        type="submit"
        aria-label="Send"
        disabled={!value.trim() || disabled}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-white text-black transition-opacity disabled:opacity-25",
          lg ? "mb-1 h-10 w-10" : "h-9 w-9",
        )}
      >
        <ArrowUp size={lg ? 18 : 16} strokeWidth={2.4} />
      </button>
    </form>
  );
});
