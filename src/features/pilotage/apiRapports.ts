import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NiveauFeu } from "@/lib/feu";

/**
 * D-03 — les rapports périodiques et leur export.
 *
 * Un fichier à part du reste du pilotage, parce que ce n'est pas le même
 * objet. Les tableaux de bord répondent à « où en sommes-nous aujourd'hui » et
 * changent chaque matin ; un rapport périodique répond à « qu'a-t-on fait entre
 * ces deux dates » et **ne bouge plus une fois la période close**. Mélanger les
 * deux dans un même contrat aurait fini par mélanger les deux dans un même
 * écran.
 *
 * Deux conséquences visibles ici :
 *
 * - la période demandée peut être **ramenée** par le serveur quand elle n'est
 *   pas close (`periodeRamenee`) : l'écran le dit, sinon l'agent croit à un
 *   bogue ;
 * - l'export CSV n'est pas fabriqué par le navigateur mais **servi par le
 *   serveur**, qui le trace comme une sortie de données (§3.12). D'où une
 *   adresse plutôt qu'un `fetch` : c'est le même choix que pour le contenu
 *   d'une pièce jointe.
 */
export type Granularite = "mois" | "trimestre" | "semestre" | "annee";

export type PerimetreRapport = "institution" | "structure";

export interface PeriodeRapport {
  granularite: Granularite;
  annee: number;
  /** 1 à 12 pour un mois, 1 à 4 pour un trimestre, 1 ou 2 pour un semestre. */
  rang: number;
  /** « 2026-T2 » — ce qui nomme le fichier exporté. */
  code: string;
  libelle: string;
  debut: string;
  fin: string;
}

export interface LigneRapport {
  libelle: string;
  /** Déjà formatée par le serveur — « 62 % », « 4 / 7 », « Non mesuré ». */
  valeur: string;
  note: string;
  feu: NiveauFeu;
  /** `null` dès qu'une des deux mesures manque : jamais une évolution inventée. */
  variation: string | null;
}

export interface SectionRapport {
  titre: string;
  lignes: LigneRapport[];
}

export interface StructureAccessible {
  sigle: string;
  libelle: string;
}

export interface MesureAbsente {
  libelle: string;
  raison: string;
}

export interface DonneesRapport {
  periode: PeriodeRapport;
  /** Vrai quand la période demandée n'était pas close et a été ramenée. */
  periodeRamenee: boolean;
  comparaison: string;
  perimetre: PerimetreRapport;
  perimetreLibelle: string;
  structureSigle: string;
  structuresAccessibles: StructureAccessible[];
  /** Faux quand la portée ne consolide pas l'institution. */
  peutVoirInstitution: boolean;
  editeLe: string;
  editePar: string;
  sections: SectionRapport[];
  nonMesure: MesureAbsente[];
}

export interface ChoixRapport {
  periode: Granularite;
  annee: string;
  rang: string;
  structure: string;
  perimetre: PerimetreRapport;
}

/**
 * Les paramètres, dans le même ordre pour l'écran et pour l'export.
 *
 * `annee` et `rang` ne partent qu'ensemble : le serveur rend la dernière
 * période close dès que l'un des deux manque, et une année sans rang aurait
 * silencieusement changé de sens.
 */
function parametres(choix: ChoixRapport): string {
  const p = new URLSearchParams({ periode: choix.periode, perimetre: choix.perimetre });
  if (choix.annee && choix.rang) {
    p.set("annee", choix.annee);
    p.set("rang", choix.rang);
  }
  if (choix.structure) p.set("structure", choix.structure);
  return p.toString();
}

export const rapportQuery = (choix: ChoixRapport) =>
  queryOptions({
    queryKey: ["pilotage", "rapport", choix],
    queryFn: ({ signal }) =>
      api.get<DonneesRapport>(`/pilotage/rapports?${parametres(choix)}`, signal),
    placeholderData: (precedent) => precedent,
    staleTime: 5 * 60 * 1000,
  });

/**
 * L'adresse de l'export.
 *
 * Un lien, et non un `fetch` suivi d'un `Blob` : le cookie de session part
 * avec la navigation, le navigateur nomme le fichier d'après l'en-tête que le
 * serveur pose, et surtout la sortie de données passe par le serveur — qui
 * l'inscrit au journal des accès. Un CSV assemblé côté client n'aurait laissé
 * aucune trace.
 */
export function adresseExport(choix: ChoixRapport): string {
  return `/api/pilotage/rapports/export?${parametres(choix)}`;
}
