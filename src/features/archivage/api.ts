import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NiveauFeu } from "@/lib/feu";

/**
 * Domaine « archivage » — le sort des dossiers une fois clos.
 *
 * Trois exigences le fondent :
 *
 *  — RF-GED-06 (Must) : durées de conservation par typologie, et application
 *    automatique du sort final — conservation, destruction, tri ;
 *  — RF-ADM-05 (Must) : ces durées sont administrées par un profil dédié,
 *    « avec validation par le service des archives » ;
 *  — RF-GED-09 : export d'un document ou d'un dossier avec preuve d'intégrité,
 *    empreinte numérique et horodatage.
 *
 * La distinction qui structure tout : la **durée d'utilité administrative**
 * (DUA) court à partir de la clôture et dit combien de temps le dossier reste
 * utile au service. Le **sort final** dit ce qu'on en fait ensuite. Confondre
 * les deux revient à détruire des dossiers encore utiles, ou à conserver
 * indéfiniment ce qui aurait dû être éliminé — les deux sont des fautes.
 *
 * Rien ne se détruit depuis l'application. Le sort final se propose, il ne
 * s'exécute pas : la destruction d'archives publiques suppose un visa que le
 * logiciel n'a pas à donner.
 */

export type SortFinal = "Conservation définitive" | "Destruction" | "Tri";

export interface RegleConservation {
  id: number;
  typologie: string;
  description: string;
  /** Durée d'utilité administrative, en années à compter de la clôture. */
  dua: number;
  sortFinal: SortFinal;
  /** Texte qui fonde la durée. Sans lui, la règle n'est pas opposable. */
  fondementJuridique: string;
  /** Validation par le service des archives — RF-ADM-05. */
  valideePar: string | null;
  valideeLe: string | null;
  actif: boolean;
  dossiersConcernes: number;
}

export interface Referentiel {
  regles: RegleConservation[];
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
  /** Règles en attente du visa du service des archives. */
  enAttenteValidation: number;
}

export type EtatVersement = "À verser" | "En cours" | "Versé" | "Anomalie";

export interface Versement {
  id: number;
  reference: string;
  objet: string;
  typologie: string;
  structure: string;
  closLe: string;
  dua: number;
  sortFinal: SortFinal;
  /** Date à laquelle la DUA expire et où le sort final s'applique. */
  echeanceSortFinal: string;
  etat: EtatVersement;
  /** Pièces présentes rapportées aux pièces attendues pour cette typologie. */
  pieces: number;
  piecesAttendues: number;
  feu: NiveauFeu;
}

export interface AnomalieVersement {
  libelle: string;
  precision: string;
  bloquante: boolean;
}

export interface VersementDetail extends Versement {
  fondementJuridique: string;
  verseLe: string | null;
  versePar: string | null;
  anomalies: AnomalieVersement[];
  piecesJointes: { id: number; nom: string; format: string; taille: string; presente: boolean }[];
  /** Chaîne d'empreintes : chaque étape scelle l'état du dossier à ce moment. */
  chaineIntegrite: { etape: string; horodatage: string; empreinte: string }[];
}

/** Preuve remise à un tiers — audit, contentieux. RF-GED-09. */
export interface PreuveIntegrite {
  reference: string;
  objet: string;
  algorithme: string;
  empreinte: string;
  horodatage: string;
  autorite: string;
  nombrePieces: number;
  taille: string;
  produitePar: string;
}

/** Vue de contrôle, pour l'auditeur : la conformité, sans le pouvoir d'agir. */
export interface ConformiteArchivistique {
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
  /** Dossiers dont la DUA est dépassée sans que le sort final ait été appliqué. */
  echeancesDepassees: Versement[];
  /** Typologies sans règle de conservation validée. */
  typologiesSansRegle: string[];
  tauxConformite: number;
}

const CLE = "archivage";

export const referentielQuery = () =>
  queryOptions({
    queryKey: [CLE, "referentiel"],
    queryFn: ({ signal }) => api.get<Referentiel>("/archivage/referentiel", signal),
  });

export const versementsQuery = (filtre: string) =>
  queryOptions({
    queryKey: [CLE, "versements", filtre],
    queryFn: ({ signal }) =>
      api.get<{ versements: Versement[]; compteurs: Referentiel["compteurs"] }>(
        `/archivage/versements?filtre=${encodeURIComponent(filtre)}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
  });

export const versementQuery = (id: number) =>
  queryOptions({
    queryKey: [CLE, "versement", id],
    queryFn: ({ signal }) => api.get<VersementDetail>(`/archivage/versements/${id}`, signal),
  });

export const conformiteQuery = () =>
  queryOptions({
    queryKey: [CLE, "conformite"],
    queryFn: ({ signal }) => api.get<ConformiteArchivistique>("/archivage/conformite", signal),
  });

/* ------------------------------------------------------------------ *
 *  Ecritures
 * ------------------------------------------------------------------ */

export interface SaisieRegle {
  typologie: string;
  description: string;
  dua: number;
  sortFinal: SortFinal;
  fondementJuridique: string;
}

export interface SaisieVersement {
  versementId: number;
  observation: string;
  /** Verser malgre une anomalie non bloquante suppose de la motiver. */
  anomaliesAcceptees: boolean;
}

export interface DemandePreuve {
  versementId: number;
  motif: string;
  destinataire: string;
}

function useEcriture<TCorps, TReponse = { id: number }>(
  chemin: string | ((corps: TCorps) => string),
) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (corps: TCorps) =>
      api.post<TReponse>(typeof chemin === "function" ? chemin(corps) : chemin, corps),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [CLE] });
    },
  });
}

export const useCreerRegle = () => useEcriture<SaisieRegle>("/archivage/referentiel");

export const useValiderRegle = () =>
  useEcriture<{ regleId: number }>((corps) => `/archivage/referentiel/${corps.regleId}/validation`);

export const useVerser = () =>
  useEcriture<SaisieVersement>((corps) => `/archivage/versements/${corps.versementId}/versement`);

export const useProduirePreuve = () =>
  useEcriture<DemandePreuve, PreuveIntegrite>(
    (corps) => `/archivage/versements/${corps.versementId}/preuve`,
  );
