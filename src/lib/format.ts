/** Formats d'affichage. Un seul endroit, pour que toute l'application date pareil. */

const DATE_COURTE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_LONGUE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** « 4 août 2026 », « 26 juil. 2026 », « 1er août 2026 ». */
export function formaterDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const texte = DATE_COURTE.format(date);
  // Intl ecrit « 1 août » ; le francais veut « 1er août ».
  return date.getDate() === 1 ? texte.replace(/^1\s/, "1er ") : texte;
}

/**
 * « 1,84 Md F », « 415 M F », « 74 000 F ».
 *
 * Les recettes du port se comptent en milliards : ecrire 1 840 000 000 en
 * toutes lettres dans une colonne de tableau oblige a compter les chiffres
 * pour savoir de quel ordre de grandeur il s'agit. L'abreviation le donne
 * d'un coup d'oeil, et la fiche detaillee garde le montant exact.
 */
export function formaterMontant(francs: number | null): string {
  if (francs === null) return "—";
  const absolu = Math.abs(francs);
  if (absolu >= 1_000_000_000) {
    return `${(francs / 1_000_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} Md F`;
  }
  if (absolu >= 1_000_000) {
    return `${(francs / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M F`;
  }
  return `${francs.toLocaleString("fr-FR")} F`;
}

/** « 4 août 2026 à 10:02 » — pour la fiche et la tracabilite. */
export function formaterDateHeure(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${DATE_LONGUE.format(d)} à ${HEURE.format(d)}`;
}
