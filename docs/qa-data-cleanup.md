# Données de test (QA) — inventaire

Aucune donnée n'a été supprimée. Ce document liste ce qui est identifiable comme
créé par les passes de test automatisées, pour que le propriétaire décide.

## Critères de reconnaissance

- Pseudo commençant par `QA`, `qa`, ou `athlete_` généré automatiquement.
- Compte créé le 18 ou 19/09/2026 pendant les sessions de test.
- Adresse e-mail en `@qamail.dev`.

## Comptes identifiés (au 19/09/2026)

| user_id | pseudo | créé le | séances | posts | verdict |
| --- | --- | --- | --- | --- | --- |
| 93d4cd7f-6177-4a18-8cfd-cb12b4ce2a51 | athlete_93d4cd | 12/07/2026 | 0 | 0 | ancien compte de démo, à confirmer |
| a8372168-bc8e-426e-ac4e-f57e70e597df | athlete_a83721 | 18/09/2026 | 0 | 1 (record vidéo) | test |
| 4119203c-4836-4908-bf17-4d2c739ba5be | qatester | 19/09/2026 | 1 | 0 | test |
| 837c90b2-0061-4790-920c-04faf2d1adb4 | qauser | 19/09/2026 | 0 | 0 | test |
| e45469a8-dce8-4ac9-9778-51c3e799182b | qauser | 19/09/2026 | 1 | 0 | test |
| 6c2b1c98-acc4-4507-b25b-ddfc20398d0c | qauser | 19/09/2026 | 1 | 0 | test |
| 65bb5192-4f42-4797-8740-96d98c71b9b0 | QAthree | 19/09/2026 | 2 | 0 | test |
| 6bf1d7f7-468f-4337-bc63-b37d704f7fd7 | QAsocial | 19/09/2026 | 0 | 0 | test |
| be1650ae-ef68-4eab-a642-0995b34a2f57 | QAhuit | 19/09/2026 | 3 | 0 | test (compte utilisé pour la QA en cours) |
| 11e745b8-b8e8-42a2-aa00-4af3d960806a | Gaetan | 19/09/2026 | 0 | 0 | **compte potentiellement réel — ne pas supprimer** |

Les publications et commentaires de test créés pendant les passes précédentes ont
déjà été supprimés au fil de l'eau.

## Recommandation

Avant la mise en production, supprimer les comptes marqués « test » via
Réglages → Supprimer mon compte (ou depuis la vue Cloud). Garder `QAhuit`
tant que des tests sont en cours. Ne pas toucher à `Gaetan`.

## Séparation des environnements

Le projet utilise aujourd'hui une seule base pour le préview et la production.
Pour séparer dev / staging / prod il faut un second projet backend (non créable
depuis ici) puis pointer `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`
vers l'environnement voulu au moment du build natif. En attendant, les données
de test et de production cohabitent : nettoyer avant l'ouverture au public.
