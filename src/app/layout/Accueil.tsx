import { Navigate } from "react-router";
import { Disposition } from "@/app/layout/Disposition";
import { DispositionAdmin } from "@/app/layout/DispositionAdmin";
import { VueEnsembleComite } from "@/features/comite/pages/VueEnsembleComite";
import { VueEnsembleDirection } from "@/features/direction/pages/VueEnsembleDirection";
import { TableauDeBordGouvernance } from "@/features/gouvernance/pages/TableauDeBordGouvernance";
import { Cockpit } from "@/features/pilotage/pages/Cockpit";
import { TableauDeBord } from "@/features/pilotage/pages/TableauDeBord";
import { TableauStructure } from "@/features/pilotage/pages/TableauStructure";
import { TableauDeBordAdmin } from "@/features/administration/pages/TableauDeBordAdmin";
import { useSession } from "@/lib/contexteSession";
import { PERMISSIONS, type Permission } from "@/types/habilitation";

/**
 * Aiguillage de la page d'accueil.
 *
 * Deux metiers, deux tableaux de bord. L'agent de session suit des courriers ;
 * l'administrateur fonctionnel suit l'usage de l'outil, son referentiel et ses
 * acces. Leur presenter le meme ecran d'accueil obligeait l'un des deux a
 * commencer sa journee devant les chiffres de l'autre.
 *
 * L'adresse reste `/` dans les deux cas : c'est le contenu qui suit la
 * session, pas l'URL. Un lien vers l'accueil envoye d'un poste a un autre
 * reste donc valide, et chacun voit ce qui le concerne.
 *
 * Le layout suit la page, et c'est la raison d'etre de ce composant : la
 * branche d'administration a sa propre charte (fond papier, cartes flottantes,
 * navigation reduite). Un tableau de bord admin rendu dans la disposition de
 * l'espace de travail aurait change d'apparence des le premier clic vers
 * Habilitations.
 */
/*
 * Ce qui envoie dans la zone d'administration.
 *
 * La DSR n'y figure pas : elle consulte le referentiel des structures depuis
 * son espace de travail, elle ne l'ecrit plus (ADR 021). La ranger parmi les
 * administrateurs la ferait entrer par une charte et travailler dans une
 * autre. Le descriptif fonctionnel la place au niveau 2, celui du pilotage
 * tactique, pas dans le parametrage.
 */
const PERMISSIONS_ADMIN: Permission[] = [
  PERMISSIONS.ADM_ORG,
  PERMISSIONS.ADM_HAB,
  PERMISSIONS.ADM_PAR,
  PERMISSIONS.AUDIT,
];

/*
 * Ce qui ouvre le tableau de bord du dispositif de suivi (niveau 2).
 *
 * DISPO n'y figure plus. Le point focal la porte pour renseigner les congés et
 * les missions de sa hiérarchie (§3.5), et cette seule permission l'envoyait
 * sur le pilotage du dispositif — l'écran de la DSR, qui montre l'ensemble des
 * structures. Or le §3.5 lui interdit précisément cette visibilité, et le §4 le
 * range au niveau 3. Renseigner une absence n'est pas piloter le dispositif.
 */
const PERMISSIONS_GOUVERNANCE: Permission[] = [PERMISSIONS.DEC, PERMISSIONS.INST];

export function Accueil() {
  const session = useSession();
  const administre = PERMISSIONS_ADMIN.some((code) => session.permissions.includes(code));

  if (administre) {
    return (
      <DispositionAdmin>
        <TableauDeBordAdmin />
      </DispositionAdmin>
    );
  }

  /*
   * La vue d'ensemble de la Direction generale passe avant tout.
   *
   * Elle n'appartient qu'a un poste, et c'est ce qui la distingue du cockpit :
   * celui-ci reste l'ecran d'arbitrage, partage avec le Comite de direction.
   * Le Directeur general ouvre donc l'application sur l'etat de l'institution,
   * et descend dans le cockpit quand un chiffre l'y appelle.
   */
  if (session.permissions.includes(PERMISSIONS.VUE_DG)) {
    return (
      <Disposition>
        <VueEnsembleDirection />
      </Disposition>
    );
  }

  /*
   * Puis celle du Comite de direction, avant le cockpit.
   *
   * Le §3.2 fait du Comite un consultant, pas un arbitre : un directeur qui y
   * siege ouvre l'application sur l'etat du college — les directions les unes
   * en face des autres — et descend dans le cockpit quand une alerte l'y
   * appelle. L'y faire entrer directement lui presentait chaque matin la liste
   * des arbitrages du Directeur general, dont aucun ne lui revient.
   */
  if (session.permissions.includes(PERMISSIONS.VUE_CODIR)) {
    return (
      <Disposition>
        <VueEnsembleComite />
      </Disposition>
    );
  }

  /*
   * Le cockpit ensuite, pour qui le porte.
   *
   * C'est le niveau 1 du §4 : une vue unique reservee au sommet. Ceux qui la
   * portent n'ont pas a passer par le registre du courrier pour y arriver.
   */
  if (session.permissions.includes(PERMISSIONS.COCKPIT)) {
    return (
      <Disposition>
        <Cockpit />
      </Disposition>
    );
  }

  /*
   * Puis le pilotage du dispositif, avant le registre du courrier.
   *
   * La DSR ouvre l'application sur ce qui est en retard, pas sur la liste des
   * courriers du jour. Le §4 le dit : son niveau de restitution est le 2,
   * celui du pilotage tactique. Le registre reste accessible par le menu pour
   * qui a les permissions.
   */
  if (PERMISSIONS_GOUVERNANCE.some((code) => session.permissions.includes(code))) {
    return (
      <Disposition>
        <TableauDeBordGouvernance />
      </Disposition>
    );
  }

  /*
   * Qui alimente les donnees de sa structure ouvre sur cette structure.
   *
   * ACT_SAI designe exactement les deux postes que le descriptif fait entrer
   * par la : le responsable hierarchique, qui suit sa branche (§3.4, niveau 2),
   * et le point focal, qui ne voit que la sienne (§3.5, niveau 3). C'est le
   * meme ecran pour les deux — seul le perimetre de la session change ce qu'on
   * y lit — et il porte les trois blocs qu'ils viennent chercher : activites,
   * courrier, rituels.
   *
   * Les envoyer sur le registre du courrier revenait a leur demander de
   * chercher au menu, chaque matin, l'ecran de leur propre travail.
   */
  if (session.permissions.includes(PERMISSIONS.ACT_SAI)) {
    return (
      <Disposition>
        <TableauStructure />
      </Disposition>
    );
  }

  /*
   * Un compte externe n'a rien a faire dans l'espace de travail.
   *
   * Il part vers son portail, qui est une branche entierement separee : autre
   * charte, autre navigation, autre vocabulaire. La redirection plutot qu'un
   * rendu direct, pour que l'URL corresponde a ce qui est affiche — un usager
   * qui met la page en favori doit retomber sur son portail.
   */
  if (session.permissions.length > 0 && session.permissions.every((code) => code === PERMISSIONS.EXT)) {
    return <Navigate to="/portail" replace />;
  }

  return (
    <Disposition>
      <TableauDeBord />
    </Disposition>
  );
}
