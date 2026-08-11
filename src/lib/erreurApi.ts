/**
 * Erreur renvoyee par le serveur, portee jusqu'a l'ecran.
 *
 * Dans son propre fichier pour eviter un cycle d'import : le client HTTP la
 * leve, et le faux serveur du mode demonstration la leve aussi — or c'est le
 * client qui appelle le faux serveur.
 */
export class ErreurApi extends Error {
  statut: number;
  details: unknown;

  constructor(statut: number, message: string, details?: unknown) {
    super(message);
    this.name = "ErreurApi";
    this.statut = statut;
    this.details = details;
  }
}

/** Vrai lorsque le serveur refuse la requete faute de session valide. */
export function estNonAuthentifie(erreur: unknown): boolean {
  return erreur instanceof ErreurApi && erreur.statut === 401;
}
