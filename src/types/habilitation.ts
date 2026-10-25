/**
 * Codes de permission — miroir exact de la table `permission` (init_base.sql).
 *
 * Les codes sont groupés par domaine, comme la table. Un domaine correspond à
 * un pilier du descriptif fonctionnel : le courrier, les activités des
 * structures, la gouvernance des instances, la performance, l'archivage.
 *
 * Aucun de ces codes ne nomme un rôle. « Attaché à la DSR » n'est pas une
 * permission : c'est un profil, qui en porte plusieurs. Cette distinction est
 * ce qui permet d'ajouter une direction ou de déplacer une responsabilité sans
 * toucher au code.
 */
export const PERMISSIONS = {
  // Courrier
  LEC: "LEC",
  ENR: "ENR",
  COT: "COT",
  COT_DEL: "COT_DEL",
  AFF: "AFF",
  TRA: "TRA",
  VAL: "VAL",
  TRANS: "TRANS",
  CLO: "CLO",
  REL: "REL",
  IMP: "IMP",
  CONF: "CONF",
  STAT: "STAT",
  /**
   * Tenir le bureau d'ordre de sa structure — accuser réception d'une entrée,
   * prononcer une sortie. Au Port, le bureau d'ordre d'une structure **est**
   * son point focal. Voir ADR 047.
   */
  BO_STR: "BO_STR",

  // Activités des structures — plans d'actions, réalisations, rapports
  ACT_LEC: "ACT_LEC",
  ACT_SAI: "ACT_SAI",
  ACT_VAL: "ACT_VAL",
  /**
   * Recalibrer un avancement déclaré. Le seul profil DSR la porte — pas le
   * contrôle de gestion, qui porte pourtant ACT_VAL : l'exigence dit « seule
   * la DSR ». Voir ADR 030.
   */
  ACT_REC: "ACT_REC",

  // Gouvernance — décisions des instances, réunions, disponibilité
  DEC: "DEC",
  INST: "INST",
  DISPO: "DISPO",

  // Performance — scoring des structures et cockpit
  SCORE: "SCORE",
  SCORE_ADM: "SCORE_ADM",
  COCKPIT: "COCKPIT",

  /*
   * Vue d'ensemble de la Direction générale — la seule exception à la règle
   * énoncée plus haut.
   *
   * COCKPIT ne suffisait pas : le Comité de direction le porte aussi, et son
   * cockpit est un écran d'arbitrages partagé. La vue d'ensemble, elle, est
   * une restitution d'un seul poste — celui qui répond de l'institution
   * entière devant son conseil. Elle n'a ni périmètre à choisir ni déclinaison
   * par structure ; l'ouvrir à un second profil la viderait de son objet.
   *
   * On assume donc de nommer ici le destinataire, faute de capacité à
   * décrire : ce n'est pas « consulter » quelque chose de plus, c'est occuper
   * ce poste-là. Rien d'autre dans la table ne procède ainsi, et rien d'autre
   * ne devrait.
   */
  VUE_DG: "VUE_DG",

  /*
   * Vue d'ensemble du Comité de direction — même exception, même raison.
   *
   * Le CODIR est le conseil des directeurs : une instance, pas un poste. Sa
   * vue d'ensemble a donc le même appareil que celle du Directeur général —
   * une bande de repères et cinq graphiques — mais elle répond à une autre
   * question : où se situent les directions les unes par rapport aux autres,
   * et laquelle décroche.
   *
   * D'où le périmètre institutionnel, exception assumée au cloisonnement par
   * structure : un conseil de directeurs qui ne verrait pas les directions ne
   * délibérerait sur rien.
   *
   * Séparée de VUE_DG, parce que le Directeur général agrège l'institution
   * quand le Comité compare ses directions ; séparée de COCKPIT, parce que le
   * cockpit reste l'écran d'arbitrage et qu'il est partagé.
   */
  VUE_CODIR: "VUE_CODIR",

  /*
   * Relevés d'exploitation — la cote du chenal et les recouvrements.
   *
   * Quatrième famille de données de l'application, à côté du courrier, des
   * activités et des décisions. Elle n'est produite par aucune des trois : la
   * DDLM relève une profondeur, la Direction de l'exploitation constate des
   * recouvrements, la Direction des finances rapporte les autres recettes.
   * Aucune de ces mesures ne naît d'un courrier reçu ni d'une activité inscrite
   * au plan — d'où des permissions propres.
   *
   * EXP_SAI est bornée par le périmètre, comme ACT_SAI : la Régie du dragage
   * saisit la cote, elle ne saisit pas les recettes de l'exploitation.
   * EXP_LEC est la consolidation — elle ouvre les chiffres de toutes les
   * structures, et c'est ce que le Directeur général lit sur sa vue d'ensemble.
   */
  EXP_SAI: "EXP_SAI",
  EXP_LEC: "EXP_LEC",

  /*
   * Projets et dossiers — l'instruction des demandes administratives.
   *
   * Distinctes des permissions de courrier : un courrier se transmet et se
   * clôt, un dossier s'instruit. Le même agent peut porter les deux, mais ce
   * ne sont pas les mêmes gestes, et le descriptif fonctionnel les traite
   * comme deux piliers séparés.
   */
  DOS_LEC: "DOS_LEC",
  DOS_INS: "DOS_INS",
  DOS_VAL: "DOS_VAL",

  // Archivage
  ARCH: "ARCH",

  /*
   * Accès externe — usagers, entreprises partenaires, autres administrations.
   *
   * Cette permission n'ouvre rien dans l'application interne : le portail
   * externe est un chantier distinct, avec sa propre porte d'entrée. Elle
   * existe ici pour que le compte soit modélisable et que rien, dans l'espace
   * de travail, ne s'ouvre par défaut à qui ne porte qu'elle.
   */
  EXT: "EXT",

  // Administration
  ADM_ORG: "ADM_ORG",
  ADM_HAB: "ADM_HAB",
  ADM_PAR: "ADM_PAR",
  AUDIT: "AUDIT",

  /*
   * Exploitation technique — §3.10.
   *
   * Distincte des permissions d'administration fonctionnelle : superviser la
   * plateforme et brancher l'annuaire ne donne aucun droit sur les
   * référentiels métier, et réciproquement. C'est la séparation des tâches
   * qu'exige le BRD (RNF-SEC-02).
   */
  ADM_TEC: "ADM_TEC",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Etendue des donnees visibles. Correspond a la notion de perimetre du modele. */
export type PortereePerimetre =
  | "poste"
  | "structure"
  | "structure_et_descendants"
  | "institution";

export interface Perimetre {
  portee: PortereePerimetre;
  structureId: number | null;
}

/**
 * L'utilisateur connecte tel que le renvoie le serveur.
 * Les permissions sont resolues cote serveur (profils + delegations en cours)
 * et arrivent ici sous forme de liste plate : le client ne recalcule rien.
 */
export interface UtilisateurConnecte {
  id: number;
  nomComplet: string;
  initiales: string;
  posteLibelle: string;
  structureLibelle: string;
  /**
   * Le sigle de la structure de rattachement — vide si l'agent n'en a aucune.
   *
   * Le libelle ne suffit pas la ou une saisie designe des structures par
   * sigle : la modale d'activite ecarte de son selecteur la structure
   * porteuse, qu'elle ne connait que par la session (ADR 047).
   */
  structureSigle: string;
  permissions: Permission[];
  perimetre: Perimetre;
  /** Session courrier de rattachement. Un agent n'en a qu'une. */
  sessionCourrier: { id: number; code: string; libelle: string } | null;
  /** Vrai lorsque la session de rattachement lit toutes les autres. */
  litToutesSessions: boolean;
  /** Delegation en cours, le cas echeant : l'agent agit au nom d'un autre. */
  delegationDe: { id: number; nomComplet: string } | null;
}
