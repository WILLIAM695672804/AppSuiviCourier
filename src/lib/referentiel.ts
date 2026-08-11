import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Referentiels partages.
 *
 * Natures, correspondants, structures et mentions types sont administres dans
 * le domaine « parametrage » mais consommes par tous les autres. Ils vivent
 * donc dans `lib`, pour qu'aucune fonctionnalite n'ait a en importer une autre.
 */

export interface Nature {
  id: number;
  libelle: string;
  /** Delai propose a l'enregistrement, en jours ouvres. */
  delaiParDefaut: number | null;
}

export interface Correspondant {
  id: number;
  libelle: string;
  /** « Institution », « Entreprise », « Usager »… */
  categorie: string;
  initiales: string;
  nombreCourriers: number;
  dernierCourrier: string | null;
}

/**
 * Ce qu'est la structure au regard du droit, et non de l'organigramme.
 *
 * La distinction compte : une filiale a ses propres organes de gestion, dont
 * la DSR suit les sessions et les prescriptions (§3.3). Une direction n'en a
 * pas — elle relève des instances du Port autonome lui-meme.
 */
export type NatureStructure = "Direction" | "Service" | "Division" | "Filiale" | "Succursale";

export interface StructureRef {
  id: number;
  libelle: string;
  sigle: string;
  nature: NatureStructure;
  /** Profondeur dans l'organigramme, pour l'indentation des listes. */
  niveau: number;
  /** Aide a la decision au moment de coter : qui repond, et en combien de temps. */
  responsable: string | null;
  delaiMoyenJours: number | null;
  courriersEnCours: number;
}

export interface MentionType {
  id: number;
  libelle: string;
}

/** Les referentiels changent rarement : une heure de cache evite des allers-retours. */
const DUREE = 60 * 60 * 1000;

export const naturesQuery = () =>
  queryOptions({
    queryKey: ["referentiel", "natures"],
    queryFn: ({ signal }) => api.get<Nature[]>("/referentiels/natures", signal),
    staleTime: DUREE,
  });

export const structuresQuery = () =>
  queryOptions({
    queryKey: ["referentiel", "structures"],
    queryFn: ({ signal }) => api.get<StructureRef[]>("/referentiels/structures", signal),
    staleTime: DUREE,
  });

export const mentionsQuery = () =>
  queryOptions({
    queryKey: ["referentiel", "mentions"],
    queryFn: ({ signal }) => api.get<MentionType[]>("/referentiels/mentions", signal),
    staleTime: DUREE,
  });

export const correspondantsQuery = (recherche: string) =>
  queryOptions({
    queryKey: ["referentiel", "correspondants", recherche],
    queryFn: ({ signal }) =>
      api.get<Correspondant[]>(
        `/referentiels/correspondants?q=${encodeURIComponent(recherche)}`,
        signal,
      ),
    // Le referentiel des correspondants est vaste : on n'interroge qu'a partir
    // de deux caracteres, sinon la premiere frappe ramenerait tout.
    enabled: recherche.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
