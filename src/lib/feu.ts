/**
 * Le code couleur vert / orange / rouge, et le seuil qui le décide.
 *
 * Séparé du composant `Feu` parce que la règle sert aussi hors affichage :
 * pour trier un classement par criticité, pour compter les structures en
 * alerte, pour décider si une relance part. Un écran qui recalculerait ses
 * propres seuils finirait par contredire la pastille affichée juste à côté.
 *
 * Les valeurs sont provisoires : elles viendront du dictionnaire des
 * indicateurs, que la DSR administre. En attendant, elles sont ici, en un
 * seul endroit.
 */
export type NiveauFeu = "vert" | "orange" | "rouge" | "inconnu";

export const SEUIL_VERT = 85;
export const SEUIL_ORANGE = 60;

export function feuDepuisTaux(taux: number | null | undefined): NiveauFeu {
  if (taux === null || taux === undefined) return "inconnu";
  if (taux >= SEUIL_VERT) return "vert";
  if (taux >= SEUIL_ORANGE) return "orange";
  return "rouge";
}

/**
 * Le ton d'une carte d'indicateur, depuis le feu que le serveur a calculé.
 *
 * « Inconnu » prend le ton neutre et non le rouge : une mesure absente n'est
 * pas une mauvaise mesure, et les confondre ferait paraître en alerte tout ce
 * qui n'est pas encore renseigné (ADR 011).
 */
export const TON_PAR_FEU = {
  vert: "succes",
  orange: "alerte",
  rouge: "danger",
  inconnu: "accent",
} as const satisfies Record<NiveauFeu, "accent" | "succes" | "alerte" | "danger">;

/** Ordre de gravité, pour trier une liste « les plus critiques d'abord ». */
export const GRAVITE: Record<NiveauFeu, number> = {
  rouge: 0,
  orange: 1,
  inconnu: 2,
  vert: 3,
};
