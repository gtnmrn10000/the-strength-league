import { createFileRoute } from "@tanstack/react-router";
import LegalLayout, { LegalSection } from "@/components/centuria/legal/LegalLayout";

export const Route = createFileRoute("/legal/rules")({
  component: RulesPage,
  head: () => ({
    meta: [
      { title: "Règles de la communauté — Centuria" },
      {
        name: "description",
        content: "Les règles de la communauté Centuria : ce qui est interdit et comment la modération fonctionne.",
      },
      { property: "og:title", content: "Règles de la communauté — Centuria" },
      { property: "og:description", content: "Dopage, harcèlement, nudité, faux records : les règles et sanctions." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function RulesPage() {
  return (
    <LegalLayout
      title="Règles de la communauté"
      intro="Centuria est une communauté de sport. Ces règles s'appliquent à tous les posts, commentaires, vidéos de PR et profils."
    >
      <LegalSection title="INTERDIT — DOPAGE ET PRODUITS DANGEREUX">
        <p>
          Aucune promotion, vente ou incitation à l'usage de stéroïdes, SARMs, hormones de
          croissance ou autres produits dopants. Les posts qui en font la publicité sont supprimés.
        </p>
      </LegalSection>

      <LegalSection title="INTERDIT — HARCÈLEMENT ET HAINE">
        <p>
          Insultes, menaces, moqueries répétées, propos racistes, sexistes, homophobes ou
          discriminatoires ne sont pas tolérés, en post, en commentaire ou en message.
        </p>
      </LegalSection>

      <LegalSection title="INTERDIT — NUDITÉ ET CONTENU CHOQUANT">
        <p>
          Pas de nudité, de contenu à caractère sexuel, ni d'images violentes ou choquantes, même
          sous couvert de « motivation » ou d'humour.
        </p>
      </LegalSection>

      <LegalSection title="INTERDIT — FAUX RECORDS">
        <p>
          Truquer une vidéo de PR, usurper la performance d'un tiers ou manipuler délibérément le
          vote communautaire (faux comptes, échange de votes) est une fraude sanctionnée.
        </p>
      </LegalSection>

      <LegalSection title="AUTRES CONTENUS INTERDITS">
        <p>Spam, publicité non sollicitée, liens frauduleux, faux comptes, usurpation d'identité.</p>
      </LegalSection>

      <LegalSection title="SANCTIONS">
        <p>
          Selon la gravité : masquage du contenu, avertissement, suspension temporaire, ou
          suppression définitive du compte. Un compte bloqué par la modération ne peut plus
          interagir avec les autres membres.
        </p>
      </LegalSection>

      <LegalSection title="COMMENT ÇA MARCHE">
        <p>
          Tu peux signaler un post, un commentaire ou un profil via le menu « … » ou bloquer un
          compte à tout moment (Réglages → Comptes bloqués).
        </p>
        <p>
          La modération est assurée par une équipe humaine. Un filtrage automatique minimal bloque
          uniquement les cas évidents (spam grossier, liens vers des sites de produits dopants) ;
          il ne remplace pas une revue humaine et ne garantit pas de détecter tout contenu abusif.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
