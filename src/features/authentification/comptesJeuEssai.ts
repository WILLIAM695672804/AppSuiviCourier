/**
 * Les comptes de demonstration, tels que `manage.py demonstration` les cree.
 *
 * Ce fichier remplace `src/lib/demo/comptes.ts` sur l'ecran de connexion. La
 * difference n'est pas cosmetique : les comptes du serveur simule (`codir`,
 * `resp`, `focal`, mot de passe « demo ») n'ont jamais existe cote serveur.
 * Depuis le debranchement du mode demonstration (ADR 008), l'authentification
 * part au backend — pre-remplir un identifiant inexistant ne produirait qu'un
 * « identifiants invalides » incomprehensible.
 *
 * **Miroir a tenir** : la source de verite est
 * `backend/noyau/demonstration/comptes.py`, listes `COMPTES` et `USAGERS`. Un
 * compte ajoute la-bas se recopie ici, sans quoi il reste invisible. Les
 * comptes de `manage.py semer` (organigramme fictif) portent les memes
 * identifiants : les deux jeux ne se chargent jamais ensemble.
 *
 * Le poste affiche est celui que la personne **occupe**, pas celui que le semis
 * nomme : `comptes.py` ne cree aucun poste, il installe le compte sur le poste
 * de responsable que l'organigramme reel porte deja. Le libelle ci-dessous dit
 * donc la structure, qui est stable, et non l'intitule du poste, qui ne l'est
 * pas.
 *
 * Aucun secret n'est divulgue : le mot de passe est commun a tout le jeu, il ne
 * vaut que sur une base semee, et le panneau qui lit ce fichier ne s'affiche
 * qu'en developpement (`import.meta.env.DEV`).
 */

/**
 * Mot de passe commun a tous les comptes semes —
 * `comptes.py`, constante `MOT_DE_PASSE_DEFAUT`.
 */
export const MOT_DE_PASSE_JEU_ESSAI = "demonstration";

/**
 * Les regroupements de la liste, dans l'ordre d'affichage.
 *
 * Trente-trois entrees a la suite formeraient un mur. L'ordre suit le chemin
 * d'un courrier — il entre par le bureau d'ordre, il est cote a une direction,
 * il finit au fonds — plutot que l'ordre alphabetique, qui n'apprend rien.
 */
export const FAMILLES_JEU_ESSAI = [
  "Direction et gouvernance",
  "Chaîne du courrier",
  "Directions du CODIR",
  "Points focaux",
  "Agents de traitement",
  "Exploitation, fonds et plateforme",
  "Portail des usagers",
] as const;

export type FamilleJeuEssai = (typeof FAMILLES_JEU_ESSAI)[number];

export interface CompteJeuEssai {
  identifiant: string;
  /** Qui c'est : le nom porte en base, et la structure ou il est affecte. */
  poste: string;
  /** Ce que ce compte permet de verifier. Le profil et la portee, en clair. */
  description: string;
  /** Regroupement de la liste, pour que trente-trois entrees restent lisibles. */
  famille: FamilleJeuEssai;
}

