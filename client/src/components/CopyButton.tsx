import { useState } from "react";

// Copies text; falls back to selecting it when the clipboard isn't available
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt?.("Copy this:", text);
        }
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}
