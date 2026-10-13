/** Theme storage key, shared with lib/theme.ts. */
const KEY = "z80.theme";

/** App routes. The marketing site is always dark, so the theme only applies here. */
export const APP_PREFIXES = ["/chat", "/live", "/team", "/routines", "/calendar", "/jobs", "/approvals", "/activity", "/memory", "/apps", "/settings"];

/** Inline script for <head> so the right theme paints before the first frame. */
export const THEME_BOOT = `(function(){try{var a=${JSON.stringify(APP_PREFIXES)};var p=location.pathname;if(!a.some(function(x){return p===x||p.indexOf(x+"/")===0}))return;var s=localStorage.getItem("${KEY}")||"system";var t=s==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):s;document.documentElement.dataset.theme=t;}catch(e){}})();`;
