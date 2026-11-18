import type { MetadataRoute } from "next";

/** Permet d'ajouter le site à l'écran d'accueil du téléphone, comme une application. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Beehive Club",
    short_name: "Beehive",
    description: "Club et restaurant lounge à l'Hôtel Acquaviva, Gammarth. Un spectacle chaque soir, réservation en ligne.",
    start_url: "/fr",
    display: "standalone",
    background_color: "#0d0a06",
    theme_color: "#f5a524",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
