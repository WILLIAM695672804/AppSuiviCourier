import { PERMISSIONS, type UtilisateurConnecte } from "@/types/habilitation";

/**
 * Les treize acteurs du descriptif fonctionnel, en comptes de démonstration.
 *
 * AVERTISSEMENT — ce n'est pas une authentification. Les mots de passe qui
 * suivent partent dans le navigateur avec le reste du code : n'importe qui
 * peut les lire. C'est sans conséquence ici, et seulement ici, parce qu'aucune
 * donnée réelle n'existe et que tout ce fichier disparaît du bundle dès que
 * VITE_MODE_DEMO passe à « false ».
 *
 * L'ordre suit celui du document — §3.1 à §3.13 — et non l'importance
 * hiérarchique : c'est ainsi que la correspondance se vérifie, un acteur du
 * papier après l'autre.
 *
 * Leur raison d'être : vérifier écran par écran ce que voit chaque poste. Un
 * compte qui porterait toutes les permissions ne prouverait rien.
 */
export interface CompteDemo {
  identifiant: string;
  motDePasse: string;
  /** Référence de l'acteur dans le descriptif fonctionnel, affichée à la connexion. */
  acteur: string;
  /** Regroupement de la liste de connexion, pour que treize entrées restent lisibles. */
  famille: "Gouvernance" | "Structures" | "Chaîne du courrier" | "Fonctions support" | "Externe";
  /** Ce que ce compte permet de vérifier. */
  description: string;
  utilisateur: UtilisateurConnecte;
}

