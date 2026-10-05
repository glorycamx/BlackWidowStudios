/** Theme storage key, shared with lib/theme.ts. */
const KEY = "z80.theme";

/** Inline script for the app layout so the right theme paints first. */
export const THEME_BOOT = `(function(){try{var p=localStorage.getItem("${KEY}")||"system";var t=p==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):p;document.documentElement.dataset.theme=t;}catch(e){}})();`;
