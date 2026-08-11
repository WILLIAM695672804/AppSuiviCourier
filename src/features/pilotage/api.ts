import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Domaine « pilotage » : tableau de bord et statistiques.
 *
 * Le perimetre n'est pas un filtre d'affichage, c'est une question posee au
 * serveur : « ce que je vois quand je regarde l'institution », « ma structure
 * et ses filles », « mes dossiers ». Le serveur repond ce que l'habilitation
 * autorise et rien de plus.
 */
export type PerimetreVue = "institution" | "structure" | "mesDossiers";

export interface IndicateurTableau {
  libelle: string;
  valeur: string;
  variation: string | null;
  ton: "accent" | "succes" | "alerte" | "danger";
  note: string | null;
}

export interface CourrierEnRetard {
  id: number;
  numero: string;
  objet: string;
  structure: string;
  etape: string;
  retardJours: number;
}

export interface DonneesTableauDeBord {
  indicateurs: IndicateurTableau[];
  volume: { periode: string; enregistres: number; clotures: number }[];
  volumeTotal: number;
  volumeVariation: string;
  /** Nombre de courriers confidentiels, exclus des restitutions a la DSR. */
  confidentiels: number;
  retards: CourrierEnRetard[];
  totalRetards: number;
  chargeParJour: { jour: string; valeur: number }[];
  tauxRespect: number;
  objectifRespect: number;
}

export interface DonneesStatistiques {
  volumeAnnuel: number;
  volumeAnneePrecedente: number;
  tauxRespect: number;
  delaiMoyen: number;
  expediteursDistincts: number;
  parMois: { mois: string; arrives: number; departs: number }[];
  /** Seuil de respect attendu par l'institution, en pourcentage. */
  seuilAttendu: number;
  parStructure: { structure: string; volume: number; delaiMoyen: number; respect: number }[];
}

export const statistiquesQuery = (filtres: {
  annee: string;
  structureId: string;
  natureId: string;
}) =>
  queryOptions({
    queryKey: ["pilotage", "statistiques", filtres],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams({ annee: filtres.annee });
      if (filtres.structureId) p.set("structure", filtres.structureId);
      if (filtres.natureId) p.set("nature", filtres.natureId);
      return api.get<DonneesStatistiques>(`/pilotage/statistiques?${p}`, signal);
    },
    placeholderData: (precedent) => precedent,
    staleTime: 5 * 60 * 1000,
  });

export const tableauDeBordQuery = (perimetre: PerimetreVue, periode: string) =>
  queryOptions({
    queryKey: ["pilotage", "tableau", perimetre, periode],
    queryFn: ({ signal }) =>
      api.get<DonneesTableauDeBord>(
        `/pilotage/tableau-de-bord?perimetre=${perimetre}&periode=${periode}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
    staleTime: 2 * 60 * 1000,
  });
