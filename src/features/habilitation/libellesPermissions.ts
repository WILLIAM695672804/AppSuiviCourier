import { PERMISSIONS, type Permission } from "@/types/habilitation";

/**
 * Les permissions, dites dans la langue de l'institution.
 *
 * L'écran des profils ne montre jamais les codes : un administrateur coche
 * « Signer un courrier départ », pas « VAL ». Les codes restent l'affaire du
 * serveur et de la base.
 *
 * Les groupes suivent les piliers du descriptif fonctionnel, parce que c'est
 * ainsi que l'administrateur raisonne : il habilite quelqu'un « au suivi des
 * activités », pas à une liste de verbes épars.
 */
export interface GroupePermissions {
  titre: string;
  permissions: { code: Permission; libelle: string }[];
}

export const GROUPES_PERMISSIONS: GroupePermissions[] = [
  {
    titre: "Courrier arrivé",
    permissions: [
      { code: PERMISSIONS.LEC, libelle: "Consulter le registre des courriers" },
      { code: PERMISSIONS.ENR, libelle: "Enregistrer et numériser un courrier" },
      { code: PERMISSIONS.COT, libelle: "Coter un courrier à une structure" },
      { code: PERMISSIONS.COT_DEL, libelle: "Saisir une cotation pour une autorité" },
      { code: PERMISSIONS.AFF, libelle: "Affecter un dossier à un agent" },
      { code: PERMISSIONS.TRA, libelle: "Traiter un dossier qui lui est affecté" },
    ],
  },
  {
    titre: "Courrier départ",
    permissions: [
      { code: PERMISSIONS.VAL, libelle: "Apposer un visa et signer un courrier départ" },
      { code: PERMISSIONS.TRANS, libelle: "Éditer un bordereau de remise" },
      { code: PERMISSIONS.CLO, libelle: "Clôturer un courrier" },
    ],
  },
  {
    titre: "Suivi, restitutions et sécurité",
    permissions: [
      { code: PERMISSIONS.REL, libelle: "Relancer et escalader un dossier" },
      { code: PERMISSIONS.IMP, libelle: "Imprimer les registres et bordereaux" },
      { code: PERMISSIONS.STAT, libelle: "Consulter les statistiques et rapports" },
      { code: PERMISSIONS.CONF, libelle: "Ouvrir un courrier confidentiel" },
      { code: PERMISSIONS.AUDIT, libelle: "Consulter les journaux de traçabilité" },
    ],
  },
  {
    titre: "Activités des structures",
    permissions: [
      { code: PERMISSIONS.ACT_LEC, libelle: "Consulter les plans d'actions et les activités" },
      { code: PERMISSIONS.ACT_SAI, libelle: "Saisir les activités de sa structure" },
      { code: PERMISSIONS.ACT_VAL, libelle: "Valider un plan d'actions annuel" },
    ],
  },
  {
    titre: "Exploitation portuaire",
    permissions: [
      { code: PERMISSIONS.EXP_SAI, libelle: "Saisir les relevés d'exploitation de sa structure" },
      { code: PERMISSIONS.EXP_LEC, libelle: "Consulter la cote du chenal et les recouvrements" },
    ],
  },
  {
    titre: "Gouvernance et instances",
    permissions: [
      { code: PERMISSIONS.DEC, libelle: "Tenir le registre des décisions des instances" },
      { code: PERMISSIONS.INST, libelle: "Tenir le registre des réunions et des rapports" },
      { code: PERMISSIONS.DISPO, libelle: "Renseigner la disponibilité des responsables" },
    ],
  },
  {
    titre: "Performance et pilotage",
    permissions: [
      { code: PERMISSIONS.SCORE, libelle: "Consulter la matrice de scoring et le classement" },
      { code: PERMISSIONS.SCORE_ADM, libelle: "Administrer les indicateurs et le calendrier de production" },
      { code: PERMISSIONS.COCKPIT, libelle: "Accéder au cockpit exécutif de gouvernance" },
      { code: PERMISSIONS.VUE_DG, libelle: "Accéder à la vue d'ensemble de la Direction générale" },
      { code: PERMISSIONS.VUE_CODIR, libelle: "Accéder à la vue d'ensemble du Comité de direction" },
    ],
  },
  {
    titre: "Projets et dossiers",
    permissions: [
      { code: PERMISSIONS.DOS_LEC, libelle: "Consulter les dossiers à instruire" },
      { code: PERMISSIONS.DOS_INS, libelle: "Instruire un dossier et demander des compléments" },
      { code: PERMISSIONS.DOS_VAL, libelle: "Valider un dossier ou le retourner à l'instruction" },
    ],
  },
  {
    titre: "Archivage",
    permissions: [
      { code: PERMISSIONS.ARCH, libelle: "Appliquer le référentiel de conservation et verser" },
    ],
  },
  {
    titre: "Accès externe",
    permissions: [
      { code: PERMISSIONS.EXT, libelle: "Déposer et suivre sa demande depuis le portail" },
    ],
  },
  {
    titre: "Administration",
    permissions: [
      { code: PERMISSIONS.ADM_ORG, libelle: "Paramétrer l'organisation et les postes" },
      { code: PERMISSIONS.ADM_HAB, libelle: "Distribuer les profils et les périmètres" },
      { code: PERMISSIONS.ADM_PAR, libelle: "Paramétrer les référentiels métier" },
      { code: PERMISSIONS.ADM_TEC, libelle: "Superviser la plateforme et les intégrations" },
    ],
  },
];
