import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LibelleAxe } from "@/lib/axesStrategiques";
import type { NiveauFeu } from "@/lib/feu";

/**
 * Domaine « activité » — le plan d'actions annuel et son exécution.
 *
 * Le cahier des charges (§15) donne la liste des champs qu'une activité doit
 * porter : objectif, état de référence, indicateurs, résultats attendus,
 * tâches, budget validé, responsable, période, cible, avancement. Le descriptif
 * fonctionnel ajoute qui saisit quoi : le point focal alimente sa seule
 * structure (§3.5), le responsable hiérarchique suit son périmètre (§3.4), la
 * DSR consolide (§3.3), le contrôle de gestion valide le plan.
 *
 * Le budget est modélisé mais n'a aucun écran de suivi : la décision de
 * cadrage D8 l'a sorti de la V1. Le montant validé s'affiche sur la fiche
 * parce qu'il qualifie l'activité ; sa consommation ne se suit pas ici.
 *
 * La fiche de vie (§18) est le pendant de celle du courrier : création,
 * modifications, instructions verbales du DG, décisions, observations,
 * relances, validations, pièces jointes. C'est elle qui rend l'activité
 * auditable.
 *
 * Trois gestes ne relèvent pas de la structure qui exécute, et portent donc
 * d'autres permissions que `ACT_SAI` :
 *
 *  — rattacher une instruction verbale ou une décision du DG (§17, §19) et
 *    suspendre une activité relèvent de `DEC`, la tenue du registre des
 *    décisions. Le DG décide ; la DSR consigne. Laisser la structure inscrire
 *    elle-même l'instruction qui la contraint aurait vidé le §17 de son objet ;
 *  — relancer relève de `REL`, comme pour le courrier : c'est l'« escalade
 *    humaine » du descriptif (§1.1), et personne ne se relance soi-même ;
 *  — valider ou retourner un plan relève de `ACT_VAL`, jamais de qui l'a
 *    soumis.
 */

export type EtatActivite = "Programmée" | "En cours" | "Réalisée" | "En retard" | "Suspendue";

export interface Activite {
  id: number;
  reference: string;
  intitule: string;
  /**
   * Axe du plan stratégique auquel l'activité se rattache.
   *
   * Trois valeurs seulement, arrêtées par le plan (`lib/axesStrategiques.ts`) :
   * c'est ce qui rend le regroupement par axe calculable.
   */
  axe: LibelleAxe;
  structureSigle: string;
  structureLibelle: string;
  responsable: string;
  /**
   * L'identifiant du responsable, en plus de son nom.
   *
   * Le nom s'affiche, l'identifiant se renvoie : c'est lui que le sélecteur de
   * la modale de modification repose (ADR 020). Sans lui, rouvrir une activité
   * pour la corriger repartait d'un sélecteur vide.
   */
  responsableId: number | null;
  initiales: string;
  debut: string;
  fin: string;
  etat: EtatActivite;
  avancement: number;
  /** Avancement attendu à la date du jour, pour mesurer l'écart. */
  avancementAttendu: number;
  feu: NiveauFeu;
  tachesFaites: number;
  tachesTotal: number;
  /** Nombre d'instructions verbales du DG rattachées. Un signal de tension. */
  instructions: number;
  /**
   * Activité critique — §20, tableau de bord du Directeur général.
   *
   * Calculée par le serveur, jamais déclarée : est critique une activité dont
   * l'écart à l'attendu dépasse le seuil et qui, en plus, porte une contrainte
   * extérieure — une instruction du DG non levée, ou une échéance dépassée.
   * Un simple retard ne suffit pas, sans quoi la moitié du plan serait
   * critique et le mot ne trierait plus rien.
   */
  critique: boolean;
}

export interface IndicateurActivite {
  id: number;
  libelle: string;
  unite: string;
  /** Point de départ constaté — le « état de référence » du cahier des charges. */
  etatReference: string;
  cible: string;
  realise: string | null;
  /** Part de la cible atteinte, pour la barre. */
  taux: number | null;
  /** Date du dernier relevé, pour distinguer une mesure fraîche d'une mesure ancienne. */
  releveLe: string | null;
}

export interface TacheActivite {
  id: number;
  libelle: string;
  echeance: string;
  fait: boolean;
  dateRealisation: string | null;
  responsable: string;
}

