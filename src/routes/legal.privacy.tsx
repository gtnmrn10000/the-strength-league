import { createFileRoute } from "@tanstack/react-router";
import LegalLayout, {
  LegalSection,
  Placeholder,
  LEGAL_PLACEHOLDERS as P,
} from "@/components/centuria/legal/LegalLayout";

export const Route = createFileRoute("/legal/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Centuria" },
      {
        name: "description",
        content:
          "Comment Centuria collecte, utilise et protège tes données d'entraînement, de nutrition et tes vidéos de PR.",
      },
      { property: "og:title", content: "Politique de confidentialité — Centuria" },
      {
        property: "og:description",
        content: "Données collectées, durées de conservation, IA, vidéos et tes droits sur Centuria.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function PrivacyPage() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      intro="Centuria traite des données de santé et de performance. Voici exactement ce qui est collecté, pourquoi, et comment tu gardes le contrôle."
    >
      <p className="mt-3 text-xs text-arena-muted">
        Dernière mise à jour : <Placeholder>{P.updatedAt}</Placeholder>
      </p>

      <LegalSection title="RESPONSABLE DU TRAITEMENT">
        <p>
          <Placeholder>{P.company}</Placeholder>, <Placeholder>{P.address}</Placeholder>,{" "}
          <Placeholder>{P.siret}</Placeholder>. Contact :{" "}
          <Placeholder>{P.email}</Placeholder>.
        </p>
      </LegalSection>

      <LegalSection title="DONNÉES COLLECTÉES">
        <p>Compte : adresse e-mail, mot de passe chiffré, identifiant technique.</p>
        <p>
          Profil : pseudo, âge, taille, poids, sexe, niveau d'activité, objectif, photo de profil,
          bio. Ces informations servent à calculer tes besoins et ton classement.
        </p>
        <p>
          Entraînement : séances, exercices, charges, répétitions, records, favoris, exercices
          personnalisés.
        </p>
        <p>Nutrition : aliments enregistrés, quantités, calories et macros, pesées et mensurations.</p>
        <p>
          Social : posts, commentaires, hypes, abonnements, votes sur les PR, signalements et
          blocages.
        </p>
        <p>Vidéos de PR : les fichiers que tu envoies pour faire vérifier une performance.</p>
      </LegalSection>

      <LegalSection title="VIDÉOS DE PR">
        <p>
          Une vidéo envoyée avec un record est visible par les autres utilisateurs, car la
          vérification est communautaire : ils votent « Valide » ou « Douteux ». Ne filme pas de
          tiers sans leur accord et évite tout élément permettant de localiser ton domicile.
        </p>
        <p>Supprimer le post ou ton compte supprime la vidéo associée de nos serveurs.</p>
      </LegalSection>

      <LegalSection title="INTELLIGENCE ARTIFICIELLE">
        <p>
          Le Coach et la reconnaissance d'aliments par photo envoient ton message, ta photo ou
          un résumé de ton profil sportif à un fournisseur de modèles d'IA pour générer une réponse.
          Ces contenus ne servent pas à t'identifier publiquement.
        </p>
        <p>
          Les réponses de l'IA sont générées automatiquement, peuvent être inexactes et ne
          constituent ni un avis médical, ni une prescription diététique.
        </p>
      </LegalSection>

      <LegalSection title="NUTRITION ET SANTÉ">
        <p>
          Les besoins caloriques et macros affichés sont des estimations statistiques (formule de
          Mifflin-St Jeor). Elles ne remplacent pas l'avis d'un médecin ou d'un diététicien,
          notamment en cas de pathologie, de grossesse ou de trouble du comportement alimentaire.
        </p>
      </LegalSection>

      <LegalSection title="VISIBILITÉ DE TES DONNÉES">
        <p>
          Sont publics pour les membres connectés : pseudo, photo, bio, grade, XP, posts,
          commentaires, compteurs d'abonnés.
        </p>
        <p>
          Restent privés : e-mail, âge, taille, poids, pesées, journal alimentaire, séances,
          conversations avec le Coach. Ils ne sont lisibles que par toi.
        </p>
      </LegalSection>

      <LegalSection title="CONSERVATION">
        <p>
          Tes données sont conservées tant que ton compte existe. La suppression de compte efface
          tes données personnelles, tes contenus et tes fichiers ; les aliments que tu as ajoutés à
          la base partagée sont conservés de façon anonyme.
        </p>
      </LegalSection>

      <LegalSection title="TES DROITS">
        <p>
          Accès, rectification, effacement, portabilité, opposition. Tu peux exporter toutes tes
          données au format JSON et supprimer ton compte directement depuis Réglages.
        </p>
        <p>
          Pour toute autre demande : <Placeholder>{P.email}</Placeholder>. Tu peux aussi saisir la
          CNIL.
        </p>
      </LegalSection>

      <LegalSection title="HÉBERGEMENT ET SOUS-TRAITANTS">
        <p>
          Hébergement : <Placeholder>{P.host}</Placeholder>. Nous utilisons également un
          fournisseur de base de données et d'authentification, un fournisseur de modèles d'IA et
          la base ouverte Open Food Facts pour les codes-barres.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
