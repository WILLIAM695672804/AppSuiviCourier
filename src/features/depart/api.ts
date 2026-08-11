import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BordereauCoursier, DepartResume } from "@/types/depart";

/** Seul point de contact entre le domaine « depart » et le serveur. */
export type VueDeparts =
  | "tous"
  | "brouillons"
  | "enVisa"
  | "aSigner"
  | "signes"
  | "partis"
  | "renvoyes";

export interface IndicateursDeparts {
  signesCeMois: number;
  enAttenteVisa: number;
  delaiVisaSignature: number;
  signesNonPartis: number;
}

export interface PageDeparts {
  lignes: DepartResume[];
  total: number;
  indicateurs: IndicateursDeparts;
}

export const clesDepart = {
  racine: ["depart"] as const,
  registre: (vue: VueDeparts, recherche: string) => ["depart", "registre", vue, recherche] as const,
  fileSignature: () => ["depart", "signature"] as const,
  bordereau: (numero: string) => ["depart", "bordereau", numero] as const,
};

export const registreDepartsQuery = (vue: VueDeparts, recherche: string) =>
  queryOptions({
    queryKey: clesDepart.registre(vue, recherche),
    queryFn: ({ signal }) =>
      api.get<PageDeparts>(
        `/departs?vue=${vue}${recherche ? `&q=${encodeURIComponent(recherche)}` : ""}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
  });

export const fileSignatureQuery = () =>
  queryOptions({
    queryKey: clesDepart.fileSignature(),
    queryFn: ({ signal }) =>
      api.get<{ lignes: DepartResume[]; signataire: { nomComplet: string; fonction: string; initiales: string } }>(
        "/departs/file-signature",
        signal,
      ),
  });

/** Une etape du circuit de visa, vue depuis l'ecran de validation. */
export interface EtapeCircuit {
  ordre: number;
  nomComplet: string;
  initiales: string;
  fonction: string;
  etat: "soumis" | "vise" | "attendu" | "renvoye";
  horodatage: string | null;
  /** « depuis 6 h » : le temps d'attente, calcule par le serveur. */
  depuis: string | null;
  observation: string | null;
  /** Vrai si l'etape attend l'utilisateur connecte. */
  estMoi: boolean;
}

export interface CircuitDepart {
  numero: string | null;
  objet: string;
  destinataire: string;
  redacteur: string;
  mode: "CASCADE" | "PARALLELE";
  etapes: EtapeCircuit[];
}

export const circuitQuery = (id: number) =>
  queryOptions({
    queryKey: ["depart", "circuit", id],
    queryFn: ({ signal }) => api.get<CircuitDepart>(`/departs/${id}/circuit`, signal),
  });

export function useViser(departId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { action: "viser" | "renvoyer"; observation: string }) =>
      api.post<void>(`/departs/${departId}/visas`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesDepart.racine });
    },
  });
}

export const bordereauQuery = (numero: string) =>
  queryOptions({
    queryKey: clesDepart.bordereau(numero),
    queryFn: ({ signal }) => api.get<BordereauCoursier>(`/bordereaux/${numero}`, signal),
  });

/**
 * Signature d'un lot.
 *
 * C'est ici que le numero de depart est attribue : jamais avant. Un projet
 * non signe n'a pas de numero, sinon le registre porterait des numeros pour
 * des courriers qui ne sont jamais partis.
 */
export function useSigner() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { departIds: number[]; mode: "ELECTRONIQUE" | "MANUSCRITE" }) =>
      api.post<{ signes: DepartResume[] }>("/departs/signatures", corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesDepart.racine });
      client.invalidateQueries({ queryKey: ["compteurs"] });
    },
  });
}
