import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

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
  const [Shell, setShell] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("@/components/centuria/Shell").then((mod) => {
      setShell(() => mod.default);
    });
  }, []);

  if (!Shell) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  return <Shell />;
}
