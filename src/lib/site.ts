export const isDemoMode = () => process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const demoAuthor = () => process.env.NEXT_PUBLIC_DEMO_AUTHOR || "";

/**
 * Adresse publique du site, sans « / » final.
 * Tolère les erreurs de saisie courantes dans Netlify (adresse sans « https:// »,
 * guillemets, espaces) : une adresse invalide ferait échouer toute la compilation.
 */
export function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/^["']+|["']+$/g, "").trim();
  if (!raw) return "http://localhost:3000";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return "http://localhost:3000";
  }
}

/** Lien WhatsApp avec message prérempli. */
export function whatsappLink(number: string, text?: string): string {
  const base = `https://wa.me/${number.replace(/\D/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Numéro au format international sans « + » (ex. « 22 333 444 » → « 21622333444 »). */
export function internationalNumber(phone: string, country = "216"): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!phone.trim().startsWith("+") && digits.length <= 8) digits = country + digits;
  return digits;
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
