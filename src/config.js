// Central runtime configuration for the client website + admin panel.
// Values come from `.env` (Create React App exposes REACT_APP_* at build time).

const DEFAULT_THEME = {
  primary: "#c5a059",
  secondary: "#0f141d",
};

const runtimeEnv = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

function normalizeColor(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  let normalized = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (/^[0-9a-f]{3}$/i.test(normalized)) {
    normalized = normalized.split("").map((char) => char + char).join("");
  }

  if (/^[0-9a-f]{6}$/i.test(normalized)) {
    return `#${normalized.toLowerCase()}`;
  }

  return fallback;
}

function shadeColor(color, percent) {
  const base = normalizeColor(color, DEFAULT_THEME.primary);
  const hex = base.replace("#", "");
  const parsed = parseInt(hex, 16);
  if (Number.isNaN(parsed)) return DEFAULT_THEME.primary;

  const amount = Math.round((percent / 100) * 255);
  const r = Math.min(255, Math.max(0, (parsed >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((parsed >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (parsed & 0x0000ff) + amount));

  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function mixColors(baseColor, overlayColor, weight = 0.2) {
  const base = normalizeColor(baseColor, DEFAULT_THEME.primary);
  const overlay = normalizeColor(overlayColor, "#ffffff");
  const [r1, g1, b1] = base.slice(1).match(/.{1,2}/g).map((part) => parseInt(part, 16));
  const [r2, g2, b2] = overlay.slice(1).match(/.{1,2}/g).map((part) => parseInt(part, 16));
  const mix = (a, b) => Math.round(a * (1 - weight) + b * weight);

  return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function getThemeConfig(env = runtimeEnv) {
  const primary = normalizeColor(env.VITE_PRIMARY_COLOR || env.REACT_APP_PRIMARY_COLOR, DEFAULT_THEME.primary);
  const secondary = normalizeColor(env.VITE_SECONDARY_COLOR || env.REACT_APP_SECONDARY_COLOR, DEFAULT_THEME.secondary);

  return {
    primary,
    secondary,
    primaryDark: shadeColor(primary, -15),
    primarySoft: mixColors(primary, "#ffffff", 0.9),
    secondarySoft: mixColors(secondary, "#ffffff", 0.9),
  };
}

export const API_URL = (runtimeEnv.VITE_API_URL || runtimeEnv.REACT_APP_API_URL || "http://localhost:8080").replace(/\/$/, "");

export const BRAND_NAME = runtimeEnv.VITE_CLIENT_NAME || runtimeEnv.REACT_APP_CLIENT_NAME || "ROYAL JEWELLERS";
export const BRAND_SINCE = runtimeEnv.VITE_YEAR || runtimeEnv.REACT_APP_YEAR || "1988";
export const THEME = getThemeConfig();
export const GST_NUMBER = runtimeEnv.VITE_GST || runtimeEnv.REACT_APP_GST || "24AAAAA0000A1Z5";

export const DEFAULT_HOME_SETTINGS = {
  heroBgColor: "#0f141d",
  heroTextColor: "#ffffff",
  heroAccentColor: "#c5a059",
  pageBgColor: "#faf7f2",
  headerBgColor: "#0f141d",
  headerPrimaryFontColor: "#ffffff",
  headerSecondaryFontColor: "#c5a059",
  headerSelectedItemColor: "#d4af37",
  headerHoverItemColor: "#f3e5ab",
  footerBgColor: "#0a0d13",
  footerPrimaryFontColor: "#ffffff",
  footerSecondaryFontColor: "#a3a8b0",
  footerSelectedItemColor: "#c5a059",
  footerHoverItemColor: "#ffffff",
};

export function applyTheme(theme = THEME) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-dark", theme.primaryDark);
  root.style.setProperty("--primary-soft", theme.primarySoft);
  root.style.setProperty("--accent", theme.primary);
  root.style.setProperty("--accent-dark", theme.primaryDark);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--secondary-soft", theme.secondarySoft);
}

// Build an absolute URL for a product image path returned by the backend,
// e.g. "/public/itemMST/image/12" -> "http://localhost:8080/public/itemMST/image/12".
export function imageSrc(imageUrl) {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${API_URL}${imageUrl}`;
}

// Rough perceived-luminance check to choose readable text over a background colour.
// Accepts #rgb / #rrggbb; returns false for anything it can't parse (assume light).
export function isDarkColor(color) {
  if (!color || typeof color !== "string") return false;
  const m = color.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return false;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
}

// LocalStorage keys.
export const STORAGE = {
  customer: "jeweler.customer",
  adminToken: "jeweler.admin.token",
  cart: "jeweler.cart",
  homeSettings: "jeweler.home.settings",
};
