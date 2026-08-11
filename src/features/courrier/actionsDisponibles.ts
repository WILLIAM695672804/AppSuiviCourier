import { PERMISSIONS, type Permission } from "@/types/habilitation";
import type { CourrierDetail } from "@/types/courrier";

/**
 * Coeur de la regle d'affichage : etape courante x permission.
 *
 * Aucun nom de role n'apparait ici. C'est ce qui permet a l'administrateur
 * d'ajouter ou de retirer un niveau hierarchique sans livraison de code.
 * Le serveur applique la meme regle et reste seul juge.
 */

export type ActionCourrier =
  | "coter"
  | "affecter"
  | "traiter"
  | "valider"
  | "transmettre"
  | "cloturer"
  | "relancer"
  | "imprimer";

const TOUTES_ETAPES: CourrierDetail["etape"][] = [
  "ENREGISTRE",
  "COTE",
  "TRANSMIS",
  "AFFECTE",
  "EN_TRAITEMENT",
  "EN_VALIDATION",
  "SIGNE",
  "PARTI",
  "CLOTURE",
];

/**
 * Une action peut etre ouverte par plusieurs permissions.
 * La cotation en est l'exemple : le DG cote lui-meme (COT), l'agent de
 * session saisit pour lui (COT_DEL). Le meme bouton, deux titres a agir.
 */
const REGLES: Record<
  ActionCourrier,
  { etapes: CourrierDetail["etape"][]; permissions: Permission[] }
> = {
  coter: { etapes: ["ENREGISTRE", "COTE"], permissions: [PERMISSIONS.COT, PERMISSIONS.COT_DEL] },
  affecter: { etapes: ["COTE", "TRANSMIS"], permissions: [PERMISSIONS.AFF] },
  traiter: { etapes: ["AFFECTE", "EN_TRAITEMENT"], permissions: [PERMISSIONS.TRA] },
  valider: { etapes: ["EN_VALIDATION"], permissions: [PERMISSIONS.VAL] },
  transmettre: { etapes: ["COTE", "SIGNE"], permissions: [PERMISSIONS.TRANS] },
  cloturer: { etapes: ["PARTI"], permissions: [PERMISSIONS.CLO] },
  relancer: {
    etapes: ["TRANSMIS", "AFFECTE", "EN_TRAITEMENT", "EN_VALIDATION"],
    permissions: [PERMISSIONS.REL],
  },
  imprimer: { etapes: TOUTES_ETAPES, permissions: [PERMISSIONS.IMP] },
};

export function actionsDisponibles(
  courrier: CourrierDetail,
  permissions: Permission[],
): ActionCourrier[] {
  return (Object.keys(REGLES) as ActionCourrier[]).filter((action) => {
    const regle = REGLES[action];
    if (!regle.etapes.includes(courrier.etape)) return false;
    if (!regle.permissions.some((code) => permissions.includes(code))) return false;
    // Le serveur a le dernier mot : il tient compte du perimetre et du chef de file.
    return courrier.actionsPossibles.includes(action);
  });
}
