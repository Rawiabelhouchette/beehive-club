import type { Locale } from "@/i18n/config";

export type PageKey = "home" | "menu" | "events" | "private" | "info" | "book" | "legal" | "admin";

const slugs: Record<PageKey, string> = {
  home: "",
  menu: "/carte",
  events: "/soirees",
  info: "/infos",
  private: "/privatisation",
  book: "/reservation",
  legal: "/mentions-legales",
  admin: "/admin",
};

export function href(locale: Locale, page: PageKey, query?: Record<string, string>): string {
  const path = `/${locale}${slugs[page]}`;
  if (!query) return path;
  const search = new URLSearchParams(query).toString();
  return search ? `${path}?${search}` : path;
}

/** Même page dans l'autre langue : /fr/carte → /en/carte. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const parts = pathname.split("/");
  if (parts[1] === "fr" || parts[1] === "en") parts[1] = target;
  else parts.splice(1, 0, target);
  return parts.join("/") || `/${target}`;
}

export const navPages: PageKey[] = ["menu", "events", "private", "info"];
