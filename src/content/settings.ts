import type { SiteSettings } from "./types";

/**
 * Infos de l'établissement.
 * ⚠️ À VALIDER avec l'établissement avant la mise en ligne : tenue, règles d'entrée
 * et FAQ sont des propositions pour la démo.
 * Repris du profil Instagram @beehiveclub et de ses affiches (novembre 2026), de la fiche
 * Google « Bee Hive Club » et de la page Tunis Events du lieu : adresse, infoline, horaires.
 */
export const settings: SiteSettings = {
  name: "Beehive Club",
  shortName: "Beehive",
  tagline: {
    fr: "Join the hive, stay alive : club et restaurant lounge à l'Hôtel Acquaviva, Gammarth",
    en: "Join the hive, stay alive: club and lounge restaurant at Hôtel Acquaviva, Gammarth",
  },
  address: {
    fr: "Hôtel Acquaviva, Gammarth",
    en: "Hôtel Acquaviva, Gammarth, Tunis",
  },
  geo: { lat: 36.9364631, lng: 10.2582804 },
  // Infoline des affiches.
  phone: "+216 20 910 000",
  // Numéro WhatsApp non confirmé : boutons WhatsApp masqués. À renseigner si l'infoline est sur WhatsApp.
  whatsapp: "",
  email: "",
  instagram: "https://www.instagram.com/beehiveclub/",
  facebook: "https://www.facebook.com/BeeHiveClubTN",
  priceRange: "",
  // Fermeture saisonnière : date de réouverture (ex. "2027-06-01"), ou null quand le lieu est ouvert.
  reopensOn: null,
  // Horaires de la fiche Google (20 h 30 – 4 h, tous les soirs). Tunis Events indique encore
  // « 17 h 30, fermé le mardi », alors qu'il y a un spectacle le mardi : à confirmer.
  hours: [
    { day: 1, open: "20:30", close: "04:00" },
    { day: 2, open: "20:30", close: "04:00" },
    { day: 3, open: "20:30", close: "04:00" },
    { day: 4, open: "20:30", close: "04:00" },
    { day: 5, open: "20:30", close: "04:00" },
    { day: 6, open: "20:30", close: "04:00" },
    { day: 0, open: "20:30", close: "04:00" },
  ],
  dressCode: {
    fr: "Tenue de soirée soignée. Pas de tenue de sport.",
    en: "Smart evening wear. No sportswear.",
  },
  entryRules: [
    {
      fr: "Votre table est confirmée par téléphone ou par message, avec son emplacement : présentez la confirmation à l'entrée.",
      en: "Your table is confirmed by phone or message, with its location: show the confirmation at the door.",
    },
    {
      fr: "Les soirs de spectacle, le prix et l'emplacement de chaque formule sont indiqués avant de réserver, sans surprise à la porte.",
      en: "On show nights, the price and location of each option are shown before you book, with no surprises at the door.",
    },
    {
      fr: "Accès réservé aux plus de 18 ans, pièce d'identité possible à l'entrée.",
      en: "Over 18s only. You may be asked for ID at the door.",
    },
    {
      fr: "Les tables réservées sont gardées 30 minutes après l'heure prévue.",
      en: "Booked tables are held for 30 minutes after the agreed time.",
    },
  ],
  faq: [
    {
      question: { fr: "Faut-il réserver ?", en: "Do I need to book?" },
      answer: {
        fr: "Les soirs de spectacle, oui : envoyez votre demande en ligne, l'équipe vous confirme votre table et son emplacement par téléphone ou par message.",
        en: "On show nights, yes: send your request online and the team confirms your table and its location by phone or message.",
      },
    },
    {
      question: { fr: "Quel est le spectacle de ce soir ?", en: "What's on tonight?" },
      answer: {
        fr: "Chaque soir a son artiste, avec DJ Alvez aux platines : il est affiché en haut de la page d'accueil et dans le programme de la semaine.",
        en: "Every night has its own artist, with DJ Alvez on the decks: it's shown at the top of the home page and in the weekly programme.",
      },
    },
    {
      question: { fr: "Peut-on dîner avant le spectacle ?", en: "Can we have dinner before the show?" },
      answer: {
        fr: "Oui, le restaurant lounge vous accueille dès l'ouverture, à 20 h 30.",
        en: "Yes, the lounge restaurant welcomes you from opening time, 8:30 pm.",
      },
    },
    {
      question: { fr: "Peut-on fêter un anniversaire ?", en: "Can we celebrate a birthday?" },
      answer: {
        fr: "Oui : indiquez-le dans votre réservation. À partir de 13 personnes, ou pour privatiser un espace, envoyez une demande depuis la page Privatisation.",
        en: "Yes: mention it in your booking. From 13 guests, or to book an area privately, send a request from the Private events page.",
      },
    },
  ],
  // Lien « ijaapp.web.app » de la bio Instagram : la page Beehive sur l'application IJA.
  bookingApp: {
    name: "IJA",
    web: "https://ijaapp.web.app/link/yykba",
    ios: "https://apps.apple.com/app/id1464497270",
  },
};