export const COMPTES_DEMO: CompteDemo[] = [
  {
    identifiant: "dg",
    motDePasse: "demo",
    acteur: "§3.1 — Directeur Général",
    famille: "Gouvernance",
    description: "Vue d'ensemble, cockpit, signature, clôture, courriers confidentiels",
    utilisateur: {
      id: 13,
      nomComplet: "N'Guessan Y.",
      initiales: "NY",
      posteLibelle: "Directeur général",
      structureLibelle: "Direction générale",
      permissions: [
        PERMISSIONS.LEC,
        PERMISSIONS.COT,
        PERMISSIONS.VAL,
        PERMISSIONS.CLO,
        PERMISSIONS.CONF,
        PERMISSIONS.STAT,
        PERMISSIONS.IMP,
        // VUE_DG ouvre la vue d'ensemble, qui devient son écran d'accueil.
        // COCKPIT reste : la synthèse pour l'instance en dépend, et le cockpit
        // demeure l'écran où il arbitre.
        PERMISSIONS.VUE_DG,
        PERMISSIONS.COCKPIT,
        // La cote du chenal et les recouvrements, qu'il a demandes sur sa vue
        // d'ensemble. En lecture seule : il ne releve ni ne saisit rien.
        PERMISSIONS.EXP_LEC,
        PERMISSIONS.ACT_LEC,
        PERMISSIONS.DEC,
        PERMISSIONS.SCORE,
        PERMISSIONS.DOS_LEC,
      ],
      perimetre: { portee: "institution", structureId: null },
      sessionCourrier: null,
      litToutesSessions: true,
      delegationDe: null,
    },
  },
  {
    identifiant: "codir",
    motDePasse: "demo",
    acteur: "§3.2 — Comité de direction",
    famille: "Gouvernance",
    description: "Vue d'ensemble du Comité, classement, décisions, cockpit",
    utilisateur: {
      id: 16,
      nomComplet: "P. Etoundi",
      initiales: "PE",
      posteLibelle: "Directeur, membre du Comité de direction",
      structureLibelle: "DAF — Direction des affaires financières",
      permissions: [
        PERMISSIONS.LEC,
        PERMISSIONS.STAT,
        PERMISSIONS.ACT_LEC,
        PERMISSIONS.DEC,
        PERMISSIONS.SCORE,
        // VUE_CODIR ouvre sa vue d'ensemble, qui devient son écran d'accueil.
        // COCKPIT reste : le cockpit demeure l'écran partagé où l'institution
        // arbitre, et le §3.2 l'y fait siéger.
        PERMISSIONS.VUE_CODIR,
        PERMISSIONS.COCKPIT,
        PERMISSIONS.EXP_LEC,
      ],
      perimetre: { portee: "institution", structureId: null },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "dsr",
    motDePasse: "demo",
    acteur: "§3.3 — Division du suivi et de la relance",
    famille: "Gouvernance",
    description: "Pivot du dispositif — décisions, instances, scoring, relance",
    utilisateur: {
      id: 15,
      nomComplet: "F. Ngo Bell",
      initiales: "FN",
      posteLibelle: "Chef de la Division du suivi et de la relance",
      structureLibelle: "DSR — Division du suivi et de la relance",
      permissions: [
        PERMISSIONS.LEC,
        PERMISSIONS.REL,
        PERMISSIONS.STAT,
        PERMISSIONS.IMP,
        // Plus d'ADM_STR : les structures s'inscrivent dans la zone
        // d'administration (ADR 021). La DSR les consulte — le referentiel est
        // ouvert a toute session (ADR 007) — et REL lui ouvre l'ecran.
        PERMISSIONS.ACT_LEC,
        /*
         * Le §3.3 lui demande un « accès complet : saisie, consolidation,
         * paramétrage, export » sur le module des activités. Sans ACT_SAI elle
         * consolidait ce qu'elle ne pouvait pas corriger, et les obligations de
         * reporting — l'écran qui dit qui doit quoi — lui restaient masquées.
         */
        PERMISSIONS.ACT_SAI,
        PERMISSIONS.ACT_VAL,
        PERMISSIONS.DEC,
        PERMISSIONS.INST,
        PERMISSIONS.DISPO,
        PERMISSIONS.SCORE,
        PERMISSIONS.SCORE_ADM,
        PERMISSIONS.COCKPIT,
        PERMISSIONS.DOS_LEC,
      ],
      perimetre: { portee: "institution", structureId: null },
      // Pas de CONF : la DSR ne connait pas le courrier confidentiel, ni dans
      // ses listes ni dans ses totaux (decision D5).
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "resp",
    motDePasse: "demo",
    acteur: "§3.4 — Directeur, chef de service",
    famille: "Structures",
    description: "Cotation, affectation, validation, activités de sa branche",
    utilisateur: {
      id: 12,
      nomComplet: "S. Bamba",
      initiales: "SB",
      posteLibelle: "Chef de service comptabilité",
      structureLibelle: "DAF — Direction des affaires financières",
      permissions: [
        PERMISSIONS.LEC,
        PERMISSIONS.COT,
        PERMISSIONS.AFF,
        PERMISSIONS.TRA,
        PERMISSIONS.VAL,
        PERMISSIONS.REL,
        PERMISSIONS.STAT,
        PERMISSIONS.IMP,
        PERMISSIONS.ACT_LEC,
        PERMISSIONS.ACT_SAI,
        PERMISSIONS.SCORE,
        PERMISSIONS.DOS_LEC,
        PERMISSIONS.DOS_INS,
        PERMISSIONS.DOS_VAL,
      ],
      perimetre: { portee: "structure_et_descendants", structureId: 3 },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "focal",
    motDePasse: "demo",
    acteur: "§3.5 — Point focal de structure",
    famille: "Structures",
    description: "Saisit les activités de sa seule structure, sans voir les autres",
    utilisateur: {
      id: 17,
      nomComplet: "L. Mbarga",
      initiales: "LM",
      posteLibelle: "Point focal de la direction",
      structureLibelle: "DAF — Direction des affaires financières",
      permissions: [PERMISSIONS.LEC, PERMISSIONS.ACT_LEC, PERMISSIONS.ACT_SAI, PERMISSIONS.DISPO],
      perimetre: { portee: "structure", structureId: 3 },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  /*
   * Les quatre structures d'exploitation, ajoutees le 11 aout 2026.
   *
   * Elles ne figurent pas au §3 du descriptif fonctionnel : elles viennent de
   * la demande du Directeur general de voir la cote du chenal et les
   * recouvrements sur son tableau de bord. Leur acteur est donc note d'apres
   * cette demande, et non d'apres un paragraphe du document.
   *
   * Toutes portent EXP_SAI et aucune EXP_LEC : chacune rend compte de ce
   * qu'elle mesure, aucune ne lit les chiffres des autres. C'est la regle de
   * visibilite appliquee a la lettre, et c'est le serveur qui la tient.
   */
  {
    identifiant: "ddlm",
    motDePasse: "demo",
    acteur: "Direction du dragage et de la logistique maritime",
    famille: "Structures",
    description: "Repond de la cote du chenal, releve par sa Regie",
    utilisateur: {
      id: 23,
      nomComplet: "J. Ekwalla",
      initiales: "JE",
      posteLibelle: "Directeur du dragage et de la logistique maritime",
      structureLibelle: "DDLM — Direction du dragage et de la logistique maritime",
      permissions: [
        PERMISSIONS.LEC,
        PERMISSIONS.COT,
        PERMISSIONS.AFF,
        PERMISSIONS.STAT,
        PERMISSIONS.ACT_LEC,
        PERMISSIONS.ACT_SAI,
        PERMISSIONS.SCORE,
        PERMISSIONS.EXP_SAI,
      ],
      // La Regie du dragage lui est rattachee : il voit ce qu'elle releve.
      perimetre: { portee: "structure_et_descendants", structureId: 13 },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "rdd",
    motDePasse: "demo",
    acteur: "Régie du dragage — bras opérationnel de la DDLM",
    famille: "Structures",
    description: "Releve la cote sur le terrain, ne voit aucune recette",
    utilisateur: {
      id: 24,
      nomComplet: "B. Mouangue",
      initiales: "BM",
      posteLibelle: "Chef de la Régie du dragage",
      structureLibelle: "RDD — Régie du dragage",
      permissions: [
        PERMISSIONS.LEC,
        PERMISSIONS.TRA,
        PERMISSIONS.ACT_LEC,
        PERMISSIONS.ACT_SAI,
        PERMISSIONS.EXP_SAI,
      ],
      perimetre: { portee: "structure", structureId: 14 },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "dex",
    motDePasse: "demo",
    acteur: "Direction de l'exploitation",
    famille: "Structures",
    description: "Constate les recouvrements des secteurs portuaires",
    utilisateur: {
      id: 25,
      nomComplet: "G. Njoya",
      initiales: "GN",
      posteLibelle: "Directeur de l'exploitation",
      structureLibelle: "DEX — Direction de l'exploitation",
      permissions: [
        PERMISSIONS.LEC,
        PERMISSIONS.COT,
        PERMISSIONS.AFF,
        PERMISSIONS.STAT,
        PERMISSIONS.ACT_LEC,
        PERMISSIONS.ACT_SAI,
        PERMISSIONS.SCORE,
        PERMISSIONS.EXP_SAI,
      ],
      perimetre: { portee: "structure_et_descendants", structureId: 15 },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "dfc",
    motDePasse: "demo",
    acteur: "Direction des finances et de la comptabilité",
    famille: "Structures",
    description: "Rapporte les autres recettes — domanialite, produits divers",
    utilisateur: {
      id: 26,
      nomComplet: "V. Tchouta",
      initiales: "VT",
      posteLibelle: "Directeur des finances et de la comptabilité",
      structureLibelle: "DFC — Direction des finances et de la comptabilité",
      permissions: [
        PERMISSIONS.LEC,
        PERMISSIONS.COT,
        PERMISSIONS.AFF,
        PERMISSIONS.VAL,
        PERMISSIONS.STAT,
        PERMISSIONS.ACT_LEC,
        PERMISSIONS.ACT_SAI,
        PERMISSIONS.SCORE,
        PERMISSIONS.EXP_SAI,
      ],
      perimetre: { portee: "structure_et_descendants", structureId: 16 },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "agent",
    motDePasse: "demo",
    acteur: "§3.6 — Agent de bureau d'ordre",
    famille: "Chaîne du courrier",
    description: "Enregistrement, cotation par délégation, bordereaux",
    utilisateur: {
      id: 11,
      nomComplet: "K. Traoré",
      initiales: "KT",
      posteLibelle: "Agent de session courrier",
      structureLibelle: "Service du courrier central",
      permissions: [
        PERMISSIONS.LEC,
        PERMISSIONS.ENR,
        PERMISSIONS.COT_DEL,
        PERMISSIONS.TRANS,
        PERMISSIONS.IMP,
        PERMISSIONS.DOS_LEC,
      ],
      perimetre: { portee: "structure", structureId: 6 },
      sessionCourrier: { id: 1, code: "ARRIVEE", libelle: "Arrivé — bureau d'ordre" },
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "instructeur",
    motDePasse: "demo",
    acteur: "§3.7 — Agent instructeur / traitant",
    famille: "Chaîne du courrier",
    description: "Ses seuls dossiers — le périmètre le plus restreint",
    utilisateur: {
      id: 14,
      nomComplet: "M. Diallo",
      initiales: "MD",
      posteLibelle: "Gestionnaire de dossiers",
      structureLibelle: "DAF — Comptabilité",
      permissions: [PERMISSIONS.LEC, PERMISSIONS.TRA, PERMISSIONS.DOS_LEC, PERMISSIONS.DOS_INS],
      perimetre: { portee: "poste", structureId: 3 },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "archiviste",
    motDePasse: "demo",
    acteur: "§3.8 — Archiviste / records manager",
    famille: "Fonctions support",
    description: "Conservation, versement et sort final des dossiers clos",
    utilisateur: {
      id: 18,
      nomComplet: "R. Fotso",
      initiales: "RF",
      posteLibelle: "Archiviste",
      structureLibelle: "Centre de la documentation et des archives",
      permissions: [PERMISSIONS.LEC, PERMISSIONS.ARCH, PERMISSIONS.IMP],
      perimetre: { portee: "institution", structureId: null },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "admin",
    motDePasse: "demo",
    acteur: "§3.9 — Administrateur fonctionnel",
    famille: "Fonctions support",
    description: "Référentiels, workflows et habilitations — aucun courrier",
    utilisateur: {
      id: 10,
      nomComplet: "A. Kouassi",
      initiales: "AK",
      posteLibelle: "Administrateur fonctionnel",
      structureLibelle: "Cabinet",
      permissions: [PERMISSIONS.ADM_ORG, PERMISSIONS.ADM_HAB, PERMISSIONS.ADM_PAR],
      /*
       * Ni LEC, ni AUDIT.
       *
       * Le descriptif fonctionnel (§3.9) ne lui confie que trois choses : les
       * circuits, les referentiels et les droits. Aucun des trois documents de
       * reference ne lui donne acces au courrier, et le BRD demande l'inverse :
       * moindre privilege et separation des taches (RNF-SEC-02). Celui qui
       * distribue les droits ne consulte pas les dossiers, et ne verifie pas
       * non plus l'usage qui est fait de ses propres decisions.
       */
      perimetre: { portee: "institution", structureId: null },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "it",
    motDePasse: "demo",
    acteur: "§3.10 — Administrateur IT / sécurité",
    famille: "Fonctions support",
    description: "Journaux d'accès et paramétrage technique, aucun courrier",
    utilisateur: {
      id: 19,
      nomComplet: "T. Owona",
      initiales: "TO",
      posteLibelle: "Administrateur technique",
      structureLibelle: "DSI — Direction des systèmes d'information",
      permissions: [PERMISSIONS.AUDIT, PERMISSIONS.ADM_PAR, PERMISSIONS.ADM_TEC],
      // Pas de LEC : exploiter la plateforme ne donne pas le droit de lire le
      // courrier qui y circule.
      perimetre: { portee: "institution", structureId: null },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "dcg",
    motDePasse: "demo",
    acteur: "§3.11 — Contrôleur de gestion",
    famille: "Fonctions support",
    description: "Analyses croisées, indicateurs cibles, validation des PAA",
    utilisateur: {
      id: 20,
      nomComplet: "C. Abena",
      initiales: "CA",
      posteLibelle: "Contrôleur de gestion",
      structureLibelle: "DCG — Direction du contrôle de gestion",
      permissions: [
        PERMISSIONS.LEC,
        PERMISSIONS.STAT,
        PERMISSIONS.ACT_LEC,
        PERMISSIONS.ACT_VAL,
        PERMISSIONS.SCORE,
        /*
         * Le §3.11 lui demande de « contribuer à l'affinement du dictionnaire
         * des indicateurs et des seuils d'alerte ». Sans SCORE_ADM il ne
         * pouvait pas l'ouvrir : la mission était écrite, la permission
         * manquait.
         */
        PERMISSIONS.SCORE_ADM,
      ],
      perimetre: { portee: "institution", structureId: null },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "auditeur",
    motDePasse: "demo",
    acteur: "§3.12 — Auditeur / inspection interne",
    famille: "Fonctions support",
    description: "Journaux seuls — l'historique d'un objet, sur autorisation",
    utilisateur: {
      id: 21,
      nomComplet: "H. Njike",
      initiales: "HN",
      posteLibelle: "Auditeur interne",
      structureLibelle: "Division de l'audit interne",
      /*
       * AUDIT seul.
       *
       * Le §3.12 lui donne « l'historique complet des actions realisees sur un
       * dossier, un courrier ou une decision, sur autorisation » : c'est une
       * consultation ciblee, qui part du journal et remonte vers l'objet — pas
       * un droit de parcourir le registre. LEC lui ouvrirait tout le courrier,
       * STAT les statistiques de performance qui relevent du controle de
       * gestion (§3.11).
       */
      permissions: [PERMISSIONS.AUDIT],
      perimetre: { portee: "institution", structureId: null },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
  {
    identifiant: "usager",
    motDePasse: "demo",
    acteur: "§3.13 — Usager, partenaire, administration",
    famille: "Externe",
    description: "Portail externe — chantier distinct, non ouvert ici",
    utilisateur: {
      id: 22,
      nomComplet: "Société Camrail",
      initiales: "SC",
      posteLibelle: "Entreprise partenaire",
      structureLibelle: "Extérieur à l'institution",
      permissions: [PERMISSIONS.EXT],
      perimetre: { portee: "poste", structureId: null },
      sessionCourrier: null,
      litToutesSessions: false,
      delegationDe: null,
    },
  },
];

/** Clef de `sessionStorage`. La session meurt avec l'onglet : poste partagé. */
const CLEF = "suivi-courrier.compte-demo";

export function ouvrirSessionDemo(identifiant: string): void {
  sessionStorage.setItem(CLEF, identifiant);
}

export function fermerSessionDemo(): void {
  sessionStorage.removeItem(CLEF);
}

export function compteActifDemo(): CompteDemo | null {
  const identifiant = sessionStorage.getItem(CLEF);
  return COMPTES_DEMO.find((c) => c.identifiant === identifiant) ?? null;
}

export function verifierIdentifiants(identifiant: string, motDePasse: string): CompteDemo | null {
  const compte = COMPTES_DEMO.find((c) => c.identifiant === identifiant.trim().toLowerCase());
  return compte && compte.motDePasse === motDePasse ? compte : null;
}
