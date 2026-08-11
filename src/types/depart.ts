/**
 * Le courrier depart suit un circuit distinct de l'arrivee : il est redige,
 * vise par une chaine hierarchique, signe, puis remis au coursier. Ses etapes
 * ne sont donc pas celles du courrier arrive et meritent leur propre type.
 */
export type EtapeDepart =
  | "BROUILLON"
  | "EN_VISA"
  | "A_SIGNER"
  | "SIGNE"
  | "PARTI"
  | "RENVOYE";

export interface Visa {
  ordre: number;
  nomComplet: string;
  initiales: string;
  fonction: string;
  /** Null tant que le visa n'est pas donne. */
  viseLe: string | null;
  /** Vrai si le viseur a renvoye le projet au redacteur. */
  renvoye: boolean;
  motifRenvoi: string | null;
}

export interface DepartResume {
  id: number;
  /** Null tant que le numero n'est pas attribue : il l'est a la signature. */
  numero: string | null;
  objet: string;
  destinataire: string;
  etape: EtapeDepart;
  redacteur: string;
  structure: string;
  visas: Visa[];
  priorite: "NORMALE" | "URGENTE" | "TRES_URGENTE";
  /** Courrier arrive auquel ce depart repond, s'il y en a un. */
  reponseA: { id: number; numero: string } | null;
  majLe: string;
  horsDelai: boolean;
}

export interface LignePli {
  reference: string;
  objet: string;
  destinataire: string;
  pages: number;
}

export interface BordereauCoursier {
  numero: string;
  date: string;
  coursier: string;
  tournee: string;
  remisPar: string;
  entete: { institution: string; service: string };
  plis: LignePli[];
}
