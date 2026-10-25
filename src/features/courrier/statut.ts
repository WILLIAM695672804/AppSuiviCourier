import type { TonEtiquette } from "@/components/ui/Etiquette";
import type { CourrierResume, EtapeCourrier } from "@/types/courrier";

/**
 * Traduction de l'etape technique en statut lisible par l'agent.
 *
 * Le registre n'affiche pas les sept etapes une a une : il en montre cinq
 * groupes, parce que l'agent d'accueil raisonne en « ou en est ce courrier »
 * et non en transitions. Le depassement de delai prime sur l'etape — c'est
 * l'information qui declenche une action.
 *
 * `AFFECTE` et `ACCEPTE` se groupent sous « Distribué » : de l'exterieur, un
 * courrier remis a un agent est distribue, qu'il ait ou non signe le cahier.
 * La difference se voit sur la fiche et dans le cahier de decharge (A-11), la
 * ou elle sert.
 */
const GROUPES: Record<EtapeCourrier, { libelle: string; ton: TonEtiquette }> = {
  ENREGISTRE: { libelle: "Non coté", ton: "alerte" },
  COTE: { libelle: "Coté", ton: "accent" },
  AFFECTE: { libelle: "Distribué", ton: "neutre" },
  ACCEPTE: { libelle: "Distribué", ton: "neutre" },
  EN_TRAITEMENT: { libelle: "Traitement", ton: "neutre" },
  RESTITUE: { libelle: "Restitué", ton: "confidentiel" },
  CLOTURE: { libelle: "Clôturé", ton: "succes" },
};

export function statutAffiche(courrier: CourrierResume): { libelle: string; ton: TonEtiquette } {
  const enRetard = (courrier.delai?.joursDepassement ?? 0) > 0;
  if (enRetard && courrier.etape !== "CLOTURE") {
    return { libelle: "Hors délai", ton: "danger" };
  }
  return GROUPES[courrier.etape];
}

/** Libelle complet de l'etape, pour la fiche et la tracabilite. */
export const LIBELLE_ETAPE: Record<EtapeCourrier, string> = {
  ENREGISTRE: "Enregistré",
  COTE: "Coté",
  AFFECTE: "Affecté",
  ACCEPTE: "Reçu par l'agent",
  EN_TRAITEMENT: "En traitement",
  RESTITUE: "Restitué au responsable",
  CLOTURE: "Clôturé",
};
