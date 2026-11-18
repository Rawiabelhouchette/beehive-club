import { NextResponse, type NextRequest } from "next/server";
import { isLocale, preferredLocale } from "@/i18n/config";
import { checkBasicAuth, safeEqual } from "@/lib/basic-auth";
import { DEMO_COOKIE, DEMO_COOKIE_MAX_AGE, DEMO_PARAM, demoAccessToken, demoGatePage } from "@/lib/demo-access";
import { SESSION_COOKIE, sessionSecret, verifySessionToken } from "@/lib/session";
import { OWNER_COOKIE, OWNER_PARAM, describeVisit, recordVisit } from "@/lib/visits";

/**
 * 1. Démo privée si DEMO_PASSWORD est défini : lien avec le code (?acces=…), page du code,
 *    ou identifiant / mot de passe du navigateur.
 * 2. Langue : / → /fr (ou /en selon le navigateur).
 * 3. Espace équipe : /fr/admin réservé aux personnes connectées.
 * 4. En démo : chaque page vue est notée (table demo_visits), sauf vos propres visites.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Accès à la démo à retenir dans un cookie (lien avec le bon code).
  let grantToken: string | null = null;
  const withAccess = (response: NextResponse) => {
    if (grantToken) {
      response.cookies.set(DEMO_COOKIE, grantToken, {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: DEMO_COOKIE_MAX_AGE,
      });
    }
    return response;
  };

  const demoPassword = process.env.DEMO_PASSWORD;
  // Le lien a-t-il été ouvert avec le bon code ? (pour le suivi des visites)
  let viaLink = false;
  if (demoPassword) {
    const user = process.env.DEMO_USER || "beehive";
    const token = await demoAccessToken(demoPassword);
    const code = request.nextUrl.searchParams.get(DEMO_PARAM);

    // Lien avec le code (/fr?acces=…) : la page s'affiche directement et l'accès est retenu.
    // Pas de redirection : l'aperçu WhatsApp ou Instagram lit ainsi la vraie page (titre, image).
    if (code !== null && safeEqual(code.trim(), demoPassword)) {
      grantToken = token;
      viaLink = true;
    } else {
      const hasAccess =
        safeEqual(request.cookies.get(DEMO_COOKIE)?.value ?? "", token) ||
        checkBasicAuth(request.headers.get("authorization"), user, demoPassword);
      if (!hasAccess) {
        // Les navigateurs classiques proposent la fenêtre identifiant / mot de passe ;
        // ceux d'Instagram ou de WhatsApp affichent directement la page du code.
        return new NextResponse(demoGatePage({ english: pathname.startsWith("/en"), error: code !== null }), {
          status: 401,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            "WWW-Authenticate": 'Basic realm="Beehive Club (demo)", charset="UTF-8"',
          },
        });
      }
    }
  }

  const firstSegment = pathname.split("/")[1];
  if (!isLocale(firstSegment)) {
    const url = request.nextUrl.clone();
    const locale = preferredLocale(request.headers.get("accept-language"));
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return withAccess(NextResponse.redirect(url));
  }

  const admin = /^\/(fr|en)\/admin(\/.*)?$/.exec(pathname);
  if (admin && admin[2] !== "/login") {
    const secret = sessionSecret();
    const valid = secret ? await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, secret) : false;
    if (!valid) {
      const url = request.nextUrl.clone();
      url.pathname = `/${admin[1]}/admin/login`;
      url.search = "";
      return withAccess(NextResponse.redirect(url));
    }
  }

  const response = NextResponse.next();
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // Suivi des visites de la démo (jamais les vôtres : espace équipe ou lien « &moi=1 »).
  if (demoPassword && request.method === "GET") {
    const markOwner = request.nextUrl.searchParams.get(OWNER_PARAM) === "1";
    if (markOwner) {
      response.cookies.set(OWNER_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    const isOwner =
      markOwner || Boolean(request.cookies.get(OWNER_COOKIE)?.value) || Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    const visit = isOwner
      ? null
      : describeVisit({
          path: pathname,
          userAgent: request.headers.get("user-agent") ?? "",
          headers: request.headers,
          viaLink,
        });
    if (visit) await recordVisit(visit);
  }

  return withAccess(response);
}

export const config = {
  // Tout sauf l'API, les fichiers internes de Next et les fichiers statiques (avec extension).
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
