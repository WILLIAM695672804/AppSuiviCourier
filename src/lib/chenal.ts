/**
 * Les points du chenal où se relève une profondeur.
 *
 * Référentiel fermé, comme les axes stratégiques et les secteurs portuaires :
 * la cote d'un point ne se compare dans le temps que si le point porte
 * toujours le même nom. « Passe d'entrée » et « passe d'entree » auraient
 * produit deux séries au lieu d'une.
 *
 * Le tirant d'eau garanti accompagne le point, et non le relevé : c'est un
 * engagement d'exploitation, qui ne change qu'avec une décision. Le demander à
 * chaque relevé aurait exposé la Régie à le saisir de travers, et un écart
 * calculé sur une garantie fausse est pire que pas d'écart du tout.
 *
 * Les valeurs ci-dessous sont plausibles pour le port de Douala mais ne
 * sortent d'aucun document officiel : à confronter aux arrêtés d'exploitation
 * avant la mise en service.
 */
export interface PointChenal {
  nom: string;
  /** Tirant d'eau garanti en ce point, en mètres. */
  garantie: number;
}

export const POINTS_CHENAL: PointChenal[] = [
  { nom: "Passe d'entrée", garantie: 11.5 },
  { nom: "Chenal d'accès — km 12", garantie: 10.5 },
  { nom: "Souille de Bonabéri", garantie: 9.5 },
  { nom: "Poste à quai 15", garantie: 10.8 },
];

export const OPTIONS_POINTS_CHENAL = POINTS_CHENAL.map((p) => ({
  valeur: p.nom,
  libelle: `${p.nom} — garantie ${p.garantie.toLocaleString("fr-FR", { minimumFractionDigits: 1 })} m`,
}));

export function garantieDuPoint(nom: string): number | null {
  return POINTS_CHENAL.find((p) => p.nom === nom)?.garantie ?? null;
}
