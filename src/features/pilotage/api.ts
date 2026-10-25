import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NiveauFeu } from "@/lib/feu";

/**
 * Domaine « pilotage » : tableau de bord et statistiques annuelles.
 *
 * Le périmètre n'est pas un filtre d'affichage, c'est une question posée au
 * serveur : « ce que je vois quand je regarde l'institution », « ma structure
 * et ses filles », « mes dossiers ». Le serveur répond ce que l'habilitation
 * autorise et rien de plus — et il **dit ce qu'il a appliqué**, parce qu'un
 * onglet resté ouvert après un changement d'habilitation n'est pas une
 * tentative d'intrusion.
 *
 * Ces deux écrans décrivaient auparavant le courrier, puis ne l'ont plus décrit
 * du tout : le pilier n'avait pas de clôture, donc aucun délai ne s'arrêtait.
 * Depuis le 27 août 2026 le courrier a de nouveau sa ligne — courriers traités
 * dans le délai, volume enregistré, délai moyen — aux côtés des productions du
 * calendrier officiel et des décisions d'instance. Ce que l'application ne
 * mesure toujours pas est énuméré dans `nonMesure`, plutôt que tu ou remplacé
 * par un zéro. Voir l'ADR 011 et A30.
 */
export type PerimetreVue = "institution" | "structure" | "mesDossiers";

/** Ce que l'écran ne mesure pas, et pourquoi. */
export interface MesureAbsente {
  libelle: string;
  raison: string;
}

export interface IndicateurTableau {
  libelle: string;
  /** Déjà formatée par le serveur — « 62 % », « 4 / 7 », « Non mesuré ». */
  valeur: string;
  /** Évolution sur un mois. `null` quand l'une des deux mesures manque. */
  variation: string | null;
  note: string;
  feu: NiveauFeu;
}

export interface PointSerie {
  periode: string;
  attendues: number;
  deposees: number;
  decisionsExecutees: number;
}

export interface LigneRetard {
  id: number;
  reference: string;
  objet: string;
  structure: string;
  etape: string;
  retardJours: number;
  /** Où aller pour agir. `null` quand l'écran n'existe pas encore. */
  chemin: string | null;
}

export interface DonneesTableauDeBord {
  /** Ce que le front a demandé, et ce que la portée a permis. */
  perimetreDemande: string;
  perimetreApplique: PerimetreVue;
  perimetreLibelle: string;
  periode: string;
  indicateurs: IndicateurTableau[];
  serie: PointSerie[];
  retards: LigneRetard[];
  /** `null` quand aucune échéance n'est passée — et non 0 %. */
  tauxRespect: number | null;
  objectifRespect: number;
  nonMesure: MesureAbsente[];
}

export interface IndicateurStatistique {
  libelle: string;
  valeur: string;
  note: string;
  feu: NiveauFeu;
}

export interface MoisStatistique {
  mois: string;
  attendues: number;
  deposees: number;
  decisionsExecutees: number;
}

export interface StructureStatistique {
  structure: string;
  sigle: string;
  volume: number;
  /** Jours entre le dépôt et l'échéance ; négatif = en retard. */
  ecartMoyen: number | null;
  respect: number | null;
  feu: NiveauFeu;
}

export interface DonneesStatistiques {
  annee: number;
  /** Seuil de respect attendu par l'institution. Administré — voir A31. */
  seuilAttendu: number;
  indicateurs: IndicateurStatistique[];
  parMois: MoisStatistique[];
  parStructure: StructureStatistique[];
  nonMesure: MesureAbsente[];
}

export const statistiquesQuery = (filtres: { annee: string; structureId: string }) =>
  queryOptions({
    queryKey: ["pilotage", "statistiques", filtres],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams({ annee: filtres.annee });
      if (filtres.structureId) p.set("structure", filtres.structureId);
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
