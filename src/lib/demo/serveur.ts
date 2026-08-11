import type { CourrierDetail } from "@/types/courrier";
import type {
  SaisieAbsence,
  SaisieAvancement,
  SaisieDecision,
  SaisieDocument,
  SaisieRelance,
  SaisieSeance,
  SaisieStructure,
} from "@/features/gouvernance/api";
import type {
  ActiviteDetail,
  SaisieActivite,
  SaisieAvancementActivite,
  SaisieEtatPlan,
  SaisieIndicateurActivite,
  SaisieInstructionActivite,
  SaisieLeveeInstruction,
  SaisieModificationActivite,
  SaisiePieceVie,
  SaisieRelanceActivite,
  SaisieReleveIndicateur,
  SaisieSuspension,
  SaisieTacheActivite,
} from "@/features/activite/api";
import type { SaisieIndicateur, SaisieProduction } from "@/features/performance/api";
import type {
  Delegation,
  DelegationPossible,
  SaisieDelegation,
} from "@/features/habilitation/api";
import type { SaisieRegle, Versement, VersementDetail } from "@/features/archivage/api";
import { REGLES_DEMO, VERSEMENTS_DEMO } from "@/lib/demo/donneesArchivage";
import {
  EVOLUTION_CHENAL_DEMO,
  EVOLUTION_RECOUVREMENT_DEMO,
  feuChenal,
  PERIODES_EXPLOITATION,
  RECOUVREMENTS_DEMO,
  RELEVES_CHENAL_DEMO,
} from "@/lib/demo/donneesExploitation";
import type { SaisieRecouvrement, SaisieReleveChenal } from "@/features/exploitation/api";
import { garantieDuPoint } from "@/lib/chenal";
import { SECTEURS_PORTUAIRES } from "@/lib/secteursPortuaires";
import { PERMISSIONS } from "@/types/habilitation";
import type {
  Dossier,
  DossierDetail,
  SaisieComplement,
  SaisieDossierDepuisCourrier,
  SaisieFusion,
  SaisieRetour,
} from "@/features/dossier/api";
import { DOSSIERS_DEMO, MODELES_DEMO } from "@/lib/demo/donneesDossier";
import {
  CONGES_DEMO,
  ORGANES_DEMO,
  PRESCRIPTIONS_DEMO,
  RECOMMANDATIONS_DEMO,
  REPRESENTATIONS_DEMO,
} from "@/lib/demo/donneesDsr";
import {
  INCIDENTS_DEMO,
  INTEGRATIONS_DEMO,
  PERFORMANCES_DEMO,
  SERVICES_DEMO,
} from "@/lib/demo/donneesSupervision";
import type {
  SaisieDemandeUsager,
  SaisieMessage,
  SaisiePreferences,
} from "@/features/portail/api";
import {
  DEMANDES_PORTAIL_DEMO,
  ECHANGES_DEMO,
  PREFERENCES_DEMO,
} from "@/lib/demo/donneesPortail";
import { feuDepuisTaux } from "@/lib/feu";
import {
  ACCUSES_DEMO,
  ADOPTION_DEMO,
  ANOMALIES_DEMO,
  BORDEREAU_DEMO,
  DEPARTS_DEMO,
  COMPTEURS_DEMO,
  CORRESPONDANTS_DEMO,
  COURRIERS_DEMO,
  INDICATEURS_DEMO,
  MENTIONS_DEMO,
  NATURES_DEMO,
  REFERENTIEL_DEMO,
  ACCES_DEMO,
  DETENTEURS_DEMO,
  EVENEMENTS_DEMO,
  ETAPES_VIE_DEMO,
  SIGNALEMENTS_DEMO,
  STRUCTURES_DEMO,
  TOTAL_REGISTRE_DEMO,
  type CourrierDemo,
} from "@/lib/demo/donnees";
import {
  compteActifDemo,
  fermerSessionDemo,
  ouvrirSessionDemo,
  verifierIdentifiants,
} from "@/lib/demo/comptes";
import {
  ACTIVITES_DEMO,
  OBLIGATIONS_DEMO,
  PLANS_DEMO,
  activitesListe,
  recalculerCriticite,
} from "@/lib/demo/donneesActivite";
import {
  CALENDRIER_DEMO,
  GRILLE_RISQUES,
  INDICATEURS_DICTIONNAIRE,
  classement,
  criteresDe,
  existeStructure,
  historique,
  libelleStructure,
  scoreGlobal,
  sousIndicateurs,
} from "@/lib/demo/donneesPerformance";
import {
  DECISIONS_DEMO,
  DISPONIBILITES_DEMO,
  SEANCES_DEMO,
  decisionsListe,
  seancesListe,
} from "@/lib/demo/donneesGouvernance";
import { ErreurApi } from "@/lib/erreurApi";

/**
 * Faux serveur du mode demonstration.
 *
 * Il est branche dans `lib/api.ts`, et nulle part ailleurs : aucun composant,
 * aucun `api.ts` de domaine ne sait que le mode demo existe. Le jour ou le
 * backend repond, il suffit de passer VITE_MODE_DEMO a false.
 */

const TAILLE_PAGE = 12;
const LATENCE_MS = 150;

/** Jour seul d'un horodatage ISO, pour composer les etapes de la chronologie. */
const jour = (c: CourrierDemo) => c.dateReception.slice(0, 10);

const FILTRES: Record<string, (c: CourrierDemo) => boolean> = {
  nonCotes: (c) => c.etape === "ENREGISTRE",
  affectes: (c) => c.affecteAMoi,
  horsDelai: (c) => (c.delai?.joursDepassement ?? 0) > 0,
  urgents: (c) => c.priorite !== "NORMALE",
  clotures: (c) => c.etape === "CLOTURE",
};

function registre(parametres: URLSearchParams) {
  const vue = parametres.get("vue");
  const recherche = (parametres.get("q") ?? "").trim().toLowerCase();
  const page = Number(parametres.get("page") ?? 1);

  let lignes = COURRIERS_DEMO;

  const filtre = vue ? FILTRES[vue] : undefined;
  if (filtre) lignes = lignes.filter(filtre);

  if (recherche) {
    lignes = lignes.filter((c) =>
      [c.numero, c.correspondant, c.objet].some((champ) => champ.toLowerCase().includes(recherche)),
    );
  }

  const debut = (page - 1) * TAILLE_PAGE;

  return {
    lignes: lignes.slice(debut, debut + TAILLE_PAGE),
    total: lignes.length,
    // Le total du registre ne bouge pas quand on filtre : c'est la reference
    // a laquelle l'agent compare ce qu'il voit.
    totalRegistre: TOTAL_REGISTRE_DEMO,
    page,
    taillePage: TAILLE_PAGE,
  };
}

/**
 * Construit la chronologie a partir de l'etape atteinte.
 * Le vrai serveur la lira dans le journal ; ici on la deduit, ce qui suffit
 * a verifier l'affichage de chaque cas.
 */
function chronologie(courrier: CourrierDemo): CourrierDetail["chronologie"] {
  const etapes: CourrierDetail["chronologie"] = [
    {
      id: 1,
      libelle: "Enregistrement au secrétariat",
      horodatage: `${jour(courrier)}T09:15:00`,
      auteur: "K. Traoré — DSR",
      precision: "numérisation en 3 pages",
      instruction: null,
      etat: "faite",
    },
  ];

  const cote = courrier.structuresCotees.length > 0;

  if (cote) {
    etapes.push({
      id: 2,
      libelle: `Coté à ${courrier.structuresCotees[0]}`,
      horodatage: `${jour(courrier)}T11:40:00`,
      auteur: "Par A. Kouassi — Cabinet",
      precision: `délai imparti ${courrier.delai?.joursAlloues ?? 5} jours`,
      instruction: "Vérifier la conformité des pièces avant admission au paiement.",
      etat: "faite",
    });
  }

  const affecte = ["AFFECTE", "EN_TRAITEMENT", "EN_VALIDATION", "SIGNE", "PARTI", "CLOTURE"].includes(
    courrier.etape,
  );

  if (affecte) {
    etapes.push({
      id: 3,
      libelle: "Affecté à M. Diallo",
      horodatage: `${jour(courrier)}T14:02:00`,
      auteur: "Par S. Bamba — Chef de service comptabilité",
      precision: null,
      instruction: null,
      etat: "faite",
    });
  }

  etapes.push({
    id: 4,
    libelle: LIBELLES_ETAPE_DEMO[courrier.etape],
    horodatage: `${jour(courrier)}T16:24:00`,
    auteur: null,
    precision:
      courrier.etape === "CLOTURE"
        ? "Dossier clos, réponse partie et accusée"
        : "Projet de réponse D-2026-0187 soumis au visa",
    instruction: null,
    etat: courrier.etape === "CLOTURE" ? "faite" : "courante",
  });

  return etapes;
}

const LIBELLES_ETAPE_DEMO: Record<CourrierDemo["etape"], string> = {
  ENREGISTRE: "En attente de cotation",
  COTE: "Coté, en attente de transmission",
  TRANSMIS: "Transmis à la structure",
  AFFECTE: "Affecté, traitement à ouvrir",
  EN_TRAITEMENT: "En traitement",
  EN_VALIDATION: "En validation",
  SIGNE: "Signé, en attente de départ",
  PARTI: "Réponse partie",
  CLOTURE: "Clôturé",
};

function fiche(id: number): CourrierDetail | null {
  const courrier = COURRIERS_DEMO.find((c) => c.id === id);
  if (!courrier) return null;

  const cote = courrier.structuresCotees.length > 0;
  const enTraitement = ["EN_TRAITEMENT", "EN_VALIDATION", "SIGNE"].includes(courrier.etape);

  return {
    ...courrier,
    sessionLibelle: courrier.confidentiel ? "Confidentiel" : "Arrivé",
    referenceExpediteur: "n° 214/DR/2026",
    enregistrePar: "K. Traoré — DSR",
    nombrePages: 3,
    nombreAnnexes: 1,
    delaiJours: courrier.delai?.joursAlloues ?? 5,
    modeCotation: courrier.structuresCotees.length > 1 ? "CASCADE" : cote ? "PARALLELE" : null,
    cotations: cote
      ? [
          {
            id: 1,
            mention: "Pour attribution",
            annotation: "Me rendre compte sous huitaine.",
            delaiFixe: "2026-08-11",
            decidePar: { id: 2, nomComplet: "Le Directeur général" },
            decideLe: `${jour(courrier)}T09:15:00`,
            saisiPar: { id: 1, nomComplet: compteActifDemo()?.utilisateur.nomComplet ?? "Agent de session" },
            saisiLe: `${jour(courrier)}T10:02:00`,
            structures: courrier.structuresCotees.map((libelle, i) => ({
              structureId: i + 1,
              libelle,
              rang: i + 1,
              chefDeFile: i === 0,
            })),
          },
        ]
      : [],
    chronologie: chronologie(courrier),
    observations: cote
      ? [
          {
            id: 1,
            auteur: "A. Kouassi",
            initiales: "AK",
            fonction: "Cabinet",
            horodatage: `${jour(courrier)}T11:40:00`,
            texte:
              "Vérifier la conformité des pièces avant admission au paiement. Me rendre compte avant le 7 août.",
          },
          {
            id: 2,
            auteur: "S. Bamba",
            initiales: "SB",
            fonction: "Chef de service",
            horodatage: `${jour(courrier)}T14:02:00`,
            texte:
              "M. Diallo, rapprocher la facture du bon de commande et du procès-verbal de réception.",
          },
          {
            id: 3,
            auteur: "M. Diallo",
            initiales: "MD",
            fonction: "DAF",
            horodatage: `${jour(courrier)}T16:24:00`,
            texte: "Pièces complètes. Projet de réponse rédigé et soumis au visa.",
          },
        ]
      : [],
    piecesJointes: [
      { id: 1, nom: "Facture-214-scan.pdf", format: "PDF", taille: "1,2 Mo", precision: "3 pages" },
      { id: 2, nom: "Bon-de-commande.jpg", format: "JPG", taille: "480 Ko", precision: "annexe" },
    ],
    reponses: enTraitement
      ? [
          {
            id: 187,
            numero: "D-2026-0187",
            objet: "Règlement de la facture n° 214 du prestataire de maintenance",
            version: 3,
            redigePar: "M. Diallo",
            etape: "EN_VALIDATION",
          },
        ]
      : [],
    derniersEvenements: [
      { id: 1, libelle: "Consulté par S. Bamba", horodatage: `${jour(courrier)}T17:10:00` },
      { id: 2, libelle: "Projet de réponse créé", horodatage: `${jour(courrier)}T16:24:00` },
      { id: 3, libelle: "Accusé de réception envoyé", horodatage: `${jour(courrier)}T09:40:00` },
    ],
    actionsPossibles: cote
      ? ["affecter", "traiter", "transmettre", "relancer", "imprimer"]
      : ["coter", "imprimer"],
  };
}

function dossier(id: number) {
  const courrier = COURRIERS_DEMO.find((c) => c.id === id);
  if (!courrier) return null;

  return {
    courrier,
    instruction: {
      texte:
        "Rapprocher la facture du bon de commande et du procès-verbal de réception, puis rédiger le projet de réponse.",
      auteur: "S. Bamba",
      initiales: "SB",
      fonction: "Chef de service",
      horodatage: `${jour(courrier)}T14:02:00`,
    },
    echeance: courrier.echeance,
    delai: courrier.delai,
    taches: [
      {
        id: 1,
        libelle: "Accuser réception auprès de l'expéditeur",
        faite: true,
        faiteLe: `${jour(courrier)}T10:30:00`,
      },
      {
        id: 2,
        libelle: "Rapprocher la facture du bon de commande",
        faite: true,
        faiteLe: `${jour(courrier)}T15:10:00`,
      },
      { id: 3, libelle: "Soumettre le projet de réponse au visa", faite: false, faiteLe: null },
      { id: 4, libelle: "Classer le dossier après départ de la réponse", faite: false, faiteLe: null },
      { id: 5, libelle: "Rendre compte au chef de service", faite: false, faiteLe: null },
    ],
    notes: [
      {
        id: 1,
        texte: "Le prestataire a fourni le PV de réception le 3 août. Pièces désormais complètes.",
        horodatage: `${jour(courrier)}T15:20:00`,
        privee: true,
      },
    ],
    autresDossiers: COURRIERS_DEMO.filter((c) => c.affecteAMoi && c.id !== id),
    actionsPossibles: ["traiter", "demanderDelai"],
  };
}

const attendre = <T>(donnees: T) =>
  new Promise<T>((resoudre) => setTimeout(() => resoudre(donnees), LATENCE_MS));

/* ------------------------------------------------------------------ *
 *  Petites aides des ecritures simulees.
 * ------------------------------------------------------------------ */

/** Date du jour au format ISO court, comme la stockent les jeux de donnees. */
const aujourdhui = () => new Date().toISOString().slice(0, 10);

/*
 * Delegations, en memoire.
 *
 * Un tableau mutable et non un litteral rendu a chaque appel : le responsable
 * qui pose une delegation doit la voir apparaitre dans sa liste, et disparaitre
 * quand il l'interrompt. C'est tout ce que la demonstration a besoin de
 * prouver.
 */
const DELEGATIONS_DEMO: Delegation[] = [
  { id: 1, titulaire: "N'Guessan Y.", delegataire: "A. Kouassi", poste: "Directeur général", etendue: "Signature", debut: "2026-08-01", fin: "2026-08-15", motif: "Mission à l'extérieur", etat: "active" },
  { id: 2, titulaire: "S. Bamba", delegataire: "M. Diallo", poste: "Chef de service", etendue: "Visa et affectation", debut: "2026-08-10", fin: "2026-08-24", motif: "Congé annuel", etat: "programmee" },
  { id: 3, titulaire: "F. Koné", delegataire: "M. Cissé", poste: "Directrice", etendue: "Cotation", debut: "2026-07-01", fin: "2026-07-20", motif: "Congé annuel", etat: "close" },
];

/** Ce que le poste connecte peut deleguer, et aux agents de son perimetre. */
const DELEGATION_POSSIBLE_DEMO: DelegationPossible = {
  delegataires: [
    { id: 14, nomComplet: "M. Diallo", poste: "Gestionnaire de dossiers" },
    { id: 17, nomComplet: "L. Mbarga", poste: "Point focal de la direction" },
    { id: 11, nomComplet: "K. Traoré", poste: "Agent de session courrier" },
  ],
  etendues: ["Visa et affectation", "Cotation", "Signature", "Instruction des dossiers"],
};

/** « F. Ngo Bell » donne « FN ». Le vrai serveur les tiendra en base. */
function initialesDe(nomComplet: string): string {
  const mots = nomComplet.trim().split(/[\s-]+/).filter(Boolean);
  if (mots.length === 0) return "?";
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
}

/** Qui ecrit. En demonstration, c'est le compte ouvert dans l'onglet. */
function auteurCourant() {
  const compte = compteActifDemo()?.utilisateur;
  return {
    nom: compte?.nomComplet ?? "Utilisateur",
    initiales: compte?.initiales ?? "??",
    poste: compte?.posteLibelle ?? "Poste",
  };
}

/**
 * Part de la periode d'execution deja ecoulee, en pourcentage.
 *
 * C'est l'avancement attendu a la date du jour : le repere auquel se compare
 * l'avancement declare. Le vrai serveur le calculera en jours ouvres.
 */
function partEcoulee(debut: string, fin: string): number {
  const depart = new Date(debut).getTime();
  const arrivee = new Date(fin).getTime();
  const maintenant = Date.now();
  if (arrivee <= depart) return 0;
  return Math.max(0, Math.min(100, Math.round(((maintenant - depart) / (arrivee - depart)) * 100)));
}

/*
 * Structure de rattachement de la session, deduite du libelle.
 *
 * Les comptes de demonstration portent « DAF — Direction des affaires
 * financieres » : le sigle est le premier mot. Le vrai serveur lira la clef
 * etrangere du poste, sans cette gymnastique.
 */
function structureDeLaSession(): string {
  const compte = compteActifDemo()?.utilisateur;
  return compte?.structureLibelle.split(" ")[0] ?? "DAF";
}

/**
 * Structures dont la session peut ouvrir le plan.
 *
 * Le perimetre commande, et lui seul : « institution » les ouvre toutes,
 * « structure » n'ouvre que la sienne. C'est la regle qui empeche un point
 * focal de lire le plan de la direction voisine en changeant l'URL.
 */
function structuresAccessibles(): { sigle: string; libelle: string }[] {
  const compte = compteActifDemo()?.utilisateur;
  const sigle = structureDeLaSession();

  if (compte?.perimetre.portee === "institution") {
    return PLANS_DEMO.map((p) => ({ sigle: p.structureSigle, libelle: p.structureLibelle }));
  }

  const sien = PLANS_DEMO.find((p) => p.structureSigle === sigle);
  return [{ sigle, libelle: sien?.structureLibelle ?? compte?.structureLibelle ?? sigle }];
}

/* ------------------------------------------------------------------ *
 *  Outils du pilier « activites »
 * ------------------------------------------------------------------ */

const trouverActivite = (id: number) => ACTIVITES_DEMO.find((a) => a.id === id);

/** Les identifiants sont uniques dans tout le jeu, pas seulement par activite. */
const prochainIdIndicateur = () =>
  Math.max(0, ...ACTIVITES_DEMO.flatMap((a) => a.indicateurs.map((i) => i.id))) + 1;

const prochainIdTache = () =>
  Math.max(0, ...ACTIVITES_DEMO.flatMap((a) => a.taches.map((t) => t.id))) + 1;

const prochainIdInstruction = () =>
  Math.max(0, ...ACTIVITES_DEMO.flatMap((a) => a.instructionsRattachees.map((i) => i.id))) + 1;

const prochainIdPiece = () =>
  Math.max(0, ...ACTIVITES_DEMO.flatMap((a) => a.vie.flatMap((e) => e.pieces.map((p) => p.id)))) + 1;

/**
 * Tout evenement de la fiche de vie passe par ici — §18.
 *
 * Aucune ecriture ne modifie une activite sans laisser sa trace : c'est ce qui
 * rend l'activite auditable, et c'est la seule facon de garantir qu'aucune
 * route future ne l'oubliera.
 */
function inscrireVie(
  activite: ActiviteDetail,
  type: ActiviteDetail["vie"][number]["type"],
  texte: string,
  pieces: { nom: string; poids: string }[] = [],
): void {
  let idPiece = prochainIdPiece();

  activite.vie.push({
    id: Math.max(0, ...activite.vie.map((e) => e.id)) + 1,
    type,
    date: aujourdhui(),
    auteur: auteurCourant().nom,
    initiales: auteurCourant().initiales,
    poste: auteurCourant().poste,
    texte,
    pieces: pieces.map((p) => ({ id: idPiece++, nom: p.nom, poids: p.poids })),
  });
}

/**
 * Etat, feu et criticite d'une activite, apres toute ecriture qui les touche.
 *
 * L'etat se deduit de l'ecart a l'attendu, jamais d'une saisie libre. Laisser
 * l'agent declarer lui-meme « en cours » ou « en retard » reviendrait a lui
 * demander de se noter.
 *
 * Le seuil de dix points est en dur ici, comme le calcul lineaire de
 * `partEcoulee` : le vrai serveur devra les tirer du parametrage, faute de quoi
 * la regle de mesure ne pourra plus bouger sans redeploiement.
 */
function recalculerEtat(activite: ActiviteDetail): void {
  if (activite.etat === "Suspendue") return;

  if (activite.avancement >= 100) activite.etat = "Réalisée";
  else if (activite.avancement < activite.avancementAttendu - 10) activite.etat = "En retard";
  else if (activite.avancement > 0) activite.etat = "En cours";
  else activite.etat = "Programmée";

  activite.feu =
    activite.avancement >= activite.avancementAttendu
      ? "vert"
      : activite.avancement >= activite.avancementAttendu - 10
        ? "orange"
        : "rouge";

  recalculerCriticite(activite, aujourdhui());
}

/**
 * Part de la cible atteinte, de l'etat de reference au but vise.
 *
 * Le sens de progression n'est pas toujours le meme : un delai moyen doit
 * baisser, un taux de couverture doit monter. Rapporter le realise a la seule
 * cible aurait donne 207 % a un delai ramene de 38 a 31 jours.
 */
function tauxIndicateur(reference: string, cible: string, realise: string): number | null {
  const [r, c, v] = [reference, cible, realise].map((x) => Number(String(x).replace(",", ".")));
  if ([r, c, v].some(Number.isNaN)) return null;
  if (c === r) return v === c ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round(((v - r) / (c - r)) * 100)));
}

