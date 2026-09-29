const paths: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  leads: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5",
  chat: "M4 5h16v11H9l-5 4z",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  text: "M4 5h16v11H9l-5 4zM8 9h8M8 12h5",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M15 5l-7 7 7 7",
  send: "M4 12 20 4l-6 16-3-7z",
  check: "M5 12l5 5L20 7",
  close: "M6 6l12 12M18 6 6 18",
  gift: "M4 10h16v10H4zM2 7h20v3H2zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0",
  rocket: "M5 15c-1 2-1 4-1 4s2 0 4-1M9 15l-3-3c2-5 6-9 12-9 0 6-4 10-9 12zM15 9h.01",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  inbox: "M3 13h5l1 3h6l1-3h5M5 5h14l2 8v6H3v-6z",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21c.6-3.5 3.5-6 7-6s6.4 2.5 7 6M16 3.5a4 4 0 0 1 0 7.5M18 15c2 .8 3.4 2.6 4 6",
  plus: "M12 5v14M5 12h14",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  logout: "M15 4h4v16h-4M10 16l-4-4 4-4M6 12h10",
  pulse: "M3 12h4l3-7 4 14 3-7h4",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
};

export function Icon({ name, size = 20, stroke = 1.8 }: { name: keyof typeof paths | string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] || paths.more} />
    </svg>
  );
}

export function WebMark({ size = 22 }: { size?: number }) {
  // Spider-web mark for Black Widow
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
      <path pathLength={1} d="M32 4v56M4 32h56M12 12l40 40M52 12 12 52" opacity=".55" />
      <path pathLength={1} d="M32 14 44.7 19.3 50 32l-5.3 12.7L32 50l-12.7-5.3L14 32l5.3-12.7z" />
      <path pathLength={1} d="M32 23l6.4 2.6L41 32l-2.6 6.4L32 41l-6.4-2.6L23 32l2.6-6.4z" />
      <circle cx="32" cy="32" r="4.5" fill="#c1121f" stroke="none" />
    </svg>
  );
}