export const COMPTES_JEU_ESSAI: CompteJeuEssai[] = [
  // --- Direction et gouvernance ---------------------------------------
  {
    identifiant: "dg",
    poste: "Emmanuel Kingue — Direction générale",
    description: "Profil DG, portée « toutes » — voit tout l'organigramme",
    famille: "Direction et gouvernance",
  },
  {
    identifiant: "admin",
    poste: "Aline Nkodo — Direction générale",
    description: "Profil ADMIN — habilitations et référentiels, aucun courrier",
    famille: "Direction et gouvernance",
  },
  {
    identifiant: "chef.cab",
    poste: "Georges Eyenga — Cabinet du Directeur Général",
    description: "Profil RESP, portée sous-arbre — le cabinet et ses services",
    famille: "Direction et gouvernance",
  },
  {
    identifiant: "dsr",
    poste: "Serge Mbarga — Division du Suivi et de la Relance",
    description:
      "Profil DSR — décisions, instances, référentiel des structures",
    famille: "Direction et gouvernance",
  },
  {
    identifiant: "att.dsr",
    poste: "Nadège Etoa — Division du Suivi et de la Relance",
    description: "Profil ATT_DSR — instruit pour la division sans la diriger",
    famille: "Direction et gouvernance",
  },
  {
    identifiant: "dcg",
    poste: "Paul Ndongo — Direction du Contrôle de Gestion",
    description:
      "Profil DCG — validation des plans d'activités, indicateurs cibles",
    famille: "Direction et gouvernance",
  },
  {
    identifiant: "auditeur",
    poste: "Michel Onana — Division de l'Audit Interne",
    description: "Profil AUDITEUR — lecture du journal, aucune écriture métier",
    famille: "Direction et gouvernance",
  },

  // --- Chaîne du courrier ---------------------------------------------
  //
  // Trois registres, trois agents : le rattachement a la session **est** l'acte
  // d'habilitation (ADR 024), et un seul agent aurait laisse deux registres
  // sans tenue.
  {
    identifiant: "agent.scc",
    poste: "Marthe Fouda — Service du Courrier Central",
    description: "Profil AGENT_SESS, registre « arrivé » — le bureau d'ordre",
    famille: "Chaîne du courrier",
  },
  {
    identifiant: "agent.conf",
    poste: "Pauline Abega — Secrétariat DG",
    description:
      "Profil AGENT_SESS, registre « confidentiel » — invisible des autres",
    famille: "Chaîne du courrier",
  },
  {
    identifiant: "agent.int",
    poste: "André Kamdem — Secrétariat DGA",
    description:
      "Profil AGENT_SESS, registre « interne » — note de service et circulaire",
    famille: "Chaîne du courrier",
  },

  // --- Directions du CODIR ---------------------------------------------
  //
  // Le CODIR est le conseil des directeurs : chacun y siege sans cesser de
  // repondre de sa branche, d'ou la portee sous-arbre et non « toutes ».
  {
    identifiant: "dir.dfc",
    poste: "Estelle Mbida — Finances et Comptabilité",
    description:
      "Profil CODIR, portée sous-arbre — sa direction et ce qui en dépend",
    famille: "Directions du CODIR",
  },
  {
    identifiant: "dir.dexp",
    poste: "Solange Tchouta — Exploitation",
    description: "Même profil, autre branche — pour vérifier le cloisonnement",
    famille: "Directions du CODIR",
  },
  {
    identifiant: "dir.dsi",
    poste: "Rita Owona — Systèmes d'Information",
    description:
      "Profil CODIR — cotations reçues, plan d'activités de la direction",
    famille: "Directions du CODIR",
  },
  {
    identifiant: "dir.drh",
    poste: "Alphonse Bikoi — Ressources Humaines",
    description: "Profil CODIR — congés et absences de la branche",
    famille: "Directions du CODIR",
  },
  {
    identifiant: "dir.daj",
    poste: "Christine Meka — Affaires Juridiques",
    description:
      "Profil CODIR — dossiers affectés par la règle « réclamation »",
    famille: "Directions du CODIR",
  },
  {
    identifiant: "dir.dag",
    poste: "Roger Tchoumi — Affaires Générales",
    description: "Profil CODIR, portée sous-arbre",
    famille: "Directions du CODIR",
  },
  {
    identifiant: "dir.damp",
    poste: "Vincent Ekedi — Aménagements Portuaires",
    description: "Profil CODIR, portée sous-arbre",
    famille: "Directions du CODIR",
  },
  {
    identifiant: "dir.dcap",
    poste: "Armand Nyobe — Capitainerie",
    description: "Profil CODIR, portée sous-arbre",
    famille: "Directions du CODIR",
  },

  // --- Points focaux ----------------------------------------------------
  //
  // Quatre directions differentes : le cloisonnement d'un plan d'activites ne
  // se verifie qu'a plusieurs.
  {
    identifiant: "focal.dsi",
    poste: "Yves Manga — Département Génie Logiciel (DSI)",
    description:
      "Profil POINT_FOCAL, portée structure — saisit le plan de sa seule structure",
    famille: "Points focaux",
  },
  {
    identifiant: "focal.dfc",
    poste: "Clarisse Belinga — Comptabilité et Fiscalité (DFC)",
    description: "Même profil, autre structure — ne voit pas le plan du voisin",
    famille: "Points focaux",
  },
  {
    identifiant: "focal.dexp",
    poste: "Bernard Sone — Opérations Portuaires (DEXP)",
    description: "Profil POINT_FOCAL — activités et obligations de production",
    famille: "Points focaux",
  },
  {
    identifiant: "focal.drh",
    poste: "Sylvie Atangana — Gestion du Personnel (DRH)",
    description: "Profil POINT_FOCAL — dépôts au calendrier de production",
    famille: "Points focaux",
  },
  {
    identifiant: "focal.dcg",
    poste: "Irène Ngo Bell — Mesure de la Performance (DCG)",
    description:
      "Profil POINT_FOCAL — le focal qui instruit côté contrôle de gestion",
    famille: "Points focaux",
  },

  // --- Agents de traitement ---------------------------------------------
  {
    identifiant: "agent.dsi",
    poste: "Joseph Ateba — Infrastructures et Systèmes (DSI)",
    description:
      "Profil COLLAB, portée propre — le périmètre le plus restreint",
    famille: "Agents de traitement",
  },
  {
    identifiant: "agent.dfc",
    poste: "Thierry Njike — Contrôle du Recouvrement (DFC)",
    description: "Profil COLLAB — ne voit que ce qui lui est coté nommément",
    famille: "Agents de traitement",
  },
  {
    identifiant: "agent.daj",
    poste: "Laure Ombga — Études Juridiques et Contentieux (DAJ)",
    description: "Profil COLLAB — instruit les dossiers de sa désignation",
    famille: "Agents de traitement",
  },

  // --- Exploitation, fonds et plateforme --------------------------------
  //
  // Les deux comptes d'exploitation portent EXP_SAI et pas EXP_LEC : chacun
  // saisit ce dont il repond et ne lit pas les chiffres de l'autre.
  {
    identifiant: "chef.ddlm",
    poste: "Blaise Ngoma — Dragage et Logistique Maritime",
    description:
      "Profil EXPLOITATION — relevés de cote du chenal, et eux seuls",
    famille: "Exploitation, fonds et plateforme",
  },
  {
    identifiant: "chef.dexp",
    poste: "Honoré Mvondo — Commercial, Facturation et Marketing (DEXP)",
    description: "Profil EXPLOITATION — constats de recouvrement, et eux seuls",
    famille: "Exploitation, fonds et plateforme",
  },
  {
    identifiant: "archiviste",
    poste: "Bertrand Nnomo — Centre de la Documentation et des Archives",
    description:
      "Profil ARCHIVISTE — visa des règles de conservation, versements",
    famille: "Exploitation, fonds et plateforme",
  },
  {
    identifiant: "admin.tech",
    poste: "Hervé Njoya — Sécurité des Systèmes d'Information (DSI)",
    description:
      "Profil ADMIN_TECH — supervision, sans accès aux données métier",
    famille: "Exploitation, fonds et plateforme",
  },

  // --- Portail des usagers ----------------------------------------------
  //
  // Sans structure, sans poste, sans perimetre : la restriction du portail est
  // « deposant = moi », independante du perimetre du socle (ADR 013).
  {
    identifiant: "usager.sotrapal",
    poste: "Aïcha Bello — SOTRAPAL",
    description: "Profil EXTERNE — ne voit que ses propres demandes",
    famille: "Portail des usagers",
  },
  {
    identifiant: "usager.camtrans",
    poste: "Didier Essomba — CAMTRANS",
    description: "Même profil, autre usager — pour vérifier le cloisonnement",
    famille: "Portail des usagers",
  },
  {
    identifiant: "usager.maersk",
    poste: "Frank Diedhiou — Maersk Cameroun",
    description:
      "Profil EXTERNE — échanges dématérialisés avec l'établissement",
    famille: "Portail des usagers",
  },
];
