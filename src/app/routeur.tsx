import { createBrowserRouter } from "react-router";
import { Accueil } from "@/app/layout/Accueil";
import { Disposition } from "@/app/layout/Disposition";
import { DispositionAdmin } from "@/app/layout/DispositionAdmin";
import { DispositionPortail } from "@/app/layout/DispositionPortail";
import { ExigePermission } from "@/app/guards/ExigePermission";
import { ExigeSession } from "@/app/guards/ExigeSession";
import { Connexion } from "@/features/authentification/pages/Connexion";
import { PERMISSIONS } from "@/types/habilitation";

import { Statistiques } from "@/features/pilotage/pages/Statistiques";
import { VueEnsembleComite } from "@/features/comite/pages/VueEnsembleComite";
import { VueEnsembleDirection } from "@/features/direction/pages/VueEnsembleDirection";
import { Cockpit } from "@/features/pilotage/pages/Cockpit";
import { TableauStructure } from "@/features/pilotage/pages/TableauStructure";
import { SyntheseInstance } from "@/features/pilotage/pages/SyntheseInstance";
import { Analyses } from "@/features/pilotage/pages/Analyses";
import { Programme } from "@/features/pilotage/pages/Programme";
import { Rapports } from "@/features/pilotage/pages/Rapports";
import { Impressions } from "@/features/pilotage/pages/Impressions";
import { RegistreCourriers } from "@/features/courrier/pages/RegistreCourriers";
import { FicheCourrier } from "@/features/courrier/pages/FicheCourrier";
import { EnregistrementCourrier } from "@/features/courrier/pages/EnregistrementCourrier";
import { RegistreDeparts } from "@/features/depart/pages/RegistreDeparts";
import { FileSignature } from "@/features/depart/pages/FileSignature";
import { BordereauCoursier } from "@/features/depart/pages/BordereauCoursier";
import { RedactionDepart } from "@/features/depart/pages/RedactionDepart";
import { CircuitValidation } from "@/features/depart/pages/CircuitValidation";
import { CourrierInitiative } from "@/features/depart/pages/CourrierInitiative";
import { FicheCotationImprimable } from "@/features/courrier/pages/FicheCotationImprimable";
import { CourriersInternes } from "@/features/courrier/pages/CourriersInternes";
import { Cotations } from "@/features/courrier/pages/Cotations";
import { AccusesReception } from "@/features/courrier/pages/AccusesReception";
import { BureauOrdre } from "@/features/courrier/pages/BureauOrdre";
import { SupervisionDelais } from "@/features/courrier/pages/SupervisionDelais";
import { SignalementEcart } from "@/features/courrier/pages/SignalementEcart";
import { FicheDeVie } from "@/features/courrier/pages/FicheDeVie";
import { Affectations } from "@/features/courrier/pages/Affectations";
import { Portefeuille } from "@/features/suivi/pages/Portefeuille";
import { DossierTraitement } from "@/features/suivi/pages/DossierTraitement";
import { Recherche } from "@/features/suivi/pages/Recherche";
import { RegistreDossiers } from "@/features/dossier/pages/RegistreDossiers";
import { FicheDossier } from "@/features/dossier/pages/FicheDossier";
import { ModelesCourrier } from "@/features/dossier/pages/ModelesCourrier";
import { NouveauDossier } from "@/features/dossier/pages/NouveauDossier";
import { ReferentielConservation } from "@/features/archivage/pages/ReferentielConservation";
import { Versements } from "@/features/archivage/pages/Versements";
import { FicheVersement } from "@/features/archivage/pages/FicheVersement";
import { Classement } from "@/features/performance/pages/Classement";
import { FicheStructure } from "@/features/performance/pages/FicheStructure";
import { Dictionnaire } from "@/features/performance/pages/Dictionnaire";
import { CalendrierProduction } from "@/features/performance/pages/CalendrierProduction";
import { RegistreActivites } from "@/features/activite/pages/RegistreActivites";
import { FicheActivite } from "@/features/activite/pages/FicheActivite";
import { PlanActions } from "@/features/activite/pages/PlanActions";
import { PlansAValider } from "@/features/activite/pages/PlansAValider";
import { Obligations } from "@/features/activite/pages/Obligations";
import { RelevesExploitation } from "@/features/exploitation/pages/RelevesExploitation";
import { RegistreDecisions } from "@/features/gouvernance/pages/RegistreDecisions";
import { FicheDecision } from "@/features/gouvernance/pages/FicheDecision";
import { RegistreSeances } from "@/features/gouvernance/pages/RegistreSeances";
import { FicheSeance } from "@/features/gouvernance/pages/FicheSeance";
import { Disponibilites } from "@/features/gouvernance/pages/Disponibilites";
import { Filiales } from "@/features/gouvernance/pages/Filiales";
import { Representations } from "@/features/gouvernance/pages/Representations";
import { PlanningConges } from "@/features/gouvernance/pages/PlanningConges";
import { ReferentielStructures } from "@/features/gouvernance/pages/ReferentielStructures";
import { Organisation } from "@/features/organisation/pages/Organisation";
import { Habilitations } from "@/features/habilitation/pages/Habilitations";
import { Parametrage } from "@/features/parametrage/pages/Parametrage";
import { Tracabilite } from "@/features/tracabilite/pages/Tracabilite";
import { MesDemandes } from "@/features/portail/pages/MesDemandes";
import { SuiviDemande } from "@/features/portail/pages/SuiviDemande";
import { DeposerDemande } from "@/features/portail/pages/DeposerDemande";
import { Echanges } from "@/features/portail/pages/Echanges";
import { PreferencesNotification } from "@/features/portail/pages/PreferencesNotification";
import { Plateforme } from "@/features/supervision/pages/Plateforme";
import { Integrations } from "@/features/supervision/pages/Integrations";

