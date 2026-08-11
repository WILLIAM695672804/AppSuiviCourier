import type { CourrierResume, DelaiCourrier } from "@/types/courrier";

/**
 * Le dossier tel que le voit l'agent qui le traite.
 *
 * Distinct de la fiche courrier : la fiche decrit le courrier pour tous, le
 * dossier decrit ce que MOI j'ai a faire. Meme donnee, deux lectures.
 */

export interface TacheTraitement {
  id: number;
  libelle: string;
  faite: boolean;
  /** Date de realisation, absente tant que la tache reste a faire. */
  faiteLe: string | null;
}

export interface NoteTraitement {
  id: number;
  texte: string;
  horodatage: string;
  /** Une note privee ne sort pas de la structure et de sa hierarchie. */
  privee: boolean;
}

export interface DossierTraitement {
  courrier: CourrierResume;
  /** Instruction recue, avec son auteur : c'est elle qui engage l'agent. */
  instruction: {
    texte: string;
    auteur: string;
    initiales: string;
    fonction: string;
    horodatage: string;
  } | null;
  echeance: string | null;
  delai: DelaiCourrier | null;
  taches: TacheTraitement[];
  notes: NoteTraitement[];
  /** Les autres dossiers de l'agent, pour passer de l'un a l'autre sans revenir. */
  autresDossiers: CourrierResume[];
  actionsPossibles: string[];
}

export interface PortefeuilleAgent {
  dossiers: CourrierResume[];
  aRendre: number;
  horsDelai: number;
  enVisa: number;
}
