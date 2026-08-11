import type { TonEtiquette } from "@/components/ui/Etiquette";
import type { CourrierResume, EtapeCourrier } from "@/types/courrier";

/**
 * Traduction de l'etape technique en statut lisible par l'agent.
 *
 * Le registre n'affiche pas les neuf etapes du circuit : il en montre six
 * groupes, parce que l'agent d'accueil raisonne en « ou en est ce courrier »
 * et non en transitions. Le depassement de delai prime sur l'etape — c'est
 * l'information qui declenche une action.
 */
const GROUPES: Record<EtapeCourrier, { libelle: string; ton: TonEtiquette }> = {
  ENREGISTRE: { libelle: "Non coté", ton: "alerte" },
  COTE: { libelle: "Coté", ton: "accent" },
  TRANSMIS: { libelle: "Coté", ton: "accent" },
  AFFECTE: { libelle: "Traitement", ton: "neutre" },
  EN_TRAITEMENT: { libelle: "Traitement", ton: "neutre" },
  EN_VALIDATION: { libelle: "Validation", ton: "confidentiel" },
  SIGNE: { libelle: "Validation", ton: "confidentiel" },
  PARTI: { libelle: "Parti", ton: "accent" },
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
  TRANSMIS: "Transmis",
  AFFECTE: "Affecté",
  EN_TRAITEMENT: "En traitement",
  EN_VALIDATION: "En validation",
  SIGNE: "Signé",
  PARTI: "Parti",
  CLOTURE: "Clôturé",
};
