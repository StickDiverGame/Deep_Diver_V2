import { createFileRoute } from "@tanstack/react-router";
import { DiveGame } from "../game/DiveGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Freedive — learn to dive, one skill at a time" },
      {
        name: "description",
        content:
          "A wordless 2D diving game: swim the surface, train your breath hold, equalize, and descend to find your gear.",
      },
      { property: "og:title", content: "Freedive — learn to dive, one skill at a time" },
      {
        property: "og:description",
        content:
          "A wordless 2D diving game: swim the surface, train your breath hold, equalize, and descend to find your gear.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiveGame,
});
