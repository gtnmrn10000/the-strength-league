import { createFileRoute } from "@tanstack/react-router";
import LegalLayout, {
  LegalSection,
  Placeholder,
  LEGAL_PLACEHOLDERS as P,
} from "@/components/centuria/legal/LegalLayout";

export const Route = createFileRoute("/legal/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Contact & support — Centuria" },
      {
        name: "description",
        content: "Contacter le support Centuria : bug, signalement, données personnelles, suppression de compte.",
      },
      { property: "og:title", content: "Contact & support — Centuria" },
      { property: "og:description", content: "Aide, signalements et demandes liées à tes données." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SupportPage() {
  return (
    <LegalLayout
      title="Contact & support"
      intro="Un bug, une question, un contenu à signaler ? Voici comment nous joindre."
    >
      <LegalSection title="NOUS ÉCRIRE">
        <p>
          E-mail : <Placeholder>{P.email}</Placeholder>
        </p>
        <p>
          Éditeur : <Placeholder>{P.company}</Placeholder>, <Placeholder>{P.address}</Placeholder>
        </p>
        <p>Réponse visée sous quelques jours ouvrés.</p>
      </LegalSection>

      <LegalSection title="SIGNALER UN CONTENU">
        <p>
          Le plus rapide reste le menu « … » sur un post, un commentaire ou un profil : choisis
          « Signaler », le contenu remonte immédiatement à la modération. Tu peux aussi bloquer un
          compte pour ne plus le voir.
        </p>
      </LegalSection>

      <LegalSection title="TES DONNÉES">
        <p>
          Dans Réglages : « Exporter mes données » télécharge un fichier JSON avec ton profil, tes
          séances, ta nutrition et tes records. « Supprimer mon compte » efface définitivement ton
          compte et tes contenus.
        </p>
      </LegalSection>

      <LegalSection title="PROBLÈME DE CONNEXION">
        <p>
          Utilise « Mot de passe oublié » sur l'écran de connexion pour recevoir un lien de
          réinitialisation. Pense à vérifier tes spams.
        </p>
      </LegalSection>

      <LegalSection title="URGENCE SANTÉ">
        <p>
          Centuria n'est pas un service médical. En cas de malaise ou de blessure grave, appelle le
          15 (SAMU) ou le 112.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