/**
 * Les routes portent les memes permissions que le menu.
 * Un utilisateur qui saisirait l'URL a la main tombe sur le garde.
 */
export const routeur = createBrowserRouter([
  // Seul ecran accessible sans session.
  { path: "/connexion", element: <Connexion /> },

  {
    element: <ExigeSession />,
    children: [
      /*
       * L'accueil est hors des deux dispositions : il porte la sienne. Selon
       * les permissions de la session, il rend le tableau de bord du courrier
       * ou celui de l'administration — avec la charte qui va avec.
       */
      { index: true, element: <Accueil /> },

      {
        element: <Disposition />,
        children: [
          {
            element: <ExigePermission permissions={[PERMISSIONS.LEC]} />,
            children: [
              { path: "courriers", element: <RegistreCourriers /> },
              { path: "courriers/departs", element: <RegistreDeparts /> },
              {
                path: "courriers/departs/bordereau/:numero",
                element: <BordereauCoursier />,
              },
              { path: "courriers/internes", element: <CourriersInternes /> },
              { path: "courriers/accuses", element: <AccusesReception /> },
              { path: "courriers/:id", element: <FicheCourrier /> },
              { path: "courriers/:id/ecart", element: <SignalementEcart /> },
              { path: "courriers/:id/fiche-de-vie", element: <FicheDeVie /> },
              {
                path: "courriers/:id/fiche-cotation",
                element: <FicheCotationImprimable />,
              },
              { path: "recherche", element: <Recherche /> },
              { path: "suivi", element: <Portefeuille /> },
              { path: "suivi/:id", element: <DossierTraitement /> },
            ],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.ENR]} />,
            children: [
              {
                path: "courriers/nouveau",
                element: <EnregistrementCourrier />,
              },
              /*
               * Import de masse — meme permission que l'enregistrement : c'est
               * le meme geste, a une autre echelle.
               */
            ],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.VAL]} />,
            children: [
              {
                path: "courriers/departs/signature",
                element: <FileSignature />,
              },
              {
                path: "courriers/departs/:id/circuit",
                element: <CircuitValidation />,
              },
            ],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.TRA]} />,
            children: [
              {
                path: "courriers/departs/nouveau",
                element: <RedactionDepart />,
              },
              {
                path: "courriers/departs/initiative",
                element: <CourrierInitiative />,
              },
            ],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.COT, PERMISSIONS.COT_DEL]} />,
            children: [{ path: "cotations", element: <Cotations /> }],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.AFF]} />,
            children: [{ path: "affectations", element: <Affectations /> }],
          },
          /*
           * Le bureau d'ordre de la structure — au Port, c'est son point focal.
           * Sous `BO_STR` et non sous `LEC` : lire le registre des courriers et
           * tenir le cahier d'entrée-sortie de sa direction sont deux gestes
           * différents, et le second n'appartient qu'à une personne par
           * structure. Voir ADR 031.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.BO_STR]} />,
            children: [{ path: "courriers/bureau-ordre", element: <BureauOrdre /> }],
          },
          /*
           * La supervision des délais — le mapping complet de la DSR. Sous
           * `REL`, la permission de relancer, et non sous `STAT` : ce n'est pas
           * une statistique mais la liste de travail de celui qui relance. La
           * même permission ouvre le dossier interne côté serveur, et les deux
           * doivent tenir la frontière au même endroit.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.REL]} />,
            children: [{ path: "courriers/supervision", element: <SupervisionDelais /> }],
          },
          /*
           * Restitution — les trois niveaux du descriptif fonctionnel.
           *
           * Le cockpit est le niveau 1, reserve a la Direction generale. Le
           * tableau de bord de structure sert les niveaux 2 et 3 : c'est le
           * perimetre de la session, et non l'ecran, qui decide de ce qu'on y
           * voit. La synthese se lit sur papier, avant l'instance.
           */
          /*
           * La vue d'ensemble de la Direction generale, sur sa propre
           * permission. Elle n'est pas un cockpit de plus : c'est l'ecran
           * d'accueil d'un poste unique, et rien d'autre ne l'ouvre.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.VUE_DG]} />,
            children: [{ path: "direction", element: <VueEnsembleDirection /> }],
          },
          /*
           * La vue d'ensemble du Comite de direction, sur sa propre permission
           * elle aussi. Meme composition que la precedente, autre point de vue :
           * celle-ci rapporte tout a une direction, pas a l'institution.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.VUE_CODIR]} />,
            children: [{ path: "comite", element: <VueEnsembleComite /> }],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.COCKPIT]} />,
            children: [
              { path: "cockpit", element: <Cockpit /> },
              { path: "pilotage/synthese", element: <SyntheseInstance /> },
            ],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.ACT_LEC]} />,
            children: [{ path: "pilotage/structures", element: <TableauStructure /> }],
          },
          /*
           * Projets et dossiers — l'instruction des demandes administratives.
           *
           * DOS_LEC ouvre la consultation ; DOS_INS et DOS_VAL commandent les
           * actions a l'interieur de la fiche. Un instructeur demande des
           * complements et redige ; un validateur retourne le dossier a
           * l'etape anterieure. Ce ne sont jamais les memes gestes.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.DOS_LEC]} />,
            children: [
              { path: "dossiers", element: <RegistreDossiers /> },
              { path: "dossiers/modeles", element: <ModelesCourrier /> },
              { path: "dossiers/:id", element: <FicheDossier /> },
            ],
          },
          /*
           * L'ouverture est la seule route du pilier qui ecrit, et elle est
           * gardee par DOS_INS. Sous DOS_LEC, le DG aurait pu remplir le
           * formulaire en entier avant de recevoir un 401 a la validation :
           * l'ecran doit refuser a l'entree ce que le serveur refusera a la
           * sortie.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.DOS_INS]} />,
            children: [{ path: "dossiers/nouveau", element: <NouveauDossier /> }],
          },
          /*
           * Archivage — le sort des dossiers une fois clos.
           *
           * Une seule permission suffit : l'archiviste tient le referentiel,
           * controle les versements et produit les preuves. Le descriptif ne
           * decoupe pas ces trois gestes, et les separer aurait cree des
           * profils que personne n'occupe.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.ARCH]} />,
            children: [
              {
                path: "archivage/referentiel",
                element: <ReferentielConservation />,
              },
              { path: "archivage/versements", element: <Versements /> },
              { path: "archivage/versements/:id", element: <FicheVersement /> },
            ],
          },
          /*
           * Performance — matrice de scoring et son appareil de mesure.
           *
           * SCORE ouvre le classement et sa decomposition : le CODIR et les
           * responsables de structure le consultent. SCORE_ADM ouvre le
           * dictionnaire et le calendrier, que seule la DSR administre — c'est
           * la distinction entre lire une note et fixer la regle qui la produit.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.SCORE]} />,
            children: [
              { path: "performance/classement", element: <Classement /> },
              {
                path: "performance/classement/:sigle",
                element: <FicheStructure />,
              },
            ],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.SCORE_ADM]} />,
            children: [
              { path: "performance/indicateurs", element: <Dictionnaire /> },
              {
                path: "performance/calendrier",
                element: <CalendrierProduction />,
              },
            ],
          },
          /*
           * Activites — plan d'actions annuel et son execution.
           *
           * ACT_LEC ouvre la consultation ; ACT_SAI et ACT_VAL commandent les
           * boutons a l'interieur des ecrans, pas l'acces. Un point focal et un
           * controleur de gestion regardent le meme plan, mais l'un le soumet
           * et l'autre le valide.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.ACT_LEC]} />,
            children: [
              { path: "activites", element: <RegistreActivites /> },
              { path: "activites/plan", element: <PlanActions /> },
              { path: "activites/obligations", element: <Obligations /> },
              { path: "activites/:id", element: <FicheActivite /> },
            ],
          },
          /*
           * La corbeille des plans est la seule page du pilier reservee au
           * validateur : elle n'a de sens que pour qui rend la decision.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.ACT_VAL]} />,
            children: [{ path: "activites/plans", element: <PlansAValider /> }],
          },
          /*
           * Exploitation — cote du chenal et recouvrements.
           *
           * Les deux permissions ouvrent le meme ecran, et c'est voulu : celui
           * qui releve et celui qui consolide lisent la meme page, remplie
           * differemment. EXP_SAI pour la Regie du dragage, la DDLM, la
           * Direction de l'exploitation et celle des finances ; EXP_LEC pour
           * qui lit l'ensemble sans rien saisir.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.EXP_SAI, PERMISSIONS.EXP_LEC]} />,
            children: [{ path: "exploitation", element: <RelevesExploitation /> }],
          },
          /*
           * Gouvernance — le dispositif de la DSR.
           *
           * Chaque registre porte sa propre permission : tenir le registre des
           * decisions et renseigner la disponibilite des responsables sont deux
           * responsabilites distinctes, et le point focal n'a que la seconde.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.DEC]} />,
            children: [
              { path: "gouvernance/decisions", element: <RegistreDecisions /> },
              { path: "gouvernance/decisions/:id", element: <FicheDecision /> },
              /*
               * Une recommandation externe engage une structure comme une
               * decision d'instance : c'est la meme permission qui l'ouvre.
               */
              {
                path: "gouvernance/representations",
                element: <Representations />,
              },
              /*
               * Filiales et succursales — §3.3. L'ecran est garde par DEC, pas
               * par INST, pour deux raisons. Les prescriptions des organes de
               * gestion sont des `engagement` d'origine ORGANE_FILIALE (ADR
               * 006) : la matiere meme du registre des decisions, et l'aval —
               * suivre leur mise en oeuvre — est la finalite de l'ecran. Et le
               * DG comme le CODIR portent DEC sans porter INST : garder par
               * INST fermerait l'ecran a ceux qui siegent dans ces organes.
               */
              { path: "gouvernance/filiales", element: <Filiales /> },
            ],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.INST]} />,
            children: [
              { path: "gouvernance/seances", element: <RegistreSeances /> },
              { path: "gouvernance/seances/:id", element: <FicheSeance /> },
            ],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.DISPO]} />,
            children: [
              {
                path: "gouvernance/disponibilites",
                element: <Disponibilites />,
              },
              { path: "gouvernance/conges", element: <PlanningConges /> },
            ],
          },
          /*
           * Le referentiel des structures, en lecture, pour qui relance les
           * structures (REL). Son ecriture vit dans `/organisation`, zone
           * d'administration — ADR 021.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.REL]} />,
            children: [
              {
                path: "gouvernance/structures",
                element: <ReferentielStructures />,
              },
            ],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.STAT]} />,
            children: [
              { path: "statistiques", element: <Statistiques /> },
              /*
               * Analyses croisees et indicateurs du programme : le travail du
               * controle de gestion (§3.11). Meme permission que les
               * statistiques — c'est la meme matiere, regardee autrement.
               */
              { path: "pilotage/analyses", element: <Analyses /> },
              { path: "pilotage/programme", element: <Programme /> },
            ],
          },
          {
            /*
             * Les rapports periodiques se lisent a deux niveaux : le controle
             * de gestion sort celui de l'institution (STAT), un responsable de
             * structure celui de la sienne (ACT_LEC). C'est le perimetre, et
             * non la garde, qui fait la difference — et la garde du serveur est
             * la meme, `exige(ACT_LEC, STAT)`. Les laisser sous STAT seul
             * aurait cache l'ecran a ceux dont il parle.
             */
            element: <ExigePermission permissions={[PERMISSIONS.STAT, PERMISSIONS.ACT_LEC]} />,
            children: [{ path: "rapports", element: <Rapports /> }],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.IMP]} />,
            children: [{ path: "impressions", element: <Impressions /> }],
          },

          {
            path: "*",
            element: (
              <div className="grid flex-1 place-items-center">
                <p className="text-[13px] font-semibold text-encre-tenue">Page introuvable.</p>
              </div>
            ),
          },
        ],
      },

      /*
       * L'administration forme une branche a part : elle a sa disposition, sa
       * charte et sa navigation. On y entre, on regle, on en sort — ce n'est pas
       * le meme travail que le suivi du courrier, et cela doit se voir.
       */
      /*
       * Portail externe — la troisieme charte.
       *
       * Branche entierement separee : l'usager n'a acces a aucun ecran interne,
       * et aucun agent n'a EXT. Les deux populations ne se croisent nulle part,
       * ce qui est la seule garantie serieuse quand on ouvre au public.
       */
      {
        element: <DispositionPortail />,
        children: [
          {
            element: <ExigePermission permissions={[PERMISSIONS.EXT]} />,
            children: [
              { path: "portail", element: <MesDemandes /> },
              { path: "portail/nouvelle", element: <DeposerDemande /> },
              { path: "portail/demandes/:id", element: <SuiviDemande /> },
              { path: "portail/echanges", element: <Echanges /> },
              {
                path: "portail/preferences",
                element: <PreferencesNotification />,
              },
            ],
          },
        ],
      },

      {
        element: <DispositionAdmin />,
        children: [
          {
            element: <ExigePermission permissions={[PERMISSIONS.ADM_ORG]} />,
            children: [{ path: "organisation", element: <Organisation /> }],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.ADM_HAB]} />,
            children: [{ path: "habilitations", element: <Habilitations /> }],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.ADM_PAR]} />,
            children: [{ path: "parametrage", element: <Parametrage /> }],
          },
          {
            element: <ExigePermission permissions={[PERMISSIONS.AUDIT]} />,
            children: [{ path: "tracabilite", element: <Tracabilite /> }],
          },
          /*
           * Exploitation technique — §3.10. En charte administration, parce
           * que c'est du parametrage de l'outil et non du travail sur le
           * courrier. L'administrateur IT n'a d'ailleurs pas LEC.
           */
          {
            element: <ExigePermission permissions={[PERMISSIONS.ADM_TEC]} />,
            children: [
              { path: "supervision", element: <Plateforme /> },
              { path: "supervision/integrations", element: <Integrations /> },
            ],
          },
        ],
      },
    ],
  },
]);
