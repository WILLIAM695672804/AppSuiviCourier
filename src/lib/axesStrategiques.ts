/**
 * Les trois axes du plan stratégique du Port autonome de Douala.
 *
 * Ils sont arrêtés et connus — communication de M. KINGUE du 11 août 2026 :
 * « les axes stratégiques sont connus, chaque activité est désormais rattachée
 * à un axe, et on en a trois ». C'est donc un référentiel fermé, pas une saisie
 * libre : l'axe se choisit dans une liste, jamais au clavier.
 *
 * La raison est de fond. Le rattachement d'une activité à un axe n'a de valeur
 * que s'il permet d'agréger — « où va l'effort de l'institution cette année ».
 * Une saisie libre produisait « Digitalisation », « Digitalisation », « Port
 * digital » et « Innovation » pour un seul et même axe, et rendait tout
 * regroupement faux. Trois valeurs fixes, et le total se calcule.
 *
 * Deux libellés par axe. `libelle` est l'énoncé officiel, tel qu'il figure au
 * plan stratégique ; il se lit sur la fiche de l'activité et dans la liste
 * déroulante, où le contexte le porte. `libelleCourt` sert partout ailleurs —
 * registres, plan d'actions, légendes de graphique — parce qu'un énoncé de
 * quatre-vingts caractères ne tient pas dans une colonne, et qu'un axe tronqué
 * ne se distingue plus du suivant.
 *
 * C'est `libelleCourt` qui circule dans le champ `axe` d'une activité : le code
 * technique (« A1 ») n'aurait rien dit à la lecture d'un registre, et l'énoncé
 * complet aurait débordé de partout.
 */
export interface AxeStrategique {
  /** Rang au plan stratégique, affiché devant l'énoncé. */
  code: "A1" | "A2" | "A3";
  libelleCourt: string;
  libelle: string;
}

export const AXES_STRATEGIQUES: AxeStrategique[] = [
  {
    code: "A1",
    libelleCourt: "Port attractif et performant",
    libelle: "Port attractif et performant à l'aide des services sûrs et de qualité",
  },
  {
    code: "A2",
    libelleCourt: "Port compétitif et fluide",
    libelle:
      "Port compétitif par la fluidité du passage portuaire à travers l'amélioration et la densification de l'outil de production",
  },
  {
    code: "A3",
    libelleCourt: "Port innovant et responsable",
    libelle: "Port innovant, digital et sociétalement responsable",
  },
];

/**
 * Le libellé court, seule forme qui circule dans les données.
 *
 * Le type se déduit du tableau plutôt que de le doubler à la main : ajouter un
 * axe au plan stratégique ne doit demander qu'une seule modification.
 */
export type LibelleAxe = (typeof AXES_STRATEGIQUES)[number]["libelleCourt"];

/** Options de la liste déroulante : l'énoncé officiel, précédé de son rang. */
export const OPTIONS_AXES = AXES_STRATEGIQUES.map((axe) => ({
  valeur: axe.libelleCourt,
  libelle: `${axe.code} — ${axe.libelle}`,
}));

/** L'énoncé complet à partir du libellé court, pour la fiche de l'activité. */
export function axeComplet(libelleCourt: string): string {
  const axe = AXES_STRATEGIQUES.find((a) => a.libelleCourt === libelleCourt);
  return axe ? `${axe.code} — ${axe.libelle}` : libelleCourt;
}
