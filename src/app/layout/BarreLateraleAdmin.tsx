import { NavLink } from "react-router";
import { Icone, type NomIcone } from "@/components/ui/Icone";
import { useSession } from "@/lib/contexteSession";
import { PERMISSIONS, type Permission } from "@/types/habilitation";

/**
 * Navigation de l'administration : des icones, sans libelles.
 *
 * Le choix se defend ici et nulle part ailleurs. L'administrateur est un
 * utilisateur unique et regulier de ces quatre ecrans ; il les reconnait. Un
 * agent de session, lui, ne verra jamais cette barre — les entrees sont
 * filtrees par permission comme partout. Chaque icone porte son libelle en
 * infobulle et en `aria-label`, ce qui la rend lisible au lecteur d'ecran.
 */
interface EntreeAdmin {
  chemin: string;
  icone: NomIcone;
  libelle: string;
  permissions: Permission[];
}

/**
 * Retour vers l'espace de travail.
 *
 * Le tableau de bord est toujours la : c'est la page d'accueil de chacun, et
 * pour l'administrateur fonctionnel c'est desormais la sienne — celle qui
 * compte les operations de l'application, pas les courriers des autres.
 *
 * Les deux entrees suivantes ne s'ouvrent qu'a qui a du courrier a traiter.
 * La permission de lecture ne suffit pas : un administrateur la porte pour
 * pouvoir verifier un dossier a la demande, pas pour tenir un portefeuille.
 * Les lui presenter en permanence revenait a lui proposer le travail d'un
 * autre poste a chaque ecran.
 */
const PERMISSIONS_METIER: Permission[] = [
  PERMISSIONS.ENR,
  PERMISSIONS.COT,
  PERMISSIONS.COT_DEL,
  PERMISSIONS.AFF,
  PERMISSIONS.TRA,
  PERMISSIONS.VAL,
  PERMISSIONS.CLO,
  PERMISSIONS.REL,
  PERMISSIONS.TRANS,
];

const RETOUR: EntreeAdmin[] = [
  { chemin: "/", icone: "tableauDeBord", libelle: "Tableau de bord", permissions: [PERMISSIONS.LEC] },
  { chemin: "/courriers", icone: "courrier", libelle: "Courriers", permissions: PERMISSIONS_METIER },
  { chemin: "/suivi", icone: "horloge", libelle: "Suivi et relance", permissions: PERMISSIONS_METIER },
];

const ADMINISTRATION: EntreeAdmin[] = [
  { chemin: "/habilitations", icone: "personnes", libelle: "Habilitations", permissions: [PERMISSIONS.ADM_HAB] },
  { chemin: "/organisation", icone: "organisation", libelle: "Organisation", permissions: [PERMISSIONS.ADM_ORG] },
  { chemin: "/parametrage", icone: "reglages", libelle: "Paramétrage métier", permissions: [PERMISSIONS.ADM_PAR] },
  { chemin: "/tracabilite", icone: "horloge", libelle: "Traçabilité", permissions: [PERMISSIONS.AUDIT] },
  { chemin: "/supervision", icone: "graphique", libelle: "Supervision technique", permissions: [PERMISSIONS.ADM_TEC] },
  { chemin: "/supervision/integrations", icone: "bouclier", libelle: "Authentification et intégrations", permissions: [PERMISSIONS.ADM_TEC] },
];

function Bouton({ entree }: { entree: EntreeAdmin }) {
  return (
    <NavLink
      to={entree.chemin}
      end={entree.chemin === "/"}
      title={entree.libelle}
      aria-label={entree.libelle}
      className={({ isActive }) =>
        `grid size-10 place-items-center rounded-none transition-colors duration-150 ${
          isActive ? "bg-accent-voile text-accent" : "text-encre-tenue hover:bg-surface-douce"
        }`
      }
    >
      <Icone nom={entree.icone} taille={19} />
    </NavLink>
  );
}

export function BarreLateraleAdmin() {
  const session = useSession();
  const autorisee = (entree: EntreeAdmin) =>
    entree.permissions.some((code) => session.permissions.includes(code));

  return (
    <aside className="flex w-[66px] flex-none flex-col items-center gap-[22px] rounded-none bg-surface px-0 pt-[18px] pb-4">
      <NavLink to="/" title="Suivi Courrier" aria-label="Retour à l'accueil">
        <span className="grid size-[34px] place-items-center rounded-none bg-accent">
          <span className="size-[11px] rotate-45 rounded-none bg-white" />
        </span>
      </NavLink>

      <nav className="flex flex-col items-center gap-2" aria-label="Espace de travail">
        {RETOUR.filter(autorisee).map((entree) => (
          <Bouton key={entree.chemin} entree={entree} />
        ))}
      </nav>

      <div className="flex-1" />

      <nav className="flex flex-col items-center gap-2" aria-label="Administration">
        {ADMINISTRATION.filter(autorisee).map((entree) => (
          <Bouton key={entree.chemin} entree={entree} />
        ))}
      </nav>
    </aside>
  );
}
