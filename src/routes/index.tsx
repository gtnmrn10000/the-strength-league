import { createFileRoute } from "@tanstack/react-router";
import Shell from "@/components/centuria/Shell";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "CENTURIA — Classe. Vérifie. Récompense." },
      { name: "description", content: "Enregistre tes séances, suis ta progression et fais vérifier tes records par la communauté." },
    ],
  }),
});

function Index() {
  return <Shell />;
}