export type TypeEvenementVie =
  | "Création"
  | "Modification"
  | "Instruction verbale"
  | "Décision du DG"
  | "Observation"
  | "Relance"
  | "Validation"
  | "Pièce jointe";

/** Pièce versée à la fiche de vie — §18, dernier point de la liste. */
export interface PieceVie {
  id: number;
  nom: string;
  poids: string;
}

export interface EvenementVie {
  id: number;
  type: TypeEvenementVie;
  date: string;
  auteur: string;
  initiales: string;
  poste: string;
  texte: string;
  /**
   * Pièces versées avec l'événement.
   *
   * Elles pendent à un événement plutôt qu'à l'activité : un rapport de mission
   * déposé sans savoir ce qu'il justifie ne prouve rien. La date, l'auteur et
   * le motif du dépôt sont ceux de l'événement porteur.
   */
  pieces: PieceVie[];
}

/**
 * Instruction verbale ou décision du DG pesant sur l'activité — §17 et §19.
 *
 * Le §17 exige quatre attributs : l'activité, la date, le responsable et le
 * délai. Une instruction est donc un engagement daté, pas une ligne de
 * commentaire — d'où l'échéance et la levée. Elle apparaît aussi dans la fiche
 * de vie, mais s'en distingue : la fiche de vie raconte, la liste des
 * instructions reste ouverte tant que rien n'est fait.
 */
export interface InstructionActivite {
  id: number;
  origine: "Instruction verbale" | "Décision du DG";
  /** Référence de la décision d'instance, quand l'instruction en découle. */
  reference: string | null;
  texte: string;
  date: string;
  auteur: string;
  responsable: string;
  echeance: string;
  levee: boolean;
  dateLevee: string | null;
}

/** Suspension d'une activité sur décision — §19, cinquième effet possible. */
export interface Suspension {
  motif: string;
  reference: string | null;
  decidePar: string;
  date: string;
}

export interface ActiviteDetail extends Activite {
  objectif: string;
  etatReferenceGeneral: string;
  resultatsAttendus: string;
  /** Montant validé, affiché sans suivi de consommation (décision D8). */
  budgetValide: number | null;
  indicateurs: IndicateurActivite[];
  taches: TacheActivite[];
  vie: EvenementVie[];
  instructionsRattachees: InstructionActivite[];
  /** Renseignée seulement lorsque l'état est « Suspendue ». */
  suspension: Suspension | null;
  /** Date de la dernière relance de la DSR, pour ne pas relancer deux fois. */
  derniereRelance: string | null;
}

export interface RegistreActivites {
  activites: Activite[];
  compteurs: {
    libelle: string;
    valeur: number;
    note: string;
    feu: NiveauFeu;
  }[];
  total: number;
  /** Structures présentes dans le jeu, pour le filtre. */
  structures: string[];
}

export type EtatPlan = "Brouillon" | "Soumis au contrôle de gestion" | "Validé" | "Retourné";

export interface PlanActions {
  annee: number;
  structureSigle: string;
  structureLibelle: string;
  etat: EtatPlan;
  soumisLe: string | null;
  valideLe: string | null;
  validePar: string | null;
  /** Motif du retour, quand le contrôle de gestion renvoie le plan. */
  motifRetour: string | null;
  activites: Activite[];
  avancementGlobal: number;
  budgetTotal: number | null;
  /** Structures dont le porteur de la session peut ouvrir le plan. */
  structuresAccessibles: { sigle: string; libelle: string }[];
}

/**
 * Ligne de la corbeille du contrôle de gestion.
 *
 * Le §15 fait valider chaque plan par la DCG. Un validateur qui devrait ouvrir
 * douze écrans pour savoir lesquels l'attendent ne validerait rien : la liste
 * est la porte d'entrée du geste, la fiche vient après.
 */
export interface PlanResume {
  structureSigle: string;
  structureLibelle: string;
  annee: number;
  etat: EtatPlan;
  activites: number;
  avancementGlobal: number;
  budgetTotal: number | null;
  soumisLe: string | null;
}

export interface CorbeillePlans {
  plans: PlanResume[];
  compteurs: {
    libelle: string;
    valeur: number;
    note: string;
    feu: NiveauFeu;
  }[];
}

export type NatureObligation =
  "Rapport mensuel d'activité" | "Procès-verbal de réunion" | "Rapport sectoriel";

