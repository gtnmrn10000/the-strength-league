import { createFileRoute } from "@tanstack/react-router";
import Shell from "@/components/centuria/Shell";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "CENTURIA — Classe. Vérifie. Récompense." },
      { name: "description", content: "La première plateforme française qui classe, vérifie et récompense les pratiquants de musculation." },
    ],
  }),
});

function Index() {
  return <Shell />;
}