/**
 * Empreinte de demonstration.
 *
 * Ce n'est pas un SHA-256 : c'est une suite hexadecimale de 64 caracteres
 * derivee de la graine, pour que l'ecran ait la bonne forme a montrer. Le
 * serveur calculera la vraie empreinte sur le contenu du dossier — ce qui est
 * la seule chose qui lui donne une valeur probante.
 */
/** Nombre de jours entre deux dates ISO. Negatif si la seconde est passee. */
function joursEntre(depuis: string, jusqua: string): number {
  return Math.round(
    (new Date(jusqua).getTime() - new Date(depuis).getTime()) / (1000 * 60 * 60 * 24),
  );
}

/** Vue de liste d'un dossier : l'instruction reste sur la fiche. */
function dossierListe(d: DossierDetail): Dossier {
  return {
    id: d.id,
    reference: d.reference,
    objet: d.objet,
    type: d.type,
    demandeur: d.demandeur,
    structure: d.structure,
    instructeur: d.instructeur,
    initiales: d.initiales,
    ouvertLe: d.ouvertLe,
    echeance: d.echeance,
    etape: d.etape,
    etat: d.etat,
    criticite: d.criticite,
    feu: d.feu,
    joursRestants: d.joursRestants,
    courrierOrigine: d.courrierOrigine,
    courrierOrigineId: d.courrierOrigineId,
  };
}

/** Vue de liste d'un versement : le detail reste sur la fiche. */
function versementListe(v: VersementDetail): Versement {
  return {
    id: v.id,
    reference: v.reference,
    objet: v.objet,
    typologie: v.typologie,
    structure: v.structure,
    closLe: v.closLe,
    dua: v.dua,
    sortFinal: v.sortFinal,
    echeanceSortFinal: v.echeanceSortFinal,
    etat: v.etat,
    pieces: v.pieces,
    piecesAttendues: v.piecesAttendues,
    feu: v.feu,
  };
}

function empreinteSimulee(graine: string): string {
  let etat = 0;
  for (const caractere of graine) etat = (etat * 31 + caractere.charCodeAt(0)) >>> 0;

  let resultat = "";
  while (resultat.length < 64) {
    etat = (etat * 1103515245 + 12345) >>> 0;
    resultat += etat.toString(16).padStart(8, "0");
  }
  return resultat.slice(0, 64);
}

/**
 * Renvoie la reponse simulee, ou `null` si le chemin n'est pas couvert —
 * auquel cas `api.ts` laisse partir la vraie requete et l'erreur sera visible.
 */
