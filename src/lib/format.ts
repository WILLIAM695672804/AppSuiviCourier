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

const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

/**
 * Une date lisible, ou `null` si la chaine n'en est pas une.
 *
 * `Intl.DateTimeFormat.format()` **leve** sur une date invalide — un
 * `RangeError: Invalid time value` qui remonte jusqu'a la limite d'erreur du
 * routeur et remplace l'ecran entier par une trace de pile. C'est arrive : le
 * serveur rendait « 16 aout 2026 » la ou le front attendait de l'ISO, et la
 * vue d'ensemble du Directeur general ne s'ouvrait plus du tout.
 *
 * Le contrat est retabli cote serveur. Ce garde-fou reste : un champ de date
 * mal forme doit couter un tiret dans une mention, pas une page.
 */
function dateValide(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** « 4 août 2026 », « 26 juil. 2026 », « 1er août 2026 ». */
export function formaterDate(iso: string | null): string {
  if (!iso) return "—";
  const date = dateValide(iso);
  if (!date) return "—";
  const texte = DATE_COURTE.format(date);
  // Intl ecrit « 1 août » ; le francais veut « 1er août ».
  return date.getDate() === 1 ? texte.replace(/^1\s/, "1er ") : texte;
}

/**
 * « août 2026 » — la période d'une activité, qui se saisit au mois.
 *
 * Un plan d'actions annuel s'écrit en mois : « de mars à décembre ». Le
 * serveur garde une date pleine, parce que le retard et l'avancement attendu
 * se calculent au jour (ADR 047) ; afficher ce quantième donnerait à croire
 * qu'il a été décidé, alors qu'il est posé par convention — premier jour du
 * mois au début, dernier à la fin.
 *
 * Accepte aussi bien `AAAA-MM` que `AAAA-MM-JJ` : la saisie envoie le premier,
 * la lecture rend le second.
 */
export function formaterMois(iso: string | null): string {
  if (!iso) return "—";
  // « 2026-08 » n'est pas une date pour `new Date` selon les moteurs : le jour
  // est ajouté avant l'analyse plutôt que de dépendre de leur tolérance.
  const date = dateValide(iso.length === 7 ? `${iso}-01` : iso);
  if (!date) return "—";
  return MOIS.format(date);
}

/** Le mois d'une date pleine, pour pré-remplir un `<input type="month">`. */
export function moisDeLaDate(iso: string | null): string {
  return iso ? iso.slice(0, 7) : "";
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
  const d = dateValide(iso);
  if (!d) return "—";
  return `${DATE_LONGUE.format(d)} à ${HEURE.format(d)}`;
}
