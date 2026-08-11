/**
 * Les secteurs d'activités portuaires, pour la ventilation des recouvrements.
 *
 * Le Directeur général demande « le niveau des recouvrements par secteur
 * d'activités portuaires et des autres recettes ». Un montant global ne
 * répondrait pas : ce qu'il cherche, c'est de savoir lequel décroche.
 *
 * Référentiel fermé, pour la même raison que les axes stratégiques
 * (`axesStrategiques.ts`) : un secteur saisi au clavier se serait écrit
 * « Droits de port », « droit de port » et « DP » selon la main, et le total
 * par secteur n'aurait plus rien voulu dire.
 *
 * La distinction porte sur la structure qui produit le chiffre, et c'est elle
 * qui fait la coupure demandée par le Directeur général :
 *
 *   - `exploitation` — les recettes tirées de l'activité du port, constatées
 *     par la Direction de l'exploitation ;
 *   - `autres` — ce qui ne vient pas de l'exploitation du navire ni de la
 *     marchandise, et que la Direction des finances et de la comptabilité
 *     rapporte : domanialité, produits financiers, produits divers.
 *
 * Cette liste est celle des recettes courantes d'un port autonome. Elle est à
 * confronter au plan de comptes du PAD avant la mise en service — c'est une
 * base de travail, pas une nomenclature validée.
 */
export type OrigineSecteur = "exploitation" | "autres";

export interface SecteurPortuaire {
  code: string;
  libelle: string;
  origine: OrigineSecteur;
}

export const SECTEURS_PORTUAIRES: SecteurPortuaire[] = [
  { code: "DPN", libelle: "Droits de port — navire", origine: "exploitation" },
  { code: "DPM", libelle: "Droits de port — marchandise", origine: "exploitation" },
  { code: "MAN", libelle: "Manutention et acconage", origine: "exploitation" },
  { code: "PIL", libelle: "Pilotage, remorquage et amarrage", origine: "exploitation" },
  { code: "STA", libelle: "Stationnement et magasinage", origine: "exploitation" },
  { code: "CON", libelle: "Concessions et amodiations", origine: "exploitation" },
  { code: "DOM", libelle: "Redevances domaniales", origine: "autres" },
  { code: "PRE", libelle: "Prestations de services diverses", origine: "autres" },
  { code: "FIN", libelle: "Produits financiers et exceptionnels", origine: "autres" },
];

/** Les secteurs que rapporte la Direction de l'exploitation. */
export const SECTEURS_EXPLOITATION = SECTEURS_PORTUAIRES.filter((s) => s.origine === "exploitation");

/** Les autres recettes, que rapporte la Direction des finances et de la comptabilité. */
export const SECTEURS_AUTRES = SECTEURS_PORTUAIRES.filter((s) => s.origine === "autres");

export const OPTIONS_SECTEURS = SECTEURS_PORTUAIRES.map((s) => ({
  valeur: s.code,
  libelle: s.libelle,
}));

export function libelleSecteur(code: string): string {
  return SECTEURS_PORTUAIRES.find((s) => s.code === code)?.libelle ?? code;
}
