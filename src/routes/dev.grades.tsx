import { createFileRoute, redirect } from "@tanstack/react-router";
import GradeQaPreview from "@/components/centuria/grades/GradeQaPreview";

export const Route = createFileRoute("/dev/grades")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw redirect({ to: "/" });
  },
  component: GradeQaPreview,
  head: () => ({
    meta: [
      { title: "Aperçu des grades — Centuria" },
      { name: "description", content: "Aperçu local des emblèmes de grades Centuria." },
      { property: "og:title", content: "Aperçu des grades — Centuria" },
      { property: "og:description", content: "Aperçu local des emblèmes de grades Centuria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});