import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Domaine « organisation » : niveaux hierarchiques et postes de travail.
 *
 * Ces deux tables sont la raison pour laquelle l'application ne connait aucun
 * nom de role : l'administrateur cree ses niveaux et ses postes, et les
 * permissions suivent. Ce fichier est donc le seul endroit ou l'on ecrit
 * l'ossature de l'institution.
 */
export interface NiveauHierarchique {
  id: number;
  rang: number;
  libelle: string;
  nombreStructures: number;
  nombrePostes: number;
  /** Ce que le niveau autorise, coche par coche. */
  peutCoter: boolean;
  peutRecevoirCotation: boolean;
  porteSignature: boolean;
  ligneStatistiques: boolean;
  niveauParentId: number | null;
}

export interface PosteTravail {
  id: number;
  libelle: string;
  structure: string;
  niveau: string;
  profilParDefaut: string;
  titulaires: number;
  postesPrevus: number;
}

export const clesOrganisation = {
  racine: ["organisation"] as const,
  niveaux: () => ["organisation", "niveaux"] as const,
  postes: () => ["organisation", "postes"] as const,
};

export const niveauxQuery = () =>
  queryOptions({
    queryKey: clesOrganisation.niveaux(),
    queryFn: ({ signal }) => api.get<NiveauHierarchique[]>("/organisation/niveaux", signal),
  });

export const postesQuery = () =>
  queryOptions({
    queryKey: clesOrganisation.postes(),
    queryFn: ({ signal }) => api.get<PosteTravail[]>("/organisation/postes", signal),
  });

export function useEnregistrerNiveau() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (niveau: Partial<NiveauHierarchique>) =>
      niveau.id
        ? api.patch<NiveauHierarchique>(`/organisation/niveaux/${niveau.id}`, niveau)
        : api.post<NiveauHierarchique>("/organisation/niveaux", niveau),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesOrganisation.racine });
    },
  });
}
