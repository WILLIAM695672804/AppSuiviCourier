import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Domaine « pieces » : les fichiers attaches a un objet metier.
 *
 * **Un seul domaine pour tous les piliers.** Une activite, un dossier et une
 * demande d'usager portent leurs pieces par la meme route ; ce qui varie —
 * la permission exigee et la visibilite de l'objet porteur — est declare cote
 * serveur dans `noyau/pieces/rattachement.py`. Voir ADR 017.
 *
 * Le telechargement ne passe pas par ce fichier : c'est un lien direct vers
 * `/api/pieces/{uid}/contenu`, ouvert par le navigateur avec le cookie de
 * session. Passer par `fetch` obligerait a garder tout le binaire en memoire
 * pour reconstruire un `blob:` — inutile, et ruineux sur un scan de 20 Mo.
 */
/**
 * Les types d'objet auxquels une piece se rattache.
 *
 * Miroir des clefs de `REGISTRE` dans `noyau/pieces/rattachement.py` : une
 * valeur absente du registre serveur part en 409, et une clef du registre
 * absente d'ici n'est atteignable par aucun ecran.
 */
export type TypeRattachable = "activite" | "courrier" | "dossier" | "demande";

export interface VersionPiece {
  uid: string;
  version: number;
  deposeeLe: string;
  tailleLisible: string;
}

export interface PieceJointe {
  uid: string;
  nom: string;
  extension: string;
  taille: number;
  /** « 1,2 Mo ». Mis en forme par le serveur : deux arrondis divergents feraient
   * afficher deux poids differents pour le meme fichier. */
  tailleLisible: string;
  categorie: string;
  version: number;
  /** SHA-256, en clair. Une preuve d'integrite qu'on ne peut pas lire ne prouve rien. */
  empreinte: string;
  deposeeLe: string;
  /** Retiree ne veut pas dire effacee : le binaire reste, la ligne aussi. */
  retiree: boolean;
  /**
   * Faux quand la ligne n'a pas de binaire — un nom et un poids sans fichier,
   * ce que le pilier activite inscrivait jusqu'au 17 aout 2026. Distinct de
   * `retiree` : une piece retiree a bien ete versee. N'affichez pas de lien de
   * telechargement quand ceci est faux.
   */
  telechargeable: boolean;
  /** Versions anterieures, de la plus recente a la plus ancienne. */
  versions: VersionPiece[];
}

export function piecesQuery(objetType: TypeRattachable, objetId: number) {
  return queryOptions({
    queryKey: ["pieces", objetType, objetId],
    queryFn: ({ signal }) =>
      api.get<PieceJointe[]>(`/pieces?objetType=${objetType}&objetId=${objetId}`, signal),
  });
}

/** L'adresse de telechargement. Le serveur la sert en piece attachee, toujours. */
export function adresseContenu(uid: string): string {
  return `/api/pieces/${uid}/contenu`;
}

/**
 * Ce qu'un depot transporte.
 *
 * `remplaceUid` verse une **nouvelle version** de la piece designee : la
 * precedente reste lisible et telechargeable (RF-GED-04). C'est la seule façon
 * de « corriger » une piece — il n'existe pas de remplacement en place.
 */
export interface DepotPiece {
  fichier: File;
  nom?: string;
  categorie?: string;
  remplaceUid?: string;
}

/**
 * Le depot, sans hook.
 *
 * `useDeposerPiece` couvre le cas courant — un ecran, un objet deja cree. Il ne
 * couvre pas celui de l'enregistrement d'un courrier, ou l'objet **n'existe pas
 * encore** au moment ou l'agent choisit ses fichiers : le rattachement exige un
 * identifiant, et il n'y en a qu'apres la creation. D'ou cette fonction, que la
 * page appelle dans la foulee de sa mutation.
 */
export function deposerPiece(
  objetType: TypeRattachable,
  objetId: number,
  saisie: DepotPiece,
): Promise<PieceJointe> {
  const formulaire = new FormData();
  formulaire.append("fichier", saisie.fichier);
  formulaire.append("objetType", objetType);
  formulaire.append("objetId", String(objetId));
  formulaire.append("nom", saisie.nom ?? "");
  formulaire.append("categorie", saisie.categorie ?? "annexe");
  formulaire.append("remplaceUid", saisie.remplaceUid ?? "");
  return api.televerser<PieceJointe>("/pieces", formulaire);
}

export function useDeposerPiece(objetType: TypeRattachable, objetId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: DepotPiece) => deposerPiece(objetType, objetId, saisie),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ["pieces", objetType, objetId],
      });
    },
  });
}

/**
 * Retire une piece de la vue — sans rien effacer.
 *
 * Le motif est obligatoire cote serveur. Un retrait sans motif laisse, des mois
 * plus tard, un dossier ampute d'une piece sans que personne ne sache pourquoi.
 */
export function useRetirerPiece(objetType: TypeRattachable, objetId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: { uid: string; motif: string }) =>
      api.post<PieceJointe>(`/pieces/${saisie.uid}/retrait`, {
        motif: saisie.motif,
      }),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ["pieces", objetType, objetId],
      });
    },
  });
}
