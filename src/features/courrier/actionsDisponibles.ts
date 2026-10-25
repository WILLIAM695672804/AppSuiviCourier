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
  | "accepter"
  | "traiter"
  | "restituer"
  | "retourner"
  | "cloturer"
  | "relancer"
  | "signaler"
  | "imprimer";

const TOUTES_ETAPES: CourrierDetail["etape"][] = [
  "ENREGISTRE",
  "COTE",
  "AFFECTE",
  "ACCEPTE",
  "EN_TRAITEMENT",
  "RESTITUE",
  "CLOTURE",
];

/** Tout sauf la cloture : un courrier clos ne se signale plus. */
const AVANT_CLOTURE = TOUTES_ETAPES.filter((etape) => etape !== "CLOTURE");

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
  affecter: { etapes: ["COTE"], permissions: [PERMISSIONS.AFF] },
  // Signer la decharge et signaler un ecart s'ouvrent sous LEC : ce sont des
  // gestes de celui qui RECOIT le pli, pas de celui qui le traite. Exiger TRA
  // pour accuser aurait empeche d'accuser un courrier mal dirige — le cas ou le
  // cahier sert justement.
  accepter: { etapes: ["AFFECTE"], permissions: [PERMISSIONS.LEC] },
  signaler: { etapes: AVANT_CLOTURE, permissions: [PERMISSIONS.LEC] },
  traiter: { etapes: ["ACCEPTE", "EN_TRAITEMENT"], permissions: [PERMISSIONS.TRA] },
  restituer: { etapes: ["EN_TRAITEMENT"], permissions: [PERMISSIONS.TRA] },
  // Retourner et cloturer sont le meme role : celui du responsable a qui
  // l'agent rend le courrier. `valider` et `transmettre` ont disparu — il n'y a
  // ni visa ni transmission sur le courrier arrive (ADR 034), et une action
  // declaree sans route se lit comme une promesse.
  retourner: { etapes: ["RESTITUE"], permissions: [PERMISSIONS.CLO] },
  cloturer: {
    // La cloture n'attend pas un traitement : beaucoup de courriers arrivent
    // pour information et se referment sans que personne n'ecrive.
    etapes: ["COTE", "AFFECTE", "ACCEPTE", "EN_TRAITEMENT", "RESTITUE"],
    permissions: [PERMISSIONS.CLO],
  },
  relancer: {
    etapes: ["AFFECTE", "ACCEPTE", "EN_TRAITEMENT", "RESTITUE"],
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
