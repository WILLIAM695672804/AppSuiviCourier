import { useEffect, useState } from "react";

/**
 * Retarde la propagation d'une valeur.
 *
 * Sert la recherche : sans cela, chaque frappe declenche une requete et le
 * registre clignote. 300 ms est le seuil au-dela duquel l'agent percoit une
 * attente — on reste juste en dessous.
 */
export function useValeurDifferee<T>(valeur: T, delai = 300): T {
  const [differee, setDifferee] = useState(valeur);

  useEffect(() => {
    const minuteur = setTimeout(() => setDifferee(valeur), delai);
    return () => clearTimeout(minuteur);
  }, [valeur, delai]);

  return differee;
}
