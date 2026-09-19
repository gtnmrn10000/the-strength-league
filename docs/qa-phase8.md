# CENTURIA — QA final (Phase 8)

Testé sur le preview local, viewports 375×667 et 360×640, comptes réels créés via l'app.

## Parcours vérifiés (OK)

| Parcours | Résultat |
| --- | --- |
| Création de compte e-mail + mot de passe | OK (profil créé en base) |
| Connexion / mauvais identifiants | OK, message « E-mail ou mot de passe incorrect. » |
| Déconnexion + rechargement | OK, aucune session anonyme recréée |
| Mot de passe oublié → page /reset-password | OK (lien invalide correctement détecté) |
| Onboarding (pseudo, âge, taille, poids, objectif) | OK, enregistré en base |
| Séance : édition kg/reps, validation de série, minuteur +30 s / Passer | OK |
| Fin de séance (séries partiellement validées) | OK, confirmation puis enregistrement réel |
| Progression, volume, derniers records | OK, calculés depuis les séances réelles |
| Bibliothèque : recherche sans accents, filtres muscle/matériel | OK |
| Nutrition : saisie manuelle, journal, macros du jour | OK |
| Feed : hype, commentaire (compteur réel), notifications | OK |
| Découvrir : recherche par pseudo, suivre | OK |
| Classement : PR vérifiés uniquement, aucun faux profil | OK |
| Paramètres : abonnement, export JSON, pages légales, suppression | OK |
| Premium sans achat | Correctement verrouillé (Coach IA / Photo IA) |
| Overflow horizontal 375 et 360 px | Aucun |
| Erreurs console | Aucune |

## Corrections apportées en Phase 8

1. Séances : seules les séries réellement validées sont enregistrées (avant, les séries non faites gonflaient volume et records).
2. Premium : la colonne `is_premium` avait encore la valeur par défaut `true` (reliquat du mode QA) — tout nouveau compte était Premium. Défaut remis à `false` et accès retiré aux comptes concernés sans achat.
3. Onboarding : « PR vérifiés par IA » → « PR vérifiés par la communauté » (conforme au système de votes).
4. Écran d'authentification : le titre affiche maintenant « CONNEXION » en mode connexion.
5. Accessibilité : titre manquant sur la fenêtre d'abonnement (avertissement lecteur d'écran).
6. Sécurité : le profil complet (poids, âge, premium) n'est plus lisible par les autres — lectures publiques via la vue `profiles_public` ; fichiers `avatars` réservés aux comptes connectés ; RPC d'abonnement réservée aux comptes connectés.

## Checklist de lancement

### Prêt
- Comptes e-mail + mot de passe, déconnexion, réinitialisation
- Entraînement complet (187 exercices, programmes, logger, progression, records)
- Nutrition (scan code-barres, recherche, saisie manuelle, journal, streak)
- Social (feed, hypes, commentaires, notifications, blocage, signalement, recherche)
- PR vidéo + vérification communautaire, classement réel
- Pages légales, export de données, suppression de compte
- Projets iOS / Android Capacitor générés

### Bloqué par des accès externes
- Paiements réels : clés publiques RevenueCat iOS/Android, identifiants produits App Store / Google Play, secret du webhook
- Connexion Google / Apple : clients OAuth à créer et à renseigner
- Champs juridiques (société, adresse, SIRET, hébergeur, e-mail de contact) encore en « À COMPLÉTER »

### Bloqué par les comptes développeur
- Certificat Apple Developer et profil de provisioning (build iOS signé)
- Clé de signature Android et compte Google Play (build de production)
- Envoi des e-mails de confirmation depuis un domaine vérifié

## Points connus, assumés

- Le feed social est public entre comptes connectés : posts, commentaires, hypes, votes et PR sont lisibles par tous les membres (c'est le principe du réseau). Les données sensibles (poids, âge, taille, e-mail, abonnement) ne sont jamais exposées.
- La confirmation d'e-mail est active : un nouveau compte doit cliquer le lien reçu avant de se connecter.
