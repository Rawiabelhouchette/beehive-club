import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const paths = ["", "/carte", "/soirees", "/privatisation", "/infos", "/reservation", "/mentions-legales"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return paths.flatMap((path) =>
    (["fr", "en"] as const).map((locale) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "/soirees" || path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/reservation" || path === "/privatisation" ? 0.9 : 0.7,
      alternates: { languages: { fr: `${base}/fr${path}`, en: `${base}/en${path}` } },
    })),
  );
}
