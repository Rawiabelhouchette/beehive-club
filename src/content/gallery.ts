import type { GalleryItem } from "./types";

/**
 * Photos du lieu (dossier public/images/), reprises de l'Instagram de Beehive pour la démo :
 * à remplacer par les originaux en haute définition avant la mise en ligne.
 */
export const gallery: GalleryItem[] = [
  {
    id: "scene",
    hour: "23:00",
    caption: { fr: "La scène, sous les alvéoles", en: "The stage, under the honeycomb" },
    src: "/images/scene.jpg",
    alt: {
      fr: "Un concert sur la scène de Beehive, sous le plafond en alvéoles hexagonales, salle comble",
      en: "A concert on Beehive's stage, under the hexagonal honeycomb ceiling, with a full room",
    },
    position: "center 40%",
  },
  {
    id: "show",
    hour: "00:30",
    caption: { fr: "Le spectacle, entre les tables", en: "The show, among the tables" },
    src: "/images/show.jpg",
    alt: {
      fr: "Un spectacle oriental devant le grand écran, avec musiciens et danseuses, entre les tables éclairées à la bougie",
      en: "An oriental show in front of the big screen, with musicians and dancers, among candle-lit tables",
    },
  },
  {
    id: "artiste",
    hour: "01:30",
    caption: { fr: "Les artistes invités", en: "Guest artists" },
    src: "/images/artiste.jpg",
    alt: {
      fr: "Un artiste sur scène, sous les faisceaux de lumière, devant le public",
      en: "An artist on stage, under the light beams, in front of the crowd",
    },
    position: "center 30%",
  },
];
