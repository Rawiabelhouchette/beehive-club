import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || "remplacez-moi";
const dataset = process.env.SANITY_STUDIO_DATASET || "production";

export default defineConfig({
  name: "beehive",
  title: "Beehive Club",
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Contenu")
          .items([
            // Un seul document « Infos de l'établissement ».
            S.listItem()
              .title("Infos de l'établissement")
              .id("settings")
              .child(S.document().schemaType("settings").documentId("settings")),
            S.divider(),
            S.documentTypeListItem("event").title("Soirées"),
            S.documentTypeListItem("menuCategory").title("Rubriques de la carte"),
            S.documentTypeListItem("menuItem").title("Boissons et plats"),
            S.documentTypeListItem("galleryImage").title("Galerie"),
          ]),
    }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
  document: {
    // Pas de bouton « Créer » pour le document unique des réglages.
    newDocumentOptions: (prev) => prev.filter((item) => item.templateId !== "settings"),
  },
});
