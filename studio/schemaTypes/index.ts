import { defineArrayMember, defineField, defineType, type StringRule } from "sanity";

/* Champs bilingues : la structure { fr, en } est celle qu'attend le site. */

const localeString = defineType({
  name: "localeString",
  title: "Texte (FR / EN)",
  type: "object",
  fields: [
    defineField({ name: "fr", title: "Français", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "en", title: "English", type: "string" }),
  ],
});

const localeText = defineType({
  name: "localeText",
  title: "Texte long (FR / EN)",
  type: "object",
  fields: [
    defineField({ name: "fr", title: "Français", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({ name: "en", title: "English", type: "text", rows: 3 }),
  ],
});

const hhmm = (rule: StringRule) => rule.regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "heure au format 18:00" });

const settings = defineType({
  name: "settings",
  title: "Infos de l'établissement",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Nom", type: "string", initialValue: "Beehive Club" }),
    defineField({ name: "tagline", title: "Phrase d'accroche", type: "localeString" }),
    defineField({ name: "address", title: "Adresse", type: "localeString" }),
    defineField({
      name: "geo",
      title: "Coordonnées GPS",
      type: "object",
      fields: [
        defineField({ name: "lat", title: "Latitude", type: "number" }),
        defineField({ name: "lng", title: "Longitude", type: "number" }),
      ],
    }),
    defineField({ name: "phone", title: "Téléphone (affiché)", type: "string", description: "Ex. : +216 22 222 222" }),
    defineField({
      name: "whatsapp",
      title: "Numéro WhatsApp",
      type: "string",
      description: "Chiffres uniquement, avec l'indicatif. Ex. : 21622222222",
      validation: (rule) => rule.regex(/^\d{8,15}$/, { name: "chiffres uniquement" }),
    }),
    defineField({ name: "email", title: "E-mail", type: "string" }),
    defineField({ name: "instagram", title: "Lien Instagram", type: "url" }),
    defineField({ name: "facebook", title: "Lien Facebook", type: "url" }),
    defineField({ name: "priceRange", title: "Fourchette de prix", type: "string", description: "Ex. : 30–90 DT" }),
    defineField({
      name: "reopensOn",
      title: "Fermé pour la saison jusqu'au",
      type: "date",
      description: "Laisser vide quand le rooftop est ouvert.",
    }),
    defineField({
      name: "hours",
      title: "Horaires",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "openingHours",
          fields: [
            defineField({
              name: "day",
              title: "Jour",
              type: "number",
              options: {
                list: [
                  { title: "Lundi", value: 1 },
                  { title: "Mardi", value: 2 },
                  { title: "Mercredi", value: 3 },
                  { title: "Jeudi", value: 4 },
                  { title: "Vendredi", value: 5 },
                  { title: "Samedi", value: 6 },
                  { title: "Dimanche", value: 0 },
                ],
              },
            }),
            defineField({ name: "open", title: "Ouverture", type: "string", validation: hhmm }),
            defineField({ name: "close", title: "Fermeture", type: "string", validation: hhmm }),
          ],
          preview: {
            select: { day: "day", open: "open", close: "close" },
            prepare: ({ day, open, close }) => ({
              title: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][day ?? 0],
              subtitle: open && close ? `${open} – ${close}` : "Fermé",
            }),
          },
        }),
      ],
    }),
    defineField({ name: "dressCode", title: "Tenue", type: "localeText" }),
    defineField({
      name: "entryRules",
      title: "Conditions d'entrée",
      type: "array",
      of: [defineArrayMember({ type: "localeString" })],
    }),
    defineField({
      name: "faq",
      title: "Questions fréquentes",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          fields: [
            defineField({ name: "question", title: "Question", type: "localeString" }),
            defineField({ name: "answer", title: "Réponse", type: "localeText" }),
          ],
          preview: { select: { title: "question.fr" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Infos de l'établissement" }) },
});

const menuCategory = defineType({
  name: "menuCategory",
  title: "Rubrique de la carte",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Titre", type: "localeString", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      title: "Identifiant",
      type: "slug",
      options: { source: "title.fr" },
      description: "« signatures » et « a-partager » sont mis en avant sur l'accueil.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "note", title: "Note sous le titre", type: "localeString" }),
    defineField({ name: "order", title: "Ordre d'affichage", type: "number", initialValue: 10 }),
  ],
  orderings: [{ title: "Ordre", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title.fr", subtitle: "slug.current" } },
});

const menuItem = defineType({
  name: "menuItem",
  title: "Boisson ou plat",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Nom", type: "localeString", validation: (rule) => rule.required() }),
    defineField({ name: "description", title: "Description", type: "localeString" }),
    defineField({
      name: "category",
      title: "Rubrique",
      type: "reference",
      to: [{ type: "menuCategory" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Prix (DT)",
      type: "number",
      description: "Laisser vide pour ne pas afficher de prix.",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "tags",
      title: "Étiquettes",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: {
        list: [
          { title: "Signature", value: "signature" },
          { title: "Sans alcool", value: "sans-alcool" },
          { title: "Végétarien", value: "veggie" },
          { title: "À partager", value: "a-partager" },
        ],
      },
    }),
    defineField({ name: "order", title: "Ordre dans la rubrique", type: "number", initialValue: 10 }),
  ],
  preview: { select: { title: "name.fr", subtitle: "category.title.fr" } },
});

const event = defineType({
  name: "event",
  title: "Soirée",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Titre", type: "localeString", validation: (rule) => rule.required() }),
    defineField({ name: "date", title: "Date", type: "date", validation: (rule) => rule.required() }),
    defineField({
      name: "startTime",
      title: "Heure de début",
      type: "string",
      initialValue: "21:00",
      validation: (rule) => rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "heure au format 21:00" }),
    }),
    defineField({ name: "lineup", title: "Artiste / DJ", type: "localeString" }),
    defineField({ name: "description", title: "Description", type: "localeText" }),
    defineField({ name: "genre", title: "Style", type: "string", description: "Ex. : Deep house, Live, Lounge" }),
    defineField({ name: "ticketUrl", title: "Lien billetterie", type: "url", description: "Page Teskerti de la soirée, si elle est payante" }),
  ],
  orderings: [{ title: "Date", name: "date", by: [{ field: "date", direction: "asc" }] }],
  preview: { select: { title: "title.fr", subtitle: "date" } },
});

const galleryImage = defineType({
  name: "galleryImage",
  title: "Photo de la galerie",
  type: "document",
  fields: [
    defineField({ name: "image", title: "Photo", type: "image", options: { hotspot: true }, validation: (rule) => rule.required() }),
    defineField({ name: "caption", title: "Légende", type: "localeString" }),
    defineField({ name: "alt", title: "Description pour l'accessibilité", type: "localeString" }),
    defineField({
      name: "hour",
      title: "Heure de la photo",
      type: "string",
      initialValue: "19:00",
      validation: hhmm,
    }),
    defineField({ name: "order", title: "Ordre", type: "number", initialValue: 10 }),
  ],
  preview: { select: { title: "caption.fr", media: "image" } },
});

export const schemaTypes = [localeString, localeText, settings, menuCategory, menuItem, event, galleryImage];
