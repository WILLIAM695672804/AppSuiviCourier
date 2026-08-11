/**
 * La période observée par les restitutions.
 *
 * Toutes les restitutions du descriptif fonctionnel sont datées : la matrice
 * de scoring est mensuelle, les rapports d'activité sont mensuels, le plan
 * d'actions est annuel, les indicateurs se comparent d'une année à l'autre.
 *
 * Pas de dates libres : une période arbitraire ne se compare à rien, et le
 * classement des structures n'a de sens que sur le mois clos.
 */
export type Granularite = "mois" | "trimestre" | "annee";

export interface Periode {
  granularite: Granularite;
  /** Année civile. */
  annee: number;
  /** 1 à 12 pour un mois, 1 à 4 pour un trimestre, ignoré pour une année. */
  rang: number;
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Nombre de rangs que compte une année, selon la granularité. */
const RANGS: Record<Granularite, number> = { mois: 12, trimestre: 4, annee: 1 };

export function libellePeriode({ granularite, annee, rang }: Periode): string {
  if (granularite === "annee") return `Année ${annee}`;
  if (granularite === "trimestre") return `T${rang} ${annee}`;
  return `${MOIS[rang - 1]} ${annee}`;
}

export function decalerPeriode(periode: Periode, pas: number): Periode {
  if (periode.granularite === "annee") {
    return { ...periode, annee: periode.annee + pas };
  }

  // Le rang court de 1 à `total` : on repasse par une base 0 pour reporter
  // proprement le changement d'année dans les deux sens.
  const total = RANGS[periode.granularite];
  const index = periode.rang - 1 + pas;
  return {
    ...periode,
    annee: periode.annee + Math.floor(index / total),
    rang: (((index % total) + total) % total) + 1,
  };
}

/** Période courante, selon l'horloge du poste. */
export function periodeCourante(granularite: Granularite = "mois"): Periode {
  const maintenant = new Date();
  const mois = maintenant.getMonth() + 1;
  return {
    granularite,
    annee: maintenant.getFullYear(),
    rang: granularite === "trimestre" ? Math.ceil(mois / 3) : granularite === "mois" ? mois : 1,
  };
}

export function memePeriode(a: Periode, b: Periode): boolean {
  return (
    a.granularite === b.granularite &&
    a.annee === b.annee &&
    (a.granularite === "annee" || a.rang === b.rang)
  );
}
