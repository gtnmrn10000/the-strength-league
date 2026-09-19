import { createFileRoute } from "@tanstack/react-router";
import LegalLayout, {
  LegalSection,
  Placeholder,
  LEGAL_PLACEHOLDERS as P,
} from "@/components/centuria/legal/LegalLayout";

export const Route = createFileRoute("/legal/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Conditions générales d'utilisation — Centuria" },
      {
        name: "description",
        content:
          "Règles d'utilisation de Centuria : compte, contenus, vérification communautaire des PR, abonnement et responsabilités.",
      },
      { property: "og:title", content: "Conditions générales d'utilisation — Centuria" },
      {
        property: "og:description",
        content: "Compte, contenus publiés, vérification des records et limites de responsabilité.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function TermsPage() {
  return (
    <LegalLayout
      title="Conditions générales"
      intro="En créant un compte Centuria, tu acceptes les règles ci-dessous."
    >
      <p className="mt-3 text-xs text-arena-muted">
        Dernière mise à jour : <Placeholder>{P.updatedAt}</Placeholder>
      </p>

      <LegalSection title="ÉDITEUR">
        <p>
          <Placeholder>{P.company}</Placeholder> — <Placeholder>{P.address}</Placeholder> —{" "}
          <Placeholder>{P.siret}</Placeholder>. Directeur de la publication :{" "}
          <Placeholder>{P.publisher}</Placeholder>. Hébergeur :{" "}
          <Placeholder>{P.host}</Placeholder>.
        </p>
      </LegalSection>

      <LegalSection title="COMPTE">
        <p>
          Tu dois avoir au moins 16 ans et fournir des informations exactes. Un seul compte par
          personne. Tu es responsable de la confidentialité de ton mot de passe.
        </p>
      </LegalSection>

      <LegalSection title="CONTENUS">
        <p>
          Tu restes propriétaire de tes contenus et tu nous accordes le droit de les afficher dans
          l'application pour la faire fonctionner (feed, profil, classement).
        </p>
        <p>
          Sont interdits : contenus violents, haineux, sexuels, illégaux, dangereux, la promotion de
          produits dopants, l'usurpation d'identité, le spam et la publication de la vidéo d'autrui
          sans son accord.
        </p>
      </LegalSection>

      <LegalSection title="VÉRIFICATION DES RECORDS">
        <p>
          Les records avec vidéo sont jugés par la communauté. Un PR devient « vérifié » après un
          solde suffisant de votes « Valide » et peut être marqué « Contesté ». Tricher pour
          gonfler son grade entraîne la suppression des records et, en cas de récidive, du compte.
        </p>
        <p>Grades, XP et classements sont ludiques et n'ont aucune valeur officielle ni sportive.</p>
      </LegalSection>

      <LegalSection title="MODÉRATION">
        <p>
          Tu peux signaler un contenu ou un profil et bloquer un utilisateur. Nous pouvons retirer
          un contenu ou suspendre un compte en cas de manquement à ces conditions.
        </p>
      </LegalSection>

      <LegalSection title="ABONNEMENT">
        <p>
          Certaines fonctions peuvent relever d'un abonnement payant. Les prix, la durée et les
          conditions de résiliation sont affichés avant tout paiement :{" "}
          <Placeholder>[À COMPLÉTER — modalités d'abonnement et de remboursement]</Placeholder>.
        </p>
      </LegalSection>

      <LegalSection title="SANTÉ ET RESPONSABILITÉ">
        <p>
          Centuria est un outil de suivi sportif, pas un service médical. Les programmes, conseils
          du Coach et estimations nutritionnelles sont indicatifs. Demande l'avis d'un
          professionnel de santé avant de commencer ou d'intensifier un entraînement, et arrête en
          cas de douleur.
        </p>
        <p>
          Tu t'entraînes sous ta seule responsabilité. Dans la limite permise par la loi, notre
          responsabilité ne saurait être engagée pour une blessure liée à l'usage de l'application.
        </p>
      </LegalSection>

      <LegalSection title="RÉSILIATION">
        <p>
          Tu peux supprimer ton compte à tout moment depuis Réglages. La suppression est définitive.
        </p>
      </LegalSection>

      <LegalSection title="DROIT APPLICABLE">
        <p>
          Droit français, sous réserve des dispositions protectrices des consommateurs.
          Contact : <Placeholder>{P.email}</Placeholder>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