/**
 * Ce qu'une structure doit produire, et quand.
 *
 * Vue « débitrice » du calendrier de production : le point focal voit ce qu'il
 * doit déposer. La DSR voit la même matière sous l'angle du contrôle, dans son
 * registre des réunions et rapports. Deux écrans, un seul objet — chacun dans
 * le vocabulaire de celui qui l'ouvre.
 */
export interface Obligation {
  id: number;
  intitule: string;
  nature: NatureObligation;
  periode: string;
  echeance: string;
  depose: boolean;
  dateDepot: string | null;
  feu: NiveauFeu;
  /** Retard en jours, quand l'échéance est passée sans dépôt. */
  retardJours: number | null;
  structureSigle: string;
  /**
   * Ligne du calendrier de production qui engendre cette obligation.
   *
   * C'est le calendrier (§3.3) qui décide « qui alimente quoi, à quelle
   * fréquence » : sans cette clef, les deux écrans décrivent la même règle
   * chacun de leur côté et finissent par diverger.
   */
  ligneCalendrierId: number | null;
}

export interface RegistreObligations {
  obligations: Obligation[];
  compteurs: {
    libelle: string;
    valeur: number;
    note: string;
    feu: NiveauFeu;
  }[];
  /** Taux de dépôt dans les délais, sur les douze derniers mois. */
  ponctualite: number;
}

const CLE = "activite";

