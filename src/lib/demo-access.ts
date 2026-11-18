/**
 * Accès à la démo privée sans fenêtre de mot de passe du navigateur.
 *
 * Le navigateur intégré d'Instagram ou de WhatsApp n'affiche souvent pas la
 * fenêtre « identifiant / mot de passe ». On accepte donc aussi :
 * - un lien qui contient le code : /fr?acces=CODE (pose un cookie, puis
 *   affiche directement la page, pour que l'aperçu WhatsApp lise le titre et l'image) ;
 * - une petite page où l'on tape le code, affichée à la place de l'erreur 401.
 */

export const DEMO_COOKIE = "bee_demo";
export const DEMO_PARAM = "acces";
/** Durée de l'accès une fois le code saisi : 60 jours. */
export const DEMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 60;

/** Valeur du cookie d'accès : empreinte du code, jamais le code lui-même. */
export async function demoAccessToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`bee-demo:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const copy = {
  fr: {
    title: "Démo privée",
    text: "Ce site est une proposition privée pour Beehive Club. Entrez le code d'accès reçu avec le lien.",
    label: "Code d'accès",
    submit: "Voir le site",
    error: "Ce code ne correspond pas. Vérifiez-le et réessayez.",
  },
  en: {
    title: "Private demo",
    text: "This site is a private proposal for Beehive Club. Enter the access code you received with the link.",
    label: "Access code",
    submit: "View the site",
    error: "This code doesn't match. Check it and try again.",
  },
} as const;

/** Page affichée tant que le code n'a pas été saisi (aux couleurs du site, sans dépendance). */
export function demoGatePage({ english, error }: { english: boolean; error: boolean }): string {
  const t = english ? copy.en : copy.fr;
  return `<!doctype html>
<html lang="${english ? "en" : "fr"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0c0906">
<title>Beehive Club · ${t.title}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:radial-gradient(60% 50% at 50% 0%,rgba(242,140,15,.28),transparent 70%),#0c0906;color:#f6ead2;font:17px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
  main{width:100%;max-width:400px}
  .brand{display:inline-flex;align-items:center;gap:12px;margin:0 0 28px;font:800 30px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.02em;color:#f6ead2}
  .brand svg{width:34px;height:39px;filter:drop-shadow(0 0 6px rgba(242,140,15,.8))}
  h1{margin:0 0 8px;font:800 24px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif}
  p{margin:0 0 20px;color:#c3b08e}
  label{display:block;margin-bottom:6px;font-weight:600}
  input{width:100%;min-height:48px;padding:10px 14px;border:1.5px solid rgba(246,234,210,.4);border-radius:12px;background:#070504;color:#f6ead2;font:inherit}
  input:focus{outline:3px solid #f28c0f;outline-offset:2px}
  button{width:100%;min-height:48px;margin-top:14px;border:0;border-radius:999px;background:#f28c0f;color:#170e02;font:700 17px/1 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer}
  button:focus-visible{outline:3px solid #f6ead2;outline-offset:2px}
  .error{margin:0 0 14px;padding:10px 12px;border-radius:12px;background:rgba(255,179,138,.14);border:1px solid rgba(255,179,138,.55);color:#ffb38a;font-weight:600}
</style>
</head>
<body>
<main>
  <p class="brand" aria-hidden="true"><svg viewBox="0 0 40 46.19"><polygon points="20,2 38,12.4 38,33.8 20,44.2 2,33.8 2,12.4" fill="none" stroke="#f28c0f" stroke-width="3.4" stroke-linejoin="round"/><polygon points="20,13 28.5,17.9 28.5,28.3 20,33.2 11.5,28.3 11.5,17.9" fill="#f28c0f"/></svg>Beehive</p>
  <h1>${t.title}</h1>
  <p>${t.text}</p>
  ${error ? `<p class="error" role="alert">${t.error}</p>` : ""}
  <form method="get">
    <label for="code">${t.label}</label>
    <input id="code" name="${DEMO_PARAM}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" required autofocus>
    <button type="submit">${t.submit}</button>
  </form>
</main>
</body>
</html>`;
}