export function repondreEnDemo(
  chemin: string,
  methode: string,
  corps?: unknown,
): Promise<unknown> | null {
  const [route, requete] = chemin.split("?");
  const parametres = new URLSearchParams(requete ?? "");

  /*
   * Connexion simulee. Le vrai serveur posera un cookie de session ; ici on
   * retient l'identifiant dans `sessionStorage`. Les deux ecrans de connexion
   * et de deconnexion ne verront aucune difference le jour de la bascule.
   */
  if (methode === "POST" && route === "/connexion") {
    const saisie = corps as { identifiant?: string; motDePasse?: string };
    const compte = verifierIdentifiants(saisie?.identifiant ?? "", saisie?.motDePasse ?? "");

    if (!compte) {
      return new Promise((_, rejeter) =>
        setTimeout(
          () => rejeter(new ErreurApi(401, "Identifiant ou mot de passe incorrect.")),
          LATENCE_MS,
        ),
      );
    }

    ouvrirSessionDemo(compte.identifiant);
    return attendre(compte.utilisateur);
  }

  if (methode === "POST" && route === "/deconnexion") {
    fermerSessionDemo();
    return attendre(undefined);
  }

  // Un enregistrement en demonstration ne cree rien : il renvoie le premier
  // courrier du jeu, ce qui suffit a verifier l'enchainement des ecrans.
  if (methode === "POST" && route === "/courriers") {
    return attendre(fiche(COURRIERS_DEMO[0].id));
  }

  if (methode === "POST" && route === "/departs/signatures") {
    return attendre({ signes: DEPARTS_DEMO.filter((d) => d.etape === "A_SIGNER") });
  }

  if (methode === "POST" && route === "/suivi/recherche") {
    return attendre({ lignes: COURRIERS_DEMO, total: COURRIERS_DEMO.length });
  }

  /* ------------------------------------------------------------------ *
   *  Ecritures de la gouvernance
   *
   *  Elles mutent les tableaux en memoire. La donnee ne survit pas a un
   *  rechargement de page, et c'est assume : le but est de verifier que la
   *  modale se ferme, que la liste se rafraichit et que les compteurs
   *  bougent ensemble. La persistance viendra du serveur.
   * ------------------------------------------------------------------ */
  if (methode === "POST" && route === "/gouvernance/decisions") {
    const saisie = corps as SaisieDecision;
    const id = Math.max(0, ...DECISIONS_DEMO.map((d) => d.id)) + 1;
    const annee = new Date(saisie.dateDecision).getFullYear();
    const prefixes: Record<string, string> = {
      "Conseil d'administration": "CA",
      CODIR: "CODIR",
      "Directeur général": "DG",
      "Assemblée générale": "AG",
    };

    DECISIONS_DEMO.push({
      id,
      reference: `${prefixes[saisie.instance] ?? "DEC"}-${annee}-${String(id).padStart(3, "0")}`,
      instance: saisie.instance,
      seance: saisie.seance,
      objet: saisie.objet,
      dateDecision: saisie.dateDecision,
      echeance: saisie.echeance,
      etat: "À lancer",
      avancement: 0,
      feu: saisie.echeance ? "orange" : "inconnu",
      relances: 0,
      contexte: saisie.contexte,
      origine: { type: "Réunion", libelle: saisie.seance, id: null },
      structures: saisie.structures.map((structureId, rang) => {
        const reference = STRUCTURES_DEMO.find((s) => s.id === structureId);
        return {
          id: structureId,
          sigle: reference?.sigle ?? "—",
          libelle: reference?.libelle ?? "Structure",
          pilote: rang === 0,
          avancement: 0,
        };
      }),
      jalons: [],
      observations: [],
      retombees: [],
    });

    return attendre({ id });
  }

  const avancementDemande = route.match(/^\/gouvernance\/decisions\/(\d+)\/avancement$/);
  if (methode === "POST" && avancementDemande) {
    const saisie = corps as SaisieAvancement;
    const decision = DECISIONS_DEMO.find((d) => d.id === Number(avancementDemande[1]));
    if (!decision) return null;

    decision.avancement = saisie.avancement;
    decision.etat = saisie.avancement >= 100 ? "Exécutée" : "En cours";
    decision.feu = feuDepuisTaux(saisie.avancement);
    decision.jalons.forEach((jalon) => {
      const fait = saisie.jalonsFaits.includes(jalon.id);
      if (fait && !jalon.fait) jalon.dateRealisation = aujourdhui();
      jalon.fait = fait;
    });
    decision.observations.push({
      id: Math.max(0, ...decision.observations.map((o) => o.id)) + 1,
      auteur: auteurCourant().nom,
      initiales: auteurCourant().initiales,
      poste: auteurCourant().poste,
      date: aujourdhui(),
      texte: saisie.observation,
      relance: false,
    });

    return attendre({ id: decision.id });
  }

  const relanceDemandee = route.match(/^\/gouvernance\/decisions\/(\d+)\/relance$/);
  if (methode === "POST" && relanceDemandee) {
    const saisie = corps as SaisieRelance;
    const decision = DECISIONS_DEMO.find((d) => d.id === Number(relanceDemandee[1]));
    if (!decision) return null;

    decision.relances += 1;
    decision.observations.push({
      id: Math.max(0, ...decision.observations.map((o) => o.id)) + 1,
      auteur: auteurCourant().nom,
      initiales: auteurCourant().initiales,
      poste: auteurCourant().poste,
      date: aujourdhui(),
      texte: saisie.motif,
      relance: true,
    });

    return attendre({ id: decision.id });
  }

  if (methode === "POST" && route === "/gouvernance/seances") {
    const saisie = corps as SaisieSeance;
    const id = Math.max(0, ...SEANCES_DEMO.map((s) => s.id)) + 1;

    SEANCES_DEMO.push({
      id,
      reference: `SE-${new Date(saisie.date).getFullYear()}-${String(id).padStart(3, "0")}`,
      type: saisie.type,
      intitule: saisie.intitule,
      date: saisie.date,
      president: saisie.president || "—",
      participants: 0,
      depot: "En attente",
      dateDepot: null,
      echeanceDepot: saisie.echeanceDepot,
      decisionsIssues: 0,
      structure: saisie.structure,
      ordreDuJour: saisie.ordreDuJour.map((point, rang) => ({
        id: rang + 1,
        rang: rang + 1,
        point: point.point,
        rapporteur: point.rapporteur,
      })),
      documents: [],
      presents: [],
      decisions: [],
    });

    return attendre({ id });
  }

  const documentDemande = route.match(/^\/gouvernance\/seances\/(\d+)\/documents$/);
  if (methode === "POST" && documentDemande) {
    const saisie = corps as SaisieDocument;
    const seance = SEANCES_DEMO.find((s) => s.id === Number(documentDemande[1]));
    if (!seance) return null;

    const jour = aujourdhui();
    seance.documents.push({
      id: Math.max(0, ...seance.documents.map((d) => d.id)) + 1,
      nature: saisie.nature,
      libelle: saisie.libelle,
      depose: true,
      dateDepot: jour,
      poids: saisie.poids,
      deposePar: auteurCourant().nom,
    });

    // Le depot d'un compte rendu ou d'un PV solde l'obligation de la seance.
    if (saisie.nature === "Compte rendu" || saisie.nature === "Procès-verbal") {
      seance.dateDepot = jour;
      seance.depot = jour > seance.echeanceDepot ? "Hors délai" : "Déposé";
    }

    return attendre({ id: seance.id });
  }

  if (methode === "POST" && route === "/gouvernance/disponibilites") {
    const saisie = corps as SaisieAbsence;
    const id = Math.max(0, ...DISPONIBILITES_DEMO.map((d) => d.id)) + 1;
    const jour = aujourdhui();
    const enCours = saisie.du <= jour && jour <= saisie.au;
    const jours = Math.max(
      1,
      Math.round(
        (new Date(saisie.au).getTime() - new Date(saisie.du).getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    DISPONIBILITES_DEMO.push({
      id,
      responsable: saisie.responsable,
      initiales: initialesDe(saisie.responsable),
      poste: saisie.poste,
      structure: saisie.structure,
      type: saisie.type,
      du: saisie.du,
      au: saisie.au,
      jours,
      interimaire: saisie.interimaire,
      interimaireInitiales: saisie.interimaire ? initialesDe(saisie.interimaire) : null,
      // Sans interimaire, l'absence en cours est le point que la DSR doit voir.
      feu: saisie.interimaire ? "vert" : enCours ? "rouge" : "orange",
      enCours,
      saisiPar: auteurCourant().nom,
    });

    return attendre({ id });
  }

  if (methode === "POST" && route === "/gouvernance/structures") {
    const saisie = corps as SaisieStructure;
    const id = Math.max(0, ...STRUCTURES_DEMO.map((s) => s.id)) + 1;

    STRUCTURES_DEMO.push({
      id,
      libelle: saisie.libelle,
      sigle: saisie.sigle,
      nature: saisie.nature as (typeof STRUCTURES_DEMO)[number]["nature"],
      niveau: saisie.niveau,
      responsable: saisie.responsable,
      delaiMoyenJours: null,
      courriersEnCours: 0,
    });

    return attendre({ id });
  }

  /* ------------------------------------------------------------------ *
   *  Ecritures de l'exploitation
   *
   *  Le releve le plus recent d'un point remplace le precedent : c'est lui
   *  qui fait foi, et garder les deux dans la liste aurait montre deux cotes
   *  contradictoires pour un meme endroit du chenal. L'historique existera
   *  cote serveur reel — ici, seul l'etat courant est simule.
   * ------------------------------------------------------------------ */
  if (methode === "POST" && route === "/exploitation/chenal") {
    const saisie = corps as SaisieReleveChenal;
    const garantie = garantieDuPoint(saisie.point) ?? 0;
    const ecart = Math.round((saisie.cote - garantie) * 100) / 100;
    const id = Math.max(0, ...RELEVES_CHENAL_DEMO.map((r) => r.id)) + 1;

    const precedent = RELEVES_CHENAL_DEMO.findIndex((r) => r.point === saisie.point);
    const releve = {
      id,
      point: saisie.point,
      releveLe: saisie.releveLe,
      cote: saisie.cote,
      garantie,
      ecart,
      feu: feuChenal(ecart),
      observation: saisie.observation.trim() === "" ? null : saisie.observation,
      releveParStructure:
        (compteActifDemo()?.utilisateur.structureLibelle ?? "").split(" — ")[0] || "RDD",
    };

    if (precedent >= 0) RELEVES_CHENAL_DEMO[precedent] = releve;
    else RELEVES_CHENAL_DEMO.push(releve);

    return attendre({ id });
  }

  if (methode === "POST" && route === "/exploitation/recouvrements") {
    const saisie = corps as SaisieRecouvrement;
    const secteur = SECTEURS_PORTUAIRES.find((s) => s.code === saisie.secteurCode);
    const taux = saisie.emis === 0 ? 0 : Math.round((saisie.recouvre / saisie.emis) * 1000) / 10;
    const id = Math.max(0, ...RECOUVREMENTS_DEMO.map((l) => l.id)) + 1;

    // Un secteur n'a qu'une ligne par periode : saisir deux fois corrige, ce
    // qui est le cas courant en fin de mois.
    const precedent = RECOUVREMENTS_DEMO.findIndex(
      (l) => l.secteurCode === saisie.secteurCode && l.periode === saisie.periode,
    );
    const ligne = {
      id,
      secteurCode: saisie.secteurCode,
      secteurLibelle: secteur?.libelle ?? saisie.secteurCode,
      periode: saisie.periode,
      emis: saisie.emis,
      recouvre: saisie.recouvre,
      taux,
      feu: feuDepuisTaux(taux),
      sourceStructure: secteur?.origine === "exploitation" ? "DEX" : "DFC",
    };

    if (precedent >= 0) RECOUVREMENTS_DEMO[precedent] = ligne;
    else RECOUVREMENTS_DEMO.push(ligne);

    return attendre({ id });
  }

  /* ------------------------------------------------------------------ *
   *  Ecritures des activites
   *
   *  Trois familles s'y melent, et le vrai serveur devra les separer par la
   *  permission autant que par la route : ce que la structure declare
   *  (ACT_SAI), ce que l'autorite impose (DEC), ce que la DSR relance (REL).
   * ------------------------------------------------------------------ */
  if (methode === "POST" && route === "/activites") {
    const saisie = corps as SaisieActivite;
    const compte = compteActifDemo()?.utilisateur;
    const id = Math.max(0, ...ACTIVITES_DEMO.map((a) => a.id)) + 1;
    const sigle = structureDeLaSession();

    ACTIVITES_DEMO.push({
      id,
      reference: `PAA-${sigle}-${String(id).padStart(2, "0")}`,
      intitule: saisie.intitule,
      axe: saisie.axe,
      structureSigle: sigle,
      structureLibelle: compte?.structureLibelle ?? "Structure",
      // Le responsable est saisi, jamais deduit de qui saisit : un point focal
      // inscrit les activites de toute sa direction sans en porter aucune.
      responsable: saisie.responsable,
      initiales: initialesDe(saisie.responsable),
      debut: saisie.debut,
      fin: saisie.fin,
      etat: "Programmée",
      avancement: 0,
      // L'attendu se calcule sur la part de la periode deja ecoulee.
      avancementAttendu: partEcoulee(saisie.debut, saisie.fin),
      feu: feuDepuisTaux(0),
      tachesFaites: 0,
      tachesTotal: 0,
      instructions: 0,
      critique: false,
      objectif: saisie.objectif,
      etatReferenceGeneral: saisie.etatReferenceGeneral,
      resultatsAttendus: saisie.resultatsAttendus,
      budgetValide: saisie.budgetValide,
      suspension: null,
      derniereRelance: null,
      indicateurs: [],
      taches: [],
      instructionsRattachees: [],
      vie: [
        {
          id: 1,
          type: "Création",
          date: aujourdhui(),
          auteur: auteurCourant().nom,
          initiales: auteurCourant().initiales,
          poste: auteurCourant().poste,
          texte: "Activité inscrite au plan d'actions.",
          pieces: [],
        },
      ],
    });

    return attendre({ id });
  }

  /*
   * Modification d'une activite inscrite.
   *
   * Le motif est obligatoire et devient un evenement de la fiche de vie : le
   * §18 range les modifications au meme rang que les instructions. Une
   * echeance qui bouge sans raison inscrite rend le retard incomprehensible
   * six mois plus tard.
   */
  const modificationActivite = route.match(/^\/activites\/(\d+)$/);
  if (methode === "POST" && modificationActivite) {
    const saisie = corps as SaisieModificationActivite;
    const activite = trouverActivite(Number(modificationActivite[1]));
    if (!activite) return null;

    const change: string[] = [];
    if (activite.intitule !== saisie.intitule) change.push("intitulé");
    if (activite.axe !== saisie.axe) change.push("axe stratégique");
    if (activite.responsable !== saisie.responsable) {
      change.push(`responsable (${activite.responsable} → ${saisie.responsable})`);
    }
    if (activite.debut !== saisie.debut || activite.fin !== saisie.fin) {
      change.push("période d'exécution");
    }
    if (activite.budgetValide !== saisie.budgetValide) change.push("budget");

    activite.intitule = saisie.intitule;
    activite.axe = saisie.axe;
    activite.objectif = saisie.objectif;
    activite.etatReferenceGeneral = saisie.etatReferenceGeneral;
    activite.resultatsAttendus = saisie.resultatsAttendus;
    activite.responsable = saisie.responsable;
    activite.initiales = initialesDe(saisie.responsable);
    activite.debut = saisie.debut;
    activite.fin = saisie.fin;
    activite.budgetValide = saisie.budgetValide;
    // La periode a pu bouger : l'attendu se recalcule, sinon l'ecart ment.
    activite.avancementAttendu = partEcoulee(saisie.debut, saisie.fin);

    inscrireVie(
      activite,
      "Modification",
      change.length > 0
        ? `${saisie.motif} (${change.join(", ")})`
        : saisie.motif,
    );
    recalculerEtat(activite);

    return attendre({ id: activite.id });
  }

  const indicateurActivite = route.match(/^\/activites\/(\d+)\/indicateurs$/);
  if (methode === "POST" && indicateurActivite) {
    const saisie = corps as SaisieIndicateurActivite;
    const activite = trouverActivite(Number(indicateurActivite[1]));
    if (!activite) return null;

    const id = prochainIdIndicateur();
    activite.indicateurs.push({
      id,
      libelle: saisie.libelle,
      unite: saisie.unite,
      etatReference: saisie.etatReference,
      cible: saisie.cible,
      // Un indicateur nait sans releve : la reference et la cible sont des
      // engagements, le realise est une mesure, et rien n'a encore ete mesure.
      realise: null,
      taux: null,
      releveLe: null,
    });

    inscrireVie(activite, "Modification", `Indicateur ajouté : ${saisie.libelle}.`);
    return attendre({ id });
  }

  const releveIndicateur = route.match(/^\/activites\/(\d+)\/indicateurs\/(\d+)\/releve$/);
  if (methode === "POST" && releveIndicateur) {
    const saisie = corps as SaisieReleveIndicateur;
    const activite = trouverActivite(Number(releveIndicateur[1]));
    const indicateur = activite?.indicateurs.find((i) => i.id === Number(releveIndicateur[2]));
    if (!activite || !indicateur) return null;

    indicateur.realise = saisie.realise;
    indicateur.taux = tauxIndicateur(indicateur.etatReference, indicateur.cible, saisie.realise);
    indicateur.releveLe = aujourdhui();

    inscrireVie(
      activite,
      "Observation",
      `${indicateur.libelle} relevé à ${saisie.realise} ${indicateur.unite}.`,
    );

    return attendre({ id: indicateur.id });
  }

  const tacheActivite = route.match(/^\/activites\/(\d+)\/taches$/);
  if (methode === "POST" && tacheActivite) {
    const saisie = corps as SaisieTacheActivite;
    const activite = trouverActivite(Number(tacheActivite[1]));
    if (!activite) return null;

    const id = prochainIdTache();
    activite.taches.push({
      id,
      libelle: saisie.libelle,
      echeance: saisie.echeance,
      fait: false,
      dateRealisation: null,
      responsable: saisie.responsable,
    });
    activite.tachesTotal = activite.taches.length;

    inscrireVie(activite, "Modification", `Tâche ajoutée : ${saisie.libelle}.`);
    recalculerCriticite(activite, aujourdhui());

    return attendre({ id });
  }

  const avancementActivite = route.match(/^\/activites\/(\d+)\/avancement$/);
  if (methode === "POST" && avancementActivite) {
    const saisie = corps as SaisieAvancementActivite;
    const activite = trouverActivite(Number(avancementActivite[1]));
    if (!activite) return null;

    /*
     * Une activite suspendue ne recoit pas de declaration : son execution est
     * arretee par decision, et laisser la structure declarer un avancement
     * pendant la suspension viderait la decision de sa portee.
     */
    if (activite.etat === "Suspendue") {
      throw new ErreurApi(
        409,
        "L'activité est suspendue : l'avancement ne peut pas être déclaré tant que la suspension n'est pas levée.",
      );
    }

    activite.avancement = saisie.avancement;
    activite.taches.forEach((tache) => {
      const fait = saisie.tachesFaites.includes(tache.id);
      if (fait && !tache.fait) tache.dateRealisation = aujourdhui();
      tache.fait = fait;
    });
    activite.tachesFaites = activite.taches.filter((t) => t.fait).length;

    recalculerEtat(activite);

    inscrireVie(
      activite,
      "Observation",
      saisie.observation,
      saisie.pieces.map((p) => ({ nom: p.nom, poids: p.poids })),
    );

    return attendre({ id: activite.id });
  }

  const pieceActivite = route.match(/^\/activites\/(\d+)\/pieces$/);
  if (methode === "POST" && pieceActivite) {
    const saisie = corps as SaisiePieceVie;
    const activite = trouverActivite(Number(pieceActivite[1]));
    if (!activite) return null;

    inscrireVie(activite, "Pièce jointe", saisie.commentaire, [
      { nom: saisie.nom, poids: saisie.poids },
    ]);

    return attendre({ id: activite.id });
  }

  /*
   * Suspension et reprise — §19.
   *
   * Une suspension arrete le decompte : ni retard, ni relance, ni criticite.
   * A la reprise, l'attendu se recalcule sur ce qui reste de la periode, sans
   * quoi la structure porterait le poids des semaines pendant lesquelles il
   * lui etait interdit d'avancer.
   */
  const suspensionActivite = route.match(/^\/activites\/(\d+)\/suspension$/);
  if (methode === "POST" && suspensionActivite) {
    const saisie = corps as SaisieSuspension;
    const activite = trouverActivite(Number(suspensionActivite[1]));
    if (!activite) return null;

    if (saisie.action === "suspendre") {
      activite.etat = "Suspendue";
      activite.feu = "inconnu";
      activite.critique = false;
      activite.suspension = {
        motif: saisie.motif,
        reference: saisie.reference,
        decidePar: auteurCourant().nom,
        date: aujourdhui(),
      };
    } else {
      activite.suspension = null;
      activite.avancementAttendu = partEcoulee(aujourdhui(), activite.fin);
      recalculerEtat(activite);
    }

    inscrireVie(
      activite,
      "Décision du DG",
      saisie.reference ? `${saisie.reference} : ${saisie.motif}` : saisie.motif,
    );

    return attendre({ id: activite.id });
  }

  /*
   * Rattachement d'une instruction — §17.
   *
   * Quatre attributs exiges : l'activite, la date, le responsable et le delai.
   * L'instruction entre a la fiche de vie et reste ouverte jusqu'a sa levee ;
   * c'est cette dualite qui permet a la fois de raconter et de relancer.
   */
  const instructionActivite = route.match(/^\/activites\/(\d+)\/instructions$/);
  if (methode === "POST" && instructionActivite) {
    const saisie = corps as SaisieInstructionActivite;
    const activite = trouverActivite(Number(instructionActivite[1]));
    if (!activite) return null;

    const id = prochainIdInstruction();
    activite.instructionsRattachees.push({
      id,
      origine: saisie.origine,
      reference: saisie.reference,
      texte: saisie.texte,
      date: aujourdhui(),
      auteur: auteurCourant().nom,
      responsable: saisie.responsable,
      echeance: saisie.echeance,
      levee: false,
      dateLevee: null,
    });
    activite.instructions = activite.instructionsRattachees.length;

    inscrireVie(
      activite,
      saisie.origine,
      `${saisie.reference ? `${saisie.reference} : ` : ""}${saisie.texte} Délai au ${saisie.echeance}, sous la responsabilité de ${saisie.responsable}.`,
    );
    recalculerCriticite(activite, aujourdhui());

    return attendre({ id });
  }

  const leveeInstruction = route.match(/^\/activites\/(\d+)\/instructions\/(\d+)\/levee$/);
  if (methode === "POST" && leveeInstruction) {
    const saisie = corps as SaisieLeveeInstruction;
    const activite = trouverActivite(Number(leveeInstruction[1]));
    const instruction = activite?.instructionsRattachees.find(
      (i) => i.id === Number(leveeInstruction[2]),
    );
    if (!activite || !instruction) return null;

    instruction.levee = true;
    instruction.dateLevee = aujourdhui();

    inscrireVie(activite, "Validation", `Instruction levée : ${saisie.commentaire}`);
    recalculerCriticite(activite, aujourdhui());

    return attendre({ id: instruction.id });
  }

  const relanceActivite = route.match(/^\/activites\/(\d+)\/relance$/);
  if (methode === "POST" && relanceActivite) {
    const saisie = corps as SaisieRelanceActivite;
    const activite = trouverActivite(Number(relanceActivite[1]));
    if (!activite) return null;

    activite.derniereRelance = aujourdhui();
    inscrireVie(activite, "Relance", saisie.texte);

    return attendre({ id: activite.id });
  }

  const depotObligation = route.match(/^\/activites\/obligations\/(\d+)\/depot$/);
  if (methode === "POST" && depotObligation) {
    const obligation = OBLIGATIONS_DEMO.find((o) => o.id === Number(depotObligation[1]));
    if (!obligation) return null;

    const jour = aujourdhui();
    obligation.depose = true;
    obligation.dateDepot = jour;
    // Le retard constate au depot ne s'efface pas : il est arrete, pas annule.
    obligation.retardJours = jour > obligation.echeance ? obligation.retardJours ?? 1 : null;
    obligation.feu = obligation.retardJours === null ? "vert" : "orange";

    return attendre({ id: obligation.id });
  }

  if (methode === "POST" && route === "/activites/plan/etat") {
    const saisie = corps as SaisieEtatPlan;
    const plan = PLANS_DEMO.find((p) => p.structureSigle === saisie.structureSigle);
    if (!plan) return null;

    if (saisie.action === "soumettre") {
      plan.etat = "Soumis au contrôle de gestion";
      plan.soumisLe = aujourdhui();
      plan.valideLe = null;
      plan.validePar = null;
      plan.motifRetour = null;
    } else if (saisie.action === "valider") {
      plan.etat = "Validé";
      plan.valideLe = aujourdhui();
      plan.validePar = `${auteurCourant().nom}, ${auteurCourant().poste.toLowerCase()}`;
      plan.motifRetour = null;
    } else {
      plan.etat = "Retourné";
      plan.valideLe = null;
      plan.validePar = null;
      plan.motifRetour = saisie.motif;
    }

    // La validation engage la structure : elle s'inscrit sur chaque activite
    // du plan, sinon la fiche de vie ne porte pas la trace de l'engagement.
    if (saisie.action !== "soumettre") {
      ACTIVITES_DEMO.filter((a) => a.structureSigle === saisie.structureSigle).forEach((a) =>
        inscrireVie(
          a,
          "Validation",
          saisie.action === "valider"
            ? `Plan ${saisie.annee} validé par le contrôle de gestion.`
            : `Plan ${saisie.annee} retourné : ${saisie.motif ?? "sans motif"}`,
        ),
      );
    }

    return attendre({ id: saisie.annee });
  }

  /* ------------------------------------------------------------------ *
   *  Ecritures de la performance — le dictionnaire et le calendrier.
   *
   *  Ces deux-la modifient la regle de mesure, pas une donnee. C'est pourquoi
   *  un indicateur nait actif mais sans historique : les scores des mois
   *  passes ont ete calcules sans lui, et les recalculer serait reecrire le
   *  passe.
   * ------------------------------------------------------------------ */
  if (methode === "POST" && route === "/performance/indicateurs") {
    const saisie = corps as SaisieIndicateur;
    const id = Math.max(0, ...INDICATEURS_DICTIONNAIRE.map((i) => i.id)) + 1;

    INDICATEURS_DICTIONNAIRE.push({ id, ...saisie, actif: true });
    return attendre({ id });
  }

  if (methode === "POST" && route === "/performance/calendrier") {
    const saisie = corps as SaisieProduction;
    const id = Math.max(0, ...CALENDRIER_DEMO.map((l) => l.id)) + 1;

    CALENDRIER_DEMO.push({
      id,
      ...saisie,
      // Aucun cycle clos : la ligne reste non evaluee jusqu'a la premiere echeance.
      recus: 0,
      feu: "inconnu",
    });

    return attendre({ id });
  }

  /* ------------------------------------------------------------------ *
   *  Ecritures de l'archivage
   *
   *  Rien ne detruit ici. Verser scelle et transmet ; le sort final se
   *  propose et attend un visa que le logiciel n'a pas a donner.
   * ------------------------------------------------------------------ */
  if (methode === "POST" && route === "/archivage/referentiel") {
    const saisie = corps as SaisieRegle;
    const id = Math.max(0, ...REGLES_DEMO.map((r) => r.id)) + 1;

    REGLES_DEMO.push({
      id,
      ...saisie,
      // Une regle nait sans visa : elle existe, mais n'est opposable a personne.
      valideePar: null,
      valideeLe: null,
      actif: true,
      dossiersConcernes: 0,
    });

    return attendre({ id });
  }

  const validationRegle = route.match(/^\/archivage\/referentiel\/(\d+)\/validation$/);
  if (methode === "POST" && validationRegle) {
    const regle = REGLES_DEMO.find((r) => r.id === Number(validationRegle[1]));
    if (!regle) return null;

    regle.valideePar = `${auteurCourant().nom}, ${auteurCourant().poste.toLowerCase()}`;
    regle.valideeLe = aujourdhui();
    return attendre({ id: regle.id });
  }

  const versementDemande = route.match(/^\/archivage\/versements\/(\d+)\/versement$/);
  if (methode === "POST" && versementDemande) {
    const versement = VERSEMENTS_DEMO.find((v) => v.id === Number(versementDemande[1]));
    if (!versement) return null;

    const jour = aujourdhui();
    versement.etat = "Versé";
    versement.verseLe = jour;
    versement.versePar = auteurCourant().nom;
    versement.feu = "vert";
    versement.chaineIntegrite.push({
      etape: "Versement au système d'archivage",
      horodatage: `${jour}T${new Date().toTimeString().slice(0, 8)}`,
      empreinte: empreinteSimulee(`${versement.reference}-versement-${jour}`),
    });

    return attendre({ id: versement.id });
  }

  const preuveDemandee = route.match(/^\/archivage\/versements\/(\d+)\/preuve$/);
  if (methode === "POST" && preuveDemandee) {
    const versement = VERSEMENTS_DEMO.find((v) => v.id === Number(preuveDemandee[1]));
    if (!versement) return null;

    return attendre({
      reference: versement.reference,
      objet: versement.objet,
      algorithme: "SHA-256",
      empreinte: empreinteSimulee(`${versement.reference}-preuve`),
      horodatage: new Date().toISOString(),
      autorite: "Horodatage interne — à remplacer par une autorité qualifiée",
      nombrePieces: versement.pieces,
      taille: `${versement.pieces * 2} Mo`,
      produitePar: auteurCourant().nom,
    });
  }

  /* ------------------------------------------------------------------ *
   *  Ecritures des dossiers
   * ------------------------------------------------------------------ */
  if (methode === "POST" && route === "/dossiers") {
    const saisie = corps as SaisieDossierDepuisCourrier;
    const id = Math.max(0, ...DOSSIERS_DEMO.map((d) => d.id)) + 1;
    const courrier = COURRIERS_DEMO.find((c) => c.id === saisie.courrierId);
    const jour = aujourdhui();

    DOSSIERS_DEMO.push({
      id,
      reference: `D-${new Date().getFullYear()}-${String(id + 200).padStart(4, "0")}`,
      objet: saisie.objet,
      type: saisie.type,
      demandeur: saisie.demandeur,
      structure: compteActifDemo()?.utilisateur.structureLibelle ?? "Structure",
      instructeur: auteurCourant().nom,
      initiales: auteurCourant().initiales,
      ouvertLe: jour,
      echeance: saisie.echeance,
      etape: "Qualification",
      etat: "En cours",
      criticite: "Standard",
      feu: "vert",
      joursRestants: joursEntre(jour, saisie.echeance),
      courrierOrigine: courrier?.numero ?? null,
      courrierOrigineId: saisie.courrierId,
      contexte: courrier?.objet ?? saisie.objet,
      regleAffectation: "Affectation manuelle depuis la fiche du courrier d'origine.",
      seuil: null,
      etapes: [
        { code: "Qualification", libelle: "Qualification et affectation", franchie: false, date: null, acteur: auteurCourant().nom },
        { code: "Instruction", libelle: "Instruction du dossier", franchie: false, date: null, acteur: null },
        { code: "Validation", libelle: "Validation hiérarchique", franchie: false, date: null, acteur: null },
        { code: "Notification", libelle: "Notification au demandeur", franchie: false, date: null, acteur: null },
        { code: "Clos", libelle: "Clôture et archivage", franchie: false, date: null, acteur: null },
      ],
      pieces: [],
      complements: [],
      historique: [
        {
          id: 1,
          type: "Ouverture",
          date: jour,
          auteur: auteurCourant().nom,
          initiales: auteurCourant().initiales,
          poste: auteurCourant().poste,
          texte: courrier
            ? `Dossier ouvert à partir du courrier ${courrier.numero}.`
            : "Dossier ouvert.",
          etapeAvant: null,
          etapeApres: "Qualification",
        },
      ],
    });

    return attendre({ id });
  }

  const complementDemande = route.match(/^\/dossiers\/(\d+)\/complements$/);
  if (methode === "POST" && complementDemande) {
    const saisie = corps as SaisieComplement;
    const dossier = DOSSIERS_DEMO.find((d) => d.id === Number(complementDemande[1]));
    if (!dossier) return null;

    const jour = aujourdhui();
    dossier.complements.push({
      id: Math.max(0, ...dossier.complements.map((c) => c.id)) + 1,
      objet: saisie.objet,
      demandeLe: jour,
      demandePar: auteurCourant().nom,
      echeance: saisie.echeance,
      recuLe: null,
    });

    // Le dossier se met en attente : son delai continue de courir, mais
    // l'instruction ne peut pas avancer tant que la piece manque.
    dossier.etat = "En attente de complément";
    dossier.feu = "orange";
    dossier.historique.push({
      id: Math.max(0, ...dossier.historique.map((e) => e.id)) + 1,
      type: "Demande de complément",
      date: jour,
      auteur: auteurCourant().nom,
      initiales: auteurCourant().initiales,
      poste: auteurCourant().poste,
      texte: saisie.objet,
      etapeAvant: null,
      etapeApres: null,
    });

    return attendre({ id: dossier.id });
  }

  const retourDemande = route.match(/^\/dossiers\/(\d+)\/retour$/);
  if (methode === "POST" && retourDemande) {
    const saisie = corps as SaisieRetour;
    const dossier = DOSSIERS_DEMO.find((d) => d.id === Number(retourDemande[1]));
    if (!dossier) return null;

    const etapeAvant = dossier.etape;
    dossier.etape = saisie.etapeCible;
    dossier.etat = "Retourné";
    dossier.feu = "orange";

    /*
     * RF-BPM-06 : le retour ne perd rien de l'historique.
     *
     * On demarque l'etape cible et les suivantes, mais on n'efface aucune
     * ligne : la trace du premier passage reste, avec son acteur et sa date.
     */
    let atteinte = false;
    dossier.etapes.forEach((etape) => {
      if (etape.code === saisie.etapeCible) atteinte = true;
      if (atteinte) {
        etape.franchie = false;
        etape.date = null;
      }
    });

    dossier.historique.push({
      id: Math.max(0, ...dossier.historique.map((e) => e.id)) + 1,
      type: "Retour à l'étape antérieure",
      date: aujourdhui(),
      auteur: auteurCourant().nom,
      initiales: auteurCourant().initiales,
      poste: auteurCourant().poste,
      texte: saisie.motif,
      etapeAvant,
      etapeApres: saisie.etapeCible,
    });

    return attendre({ id: dossier.id });
  }

  const fusionDemandee = route.match(/^\/dossiers\/(\d+)\/fusion$/);
  if (methode === "POST" && fusionDemandee) {
    const saisie = corps as SaisieFusion;
    const dossier = DOSSIERS_DEMO.find((d) => d.id === Number(fusionDemandee[1]));
    const modele = MODELES_DEMO.find((m) => m.id === saisie.modeleId);
    if (!dossier || !modele) return null;

    modele.utilisations += 1;
    const jour = aujourdhui();
    const numero = Math.max(0, ...dossier.pieces.map((p) => p.id)) + 1;

    dossier.pieces.push({
      id: numero,
      nom: `${modele.code}-${dossier.reference}.pdf`,
      format: "PDF",
      versions: [
        { version: 1, deposeLe: jour, deposePar: auteurCourant().nom, taille: "180 Ko", courante: true },
      ],
    });

    dossier.historique.push({
      id: Math.max(0, ...dossier.historique.map((e) => e.id)) + 1,
      type: "Projet de réponse",
      date: jour,
      auteur: auteurCourant().nom,
      initiales: auteurCourant().initiales,
      poste: auteurCourant().poste,
      texte: `Courrier généré à partir du modèle « ${modele.libelle} ».`,
      etapeAvant: null,
      etapeApres: null,
    });

    return attendre({ id: dossier.id });
  }

  /* ------------------------------------------------------------------ *
   *  Ecritures du portail
   * ------------------------------------------------------------------ */
  if (methode === "POST" && route === "/portail/demandes") {
    const saisie = corps as SaisieDemandeUsager;
    const id = Math.max(0, ...DEMANDES_PORTAIL_DEMO.map((d) => d.id)) + 1;
    const jour = aujourdhui();

    // Delai de reponse annonce a l'usager : trente jours, comme les typologies
    // courantes du referentiel. Le vrai serveur le lira dans la typologie.
    const echeance = new Date();
    echeance.setDate(echeance.getDate() + 30);

    DEMANDES_PORTAIL_DEMO.unshift({
      id,
      reference: `D-${new Date().getFullYear()}-${String(id + 300).padStart(4, "0")}`,
      objet: saisie.objet,
      type: saisie.type,
      deposeeLe: jour,
      reponseAttendueLe: echeance.toISOString().slice(0, 10),
      etat: "Déposée",
      actionAttendue: false,
      serviceInstructeur: "En cours d'affectation",
      contexte: saisie.contexte,
      complementAttendu: null,
      etapes: [
        { libelle: "Demande reçue", franchie: true, date: jour, explication: "Votre demande a été enregistrée et va être transmise au service compétent." },
        { libelle: "À l'étude", franchie: false, date: null, explication: "Le service examinera votre dossier. Vous serez averti si une pièce complémentaire est nécessaire." },
        { libelle: "Décision", franchie: false, date: null, explication: "La décision vous sera notifiée par le canal que vous avez choisi." },
        { libelle: "Dossier clos", franchie: false, date: null, explication: "Votre dossier sera archivé et restera consultable ici." },
      ],
      messages: [],
      pieces: saisie.pieces.map((piece, index) => ({
        id: index + 1,
        nom: piece.nom,
        taille: piece.taille,
        deposeeLe: jour,
        parVous: true,
      })),
    });

    return attendre({ id });
  }

  const messagePortail = route.match(/^\/portail\/demandes\/(\d+)\/messages$/);
  if (methode === "POST" && messagePortail) {
    const saisie = corps as SaisieMessage;
    const demande = DEMANDES_PORTAIL_DEMO.find((d) => d.id === Number(messagePortail[1]));
    if (!demande) return null;

    const jour = aujourdhui();
    demande.messages.push({
      id: Math.max(0, ...demande.messages.map((m) => m.id)) + 1,
      auteur: "Vous",
      nom: compteActifDemo()?.utilisateur.nomComplet ?? "Déposant",
      date: jour,
      texte: saisie.texte,
      pieces: saisie.pieces,
    });

    saisie.pieces.forEach((piece) => {
      demande.pieces.push({
        id: Math.max(0, ...demande.pieces.map((p) => p.id)) + 1,
        nom: piece.nom,
        taille: piece.taille,
        deposeeLe: jour,
        parVous: true,
      });
    });

    // Repondre a une demande de complement debloque le dossier : la balle
    // repasse a l'institution, et l'usager doit le voir immediatement.
    if (demande.complementAttendu !== null && saisie.pieces.length > 0) {
      demande.complementAttendu = null;
      demande.actionAttendue = false;
      demande.etat = "À l'étude";
    }

    return attendre({ id: demande.id });
  }

  if (methode === "POST" && route === "/portail/preferences") {
    const saisie = corps as SaisiePreferences;
    PREFERENCES_DEMO.courriel = saisie.courriel;
    PREFERENCES_DEMO.telephone = saisie.telephone;
    PREFERENCES_DEMO.canal = saisie.canal;
    PREFERENCES_DEMO.evenements.forEach((evenement) => {
      evenement.actif = saisie.evenements.includes(evenement.cle);
    });

    return attendre({ id: 1 });
  }

  /*
   * Delegations posees par le poste connecte — §3.4.
   *
   * Une delegation n'est pas supprimee mais close : le registre de
   * l'administrateur doit garder la trace de qui a signe au nom de qui, et
   * jusqu'a quand.
   */
  if (methode === "POST" && route === "/habilitations/delegations") {
    const saisie = corps as SaisieDelegation;
    const compte = compteActifDemo()?.utilisateur;
    const delegataire = DELEGATION_POSSIBLE_DEMO.delegataires.find(
      (d) => d.id === saisie.delegataireId,
    );
    const id = Math.max(0, ...DELEGATIONS_DEMO.map((d) => d.id)) + 1;

    const delegation: Delegation = {
      id,
      titulaire: compte?.nomComplet ?? "—",
      delegataire: delegataire?.nomComplet ?? "—",
      poste: compte?.posteLibelle ?? "—",
      etendue: saisie.etendue,
      debut: saisie.debut,
      fin: saisie.fin,
      motif: saisie.motif,
      // Une delegation qui commence aujourd'hui produit ses effets tout de
      // suite ; celle qui couvre un conge a venir attend sa date.
      etat: saisie.debut <= aujourdhui() ? "active" : "programmee",
    };

    DELEGATIONS_DEMO.push(delegation);
    return attendre(delegation);
  }

  const delegationAClore = route.match(/^\/habilitations\/delegations\/(\d+)$/);
  if (methode === "DELETE" && delegationAClore) {
    const delegation = DELEGATIONS_DEMO.find((d) => d.id === Number(delegationAClore[1]));
    if (delegation) {
      delegation.etat = "close";
      delegation.fin = aujourdhui();
    }
    return attendre(undefined);
  }

  if (methode !== "GET") return null;

  if (route === "/moi") {
    const compte = compteActifDemo();
    if (!compte) {
      return new Promise((_, rejeter) =>
        setTimeout(() => rejeter(new ErreurApi(401, "Aucune session ouverte.")), LATENCE_MS),
      );
    }
    return attendre(compte.utilisateur);
  }
  if (route === "/compteurs") return attendre(COMPTEURS_DEMO);
  if (route === "/referentiels/natures") return attendre(NATURES_DEMO);
  if (route === "/referentiels/structures") return attendre(STRUCTURES_DEMO);
  if (route === "/referentiels/mentions") return attendre(MENTIONS_DEMO);

  if (route === "/referentiels/correspondants") {
    const q = (parametres.get("q") ?? "").trim().toLowerCase();
    return attendre(
      CORRESPONDANTS_DEMO.filter((c) => c.libelle.toLowerCase().includes(q)).slice(0, 8),
    );
  }

  if (route === "/courriers/contexte") {
    return attendre({
      numeroPrevu: "A-2026-0429",
      dateArrivee: new Date().toISOString(),
      sessionLibelle: "Session du 5 août 2026",
    });
  }

  if (route === "/courriers/indicateurs") return attendre(INDICATEURS_DEMO);
  if (route === "/courriers") return attendre(registre(parametres));

  if (route === "/signalements") return attendre(SIGNALEMENTS_DEMO);

  if (route === "/accuses") {
    const vue = parametres.get("vue");
    const filtres: Record<string, string> = { attente: "En attente", nonRetourne: "Non retourné" };
    const etat = vue ? filtres[vue] : undefined;
    return attendre(etat ? ACCUSES_DEMO.filter((a) => a.etat === etat) : ACCUSES_DEMO);
  }

  const vieDemandee = route.match(/^\/courriers\/(\d+)\/fiche-de-vie$/);
  if (vieDemandee) {
    const courrier = COURRIERS_DEMO.find((c) => c.id === Number(vieDemandee[1]));
    if (!courrier) return null;
    return attendre({
      numero: courrier.numero,
      objet: courrier.objet,
      etapes: ETAPES_VIE_DEMO,
      resume: [
        { libelle: "Âge du courrier", valeur: "5 j 06 h", ton: "neutre" },
        { libelle: "Étapes franchies", valeur: String(ETAPES_VIE_DEMO.length), ton: "neutre" },
        { libelle: "Délai imparti", valeur: `${courrier.delai?.joursAlloues ?? 5} j ouvrés`, ton: "neutre" },
        {
          libelle: "Dépassement",
          valeur: (courrier.delai?.joursDepassement ?? 0) > 0 ? `${courrier.delai?.joursDepassement} j` : "aucun",
          ton: (courrier.delai?.joursDepassement ?? 0) > 0 ? "alerte" : "succes",
        },
        { libelle: "Signalements", valeur: "1 ouvert", ton: "alerte" },
      ],
      detenteurs: DETENTEURS_DEMO,
      lies: [
        { reference: "A-2026-0368", titre: "Facture initiale du prestataire", chemin: "/courriers/368" },
        { reference: "D-2026-0207", titre: "Projet de réponse au Trésor public", chemin: "/courriers/207" },
        { reference: "EC-2026-0087", titre: "Signalement de pièce manquante", chemin: "/courriers" },
      ],
    });
  }

  if (route === "/departs") {
    const vue = parametres.get("vue") ?? "tous";
    const q = (parametres.get("q") ?? "").trim().toLowerCase();
    const etapes: Record<string, string> = {
      brouillons: "BROUILLON",
      enVisa: "EN_VISA",
      aSigner: "A_SIGNER",
      signes: "SIGNE",
      partis: "PARTI",
      renvoyes: "RENVOYE",
    };

    let lignes = DEPARTS_DEMO;
    if (etapes[vue]) lignes = lignes.filter((d) => d.etape === etapes[vue]);
    if (q) {
      lignes = lignes.filter((d) =>
        [d.numero ?? "", d.destinataire, d.objet].some((c) => c.toLowerCase().includes(q)),
      );
    }

    return attendre({
      lignes,
      total: lignes.length,
      indicateurs: {
        signesCeMois: 218,
        enAttenteVisa: 34,
        delaiVisaSignature: 1.6,
        signesNonPartis: 9,
      },
    });
  }

  const circuitDemande = route.match(/^\/departs\/(\d+)\/circuit$/);
  if (circuitDemande) {
    const depart = DEPARTS_DEMO.find((d) => d.id === Number(circuitDemande[1]));
    if (!depart) return null;
    return attendre({
      numero: depart.numero,
      objet: depart.objet,
      destinataire: depart.destinataire,
      redacteur: depart.redacteur,
      mode: "CASCADE",
      etapes: [
        { ordre: 1, nomComplet: depart.redacteur, initiales: "MD", fonction: `Rédacteur — ${depart.structure}`, etat: "soumis", horodatage: "2026-08-03T16:24:00", depuis: null, observation: null, estMoi: false },
        { ordre: 2, nomComplet: "S. Bamba", initiales: "SB", fonction: "Chef de service comptabilité", etat: "vise", horodatage: "2026-08-04T08:51:00", depuis: null, observation: "Pièces vérifiées, montant conforme au bon de commande.", estMoi: false },
        { ordre: 3, nomComplet: "A. Kouassi", initiales: "AK", fonction: "Directeur", etat: "attendu", horodatage: null, depuis: "6 h", observation: null, estMoi: true },
        { ordre: 4, nomComplet: "N'Guessan Y.", initiales: "NY", fonction: "Directeur général — signature", etat: "attendu", horodatage: null, depuis: null, observation: null, estMoi: false },
      ],
    });
  }

  if (route === "/departs/file-signature") {
    return attendre({
      lignes: DEPARTS_DEMO.filter((d) => d.etape === "A_SIGNER"),
      signataire: { nomComplet: "N'Guessan Y.", fonction: "Directeur général", initiales: "NY" },
    });
  }

  const bordereauDemande = route.match(/^\/bordereaux\/([\w-]+)$/);
  if (bordereauDemande) return attendre(BORDEREAU_DEMO);

  if (route === "/parametrage") {
    return attendre({
      // Etapes du circuit standard — arrivee (circuit 1), avec leurs delais et
      // ce qui se passe a l'echeance.
      etapes: [
        { id: 1, circuitId: 1, rang: 1, libelle: "Enregistrement au bureau d'ordre", acteur: "Agent de session courrier", delaiJours: 1, escalade: "Relance automatique", alerteAvant: 1, bloquante: true },
        { id: 2, circuitId: 1, rang: 2, libelle: "Cotation par l'autorité", acteur: "Directeur général", delaiJours: 1, escalade: "Relance automatique", alerteAvant: 1, bloquante: true },
        { id: 3, circuitId: 1, rang: 3, libelle: "Transmission à la structure cotée", acteur: "Service du courrier central", delaiJours: 1, escalade: "Escalade au supérieur", alerteAvant: 1, bloquante: true },
        { id: 4, circuitId: 1, rang: 4, libelle: "Traitement par la structure", acteur: "Structure chef de file", delaiJours: 5, escalade: "Escalade au supérieur", alerteAvant: 2, bloquante: true },
        { id: 5, circuitId: 1, rang: 5, libelle: "Accusé de réception physique", acteur: "Structure destinataire", delaiJours: 2, escalade: "Aucune", alerteAvant: null, bloquante: false },
      ],
      // Plan de classement — RF-GED-07.
      classement: [
        { id: 1, code: "10", libelle: "Gouvernance et instances", niveau: 0, parentId: null, documents: 486, typologiesAssociees: ["Délibération du Conseil d'administration"] },
        { id: 2, code: "10.1", libelle: "Conseil d'administration", niveau: 1, parentId: 1, documents: 214, typologiesAssociees: ["Délibération du Conseil d'administration"] },
        { id: 3, code: "10.2", libelle: "Comité de direction", niveau: 1, parentId: 1, documents: 178, typologiesAssociees: [] },
        { id: 4, code: "10.3", libelle: "Filiales et succursales", niveau: 1, parentId: 1, documents: 94, typologiesAssociees: [] },
        { id: 5, code: "20", libelle: "Affaires financières", niveau: 0, parentId: null, documents: 1_204, typologiesAssociees: ["Marché public et contrat"] },
        { id: 6, code: "20.1", libelle: "Marchés et contrats", niveau: 1, parentId: 5, documents: 486, typologiesAssociees: ["Marché public et contrat"] },
        { id: 7, code: "20.2", libelle: "Budget et exécution", niveau: 1, parentId: 5, documents: 512, typologiesAssociees: [] },
        { id: 8, code: "20.3", libelle: "Recouvrement et redevances", niveau: 1, parentId: 5, documents: 206, typologiesAssociees: [] },
        { id: 9, code: "30", libelle: "Domaine et exploitation portuaire", niveau: 0, parentId: null, documents: 842, typologiesAssociees: [] },
        { id: 10, code: "30.1", libelle: "Occupations du domaine", niveau: 1, parentId: 9, documents: 418, typologiesAssociees: [] },
        { id: 11, code: "30.2", libelle: "Travaux et ouvrages", niveau: 1, parentId: 9, documents: 424, typologiesAssociees: [] },
        { id: 12, code: "40", libelle: "Affaires juridiques", niveau: 0, parentId: null, documents: 218, typologiesAssociees: ["Dossier contentieux"] },
        { id: 13, code: "40.1", libelle: "Contentieux", niveau: 1, parentId: 12, documents: 57, typologiesAssociees: ["Dossier contentieux"] },
        { id: 14, code: "40.2", libelle: "Réclamations d'usagers", niveau: 1, parentId: 12, documents: 161, typologiesAssociees: ["Réclamation d'usager"] },
        { id: 15, code: "50", libelle: "Administration générale", niveau: 0, parentId: null, documents: 1_842, typologiesAssociees: ["Courrier d'administration générale", "Note de service"] },
      ],
      // Seuils d'alerte — RF-BI-05.
      seuils: [
        { id: 1, indicateur: "Courriers hors délai", perimetre: "Par structure", operateur: "supérieur à", valeur: 10, unite: "courriers", destinataire: "Responsable de structure et DSR", canal: "Les deux", actif: true, declenchements30j: 7 },
        { id: 2, indicateur: "Délai moyen de traitement", perimetre: "Institution", operateur: "supérieur à", valeur: 8, unite: "jours", destinataire: "DSR", canal: "Notification interne", actif: true, declenchements30j: 2 },
        { id: 3, indicateur: "Taux d'exécution du plan d'actions", perimetre: "Par structure", operateur: "inférieur à", valeur: 60, unite: "%", destinataire: "Responsable de structure, DSR et contrôle de gestion", canal: "Les deux", actif: true, declenchements30j: 4 },
        { id: 4, indicateur: "Score global de la matrice", perimetre: "Par structure", operateur: "inférieur à", valeur: 60, unite: "points", destinataire: "Directeur général et CODIR", canal: "Courriel", actif: true, declenchements30j: 2 },
        { id: 5, indicateur: "Décisions arrivées à échéance sans exécution", perimetre: "Institution", operateur: "supérieur à", valeur: 3, unite: "décisions", destinataire: "DSR", canal: "Notification interne", actif: true, declenchements30j: 5 },
        { id: 6, indicateur: "Rapports mensuels non déposés", perimetre: "Institution", operateur: "supérieur à", valeur: 2, unite: "structures", destinataire: "DSR", canal: "Notification interne", actif: true, declenchements30j: 3 },
        { id: 7, indicateur: "Absences sans intérimaire désigné", perimetre: "Institution", operateur: "supérieur à", valeur: 0, unite: "responsables", destinataire: "DSR et direction des ressources humaines", canal: "Les deux", actif: false, declenchements30j: 0 },
      ],
      circuits: [
        { id: 1, libelle: "Circuit standard — arrivée", sappliqueA: "Tout courrier arrivé", nombreEtapes: 4, delaiCible: 5, usage: 211, actif: true },
        { id: 2, libelle: "Circuit court — réclamation", sappliqueA: "Nature « Réclamation »", nombreEtapes: 3, delaiCible: 3, usage: 96, actif: true },
        { id: 3, libelle: "Circuit direction", sappliqueA: "Priorité très urgente", nombreEtapes: 5, delaiCible: 2, usage: 34, actif: true },
        { id: 4, libelle: "Circuit confidentiel", sappliqueA: "Session confidentielle", nombreEtapes: 3, delaiCible: 3, usage: 18, actif: true },
        { id: 5, libelle: "Circuit facture — ancien", sappliqueA: "Nature « Facture »", nombreEtapes: 4, delaiCible: 10, usage: 0, actif: false },
      ],
      regles: [
        { id: 1, ordre: 1, condition: "Session = Confidentiel", circuit: "Circuit confidentiel", declenchements: 18, repli: false },
        { id: 2, ordre: 2, condition: "Priorité = Très urgente", circuit: "Circuit direction", declenchements: 34, repli: false },
        { id: 3, ordre: 3, condition: "Nature = Réclamation", circuit: "Circuit court — réclamation", declenchements: 96, repli: false },
        { id: 4, ordre: 4, condition: "Aucune règle ne correspond", circuit: "Circuit standard — arrivée", declenchements: 211, repli: true },
      ],
      mentions: [
        { id: 1, libelle: "Pour attribution", delaiAssocie: 5, comportement: "Confie le traitement à la structure", niveauxAutorises: ["Direction générale", "Direction"], active: true },
        { id: 2, libelle: "Pour information", delaiAssocie: null, comportement: "N'ouvre aucun délai", niveauxAutorises: ["Direction générale", "Direction", "Service"], active: true },
        { id: 3, libelle: "Pour avis", delaiAssocie: 3, comportement: "Attend une réponse écrite", niveauxAutorises: ["Direction générale", "Direction"], active: true },
        { id: 4, libelle: "Pour suite à donner", delaiAssocie: 5, comportement: "Confie le traitement à la structure", niveauxAutorises: ["Direction"], active: true },
        { id: 5, libelle: "Me rendre compte", delaiAssocie: 5, comportement: "Exige un compte rendu au cotant", niveauxAutorises: ["Direction générale"], active: true },
        { id: 6, libelle: "À classer", delaiAssocie: null, comportement: "Clôt le courrier sans traitement", niveauxAutorises: ["Direction générale", "Direction"], active: true },
        { id: 7, libelle: "En urgence", delaiAssocie: 1, comportement: "Confie le traitement à la structure", niveauxAutorises: ["Direction générale"], active: true },
        { id: 8, libelle: "Pour signature", delaiAssocie: 2, comportement: "Attend une réponse écrite", niveauxAutorises: ["Direction"], active: true },
        { id: 9, libelle: "Pour exécution", delaiAssocie: 5, comportement: "Confie le traitement à la structure", niveauxAutorises: ["Direction"], active: false },
      ],
      correspondants: [
        { id: 1, libelle: "Conseil régional", categorie: "Institution", ville: "Abidjan", nombreCourriers: 628, doublonPresume: false },
        { id: 2, libelle: "Ministère de tutelle", categorie: "Institution", ville: "Abidjan", nombreCourriers: 412, doublonPresume: false },
        { id: 3, libelle: "Ministère de Tutelle", categorie: "Institution", ville: "Abidjan", nombreCourriers: 7, doublonPresume: true },
        { id: 4, libelle: "Trésor public", categorie: "Institution", ville: "Abidjan", nombreCourriers: 96, doublonPresume: false },
        { id: 5, libelle: "Société Ivoire BTP", categorie: "Entreprise", ville: "Yopougon", nombreCourriers: 34, doublonPresume: false },
        { id: 6, libelle: "Sotra Services", categorie: "Entreprise", ville: "Abidjan", nombreCourriers: 21, doublonPresume: false },
      ],
      engagements: [
        { id: 1, libelle: "Accusé de réception au correspondant", delaiCible: 2, premiereAlerte: 1, respect90j: 91 },
        { id: 2, libelle: "Cotation d'un courrier enregistré", delaiCible: 1, premiereAlerte: 1, respect90j: 78 },
        { id: 3, libelle: "Traitement d'un dossier affecté", delaiCible: 5, premiereAlerte: 4, respect90j: 68 },
        { id: 4, libelle: "Visa d'un projet de réponse", delaiCible: 2, premiereAlerte: 1, respect90j: 54 },
        { id: 5, libelle: "Départ après signature", delaiCible: 1, premiereAlerte: 1, respect90j: 86 },
      ],
    });
  }

  /*
   * Tableau de bord de l'administration.
   *
   * Il ne compte pas des courriers mais des actions journalisees. Les trois
   * periodes ne sont pas un simple facteur applique au mois : la part de
   * chaque type d'operation se deplace, parce qu'un parametrage se fait au
   * demarrage et qu'une cotation se fait tous les jours.
   */
  if (route === "/administration/tableau-de-bord") {
    const periode = parametres.get("periode") ?? "30j";

    const jeux: Record<string, {
      total: number;
      variation: string;
      precedent: string;
      ratioActifs: number;
      /** Acces de la periode. Le journal, lui, ne montre que les derniers. */
      acces: { signales: number; refuses: number; confidentiels: number };
      activite: { periode: string; operations: number }[];
      parType: { libelle: string; valeur: number; part: number }[];
    }> = {
      "30j": {
        total: 12480,
        variation: "▲ 18,2 %",
        precedent: "vs. 10 560 période précédente",
        ratioActifs: 1,
        acces: { signales: 7, refuses: 2, confidentiels: 5 },
        activite: [
          { periode: "sem. 27", operations: 1840 },
          { periode: "sem. 28", operations: 2120 },
          { periode: "sem. 29", operations: 1960 },
          { periode: "sem. 30", operations: 2240 },
          { periode: "sem. 31", operations: 2380 },
          { periode: "sem. 32", operations: 1940 },
        ],
        parType: [
          { libelle: "Enregistrement", valeur: 3940, part: 32 },
          { libelle: "Traitement", valeur: 3120, part: 25 },
          { libelle: "Cotation", valeur: 2810, part: 22 },
          { libelle: "Signature", valeur: 1460, part: 12 },
          { libelle: "Paramétrage", valeur: 890, part: 7 },
          { libelle: "Habilitation", valeur: 260, part: 2 },
        ],
      },
      trimestre: {
        total: 36940,
        variation: "▲ 11,4 %",
        precedent: "vs. 33 160 trimestre précédent",
        ratioActifs: 1.08,
        acces: { signales: 19, refuses: 6, confidentiels: 14 },
        activite: [
          { periode: "juin", operations: 12100 },
          { periode: "juillet", operations: 13260 },
          { periode: "août", operations: 11580 },
        ],
        parType: [
          { libelle: "Enregistrement", valeur: 11620, part: 31 },
          { libelle: "Traitement", valeur: 9180, part: 25 },
          { libelle: "Cotation", valeur: 8350, part: 23 },
          { libelle: "Signature", valeur: 4380, part: 12 },
          { libelle: "Paramétrage", valeur: 2690, part: 7 },
          { libelle: "Habilitation", valeur: 720, part: 2 },
        ],
      },
      annee: {
        total: 128400,
        variation: "▲ 42,6 %",
        precedent: "première année pleine d'exploitation",
        ratioActifs: 1.15,
        acces: { signales: 64, refuses: 21, confidentiels: 48 },
        activite: [
          { periode: "janv.", operations: 14200 },
          { periode: "févr.", operations: 15100 },
          { periode: "mars", operations: 16800 },
          { periode: "avr.", operations: 15400 },
          { periode: "mai", operations: 17200 },
          { periode: "juin", operations: 16300 },
          { periode: "juil.", operations: 18900 },
          { periode: "août", operations: 14500 },
        ],
        parType: [
          { libelle: "Enregistrement", valeur: 40100, part: 31 },
          { libelle: "Traitement", valeur: 32200, part: 25 },
          { libelle: "Cotation", valeur: 29500, part: 23 },
          { libelle: "Signature", valeur: 15400, part: 12 },
          { libelle: "Paramétrage", valeur: 8900, part: 7 },
          { libelle: "Habilitation", valeur: 2300, part: 2 },
        ],
      },
    };

    const jeu = jeux[periode] ?? jeux["30j"];

    // Les lignes se deduisent du total : les parts, elles, ne bougent pas.
    const adoption = ADOPTION_DEMO.map((s) => ({
      structure: s.structure,
      habilites: s.habilites,
      actifs: Math.min(s.habilites, Math.round(s.actifs * jeu.ratioActifs)),
      operations: Math.round((jeu.total * s.part) / 100),
      part: s.part,
      derniereActivite: s.derniereActivite,
    }));

    const actifs = adoption.reduce((somme, s) => somme + s.actifs, 0);
    const habilites = adoption.reduce((somme, s) => somme + s.habilites, 0);
    const anomalies = ANOMALIES_DEMO.reduce((somme, a) => somme + a.nombre, 0);
    const signales = ACCES_DEMO.filter((a) => a.controle === "Signalé");

    return attendre({
      indicateurs: [
        {
          libelle: "Opérations enregistrées",
          valeur: jeu.total.toLocaleString("fr-FR"),
          variation: jeu.variation,
          ton: "succes",
          note: jeu.precedent,
        },
        {
          libelle: "Utilisateurs actifs",
          valeur: `${actifs} / ${habilites}`,
          variation: `${Math.round((actifs / habilites) * 100)} %`,
          ton: "accent",
          note: "comptes ayant agi sur la période",
        },
        {
          libelle: "Accès signalés",
          valeur: String(jeu.acces.signales),
          variation: null,
          ton: "danger",
          note: "à examiner par l'administrateur",
        },
        {
          libelle: "Anomalies du référentiel",
          valeur: String(anomalies),
          variation: null,
          ton: "alerte",
          note: "comptes, délégations et postes",
        },
      ],
      activite: jeu.activite,
      operationsTotal: jeu.total,
      operationsVariation: jeu.variation,
      parType: jeu.parType,
      adoption,
      structuresInactives: adoption.filter((s) => s.derniereActivite === null).length,
      referentiel: REFERENTIEL_DEMO,
      anomalies: ANOMALIES_DEMO,
      acces: {
        ...jeu.acces,
        // Les compteurs couvrent la periode ; la liste ne montre que les
        // derniers signalements — c'est par la qu'on entre dans le journal.
        dernieres: signales.slice(0, 3).map((a) => ({
          id: a.id,
          horodatage: a.heure,
          agent: a.agent,
          action: a.action,
          objet: a.objet,
        })),
      },
    });
  }

  if (route === "/tracabilite/evenements") {
    const type = parametres.get("type") ?? "Tous";
    const evenements = EVENEMENTS_DEMO.filter((e) => type === "Tous" || e.type === type);
    return attendre({
      compteurs: [
        { libelle: "Événements enregistrés", valeur: "1 284", note: "sur les 7 derniers jours", ton: "neutre" },
        { libelle: "Actions de paramétrage", valeur: "17", note: "dont 4 sur les habilitations", ton: "neutre" },
        { libelle: "Corrections après validation", valeur: "9", note: "toutes dans la fenêtre de 24 h", ton: "alerte" },
        { libelle: "Accès signalés", valeur: "4", note: "à examiner par l'administrateur", ton: "danger" },
      ],
      evenements,
    });
  }

  if (route === "/tracabilite/acces") {
    const filtre = parametres.get("filtre") ?? "Tous";
    const acces = ACCES_DEMO.filter((a) => {
      if (filtre === "Tous") return true;
      if (filtre === "Signalé") return a.controle === "Signalé";
      if (filtre === "Session confidentielle") return a.session === "Session confidentielle";
      return a.action === filtre;
    });
    return attendre({ acces, signales: ACCES_DEMO.filter((a) => a.controle === "Signalé").length });
  }

  if (route === "/organisation/niveaux") {
    return attendre([
      { id: 1, rang: 1, libelle: "Direction générale", nombreStructures: 1, nombrePostes: 3, peutCoter: true, peutRecevoirCotation: true, porteSignature: true, ligneStatistiques: true, niveauParentId: null },
      { id: 2, rang: 2, libelle: "Direction", nombreStructures: 6, nombrePostes: 18, peutCoter: true, peutRecevoirCotation: true, porteSignature: false, ligneStatistiques: true, niveauParentId: 1 },
      { id: 3, rang: 3, libelle: "Service", nombreStructures: 14, nombrePostes: 42, peutCoter: true, peutRecevoirCotation: true, porteSignature: false, ligneStatistiques: true, niveauParentId: 2 },
      { id: 4, rang: 4, libelle: "Bureau", nombreStructures: 22, nombrePostes: 61, peutCoter: false, peutRecevoirCotation: true, porteSignature: false, ligneStatistiques: false, niveauParentId: 3 },
    ]);
  }

  if (route === "/organisation/postes") {
    return attendre([
      { id: 1, libelle: "Chef du bureau d'ordre", structure: "DSR", niveau: "Service", profilParDefaut: "Enregistrement", titulaires: 1, postesPrevus: 1 },
      { id: 2, libelle: "Agent d'enregistrement", structure: "DSR", niveau: "Bureau", profilParDefaut: "Enregistrement", titulaires: 3, postesPrevus: 4 },
      { id: 3, libelle: "Chef de service comptabilité", structure: "DAF", niveau: "Service", profilParDefaut: "Responsable", titulaires: 1, postesPrevus: 1 },
      { id: 4, libelle: "Gestionnaire de dossiers", structure: "DAF · Comptabilité", niveau: "Bureau", profilParDefaut: "Agent", titulaires: 4, postesPrevus: 6 },
      { id: 5, libelle: "Coursier", structure: "DSR", niveau: "Bureau", profilParDefaut: "Agent", titulaires: 2, postesPrevus: 2 },
      { id: 6, libelle: "Directeur général", structure: "Direction générale", niveau: "Direction générale", profilParDefaut: "Signataire", titulaires: 1, postesPrevus: 1 },
    ]);
  }

  if (route === "/habilitations/utilisateurs") {
    const vue = parametres.get("vue") ?? "tous";
    const etats: Record<string, string> = { actifs: "actif", suspendus: "suspendu", invitations: "invite" };
    const utilisateurs = [
      { id: 1, nomComplet: "A. Kouassi", initiales: "AK", identifiant: "a.kouassi@suivicourrier.ci", structure: "Cabinet", poste: "Chef de cabinet", profil: "Administrateur", etat: "actif" },
      { id: 2, nomComplet: "S. Bamba", initiales: "SB", identifiant: "s.bamba@suivicourrier.ci", structure: "DAF", poste: "Chef de service comptabilité", profil: "Responsable", etat: "actif" },
      { id: 3, nomComplet: "M. Diallo", initiales: "MD", identifiant: "m.diallo@suivicourrier.ci", structure: "DAF", poste: "Gestionnaire de dossiers", profil: "Agent", etat: "actif" },
      { id: 4, nomComplet: "K. Traoré", initiales: "KT", identifiant: "k.traore@suivicourrier.ci", structure: "DSR", poste: "Chef du bureau d'ordre", profil: "Enregistrement", etat: "actif" },
      { id: 5, nomComplet: "N'Guessan Y.", initiales: "NY", identifiant: "dg@suivicourrier.ci", structure: "Direction générale", poste: "Directeur général", profil: "Signataire", etat: "actif" },
      { id: 6, nomComplet: "A. Yao", initiales: "AY", identifiant: "a.yao@suivicourrier.ci", structure: "DCG", poste: "Gestionnaire de dossiers", profil: "Agent", etat: "suspendu" },
      { id: 7, nomComplet: "I. Ouattara", initiales: "IO", identifiant: "i.ouattara@suivicourrier.ci", structure: "DSR", poste: "Coursier", profil: "Agent", etat: "invite" },
      { id: 8, nomComplet: "F. Koné", initiales: "FK", identifiant: "f.kone@suivicourrier.ci", structure: "Direction du Foncier", poste: "Directrice", profil: "Responsable", etat: "actif" },
    ];
    return attendre(etats[vue] ? utilisateurs.filter((u) => u.etat === etats[vue]) : utilisateurs);
  }

  if (route === "/habilitations/profils") {
    return attendre([
      { id: 1, libelle: "Agent", nombreAgents: 18, verrouille: false, permissions: ["LEC", "TRA"] },
      { id: 2, libelle: "Enregistrement", nombreAgents: 6, verrouille: false, permissions: ["LEC", "ENR", "COT_DEL", "TRANS", "IMP"] },
      { id: 3, libelle: "Responsable", nombreAgents: 9, verrouille: false, permissions: ["LEC", "COT", "AFF", "TRA", "REL", "STAT", "IMP"] },
      { id: 4, libelle: "Signataire", nombreAgents: 2, verrouille: false, permissions: ["LEC", "COT", "VAL", "CLO", "STAT", "CONF"] },
      { id: 5, libelle: "Administrateur", nombreAgents: 1, verrouille: true, permissions: ["LEC", "ADM_ORG", "ADM_HAB", "ADM_PAR", "AUDIT", "STAT"] },
    ]);
  }

  if (route === "/habilitations/perimetres") {
    return attendre([
      { id: 1, libelle: "Institution", assise: "Direction générale", etendue: "Tous les courriers de l'institution", nombreAgents: 4, inclureDescendants: true, voirConfidentiel: true, lectureClotures: true, statistiquesAgregees: true },
      { id: 2, libelle: "Direction et services", assise: "Direction", etendue: "Sa structure et ses descendantes", nombreAgents: 12, inclureDescendants: true, voirConfidentiel: false, lectureClotures: true, statistiquesAgregees: true },
      { id: 3, libelle: "Service seul", assise: "Service", etendue: "Sa structure uniquement", nombreAgents: 16, inclureDescendants: false, voirConfidentiel: false, lectureClotures: true, statistiquesAgregees: false },
      { id: 4, libelle: "Poste", assise: "Poste de travail", etendue: "Les dossiers qui lui sont affectés", nombreAgents: 22, inclureDescendants: false, voirConfidentiel: false, lectureClotures: false, statistiquesAgregees: false },
    ]);
  }

  if (route === "/habilitations/sessions") {
    return attendre([
      { id: 1, libelle: "Arrivé — bureau d'ordre", courriersEnCours: 128, agents: [
        { id: 1, nomComplet: "K. Traoré", poste: "Chef du bureau d'ordre", rattacheLe: "2026-01-05" },
        { id: 2, nomComplet: "A. Kouassi", poste: "Agent d'enregistrement", rattacheLe: "2026-01-05" },
        { id: 3, nomComplet: "M. Koffi", poste: "Agent d'enregistrement", rattacheLe: "2026-03-12" },
      ] },
      { id: 2, libelle: "Départ — bureau d'ordre", courriersEnCours: 42, agents: [
        { id: 1, nomComplet: "K. Traoré", poste: "Chef du bureau d'ordre", rattacheLe: "2026-01-05" },
      ] },
      { id: 3, libelle: "Confidentiel — cabinet", courriersEnCours: 7, agents: [
        { id: 4, nomComplet: "F. Konaté", poste: "Secrétaire particulière", rattacheLe: "2026-02-01" },
      ] },
      { id: 4, libelle: "Interne — états DSR", courriersEnCours: 19, agents: [] },
    ]);
  }

  if (methode === "GET" && route === "/habilitations/delegations") {
    return attendre(DELEGATIONS_DEMO);
  }

  /*
   * Delegations du poste connecte — §3.4.
   *
   * Le vrai serveur filtrera sur le titulaire de la session ; ici on compare au
   * nom du compte de demonstration, ce qui suffit a montrer qu'un responsable
   * ne voit que les siennes.
   */
  if (methode === "GET" && route === "/habilitations/delegations/miennes") {
    const moi = compteActifDemo()?.utilisateur.nomComplet;
    return attendre(DELEGATIONS_DEMO.filter((d) => d.titulaire === moi && d.etat !== "close"));
  }

  if (methode === "GET" && route === "/habilitations/delegations/possible") {
    return attendre(DELEGATION_POSSIBLE_DEMO);
  }

  if (route === "/pilotage/statistiques") {
    return attendre({
      volumeAnnuel: 8942,
      volumeAnneePrecedente: 8041,
      tauxRespect: 68,
      delaiMoyen: 3.4,
      expediteursDistincts: 412,
      parMois: [
        { mois: "janv.", arrives: 742, departs: 588 },
        { mois: "févr.", arrives: 698, departs: 612 },
        { mois: "mars", arrives: 812, departs: 674 },
        { mois: "avr.", arrives: 776, departs: 701 },
        { mois: "mai", arrives: 854, departs: 688 },
        { mois: "juin", arrives: 921, departs: 742 },
        { mois: "juil.", arrives: 1042, departs: 812 },
        { mois: "août", arrives: 386, departs: 291 },
      ],
      seuilAttendu: 80,
      parStructure: [
        { structure: "Cabinet", volume: 2104, delaiMoyen: 2.6, respect: 82 },
        { structure: "DAF", volume: 1862, delaiMoyen: 4.1, respect: 61 },
        { structure: "Direction du Foncier", volume: 1468, delaiMoyen: 5.3, respect: 47 },
        { structure: "DSR", volume: 1042, delaiMoyen: 2.2, respect: 88 },
        { structure: "DCG", volume: 908, delaiMoyen: 3.0, respect: 74 },
        { structure: "Service juridique", volume: 642, delaiMoyen: 6.8, respect: 38 },
      ],
    });
  }

  if (route === "/pilotage/tableau-de-bord") {
    const perimetre = parametres.get("perimetre") ?? "institution";

    const jeux: Record<string, { libelle: string; valeur: string; variation: string | null; ton: string; note: string | null }[]> = {
      institution: [
        { libelle: "Courriers en cours", valeur: "1 284", variation: "▲ 15,5 %", ton: "succes", note: "vs. 1 112 période précédente" },
        { libelle: "Délais dépassés", valeur: "96", variation: "▲ 8,4 %", ton: "danger", note: "dont 31 au-delà de 5 jours" },
        { libelle: "Délai moyen de traitement", valeur: "3,4 j", variation: "▼ 6,2 %", ton: "succes", note: "vs. 3,6 j période précédente" },
        { libelle: "Courriers clôturés", valeur: "1 042", variation: "▲ 4,4 %", ton: "succes", note: "vs. 998 période précédente" },
      ],
      structure: [
        { libelle: "À coter", valeur: "18", variation: "▲ 3", ton: "alerte", note: "circuit en mode cascade" },
        { libelle: "En cours dans ma structure", valeur: "148", variation: "▲ 6,1 %", ton: "accent", note: "dont 42 chez les structures filles" },
        { libelle: "Délais dépassés", valeur: "12", variation: "▼ 2", ton: "danger", note: "3 escaladés au niveau supérieur" },
        { libelle: "À valider", valeur: "7", variation: "2 urgents", ton: "alerte", note: "projets de réponse soumis" },
      ],
      mesDossiers: [
        { libelle: "Mes dossiers en cours", valeur: "23", variation: "4 urgents", ton: "alerte", note: "affectés par ma hiérarchie" },
        { libelle: "Échéance sous 48 h", valeur: "5", variation: null, ton: "alerte", note: "dont 1 en dépassement" },
        { libelle: "En attente de validation", valeur: "3", variation: null, ton: "accent", note: "projets soumis au responsable" },
        { libelle: "Traités ce mois", valeur: "41", variation: "▲ 12 %", ton: "succes", note: "délai moyen 2,8 j" },
      ],
    };

    return attendre({
      indicateurs: jeux[perimetre] ?? jeux.institution,
      volume: [
        { periode: "sem. 27", enregistres: 268, clotures: 214 },
        { periode: "sem. 28", enregistres: 312, clotures: 258 },
        { periode: "sem. 29", enregistres: 291, clotures: 276 },
        { periode: "sem. 30", enregistres: 344, clotures: 289 },
        { periode: "sem. 31", enregistres: 385, clotures: 312 },
        { periode: "sem. 32", enregistres: 326, clotures: 341 },
      ],
      volumeTotal: 2326,
      volumeVariation: "▲ 24,4 %",
      confidentiels: 116,
      retards: [
        { id: 412, numero: "A-2026-0412", objet: "Demande d'audience du Conseil régional", structure: "DAF", etape: "Traitement", retardJours: 9 },
        { id: 397, numero: "A-2026-0397", objet: "Réclamation sur le délai de paiement", structure: "Direction du Foncier", etape: "Validation", retardJours: 7 },
        { id: 388, numero: "A-2026-0388", objet: "Transmission du rapport trimestriel", structure: "DCG", etape: "Cotation cascade", retardJours: 5 },
        { id: 376, numero: "A-2026-0376", objet: "Convocation à la réunion de coordination", structure: "Cabinet", etape: "Affectation", retardJours: 4 },
        { id: 361, numero: "A-2026-0361", objet: "Facture du prestataire de maintenance", structure: "DAF", etape: "Traitement", retardJours: 3 },
      ],
      totalRetards: 96,
      chargeParJour: [
        { jour: "lun", valeur: 312 },
        { jour: "mar", valeur: 248 },
        { jour: "mer", valeur: 196 },
        { jour: "jeu", valeur: 224 },
        { jour: "ven", valeur: 178 },
        { jour: "sam", valeur: 42 },
        { jour: "dim", valeur: 8 },
      ],
      tauxRespect: 68,
      objectifRespect: 80,
    });
  }

  if (route === "/suivi/recherches") {
    return attendre([
      { id: 1, libelle: "Factures en attente — DAF", nombre: 24, criteres: { motsCles: "facture", du: "", au: "", sessions: ["ARRIVE"], statuts: ["enCours"], structureId: "3", natureId: "4", inclureArchives: false } },
      { id: 2, libelle: "Réclamations d'usagers 2026", nombre: 118, criteres: { motsCles: "", du: "2026-01-01", au: "", sessions: [], statuts: [], structureId: "", natureId: "3", inclureArchives: false } },
      { id: 3, libelle: "Conseil régional — tout l'historique", nombre: 628, criteres: { motsCles: "Conseil régional", du: "", au: "", sessions: [], statuts: [], structureId: "", natureId: "", inclureArchives: true } },
    ]);
  }

  if (route === "/suivi/relance") {
    const vue = parametres.get("vue") ?? "horsDelai";
    const enRetard = (c: CourrierDemo) => (c.delai?.joursDepassement ?? 0) > 0;
    const filtres: Record<string, (c: CourrierDemo) => boolean> = {
      horsDelai: enRetard,
      sous48h: (c) =>
        !enRetard(c) && (c.delai?.joursAlloues ?? 0) - (c.delai?.joursEcoules ?? 0) <= 2,
      sansAccuse: (c) => c.etape === "TRANSMIS" || c.etape === "COTE",
      dejaRelances: (c) => c.id % 2 === 0,
      tous: (c) => c.etape !== "CLOTURE",
    };

    const lignes = COURRIERS_DEMO.filter(filtres[vue] ?? filtres.tous).map((c) => ({
      id: c.id,
      numero: c.numero,
      objet: c.objet,
      structure: c.structuresCotees[0] ?? "Non cotée",
      agent: c.affecteAMoi ? "M. Diallo" : c.structuresCotees.length > 0 ? "F. Koné" : null,
      delai: c.delai,
      derniereRelance: c.id % 2 === 0 ? "2026-07-31" : null,
      niveauEscalade: (c.delai?.joursDepassement ?? 0) > 8 ? 2 : (c.delai?.joursDepassement ?? 0) > 0 ? 1 : 0,
    }));

    return attendre({
      lignes,
      indicateurs: {
        horsDelai: 14,
        horsDelaiGrave: 4,
        sous48h: 9,
        structuresConcernees: 3,
        relancesMois: 32,
        escalades: 7,
        tauxRespect: 68,
      },
    });
  }

  if (route === "/suivi/portefeuille") {
    const dossiers = COURRIERS_DEMO.filter((c) => c.affecteAMoi);
    return attendre({
      dossiers,
      aRendre: dossiers.length,
      horsDelai: dossiers.filter((c) => (c.delai?.joursDepassement ?? 0) > 0).length,
      enVisa: 1,
    });
  }

  const dossierDemande = route.match(/^\/suivi\/dossiers\/(\d+)$/);
  if (dossierDemande) {
    const trouve = dossier(Number(dossierDemande[1]));
    return trouve ? attendre(trouve) : null;
  }

  // ------------------------------------------------------------------
  //  Gouvernance — decisions, seances, disponibilites
  // ------------------------------------------------------------------
  if (route === "/gouvernance/tableau-de-bord") {
    const decisions = decisionsListe();
    const seances = seancesListe();

    const enRetard = decisions.filter((d) => d.etat === "En retard");
    const enSouffrance = seances.filter((s) => s.depot !== "Déposé");
    const sansInterim = DISPONIBILITES_DEMO.filter((d) => d.enCours && d.interimaire === null);

    const instances = [...new Set(decisions.map((d) => d.instance))];

    return attendre({
      compteurs: [
        {
          libelle: "Décisions hors délai",
          valeur: enRetard.length,
          note: enRetard.length > 0 ? "à relancer aujourd'hui" : "aucune en retard",
          feu: enRetard.length > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Comptes rendus manquants",
          valeur: enSouffrance.length,
          note: enSouffrance.length > 0 ? "séances non documentées" : "tout est déposé",
          feu: enSouffrance.length > 1 ? "rouge" : enSouffrance.length > 0 ? "orange" : "vert",
        },
        {
          libelle: "Absences sans intérim",
          valeur: sansInterim.length,
          note: sansInterim.length > 0 ? "structures sans suppléance" : "toutes couvertes",
          feu: sansInterim.length > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Décisions exécutées",
          valeur: decisions.filter((d) => d.etat === "Exécutée").length,
          note: "closes sur la période",
          feu: "vert",
        },
      ],
      // Les plus critiques d'abord : en retard, puis les plus relancees.
      aRelancer: decisions
        .filter((d) => d.etat === "En retard" || d.relances > 0)
        .sort((a, b) => (b.etat === "En retard" ? 1 : 0) - (a.etat === "En retard" ? 1 : 0) || b.relances - a.relances),
      depotsEnSouffrance: enSouffrance,
      absencesSansInterim: sansInterim,
      parInstance: instances.map((instance) => ({
        instance,
        total: decisions.filter((d) => d.instance === instance).length,
        enRetard: decisions.filter((d) => d.instance === instance && d.etat === "En retard").length,
      })),
    });
  }

  if (route === "/gouvernance/decisions") {
    const instance = parametres.get("instance") ?? "Toutes";
    const etat = parametres.get("etat") ?? "Tous";

    let lignes = decisionsListe();
    if (instance !== "Toutes") lignes = lignes.filter((d) => d.instance === instance);
    if (etat !== "Tous") lignes = lignes.filter((d) => d.etat === etat);

    const toutes = decisionsListe();
    const enRetard = toutes.filter((d) => d.etat === "En retard").length;
    const relancees = toutes.filter((d) => d.relances > 0).length;

    return attendre({
      decisions: lignes,
      total: toutes.length,
      compteurs: [
        {
          libelle: "Décisions suivies",
          valeur: toutes.filter((d) => d.etat !== "Exécutée").length,
          note: "en cours d'exécution",
          feu: "inconnu",
        },
        { libelle: "Hors délai", valeur: enRetard, note: "échéance dépassée", feu: enRetard > 0 ? "rouge" : "vert" },
        { libelle: "Relancées", valeur: relancees, note: "au moins une relance", feu: relancees > 1 ? "orange" : "vert" },
        {
          libelle: "Exécutées",
          valeur: toutes.filter((d) => d.etat === "Exécutée").length,
          note: "closes sur la période",
          feu: "vert",
        },
      ],
    });
  }

  const decisionDemandee = route.match(/^\/gouvernance\/decisions\/(\d+)$/);
  if (decisionDemandee) {
    const trouvee = DECISIONS_DEMO.find((d) => d.id === Number(decisionDemandee[1]));
    return trouvee ? attendre(trouvee) : null;
  }

  if (route === "/gouvernance/seances") {
    const type = parametres.get("type") ?? "Toutes";
    const toutes = seancesListe();
    const lignes = type === "Toutes" ? toutes : toutes.filter((s) => s.type === type);
    const horsDelai = toutes.filter((s) => s.depot === "Hors délai").length;
    const attendus = toutes.filter((s) => s.depot === "En attente").length;

    return attendre({
      seances: lignes,
      total: toutes.length,
      compteurs: [
        { libelle: "Séances et rapports", valeur: toutes.length, note: "sur la période", feu: "inconnu" },
        {
          libelle: "Comptes rendus attendus",
          valeur: attendus,
          note: "délai non encore échu",
          feu: attendus > 0 ? "orange" : "vert",
        },
        {
          libelle: "Hors délai",
          valeur: horsDelai,
          note: "dépôt après échéance",
          feu: horsDelai > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Décisions issues",
          valeur: toutes.reduce((somme, s) => somme + s.decisionsIssues, 0),
          note: "à suivre jusqu'à clôture",
          feu: "inconnu",
        },
      ],
    });
  }

  const seanceDemandee = route.match(/^\/gouvernance\/seances\/(\d+)$/);
  if (seanceDemandee) {
    const trouvee = SEANCES_DEMO.find((s) => s.id === Number(seanceDemandee[1]));
    return trouvee ? attendre(trouvee) : null;
  }

  if (route === "/gouvernance/disponibilites") {
    const filtre = parametres.get("filtre") ?? "Toutes";
    let lignes = DISPONIBILITES_DEMO;
    if (filtre === "En cours") lignes = lignes.filter((d) => d.enCours);
    else if (filtre === "Sans intérim") lignes = lignes.filter((d) => d.interimaire === null);
    else if (filtre !== "Toutes") lignes = lignes.filter((d) => d.type === filtre);

    const sansInterim = DISPONIBILITES_DEMO.filter((d) => d.enCours && d.interimaire === null).length;

    return attendre({
      disponibilites: lignes,
      sansInterim,
      compteurs: [
        {
          libelle: "Absences en cours",
          valeur: DISPONIBILITES_DEMO.filter((d) => d.enCours).length,
          note: "à la date du jour",
          feu: "inconnu",
        },
        {
          libelle: "Sans intérimaire",
          valeur: sansInterim,
          note: "structure sans suppléance",
          feu: sansInterim > 0 ? "rouge" : "vert",
        },
        {
          libelle: "À venir",
          valeur: DISPONIBILITES_DEMO.filter((d) => !d.enCours).length,
          note: "déclarées, non commencées",
          feu: "vert",
        },
        {
          libelle: "Jours cumulés",
          valeur: DISPONIBILITES_DEMO.reduce((somme, d) => somme + d.jours, 0),
          note: "sur les absences déclarées",
          feu: "inconnu",
        },
      ],
    });
  }

  // ------------------------------------------------------------------
  //  Portail externe — l'usager ne voit que ce qui le concerne
  // ------------------------------------------------------------------
  if (route === "/portail/demandes") {
    return attendre({
      identite: compteActifDemo()?.utilisateur.nomComplet ?? "Déposant",
      demandes: DEMANDES_PORTAIL_DEMO.map((d) => ({
        id: d.id,
        reference: d.reference,
        objet: d.objet,
        type: d.type,
        deposeeLe: d.deposeeLe,
        reponseAttendueLe: d.reponseAttendueLe,
        etat: d.etat,
        actionAttendue: d.actionAttendue,
        serviceInstructeur: d.serviceInstructeur,
      })),
    });
  }

  const demandePortail = route.match(/^\/portail\/demandes\/(\d+)$/);
  if (demandePortail) {
    const trouvee = DEMANDES_PORTAIL_DEMO.find((d) => d.id === Number(demandePortail[1]));
    return trouvee ? attendre(trouvee) : null;
  }

  if (route === "/portail/echanges") {
    return attendre({ echanges: ECHANGES_DEMO });
  }

  if (route === "/portail/preferences") {
    return attendre(PREFERENCES_DEMO);
  }

  if (route === "/courriers/import") {
    /*
     * File de qualification. Les trois cas qui doivent apparaitre : un message
     * dont la nature est deduite avec certitude, un doublon detecte, et un
     * message sous le seuil de confiance de RF-IA-04 — celui-la ne peut pas
     * etre qualifie automatiquement.
     */
    const messages = [
      { id: 1, objet: "Demande d'autorisation d'accès au terminal — société Camrail", expediteur: "contact@camrail.cm", recuLe: "2026-08-06T08:12:00", pieces: 2, naturePresumee: "Demande", confiance: 92, etat: "À qualifier" as const, motif: null, traitePar: null },
      { id: 2, objet: "Transmission du rapport trimestriel de la tutelle", expediteur: "sg@mintransports.cm", recuLe: "2026-08-06T07:48:00", pieces: 1, naturePresumee: "Transmission", confiance: 88, etat: "À qualifier" as const, motif: null, traitePar: null },
      { id: 3, objet: "RE: RE: TR: suivi du dossier", expediteur: "j.mbappe@sotrans.cm", recuLe: "2026-08-06T07:20:00", pieces: 0, naturePresumee: null, confiance: 34, etat: "À qualifier" as const, motif: "Sous le seuil de confiance : qualification manuelle obligatoire", traitePar: null },
      { id: 4, objet: "Demande d'autorisation d'accès au terminal — société Camrail", expediteur: "contact@camrail.cm", recuLe: "2026-08-06T08:14:00", pieces: 2, naturePresumee: "Demande", confiance: 92, etat: "Doublon" as const, motif: "Identique au message reçu à 08:12", traitePar: null },
      { id: 5, objet: "Réclamation sur la facturation des redevances", expediteur: "compta@sotrans.cm", recuLe: "2026-08-05T16:30:00", pieces: 3, naturePresumee: "Réclamation", confiance: 95, etat: "Qualifié" as const, motif: null, traitePar: "K. Traoré" },
      { id: 6, objet: "Newsletter — Association des ports d'Afrique centrale", expediteur: "info@agpaoc.org", recuLe: "2026-08-05T11:02:00", pieces: 0, naturePresumee: null, confiance: 12, etat: "Écarté" as const, motif: "Message de diffusion, sans objet administratif", traitePar: "K. Traoré" },
    ];

    const aQualifier = messages.filter((m) => m.etat === "À qualifier").length;
    const sousSeuil = messages.filter((m) => m.confiance !== null && m.confiance < 60).length;
    const doublons = messages.filter((m) => m.etat === "Doublon").length;

    return attendre({
      boite: "courrier@pad.cm",
      dernierReleve: "2026-08-06T09:30:00",
      messages,
      compteurs: [
        {
          libelle: "À qualifier",
          valeur: aQualifier,
          note: aQualifier > 0 ? "en attente de contrôle" : "file vide",
          feu: aQualifier > 3 ? "orange" : "vert",
        },
        {
          libelle: "Sous le seuil de confiance",
          valeur: sousSeuil,
          note: "qualification manuelle obligatoire",
          feu: sousSeuil > 0 ? "orange" : "vert",
        },
        {
          libelle: "Doublons détectés",
          valeur: doublons,
          note: doublons > 0 ? "à écarter après contrôle" : "aucun",
          feu: doublons > 0 ? "orange" : "vert",
        },
        {
          libelle: "Qualifiés ce jour",
          valeur: messages.filter((m) => m.etat === "Qualifié").length,
          note: "entrés au registre",
          feu: "vert",
        },
      ],
    });
  }

  // ------------------------------------------------------------------
  //  Supervision technique — plateforme et integrations
  // ------------------------------------------------------------------
  if (route === "/supervision") {
    const CIBLE_DISPONIBILITE = 99.5;
    const CIBLE_REPRISE_MINUTES = 240;

    const disponibilite =
      Math.round(
        (SERVICES_DEMO.reduce((somme, s) => somme + s.disponibilite, 0) / SERVICES_DEMO.length) * 10,
      ) / 10;

    const ouverts = INCIDENTS_DEMO.filter((i) => i.fin === null);
    const lents = PERFORMANCES_DEMO.filter((p) => p.p95Ms > 2000);
    const degrades = SERVICES_DEMO.filter((s) => s.etat !== "Opérationnel");

    // Le dernier incident majeur sert de test grandeur nature du plan de
    // reprise : sa duree se compare au RTO contractuel.
    const dernierMajeur = INCIDENTS_DEMO.find((i) => i.gravite === "Majeur" && i.fin !== null);

    return attendre({
      disponibilite30j: disponibilite,
      cibleDisponibilite: CIBLE_DISPONIBILITE,
      services: SERVICES_DEMO,
      incidents: INCIDENTS_DEMO,
      performances: PERFORMANCES_DEMO,
      pra: {
        dernierTest: dernierMajeur?.debut.slice(0, 10) ?? null,
        dureeRepriseMinutes: dernierMajeur?.dureeMinutes ?? null,
        cibleMinutes: CIBLE_REPRISE_MINUTES,
        feu:
          dernierMajeur?.dureeMinutes === undefined || dernierMajeur?.dureeMinutes === null
            ? "inconnu"
            : dernierMajeur.dureeMinutes <= CIBLE_REPRISE_MINUTES
              ? "vert"
              : "rouge",
      },
      compteurs: [
        {
          libelle: "Disponibilité sur 30 jours",
          valeur: `${disponibilite} %`,
          note: `engagement : ${CIBLE_DISPONIBILITE} %`,
          feu: disponibilite >= CIBLE_DISPONIBILITE ? "vert" : "rouge",
        },
        {
          libelle: "Services dégradés",
          valeur: String(degrades.length),
          note: degrades.length > 0 ? degrades.map((s) => s.nom).join(", ") : "aucun",
          feu: degrades.length > 0 ? "orange" : "vert",
        },
        {
          libelle: "Incidents ouverts",
          valeur: String(ouverts.length),
          note: ouverts.length > 0 ? "en cours de traitement" : "aucun",
          feu: ouverts.length > 0 ? "orange" : "vert",
        },
        {
          libelle: "Écrans au-delà de 2 s",
          valeur: String(lents.length),
          note: lents.length > 0 ? "95ᵉ centile hors engagement" : "tous conformes",
          feu: lents.length > 0 ? "rouge" : "vert",
        },
      ],
    });
  }

  if (route === "/supervision/integrations") {
    // Annotes en `number` : sans cela TypeScript deduit le type litteral et
    // considere `COMPTES_LOCAUX === 0` comme une comparaison impossible.
    const COMPTES_ANNUAIRE: number = 1284;
    const COMPTES_LOCAUX: number = 37;
    const CONNEXIONS_SSO: number = 2140;
    const CONNEXIONS_LOCALES: number = 96;

    const enDefaut = INTEGRATIONS_DEMO.filter(
      (i) => i.etat === "Dégradé" || i.etat === "Non connecté",
    );
    const erreurs = INTEGRATIONS_DEMO.reduce((somme, i) => somme + i.erreurs24h, 0);

    return attendre({
      sso: {
        actif: true,
        fournisseur: "Annuaire d'entreprise du Port autonome",
        protocole: "LDAP over TLS",
        domaines: ["pad.cm", "dsr.pad.cm"],
        comptesAnnuaire: COMPTES_ANNUAIRE,
        comptesLocaux: COMPTES_LOCAUX,
        dernierImport: "2026-08-06T06:00:00",
        connexionsSso7j: CONNEXIONS_SSO,
        connexionsLocales7j: CONNEXIONS_LOCALES,
        // Tant qu'il reste des comptes locaux, la politique de mot de passe de
        // l'annuaire ne s'applique pas a tout le monde.
        feu: COMPTES_LOCAUX === 0 ? "vert" : COMPTES_LOCAUX > 20 ? "rouge" : "orange",
      },
      integrations: INTEGRATIONS_DEMO,
      compteurs: [
        {
          libelle: "Systèmes raccordés",
          valeur: `${INTEGRATIONS_DEMO.filter((i) => i.etat === "Connecté").length} / ${INTEGRATIONS_DEMO.length}`,
          note: "connecteurs opérationnels",
          feu: enDefaut.length > 1 ? "rouge" : enDefaut.length > 0 ? "orange" : "vert",
        },
        {
          libelle: "Comptes hors annuaire",
          valeur: String(COMPTES_LOCAUX),
          note: "mot de passe applicatif local",
          feu: COMPTES_LOCAUX > 20 ? "rouge" : COMPTES_LOCAUX > 0 ? "orange" : "vert",
        },
        {
          libelle: "Connexions hors SSO",
          valeur: `${Math.round((CONNEXIONS_LOCALES / (CONNEXIONS_SSO + CONNEXIONS_LOCALES)) * 100)} %`,
          note: "sur les sept derniers jours",
          feu: "orange",
        },
        {
          libelle: "Erreurs de synchronisation",
          valeur: String(erreurs),
          note: "sur vingt-quatre heures",
          feu: erreurs > 20 ? "rouge" : erreurs > 0 ? "orange" : "vert",
        },
      ],
    });
  }

  // ------------------------------------------------------------------
  //  Suivis propres a la DSR — filiales, representations, conges
  // ------------------------------------------------------------------
  if (route === "/gouvernance/filiales") {
    const aPreparer = ORGANES_DEMO.filter(
      (o) => o.etatPreparation !== "Tenue" && o.documentsRecus < o.documentsAttendus,
    ).length;
    const enRetard = PRESCRIPTIONS_DEMO.filter((p) => p.etat === "En retard").length;

    return attendre({
      organes: ORGANES_DEMO,
      prescriptions: PRESCRIPTIONS_DEMO,
      compteurs: [
        {
          libelle: "Sessions à venir",
          valeur: ORGANES_DEMO.filter((o) => o.etatPreparation !== "Tenue").length,
          note: "organes de gestion",
          feu: "inconnu",
        },
        {
          libelle: "Dossiers incomplets",
          valeur: aPreparer,
          note: aPreparer > 0 ? "pièces manquantes" : "tous prêts",
          feu: aPreparer > 1 ? "rouge" : aPreparer > 0 ? "orange" : "vert",
        },
        {
          libelle: "Prescriptions en retard",
          valeur: enRetard,
          note: enRetard > 0 ? "échéance dépassée" : "aucune",
          feu: enRetard > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Prescriptions exécutées",
          valeur: PRESCRIPTIONS_DEMO.filter((p) => p.etat === "Exécutée").length,
          note: `sur ${PRESCRIPTIONS_DEMO.length} suivies`,
          feu: "vert",
        },
      ],
    });
  }

  if (route === "/gouvernance/representations") {
    const jour = aujourdhui();
    const expires = REPRESENTATIONS_DEMO.filter((r) => r.mandatAu < jour).length;
    const enRetard = RECOMMANDATIONS_DEMO.filter((r) => r.etat === "En retard").length;
    const assiduiteMoyenne = Math.round(
      REPRESENTATIONS_DEMO.reduce((somme, r) => somme + r.tauxParticipation, 0) /
        REPRESENTATIONS_DEMO.length,
    );

    return attendre({
      representations: REPRESENTATIONS_DEMO,
      recommandations: RECOMMANDATIONS_DEMO,
      compteurs: [
        {
          libelle: "Mandats en cours",
          valeur: REPRESENTATIONS_DEMO.length - expires,
          note: `sur ${REPRESENTATIONS_DEMO.length} organisations`,
          feu: "inconnu",
        },
        {
          libelle: "Mandats expirés",
          valeur: expires,
          note: expires > 0 ? "à renouveler sans délai" : "aucun",
          feu: expires > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Assiduité moyenne",
          valeur: assiduiteMoyenne,
          note: "participation aux séances",
          feu: assiduiteMoyenne >= 85 ? "vert" : assiduiteMoyenne >= 60 ? "orange" : "rouge",
        },
        {
          libelle: "Recommandations en retard",
          valeur: enRetard,
          note: enRetard > 0 ? "engagements non tenus" : "aucune",
          feu: enRetard > 0 ? "rouge" : "vert",
        },
      ],
    });
  }

  if (route === "/gouvernance/conges") {
    const annee = Number(parametres.get("annee") ?? 2026);

    /*
     * Conflits : deux responsables d'une meme structure absents en meme temps.
     *
     * C'est la seule information que ce planning apporte et que le registre de
     * disponibilite ne donne pas — celui-ci enregistre des absences deja
     * decidees, une par une.
     */
    const conflits: { periode: string; structure: string; responsables: string[] }[] = [];
    for (const ligne of CONGES_DEMO) {
      for (const periode of ligne.periodes) {
        const concurrents = CONGES_DEMO.filter(
          (autre) =>
            autre.id !== ligne.id &&
            autre.structure === ligne.structure &&
            autre.periodes.some((p) => p.du <= periode.au && p.au >= periode.du),
        );

        if (concurrents.length > 0) {
          const responsables = [ligne.responsable, ...concurrents.map((c) => c.responsable)].sort();
          const deja = conflits.some(
            (c) => c.structure === ligne.structure && c.responsables.join() === responsables.join(),
          );
          if (!deja) {
            conflits.push({
              periode: `${periode.du} → ${periode.au}`,
              structure: ligne.structure,
              responsables,
            });
          }
        }
      }
    }

    const sansConge = CONGES_DEMO.filter((l) => l.planifies === 0).length;

    return attendre({
      annee,
      lignes: CONGES_DEMO,
      conflits,
      compteurs: [
        {
          libelle: "Responsables suivis",
          valeur: CONGES_DEMO.length,
          note: "directeurs et cabinet",
          feu: "inconnu",
        },
        {
          libelle: "Chevauchements",
          valeur: conflits.length,
          note: conflits.length > 0 ? "même structure, même période" : "aucun",
          feu: conflits.length > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Sans congé planifié",
          valeur: sansConge,
          note: sansConge > 0 ? "aucune période posée" : "tous ont planifié",
          feu: sansConge > 0 ? "orange" : "vert",
        },
        {
          libelle: "Jours restant à poser",
          valeur: CONGES_DEMO.reduce((somme, l) => somme + l.solde, 0),
          note: "cumulés sur l'exercice",
          feu: "inconnu",
        },
      ],
    });
  }

  // ------------------------------------------------------------------
  //  Projets et dossiers — instruction des demandes administratives
  // ------------------------------------------------------------------
  if (route === "/dossiers") {
    const etape = parametres.get("etape") ?? "Toutes";
    const etat = parametres.get("etat") ?? "Tous";

    const toutes = DOSSIERS_DEMO.map(dossierListe);
    let lignes = toutes;
    if (etape !== "Toutes") lignes = lignes.filter((d) => d.etape === etape);
    if (etat !== "Tous") lignes = lignes.filter((d) => d.etat === etat);

    const horsDelai = toutes.filter((d) => d.etat === "Hors délai").length;
    const enAttente = toutes.filter((d) => d.etat === "En attente de complément").length;
    const retournes = toutes.filter((d) => d.etat === "Retourné").length;

    return attendre({
      dossiers: lignes,
      total: toutes.length,
      compteurs: [
        {
          libelle: "Dossiers en cours",
          valeur: toutes.filter((d) => d.etat !== "Clos").length,
          note: "toutes étapes confondues",
          feu: "inconnu",
        },
        {
          libelle: "Hors délai",
          valeur: horsDelai,
          note: horsDelai > 0 ? "échéance dépassée" : "aucun",
          feu: horsDelai > 0 ? "rouge" : "vert",
        },
        {
          libelle: "En attente de complément",
          valeur: enAttente,
          note: enAttente > 0 ? "le demandeur n'a pas répondu" : "aucun",
          feu: enAttente > 0 ? "orange" : "vert",
        },
        {
          libelle: "Retournés",
          valeur: retournes,
          note: retournes > 0 ? "renvoyés à l'instruction" : "aucun",
          feu: retournes > 0 ? "orange" : "vert",
        },
      ],
    });
  }

  if (route === "/dossiers/modeles") {
    return attendre({ modeles: MODELES_DEMO });
  }

  const dossierFiche = route.match(/^\/dossiers\/(\d+)$/);
  if (dossierFiche) {
    const trouve = DOSSIERS_DEMO.find((d) => d.id === Number(dossierFiche[1]));
    return trouve ? attendre(trouve) : null;
  }

  // ------------------------------------------------------------------
  //  Archivage — referentiel de conservation, versements, conformite
  // ------------------------------------------------------------------
  if (route === "/archivage/referentiel") {
    const enAttente = REGLES_DEMO.filter((r) => r.actif && r.valideePar === null).length;
    const actives = REGLES_DEMO.filter((r) => r.actif);

    return attendre({
      regles: REGLES_DEMO,
      enAttenteValidation: enAttente,
      compteurs: [
        { libelle: "Règles actives", valeur: actives.length, note: "au référentiel", feu: "inconnu" },
        {
          libelle: "En attente de visa",
          valeur: enAttente,
          note: enAttente > 0 ? "non opposables" : "toutes validées",
          feu: enAttente > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Conservation définitive",
          valeur: actives.filter((r) => r.sortFinal === "Conservation définitive").length,
          note: "typologies à valeur historique",
          feu: "vert",
        },
        {
          libelle: "Dossiers couverts",
          valeur: REGLES_DEMO.reduce((somme, r) => somme + r.dossiersConcernes, 0),
          note: "toutes typologies",
          feu: "inconnu",
        },
      ],
    });
  }

  if (route === "/archivage/versements") {
    const filtre = parametres.get("filtre") ?? "Tous";
    let lignes = VERSEMENTS_DEMO.map(versementListe);
    if (filtre === "Échéance dépassée")
      lignes = lignes.filter((v) => v.echeanceSortFinal < aujourdhui() && v.etat !== "Versé");
    else if (filtre !== "Tous") lignes = lignes.filter((v) => v.etat === filtre);

    const aVerser = VERSEMENTS_DEMO.filter((v) => v.etat === "À verser").length;
    const anomalies = VERSEMENTS_DEMO.filter((v) => v.etat === "Anomalie").length;
    const depassees = VERSEMENTS_DEMO.filter(
      (v) => v.echeanceSortFinal < aujourdhui() && v.etat !== "Versé",
    ).length;

    return attendre({
      versements: lignes,
      compteurs: [
        { libelle: "À verser", valeur: aVerser, note: "dossiers clos en attente", feu: aVerser > 0 ? "orange" : "vert" },
        {
          libelle: "En anomalie",
          valeur: anomalies,
          note: anomalies > 0 ? "versement bloqué" : "aucune",
          feu: anomalies > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Échéance dépassée",
          valeur: depassees,
          note: depassees > 0 ? "sort final non appliqué" : "aucune",
          feu: depassees > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Versés",
          valeur: VERSEMENTS_DEMO.filter((v) => v.etat === "Versé").length,
          note: "au système d'archivage",
          feu: "vert",
        },
      ],
    });
  }

  const versementFiche = route.match(/^\/archivage\/versements\/(\d+)$/);
  if (versementFiche) {
    const trouve = VERSEMENTS_DEMO.find((v) => v.id === Number(versementFiche[1]));
    return trouve ? attendre(trouve) : null;
  }

  if (route === "/archivage/conformite") {
    const jour = aujourdhui();
    const depassees = VERSEMENTS_DEMO.filter(
      (v) => v.echeanceSortFinal < jour && v.etat !== "Versé",
    ).map(versementListe);

    const typologiesSansRegle = [
      ...new Set(
        VERSEMENTS_DEMO.filter((v) => {
          const regle = REGLES_DEMO.find((r) => r.typologie === v.typologie);
          return !regle || regle.valideePar === null;
        }).map((v) => v.typologie),
      ),
    ];

    const conformes = VERSEMENTS_DEMO.filter(
      (v) => v.anomalies.length === 0 && v.echeanceSortFinal >= jour,
    ).length;
    const taux = Math.round((conformes / VERSEMENTS_DEMO.length) * 100);

    return attendre({
      tauxConformite: taux,
      echeancesDepassees: depassees,
      typologiesSansRegle,
      compteurs: [
        {
          libelle: "Taux de conformité",
          valeur: taux,
          note: "dossiers sans anomalie ni retard",
          feu: taux >= 85 ? "vert" : taux >= 60 ? "orange" : "rouge",
        },
        {
          libelle: "Échéances dépassées",
          valeur: depassees.length,
          note: depassees.length > 0 ? "sort final non appliqué" : "aucune",
          feu: depassees.length > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Typologies sans règle validée",
          valeur: typologiesSansRegle.length,
          note: typologiesSansRegle.length > 0 ? "conservation non opposable" : "toutes couvertes",
          feu: typologiesSansRegle.length > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Dossiers contrôlés",
          valeur: VERSEMENTS_DEMO.length,
          note: "sur la période",
          feu: "inconnu",
        },
      ],
    });
  }

  // ------------------------------------------------------------------
  //  Vue d'ensemble de la Direction generale
  //
  //  Une seule route, un seul lecteur. Les series mensuelles sont figees :
  //  elles viendront de l'entrepot de donnees, qui agrege ce que les ecrans
  //  de saisie produisent au fil de l'annee. Les repartitions, en revanche,
  //  se calculent sur les jeux existants — sans quoi le camembert
  //  contredirait le registre affiche deux ecrans plus loin.
  // ------------------------------------------------------------------
  if (route === "/direction/vue-ensemble") {
    const lignes = classement();
    const decisions = decisionsListe();
    const activites = activitesListe();
    const suivies = activites.filter((a) => a.etat !== "Réalisée" && a.etat !== "Suspendue");
    const execution =
      suivies.length === 0
        ? 0
        : Math.round(suivies.reduce((somme, a) => somme + a.avancement, 0) / suivies.length);
    const enRetard = decisions.filter((d) => d.etat === "En retard").length;
    const aRisque = lignes.filter((l) => l.feu === "rouge").length;

    const cinqPremiers = <T>(elements: T[], mesure: (element: T) => number) =>
      [...elements].sort((a, b) => mesure(b) - mesure(a)).slice(0, 5);

    return attendre({
      institution: "Port autonome — ensemble des structures",
      actualiseLe: "2026-08-06T16:41:00",
      exercice: "2026",
      reperes: [
        { libelle: "Courriers enregistrés", valeur: "8 942", note: "depuis le 1er janvier" },
        { libelle: "Exécution des activités", valeur: `${execution} %`, note: "moyenne des plans d'actions" },
        { libelle: "Respect des délais", valeur: "68 %", note: "cible 80 %" },
        { libelle: "Délai moyen de traitement", valeur: "3,4 j", note: "toutes structures" },
        { libelle: "Décisions suivies", valeur: String(decisions.length), note: `dont ${enRetard} hors délai` },
        { libelle: "Structures à risque", valeur: String(aRisque), note: "score global sous 60" },
        // La derniere case reste vide tant que la source n'existe pas. Un
        // tiret le dit ; une valeur inventee le cacherait.
        { libelle: "Dématérialisation du courrier", valeur: "—", note: null },
      ],
      ecartExecution: [
        { mois: "janv.", valeur: 1.4 },
        { mois: "févr.", valeur: 0.9 },
        { mois: "mars", valeur: 1.6 },
        { mois: "avr.", valeur: 0.3 },
        { mois: "mai", valeur: -1.1 },
        { mois: "juin", valeur: 0.8 },
        { mois: "juil.", valeur: 1.9 },
      ],
      chargeParStructure: cinqPremiers(STRUCTURES_DEMO, (s) => s.courriersEnCours).map((s) => ({
        libelle: s.libelle,
        valeur: s.courriersEnCours,
      })),
      volumeParCorrespondant: cinqPremiers(CORRESPONDANTS_DEMO, (c) => c.nombreCourriers).map(
        (c) => ({ libelle: c.libelle, valeur: c.nombreCourriers }),
      ),
      respectDelais: [
        { mois: "janv.", valeur: 61 },
        { mois: "févr.", valeur: 63 },
        { mois: "mars", valeur: 62 },
        { mois: "avr.", valeur: 66 },
        { mois: "mai", valeur: 68 },
        { mois: "juin", valeur: 71 },
        { mois: "juil.", valeur: 74 },
      ],
      decisionsExecutees: [
        { mois: "janv.", valeur: 4 },
        { mois: "févr.", valeur: 7 },
        { mois: "mars", valeur: 5 },
        { mois: "avr.", valeur: 9 },
        { mois: "mai", valeur: 6 },
        { mois: "juin", valeur: 11 },
        { mois: "juil.", valeur: 8 },
      ],
      // Le point le plus contraint borne l'acces au port : c'est celui-la que
      // le Directeur general doit voir, pas la moyenne des quatre.
      chenal: (() => {
        const critique = [...RELEVES_CHENAL_DEMO].sort((a, b) => a.ecart - b.ecart)[0];
        if (!critique) return null;
        return {
          point: critique.point,
          cote: critique.cote,
          garantie: critique.garantie,
          ecart: critique.ecart,
          feu: critique.feu,
          releveLe: critique.releveLe,
          evolution: EVOLUTION_CHENAL_DEMO,
        };
      })(),
      recouvrements: (() => {
        const emis = RECOUVREMENTS_DEMO.reduce((total, l) => total + l.emis, 0);
        const recouvre = RECOUVREMENTS_DEMO.reduce((total, l) => total + l.recouvre, 0);
        return {
          periode: "Juillet 2026",
          tauxGlobal: emis === 0 ? 0 : Math.round((recouvre / emis) * 1000) / 10,
          totalRecouvre: recouvre,
          totalExploitation: RECOUVREMENTS_DEMO.filter((l) => l.sourceStructure === "DEX").reduce(
            (total, l) => total + l.recouvre,
            0,
          ),
          totalAutresRecettes: RECOUVREMENTS_DEMO.filter((l) => l.sourceStructure === "DFC").reduce(
            (total, l) => total + l.recouvre,
            0,
          ),
          parSecteur: RECOUVREMENTS_DEMO.map((l) => ({ libelle: l.secteurCode, valeur: l.taux })),
        };
      })(),
    });
  }

  // ------------------------------------------------------------------
  //  Exploitation — la cote du chenal et les recouvrements.
  //
  //  C'est ici que la regle de visibilite s'applique, et elle s'applique au
  //  serveur : les blocs qu'une session n'a pas a connaitre ne sont pas
  //  envoyes, plutot que masques a l'affichage. La Regie du dragage ne recoit
  //  aucun montant, la Direction de l'exploitation aucune profondeur.
  //
  //  EXP_LEC est la consolidation : elle ouvre les deux blocs sans ouvrir la
  //  saisie. Le Directeur general lit tout et ne saisit rien.
  // ------------------------------------------------------------------
  if (route.startsWith("/exploitation/releves")) {
    const compte = compteActifDemo()?.utilisateur;
    const sigle = (compte?.structureLibelle ?? "").split(" — ")[0];
    const permissions = compte?.permissions ?? [];

    const consolide = permissions.includes(PERMISSIONS.EXP_LEC);
    const saisit = permissions.includes(PERMISSIONS.EXP_SAI);

    // Qui tient quoi. La DDLM repond du chenal, la Regie le releve ; la
    // Direction de l'exploitation constate les recettes du port, celle des
    // finances les autres recettes.
    const tientChenal = sigle === "DDLM" || sigle === "RDD";
    const tientRecettes = sigle === "DEX" || sigle === "DFC";

    const critique = [...RELEVES_CHENAL_DEMO].sort((a, b) => a.ecart - b.ecart)[0];

    const chenal =
      consolide || tientChenal
        ? {
            releves: RELEVES_CHENAL_DEMO,
            // Le point critique n'est signale que s'il est reellement sous sa
            // garantie : au-dessus, le plus juste des points reste conforme et
            // n'appelle aucune alerte.
            pointCritique: critique && critique.ecart < 0 ? critique.point : null,
            coteCritique: critique && critique.ecart < 0 ? Math.abs(critique.ecart) : null,
            evolution: EVOLUTION_CHENAL_DEMO,
            dernierReleveLe: RELEVES_CHENAL_DEMO.reduce<string | null>(
              (recent, r) => (recent === null || r.releveLe > recent ? r.releveLe : recent),
              null,
            ),
          }
        : null;

    // La Direction de l'exploitation ne voit que ses secteurs, celle des
    // finances que les siens. Le Directeur general voit les deux, et c'est
    // precisement la coupure qu'il a demandee.
    const lignes = consolide
      ? RECOUVREMENTS_DEMO
      : RECOUVREMENTS_DEMO.filter((l) => l.sourceStructure === sigle);

    const somme = (choix: (l: (typeof RECOUVREMENTS_DEMO)[number]) => number) =>
      lignes.reduce((total, l) => total + choix(l), 0);
    const totalEmis = somme((l) => l.emis);
    const totalRecouvre = somme((l) => l.recouvre);

    const recouvrements =
      consolide || tientRecettes
        ? {
            periode: "Juillet 2026",
            lignes,
            totalEmis,
            totalRecouvre,
            tauxGlobal: totalEmis === 0 ? 0 : Math.round((totalRecouvre / totalEmis) * 1000) / 10,
            totalExploitation: lignes
              .filter((l) => l.sourceStructure === "DEX")
              .reduce((total, l) => total + l.recouvre, 0),
            totalAutresRecettes: lignes
              .filter((l) => l.sourceStructure === "DFC")
              .reduce((total, l) => total + l.recouvre, 0),
            evolution: EVOLUTION_RECOUVREMENT_DEMO,
          }
        : null;

    return attendre({
      chenal,
      recouvrements,
      peutSaisirChenal: saisit && tientChenal,
      peutSaisirRecouvrements: saisit && tientRecettes,
      periodes: PERIODES_EXPLOITATION,
    });
  }

  // ------------------------------------------------------------------
  //  Vue d'ensemble du Comite de direction — le conseil des directeurs.
  //
  //  Le Comite est une instance, pas un poste : la page porte donc sur
  //  l'ensemble des directions, jamais sur celle du membre connecte. Son sigle
  //  ne sert plus qu'a lui signaler ou tombe sa propre direction dans le
  //  classement.
  // ------------------------------------------------------------------
  if (route === "/comite/vue-ensemble") {
    const compte = compteActifDemo()?.utilisateur;
    const sigleMembre = (compte?.structureLibelle ?? "").split(" — ")[0] || null;

    const lignes = classement();
    const decisions = decisionsListe();
    const activites = activitesListe();

    const moyenne =
      lignes.length === 0
        ? 0
        : Math.round(lignes.reduce((somme, l) => somme + l.scoreGlobal, 0) / lignes.length);

    // Les decisions du Comite, et d'elles seules : le registre entier melerait
    // celles du Conseil d'administration et du Directeur general, dont le
    // Comite ne repond pas.
    const siennes = decisions.filter((d) => d.instance === "CODIR");
    const enRetardDecisions = siennes.filter((d) => d.etat === "En retard").length;

    const execution =
      activites.length === 0
        ? 0
        : Math.round(activites.reduce((somme, a) => somme + a.avancement, 0) / activites.length);

    const aRisque = lignes.filter((l) => l.feu === "rouge").length;
    const courriers = lignes.reduce(
      (total, l) => total + (STRUCTURES_DEMO.find((s) => s.sigle === l.structureSigle)?.courriersEnCours ?? 0),
      0,
    );

    /** Repartition d'une liste par etat, les etats vides ecartes. */
    const parEtat = <T extends { etat: string }>(elements: T[]) => {
      const compteurs = new Map<string, number>();
      for (const element of elements) {
        compteurs.set(element.etat, (compteurs.get(element.etat) ?? 0) + 1);
      }
      return [...compteurs.entries()]
        .map(([libelle, valeur]) => ({ libelle, valeur }))
        .sort((a, b) => b.valeur - a.valeur);
    };

    /*
     * Moyenne et dispersion se calculent sur les memes historiques, mois par
     * mois : les deux panneaux du bas racontent ainsi la meme histoire, l'un
     * par le niveau, l'autre par l'ecartement.
     */
    const historiques = lignes.map((l) => historique(l.structureSigle));
    const mois = historiques[0] ?? [];

    const evolutionScoreMoyen = mois.map((point, index) => ({
      mois: point.periode,
      valeur:
        historiques.length === 0
          ? 0
          : Math.round(
              (historiques.reduce((somme, serie) => somme + serie[index].score, 0) /
                historiques.length) *
                10,
            ) / 10,
    }));

    const dispersion = mois.map((point, index) => {
      const scores = historiques.map((serie) => serie[index].score);
      return {
        mois: point.periode,
        valeur: scores.length === 0 ? 0 : Math.max(...scores) - Math.min(...scores),
      };
    });

    const derniere = dispersion[dispersion.length - 1]?.valeur ?? 0;
    const precedente = dispersion[dispersion.length - 2]?.valeur ?? derniere;

    return attendre({
      institution: "Port autonome de Douala",
      structureSigle: sigleMembre,
      actualiseLe: "2026-08-06T16:41:00",
      exercice: "2026",
      reperes: [
        {
          libelle: "Directions notées",
          valeur: String(lignes.length),
          note: "matrice de scoring, juillet 2026",
        },
        {
          libelle: "Score moyen",
          valeur: `${moyenne} pt`,
          note: lignes.length === 0 ? null : `de ${Math.min(...lignes.map((l) => l.scoreGlobal))} à ${Math.max(...lignes.map((l) => l.scoreGlobal))} pt`,
        },
        {
          libelle: "Directions à risque",
          valeur: String(aRisque),
          note: "score global sous 60",
        },
        {
          libelle: "Dispersion du collège",
          valeur: `${derniere} pt`,
          note:
            derniere === precedente
              ? "stable depuis le mois dernier"
              : derniere > precedente
                ? `en hausse de ${derniere - precedente} pt`
                : `en baisse de ${precedente - derniere} pt`,
        },
        {
          libelle: "Décisions du Comité",
          valeur: String(siennes.length),
          note:
            enRetardDecisions > 0 ? `dont ${enRetardDecisions} hors délai` : "aucune hors délai",
        },
        {
          libelle: "Exécution des activités",
          valeur: `${execution} %`,
          note: `${activites.length} activités, toutes directions`,
        },
        {
          libelle: "Courriers en cours",
          valeur: String(courriers),
          note: "dans les directions notées",
        },
      ],
      scoreParStructure: lignes.map((l) => ({
        libelle: l.structureSigle,
        valeur: l.scoreGlobal,
      })),
      decisionsParEtat: parEtat(siennes),
      activitesParEtat: parEtat(activites),
      evolutionScoreMoyen,
      dispersion,
    });
  }

  // ------------------------------------------------------------------
  //  Cockpit executif et tableaux de bord de structure
  // ------------------------------------------------------------------
  if (route === "/pilotage/cockpit") {
    const lignes = classement();
    const decisions = decisionsListe();
    const activites = activitesListe();
    const enRetard = decisions.filter((d) => d.etat === "En retard");
    const sansInterim = DISPONIBILITES_DEMO.filter((d) => d.enCours && d.interimaire === null);
    const fragiles = lignes.filter((l) => l.feu === "rouge");
    const suivies = activites.filter((a) => a.etat !== "Réalisée" && a.etat !== "Suspendue");
    const execution =
      suivies.length === 0
        ? 0
        : Math.round(suivies.reduce((somme, a) => somme + a.avancement, 0) / suivies.length);
    /*
     * §20 : le tableau de bord du Directeur general isole les « activites
     * critiques ». Elles entrent par les alertes plutot que par un cinquieme
     * chiffre : une activite critique appelle un arbitrage, ce qui est
     * exactement l'objet du panneau d'alertes.
     */
    const critiques = activites.filter((a) => a.critique);

    return attendre({
      periode: "juillet 2026",
      executionActivites: execution,
      activitesCritiques: critiques.length,
      decisionsEnRetard: enRetard.length,
      structuresARisque: fragiles.length,
      absencesSansInterim: sansInterim.length,
      alertes: [
        ...enRetard.map((d, i) => ({
          id: 100 + i,
          criticite: "Critique" as const,
          libelle: `Décision ${d.reference} hors délai`,
          precision: `${d.relances} relance(s) sans effet · échéance ${d.echeance ?? "non fixée"}`,
          chemin: `/gouvernance/decisions/${d.id}`,
          structure: d.structures.find((st) => st.pilote)?.sigle ?? null,
        })),
        ...fragiles.map((l, i) => ({
          id: 200 + i,
          criticite: "Critique" as const,
          libelle: `${l.structureSigle} en situation critique`,
          precision: `Score de ${l.scoreGlobal} sur 100 · rang ${l.rang} sur ${lignes.length}`,
          chemin: `/performance/classement/${l.structureSigle}`,
          structure: l.structureSigle,
        })),
        ...critiques.map((a, i) => ({
          id: 250 + i,
          criticite: "Critique" as const,
          libelle: `${a.reference} — activité critique`,
          precision: `${a.avancement} % contre ${a.avancementAttendu} % attendus · ${a.structureSigle}`,
          chemin: `/activites/${a.id}`,
          structure: a.structureSigle,
        })),
        ...sansInterim.map((d, i) => ({
          id: 300 + i,
          criticite: "Élevée" as const,
          libelle: `${d.responsable} absent sans intérimaire`,
          precision: `${d.type} jusqu'au ${d.au} · ${d.structure}`,
          chemin: "/gouvernance/disponibilites",
          structure: d.structure,
        })),
        ...seancesListe()
          .filter((s) => s.depot === "Hors délai")
          .map((s, i) => ({
            id: 400 + i,
            criticite: "Modérée" as const,
            libelle: `Compte rendu manquant — ${s.intitule}`,
            precision: `Attendu le ${s.echeanceDepot} · ${s.structure}`,
            chemin: `/gouvernance/seances/${s.id}`,
            structure: s.structure,
          })),
      ],
      // Le DG suit ce qu'il a lui-meme decide, et ce que le Conseil a resolu.
      engagements: decisions
        .filter((d) => d.instance === "Directeur général" || d.instance === "Conseil d'administration")
        .map((d) => ({
          id: d.id,
          reference: d.reference,
          objet: d.objet,
          origine:
            d.instance === "Directeur général"
              ? ("Instruction du Directeur général" as const)
              : ("Résolution du Conseil d'administration" as const),
          echeance: d.echeance,
          avancement: d.avancement,
          feu: d.feu,
          enRetard: d.etat === "En retard",
        })),
      indicateurs: [
        { libelle: "Délai moyen de traitement", valeur: "6,4 j", variation: "−1,2 j", favorable: true },
        { libelle: "Respect des délais", valeur: "78 %", variation: "+4 pts", favorable: true },
        { libelle: "Dématérialisation du courrier", valeur: "41 %", variation: "+7 pts", favorable: true },
        { libelle: "Courriers traités ce mois", valeur: "2 184", variation: "+3 %", favorable: true },
        { libelle: "Décisions exécutées", valeur: `${decisions.filter((d) => d.etat === "Exécutée").length} / ${decisions.length}`, variation: null, favorable: null },
        { libelle: "Ponctualité des remontées", valeur: "83 %", variation: "−5 pts", favorable: false },
      ],
      meilleures: lignes.slice(0, 3).map((l) => ({ sigle: l.structureSigle, score: l.scoreGlobal, feu: l.feu })),
      fragiles: lignes
        .slice(-3)
        .reverse()
        .map((l) => ({ sigle: l.structureSigle, score: l.scoreGlobal, feu: l.feu })),
    });
  }

  if (route === "/pilotage/structures") {
    const compte = compteActifDemo();
    const lignes = classement();
    const accessibles =
      compte?.utilisateur.perimetre.portee === "institution"
        ? lignes.map((l) => ({ sigle: l.structureSigle, libelle: l.structureLibelle }))
        : [{ sigle: "DAF", libelle: "Direction des affaires financières" }];

    const sigle = (parametres.get("sigle") || accessibles[0]?.sigle) ?? "DAF";
    const ligne = lignes.find((l) => l.structureSigle === sigle);
    const activites = activitesListe().filter((a) => a.structureSigle === sigle);
    const enRetard = activites.filter((a) => a.etat === "En retard");
    const moyenne =
      activites.length === 0
        ? 0
        : Math.round(activites.reduce((somme, a) => somme + a.avancement, 0) / activites.length);
    const obligationsDues = OBLIGATIONS_DEMO.filter((o) => !o.depose);

    return attendre({
      structureSigle: sigle,
      structureLibelle: ligne?.structureLibelle ?? libelleStructure(sigle),
      structuresAccessibles: accessibles,
      periode: "juillet 2026",
      rang: ligne?.rang ?? null,
      totalStructures: lignes.length,
      scoreGlobal: ligne?.scoreGlobal ?? null,
      feu: ligne?.feu ?? "inconnu",
      activites: [
        {
          libelle: "Taux d'exécution",
          valeur: `${moyenne} %`,
          note: "moyenne des activités du plan",
          feu: moyenne >= 85 ? "vert" : moyenne >= 60 ? "orange" : "rouge",
        },
        {
          libelle: "Activités en retard",
          valeur: String(enRetard.length),
          note: enRetard.length > 0 ? "écart à l'attendu" : "aucune",
          feu: enRetard.length > 0 ? "rouge" : "vert",
        },
        { libelle: "Activités suivies", valeur: String(activites.length), note: "inscrites au plan", feu: "inconnu" },
      ],
      courrier: [
        { libelle: "Courriers en cours", valeur: "128", note: "affectés à la structure", feu: "inconnu" },
        { libelle: "Hors délai", valeur: "17", note: "échéance dépassée", feu: "rouge" },
        { libelle: "Délai moyen", valeur: "4,1 j", note: "sur les courriers clos", feu: "vert" },
      ],
      rituels: [
        { libelle: "Réunions tenues", valeur: "6 / 7", note: "sur l'exercice", feu: "orange" },
        {
          libelle: "Rapports déposés",
          valeur: `${OBLIGATIONS_DEMO.filter((o) => o.depose).length} / ${OBLIGATIONS_DEMO.length}`,
          note: "obligations de la structure",
          feu: obligationsDues.length > 1 ? "orange" : "vert",
        },
        { libelle: "Ponctualité", valeur: "80 %", note: "dépôts dans les délais", feu: "orange" },
      ],
      aTraiter: [
        ...enRetard.map((a) => ({
          libelle: a.intitule,
          precision: `Activité en retard de ${a.avancementAttendu - a.avancement} points`,
          feu: "rouge" as const,
          chemin: `/activites/${a.id}`,
        })),
        ...obligationsDues
          .filter((o) => o.retardJours !== null)
          .map((o) => ({
            libelle: o.intitule,
            precision: `Non déposé, ${o.retardJours} jour(s) de retard`,
            feu: "rouge" as const,
            chemin: "/activites/obligations",
          })),
        ...DISPONIBILITES_DEMO.filter((d) => d.enCours && d.interimaire === null && d.structure === sigle).map(
          (d) => ({
            libelle: `${d.responsable} absent sans intérimaire`,
            precision: `${d.type} jusqu'au ${d.au}`,
            feu: "rouge" as const,
            chemin: "/gouvernance/disponibilites",
          }),
        ),
      ],
    });
  }

  if (route === "/pilotage/analyses") {
    const lignes = classement().map((l) => {
      const note = (code: string) => l.criteres.find((c) => c.code === code)?.note ?? 0;
      const activites = note("ACT");
      const courrier = note("COU");
      const dossiers = note("DOS");
      // Le respect des delais melange courrier et dossiers : c'est la mesure
      // transversale, celle que le §3.11 nomme « respect des delais ».
      const delais = Math.round((courrier + dossiers) / 2);
      const mesures = [activites, courrier, dossiers, delais];

      return {
        sigle: l.structureSigle,
        libelle: l.structureLibelle,
        activites,
        courrier,
        dossiers,
        delais,
        feu: l.feu,
        dispersion: Math.max(...mesures) - Math.min(...mesures),
      };
    });

    const moyenne = (cle: "activites" | "courrier" | "dossiers" | "delais") =>
      Math.round(lignes.reduce((somme, l) => somme + l[cle], 0) / lignes.length);

    // Structures dont l'ecart entre la meilleure et la pire mesure depasse
    // 20 points : elles reussissent quelque part et echouent ailleurs, ce qui
    // n'est pas la meme chose qu'une structure uniformement en difficulte.
    const dispersees = lignes.filter((l) => l.dispersion > 20);
    const doubleRetard = lignes.filter((l) => l.activites < 60 && l.courrier < 60);

    return attendre({
      periode: "juillet 2026",
      lignes,
      moyennes: {
        activites: moyenne("activites"),
        courrier: moyenne("courrier"),
        dossiers: moyenne("dossiers"),
        delais: moyenne("delais"),
      },
      constats: [
        {
          texte:
            doubleRetard.length > 0
              ? `${doubleRetard.length} structure(s) sont en deçà de 60 à la fois sur les activités et sur le courrier : ${doubleRetard.map((l) => l.sigle).join(", ")}. La difficulté n'est pas propre à un pilier.`
              : "Aucune structure n'est simultanément en deçà de 60 sur les activités et sur le courrier.",
          feu: doubleRetard.length > 0 ? "rouge" : "vert",
        },
        {
          texte:
            dispersees.length > 0
              ? `${dispersees.length} structure(s) présentent plus de 20 points d'écart entre leur meilleure et leur moins bonne mesure : ${dispersees.map((l) => l.sigle).join(", ")}. Réussir quelque part et échouer ailleurs n'appelle pas la même réponse qu'une difficulté d'ensemble.`
              : "Les mesures sont homogènes au sein de chaque structure.",
          feu: dispersees.length > 0 ? "orange" : "vert",
        },
        {
          texte: `L'exécution des activités (${moyenne("activites")}) est ${
            moyenne("activites") >= moyenne("courrier") ? "supérieure" : "inférieure"
          } au traitement du courrier (${moyenne("courrier")}) en moyenne institutionnelle.`,
          feu: "inconnu",
        },
      ],
    });
  }

  if (route === "/pilotage/programme") {
    const annee = Number(parametres.get("annee") ?? 2026);

    /*
     * Les neuf indicateurs du §9 du BRD, avec leur cible contractuelle.
     *
     * Trois n'ont pas de valeur : l'IA de priorisation, l'enquete de
     * satisfaction et le taux d'adoption ne sont pas mesures a ce stade. Un
     * zero aurait fait croire a un echec ; `null` dit qu'on ne sait pas.
     */
    const indicateurs = [
      { code: "DEL-MOY", libelle: "Délai moyen de traitement d'un dossier", modeCalcul: "Jours entre l'enregistrement et la clôture", source: "BI", unite: "jours", valeurN: 6.4, valeurN1: 9.1, cible: 6.4, cibleMaximum: true, echeance: "12 mois" },
      { code: "SLA", libelle: "Taux de respect des SLA", modeCalcul: "% de tâches traitées dans le délai contractuel", source: "BI", unite: "%", valeurN: 78, valeurN1: 74, cible: 90, cibleMaximum: false, echeance: "cible permanente" },
      { code: "DEMAT", libelle: "Taux de dématérialisation du courrier", modeCalcul: "% de courriers traités sans support papier", source: "BI", unite: "%", valeurN: 41, valeurN1: 22, cible: 50, cibleMaximum: false, echeance: "18 mois" },
      { code: "DISPO", libelle: "Taux de disponibilité de la plateforme", modeCalcul: "% mesuré sur les heures ouvrées", source: "Supervision technique", unite: "%", valeurN: 99.2, valeurN1: 98.4, cible: 95, cibleMaximum: false, echeance: "cible permanente" },
      { code: "IA", libelle: "Taux d'automatisation IA exploité sans reprise", modeCalcul: "% de classifications validées sans correction humaine", source: "BI / IA", unite: "%", valeurN: null, valeurN1: null, cible: 70, cibleMaximum: false, echeance: "18 mois après mise en service" },
      { code: "ARCH", libelle: "Taux de conformité archivistique", modeCalcul: "% de dossiers clos avec sort final correctement appliqué", source: "Audit / Archives", unite: "%", valeurN: 60, valeurN1: 48, cible: 100, cibleMaximum: false, echeance: "cible permanente" },
      { code: "SAT", libelle: "Taux de satisfaction usager", modeCalcul: "Score de satisfaction sur le suivi de dossier", source: "Enquête usagers", unite: "/5", valeurN: null, valeurN1: null, cible: 4, cibleMaximum: false, echeance: "enquête non conduite" },
      { code: "SEC", libelle: "Incidents de sécurité avérés", modeCalcul: "Nombre d'incidents majeurs constatés", source: "Sécurité", unite: "incidents", valeurN: 0, valeurN1: 1, cible: 0, cibleMaximum: true, echeance: "cible permanente" },
      { code: "ADOPT", libelle: "Taux d'adoption par les agents", modeCalcul: "% d'agents actifs au quotidien", source: "RH / Conduite du changement", unite: "%", valeurN: null, valeurN1: null, cible: 95, cibleMaximum: false, echeance: "6 mois post-déploiement" },
    ];

    const avecFeu = indicateurs.map((i) => {
      if (i.valeurN === null) return { ...i, feu: "inconnu" as const };
      const atteinte = i.cibleMaximum ? i.valeurN <= i.cible : i.valeurN >= i.cible;
      if (atteinte) return { ...i, feu: "vert" as const };
      // A moins de 15 % de la cible, on considere qu'elle reste atteignable.
      const ecart = i.cibleMaximum
        ? (i.valeurN - i.cible) / Math.max(1, i.cible)
        : (i.cible - i.valeurN) / Math.max(1, i.cible);
      return { ...i, feu: ecart <= 0.15 ? ("orange" as const) : ("rouge" as const) };
    });

    const mesures = avecFeu.filter((i) => i.valeurN !== null);
    const atteints = avecFeu.filter((i) => i.feu === "vert").length;

    return attendre({
      annee,
      indicateurs: avecFeu,
      compteurs: [
        { libelle: "Indicateurs du programme", valeur: avecFeu.length, note: "au référentiel du BRD", feu: "inconnu" },
        {
          libelle: "Cibles atteintes",
          valeur: atteints,
          note: `sur ${mesures.length} mesurés`,
          feu: atteints >= mesures.length * 0.7 ? "vert" : atteints > 0 ? "orange" : "rouge",
        },
        {
          libelle: "Non mesurés",
          valeur: avecFeu.length - mesures.length,
          note: "aucune donnée disponible",
          feu: avecFeu.length - mesures.length > 0 ? "orange" : "vert",
        },
        {
          libelle: "En progression",
          valeur: mesures.filter((i) =>
            i.valeurN1 === null
              ? false
              : i.cibleMaximum
                ? i.valeurN! < i.valeurN1
                : i.valeurN! > i.valeurN1,
          ).length,
          note: "par rapport à N-1",
          feu: "vert",
        },
      ],
    });
  }

  if (route === "/pilotage/synthese") {
    const lignes = classement();
    const decisions = decisionsListe();
    const echues = decisions.filter((d) => d.echeance !== null && d.etat !== "Suspendue");
    const activites = activitesListe();
    const suivies = activites.filter((a) => a.etat !== "Réalisée" && a.etat !== "Suspendue");

    return attendre({
      instance: "Comité de direction",
      seance: "CODIR du 12 août 2026",
      dateSeance: "2026-08-12",
      producteur: "Division du suivi et de la relance",
      periode: "Juillet 2026",
      faitsMarquants: [
        "Onze directions sur douze ont tenu leur réunion de service mensuelle ; la douzième n'a pas déposé de compte rendu.",
        "Le délai moyen de traitement du courrier recule de 1,2 jour et s'établit à 6,4 jours.",
        "Deux structures passent en situation critique au regard de la grille de cotation des risques.",
        "Une instruction du Directeur général reste hors délai après trois relances.",
      ],
      executionActivites:
        suivies.length === 0
          ? 0
          : Math.round(suivies.reduce((somme, a) => somme + a.avancement, 0) / suivies.length),
      decisionsEchues: echues.length,
      decisionsExecutees: decisions.filter((d) => d.etat === "Exécutée").length,
      classement: lignes.map((l) => ({
        rang: l.rang,
        sigle: l.structureSigle,
        libelle: l.structureLibelle,
        score: l.scoreGlobal,
        feu: l.feu,
      })),
      pointsDAttention: [
        {
          titre: "Délai de transmission des courriers cotés",
          texte:
            "L'instruction DG-2026-041 du 3 août fixait un délai de 48 heures. Le diagnostic est fait, la réorganisation des tournées ne l'est pas. Trois relances sont restées sans effet.",
          feu: "rouge",
        },
        {
          titre: "Exécution du plan d'actions de la DAF",
          texte:
            "Le taux d'exécution s'établit à 34 % contre 60 % attendus à cette date. Deux tâches sur six sont réalisées, dont une hors délai.",
          feu: "rouge",
        },
        {
          titre: "Remontées incomplètes",
          texte:
            "Deux structures n'ont pas alimenté le registre de disponibilité. Elles deviennent non évaluables au sens de la grille de cotation, ce qui vaut signalement.",
          feu: "orange",
        },
      ],
    });
  }

  // ------------------------------------------------------------------
  //  Performance — matrice de scoring, dictionnaire, calendrier
  // ------------------------------------------------------------------
  if (route === "/performance/matrice") {
    const annee = Number(parametres.get("annee") ?? 2026);
    const mois = Number(parametres.get("mois") ?? 7);
    const lignes = classement();
    const critiques = lignes.filter((l) => l.feu === "rouge").length;
    const moyenne = Math.round(
      lignes.reduce((somme, l) => somme + l.scoreGlobal, 0) / lignes.length,
    );

    // Le classement ne vaut que sur un mois clos : au-dela, il est indicatif.
    const maintenant = new Date();
    const provisoire = annee === maintenant.getFullYear() && mois >= maintenant.getMonth() + 1;

    return attendre({
      periode: { granularite: "mois", annee, rang: mois },
      provisoire,
      lignes,
      moyenneInstitution: moyenne,
      compteurs: [
        { libelle: "Structures évaluées", valeur: lignes.length, note: "sur la période", feu: "inconnu" },
        {
          libelle: "En situation critique",
          valeur: critiques,
          note: critiques > 0 ? "score sous 60" : "aucune",
          feu: critiques > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Score moyen",
          valeur: moyenne,
          note: "moyenne de l'institution",
          feu: moyenne >= 85 ? "vert" : moyenne >= 60 ? "orange" : "rouge",
        },
        {
          libelle: "Au-dessus de la moyenne",
          valeur: lignes.filter((l) => l.scoreGlobal >= moyenne).length,
          note: "structures",
          feu: "vert",
        },
      ],
    });
  }

  const structureDemandee = route.match(/^\/performance\/matrice\/([A-Za-z]+)$/);
  if (structureDemandee) {
    const sigle = structureDemandee[1].toUpperCase();
    if (!existeStructure(sigle)) return null;

    const annee = Number(parametres.get("annee") ?? 2026);
    const mois = Number(parametres.get("mois") ?? 7);
    const lignes = classement();
    const ligne = lignes.find((l) => l.structureSigle === sigle)!;
    const courbe = historique(sigle);

    return attendre({
      structureSigle: sigle,
      structureLibelle: libelleStructure(sigle),
      periode: { granularite: "mois", annee, rang: mois },
      rang: ligne.rang,
      rangPrecedent: ligne.rangPrecedent,
      totalStructures: lignes.length,
      scoreGlobal: scoreGlobal(sigle),
      scorePrecedent: courbe.length > 1 ? courbe[courbe.length - 2].score : null,
      feu: ligne.feu,
      moyenneInstitution: Math.round(
        lignes.reduce((somme, l) => somme + l.scoreGlobal, 0) / lignes.length,
      ),
      criteres: criteresDe(sigle).map((critere) => ({
        ...critere,
        sousIndicateurs: sousIndicateurs(sigle, critere.code),
      })),
      historique: courbe,
    });
  }

  if (route === "/performance/dictionnaire") {
    return attendre({ indicateurs: INDICATEURS_DICTIONNAIRE, risques: GRILLE_RISQUES });
  }

  if (route === "/performance/calendrier") {
    const enDefaut = CALENDRIER_DEMO.filter((l) => l.recus < l.structuresAttendues).length;
    const manquants = CALENDRIER_DEMO.reduce(
      (somme, l) => somme + (l.structuresAttendues - l.recus),
      0,
    );

    return attendre({
      lignes: CALENDRIER_DEMO,
      compteurs: [
        { libelle: "Productions suivies", valeur: CALENDRIER_DEMO.length, note: "au calendrier", feu: "inconnu" },
        {
          libelle: "Incomplètes",
          valeur: enDefaut,
          note: enDefaut > 0 ? "au dernier cycle clos" : "aucune",
          feu: enDefaut > 2 ? "rouge" : enDefaut > 0 ? "orange" : "vert",
        },
        {
          libelle: "Remontées manquantes",
          valeur: manquants,
          note: "structures n'ayant pas alimenté",
          feu: manquants > 5 ? "rouge" : manquants > 0 ? "orange" : "vert",
        },
        {
          libelle: "Relances automatiques",
          valeur: CALENDRIER_DEMO.filter((l) => l.relanceAutomatique).length,
          note: "productions relancées d'office",
          feu: "vert",
        },
      ],
    });
  }

  // ------------------------------------------------------------------
  //  Activites — plan d'actions, execution, obligations de reporting
  // ------------------------------------------------------------------
  if (route === "/activites") {
    const structure = parametres.get("structure") ?? "Toutes";
    const etat = parametres.get("etat") ?? "Tous";

    // La criticite depend de la date du jour : elle se recalcule a la lecture,
    // sinon une echeance franchie pendant la nuit ne se verrait jamais.
    ACTIVITES_DEMO.forEach((a) => recalculerCriticite(a, aujourdhui()));

    const toutes = activitesListe();
    let lignes = toutes;
    if (structure !== "Toutes") lignes = lignes.filter((a) => a.structureSigle === structure);
    if (etat !== "Tous") lignes = lignes.filter((a) => a.etat === etat);

    const enRetard = toutes.filter((a) => a.etat === "En retard").length;
    const suivies = toutes.filter((a) => a.etat !== "Réalisée" && a.etat !== "Suspendue");
    const moyenne =
      suivies.length === 0
        ? 0
        : Math.round(suivies.reduce((somme, a) => somme + a.avancement, 0) / suivies.length);

    return attendre({
      activites: lignes,
      total: toutes.length,
      structures: [...new Set(toutes.map((a) => a.structureSigle))].sort(),
      compteurs: [
        { libelle: "Activités suivies", valeur: suivies.length, note: "en cours ou programmées", feu: "inconnu" },
        {
          libelle: "En retard",
          valeur: enRetard,
          note: enRetard > 0 ? "écart à l'attendu" : "aucun retard",
          feu: enRetard > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Taux d'exécution",
          valeur: moyenne,
          note: "moyenne des activités suivies",
          feu: moyenne >= 85 ? "vert" : moyenne >= 60 ? "orange" : "rouge",
        },
        {
          libelle: "Réalisées",
          valeur: toutes.filter((a) => a.etat === "Réalisée").length,
          note: "closes sur l'exercice",
          feu: "vert",
        },
      ],
    });
  }

  if (route === "/activites/plan") {
    const annee = Number(parametres.get("annee") ?? 2026);
    const accessibles = structuresAccessibles();

    /*
     * La structure demandee, si le perimetre l'autorise ; celle de la session
     * sinon. Le filtrage se fait ici et non a l'affichage : un point focal qui
     * change le parametre de l'URL doit retomber sur son propre plan, pas sur
     * une page vide qui lui apprendrait que la structure voisine existe.
     */
    const demandee = parametres.get("structure") ?? "";
    const sigle = accessibles.some((s) => s.sigle === demandee)
      ? demandee
      : (accessibles.find((s) => s.sigle === structureDeLaSession()) ?? accessibles[0]).sigle;

    const plan = PLANS_DEMO.find((p) => p.structureSigle === sigle);
    const activites = activitesListe().filter((a) => a.structureSigle === sigle);
    const avancement =
      activites.length === 0
        ? 0
        : Math.round(activites.reduce((somme, a) => somme + a.avancement, 0) / activites.length);

    return attendre({
      annee,
      structureSigle: sigle,
      structureLibelle:
        plan?.structureLibelle ?? accessibles.find((s) => s.sigle === sigle)?.libelle ?? sigle,
      etat: plan?.etat ?? "Brouillon",
      soumisLe: plan?.soumisLe ?? null,
      valideLe: plan?.valideLe ?? null,
      validePar: plan?.validePar ?? null,
      motifRetour: plan?.motifRetour ?? null,
      activites,
      avancementGlobal: avancement,
      budgetTotal: ACTIVITES_DEMO.filter((a) => a.structureSigle === sigle).reduce(
        (somme, a) => somme + (a.budgetValide ?? 0),
        0,
      ),
      structuresAccessibles: accessibles,
    });
  }

  /*
   * Corbeille du controle de gestion — §15.
   *
   * Toutes les structures y figurent, pas seulement celles qui attendent une
   * decision : savoir qu'une direction n'a rien soumis au mois d'aout est au
   * moins aussi utile que de valider celles qui l'ont fait.
   */
  if (route === "/activites/plans") {
    const annee = Number(parametres.get("annee") ?? 2026);

    const plans = PLANS_DEMO.map((plan) => {
      const activites = ACTIVITES_DEMO.filter((a) => a.structureSigle === plan.structureSigle);
      const budget = activites.reduce((somme, a) => somme + (a.budgetValide ?? 0), 0);

      return {
        structureSigle: plan.structureSigle,
        structureLibelle: plan.structureLibelle,
        annee,
        etat: plan.etat,
        activites: activites.length,
        avancementGlobal:
          activites.length === 0
            ? 0
            : Math.round(activites.reduce((somme, a) => somme + a.avancement, 0) / activites.length),
        budgetTotal: budget === 0 ? null : budget,
        soumisLe: plan.soumisLe,
      };
    });

    const attente = plans.filter((p) => p.etat === "Soumis au contrôle de gestion").length;
    const retournes = plans.filter((p) => p.etat === "Retourné").length;
    const valides = plans.filter((p) => p.etat === "Validé").length;
    const couverture = plans.length === 0 ? 0 : Math.round((valides / plans.length) * 100);

    return attendre({
      plans,
      compteurs: [
        {
          libelle: "En attente de décision",
          valeur: attente,
          note: attente > 0 ? "soumis, non tranchés" : "rien à trancher",
          feu: attente > 0 ? "orange" : "vert",
        },
        {
          libelle: "Retournés",
          valeur: retournes,
          note: retournes > 0 ? "à corriger par la structure" : "aucun retour en cours",
          feu: retournes > 0 ? "rouge" : "vert",
        },
        { libelle: "Validés", valeur: valides, note: `sur ${plans.length} structures`, feu: "vert" },
        {
          libelle: "Couverture",
          valeur: couverture,
          note: "des structures engagées par un plan validé",
          feu: couverture >= 85 ? "vert" : couverture >= 60 ? "orange" : "rouge",
        },
      ],
    });
  }

  if (route === "/activites/obligations") {
    const filtre = parametres.get("filtre") ?? "Toutes";
    let lignes = OBLIGATIONS_DEMO;
    if (filtre === "À déposer") lignes = lignes.filter((o) => !o.depose);
    else if (filtre === "En retard") lignes = lignes.filter((o) => o.retardJours !== null);
    else if (filtre !== "Toutes") lignes = lignes.filter((o) => o.nature === filtre);

    const aDeposer = OBLIGATIONS_DEMO.filter((o) => !o.depose).length;
    const horsDelai = OBLIGATIONS_DEMO.filter((o) => o.retardJours !== null).length;
    const deposes = OBLIGATIONS_DEMO.filter((o) => o.depose);
    const aLheure = deposes.filter((o) => o.retardJours === null).length;
    const ponctualite = deposes.length === 0 ? 0 : Math.round((aLheure / deposes.length) * 100);

    return attendre({
      obligations: lignes,
      ponctualite,
      compteurs: [
        {
          libelle: "À déposer",
          valeur: aDeposer,
          note: aDeposer > 0 ? "dont un hors délai" : "rien en attente",
          feu: aDeposer > 1 ? "orange" : aDeposer > 0 ? "orange" : "vert",
        },
        {
          libelle: "Hors délai",
          valeur: horsDelai,
          note: horsDelai > 0 ? "déposés en retard ou attendus" : "aucun retard",
          feu: horsDelai > 0 ? "rouge" : "vert",
        },
        {
          libelle: "Ponctualité",
          valeur: ponctualite,
          note: "des dépôts dans les délais",
          feu: ponctualite >= 85 ? "vert" : ponctualite >= 60 ? "orange" : "rouge",
        },
        { libelle: "Déposés", valeur: deposes.length, note: "sur la période", feu: "vert" },
      ],
    });
  }

  const activiteDemandee = route.match(/^\/activites\/(\d+)$/);
  if (activiteDemandee) {
    const trouvee = ACTIVITES_DEMO.find((a) => a.id === Number(activiteDemandee[1]));
    return trouvee ? attendre(trouvee) : null;
  }

  const detail = route.match(/^\/courriers\/(\d+)$/);
  if (detail) {
    const trouve = fiche(Number(detail[1]));
    return trouve ? attendre(trouve) : null;
  }

  return null;
}
