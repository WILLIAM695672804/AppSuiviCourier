import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Icone } from "@/components/ui/Icone";
import { useCompteurs } from "@/lib/compteurs";
import { usePermission, useSession } from "@/lib/contexteSession";
import { filtrerMenu, type CleCompteur, type EntreeMenu } from "@/lib/navigation";
import { PERMISSIONS } from "@/types/habilitation";

const LIGNE = "flex items-center gap-2.5 rounded-none px-2.5 py-[9px] text-[13px] leading-none transition-colors duration-150";
const SOUS_LIGNE = "block rounded-none py-[7px] pr-2.5 pl-9 text-[12.5px] leading-none transition-colors duration-150";

function Pastille({ valeur, alerte }: { valeur: number; alerte?: boolean }) {
  return (
    <span
      className={`rounded-none px-1.5 py-[3px] text-[11px] leading-none font-bold ${
        alerte ? "bg-danger-voile text-danger" : "bg-accent-voile-fort text-accent-fonce"
      }`}
    >
      {valeur}
    </span>
  );
}

function Entree({ entree, compteurs }: { entree: EntreeMenu; compteurs: Record<CleCompteur, number> }) {
  const { pathname } = useLocation();
  const sousEntrees = entree.sousEntrees ?? [];

  // Une entree porteuse de sous-entrees s'allume des qu'on est dans sa branche.
  const dansLaBranche =
    entree.chemin === "/" ? pathname === "/" : pathname.startsWith(entree.chemin);
  const surLaBranche = dansLaBranche || sousEntrees.some((s) => pathname === s.chemin);

  /*
   * Repli manuel d'un groupe.
   *
   * `null` signifie « suivre la route » : le groupe s'ouvre quand on entre
   * dans sa branche et se referme quand on en sort. Un clic sur l'en-tete
   * force l'etat dans un sens ou dans l'autre, et la navigation suivante rend
   * la main a la route.
   *
   * Sans cela, l'en-tete d'un groupe repliable etait un titre mort : les
   * sous-entrees ne s'affichaient que si l'on etait deja dans la branche, donc
   * il n'existait aucun moyen d'y entrer depuis le menu.
   */
  const [force, setForce] = useState<boolean | null>(null);
  const [cheminPrecedent, setCheminPrecedent] = useState(pathname);
  if (cheminPrecedent !== pathname) {
    setCheminPrecedent(pathname);
    setForce(null);
  }

  const ouverte = force ?? surLaBranche;
  const valeur = entree.compteur ? compteurs[entree.compteur] : undefined;

  const contenu = (actif: boolean) => (
    <>
      <Icone nom={entree.icone} className={actif ? "text-accent" : "text-encre-tenue"} />
      <span className={`flex-1 ${actif ? "font-semibold text-accent" : "font-medium text-encre-moyenne"}`}>
        {entree.libelle}
      </span>
      {valeur !== undefined && valeur > 0 && <Pastille valeur={valeur} alerte={entree.compteurAlerte} />}
    </>
  );

  return (
    <>
      {entree.repliable ? (
        <button
          type="button"
          onClick={() => setForce(!ouverte)}
          aria-expanded={ouverte}
          className={`${LIGNE} mt-3 w-full cursor-pointer text-left hover:bg-surface-douce`}
        >
          <Icone
            nom={entree.icone}
            className={surLaBranche ? "text-accent" : "text-encre-tenue"}
          />
          <span className="flex-1 font-semibold text-encre">{entree.libelle}</span>
          <Icone
            nom={ouverte ? "chevronHaut" : "chevronBas"}
            taille={12}
            className="text-encre-tenue"
          />
        </button>
      ) : (
        <NavLink
          to={entree.chemin}
          end={entree.chemin === "/"}
          className={`${LIGNE} relative ${ouverte ? "bg-accent-voile" : "hover:bg-surface-douce"}`}
        >
          {ouverte && (
            <span className="absolute top-2 bottom-2 -left-3.5 w-[3px] rounded-none bg-accent" />
          )}
          {contenu(ouverte)}
        </NavLink>
      )}

      {ouverte &&
        sousEntrees.map((sous) => (
          <NavLink
            key={sous.chemin}
            to={sous.chemin}
            end
            className={({ isActive }) =>
              `${SOUS_LIGNE} ${
                isActive
                  ? "bg-surface-douce font-semibold text-encre-douce"
                  : "font-medium text-encre-moyenne hover:bg-surface-douce"
              }`
            }
          >
            {sous.libelle}
          </NavLink>
        ))}
    </>
  );
}

/** Encart du bas : le papier circule en parallele du logiciel. */
function CarteBordereau({ courriers, structures }: { courriers: number; structures: number }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-none bg-linear-[160deg,var(--color-accent-nuit)_0%,var(--color-accent)_100%] p-4">
      <div className="grid size-[26px] place-items-center rounded-none bg-white/[.18] text-white">
        <Icone nom="imprimante" taille={14} epaisseur={1.6} />
      </div>
      <div className="text-[13px] leading-[1.35] font-bold text-white">Bordereau du jour</div>
      <div className="text-[11.5px] leading-[1.5] font-medium text-white/70">
        {courriers} courriers à transmettre à {structures} structures. Le papier circule en parallèle.
      </div>
      <button
        type="button"
        className="mt-0.5 rounded-none bg-white py-2 text-center text-xs leading-none font-bold text-accent-fonce transition-opacity duration-150 hover:opacity-90"
      >
        Imprimer le bordereau
      </button>
    </div>
  );
}

export function BarreLaterale() {
  const session = useSession();
  const compteurs = useCompteurs();
  const peutTransmettre = usePermission(PERMISSIONS.TRANS);
  const groupes = filtrerMenu(session.permissions);

  return (
    <aside className="flex w-[238px] flex-none flex-col overflow-y-auto border-r border-bordure bg-surface px-3.5 pt-[18px] pb-4">
      <div className="flex items-center justify-between px-1.5 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="grid size-[22px] place-items-center rounded-none bg-accent">
            <div className="size-2 rotate-45 rounded-none bg-white" />
          </div>
          <span className="text-[15px] leading-none font-extrabold tracking-[-.2px] text-encre">
            Suivi Courrier
          </span>
        </div>
        <Icone nom="panneau" taille={15} epaisseur={1.4} className="text-encre-tenue" />
      </div>

      <nav className="flex flex-col gap-0.5">
        {groupes.map((groupe, i) => (
          <div key={i} className={`flex flex-col gap-0.5 ${i > 0 ? "mt-2" : ""}`}>
            {groupe.map((entree) => (
              <Entree key={entree.libelle} entree={entree} compteurs={compteurs} />
            ))}
          </div>
        ))}
      </nav>

      <div className="min-h-[18px] flex-1" />

      {peutTransmettre && <CarteBordereau courriers={12} structures={4} />}
    </aside>
  );
}
