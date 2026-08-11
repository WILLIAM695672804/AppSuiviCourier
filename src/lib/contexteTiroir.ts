import { createContext, use } from "react";

/**
 * Ouverture du tiroir de navigation, sur téléphone.
 *
 * Le bouton qui l'ouvre vit dans l'en-tête d'écran, pas dans le tiroir : c'est
 * la seule place visible quand la barre latérale est repliée. Comme l'en-tête
 * est rendu par chacun des écrans, un contexte évite d'ajouter une propriété
 * à vingt-trois signatures.
 *
 * Sur un poste de bureau, aucun fournisseur n'est monté et le contexte reste
 * nul : l'en-tête n'affiche alors pas de bouton, ce qui est exactement ce
 * qu'on veut.
 */
export interface EtatTiroir {
  ouvert: boolean;
  ouvrir: () => void;
  fermer: () => void;
}

export const ContexteTiroir = createContext<EtatTiroir | null>(null);

export function useTiroir(): EtatTiroir | null {
  return use(ContexteTiroir);
}
