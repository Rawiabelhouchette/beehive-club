import type { Localized } from "./types";

/**
 * Photos de Beehive Club (dossier public/images/), reprises de son Instagram pour la démo :
 * à remplacer par les originaux en haute définition avant la mise en ligne.
 */
export interface IntroPhoto {
  src: string;
  alt: Localized;
  width: number;
  height: number;
  /** Cadrage dans le cadre (CSS object-position). */
  position?: string;
}

const photo = (src: string, width: number, height: number, fr: string, en: string, position?: string): IntroPhoto => ({
  src,
  width,
  height,
  alt: { fr, en },
  position,
});

export const photos = {
  stage: photo("/images/scene.jpg", 1400, 933,
    "Un concert sur la scène de Beehive, sous le plafond en alvéoles hexagonales, salle comble",
    "A concert on Beehive's stage, under the hexagonal honeycomb ceiling, with a full room", "center 40%"),
  show: photo("/images/show.jpg", 1400, 788,
    "Un spectacle oriental devant le grand écran, avec musiciens et danseuses, entre les tables éclairées à la bougie",
    "An oriental show in front of the big screen, with musicians and dancers, among candle-lit tables"),
  artist: photo("/images/artiste.jpg", 1365, 1366,
    "Un artiste sur scène, sous les faisceaux de lumière, devant le public",
    "An artist on stage, under the light beams, in front of the crowd", "center 30%"),
  risotto: photo("/images/risotto.jpg", 1365, 1366,
    "Un risotto aux champignons et à la volaille fumée, avec un verre de vin blanc",
    "A mushroom and smoked chicken risotto, with a glass of white wine"),
  carpaccio: photo("/images/carpaccio.jpg", 1130, 801,
    "Un carpaccio de volaille, chou rouge, cornichons et pain grillé",
    "A chicken carpaccio with red cabbage, gherkins and toast"),
};

/** Photo en haut de chaque page intérieure. */
export const introPhotos = {
  menu: photos.risotto,
  events: photos.stage,
  info: photos.show,
  book: photos.stage,
  private: photos.show,
} satisfies Record<string, IntroPhoto>;
