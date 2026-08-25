import type { NomIcone } from "@/components/ui/Icone";
import { PERMISSIONS, type Permission } from "@/types/habilitation";

/**
 * Menu declaratif.
 *
 * Chaque entree porte les permissions qui l'ouvrent — jamais un nom de role.
 * Ajouter une direction ou un niveau hierarchique ne touche donc pas ce fichier :
 * c'est une ligne dans `structure` ou `niveau_hierarchique`, cote base.
 */

/** Compteurs affiches en pastille. Le serveur les renvoie en un seul appel. */
export type CleCompteur = "courriers" | "cotations" | "relances";

export interface SousEntreeMenu {
  libelle: string;
  chemin: string;
  permissions: Permission[];
}

export interface EntreeMenu {
  libelle: string;
  chemin: string;
  icone: NomIcone;
  /** Au moins une de ces permissions suffit a afficher l'entree. */
  permissions: Permission[];
  compteur?: CleCompteur;
  /** Pastille rouge : ce compteur appelle une action, il ne compte pas. */
  compteurAlerte?: boolean;
  sousEntrees?: SousEntreeMenu[];
  /** Groupe repliable dont l'entete n'est pas elle-meme une destination. */
  repliable?: boolean;
}

/** Les entrees sont regroupees visuellement par un simple espace, sans titre. */
export const MENU: EntreeMenu[][] = [
  [
    {
      libelle: "Tableau de bord",
      chemin: "/",
      icone: "tableauDeBord",
      permissions: [PERMISSIONS.LEC],
    },
    {
      libelle: "Courriers",
      chemin: "/courriers",
      icone: "courrier",
      permissions: [PERMISSIONS.LEC],
      compteur: "courriers",
      sousEntrees: [
        { libelle: "Courriers arrivés", chemin: "/courriers", permissions: [PERMISSIONS.LEC] },
        {
          libelle: "Courriers départ",
          chemin: "/courriers/departs",
          permissions: [PERMISSIONS.LEC],
        },
        /*
         * La file de signature au menu, et non derriere un bouton du registre
         * des departs. Celui qui signe ne vient pas parcourir un registre : il
         * ouvre l'application pour vider sa file, et doit la trouver du premier
         * coup d'oeil. C'est le §3.1 pour le Directeur general, le §3.4 pour la
         * validation de premier niveau.
         */
        {
          libelle: "File de signature",
          chemin: "/courriers/departs/signature",
          permissions: [PERMISSIONS.VAL],
        },
        {
          libelle: "Courriers internes",
          chemin: "/courriers/internes",
          permissions: [PERMISSIONS.LEC],
        },
        { libelle: "Import de masse", chemin: "/courriers/import", permissions: [PERMISSIONS.ENR] },
      ],
    },
    {
      libelle: "Cotations",
      chemin: "/cotations",
      icone: "document",
      permissions: [PERMISSIONS.COT, PERMISSIONS.COT_DEL],
      compteur: "cotations",
    },
    {
      libelle: "Affectations",
      chemin: "/affectations",
      icone: "personnes",
      permissions: [PERMISSIONS.AFF],
    },
    {
      libelle: "Suivi et relance",
      chemin: "/suivi",
      icone: "horloge",
      permissions: [PERMISSIONS.LEC, PERMISSIONS.REL],
      compteur: "relances",
      compteurAlerte: true,
    },
  ],
  [
    /*
     * Restitution — les trois niveaux emboites du descriptif.
     *
     * Le cockpit passe avant tout le reste pour qui le porte : c'est son
     * ecran d'accueil, et il doit y revenir d'un geste.
     */
    {
      /*
       * La vue d'ensemble passe avant le cockpit, et pour un seul poste.
       * Le Directeur general ouvre l'application sur l'etat de l'institution ;
       * il descend ensuite dans le cockpit pour arbitrer.
       */
      libelle: "Vue d'ensemble",
      chemin: "/direction",
      icone: "graphique",
      permissions: [PERMISSIONS.VUE_DG],
    },
    {
      /*
       * Meme libelle, meme place, autre destination : celle du membre du
       * Comite de direction. Les deux permissions ne se rencontrent jamais sur
       * un meme compte, et c'est voulu — chacun n'a qu'une vue d'ensemble, la
       * sienne, et n'a pas a choisir entre deux entrees de menu presque
       * identiques.
       */
      libelle: "Vue d'ensemble",
      chemin: "/comite",
      icone: "graphique",
      permissions: [PERMISSIONS.VUE_CODIR],
    },
    {
      libelle: "Cockpit exécutif",
      chemin: "/cockpit",
      icone: "tableauDeBord",
      permissions: [PERMISSIONS.COCKPIT],
    },
    {
      libelle: "Tableau de bord de structure",
      chemin: "/pilotage/structures",
      icone: "classement",
      permissions: [PERMISSIONS.ACT_LEC],
    },
    {
      libelle: "Synthèse pour l'instance",
      chemin: "/pilotage/synthese",
      icone: "document",
      permissions: [PERMISSIONS.COCKPIT],
    },
  ],
  [
    /*
     * Activites des structures.
     *
     * Groupe repliable, place avant la gouvernance : c'est le travail
     * quotidien du point focal, alors que la gouvernance est celui de la DSR.
     */
    {
      libelle: "Activités",
      chemin: "/activites",
      icone: "cible",
      permissions: [PERMISSIONS.ACT_LEC],
      repliable: true,
      sousEntrees: [
        {
          libelle: "Activités des structures",
          chemin: "/activites",
          permissions: [PERMISSIONS.ACT_LEC],
        },
        {
          libelle: "Plan d'actions annuel",
          chemin: "/activites/plan",
          permissions: [PERMISSIONS.ACT_LEC],
        },
        /*
         * La corbeille du controle de gestion. Sur ACT_VAL et non ACT_LEC :
         * savoir quels plans attendent une decision n'interesse que celui qui
         * la rend, et l'entree serait un cul-de-sac pour tous les autres.
         */
        {
          libelle: "Plans à valider",
          chemin: "/activites/plans",
          permissions: [PERMISSIONS.ACT_VAL],
        },
        {
          libelle: "Obligations de reporting",
          chemin: "/activites/obligations",
          permissions: [PERMISSIONS.ACT_SAI],
        },
      ],
    },
  ],
  [
    /*
     * Exploitation — la cote du chenal et les recouvrements.
     *
     * Une entree simple, pas un groupe : c'est un seul ecran. Il se place
     * apres les activites parce que c'est la meme nature de geste — une
     * structure rend compte de ce qu'elle mesure — et avant la gouvernance,
     * qui est le controle exerce sur ces comptes rendus.
     */
    {
      libelle: "Exploitation",
      chemin: "/exploitation",
      icone: "graphique",
      permissions: [PERMISSIONS.EXP_SAI, PERMISSIONS.EXP_LEC],
    },
  ],
  [
    /*
     * Gouvernance — le dispositif de la DSR.
     *
     * Groupe repliable : trois registres qu'on ouvre ensemble ou pas du tout.
     * Un agent de session ne verra jamais ce groupe, faute de porter l'une des
     * trois permissions.
     */
    {
      libelle: "Gouvernance",
      chemin: "/gouvernance/decisions",
      icone: "reunion",
      permissions: [PERMISSIONS.DEC, PERMISSIONS.INST, PERMISSIONS.DISPO, PERMISSIONS.REL],
      repliable: true,
      sousEntrees: [
        {
          libelle: "Décisions des instances",
          chemin: "/gouvernance/decisions",
          permissions: [PERMISSIONS.DEC],
        },
        {
          libelle: "Réunions et rapports",
          chemin: "/gouvernance/seances",
          permissions: [PERMISSIONS.INST],
        },
        {
          libelle: "Filiales et succursales",
          chemin: "/gouvernance/filiales",
          // DEC et non INST : les prescriptions des organes de gestion sont des
          // engagements d'origine ORGANE_FILIALE (ADR 006), et le DG comme le
          // CODIR portent DEC sans INST. Meme garde que la route serveur.
          permissions: [PERMISSIONS.DEC],
        },
        {
          libelle: "Représentations extérieures",
          chemin: "/gouvernance/representations",
          permissions: [PERMISSIONS.DEC],
        },
        {
          libelle: "Disponibilité des responsables",
          chemin: "/gouvernance/disponibilites",
          permissions: [PERMISSIONS.DISPO],
        },
        {
          libelle: "Planning des congés",
          chemin: "/gouvernance/conges",
          permissions: [PERMISSIONS.DISPO],
        },
        {
          libelle: "Référentiel des structures",
          chemin: "/gouvernance/structures",
          // En lecture, et sous REL : c'est celui qui relance les structures
          // qui a besoin de leurs delais et de leurs encours. L'inscription
          // d'une structure, elle, est passee en administration (ADR 021).
          permissions: [PERMISSIONS.REL],
        },
      ],
    },
  ],
  [
    /*
     * Projets et dossiers — l'instruction des demandes.
     *
     * Place apres le courrier et avant la gouvernance : c'est la suite du
     * courrier pour l'instructeur, et le travail quotidien de son poste.
     */
    {
      libelle: "Dossiers",
      chemin: "/dossiers",
      icone: "document",
      permissions: [PERMISSIONS.DOS_LEC],
      repliable: true,
      sousEntrees: [
        {
          libelle: "Dossiers à instruire",
          chemin: "/dossiers",
          permissions: [PERMISSIONS.DOS_LEC],
        },
        {
          libelle: "Courriers-type",
          chemin: "/dossiers/modeles",
          permissions: [PERMISSIONS.DOS_INS],
        },
      ],
    },
  ],
  [
    /*
     * Archivage — le referentiel de conservation et les versements.
     *
     * Groupe repliable comme les autres. Le referentiel avant les versements :
     * on ne verse rien tant que la regle qui s'applique n'est pas fixee.
     */
    {
      libelle: "Archivage",
      chemin: "/archivage/versements",
      icone: "archive",
      permissions: [PERMISSIONS.ARCH],
      repliable: true,
      sousEntrees: [
        {
          libelle: "Référentiel de conservation",
          chemin: "/archivage/referentiel",
          permissions: [PERMISSIONS.ARCH],
        },
        {
          libelle: "Versements",
          chemin: "/archivage/versements",
          permissions: [PERMISSIONS.ARCH],
        },
      ],
    },
  ],
  [
    /*
     * Performance — la mesure et la regle qui la produit.
     *
     * Le classement d'abord : c'est ce qu'on vient voir. Le dictionnaire et le
     * calendrier ensuite, reserves a qui les administre.
     */
    {
      libelle: "Performance",
      chemin: "/performance/classement",
      icone: "classement",
      permissions: [PERMISSIONS.SCORE, PERMISSIONS.SCORE_ADM],
      repliable: true,
      sousEntrees: [
        {
          libelle: "Matrice de scoring",
          chemin: "/performance/classement",
          permissions: [PERMISSIONS.SCORE],
        },
        {
          libelle: "Indicateurs et risques",
          chemin: "/performance/indicateurs",
          permissions: [PERMISSIONS.SCORE_ADM],
        },
        {
          libelle: "Calendrier de production",
          chemin: "/performance/calendrier",
          permissions: [PERMISSIONS.SCORE_ADM],
        },
      ],
    },
  ],
  [
    {
      libelle: "Pilotage",
      chemin: "/statistiques",
      icone: "graphique",
      // ACT_LEC ouvre la section pour les seuls rapports périodiques : un
      // responsable de structure n'a pas les statistiques de l'institution,
      // mais il a le rapport de la sienne.
      permissions: [PERMISSIONS.STAT, PERMISSIONS.IMP, PERMISSIONS.ACT_LEC],
      repliable: true,
      sousEntrees: [
        { libelle: "Statistiques", chemin: "/statistiques", permissions: [PERMISSIONS.STAT] },
        {
          libelle: "Analyses croisées",
          chemin: "/pilotage/analyses",
          permissions: [PERMISSIONS.STAT],
        },
        {
          libelle: "Indicateurs du programme",
          chemin: "/pilotage/programme",
          permissions: [PERMISSIONS.STAT],
        },
        {
          libelle: "Rapports périodiques",
          chemin: "/rapports",
          // Meme garde que le serveur : le controle de gestion sort le rapport
          // de l'institution, un responsable celui de sa structure.
          permissions: [PERMISSIONS.STAT, PERMISSIONS.ACT_LEC],
        },
        { libelle: "Impressions", chemin: "/impressions", permissions: [PERMISSIONS.IMP] },
      ],
    },
  ],
  [
    {
      libelle: "Organisation",
      chemin: "/organisation",
      icone: "organisation",
      permissions: [PERMISSIONS.ADM_ORG],
    },
    {
      libelle: "Habilitations",
      chemin: "/habilitations",
      icone: "bouclier",
      permissions: [PERMISSIONS.ADM_HAB],
    },
    {
      libelle: "Paramétrage métier",
      chemin: "/parametrage",
      icone: "reglages",
      permissions: [PERMISSIONS.ADM_PAR],
    },
    {
      libelle: "Traçabilité",
      chemin: "/tracabilite",
      icone: "horloge",
      permissions: [PERMISSIONS.AUDIT],
    },
  ],
];

const autorisee = (permissions: Permission[], requises: Permission[]) =>
  requises.some((code) => permissions.includes(code));

export function filtrerMenu(permissions: Permission[]): EntreeMenu[][] {
  return MENU.map((groupe) =>
    groupe
      .filter((entree) => autorisee(permissions, entree.permissions))
      .map((entree) => ({
        ...entree,
        sousEntrees: entree.sousEntrees?.filter((sous) => autorisee(permissions, sous.permissions)),
      }))
      // Un groupe repliable sans aucune sous-entree lisible n'a plus d'objet.
      .filter((entree) => !entree.repliable || (entree.sousEntrees?.length ?? 0) > 0),
  ).filter((groupe) => groupe.length > 0);
}
