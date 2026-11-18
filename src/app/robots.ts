import type { MetadataRoute } from "next";
import { isDemoMode, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (isDemoMode()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/fr/admin", "/en/admin", "/api/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