export const registreActivitesQuery = (structure: string, etat: string) =>
  queryOptions({
    queryKey: [CLE, "registre", structure, etat],
    queryFn: ({ signal }) =>
      api.get<RegistreActivites>(
        `/activites?structure=${encodeURIComponent(structure)}&etat=${encodeURIComponent(etat)}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
  });

export const activiteQuery = (id: number) =>
  queryOptions({
    queryKey: [CLE, "fiche", id],
    queryFn: ({ signal }) => api.get<ActiviteDetail>(`/activites/${id}`, signal),
  });

export const planActionsQuery = (annee: number, structure: string) =>
  queryOptions({
    queryKey: [CLE, "plan", annee, structure],
    queryFn: ({ signal }) =>
      api.get<PlanActions>(
        `/activites/plan?annee=${annee}&structure=${encodeURIComponent(structure)}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
  });

export const corbeillePlansQuery = (annee: number) =>
  queryOptions({
    queryKey: [CLE, "plans", annee],
    queryFn: ({ signal }) => api.get<CorbeillePlans>(`/activites/plans?annee=${annee}`, signal),
    placeholderData: (precedent) => precedent,
  });

export const obligationsQuery = (filtre: string) =>
  queryOptions({
    queryKey: [CLE, "obligations", filtre],
    queryFn: ({ signal }) =>
      api.get<RegistreObligations>(
        `/activites/obligations?filtre=${encodeURIComponent(filtre)}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
  });

/* ------------------------------------------------------------------ *
 *  Ecritures
 * ------------------------------------------------------------------ */

export interface SaisieActivite {
  intitule: string;
  axe: LibelleAxe;
  objectif: string;
  etatReferenceGeneral: string;
  resultatsAttendus: string;
  debut: string;
  fin: string;
  budgetValide: number | null;
  /**
   * Le responsable de l'activité, distinct de qui la saisit.
   *
   * Un point focal inscrit les activités de toute sa direction : le déduire du
   * compte connecté aurait fait de lui le responsable de tout, et rendu la
   * colonne « responsable » du registre inutilisable.
   *
   * L'identifiant et non le nom : le champ était libre et le serveur comparait
   * la saisie au nom complet caractère par caractère. Voir l'ADR 020.
   */
  responsableId: number;
}

/** Modification d'une activité inscrite. Le motif alimente la fiche de vie. */
export interface SaisieModificationActivite extends SaisieActivite {
  activiteId: number;
  motif: string;
}

export interface SaisieIndicateurActivite {
  activiteId: number;
  libelle: string;
  unite: string;
  etatReference: string;
  cible: string;
}

/** Relevé d'un indicateur : la seule valeur qui bouge après la création. */
export interface SaisieReleveIndicateur {
  activiteId: number;
  indicateurId: number;
  realise: string;
}

export interface SaisieTacheActivite {
  activiteId: number;
  libelle: string;
  echeance: string;
  responsableId: number;
}

/**
 * Déclaration d'avancement — **sans pièce**.
 *
 * Le champ `pieces: {nom, poids}[]` a disparu le 17 août 2026. Il n'envoyait
 * que le nom et le poids du fichier, jamais le fichier : le serveur inscrivait
 * une ligne de pièce jointe sans empreinte ni chemin de stockage, l'onglet des
 * pièces la listait comme les autres, et le clic tombait sur une erreur.
 *
 * Les justificatifs se versent par `POST /api/pieces` (`useDeposerPiece`), qui
 * envoie le binaire. La modale d'avancement enchaîne les deux appels.
 */
export interface SaisieAvancementActivite {
  activiteId: number;
  avancement: number;
  observation: string;
  tachesFaites: number[];
}

export interface SaisieSuspension {
  activiteId: number;
  action: "suspendre" | "reprendre";
  motif: string;
  /** Référence de la décision qui suspend ou lève la suspension. */
  reference: string | null;
}

export interface SaisieInstructionActivite {
  activiteId: number;
  origine: "Instruction verbale" | "Décision du DG";
  reference: string | null;
  texte: string;
  responsableId: number;
  echeance: string;
}

export interface SaisieLeveeInstruction {
  activiteId: number;
  instructionId: number;
  commentaire: string;
}

export interface SaisieRelanceActivite {
  activiteId: number;
  texte: string;
}

export interface SaisieDepot {
  obligationId: number;
  nomFichier: string;
  poids: string;
  commentaire: string;
}

export interface SaisieEtatPlan {
  annee: number;
  structureSigle: string;
  /** « soumettre » par la structure, « valider » ou « retourner » par le contrôle de gestion. */
  action: "soumettre" | "valider" | "retourner";
  motif: string | null;
}

function useEcriture<TCorps>(chemin: string | ((corps: TCorps) => string)) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (corps: TCorps) =>
      api.post<{ id: number }>(typeof chemin === "function" ? chemin(corps) : chemin, corps),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [CLE] });
      // Les activites alimentent le scoring et les tableaux de bord : les trois
      // doivent bouger ensemble, sans quoi deux ecrans affichent deux verites.
      void client.invalidateQueries({ queryKey: ["performance"] });
      void client.invalidateQueries({ queryKey: ["pilotage"] });
      // Une instruction ou une suspension nait d'une decision : le registre des
      // decisions doit voir la retombee qu'il vient de produire.
      void client.invalidateQueries({ queryKey: ["gouvernance"] });
    },
  });
}

export const useCreerActivite = () => useEcriture<SaisieActivite>("/activites");

export const useModifierActivite = () =>
  useEcriture<SaisieModificationActivite>((corps) => `/activites/${corps.activiteId}`);

export const useAjouterIndicateur = () =>
  useEcriture<SaisieIndicateurActivite>((corps) => `/activites/${corps.activiteId}/indicateurs`);

export const useReleverIndicateur = () =>
  useEcriture<SaisieReleveIndicateur>(
    (corps) => `/activites/${corps.activiteId}/indicateurs/${corps.indicateurId}/releve`,
  );

export const useAjouterTache = () =>
  useEcriture<SaisieTacheActivite>((corps) => `/activites/${corps.activiteId}/taches`);

export const useDeclarerAvancement = () =>
  useEcriture<SaisieAvancementActivite>((corps) => `/activites/${corps.activiteId}/avancement`);

export const useSuspendreActivite = () =>
  useEcriture<SaisieSuspension>((corps) => `/activites/${corps.activiteId}/suspension`);

export const useRattacherInstruction = () =>
  useEcriture<SaisieInstructionActivite>((corps) => `/activites/${corps.activiteId}/instructions`);

export const useLeverInstruction = () =>
  useEcriture<SaisieLeveeInstruction>(
    (corps) => `/activites/${corps.activiteId}/instructions/${corps.instructionId}/levee`,
  );

export const useRelancerActivite = () =>
  useEcriture<SaisieRelanceActivite>((corps) => `/activites/${corps.activiteId}/relance`);

export const useDeposerObligation = () =>
  useEcriture<SaisieDepot>((corps) => `/activites/obligations/${corps.obligationId}/depot`);

export const useChangerEtatPlan = () => useEcriture<SaisieEtatPlan>("/activites/plan/etat");
