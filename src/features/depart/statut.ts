import type { TonEtiquette } from "@/components/ui/Etiquette";
import type { EtapeDepart } from "@/types/depart";

/** Libelles et tons du circuit depart, seul endroit ou ils sont ecrits. */
export const STATUT_DEPART: Record<EtapeDepart, { libelle: string; ton: TonEtiquette }> = {
  BROUILLON: { libelle: "Brouillon", ton: "neutre" },
  EN_VISA: { libelle: "En visa", ton: "accent" },
  A_SIGNER: { libelle: "À signer", ton: "confidentiel" },
  SIGNE: { libelle: "Signé", ton: "succes" },
  PARTI: { libelle: "Parti", ton: "succes" },
  RENVOYE: { libelle: "Renvoyé", ton: "danger" },
};
