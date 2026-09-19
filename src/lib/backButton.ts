/**
 * Petit registre de gestionnaires pour le bouton retour matériel Android.
 * Le dernier handler enregistré (ex. une feuille/dialogue ouverte) est
 * prioritaire ; il doit retourner `true` s'il a consommé l'événement.
 */
type BackHandler = () => boolean;

const stack: BackHandler[] = [];

/** Enregistre un handler ; retourne une fonction de désinscription. */
export function pushBackHandler(fn: BackHandler): () => void {
  stack.push(fn);
  return () => {
    const idx = stack.lastIndexOf(fn);
    if (idx !== -1) stack.splice(idx, 1);
  };
}

/** Appelle le handler le plus récent ; retourne true si l'événement a été consommé. */
export function handleBackButton(): boolean {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i]()) return true;
  }
  return false;
}
